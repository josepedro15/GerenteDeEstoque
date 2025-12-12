
"use client";

import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import { DashboardMetrics } from "@/types/analytics";
import { formatCurrency } from "@/lib/formatters";

export function DashboardAnalysisButton({ data }: { data: DashboardMetrics }) {
    const { sendProductMessage } = useChat();

    const handleAnalyze = () => {
        const payload = {
            is_dashboard_analysis: true,
            tipo_analise: "ANALISE GERAL DASHBOARD",
            financeiro: {
                total_estoque: data.financial.totalInventoryValue,
                receita_potencial: data.financial.totalRevenuePotential,
                lucro_projetado: data.financial.projectedProfit,
                margem_media: data.financial.averageMargin,
                total_skus: data.financial.totalSkuCount
            },
            risco: {
                itens_ruptura: data.risk.ruptureCount,
                itens_excesso: data.risk.excessCount,
                share_ruptura: data.risk.ruptureShare,
                share_audavel: data.risk.healthyShare
            },
            top_oportunidades: {
                rupturas_criticas: data.topMovers.rupture.map(i => ({
                    sku: i.id,
                    nome: i.name,
                    perda_diaria: i.value
                })),
                excessos_travados: data.topMovers.excess.map(i => ({
                    sku: i.id,
                    nome: i.name,
                    capital_parado: i.value
                }))
            },
            distribuicao_status: data.charts.statusDistribution,
            contexto: "Realize uma análise executiva completa do dashboard. Identifique onde estou perdendo dinheiro (ruptura) e onde tenho dinheiro parado (excesso). Sugira ações corretivas imediatas."
        };

        sendProductMessage(payload);
    };

    return (
        <Button
            onClick={handleAnalyze}
            className="bg-primary text-primary-foreground shadow-lg shadow-blue-500/20 transition-transform hover:scale-105 active:scale-95"
        >
            <Sparkles size={16} className="mr-2" />
            Rodar Análise IA
        </Button>
    );
}
