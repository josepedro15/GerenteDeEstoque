import { ArrowUpRight, AlertTriangle, DollarSign, Package, TrendingUp } from "lucide-react";
import { getStockData } from "@/app/actions/inventory";
import { calculateDashboardMetrics } from "@/lib/analytics";
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { StockStatusPie } from "@/components/dashboard/StockStatusPie";
import { CoverageBar } from "@/components/dashboard/CoverageBar";
import { TopOpportunities } from "@/components/dashboard/TopOpportunities";
import { DashboardAnalysisButton } from "@/components/dashboard/DashboardAnalysisButton";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export default async function DashboardPage() {
    const { detalhe } = await getStockData();
    const metrics = calculateDashboardMetrics(detalhe);

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white/90">
                        Visão Geral
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        Monitoramento em tempo real do capital, saúde e performance do estoque.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <DashboardAnalysisButton data={metrics} />
                    <Button variant="outline" className="border-white/10 bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10">
                        <Calendar className="mr-2 h-4 w-4" />
                        Hoje
                    </Button>
                </div>
            </div>

            {/* Financial KPIs (Top Row) */}
            <KPIGrid metrics={{ ...metrics.financial, ruptureShare: metrics.risk.ruptureShare }} />

            {/* Main Visuals (Middle Row) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <StockStatusPie data={metrics.charts.statusDistribution} />
                <CoverageBar data={metrics.charts.coverageDistribution} />
            </div>

            {/* Tactical Actions (Bottom Row) */}
            <div>
                <TopOpportunities
                    ruptureItems={metrics.topMovers.rupture}
                    excessItems={metrics.topMovers.excess}
                />
            </div>
        </div>
    );
}
