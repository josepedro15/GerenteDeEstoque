"use client";

import { motion } from "framer-motion";
import { DashboardMetrics } from "@/types/analytics";
import { formatCurrency } from "@/lib/formatters";

export function CoverageBar({ data }: { data: DashboardMetrics['charts']['coverageDistribution'] }) {
    // Calcular total e máx para escala
    const total = data.reduce((acc, d) => acc + d.value, 0);
    const maxValue = Math.max(...data.map(d => d.value));

    // Cores por faixa de cobertura
    const colors = [
        { bg: 'bg-red-500', text: 'text-red-400', ring: 'ring-red-500/20' },      // 0-7
        { bg: 'bg-orange-500', text: 'text-orange-400', ring: 'ring-orange-500/20' }, // 7-15
        { bg: 'bg-yellow-500', text: 'text-yellow-400', ring: 'ring-yellow-500/20' }, // 15-30
        { bg: 'bg-emerald-500', text: 'text-emerald-400', ring: 'ring-emerald-500/20' }, // 30-60
        { bg: 'bg-blue-500', text: 'text-blue-400', ring: 'ring-blue-500/20' },    // 60+
    ];

    return (
        <div className="rounded-[20px] bg-card p-6 h-full">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Cobertura de Estoque</h3>
                    <p className="text-xs text-muted-foreground">Distribuição por dias de cobertura</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{formatCurrency(total)}</p>
                    <p className="text-xs text-muted-foreground">total em estoque</p>
                </div>
            </div>

            <div className="space-y-3">
                {data.map((item, index) => {
                    const percentage = total > 0 ? (item.value / total) * 100 : 0;
                    const barWidth = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                    const color = colors[index] || colors[4];

                    return (
                        <motion.div
                            key={item.range}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="space-y-1"
                        >
                            <div className="flex items-center justify-between text-sm">
                                <span className={`font-medium ${color.text}`}>{item.range}</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-muted-foreground text-xs">
                                        {percentage.toFixed(1)}%
                                    </span>
                                    <span className="font-bold text-foreground min-w-[100px] text-right">
                                        {formatCurrency(item.value)}
                                    </span>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-2 bg-accent rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${barWidth}%` }}
                                    transition={{ delay: index * 0.1 + 0.2, duration: 0.5, ease: "easeOut" }}
                                    className={`h-full ${color.bg} rounded-full`}
                                />
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Legend / Summary */}
            <div className="mt-6 pt-4 border-t border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span>Crítico (0-15d)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Ideal (30-60d)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>Excesso (60+d)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
