"use client";

import { motion } from "framer-motion";
import { BrainCircuit } from "lucide-react";
import { ScenarioBuilder } from "@/components/simulator/ScenarioBuilder";
import { SimulationResult } from "@/components/simulator/SimulationResult";
import { useState } from "react";

export default function SimulatorPage() {
    const [result, setResult] = useState<any>(null);

    return (
        <div className="min-h-screen bg-[#050505] p-8 text-white">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-auto max-w-6xl"
            >
                <header className="mb-10 border-b border-white/10 pb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 p-2">
                            <BrainCircuit size={32} />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Simulador de Estoque IA</h1>
                    </div>
                    <p className="max-w-2xl text-muted-foreground">
                        Utilize nossa Inteligência Artificial para projetar cenários de compra.
                        Descubra o impacto no seu fluxo de caixa e cobertura antes de fechar negócio.
                    </p>
                </header>

                <div className="grid gap-8 lg:grid-cols-12">
                    {/* Left Column: Builder Form */}
                    <div className="lg:col-span-5">
                        <ScenarioBuilder onSimulationComplete={setResult} />
                    </div>

                    {/* Right Column: Results */}
                    <div className="lg:col-span-7">
                        <SimulationResult result={result} />
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
