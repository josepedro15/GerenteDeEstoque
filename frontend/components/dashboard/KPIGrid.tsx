import { DashboardMetrics } from "@/types/analytics";
import { formatCurrency } from "@/lib/formatters";
import { DollarSign, Package, TrendingUp, AlertTriangle, Truck, ShoppingCart } from "lucide-react";

interface KPIGridProps {
    metrics: DashboardMetrics['financial'] & {
        ruptureShare: number;
        chegandoCount?: number;
    };
}

export function KPIGrid({ metrics }: KPIGridProps) {
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
        // NOVOS CARDS
        {
            label: "Em Trânsito",
            value: formatCurrency(metrics.totalTransitValue || 0),
            sub: metrics.chegandoCount ? `${metrics.chegandoCount} itens chegando` : "Pedidos pendentes",
            icon: Truck,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
        },

    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {cards.map((card, idx) => (
                <div key={idx} className="relative overflow-hidden rounded-2xl border border-border bg-accent p-6 backdrop-blur-md">
                    <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-muted-foreground truncate">{card.label}</p>
                            <p className="mt-2 text-2xl font-bold text-foreground truncate">{card.value}</p>
                            <p className="text-xs text-muted-foreground mt-1 truncate">{card.sub}</p>
                        </div>
                        <div className={`rounded-xl p-3 ${card.bg} shrink-0`}>
                            <card.icon className={`h-6 w-6 ${card.color}`} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
