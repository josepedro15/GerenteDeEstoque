"use client";

import { motion } from "framer-motion";
import { PackageSearch, Sparkles, Brain, TrendingUp, Filter, ChevronRight } from "lucide-react";
import { getExcessStockProducts, ProductCandidate } from "@/app/actions/marketing";
import { getStockData } from "@/app/actions/inventory";
import { generateSuggestions } from "@/lib/analytics";
import { RecommendationEngine } from "@/components/recommendations/RecommendationEngine";
import { useEffect, useState } from "react";

export default function RecommendationsPage() {
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const { detalhe } = await getStockData();
                const data = generateSuggestions(detalhe, 60);
                setSuggestions(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-background" />
                <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="p-6 lg:p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-auto max-w-7xl"
                >
                    {/* Premium Header */}
                    <header className="mb-8 lg:mb-12">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div className="flex items-start gap-5">
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                                    className="relative"
                                >
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/25">
                                        <PackageSearch size={32} className="text-foreground" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500 border-2 border-background">
                                        <Brain size={10} className="text-foreground" />
                                    </div>
                                </motion.div>
                                <div>
                                    <motion.h1
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground"
                                    >
                                        Sugestões de Compra
                                        <span className="inline-block ml-2 px-2 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-foreground uppercase tracking-wider">
                                            Híbrido
                                        </span>
                                    </motion.h1>
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                        className="mt-2 max-w-xl text-muted-foreground"
                                    >
                                        O sistema calculou as necessidades com base em 60 dias de cobertura.
                                        Selecione os itens e peça para a IA refinar a estratégia de compra.
                                    </motion.p>
                                </div>
                            </div>

                            {/* Stats Pills */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="flex flex-wrap gap-3"
                            >
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-border text-sm">
                                    <Filter size={14} className="text-blue-400" />
                                    <span className="text-foreground font-medium">{suggestions.length} Itens</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm">
                                    <TrendingUp size={14} className="text-emerald-400" />
                                    <span className="text-emerald-300 font-medium">60 Dias Cobertura</span>
                                </div>
                            </motion.div>
                        </div>

                        {/* Divider with gradient */}
                        <div className="mt-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </header>

                    {/* Main Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                                    <PackageSearch className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400" size={24} />
                                </div>
                                <p className="mt-6 text-muted-foreground">Carregando sugestões...</p>
                            </div>
                        ) : (
                            <>
                                {/* Tip Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7 }}
                                    className="mb-6 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                                            <Sparkles size={16} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-foreground mb-1">Dica: Análise com IA</h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                Selecione até 5 itens e clique em "Analisar Plano com IA" para receber uma análise detalhada com sugestões de negociação e otimização de compra.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>

                                <div className="rounded-3xl border border-border bg-card/50 backdrop-blur-xl p-1 overflow-hidden">
                                    <div className="rounded-[20px] bg-card">
                                        <RecommendationEngine suggestions={suggestions} />
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
