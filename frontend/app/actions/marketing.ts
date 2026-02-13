'use server';

import { supabase } from "@/lib/supabase";
import { enforceRateLimit } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

// N8N Webhook URL - deve ser configurada via variável de ambiente
const N8N_WEBHOOK_URL = process.env.N8N_MARKETING_WEBHOOK_URL || '';

// Interface para dados do estoque do banco
interface EstoqueRow {
    id_produto: string;
    produto_descricao: string;
    estoque_atual: number | string;
    preco: number | string;
    dias_de_cobertura: number | string;
    media_diaria_venda?: number | string;
    custo?: number | string;
    margem_percentual?: number | string;
    classe_abc?: string;
    status_ruptura?: string;
    unidade_medida?: string;
    fornecedor?: string;
    categoria?: string;
}

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

        return (data as EstoqueRow[]).map((item) => ({
            id: item.id_produto, // matches DB 'id_produto'
            name: item.produto_descricao, // matches DB 'produto_descricao'
            stock: Number(item.estoque_atual || 0),
            price: Number(item.preco || 0), // matches DB 'preco'
            coverage: Number(item.dias_de_cobertura || 0) // matches DB 'dias_de_cobertura'
        }));

    } catch (e) {
        logger.error("Error fetching excess stock:", e);
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

    logger.info("Starting Campaign Generation for IDs:", productIds, { action, context });

    // Validar que a URL do webhook está configurada
    if (!N8N_WEBHOOK_URL) {
        logger.error("N8N_MARKETING_WEBHOOK_URL não configurada");
        return {
            success: false,
            error: "Configuração de marketing ausente. Verifique N8N_MARKETING_WEBHOOK_URL."
        };
    }

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
        logger.debug("User ID (Server Auth):", userId);

        // Apply rate limiting
        try {
            enforceRateLimit('marketing', userId);
        } catch (rateLimitError: any) {
            return {
                success: false,
                error: rateLimitError.message
            };
        }

        // 1. Fetch full product details (using the same server client is fine)
        const { data: products, error } = await supabase
            .from('dados_estoque')
            .select('*')
            // Match against 'id_produto' (SKU equivalent)
            .in('id_produto', productIds)
            .eq('tipo_registro', 'DETALHE');

        if (error) {
            logger.error("Database Error fetching products:", error);
            throw error;
        }

        if (!products || products.length === 0) {
            logger.warn("No products found for provided IDs");
            throw new Error("Produtos não encontrados");
        }

        logger.info(`Found ${products.length} products. preparing payload...`);

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

        logger.debug("Sending Payload to N8N:", JSON.stringify(payload, null, 2));

        // 3. Send to N8N
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        logger.debug(`N8N Response Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const text = await response.text();
            logger.error("N8N Error Body:", text);
            throw new Error(`Erro no N8N: ${response.statusText}`);
        }

        let aiResult = await response.json();
        logger.info("N8N Success Response received");

        // Handle N8N returning an array (common with 'All Incoming Items')
        if (Array.isArray(aiResult) && aiResult.length > 0) {
            logger.debug("N8N returned an array, using first item.");
            aiResult = aiResult[0];
        }

        // 4. Return formatted result
        if (aiResult.channels) {
            logger.debug("Instagram keys:", Object.keys(aiResult.channels.instagram || {}));
            logger.debug("Physical keys:", Object.keys(aiResult.channels.physical || {}));
            logger.debug("Instagram has image:", !!(aiResult.channels.instagram?.image || aiResult.channels.instagram?.imageBase64));
            return aiResult;
        } else {
            return {
                success: true,
                campaign: aiResult
            }
        }

    } catch (e) {
        logger.error("Campaign Generation Critical Error:", e);
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
    analise_dados?: {
        sugestao?: string;
        [key: string]: any;
    };
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
    logger.debug("saveCampaign called:", { userId, productsCount: products?.length, hasInstagramImg: !!instagramImageUrl, hasPhysicalImg: !!physicalImageUrl });

    if (!userId) {
        logger.error("userId não fornecido");
        return { success: false, error: "userId não fornecido" };
    }

    if (!products || products.length === 0) {
        logger.error("Nenhum produto fornecido");
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

        logger.debug("Salvando campanha...");

        const { data, error } = await supabase
            .from('campanhas_marketing')
            .insert(insertData)
            .select('id')
            .single();

        if (error) {
            logger.error("Erro Supabase ao salvar campanha:", error);
            return { success: false, error: error.message };
        }

        logger.info("Campanha salva com ID:", data?.id);
        return { success: true, id: data?.id };
    } catch (e: any) {
        logger.error("Erro ao salvar campanha:", e);
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
            logger.error("Erro ao buscar campanhas:", error);
            return [];
        }

        return data || [];
    } catch (e) {
        logger.error("Erro ao buscar campanhas:", e);
        return [];
    }
}

// Buscar todas as campanhas (para quando não tem user_id)
export async function getAllCampaigns(limit: number = 50): Promise<SavedCampaign[]> {
    logger.debug("getAllCampaigns called, limit:", limit);
    try {
        const { data, error } = await supabase
            .from('campanhas_marketing')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            logger.error("Erro ao buscar campanhas:", error);
            return [];
        }

        logger.debug("Campanhas encontradas:", data?.length || 0);
        return data || [];
    } catch (e) {
        logger.error("Erro ao buscar campanhas:", e);
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
            logger.error("Erro ao arquivar campanha:", error);
            return false;
        }

        return true;
    } catch (e) {
        logger.error("Erro ao arquivar campanha:", e);
        return false;
    }
}

// --- Tipos e funções para página Nova Campanha (marketing/new) ---
export interface CampaignStrategy {
    report: {
        title: string;
        hook: string;
        target_audience: string;
        coherence_analysis: string;
        mix_feedback: string;
    };
    pricing_strategy: {
        product_name: string;
        cost: number;
        original_price?: number;
        suggested_price: number;
        discount_percent: number;
        margin_percent: number;
        tactic: string;
    }[];
    dissemination_strategy?: {
        channels: string[];
        tactics: string[];
        budget_allocation?: { total_suggestion: number; allocations: { channel: string; percentage: number; rationale: string }[] };
        timeline: { day: string; title: string; description: string }[];
        estimated_reach?: string;
    };
    channels: {
        whatsapp: { script: string; trigger: string; script_options?: string[] };
        instagram: { copy: string; copy_options?: string[]; image_prompt: string; image_options?: { title: string; prompt: string }[] };
        physical: { headline: string; subheadline: string; offer: string; layout?: string; image_prompt: string; image_options?: { title: string; prompt: string }[] };
    };
}

export interface ProductCandidateMarketing {
    id: string;
    name: string;
    stock: number;
    price: number;
    cost?: number;
    coverage: number;
    abc: string;
    category?: string;
    status?: string;
    supplier?: string;
}

export async function getMarketingProducts(filters: { search?: string; curves?: string[]; categories?: string[]; minStock?: number; limit?: number; offset?: number; statuses?: string[]; trends?: string[] } = {}): Promise<ProductCandidateMarketing[]> {
    const { createServerClient } = await import("@supabase/ssr");
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (c: { name: string; value: string; options?: object }[]) => {
                    try { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { }
                }
            }
        }
    );
    let query = supabase.from('dados_estoque').select('*');
    if (filters.search) query = query.ilike('produto_descricao', `%${filters.search}%`);
    if (filters.curves?.length) query = query.in('classe_abc', filters.curves);
    if (filters.categories?.length) query = query.in('categoria', filters.categories);
    if (filters.minStock !== undefined) query = query.gte('estoque_atual', filters.minStock);
    if (filters.statuses?.length) query = query.in('status_ruptura', filters.statuses);
    if (filters.trends?.length) query = query.in('tendencia', filters.trends);
    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;
    query = query.range(offset, offset + limit - 1);
    const { data, error } = await query;
    if (error) { logger.error("getMarketingProducts:", error); return []; }
    return (data || []).map((item: Record<string, unknown>) => ({
        id: item.id_produto as string,
        name: item.produto_descricao as string,
        stock: Number(item.estoque_atual || 0),
        price: Number(item.preco || 0),
        cost: Number(item.custo || 0),
        coverage: Number(item.dias_de_cobertura || 0),
        abc: (item.classe_abc as string) || 'C',
        category: (item.categoria as string) || 'Geral',
        status: item.status_ruptura as string,
        supplier: item.fornecedor as string
    }));
}

/** Busca produtos por IDs (ex.: vindos do chat para criar campanha). */
export async function getMarketingProductsByIds(ids: string[]): Promise<ProductCandidateMarketing[]> {
    if (!ids?.length) return [];
    const { createServerClient } = await import("@supabase/ssr");
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (c: { name: string; value: string; options?: object }[]) => {
                    try { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { }
                }
            }
        }
    );
    const { data, error } = await supabase
        .from('dados_estoque')
        .select('*')
        .in('id_produto', ids);
    if (error) {
        logger.error("getMarketingProductsByIds:", error);
        return [];
    }
    return (data || []).map((item: Record<string, unknown>) => ({
        id: item.id_produto as string,
        name: item.produto_descricao as string,
        stock: Number(item.estoque_atual || 0),
        price: Number(item.preco || 0),
        cost: Number(item.custo || 0),
        coverage: Number(item.dias_de_cobertura || 0),
        abc: (item.classe_abc as string) || 'C',
        category: (item.categoria as string) || 'Geral',
        status: item.status_ruptura as string,
        supplier: item.fornecedor as string
    }));
}

export async function getCategories(): Promise<string[]> {
    const { createServerClient } = await import("@supabase/ssr");
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (c: { name: string; value: string; options?: object }[]) => {
                    try { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { }
                }
            }
        }
    );
    const { data } = await supabase.from('dados_estoque').select('categoria').not('categoria', 'is', null);
    const set = new Set((data || []).map((r: { categoria: string }) => r.categoria).filter(Boolean));
    return Array.from(set).sort();
}

export async function getBestCampaignCandidates(strategy: 'clearance' | 'attraction'): Promise<ProductCandidateMarketing[]> {
    const { createServerClient } = await import("@supabase/ssr");
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (c: { name: string; value: string; options?: object }[]) => {
                    try { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { }
                }
            }
        }
    );
    let query = supabase.from('dados_estoque').select('*');
    if (strategy === 'clearance') query = query.eq('classe_abc', 'C').order('estoque_atual', { ascending: false }).limit(5);
    else query = query.eq('classe_abc', 'A').gte('estoque_atual', 20).order('estoque_atual', { ascending: false }).limit(3);
    const { data, error } = await query;
    if (error) { logger.error("getBestCampaignCandidates:", error); return []; }
    return (data || []).map((item: Record<string, unknown>) => ({
        id: item.id_produto as string,
        name: item.produto_descricao as string,
        stock: Number(item.estoque_atual || 0),
        price: Number(item.preco || 0),
        cost: Number(item.custo || 0),
        coverage: Number(item.dias_de_cobertura || 0),
        abc: (item.classe_abc as string) || 'C',
        category: (item.categoria as string) || 'Geral',
        status: item.status_ruptura as string,
        supplier: item.fornecedor as string
    }));
}

export async function getFilterCounts(): Promise<Record<string, number>> {
    const { createServerClient } = await import("@supabase/ssr");
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (c: { name: string; value: string; options?: object }[]) => {
                    try { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { }
                }
            }
        }
    );
    const count = (col: string, val: string) => supabase.from('dados_estoque').select('*', { count: 'exact', head: true }).eq(col, val);
    const [rAll, rA, rB, rC, rEx, rSau, rAte, rCri, rCai, rSub, rEst] = await Promise.all([
        supabase.from('dados_estoque').select('*', { count: 'exact', head: true }),
        count('classe_abc', 'A'), count('classe_abc', 'B'), count('classe_abc', 'C'),
        count('status_ruptura', '⚪ Excesso'), count('status_ruptura', '🟢 Saudável'), count('status_ruptura', '🟡 Atenção'), count('status_ruptura', '🟠 Crítico'),
        count('tendencia', '📉 Caindo'), count('tendencia', '📈 Subindo'), count('tendencia', '➡️ Estável')
    ]);
    const getCount = (r: { count?: number | null }) => r?.count ?? 0;
    return {
        ALL: getCount(rAll as { count?: number | null }),
        A: getCount(rA as { count?: number | null }), B: getCount(rB as { count?: number | null }), C: getCount(rC as { count?: number | null }),
        EXCESSO: getCount(rEx as { count?: number | null }), SAUDAVEL: getCount(rSau as { count?: number | null }), ATENCAO: getCount(rAte as { count?: number | null }), CRITICO: getCount(rCri as { count?: number | null }),
        CAINDO: getCount(rCai as { count?: number | null }), SUBINDO: getCount(rSub as { count?: number | null }), ESTAVEL: getCount(rEst as { count?: number | null })
    };
}

export async function getCurrentUserId(): Promise<string | null> {
    const { createServerClient } = await import("@supabase/ssr");
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (c: { name: string; value: string; options?: object }[]) => {
                    try { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { }
                }
            }
        }
    );
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
}

export async function saveCampaignForCurrentUser(campaign: CampaignStrategy, products: { id: string; name: string; price?: number; stock?: number }[], instagramImageUrl?: string, physicalImageUrl?: string): Promise<{ success: boolean; id?: string; error?: string }> {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Usuário não autenticado." };
    return saveCampaign(userId, campaign, products, undefined, undefined, instagramImageUrl, physicalImageUrl);
}

export async function generateCampaignWithGemini(products: ProductCandidateMarketing[], context: string): Promise<{ success: boolean; data?: CampaignStrategy; error?: string }> {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const { getUpcomingSeasonality } = await import("@/lib/seasonality");
    const key = process.env.GEMINI_API_KEY;
    if (!key) return { success: false, error: "GEMINI_API_KEY não configurada." };
    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const events = getUpcomingSeasonality();
        let seasonalityText = "";
        if (events.length > 0) {
            const next = events[0];
            seasonalityText = `SEASONALITY: ${next.name} em ${next.daysUntil} dias. ${next.description}`;
        }
        const productList = products.map(p => `- ${p.name} (Curva ${p.abc}) | R$${p.price} | Estoque: ${p.stock}`).join('\n');
        const prompt = `You are a Senior Retail Marketing Strategist. CONTEXT: "${context}" ${seasonalityText} PRODUCTS: ${productList} Return ONLY valid JSON (no markdown). Structure: report: { title, hook, target_audience, coherence_analysis, mix_feedback }, pricing_strategy: [ { product_name, cost, original_price, suggested_price, discount_percent, margin_percent, tactic } ], dissemination_strategy: { channels[], tactics[], budget_allocation: { total_suggestion, allocations: [ { channel, percentage, rationale } ] }, timeline: [ { day, title, description } ], estimated_reach }, channels: { whatsapp: { script, script_options[], trigger }, instagram: { copy, copy_options[], image_prompt, image_options: [ { title, prompt } ] }, physical: { headline, subheadline, offer, layout, image_prompt, image_options: [ { title, prompt } ] } } }`;
        const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });
        let text = result.response.text().replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const data = JSON.parse(text) as CampaignStrategy;
        return { success: true, data };
    } catch (e) {
        logger.error("generateCampaignWithGemini:", e);
        return { success: false, error: e instanceof Error ? e.message : "Erro ao gerar campanha." };
    }
}
