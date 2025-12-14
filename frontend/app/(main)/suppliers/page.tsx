"use client";

import { motion } from "framer-motion";
import { PackageCheck, ShieldCheck, Clock, AlertTriangle, Award, TrendingUp, ChevronRight, Users, Star } from "lucide-react";

// Mock Data
const suppliers = [
    { id: 1, name: "Votorantim Cimentos", reliability: 98, avgLeadTime: "2 dias", risk: "BAIXO", status: "Excelente", orders: 234, rating: 4.9 },
    { id: 2, name: "Tigre Tubos e Conexões", reliability: 95, avgLeadTime: "3 dias", risk: "BAIXO", status: "Bom", orders: 187, rating: 4.7 },
    { id: 3, name: "Gerdau Aços", reliability: 88, avgLeadTime: "5 dias", risk: "MÉDIO", status: "Atenção", orders: 156, rating: 4.2 },
    { id: 4, name: "Fornecedor Local X", reliability: 65, avgLeadTime: "10 dias", risk: "ALTO", status: "Crítico", orders: 45, rating: 2.8 },
];

const getRiskStyles = (risk: string) => {
    switch (risk) {
        case 'BAIXO':
            return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/20' };
        case 'MÉDIO':
            return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', glow: 'shadow-yellow-500/20' };
        default:
            return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', glow: 'shadow-red-500/20' };
    }
};

export default function SuppliersPage() {
    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-[#050505]" />
                <div className="absolute top-0 right-1/3 w-[500px] h-[500px] bg-orange-600/15 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-amber-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="p-6 lg:p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-auto max-w-6xl"
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
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/25">
                                        <PackageCheck size={32} className="text-white" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-white border-2 border-[#050505]">
                                        <Star size={10} className="text-amber-500 fill-amber-500" />
                                    </div>
                                </motion.div>
                                <div>
                                    <motion.h1
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-3xl lg:text-4xl font-bold tracking-tight text-white"
                                    >
                                        Scorecard de Fornecedores
                                    </motion.h1>
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.4 }}
                                        className="mt-2 max-w-xl text-neutral-400"
                                    >
                                        Monitoramento de desempenho e confiabilidade dos seus parceiros comerciais.
                                    </motion.p>
                                </div>
                            </div>

                            {/* Stats Summary */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="flex flex-wrap gap-3"
                            >
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm">
                                    <Users size={14} className="text-orange-400" />
                                    <span className="text-white font-medium">{suppliers.length} Fornecedores</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-sm">
                                    <Award size={14} className="text-emerald-400" />
                                    <span className="text-emerald-300 font-medium">2 Excelentes</span>
                                </div>
                            </motion.div>
                        </div>

                        {/* Divider with gradient */}
                        <div className="mt-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </header>

                    {/* Supplier Cards Grid */}
                    <div className="grid gap-4">
                        {suppliers.map((supplier, i) => {
                            const styles = getRiskStyles(supplier.risk);
                            return (
                                <motion.div
                                    key={supplier.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * i + 0.5 }}
                                    className={`group relative overflow-hidden rounded-2xl border ${styles.border} bg-neutral-900/50 backdrop-blur-xl p-1 transition-all hover:shadow-xl ${styles.glow}`}
                                >
                                    <div className="rounded-xl bg-neutral-950/50 p-6">
                                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                                            {/* Supplier Info */}
                                            <div className="flex items-center gap-4">
                                                <div className={`flex h-14 w-14 items-center justify-center rounded-xl text-xl font-bold ${styles.bg} ${styles.text}`}>
                                                    {supplier.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-xl font-bold text-white group-hover:text-orange-200 transition-colors">{supplier.name}</h3>
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles.bg} ${styles.text}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${styles.text.replace('text-', 'bg-')}`} />
                                                            {supplier.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 mt-1 text-sm text-neutral-500">
                                                        <span className="flex items-center gap-1">
                                                            <Star size={12} className="text-amber-400 fill-amber-400" />
                                                            {supplier.rating}
                                                        </span>
                                                        <span>{supplier.orders} pedidos</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Metrics */}
                                            <div className="grid grid-cols-3 gap-6 lg:gap-12">
                                                <div className="text-center lg:text-left">
                                                    <div className="flex items-center justify-center lg:justify-start gap-2 text-sm text-neutral-500 mb-1">
                                                        <ShieldCheck size={14} className="text-neutral-600" />
                                                        Confiabilidade
                                                    </div>
                                                    <div className="flex items-center justify-center lg:justify-start gap-2">
                                                        <span className="text-2xl font-bold text-white">{supplier.reliability}%</span>
                                                        <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${supplier.reliability}%` }}
                                                                transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                                                                className={`h-full rounded-full ${supplier.reliability >= 90 ? 'bg-emerald-500' : supplier.reliability >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-center lg:text-left">
                                                    <div className="flex items-center justify-center lg:justify-start gap-2 text-sm text-neutral-500 mb-1">
                                                        <Clock size={14} className="text-neutral-600" />
                                                        Lead Time
                                                    </div>
                                                    <span className="text-2xl font-bold text-white">{supplier.avgLeadTime}</span>
                                                </div>
                                                <div className="text-center lg:text-left">
                                                    <div className="flex items-center justify-center lg:justify-start gap-2 text-sm text-neutral-500 mb-1">
                                                        <AlertTriangle size={14} className="text-neutral-600" />
                                                        Risco
                                                    </div>
                                                    <span className={`text-2xl font-bold ${styles.text}`}>{supplier.risk}</span>
                                                </div>
                                            </div>

                                            {/* Action */}
                                            <button className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-neutral-400 hover:text-white hover:bg-white/10 transition-all group/btn">
                                                Ver Detalhes
                                                <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Bottom CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 flex flex-col lg:flex-row items-center justify-between gap-4"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-orange-500/20 text-orange-400">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Deseja adicionar um novo fornecedor?</h3>
                                <p className="text-sm text-neutral-400">Cadastre parceiros e acompanhe métricas em tempo real.</p>
                            </div>
                        </div>
                        <button className="px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-medium transition-colors shadow-lg shadow-orange-500/20">
                            Adicionar Fornecedor
                        </button>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
