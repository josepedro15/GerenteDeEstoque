import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
// import { supabase } from '@/lib/supabase'; // Deprecated for this tool, we need admin access
import { tool } from 'ai';

const analyzeStockParameters = z.object({
    filterType: z.enum(['low_stock', 'category', 'specific_item', 'general', 'excess_promo']).describe(`
        Tipo de filtro a aplicar. ESCOLHA COM CUIDADO:
        - "excess_promo": USE quando o usuário pedir "produtos para promoção", "indique itens para liquidação", "o que posso colocar em promoção", "3 produtos para campanha". Retorna itens com EXCESSO ou alto estoque/baixo giro (ideais para promoção). CHAME ESTE PRIMEIRO, sem pedir permissão.
        - "specific_item": USE SEMPRE que o usuário perguntar sobre um PRODUTO ESPECÍFICO (ex: "cimento", "argamassa", "tubo"). 
          ⚠️ Se a pergunta contém um nome de produto, USE specific_item!
        - "low_stock": USE SOMENTE para perguntas genéricas de ruptura/falta (ex: "o que falta na loja toda?"). ⛔️ NÃO USE se o usuário estiver falando de um produto específico (ex: "tem cimento? qual comprar?"). Mantenha o contexto!
        - "category": Para filtrar por categoria de produto
        - "general": Para consultas gerais sem filtro
    `),
    filterValue: z.string().optional().describe(`
        O termo de busca. OBRIGATÓRIO para specific_item e category.
        Para specific_item: use o nome do produto (ex: "cimento", "argamassa", "tubo PVC")
        Para category: use o nome da categoria
    `),
});

// Helper to get admin client
function getAdminSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseServiceKey) {
        return createClient(supabaseUrl, supabaseServiceKey);
    }
    // Fallback to anon key if service key missing (might fail RLS but better than crash)
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(supabaseUrl, supabaseAnonKey);
}

export const tools = {
    analyzeStock: tool({
        description: `Buscar produtos no estoque.
PROMOÇÃO vs FALTA: Se o usuário pedir "produtos para promoção", "3 produtos para fazer uma promoção", "itens para liquidação" -> use SOMENTE filterType="excess_promo" (retorna itens em EXCESSO). NUNCA use "low_stock" para promoção — "low_stock" retorna itens em FALTA (Crítico/Ruptura).
Para produto específico (cimento, argamassa, tubo), use filterType="specific_item" e filterValue="nome do produto".
Use low_stock APENAS para "o que está em falta?", "o que repor?".`,
        parameters: analyzeStockParameters,
        execute: async ({ filterType, filterValue }: any) => {
            try {
                console.log(`[analyzeStock] Executing with filterType: ${filterType}, filterValue: ${filterValue}`);

                // Use Admin/Service client to bypass RLS for the AI Assistant
                const supabase = getAdminSupabase();

                let query = supabase
                    .from('dados_estoque')
                    .select('*');

                if (filterType === 'low_stock') {
                    // Query for items with status containing 'Ruptura' or 'Crítico' (flexible matching)
                    query = query.or('status_ruptura.ilike.%Ruptura%,status_ruptura.ilike.%Crítico%');
                } else if (filterType === 'excess_promo') {
                    // Promoção = itens em EXCESSO ou alta cobertura. NUNCA incluir Crítico/Ruptura (são itens em falta).
                    query = query
                        .not('status_ruptura', 'ilike', '%Crítico%')
                        .not('status_ruptura', 'ilike', '%Ruptura%')
                        .or('status_ruptura.ilike.%Excesso%,status_ruptura.ilike.%excesso%,dias_de_cobertura.gte.60')
                        .order('dias_de_cobertura', { ascending: false });
                } else if (filterType === 'category' && filterValue) {
                    // 'categoria' column does not exist in dados_estoque, searching in description as fallback
                    query = query.ilike('produto_descricao', `%${filterValue}%`);
                } else if (filterType === 'specific_item' && filterValue) {
                    query = query.ilike('produto_descricao', `%${filterValue}%`);
                }

                // Limit results to avoid token overflow, though "general" checks might be large.
                // 50 seems reasonable for a chat context.
                const { data, error } = await query.limit(50);

                if (error) {
                    console.error("[analyzeStock] Error fetching data:", error);
                    return { error: `Erro ao buscar dados do estoque: ${error.message}` };
                }

                if (!data || data.length === 0) {
                    return { filterType, message: "Nenhum item encontrado com os critérios fornecidos." };
                }

                // Para excess_promo: garantir que nenhum item Crítico/Ruptura vaze (segurança extra)
                let items = data.map(item => ({
                        id: item.id_produto, // SKU
                        produto: item.produto_descricao || `Produto ${item.id_produto}`,
                        quantidade: item.estoque_atual,
                        status: item.status_ruptura,
                        abc: item.classe_abc,
                        preco: item.preco,
                        // Detailed fields for AI context
                        custo: item.custo,
                        margem: item.margem_percentual,
                        lucro_60d: item.lucro_60d,
                        giro: item.giro_mensal,
                        dias_cobertura: item.dias_de_cobertura,
                        media_venda: item.media_diaria_venda,
                        sugestao_compra: item.sugestao_compra_60d,
                        tendencia: item.tendencia,
                        ultimo_venda: item.ultima_venda,
                        valor_estoque: item.valor_estoque_venda
                    }));
                if (filterType === 'excess_promo') {
                    const statusStr = (s: unknown) => (s != null ? String(s) : '');
                    items = items.filter((item: any) => {
                        const s = statusStr(item.status).toLowerCase();
                        return !s.includes('crítico') && !s.includes('ruptura');
                    });
                }
                return {
                    filterType,
                    count: items.length,
                    items
                };
            } catch (err: any) {
                console.error("[analyzeStock] CRITICAL EXCEPTION:", err);
                return { error: `Erro Crítico na ferramenta: ${err.message}` };
            }
        }
    } as any),

    generateMarketingCampaign: tool({
        description: `CRIA UMA CAMPANHA DE MARKETING REAL.
USE QUANDO:
- O usuário pedir "crie um anúncio", "faça uma promoção", "ajude a vender isso".
- Você detectar "Excesso" ou "Sem Giro" e o usuário aceitar a sugestão de campanha.
NÃO USE:
- Se o produto estiver em RUPTURA (não faz sentido anunciar o que não tem).`,
        parameters: z.object({
            productIds: z.array(z.string()).describe('Lista de IDs (SKUs) dos produtos para a campanha.'),
            objective: z.enum(['conversion', 'awareness', 'clearance']).optional().describe('Objetivo da campanha (ex: queima de estoque).')
        }),
        execute: async ({ productIds, objective }: { productIds?: string[], objective?: string }) => {
            try {
                const ids = Array.isArray(productIds) ? productIds : [];
                if (ids.length === 0) {
                    return { error: 'Nenhum produto selecionado. Indique os SKUs dos produtos (ex.: 3417, 4721, 15231) ou peça ao usuário para clicar em "Usar os 3 sugeridos" na mensagem anterior para ir à página de campanhas.' };
                }
                console.log(`[generateMarketingCampaign] Criando campanha para: ${ids.join(', ')}`);
                const { generateCampaign } = await import('@/app/actions/marketing');
                const result = await generateCampaign(ids, { context: objective || 'clearance' });
                return result;
            } catch (err: any) {
                console.error("[generateMarketingCampaign] Error:", err);
                return { error: `Erro ao criar campanha: ${err.message}` };
            }
        }
    } as any),

    calculatePurchaseNeeds: tool({
        description: `CALCULA SUGESTÃO DE COMPRA TÉCNICA.
USE QUANDO:
- O usuário perguntar "quanto comprar?", "fazer pedido", "sugestão de reposição".
- Você detectar "Ruptura" ou "Baixa Cobertura".`,
        parameters: z.object({
            sku: z.string().describe('SKU do produto principal.'),
            currentStock: z.number().describe('Estoque atual.'),
            monthlySales: z.number().describe('Venda média mensal (giro).'),
            leadTimeDays: z.number().default(7).describe('Tempo de entrega do fornecedor em dias.'),
            safetyStockDays: z.number().default(15).describe('Dias de margem de segurança desejada.')
        }),
        execute: async ({ sku, currentStock, monthlySales, leadTimeDays, safetyStockDays }: { sku: string, currentStock: number, monthlySales: number, leadTimeDays: number, safetyStockDays: number }) => {
            const dailySales = monthlySales / 30;
            const consumptionDuringLeadTime = dailySales * leadTimeDays;
            const safetyStockQty = dailySales * safetyStockDays;
            const orderPoint = consumptionDuringLeadTime + safetyStockQty;
            const suggestQty = Math.max(0, orderPoint - currentStock);

            return {
                sku,
                status: currentStock < orderPoint ? 'REPOR' : 'CONFORTÁVEL',
                calculation: {
                    dailySales: dailySales.toFixed(2),
                    leadTimeConsumption: consumptionDuringLeadTime.toFixed(1),
                    safetyStock: safetyStockQty.toFixed(1),
                    orderPoint: orderPoint.toFixed(1)
                },
                suggestedPurchaseQuantity: Math.ceil(suggestQty),
                urgency: currentStock === 0 ? 'CRÍTICA' : (currentStock < consumptionDuringLeadTime ? 'ALTA' : 'NORMAL')
            };
        }
    } as any)
};
