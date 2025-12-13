'use server';

import { supabase } from "@/lib/supabase";

// N8N Webhook URL provided by user
const N8N_WEBHOOK_URL = 'https://webhook.aiensed.com/webhook/estoque';

export async function getMarketingOpportunities() {
    try {
        const { data, error } = await supabase
            .from('dados_estoque')
            .select('*')
            .eq('tipo_registro', 'DETALHE');

        if (error) throw error;
        if (!data) return [];

        // Logic to categorize items
        // 1. EXCESS: High count (e.g., > 100) or high value? Let's say coverage > 90 days.
        // 2. SEASONAL: Mock logic (random items) until we have sales history.
        // 3. NEW: Items with 'data_cadastro' recent? Schema doesn't have it clearly in 'dados_estoque', assume random for demo or low stock items as 'New Arrivals' logic?

        // For this MVP, we map based on simple heuristics from the 'status' or numeric fields

        const products = data.map((item: any) => ({
            id: item.sku, // database uses sku as identifier mostly
            name: item.produto_descricao || item.produto || item.sku,
            stock: Number(item.estoque_atual || 0),
            price: Number(item.preco_venda || 0),
            coverage: Number(item.cobertura_dias || 0)
        }));

        // Filter and Label
        interface Opportunity {
            id: string;
            name: string;
            reason: string;
            label: string;
            stock: number;
            price: number;
        }

        const opportunities: Opportunity[] = [];

        // Excess Logic: Coverage > 90 days
        const excessItems = products.filter(p => p.coverage > 90).slice(0, 3);
        excessItems.forEach(p => opportunities.push({
            id: p.id,
            name: p.name,
            reason: "EXCESS",
            label: `Excesso Crítico (${p.coverage.toFixed(0)} dias)`,
            stock: p.stock,
            price: p.price
        }));

        // Seasonal Logic: High Stock + High Price (Mock heuristic)
        const seasonalItems = products.filter(p => p.price > 100 && p.stock > 10).slice(0, 2);
        seasonalItems.forEach(p => opportunities.push({
            id: p.id,
            name: p.name,
            reason: "SEASONAL",
            label: "Alta Sazonalidade (Sugestão IA)",
            stock: p.stock,
            price: p.price
        }));

        // New Logic: Just pick some others
        const newItems = products.slice(10, 12);
        newItems.forEach(p => opportunities.push({
            id: p.id,
            name: p.name,
            reason: "NEW",
            label: "Lançamento / Destaque",
            stock: p.stock,
            price: p.price
        }));

        return opportunities;

    } catch (e) {
        console.error("Error fetching opportunities:", e);
        return [];
    }
}

export async function generateCampaign(productIds: string[]) {
    try {
        // 1. Fetch full product details
        const { data: products } = await supabase
            .from('dados_estoque')
            .select('*')
            .in('sku', productIds)
            .eq('tipo_registro', 'DETALHE');

        if (!products || products.length === 0) {
            throw new Error("Produtos não encontrados");
        }

        // 2. Prepare Payload for AI
        const payload = {
            action: "generate_campaign",
            products: products.map(p => ({
                sku: p.sku,
                name: p.produto_descricao || p.produto,
                price: p.preco_venda,
                stock: p.estoque_atual,
                coverage: p.cobertura_dias
            })),
            date: new Date().toISOString().split('T')[0],
            context: "Gerar campanha focada em conversão imediata."
        };

        // 3. Send to N8N
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Erro no N8N: ${response.statusText}`);
        }

        const aiResult = await response.json();

        // 4. Return formatted result
        // Expected format from N8N matching our UI:
        // { success: true, channels: { instagram: {...}, whatsapp: {...}, physical: {...} } }

        // Ensure structure even if N8N returns raw text (defensive coding)
        if (aiResult.channels) {
            return aiResult;
        } else {
            // Fallback if AI returns unstructured data
            return {
                success: true,
                campaign: aiResult // Pass through whatever we got
            }
        }

    } catch (e) {
        console.error("Campaign Generation Error:", e);
        return {
            success: false,
            error: "Falha ao conectar com o Agente de Marketing."
        };
    }
}
