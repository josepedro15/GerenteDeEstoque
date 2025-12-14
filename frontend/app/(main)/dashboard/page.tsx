"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, Calendar, Zap, TrendingUp, AlertTriangle, DollarSign, Package, ChevronRight, RefreshCw } from "lucide-react";
import { getStockData } from "@/app/actions/inventory";
import { calculateDashboardMetrics } from "@/lib/analytics";
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { StockStatusPie } from "@/components/dashboard/StockStatusPie";
import { CoverageBar } from "@/components/dashboard/CoverageBar";
import { TopOpportunities } from "@/components/dashboard/TopOpportunities";
import { DashboardAnalysisButton } from "@/components/dashboard/DashboardAnalysisButton";
import { MorningBriefing } from "@/components/dashboard/MorningBriefing";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function DashboardPage() {
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const { detalhe } = await getStockData();
                const data = calculateDashboardMetrics(detalhe);
                setMetrics(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 -z-10 bg-[#050505]" />
                <div className="flex flex-col items-center justify-center h-screen">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                        <LayoutDashboard className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-400" size={28} />
                    </div>
                    <p className="mt-6 text-neutral-400">Carregando dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-[#050505]" />
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-600/10 rounded-full blur-[200px]" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px]" />
            </div>

            <div className="p-6 lg:p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-auto max-w-7xl space-y-8"
                >
                    {/* Morning Briefing (Priority Section) */}
                    <MorningBriefing />

                    {/* Premium Header */}
                    <header>
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div className="flex items-start gap-5">
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                                    className="relative"
                                >
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
                                        <LayoutDashboard size={32} className="text-white" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-white border-2 border-[#050505]">
                                        <TrendingUp size={10} className="text-emerald-600" />
                                    </div>
                                </motion.div>
                                <div>
                                    <motion.h1
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-3xl lg:text-4xl font-bold tracking-tight text-white"
                                    >
                                        Visão Geral
                                    </motion.h1>
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                        className="mt-2 max-w-xl text-neutral-400"
                                    >
                                        Monitoramento em tempo real do capital, saúde e performance do estoque.
                                    </motion.p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="flex flex-wrap gap-3"
                            >
                                <DashboardAnalysisButton data={metrics} />
                                <Button variant="outline" className="border-white/10 bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Hoje
                                </Button>
                            </motion.div>
                        </div>

                        {/* Divider with gradient */}
                        <div className="mt-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </header>

                    {/* Financial KPIs (Top Row) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <DollarSign size={16} className="text-emerald-400" />
                            <span className="text-sm font-medium text-neutral-400">Indicadores Financeiros</span>
                        </div>
                        <KPIGrid metrics={{ ...metrics.financial, ruptureShare: metrics.risk.ruptureShare }} />
                    </motion.div>

                    {/* Main Visuals (Middle Row) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Package size={16} className="text-blue-400" />
                            <span className="text-sm font-medium text-neutral-400">Análise de Estoque</span>
                        </div>
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <div className="rounded-3xl border border-white/10 bg-neutral-900/50 backdrop-blur-xl p-1 overflow-hidden">
                                <StockStatusPie data={metrics.charts.statusDistribution} />
                            </div>
                            <div className="rounded-3xl border border-white/10 bg-neutral-900/50 backdrop-blur-xl p-1 overflow-hidden">
                                <CoverageBar data={metrics.charts.coverageDistribution} />
                            </div>
                        </div>
                    </motion.div>

                    {/* Tactical Actions (Bottom Row) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle size={16} className="text-orange-400" />
                            <span className="text-sm font-medium text-neutral-400">Oportunidades & Riscos</span>
                        </div>
                        <div className="rounded-3xl border border-white/10 bg-neutral-900/50 backdrop-blur-xl p-1 overflow-hidden">
                            <div className="rounded-[20px] bg-neutral-950/50 p-6">
                                <TopOpportunities
                                    ruptureItems={metrics.topMovers.rupture}
                                    excessItems={metrics.topMovers.excess}
                                />
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
