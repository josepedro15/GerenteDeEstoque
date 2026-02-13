'use server';

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
    status: string;
}

export interface OrderProposal {
    supplierName: string;
    items: OrderProposalItem[];
    summary: string;
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
                    setAll(cookiesToSet: { name: string; value: string; options?: object }[]) { try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { } }
                }
            }
        );

        const { data: products, error } = await supabase
            .from('dados_estoque')
            .select('*')
            .eq('fornecedor_principal', supplierName);

        if (error) throw error;

        if (!products || products.length === 0) {
            return { success: false, error: "Nenhum produto encontrado para este fornecedor." };
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const candidates = products.filter((p: any) =>
            p.status_ruptura !== '🟢 Saudável' || Number(p.sugestao_compra_ajustada) > 0 || p.classe_abc === 'A'
        );

        if (candidates.length === 0) {
            return { success: false, error: "Nenhum produto precisando de reposição (Todos saudáveis)." };
        }

        const productList = candidates.map((p: { id_produto: string; produto_descricao: string; estoque_atual: number; custo: number; status_ruptura: string; sugestao_compra_ajustada: number; dias_de_cobertura: number }) =>
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const finalItems: OrderProposalItem[] = aiData.items.map((item: any) => {
            const original = products.find((p: { id_produto: string }) => String(p.id_produto) === String(item.productId));
            if (!original) return null;
            return {
                productId: item.productId,
                productName: (original as { produto_descricao: string }).produto_descricao,
                currentStock: Number((original as { estoque_atual: number }).estoque_atual),
                cost: Number((original as { custo: number }).custo),
                suggestedQuantity: item.suggestedQuantity,
                reason: item.reason,
                status: (original as { status_ruptura: string }).status_ruptura
            };
        }).filter((i: OrderProposalItem | null): i is OrderProposalItem => i !== null && i.suggestedQuantity > 0);

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
        const errorMessage = e instanceof Error ? e.message : typeof e === 'string' ? e : "Erro desconhecido";
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
                    setAll(cookiesToSet: { name: string; value: string; options?: object }[]) { try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { } }
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
                    setAll(cookiesToSet: { name: string; value: string; options?: object }[]) { try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { } }
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
                    setAll(cookiesToSet: { name: string; value: string; options?: object }[]) { try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { } }
                }
            }
        );

        const { data, error } = await supabase
            .from('order_history')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

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
