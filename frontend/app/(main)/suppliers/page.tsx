"use client";

import { motion } from "framer-motion";
import { PackageCheck, ShieldCheck, Clock, TrendingUp, AlertTriangle } from "lucide-react";
import { useState } from "react";

// Mock Data
const suppliers = [
    { id: 1, name: "Votorantim Cimentos", reliability: 98, avgLeadTime: "2 dias", risk: "BAIXO", status: "Excelente" },
    { id: 2, name: "Tigre Tubos e Conexões", reliability: 95, avgLeadTime: "3 dias", risk: "BAIXO", status: "Bom" },
    { id: 3, name: "Gerdau Aços", reliability: 88, avgLeadTime: "5 dias", risk: "MÉDIO", status: "Atenção" },
    { id: 4, name: "Fornecedor Local X", reliability: 65, avgLeadTime: "10 dias", risk: "ALTO", status: "Crítico" },
];

export default function SuppliersPage() {
    return (
        <div className="min-h-screen bg-[#050505] p-8 text-white">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-auto max-w-6xl"
            >
                <header className="mb-10 border-b border-white/10 pb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400 p-2">
                            <PackageCheck size={32} />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Scorecard de Fornecedores</h1>
                    </div>
                    <p className="max-w-2xl text-muted-foreground">
                        Monitoramento de desempenho e confiabilidade dos seus parceiros comerciais.
                    </p>
                </header>

                <div className="grid gap-6">
                    {suppliers.map((supplier, i) => (
                        <motion.div
                            key={supplier.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition-all hover:bg-white/10"
                        >
                            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                                {/* Name & Status */}
                                <div className="flex items-center gap-4">
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ${supplier.risk === 'BAIXO' ? 'bg-emerald-500/20 text-emerald-400' :
                                            supplier.risk === 'MÉDIO' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-red-500/20 text-red-400'
                                        }`}>
                                        {supplier.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{supplier.name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span className={`inline-block h-2 w-2 rounded-full ${supplier.risk === 'BAIXO' ? 'bg-emerald-500' :
                                                    supplier.risk === 'MÉDIO' ? 'bg-yellow-500' :
                                                        'bg-red-500'
                                                }`} />
                                            Status: {supplier.status}
                                        </div>
                                    </div>
                                </div>

                                {/* Metrics */}
                                <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
                                    <div className="text-center md:text-left">
                                        <div className="mb-1 flex items-center justify-center gap-2 text-sm text-muted-foreground md:justify-start">
                                            <ShieldCheck size={16} />
                                            Confiabilidade
                                        </div>
                                        <span className="text-xl font-bold text-white">{supplier.reliability}%</span>
                                    </div>
                                    <div className="text-center md:text-left">
                                        <div className="mb-1 flex items-center justify-center gap-2 text-sm text-muted-foreground md:justify-start">
                                            <Clock size={16} />
                                            Lead Time
                                        </div>
                                        <span className="text-xl font-bold text-white">{supplier.avgLeadTime}</span>
                                    </div>
                                    <div className="hidden text-center md:block md:text-left">
                                        <div className="mb-1 flex items-center justify-center gap-2 text-sm text-muted-foreground md:justify-start">
                                            <AlertTriangle size={16} />
                                            Risco
                                        </div>
                                        <span className={`text-xl font-bold ${supplier.risk === 'BAIXO' ? 'text-emerald-400' :
                                                supplier.risk === 'MÉDIO' ? 'text-yellow-400' :
                                                    'text-red-400'
                                            }`}>{supplier.risk}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
