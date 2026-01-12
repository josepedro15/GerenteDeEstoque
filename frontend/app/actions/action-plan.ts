"use server";

import { logger } from "@/lib/logger";

interface ActionPlanPayload {
    action: string;
    alertType: string;
    alertLabel: string;
    totalQuantity: number;
    totalValue: number;
    message: string;
    user_id?: string;
}

const WEBHOOK_URL = "https://webhook.aiensed.com/webhook/estoque";

export async function sendActionPlanRequest(payload: ActionPlanPayload): Promise<{ success: boolean; message: string }> {
    try {
        logger.debug("Enviando para webhook de plano de ação:", payload);

        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        logger.debug("Resposta do webhook:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            logger.error("Erro no webhook:", errorText);
            return {
                success: false,
                message: `Erro ao enviar para o agente (${response.status})`
            };
        }

        // Tentar parsear resposta
        const contentType = response.headers.get("content-type");
        let data: any;

        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const text = await response.text();
            // Tentar parsear como JSON mesmo se content-type não indicar
            try {
                data = JSON.parse(text);
            } catch {
                return {
                    success: true,
                    message: text || "Plano de ação solicitado com sucesso!"
                };
            }
        }

        // Se tiver output ou text direto, retornar
        if (data.output || data.text) {
            return {
                success: true,
                message: data.output || data.text
            };
        }

        // Se for um plano de ação estratégico (novo formato)
        if (data.type === 'action_plan') {
            const lines: string[] = [];

            lines.push("## 🎯 Plano de Ação Estratégico");
            lines.push("");

            // Diagnóstico
            if (data.diagnostico) {
                lines.push(`**Diagnóstico:** ${data.diagnostico}`);
                lines.push("");
            }

            // Resumo
            if (data.resumo) {
                lines.push("### 📊 Situação Atual");
                lines.push(`- **Total de itens:** ${(data.resumo.total_itens || 0).toLocaleString('pt-BR')}`);
                lines.push(`- **Valor parado:** R$ ${(data.resumo.valor_parado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
                lines.push("");
            }

            // Plano de Ação por Fases
            if (data.plano_de_acao && Array.isArray(data.plano_de_acao)) {
                lines.push("### 📋 Fases do Plano");
                lines.push("");

                data.plano_de_acao.forEach((fase: any) => {
                    lines.push(`#### ${fase.fase ? `Fase ${fase.fase}: ` : ''}${fase.titulo}`);
                    if (fase.duracao) {
                        lines.push(`*Duração: ${fase.duracao}*`);
                    }
                    lines.push("");
                    if (fase.acoes && Array.isArray(fase.acoes)) {
                        fase.acoes.forEach((acao: string) => {
                            lines.push(`- ${acao}`);
                        });
                    }
                    lines.push("");
                });
            }

            // Metas
            if (data.metas) {
                lines.push("### 🎯 Metas");
                Object.entries(data.metas).forEach(([key, value]) => {
                    const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    lines.push(`- **${label}:** ${value}`);
                });
                lines.push("");
            }

            // Próximos Passos
            if (data.proximos_passos && Array.isArray(data.proximos_passos)) {
                lines.push("### ✅ Próximos Passos");
                data.proximos_passos.forEach((passo: string) => {
                    lines.push(`- ${passo}`);
                });
                lines.push("");
            }

            // Alerta Importante
            if (data.alerta_importante) {
                lines.push(`> ⚠️ **${data.alerta_importante}**`);
                lines.push("");
            }

            return {
                success: true,
                message: lines.join('\n')
            };
        }

        // Se for um plano de campanha, formatar em markdown
        if (data.type === 'campaign_plan' || data.plan) {
            const plan = data.plan || data;
            const lines: string[] = [];

            lines.push("## 📋 Plano de Ação");
            lines.push("");

            // Status
            if (plan.status) {
                const statusEmoji = plan.status === 'aprovado' ? '✅' : plan.status === 'ajuste_necessario' ? '⚠️' : '🔄';
                lines.push(`**Status:** ${statusEmoji} ${plan.status.replace(/_/g, ' ').toUpperCase()}`);
                lines.push("");
            }

            // Nome sugerido
            if (plan.nome_sugerido || data.nome_sugerido) {
                lines.push(`**Campanha:** ${plan.nome_sugerido || data.nome_sugerido}`);
            }

            // Tipo e duração
            if (plan.tipo_campanha_sugerido || data.tipo_campanha_sugerido) {
                lines.push(`**Tipo:** ${plan.tipo_campanha_sugerido || data.tipo_campanha_sugerido}`);
            }
            if (plan.duracao_sugerida || data.duracao_sugerida) {
                lines.push(`**Duração:** ${plan.duracao_sugerida || data.duracao_sugerida}`);
            }

            // Alertas
            const alertas = plan.alertas || data.alertas || [];
            if (alertas.length > 0) {
                lines.push("");
                lines.push("### ⚠️ Alertas");
                alertas.forEach((alerta: string) => {
                    lines.push(`- ${alerta}`);
                });
            }

            // Mix ABC
            const mix = plan.mix_percentual || data.mix_percentual;
            if (mix) {
                lines.push("");
                lines.push("### 📊 Mix ABC");
                lines.push(`- Curva A: ${mix.A || '0%'}`);
                lines.push(`- Curva B: ${mix.B || '0%'}`);
                lines.push(`- Curva C: ${mix.C || '0%'}`);
            }

            // Estimativas
            const est = plan.estimativas || data.estimativas;
            if (est) {
                lines.push("");
                lines.push("### 💰 Estimativas");
                if (est.faturamento_potencial !== undefined) {
                    lines.push(`- Faturamento potencial: R$ ${(est.faturamento_potencial || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
                }
                if (est.desconto_medio !== undefined) {
                    lines.push(`- Desconto médio: ${est.desconto_medio || 0}%`);
                }
            }

            // Produtos
            const produtos = plan.produtos || data.produtos || [];
            if (produtos.length > 0) {
                lines.push("");
                lines.push(`### 📦 Produtos (${produtos.length})`);
                produtos.slice(0, 10).forEach((p: any) => {
                    lines.push(`- ${p.nome || p.name || 'Produto'} (Curva ${p.curva || p.abc_curve || '?'})`);
                });
                if (produtos.length > 10) {
                    lines.push(`- ... e mais ${produtos.length - 10} produtos`);
                }
            }

            return {
                success: true,
                message: lines.join('\n')
            };
        }

        // Fallback: retornar JSON formatado
        return {
            success: true,
            message: JSON.stringify(data, null, 2)
        };
    } catch (error: any) {
        logger.error("Erro ao enviar plano de ação:", error);
        return {
            success: false,
            message: `Erro técnico: ${error.message || String(error)}`
        };
    }
}
