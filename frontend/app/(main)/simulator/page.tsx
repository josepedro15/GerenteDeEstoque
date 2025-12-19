"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, Calculator, Zap, Activity, Sparkles, ChevronRight, LineChart } from "lucide-react";
import { ScenarioBuilder } from "@/components/simulator/ScenarioBuilder";
import { SimulationResult } from "@/components/simulator/SimulationResult";
import { useState } from "react";

export default function SimulatorPage() {
    const [result, setResult] = useState<any>(null);

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-background" />
                <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px]" />
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
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/25">
                                        <BrainCircuit size={32} className="text-foreground" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-yellow-500 border-2 border-background">
                                        <Zap size={10} className="text-black" />
                                    </div>
                                </motion.div>
                                <div>
                                    <motion.h1
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground"
                                    >
                                        Simulador de Estoque
                                        <span className="inline-block ml-2 px-2 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-foreground uppercase tracking-wider">
                                            IA
                                        </span>
                                    </motion.h1>
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                        className="mt-2 max-w-xl text-muted-foreground"
                                    >
                                        Projete cenários de compra com inteligência artificial.
                                        Descubra o impacto no seu fluxo de caixa e cobertura antes de fechar negócio.
                                    </motion.p>
                                </div>
                            </div>

                            {/* Feature Pills */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="flex flex-wrap gap-3"
                            >
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-border text-sm">
                                    <Calculator size={14} className="text-purple-400" />
                                    <span className="text-foreground font-medium">Análise de Risco</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-border text-sm">
                                    <LineChart size={14} className="text-blue-400" />
                                    <span className="text-foreground font-medium">Projeção 90 Dias</span>
                                </div>
                            </motion.div>
                        </div>

                        {/* Divider with gradient */}
                        <div className="mt-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </header>

                    {/* Main Content Grid */}
                    <div className="grid gap-8 lg:grid-cols-12">
                        {/* Left Column: Builder Form */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                            className="lg:col-span-5"
                        >
                            <div className="sticky top-8">
                                <div className="rounded-3xl border border-border bg-card/50 backdrop-blur-xl p-1 overflow-hidden">
                                    <div className="rounded-[20px] bg-card p-6">
                                        <div className="flex items-center gap-2 mb-6">
                                            <Sparkles size={16} className="text-purple-400" />
                                            <span className="text-sm font-medium text-muted-foreground">Construtor de Cenário</span>
                                        </div>
                                        <ScenarioBuilder onSimulationComplete={setResult} />
                                    </div>
                                </div>

                                {/* Info Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8 }}
                                    className="mt-4 p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
                                            <Activity size={16} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-foreground mb-1">Como funciona</h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                Informe os parâmetros da compra e a IA calcula o risco, cobertura projetada e impacto financeiro baseado no histórico de vendas.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Right Column: Results */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 }}
                            className="lg:col-span-7"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <ChevronRight size={16} className="text-neutral-600" />
                                <span className="text-sm font-medium text-muted-foreground">Análise da Simulação</span>
                            </div>
                            <AnimatePresence mode="wait">
                                <SimulationResult result={result} />
                            </AnimatePresence>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
