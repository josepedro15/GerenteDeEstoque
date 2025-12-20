"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { DashboardMetrics } from "@/types/analytics";

interface TrendSummaryProps {
    trends: DashboardMetrics['trends'];
}

export function TrendSummary({ trends }: TrendSummaryProps) {
    const data = [
        {
            label: 'Subindo',
            icon: TrendingUp,
            count: trends.subindo.count,
            percentage: trends.subindo.percentage,
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10',
            description: 'Vendas crescendo'
        },
        {
            label: 'Estável',
            icon: Minus,
            count: trends.estavel.count,
            percentage: trends.estavel.percentage,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10',
            description: 'Demanda constante'
        },
        {
            label: 'Caindo',
            icon: TrendingDown,
            count: trends.caindo.count,
            percentage: trends.caindo.percentage,
            color: 'text-red-400',
            bgColor: 'bg-red-500/10',
            description: 'Vendas reduzindo'
        },
    ];

    return (
        <div className="rounded-[20px] bg-card p-6 h-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Tendências</h3>
                    <p className="text-xs text-muted-foreground">Últimos 30d vs anteriores</p>
                </div>
            </div>

            <div className="space-y-3">
                {data.map((item, index) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-center justify-between p-4 rounded-xl ${item.bgColor}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${item.bgColor}`}>
                                <item.icon size={20} className={item.color} />
                            </div>
                            <div>
                                <p className={`font-medium ${item.color}`}>{item.label}</p>
                                <p className="text-xs text-muted-foreground">{item.description}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-foreground">{item.count.toLocaleString('pt-BR')}</p>
                            <p className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
