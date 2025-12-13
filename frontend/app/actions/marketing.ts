'use server';

import { supabase } from "@/lib/supabase";

// N8N Webhook URL provided by user
const N8N_WEBHOOK_URL = 'https://webhook.aiensed.com/webhook/estoque';

export interface ProductCandidate {
    id: string;
    name: string;
    stock: number;
    price: number;
    coverage: number;
}

export async function getExcessStockProducts(): Promise<ProductCandidate[]> {
    try {
        const { data, error } = await supabase
            .from('dados_estoque')
            .select('*')
            // Filter for 'DETALHE' type
            .eq('tipo_registro', 'DETALHE')
            // Order by highest coverage (Excess stock optimization)
            // Note: DB column is 'dias_de_cobertura' based on user screenshots
            .order('dias_de_cobertura', { ascending: false })
            .limit(50); // Fetch top 50 candidates

        if (error) throw error;
        if (!data) return [];

        return data.map((item: any) => ({
            id: item.id_produto, // matches DB 'id_produto'
            name: item.produto_descricao, // matches DB 'produto_descricao'
            stock: Number(item.estoque_atual || 0),
            price: Number(item.preco || 0), // matches DB 'preco'
            coverage: Number(item.dias_de_cobertura || 0) // matches DB 'dias_de_cobertura'
        }));

    } catch (e) {
        console.error("Error fetching excess stock:", e);
        return [];
    }
}

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ... keep interfaces ...

export async function generateCampaign(productIds: string[]) {
    console.log("🚀 Starting Campaign Generation for IDs:", productIds);

    try {
        // 0. Initialize Server Client for Auth
        const cookieStore = await cookies();

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // Ignored
                        }
                    },
                },
            }
        );

        // 0b. Get User Context safely
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || 'anonymous';
        console.log("👤 User ID (Server Auth):", userId);

        // 1. Fetch full product details (using the same server client is fine)
        const { data: products, error } = await supabase
            .from('dados_estoque')
            .select('*')
            // Match against 'id_produto' (SKU equivalent)
            .in('id_produto', productIds)
            .eq('tipo_registro', 'DETALHE');

        if (error) {
            console.error("❌ Database Error fetching products:", error);
            throw error;
        }

        if (!products || products.length === 0) {
            console.warn("⚠️ No products found for provided IDs");
            throw new Error("Produtos não encontrados");
        }

        console.log(`✅ Found ${products.length} products. preparing payload...`);

        // 2. Prepare Payload for AI
        const payload = {
            action: "generate_campaign",
            user_id: userId,
            products: products.map(p => ({
                sku: p.id_produto,
                name: p.produto_descricao,
                price: p.preco,
                stock: p.estoque_atual,
                coverage: p.dias_de_cobertura
            })),
            date: new Date().toISOString().split('T')[0],
            context: "Gerar campanha focada em conversão imediata (Excess Stock)."
        };

        console.log("📡 Sending Payload to N8N:", JSON.stringify(payload, null, 2));

        // 3. Send to N8N
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log(`📡 N8N Response Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const text = await response.text();
            console.error("❌ N8N Error Body:", text);
            throw new Error(`Erro no N8N: ${response.statusText}`);
        }

        const aiResult = await response.json();
        console.log("✅ N8N Success Response:", JSON.stringify(aiResult, null, 2));

        // 4. Return formatted result
        if (aiResult.channels) {
            return aiResult;
        } else {
            return {
                success: true,
                campaign: aiResult
            }
        }

    } catch (e) {
        console.error("❌ Campaign Generation Critical Error:", e);
        return {
            success: false,
            error: "Falha ao conectar com o Agente de Marketing."
        };
    }
}
