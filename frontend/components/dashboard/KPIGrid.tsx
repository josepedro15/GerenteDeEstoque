import { DashboardMetrics } from "@/types/analytics";
import { formatCurrency } from "@/lib/formatters";
import { DollarSign, Package, TrendingUp, AlertTriangle } from "lucide-react";

export function KPIGrid({ metrics }: { metrics: DashboardMetrics['financial'] & { ruptureShare: number } }) {
    const cards = [
        {
            label: "Valor em Estoque (Custo)",
            value: formatCurrency(metrics.totalInventoryValue),
            sub: `${metrics.totalSkuCount} SKUs totais`,
            icon: Package,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
        },
        {
            label: "Receita Potencial",
            value: formatCurrency(metrics.totalRevenuePotential),
            sub: `Margem proj. ${metrics.averageMargin.toFixed(1)}%`,
            icon: DollarSign,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
        },
        {
            label: "Lucro Projetado",
            value: formatCurrency(metrics.projectedProfit),
            sub: "Se vender tudo",
            icon: TrendingUp,
            color: "text-indigo-400",
            bg: "bg-indigo-500/10",
        },
        {
            label: "Share de Ruptura",
            value: `${metrics.ruptureShare.toFixed(1)}%`,
            sub: "Itens em estado crítico",
            icon: AlertTriangle,
            color: "text-red-400",
            bg: "bg-red-500/10",
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, idx) => (
                <div key={idx} className="relative overflow-hidden rounded-xl border border-white/5 bg-white/5 p-6 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                            <p className="mt-2 text-2xl font-bold text-white">{card.value}</p>
                            <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                        </div>
                        <div className={`rounded-xl p-3 ${card.bg}`}>
                            <card.icon className={`h-6 w-6 ${card.color}`} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
