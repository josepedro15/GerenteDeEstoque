"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { DashboardMetrics } from "@/types/analytics";
import { formatCurrency } from "@/lib/formatters";

export function CoverageBar({ data }: { data: DashboardMetrics['charts']['coverageDistribution'] }) {
    return (
        <div className="h-[300px] w-full rounded-xl border border-white/5 bg-white/5 p-6 backdrop-blur-md">
            <h3 className="text-lg font-semibold text-white mb-4">Distribuição de Valor por Cobertura</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                        dataKey="range"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        formatter={(value: number) => [formatCurrency(value), 'Valor em Estoque']}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: '#888' }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
