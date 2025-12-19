"use client";

import { motion } from "framer-motion";
import { Megaphone, Zap, TrendingUp, Sparkles, Target, ChevronRight } from "lucide-react";
import { useState } from "react";
import { OpportunityRadar } from "@/components/marketing/OpportunityRadar";
import { CampaignResult } from "@/components/marketing/CampaignResult";

export default function MarketingPage() {
    const [campaign, setCampaign] = useState<any>(null);

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-background" />
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-pink-600/20 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[120px]" />
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
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg shadow-pink-500/25">
                                        <Megaphone size={32} className="text-foreground" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-background animate-pulse" />
                                </motion.div>
                                <div>
                                    <motion.h1
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground"
                                    >
                                        Agente de Marketing
                                        <span className="inline-block ml-2 px-2 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-foreground uppercase tracking-wider">
                                            IA
                                        </span>
                                    </motion.h1>
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                        className="mt-2 max-w-xl text-muted-foreground"
                                    >
                                        Transforme oportunidades de estoque em campanhas de vendas de alto impacto.
                                        Selecione os produtos e deixe a IA criar todo o conteúdo.
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
                                    <Zap size={14} className="text-yellow-400" />
                                    <span className="text-foreground font-medium">Geração Instantânea</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-border text-sm">
                                    <Target size={14} className="text-pink-400" />
                                    <span className="text-foreground font-medium">3 Canais</span>
                                </div>
                            </motion.div>
                        </div>

                        {/* Divider with gradient */}
                        <div className="mt-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </header>

                    {/* Main Content Grid */}
                    <div className="grid gap-8 lg:grid-cols-12">
                        {/* Left Column: Input (Radar) */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                            className="lg:col-span-5"
                        >
                            <div className="sticky top-8">
                                <div className="rounded-3xl border border-border bg-neutral-900/50 backdrop-blur-xl p-1">
                                    <div className="rounded-[20px] bg-neutral-950/50 p-6">
                                        <div className="flex items-center gap-2 mb-6">
                                            <Sparkles size={16} className="text-pink-400" />
                                            <span className="text-sm font-medium text-muted-foreground">Radar de Oportunidades</span>
                                        </div>
                                        <OpportunityRadar onCampaignGenerated={setCampaign} />
                                    </div>
                                </div>

                                {/* Quick Tips Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8 }}
                                    className="mt-4 p-4 rounded-2xl bg-pink-500/5 border border-pink-500/10"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 shrink-0">
                                            <TrendingUp size={16} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-foreground mb-1">Dica Pro</h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                Selecione produtos com alta margem e excesso de estoque para campanhas mais eficazes.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Right Column: Output (Result) */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 }}
                            className="lg:col-span-7"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <ChevronRight size={16} className="text-neutral-600" />
                                <span className="text-sm font-medium text-muted-foreground">Resultado da Campanha</span>
                            </div>
                            <CampaignResult campaign={campaign} />
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
