'use server';

import { supabase } from "@/lib/supabase";

import { logger } from "@/lib/logger";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// --- TYPES ---

export interface ProductCandidate {
    id: string;
    name: string;
    stock: number;
    price: number;
    cost?: number;
    coverage: number;
    abc: string; // 'A', 'B', 'C'
    category?: string;
    status?: string;
    supplier?: string;
}

export interface SavedCampaign {
    id: string;
    created_at: string;
    produtos: any[];
    instagram_copy?: string;
    instagram_image_prompt?: string;
    whatsapp_script?: string;
    whatsapp_trigger?: string;
    physical_headline?: string;
    physical_subheadline?: string;
    physical_offer?: string;
    analise_dados?: any;
    campaign_data?: CampaignStrategy; // New JSONB column
    status?: string;
}

interface MarketingFilters {
    search?: string;
    curves?: string[]; // ['A', 'B', 'C']
    categories?: string[];
    minStock?: number;
    limit?: number;
    offset?: number;
    statuses?: string[];
    trends?: string[];
}

export async function getMarketingProducts(filters: MarketingFilters = {}): Promise<ProductCandidate[]> {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                    } catch { }
                },
            },
        }
    );

    let query = supabase
        .from('dados_estoque')
        .select('*');

    const { count } = await supabase.from('dados_estoque').select('*', { count: 'exact', head: true });
    console.log("DEBUG: Total items in dados_estoque:", count);

    if (filters.search) {
        query = query.ilike('produto_descricao', `%${filters.search}%`);
    }

    if (filters.curves && filters.curves.length > 0) {
        query = query.in('classe_abc', filters.curves);
    }

    if (filters.categories && filters.categories.length > 0) {
        query = query.in('categoria', filters.categories);
    }

    if (filters.minStock !== undefined) {
        query = query.gte('estoque_atual', filters.minStock);
    }

    if (filters.statuses && filters.statuses.length > 0) {
        query = query.in('status_ruptura', filters.statuses);
    }

    if (filters.trends && filters.trends.length > 0) {
        query = query.in('tendencia', filters.trends);
    }

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    query = query.range(offset, offset + limit - 1); // Supabase range is inclusive

    const { data, error } = await query;

    const { data: allStatuses } = await supabase
        .from('dados_estoque')
        .select('status_ruptura')
        .not('status_ruptura', 'is', null);

    if (allStatuses) {
        // Log distinct values to debug
        const distinct = Array.from(new Set(allStatuses.map((i: any) => i.status_ruptura)));
        console.log(">>> DISTINCT STATUSES IN DB:", distinct);
    }

    if (error) {
        logger.error("Error fetching marketing products:", error);
        return [];
    }

    const mappedProducts = (data || []).map((item: any) => ({
        id: item.id_produto,
        name: item.produto_descricao,
        stock: Number(item.estoque_atual || 0),
        price: Number(item.preco || 0),
        cost: Number(item.custo || 0),
        coverage: Number(item.dias_de_cobertura || 0),
        abc: item.classe_abc || 'C',
        category: item.categoria || 'Geral',
        status: item.status_ruptura,
        supplier: item.fornecedor
    }));

    return mappedProducts;
}

export async function getBestCampaignCandidates(strategy: 'clearance' | 'attraction'): Promise<ProductCandidate[]> {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                    } catch { }
                },
            },
        }
    );

    let query = supabase.from('dados_estoque').select('*');

    if (strategy === 'clearance') {
        // Curve C, Highest Stock
        query = query.eq('classe_abc', 'C').order('estoque_atual', { ascending: false }).limit(5);
    } else {
        // Curve A, Healthy Stock (e.g., > 20)
        query = query.eq('classe_abc', 'A').gte('estoque_atual', 20).order('estoque_atual', { ascending: false }).limit(3);
    }

    const { data, error } = await query;

    if (error) {
        logger.error(`Error fetching best candidates for ${strategy}:`, error);
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((item: any) => ({
        id: item.id_produto,
        name: item.produto_descricao,
        stock: Number(item.estoque_atual || 0),
        price: Number(item.preco || 0),
        cost: Number(item.custo || 0),
        coverage: Number(item.dias_de_cobertura || 0),
        abc: item.classe_abc || 'C',
        category: item.categoria || 'Geral',
        status: item.status_ruptura,
        supplier: item.fornecedor
    }));
}

export async function getFilterCounts() {
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

    const countQuery = (col: string, val: string) =>
        supabase.from('dados_estoque').select('*', { count: 'exact', head: true }).eq(col, val);

    const [
        { count: all },
        { count: a }, { count: b }, { count: c },
        { count: excesso }, { count: saudavel }, { count: atencao }, { count: critico },
        { count: caindo }, { count: subindo }, { count: estavel }
    ] = await Promise.all([
        supabase.from('dados_estoque').select('*', { count: 'exact', head: true }),
        countQuery('classe_abc', 'A'), countQuery('classe_abc', 'B'), countQuery('classe_abc', 'C'),
        countQuery('status_ruptura', '⚪ Excesso'), countQuery('status_ruptura', '🟢 Saudável'), countQuery('status_ruptura', '🟡 Atenção'), countQuery('status_ruptura', '🟠 Crítico'),
        countQuery('tendencia', '📉 Caindo'), countQuery('tendencia', '📈 Subindo'), countQuery('tendencia', '➡️ Estável')
    ]);

    return {
        ALL: all || 0,
        A: a || 0, B: b || 0, C: c || 0,
        EXCESSO: excesso || 0, SAUDAVEL: saudavel || 0, ATENCAO: atencao || 0, CRITICO: critico || 0,
        CAINDO: caindo || 0, SUBINDO: subindo || 0, ESTAVEL: estavel || 0
    };
}

export interface CampaignStrategy {
    report: {
        title: string;
        hook: string;
        target_audience: string;
        coherence_analysis: string;
        mix_feedback: string; // E.g., "Good mix of A and C"
    };
    pricing_strategy: {
        product_name: string;
        cost: number;
        original_price: number;
        suggested_price: number;
        discount_percent: number;
        margin_percent: number;
        tactic: string; // "Loss Leader", "Profit Driver", etc.
    }[];
    dissemination_strategy: {
        channels: string[]; // e.g. ["Instagram Ads", "WhatsApp Blast", "Radio"]
        tactics: string[]; // e.g. ["Carrossel de Ofertas", "Lista de Transmissão VIP"]
        budget_allocation?: {
            total_suggestion: number;
            allocations: { channel: string; percentage: number; rationale: string }[];
        };
        timeline: { day: string; title: string; description: string }[];
        estimated_reach?: string; // e.g. "10k - 15k people"
    };
    channels: {
        whatsapp: { script: string; trigger: string; script_options?: string[] };
        instagram: {
            copy: string;
            copy_options?: string[];
            image_prompt: string;
            image_options?: { title: string; prompt: string }[];
        };
        physical: {
            headline: string;
            subheadline: string;
            offer: string;
            layout: string;
            image_prompt: string;
            image_options?: { title: string; prompt: string }[];
        };
    };
}

// --- GEMINI AI INTEGRATION ---

import { getUpcomingSeasonality } from "@/lib/seasonality";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';

// ... existing imports

export async function generateCampaignWithGemini(
    products: ProductCandidate[],
    context: string
): Promise<{ success: boolean; data?: CampaignStrategy; error?: string }> {

    if (!GEMINI_API_KEY) {
        return { success: false, error: "GEMINI_API_KEY not configured." };
    }

    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        // Using gemini-2.0-flash as it is fast and supports JSON output well
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        // Calculate Seasonality
        const upcomingEvents = getUpcomingSeasonality();
        let seasonalityText = "";
        if (upcomingEvents.length > 0) {
            const nextEvent = upcomingEvents[0];
            const otherEvents = upcomingEvents.slice(1, 3).map(e => `${e.name} em ${e.daysUntil} dias`).join(", ");
            seasonalityText = `
            SEASONALITY ALERTS:
            - PRIMARY EVENT: ${nextEvent.name} is coming in ${nextEvent.daysUntil} days. (${nextEvent.description})
            ${otherEvents ? `- WATCH OUT FOR: ${otherEvents}` : ""}
            - INSTRUCTION: Use this seasonality to frame the campaign hook, visuals, and urgency if relevant. If context is generic, pivot to this event.
            `;
        }

        // Construct Prompt
        const productList = products.map(p =>
            `- ${p.name} (Curve ${p.abc}) | Price: R$${p.price} | Stock: ${p.stock}`
        ).join('\n');

        const prompt = `
              You are a Senior Retail Marketing Strategist for a Construction Material Store.
              Your goal is to create a high-conversion sales campaign.
  
              CONTEXT: "${context}"
              ${seasonalityText}
  
              PRODUCTS:
  
              PRODUCTS:
              ${productList}
  
              OUTPUT FORMAT:
              Return ONLY a valid raw JSON object. Do not include markdown formatting (like \`\`\`json).
              The JSON must match this structure:
              {
                  "report": {
                      "title": "String (Portuguese)",
                      "hook": "String (Portuguese)",
                      "target_audience": "String (Portuguese)",
                      "coherence_analysis": "String (Portuguese)",
                      "mix_feedback": "String (Portuguese)"
                  },
                  "pricing_strategy": [
                      {
                          "product_name": "String",
                          "cost": Number,
                          "original_price": Number,
                          "suggested_price": Number,
                          "discount_percent": Number,
                          "margin_percent": Number,
                          "tactic": "String (e.g., 'Loss Leader', 'Traffic Driver', 'Margin Builder')"
                      }
                  ],
                  "dissemination_strategy": {
                      "channels": ["String", "String"],
                      "tactics": ["String", "String"],
                      "budget_allocation": {
                          "total_suggestion": Number,
                          "allocations": [
                              { "channel": "String (e.g. 'Meta Ads', 'Impressão')", "percentage": Number, "rationale": "String" }
                          ]
                      },
                      "timeline": [
                          { "day": "String (e.g. 'Dia 1')", "title": "String (Action)", "description": "String (Details)" }
                      ],
                      "estimated_reach": "String (e.g. '10.000 - 15.000 pessoas')"
                  },
                  "channels": {
                      "whatsapp": { 
                          "script": "String (Portuguese). Best option.", 
                          "script_options": ["String (Option 1)", "String (Option 2)", "String (Option 3)"],
                          "trigger": "String" 
                      },
                      "instagram": { 
                          "copy": "String (Portuguese). Best option.",
                          "copy_options": ["String (Option 1)", "String (Option 2)", "String (Option 3)"],
                          "image_prompt": "String (ENGLISH)",
                          "image_options": [
                              { "title": "Concept 1 Title", "prompt": "String (ENGLISH) - Detail 1" },
                              { "title": "Concept 2 Title", "prompt": "String (ENGLISH) - Detail 2" },
                              { "title": "Concept 3 Title", "prompt": "String (ENGLISH) - Detail 3" }
                          ]
                      },
                      "physical": { 
                          "headline": "String", "subheadline": "String", "offer": "String", "layout": "String",
                          "image_prompt": "String (ENGLISH)",
                          "image_options": [
                               { "title": "Concept 1 Title", "prompt": "String (ENGLISH)" },
                               { "title": "Concept 2 Title", "prompt": "String (ENGLISH)" },
                               { "title": "Concept 3 Title", "prompt": "String (ENGLISH)" }
                          ]
                      }
                  }
              }
          `;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
            // REMOVED JSON MODE enforcement to allow broader model support
        });

        let text = result.response.text();

        // Clean Markdown if present
        text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').replace(/^JSON/i, '').trim();

        const data = JSON.parse(text) as CampaignStrategy;

        return { success: true, data };

    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        logger.error("Gemini Generation Error:", e);
        return { success: false, error: "Failed to generate campaign strategy: " + errorMessage };
    }
}

// --- DATABASE ACTIONS (Legacy Support + New) ---

// Salvar campanha no banco
export async function saveCampaign(
    userId: string,
    campaignData: Partial<CampaignStrategy>,
    products: ProductCandidate[],
    context?: string,
    model?: string,
    instagramImageUrl?: string,
    physicalImageUrl?: string
): Promise<{ success: boolean; id?: string; error?: string }> {

    try {
        const cookieStore = await cookies();

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                        } catch { }
                    },
                },
            }
        );

        const insertData = {
            user_id: userId,
            produtos: products.map(p => ({
                id: p.id,
                nome: p.name,
                preco: p.price,
                estoque: p.stock
            })),
            instagram_copy: campaignData.channels?.instagram?.copy,
            instagram_image_prompt: campaignData.channels?.instagram?.image_prompt,
            instagram_image_url: instagramImageUrl,
            whatsapp_script: campaignData.channels?.whatsapp?.script,
            whatsapp_trigger: campaignData.channels?.whatsapp?.trigger,
            physical_headline: campaignData.channels?.physical?.headline,
            physical_subheadline: campaignData.channels?.physical?.subheadline,
            physical_offer: campaignData.channels?.physical?.offer,
            physical_image_url: physicalImageUrl,
            status: 'active',
            analise_dados: campaignData.report, // Keep backward compatibility for now
            campaign_data: campaignData // Save full strategy JSON
        };

        const { data, error } = await supabase
            .from('campanhas_marketing')
            .insert(insertData)
            .select('id')
            .single();

        if (error) throw error;

        return { success: true, id: data.id };
    } catch (e: any) {
        logger.error("Error saving campaign:", e);
        const errorMessage = typeof e === 'object' && e !== null ? JSON.stringify(e) : String(e);
        return { success: false, error: errorMessage };
    }
}

export async function getAllCampaigns(limit: number = 50): Promise<SavedCampaign[]> {
    const cookieStore = await cookies();
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        cookies: {
            getAll() { return cookieStore.getAll() },
            setAll(cookiesToSet) { try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { } }
        }
    });

    const { data, error } = await supabase
        .from('campanhas_marketing')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Error fetching campaigns:", error);
        return [];
    }

    return data as SavedCampaign[];
}

export async function getPublicCampaign(id: string): Promise<SavedCampaign | null> {
    const cookieStore = await cookies();
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        cookies: {
            getAll() { return cookieStore.getAll() },
            setAll(cookiesToSet) { try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { } }
        }
    });

    const { data, error } = await supabase
        .from('campanhas_marketing')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error("Error fetching public campaign:", error);
        return null;
    }

    return data as SavedCampaign;
}

export async function deleteCampaign(id: string): Promise<boolean> {
    const cookieStore = await cookies();
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        cookies: {
            getAll() { return cookieStore.getAll() },
            setAll(cookiesToSet) { try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { } }
        }
    });

    const { error } = await supabase.from('campanhas_marketing').delete().eq('id', id);

    if (error) {
        console.error("Error deleting campaign:", error);
        return false;
    }
    return true;
}

// Backward Compatibility / Legacy Bridge
export async function generateCampaign(productIds: string[], options?: { action?: string, context?: string }) {
    const context = options?.context || 'Gerar campanha focada em conversão imediata (Excess Stock).';

    // 1. Fetch products by ID


    // Filter manually since getMarketingProducts doesn't support ID list yet (and I don't want to break it)
    // Or we can add it. Let's just do a direct query here to be safe and fast.

    const { data: dbProducts } = await supabase
        .from('dados_estoque')
        .select('*')
        .in('id_produto', productIds)
        .eq('tipo_registro', 'DETALHE');

    if (!dbProducts || dbProducts.length === 0) {
        return { success: false, error: "Produtos não encontrados." };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const candidates: ProductCandidate[] = dbProducts.map((item: any) => ({
        id: item.id_produto,
        name: item.produto_descricao,
        stock: Number(item.estoque_atual || 0),
        price: Number(item.preco || 0),
        cost: Number(item.custo || 0),
        coverage: Number(item.dias_de_cobertura || 0),
        abc: item.classe_abc || 'C',
        category: item.categoria || 'Geral',
        status: item.status_ruptura,
        supplier: item.fornecedor
    }));

    // 2. Call Gemini
    const result = await generateCampaignWithGemini(candidates, context);

    // 3. Adapt output to match old Chat Interface expectations if needed
    // The chat interface seems to handle various shapes, but let's return a structure it understands.
    // Old return was: { success: true, campaign: aiResult } or aiResult directly.
    // New result.data is { report: ..., channels: ... }

    if (result.success && result.data) {
        return {
            success: true,
            campaign: {
                type: 'campaign_plan', // Signal to chat that this is a plan
                plan: {
                    status: 'aprovado',
                    alertas: [],
                    produtos: candidates.map(c => ({ nome: c.name, curva: c.abc })),
                    mix_atual: { A: 0, B: 0, C: 0 }, // Calc if needed
                    tipo_campanha_sugerido: result.data.report.hook,
                    duracao_sugerida: '7 dias',
                    nome_sugerido: result.data.report.title
                },
                channels: result.data.channels, // This matches what chat expects for "finals"
                // Add flat fields for other handlers
                ...result.data.channels
            }
        };
    }

    return { success: false, error: result.error };
}

// Legacy Helper (Still used by old modal if not fully replaced, can be kept or deprecated)
export async function getExcessStockProducts(): Promise<ProductCandidate[]> {
    return getMarketingProducts({ limit: 50 }); // Reusing new logic but simplified
}

export async function getCategories(): Promise<string[]> {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                    } catch { }
                },
            },
        }
    );

    const { data } = await supabase
        .from('dados_estoque')
        .select('categoria')
        .not('categoria', 'is', null);

    if (!data) return [];

    // Unique categories (handling distinct manually as distinct() can be tricky in some adapters)
    const unique = Array.from(new Set(data.map((item: any) => item.categoria))).sort();
    return unique as string[];
}

