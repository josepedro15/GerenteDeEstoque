"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { LayoutDashboard, Calendar, TrendingUp, AlertTriangle, DollarSign, Package, BarChart3, ArrowUpDown, Sparkles, History, Megaphone } from "lucide-react";
import { getStockData } from "@/app/actions/inventory";
import { calculateDashboardMetrics } from "@/lib/analytics";
import { DashboardMetrics } from "@/types/analytics";
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { StockStatusPie } from "@/components/dashboard/StockStatusPie";
import { CoverageBar } from "@/components/dashboard/CoverageBar";
import { TopOpportunities } from "@/components/dashboard/TopOpportunities";
import { DashboardAnalysisButton } from "@/components/dashboard/DashboardAnalysisButton";
import { DashboardAnalysisModal } from "@/components/dashboard/DashboardAnalysisModal";
import type { DashboardAnalysisPayload } from "@/app/actions/dashboardAnalysis";
import { AlertPanel } from "@/components/dashboard/AlertPanel";
import { AlertProductsModal, AlertType } from "@/components/dashboard/AlertProductsModal";
import { ABCDistribution } from "@/components/dashboard/ABCDistribution";
import { TrendSummary } from "@/components/dashboard/TrendSummary";
import { PriorityActionList } from "@/components/dashboard/PriorityActionList";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function DashboardPage() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedAlert, setSelectedAlert] = useState<AlertType | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
    const [analysisPayload, setAnalysisPayload] = useState<DashboardAnalysisPayload | null>(null);

    function handleAlertClick(alertType: AlertType) {
        setSelectedAlert(alertType);
        setIsModalOpen(true);
    }

    function handleCloseModal() {
        setIsModalOpen(false);
    }

    useEffect(() => {
        async function load() {
            try {
                const { produtos } = await getStockData();
                const data = calculateDashboardMetrics(produtos);
                setMetrics(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading || !metrics) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 -z-10 bg-background" />
                <div className="flex flex-col items-center justify-center h-screen">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                        <LayoutDashboard className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-400" size={28} />
                    </div>
                    <p className="mt-6 text-muted-foreground">Carregando dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-background" />
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-600/10 rounded-full blur-[200px]" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px]" />
            </div>

            <div className="p-4 sm:p-6 lg:p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-auto max-w-7xl space-y-8"
                >
                    {/* SECTION 1: Alert Panel (substitui MorningBriefing) */}
                    <AlertPanel
                        alerts={metrics.alerts}
                        risk={metrics.risk}
                        onCardClick={handleAlertClick}
                    />

                    {/* SECTION 2: Header */}
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
                                        <LayoutDashboard size={32} className="text-foreground" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-white border-2 border-background">
                                        <TrendingUp size={10} className="text-emerald-600" />
                                    </div>
                                </motion.div>
                                <div>
                                    <motion.h1
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-foreground tracking-tight"
                                    >
                                        Visão Geral
                                    </motion.h1>
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                        className="mt-2 max-w-xl text-muted-foreground"
                                    >
                                        Análise de 60 dias • {metrics.financial.totalSkuCount.toLocaleString('pt-BR')} SKUs ativos
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
                                <DashboardAnalysisButton
                                    data={metrics}
                                    onOpenAnalysisModal={(payload) => {
                                        setAnalysisPayload(payload);
                                        setAnalysisModalOpen(true);
                                    }}
                                />
                            </motion.div>
                        </div>

                        {/* Ações rápidas - Novidades do sistema */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45 }}
                            className="mt-6 flex flex-wrap gap-3"
                        >
                            <Link
                                href="/marketing/new"
                                className="inline-flex items-center gap-2 rounded-xl border border-pink-500/30 bg-pink-500/10 px-4 py-2.5 text-sm font-medium text-pink-400 hover:bg-pink-500/20 transition-colors"
                            >
                                <Sparkles size={18} />
                                Nova Campanha (Assistente IA)
                            </Link>
                            <Link
                                href="/orders/history"
                                className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors"
                            >
                                <History size={18} />
                                Histórico de Pedidos
                            </Link>
                            <Link
                                href="/marketing"
                                className="inline-flex items-center gap-2 rounded-xl border border-border bg-accent px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            >
                                <Megaphone size={18} />
                                Campanhas salvas
                            </Link>
                        </motion.div>

                        {/* Divider with gradient */}
                        <div className="mt-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </header>

                    {/* SECTION 3: Financial KPIs */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <DollarSign size={16} className="text-emerald-400" />
                            <span className="text-sm font-medium text-muted-foreground">Indicadores Financeiros</span>
                        </div>
                        <KPIGrid metrics={{
                            ...metrics.financial,
                            ruptureShare: metrics.risk.ruptureShare,
                            chegandoCount: metrics.risk.chegandoCount
                        }} />
                    </motion.div>

                    {/* SECTION 4: Análise ABC + Status + Tendências */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 size={16} className="text-blue-400" />
                            <span className="text-sm font-medium text-muted-foreground">Análise de Estoque</span>
                        </div>
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            {/* Curva ABC */}
                            <div className="rounded-3xl border border-border bg-card/50 backdrop-blur-xl p-1 overflow-hidden">
                                <ABCDistribution abc={metrics.abc} />
                            </div>

                            {/* Status Distribution (Pie) */}
                            <div className="rounded-3xl border border-border bg-card/50 backdrop-blur-xl p-1 overflow-hidden">
                                <StockStatusPie data={metrics.charts.statusDistribution} />
                            </div>

                            {/* Tendências */}
                            <div className="rounded-3xl border border-border bg-card/50 backdrop-blur-xl p-1 overflow-hidden">
                                <TrendSummary trends={metrics.trends} />
                            </div>
                        </div>
                    </motion.div>

                    {/* SECTION 5: Cobertura + Top Opportunities */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Package size={16} className="text-orange-400" />
                            <span className="text-sm font-medium text-muted-foreground">Cobertura & Oportunidades</span>
                        </div>
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <div className="rounded-3xl border border-border bg-card/50 backdrop-blur-xl p-1 overflow-hidden">
                                <CoverageBar data={metrics.charts.coverageDistribution} />
                            </div>
                            <div className="rounded-3xl border border-border bg-card/50 backdrop-blur-xl p-1 overflow-hidden">
                                <div className="rounded-[20px] bg-card p-6">
                                    <TopOpportunities
                                        ruptureItems={metrics.topMovers.rupture}
                                        excessItems={metrics.topMovers.excess}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* SECTION 6: Lista de Ações Prioritárias */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <ArrowUpDown size={16} className="text-emerald-400" />
                            <span className="text-sm font-medium text-muted-foreground">Ações Prioritárias</span>
                        </div>
                        <div className="rounded-3xl border border-border bg-card/50 backdrop-blur-xl p-1 overflow-hidden">
                            <PriorityActionList actions={metrics.priorityActions} />
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Modal de Produtos por Alerta */}
            {selectedAlert && (
                <AlertProductsModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    alertType={selectedAlert}
                />
            )}

            <DashboardAnalysisModal
                open={analysisModalOpen}
                onOpenChange={setAnalysisModalOpen}
                payload={analysisPayload}
            />
        </div>
    );
}
