'use server';

import { supabase } from "@/lib/supabase";

// N8N Webhook URL - deve ser configurada via variável de ambiente
const N8N_WEBHOOK_URL = process.env.N8N_MARKETING_WEBHOOK_URL || '';

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

// Bucket name for campaign images
const STORAGE_BUCKET = 'campaign-images';

// Upload base64 image to Supabase Storage
async function uploadBase64ToStorage(
    base64Data: string,
    fileName: string
): Promise<string | null> {
    try {
        // Remove data URL prefix if present
        let base64Content = base64Data;
        if (base64Data.includes(',')) {
            base64Content = base64Data.split(',')[1];
        }

        // Convert base64 to Uint8Array
        const binaryString = atob(base64Content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(fileName, bytes, {
                contentType: 'image/png',
                upsert: true
            });

        if (error) {
            console.error("❌ Erro upload Storage:", error);
            return null;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(fileName);

        console.log("✅ Imagem uploaded:", urlData.publicUrl);
        return urlData.publicUrl;
    } catch (e) {
        console.error("❌ Erro ao processar imagem:", e);
        return null;
    }
}

// ... keep interfaces ...

interface GenerateCampaignOptions {
    action?: string;
    context?: string;
}

export async function generateCampaign(productIds: string[], options?: GenerateCampaignOptions) {
    const action = options?.action || 'generate_campaign';
    const context = options?.context || 'Gerar campanha focada em conversão imediata (Excess Stock).';

    console.log("🚀 Starting Campaign Generation for IDs:", productIds, { action, context });

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

        // 2. Prepare Payload for AI - Enviar TODOS os dados do produto para análise completa
        const payload = {
            action: action,
            user_id: userId,
            products: products.map(p => ({
                // Identificadores
                sku: p.id_produto,
                name: p.produto_descricao,
                // Estoque e cobertura
                stock: p.estoque_atual,
                coverage: p.dias_de_cobertura,
                daily_sales: p.media_diaria_venda,
                // Financeiro
                price: p.preco,
                cost: p.custo,
                margin: p.margem_percentual,
                // Classificação ABC - ESSENCIAL para validar mix
                abc_curve: p.classe_abc,
                status: p.status_ruptura,
                // Dados adicionais úteis
                unit: p.unidade_medida,
                supplier: p.fornecedor,
                category: p.categoria
            })),
            date: new Date().toISOString().split('T')[0],
            context: context
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

        let aiResult = await response.json();
        console.log("✅ N8N Success Response:", JSON.stringify(aiResult, null, 2));

        // Handle N8N returning an array (common with 'All Incoming Items')
        if (Array.isArray(aiResult) && aiResult.length > 0) {
            console.log("⚠️ N8N returned an array, using first item.");
            aiResult = aiResult[0];
        }

        // 4. Return formatted result
        if (aiResult.channels) {
            console.log("🔑 Keys do Instagram:", Object.keys(aiResult.channels.instagram || {}));
            console.log("🔑 Keys do Physical:", Object.keys(aiResult.channels.physical || {}));
            console.log("🖼️ Instagram tem imagem?", !!(aiResult.channels.instagram?.image || aiResult.channels.instagram?.imageBase64));
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

// Interface para campanha salva
export interface SavedCampaign {
    id: string;
    user_id: string;
    created_at: string;
    produtos: any[];
    instagram_copy: string | null;
    instagram_image_prompt: string | null;
    instagram_image_url?: string | null;
    whatsapp_script: string | null;
    whatsapp_trigger: string | null;
    physical_headline: string | null;
    physical_subheadline: string | null;
    physical_offer: string | null;
    physical_image_url?: string | null;
    status: string;
}

// Salvar campanha no banco (recebe URLs de imagens já upadas do cliente)
export async function saveCampaign(
    userId: string,
    campaign: any,
    products: any[],
    _unused1?: string, // mantido para compatibilidade
    _unused2?: string, // mantido para compatibilidade
    instagramImageUrl?: string,
    physicalImageUrl?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
    console.log("📝 saveCampaign chamado:", { userId, productsCount: products?.length, hasInstagramImg: !!instagramImageUrl, hasPhysicalImg: !!physicalImageUrl });

    if (!userId) {
        console.error("❌ userId não fornecido");
        return { success: false, error: "userId não fornecido" };
    }

    if (!products || products.length === 0) {
        console.error("❌ Nenhum produto fornecido");
        return { success: false, error: "Nenhum produto fornecido" };
    }

    try {
        // Preparar dados para inserção
        const insertData: any = {
            user_id: userId,
            produtos: products.slice(0, 10).map((p: any) => ({
                id: String(p.id || p.codigo_produto || '').substring(0, 50),
                nome: String(p.nome || p.nome_produto || '').substring(0, 200),
                preco: Number(p.preco) || 0,
                estoque: Number(p.estoque || p.estoque_atual) || 0
            })),
            instagram_copy: (campaign?.channels?.instagram?.copy || '').substring(0, 5000) || null,
            instagram_image_prompt: (campaign?.channels?.instagram?.imagePrompt || '').substring(0, 1000) || null,
            whatsapp_script: (campaign?.channels?.whatsapp?.script || '').substring(0, 5000) || null,
            whatsapp_trigger: (campaign?.channels?.whatsapp?.trigger || '').substring(0, 200) || null,
            physical_headline: (campaign?.channels?.physical?.headline || '').substring(0, 200) || null,
            physical_subheadline: (campaign?.channels?.physical?.subheadline || '').substring(0, 500) || null,
            physical_offer: (campaign?.channels?.physical?.offer || '').substring(0, 500) || null,
            status: 'active'
        };

        // Adicionar URLs de imagens se existirem
        if (instagramImageUrl) {
            insertData.instagram_image_url = instagramImageUrl;
        }
        if (physicalImageUrl) {
            insertData.physical_image_url = physicalImageUrl;
        }

        console.log("📝 Salvando campanha...");

        const { data, error } = await supabase
            .from('campanhas_marketing')
            .insert(insertData)
            .select('id')
            .single();

        if (error) {
            console.error("❌ Erro Supabase ao salvar campanha:", error);
            return { success: false, error: error.message };
        }

        console.log("✅ Campanha salva com ID:", data?.id);
        return { success: true, id: data?.id };
    } catch (e: any) {
        console.error("❌ Erro ao salvar campanha:", e);
        return { success: false, error: e.message };
    }
}

// Buscar histórico de campanhas
export async function getCampaignHistory(
    userId: string,
    limit: number = 20
): Promise<SavedCampaign[]> {
    try {
        const { data, error } = await supabase
            .from('campanhas_marketing')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error("Erro ao buscar campanhas:", error);
            return [];
        }

        return data || [];
    } catch (e) {
        console.error("Erro ao buscar campanhas:", e);
        return [];
    }
}

// Buscar todas as campanhas (para quando não tem user_id)
export async function getAllCampaigns(limit: number = 50): Promise<SavedCampaign[]> {
    console.log("📋 getAllCampaigns chamado, limit:", limit);
    try {
        const { data, error } = await supabase
            .from('campanhas_marketing')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error("❌ Erro ao buscar campanhas:", error);
            return [];
        }

        console.log("✅ Campanhas encontradas:", data?.length || 0);
        return data || [];
    } catch (e) {
        console.error("❌ Erro ao buscar campanhas:", e);
        return [];
    }
}

// Deletar (arquivar) campanha
export async function deleteCampaign(campaignId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('campanhas_marketing')
            .update({ status: 'archived' })
            .eq('id', campaignId);

        if (error) {
            console.error("Erro ao arquivar campanha:", error);
            return false;
        }

        return true;
    } catch (e) {
        console.error("Erro ao arquivar campanha:", e);
        return false;
    }
}
