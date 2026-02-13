"use server";

import { generateText } from "ai";
import { getGeminiModel, fallbackModels } from "@/lib/gemini";
import { enforceRateLimit } from "@/lib/rateLimit";
import { createClient } from "@/utils/supabase/server";

export interface DashboardAnalysisPayload {
    financeiro: {
        total_estoque: number;
        receita_potencial: number;
        lucro_projetado: number;
        margem_media: number;
        total_skus: number;
    };
    risco: {
        itens_ruptura: number;
        itens_excesso: number;
        share_ruptura: number;
        share_audavel: number;
    };
    top_oportunidades: {
        rupturas_criticas: Array<{ sku: string; nome: string; perda_diaria: number }>;
        excessos_travados: Array<{ sku: string; nome: string; capital_parado: number }>;
    };
    distribuicao_status?: Record<string, unknown> | string;
}

function buildDashboardPrompt(data: DashboardAnalysisPayload): string {
    const f = data.financeiro || {};
    const r = data.risco || {};
    const top = data.top_oportunidades || {};
    const fmt = (n: number) =>
        new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
    const rupturas = (top.rupturas_criticas || [])
        .slice(0, 5)
        .map(
            (i) =>
                `  - ${i.nome} (SKU ${i.sku}): perda diária ${fmt(Number(i.perda_diaria) || 0)}`
        )
        .join("\n");
    const excessos = (top.excessos_travados || [])
        .slice(0, 5)
        .map(
            (i) =>
                `  - ${i.nome} (SKU ${i.sku}): capital parado ${fmt(Number(i.capital_parado) || 0)}`
        )
        .join("\n");
    const dist = data.distribuicao_status;
    const distText =
        typeof dist === "object" && dist !== null && !Array.isArray(dist)
            ? Object.entries(dist)
                  .map(
                      ([k, v]) =>
                          `${k}: ${typeof v === "object" && v !== null ? JSON.stringify(v) : v}`
                  )
                  .join(", ")
            : dist != null
              ? String(dist)
              : "-";

    return `Analise os dados do DASHBOARD abaixo e dê uma análise executiva (prioridades e ações). Responda SOMENTE com base nestes dados.

**Financeiro**
- Valor em estoque (custo): ${fmt(Number(f.total_estoque) || 0)}
- Receita potencial: ${fmt(Number(f.receita_potencial) || 0)}
- Lucro projetado: ${fmt(Number(f.lucro_projetado) || 0)}
- Margem média: ${Number(f.margem_media) || 0}%
- Total de SKUs: ${f.total_skus != null ? String(f.total_skus) : "-"}

**Risco**
- Itens em ruptura: ${r.itens_ruptura ?? 0}
- Itens em excesso: ${r.itens_excesso ?? 0}
- Share de ruptura: ${Number(r.share_ruptura) || 0}%
- Nível de serviço (audável): ${Number(r.share_audavel) || 0}%

**Top rupturas críticas (perda diária)**
${rupturas || "  (nenhum)"}

**Top excessos (capital parado)**
${excessos || "  (nenhum)"}

**Distribuição por status**
${distText}

Responda em 3 blocos: (1) Onde estou perdendo dinheiro, (2) Onde tenho capital parado, (3) As 2–3 ações que devo priorizar agora. Seja direto e use os números acima.`;
}

const DASHBOARD_SYSTEM =
    "Você é um analista executivo de estoque. Responda apenas com base nos dados fornecidos na mensagem do usuário. Não invente números. Seja direto: prioridades e ações em tópicos.";

/**
 * Análise executiva do dashboard — fluxo dedicado, sem chat e sem ferramentas.
 * Usado pelo botão "Rodar Análise IA" no dashboard.
 */
export async function analyzeDashboardData(
    payload: DashboardAnalysisPayload
): Promise<{ success: true; analysis: string } | { success: false; error: string }> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        const userId = user?.id || "anonymous";

        try {
            enforceRateLimit("chat", userId);
        } catch (rateLimitError: unknown) {
            const msg =
                rateLimitError instanceof Error ? rateLimitError.message : String(rateLimitError);
            return { success: false, error: `Limite de uso: ${msg}` };
        }

        const prompt = buildDashboardPrompt(payload);
        let lastError: Error | null = null;

        for (const modelName of fallbackModels) {
            try {
                const result = await generateText({
                    model: getGeminiModel(modelName) as any,
                    system: DASHBOARD_SYSTEM,
                    messages: [{ role: "user" as const, content: prompt }],
                    maxSteps: 1,
                    // Sem tools — só análise de texto
                } as any);

                if (result?.text?.trim()) {
                    return { success: true, analysis: result.text.trim() };
                }
            } catch (err) {
                lastError = err instanceof Error ? err : new Error(String(err));
            }
        }

        return {
            success: false,
            error: lastError?.message || "Não foi possível gerar a análise. Tente novamente.",
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { success: false, error: message };
    }
}
