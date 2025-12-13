"use client";

import { motion } from "framer-motion";
import { AlertTriangle, TrendingDown, PackageCheck, Zap, ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getMorningBriefingStats } from "@/app/actions/dashboard"; // We will create this
import { formatCurrency } from "@/lib/formatters";

export function MorningBriefing() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const data = await getMorningBriefingStats();
                setStats(data);
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
            <div className="mb-8 flex h-48 w-full items-center justify-center rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md">
                <Loader2 className="animate-spin text-white/50" />
            </div>
        );
    }

    if (!stats) return null;

    const handleAction = (context: string, data: any) => {
        // Dispatch event to open chat with context
        const event = new CustomEvent('chat:send-product', {
            detail: {
                is_dashboard_analysis: true,
                briefing_context: context,
                data: data
            }
        });
        window.dispatchEvent(event);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 w-full"
        >
            <div className="mb-4 flex items-center gap-2">
                <Zap className="text-yellow-400" size={20} fill="currentColor" />
                <h2 className="text-lg font-semibold text-white">Briefing Matinal</h2>
                <span className="text-xs text-muted-foreground">Atualizado hoje às 08:00</span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {/* Card 1: Rupturas (Crítico) */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-black p-6 transition-colors hover:border-red-500/40"
                >
                    <div className="absolute right-0 top-0 p-4 opacity-10">
                        <AlertTriangle size={80} />
                    </div>
                    <div className="relative z-10">
                        <div className="mb-2 flex items-center gap-2 text-red-400">
                            <AlertTriangle size={18} />
                            <span className="font-bold uppercase tracking-wider text-xs">Ação Imediata</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-1">
                            {stats.ruptures.count} Rupturas Críticas
                        </h3>
                        <p className="text-sm text-red-200/70 mb-4">
                            Você tem {formatCurrency(stats.ruptures.value)} em risco de perda de venda hoje.
                        </p>
                        <button
                            onClick={() => handleAction("RUPTURA_CRITICA", stats.ruptures)}
                            className="group flex items-center gap-2 text-sm font-medium text-red-400 decoration-red-400/30 underline-offset-4 hover:underline"
                        >
                            Verificar itens
                            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>
                </motion.div>

                {/* Card 2: Excesso (Oportunidade) */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-black p-6 transition-colors hover:border-blue-500/40"
                >
                    <div className="absolute right-0 top-0 p-4 opacity-10">
                        <TrendingDown size={80} />
                    </div>
                    <div className="relative z-10">
                        <div className="mb-2 flex items-center gap-2 text-blue-400">
                            <TrendingDown size={18} />
                            <span className="font-bold uppercase tracking-wider text-xs">Oportunidade de Caixa</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-1">
                            {stats.excess.count} Itens em Excesso
                        </h3>
                        <p className="text-sm text-blue-200/70 mb-4">
                            Libere até {formatCurrency(stats.excess.value)} fazendo promoções de queima.
                        </p>
                        <button
                            onClick={() => handleAction("QUEIMA_ESTOQUE", stats.excess)}
                            className="group flex items-center gap-2 text-sm font-medium text-blue-400 decoration-blue-400/30 underline-offset-4 hover:underline"
                        >
                            Gerar Plano de Ação
                            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>
                </motion.div>

                {/* Card 3: Fornecedores (Atrasos) */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-black p-6 transition-colors hover:border-orange-500/40"
                >
                    <div className="absolute right-0 top-0 p-4 opacity-10">
                        <PackageCheck size={80} />
                    </div>
                    <div className="relative z-10">
                        <div className="mb-2 flex items-center gap-2 text-orange-400">
                            <PackageCheck size={18} />
                            <span className="font-bold uppercase tracking-wider text-xs">Supply Chain</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-1">
                            {stats.suppliers.late_orders} Pedidos Atrasados
                        </h3>
                        <p className="text-sm text-orange-200/70 mb-4">
                            Fornecedor "{stats.suppliers.worst_offender}" é o maior ofensor.
                        </p>
                        <button
                            onClick={() => handleAction("ATRASO_FORNECEDOR", stats.suppliers)}
                            className="group flex items-center gap-2 text-sm font-medium text-orange-400 decoration-orange-400/30 underline-offset-4 hover:underline"
                        >
                            Cobrar Fornecedores
                            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
