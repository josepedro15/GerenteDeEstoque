'use server';

import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getUpcomingSeasonality } from "@/lib/seasonality";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';

export interface OrderProposalItem {
    productId: string;
    productName: string;
    currentStock: number;
    cost: number;
    suggestedQuantity: number;
    reason: string;
    status: string; // 'Ruptura', 'Crítico', 'Atenção'
}

export interface OrderProposal {
    supplierName: string;
    items: OrderProposalItem[];
    summary: string; // AI generated summary/rationale
    totalCost: number;
}

export async function generateOrderProposal(supplierName: string, leadTimeDays: number = 7): Promise<{ success: boolean; data?: OrderProposal; error?: string }> {
    if (!GEMINI_API_KEY) {
        return { success: false, error: "GEMINI_API_KEY not configured." };
    }

    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cookiesToSet) { try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { } }
                }
            }
        );

        // 1. Fetch Supplier Products
        const { data: products, error } = await supabase
            .from('dados_estoque')
            .select('*')
            .eq('fornecedor_principal', supplierName);

        if (error) throw error;


        if (!products || products.length === 0) {
            return { success: false, error: "Nenhum produto encontrado para este fornecedor." };
        }

        // 2. Prepare Context for AI
        // Filter relevant products to reduce token usage (focus on issues)
        // But context needs to know everything to decide mix?
        // Let's send products with Status != 'Saudável' + Top sellers (A curve) even if healthy?
        // For simplicity, let's send items where sugestao_compra > 0 OR status is not OK.

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const candidates = products.filter((p: any) =>
            p.status_ruptura !== '🟢 Saudável' || Number(p.sugestao_compra_ajustada) > 0 || p.classe_abc === 'A'
        );



        if (candidates.length === 0) {
            return { success: false, error: "Nenhum produto precisando de reposição (Todos saudáveis)." };
        }

        const productList = candidates.map((p: any) =>
            `- ID: ${p.id_produto} | Name: ${p.produto_descricao} | Stock: ${p.estoque_atual} | Cost: ${p.custo} | Status: ${p.status_ruptura} | Algorithmic Suggestion: ${p.sugestao_compra_ajustada} | Coverage: ${p.dias_de_cobertura} days`
        ).join('\n');

        const seasonality = getUpcomingSeasonality();
        const seasonContext = seasonality.length > 0
            ? `Upcoming Seasonality: ${seasonality[0].name} in ${seasonality[0].daysUntil} days.`
            : "No major seasonality nearby.";

        const prompt = `
            You are an Expert Purchasing Manager. 
            Create a Purchase Order Proposal for supplier "${supplierName}".

            CONTEXT:
            ${seasonContext}
            
            GOAL:
            Optimize stock levels. prioritizing "Ruptura" (Out of Stock) and "Crítico" items.
            IMPORTANT: Supplier Lead Time is ${leadTimeDays} days. Ensure quantities cover at least this period + safety margin.
            Adjust quantities based on seasonality if relevant.
            
            PRODUCTS TO REVIEW:
            ${productList}

            OUTPUT JSON FORMAT:
            {
                "summary": "Short rationale in Portuguese about this order (e.g. 'Reposição de urgência focado em...').",
                "items": [
                    {
                        "productId": "String (ID from input)",
                        "suggestedQuantity": Number (Integer. If 0, omit from list),
                        "reason": "String (Short reason in Portuguese, e.g. 'Baixo estoque + Sazonalidade')"
                    }
                ]
            }
        `;

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });

        const text = result.response.text().replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const aiData = JSON.parse(text);

        // Merge AI result with product details
        const finalItems: OrderProposalItem[] = aiData.items.map((item: any) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            // IMPORTANT: Ensure ID types match (string vs number)
            const original = products.find((p: any) => String(p.id_produto) === String(item.productId));

            if (!original) return null;
            return {
                productId: item.productId,
                productName: original.produto_descricao,
                currentStock: Number(original.estoque_atual),
                cost: Number(original.custo),
                suggestedQuantity: item.suggestedQuantity,
                reason: item.reason,
                status: original.status_ruptura
            };
        }).filter((i: any) => i !== null && i.suggestedQuantity > 0);



        const totalCost = finalItems.reduce((acc, item) => acc + (item.cost * item.suggestedQuantity), 0);

        return {
            success: true,
            data: {
                supplierName,
                items: finalItems,
                summary: aiData.summary,
                totalCost
            }
        };

    } catch (e: unknown) {
        logger.error("Error generating order:", e);
        let errorMessage = "Erro desconhecido";
        if (e instanceof Error) {
            errorMessage = e.message;
        } else if (typeof e === 'object' && e !== null && 'message' in e) {
            errorMessage = String((e as { message: unknown }).message);
        } else if (typeof e === 'string') {
            errorMessage = e;
        } else {
            errorMessage = JSON.stringify(e);
        }
        return { success: false, error: errorMessage };
    }
}

export async function saveOrderProposal(proposal: OrderProposal, leadTime: number) {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cookiesToSet) { try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { } }
                }
            }
        );

        const { data, error } = await supabase
            .from('order_history')
            .insert({
                supplier_name: proposal.supplierName,
                total_value: proposal.totalCost,
                items_json: proposal,
                lead_time: leadTime
            })
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (e) {
        console.error("Error saving order:", e);
        return { success: false, error: "Falha ao salvar pedido." };
    }
}

export async function getOrderHistory() {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cookiesToSet) { try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { } }
                }
            }
        );

        const { data, error } = await supabase
            .from('order_history')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (e) {
        console.error("Error fetching history:", e);
        return { success: false, error: "Falha ao buscar histórico." };
    }
}

export async function getOrder(id: string) {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cookiesToSet) { try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { } }
                }
            }
        );

        const { data, error } = await supabase
            .from('order_history')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        // Return structured data for the editor
        return {
            success: true,
            data: {
                proposal: data.items_json as OrderProposal,
                meta: data
            }
        };
    } catch (e) {
        console.error("Error fetching order:", e);
        return { success: false, error: "Falha ao buscar pedido." };
    }
}
