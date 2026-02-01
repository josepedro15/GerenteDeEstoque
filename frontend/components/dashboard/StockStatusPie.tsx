"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { DashboardMetrics } from "@/types/analytics";
import { motion } from "framer-motion";

export function StockStatusPie({ data }: { data: DashboardMetrics['charts']['statusDistribution'] }) {
    // Calcular total para percentuais
    const total = data.reduce((acc, d) => acc + d.value, 0);

    return (
        <div className="rounded-[20px] bg-card p-6 h-full">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Saúde do Estoque</h3>
                    <p className="text-xs text-muted-foreground">{total.toLocaleString('pt-BR')} SKUs analisados</p>
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Chart */}
                <div className="w-32 h-32 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={35}
                                outerRadius={50}
                                paddingAngle={3}
                                dataKey="value"
                                strokeWidth={0}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: any) => [value?.toLocaleString('pt-BR') || '0', 'SKUs']}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                    color: 'hsl(var(--foreground))'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-2">
                    {data.map((item, index) => {
                        const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
                        return (
                            <motion.div
                                key={item.name}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-sm text-foreground">{item.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-bold text-foreground">
                                        {item.value.toLocaleString('pt-BR')}
                                    </span>
                                    <span className="text-xs text-muted-foreground ml-1">
                                        ({percentage}%)
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
