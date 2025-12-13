"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, TrendingDown, DollarSign, Activity } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import ReactMarkdown from 'react-markdown';

export function SimulationResult({ result }: { result: any }) {
    if (!result) {
        return (
            <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
                <div className="mb-4 rounded-full bg-white/5 p-6">
                    <Activity className="text-white/20" size={48} />
                </div>
                <h3 className="text-lg font-medium text-white">Nenhuma Simulação</h3>
                <p className="text-muted-foreground">Preencha os parâmetros ao lado para gerar uma análise.</p>
            </div>
        );
    }

    const { analysis, input } = result;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
        >
            {/* Risk Card */}
            <div className={`overflow-hidden rounded-3xl border p-1 ${analysis.riskLevel === 'HIGH' ? 'border-red-500/50 bg-red-500/10' :
                    analysis.riskLevel === 'MEDIUM' ? 'border-yellow-500/50 bg-yellow-500/10' :
                        'border-emerald-500/50 bg-emerald-500/10'
                }`}>
                <div className="rounded-2xl bg-black/40 p-6 backdrop-blur-md">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                {analysis.riskLevel === 'HIGH' ? <AlertTriangle className="text-red-400" /> :
                                    analysis.riskLevel === 'MEDIUM' ? <AlertTriangle className="text-yellow-400" /> :
                                        <CheckCircle2 className="text-emerald-400" />}
                                <h3 className={`font-bold tracking-wider ${analysis.riskLevel === 'HIGH' ? 'text-red-400' :
                                        analysis.riskLevel === 'MEDIUM' ? 'text-yellow-400' :
                                            'text-emerald-400'
                                    }`}>
                                    RISCO {analysis.riskLevel === 'HIGH' ? 'ALTO' : analysis.riskLevel === 'MEDIUM' ? 'MODERADO' : 'BAIXO'}
                                </h3>
                            </div>
                            <p className="mt-2 text-2xl font-bold text-white">
                                Cobertura Projetada: {analysis.projectedCoverage} Dias
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Investimento</p>
                            <p className="text-xl font-mono text-white">{formatCurrency(analysis.financialImpact)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Verdict */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
                <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-purple-500/20 p-2">
                        <DollarSign className="text-purple-400" size={24} />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Veredito da IA</h3>
                </div>

                <div className="prose prose-invert max-w-none text-gray-300">
                    <ReactMarkdown>{analysis.aiVerdict}</ReactMarkdown>
                </div>
            </div>

            {/* Projection Chart Placeholder */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
                <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-blue-500/20 p-2">
                        <TrendingDown className="text-blue-400" size={24} />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Projeção de Consumo</h3>
                </div>
                <div className="flex h-32 items-end gap-2 border-b border-white/10 pb-4">
                    {result.charts.projection.map((point: any, i: number) => (
                        <div key={i} className="group relative flex-1 flex flex-col justify-end">
                            <div
                                className="w-full rounded-t bg-blue-500/30 transition-all hover:bg-blue-500/60"
                                style={{ height: `${(point.stock / (Number(input.quantity) + 50)) * 100}%` }}
                            />
                            <span className="mt-2 text-center text-xs text-muted-foreground">{point.day}</span>
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-black px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                                {point.stock} un
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
