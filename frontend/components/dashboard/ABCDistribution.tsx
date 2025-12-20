"use client";

import { motion } from "framer-motion";
import { DashboardMetrics } from "@/types/analytics";
import { formatCurrency } from "@/lib/formatters";

interface ABCDistributionProps {
    abc: DashboardMetrics['abc'];
}

export function ABCDistribution({ abc }: ABCDistributionProps) {
    const data = [
        {
            label: 'Curva A',
            count: abc.a.count,
            percentage: abc.a.percentage,
            value: abc.a.value,
            color: 'bg-emerald-500',
            textColor: 'text-emerald-400',
            description: '80% do faturamento'
        },
        {
            label: 'Curva B',
            count: abc.b.count,
            percentage: abc.b.percentage,
            value: abc.b.value,
            color: 'bg-blue-500',
            textColor: 'text-blue-400',
            description: '15% do faturamento'
        },
        {
            label: 'Curva C',
            count: abc.c.count,
            percentage: abc.c.percentage,
            value: abc.c.value,
            color: 'bg-gray-500',
            textColor: 'text-gray-400',
            description: '5% do faturamento'
        },
    ];

    const maxPercentage = Math.max(...data.map(d => d.percentage));

    return (
        <div className="rounded-[20px] bg-card p-6 h-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Curva ABC</h3>
                    <p className="text-xs text-muted-foreground">Distribuição por faturamento</p>
                </div>
            </div>

            <div className="space-y-4">
                {data.map((item, index) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                                <span className={`font-medium ${item.textColor}`}>{item.label}</span>
                                <span className="text-xs text-muted-foreground">({item.description})</span>
                            </div>
                            <div className="text-right">
                                <span className="font-bold text-foreground">{item.count.toLocaleString('pt-BR')}</span>
                                <span className="text-xs text-muted-foreground ml-1">({item.percentage.toFixed(1)}%)</span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 bg-accent rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(item.percentage / maxPercentage) * 100}%` }}
                                transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                                className={`h-full ${item.color} rounded-full`}
                            />
                        </div>

                        {/* Value */}
                        <p className="text-xs text-muted-foreground mt-1">
                            {formatCurrency(item.value)} em estoque
                        </p>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
