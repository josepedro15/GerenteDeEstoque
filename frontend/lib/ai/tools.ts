import { z } from 'zod';
import { supabase } from '../supabase';
import { tool } from 'ai';

// Helper to format stock data for context
function formatStockData(products: any[]) {
    if (!products || products.length === 0) return "Nenhum produto encontrado com esses critérios.";
    return products.map(p => {
        const custo = p.custo || 0;
        const sugestao = p.sugestao_compra_ajustada || 0;
        const totalPedido = custo * sugestao;
        return `- ${p.produto_descricao} (ID: ${p.id_produto}): Estoque ${p.estoque_atual}, Sugestão Compra: ${sugestao}, Custo Unit.: R$${custo.toFixed(2)}, Venda: R$${(p.preco || 0).toFixed(2)}, Total Pedido: R$${totalPedido.toFixed(2)}, Status: ${p.status_ruptura}`;
    }).join('\n');
}

const analyzeStockParameters = z.object({
    query: z.string().describe('The search term for the product (name or SKU) or category. If analyzing multiple products (like "purchase analysis"), leave empty or use a broad term.'),
    filter: z.enum(['all', 'low_stock', 'out_of_stock']).optional().describe('Optional filter for stock status. Use "low_stock" for purchase analysis.'),
});

const generateMarketingCampaignParameters = z.object({
    theme: z.string().describe('The campaign theme or occasion (e.g., Mother\'s Day, Black Friday, Winter Clearance).'),
    focusProducts: z.string().optional().describe('Specific products to focus on, if any.'),
    goal: z.string().optional().describe('The primary goal (e.g., clear inventory, increase revenue, brand awareness).'),
});

const generateInstagramContentParameters = z.object({
    context: z.string().describe('The context or topic of the post (e.g., the campaign details, product features).'),
    tone: z.string().optional().default('exciting').describe('The tone of the caption (e.g., urgent, friendly, luxury).'),
});

const generateCRMMessageParameters = z.object({
    offer: z.string().describe('The main offer or message content.'),
    segment: z.string().optional().describe('Target audience segment (e.g., loyal customers, churned).'),
});

export const tools = {
    analyzeStock: tool({
        description: 'Analyze stock levels for specific products or categories. Use this when the user asks about product availability, quantity, or general stock status.',
        parameters: analyzeStockParameters,
        execute: async ({ query, filter }: z.infer<typeof analyzeStockParameters>) => {
            try {
                console.log("TOOL: analyzeStock - Querying dados_estoque for:", query || 'ALL', "Filter:", filter);

                let dbQuery = supabase
                    .from('dados_estoque')
                    .select('id_produto, produto_descricao, estoque_atual, preco, custo, status_ruptura, classe_abc, prioridade_compra, sugestao_compra_ajustada');

                // Apply text search if query is provided
                const safeQuery = query || '';
                const numericMatches = safeQuery.match(/\d+/g);
                const isNumericList = numericMatches && numericMatches.length > 0 && safeQuery.replace(/[\d\s,\.\-]/g, '').replace(/sku|id/gi, '').trim().length === 0;

                if (isNumericList && numericMatches) {
                    console.log("TOOL: analyzeStock - Detected SKU list search:", numericMatches);
                    dbQuery = dbQuery.in('id_produto', numericMatches);
                } else if (safeQuery && safeQuery.trim() !== '') {
                    // Text search (for names or mixed content)
                    // Split query into terms only if it's not a numeric list
                    if (!isNaN(Number(safeQuery))) {
                        // Single ID search fallback (redundant with isNumericList usually, but safe)
                        dbQuery = dbQuery.or(`produto_descricao.ilike.%${safeQuery}%,id_produto.eq.${safeQuery}`);
                    } else {
                        // Standard text search
                        dbQuery = dbQuery.ilike('produto_descricao', `%${safeQuery}%`);
                    }
                }

                if (filter === 'low_stock') {
                    // Filter for "Ruptura" or "Crítico" status - Adjust based on actual data values from user input
                    // Using .or syntax for multiple conditions
                    dbQuery = dbQuery.or('status_ruptura.ilike.%Ruptura%,status_ruptura.ilike.%Crítico%');
                } else if (filter === 'out_of_stock') {
                    dbQuery = dbQuery.eq('estoque_atual', 0);
                }

                // Limit results to avoid overwhelming context, but allow enough for analysis
                const { data, error } = await dbQuery.limit(20);

                if (error) {
                    console.error("Stock Tool Error:", error);
                    return `Error querying stock: ${error.message}`;
                }

                return formatStockData(data);
            } catch (e: any) {
                return `Unexpected error: ${e.message}`;
            }
        },
    } as any),
    generateMarketingCampaign: tool({
        description: 'Generate a strategic marketing campaign plan. Use this when the user asks to create a campaign, promotion, or sales strategy.',
        parameters: generateMarketingCampaignParameters,
        execute: async ({ theme, focusProducts, goal }: z.infer<typeof generateMarketingCampaignParameters>) => {
            return {
                status: "ready_for_generation",
                context: `Campaign Theme: ${theme}. Focus: ${focusProducts || 'General'}. Goal: ${goal || 'Sales'}.`
            };
        },
    } as any),
    generateInstagramContent: tool({
        description: 'Generate an Instagram post caption and image idea. call this AFTER a campaign has been discussed or when explicitly asked.',
        parameters: generateInstagramContentParameters,
        execute: async ({ context, tone }: z.infer<typeof generateInstagramContentParameters>) => {
            return {
                action: "generate_instagram",
                params: { context, tone }
            };
        },
    } as any),
    generateCRMMessage: tool({
        description: 'Generate a WhatsApp/CRM message for customers. Use this for direct messages, broadcast lists, or recovery messages.',
        parameters: generateCRMMessageParameters,
        execute: async ({ offer, segment }: z.infer<typeof generateCRMMessageParameters>) => {
            return {
                action: "generate_whatsapp",
                params: { offer, segment }
            };
        },
    } as any)
};
