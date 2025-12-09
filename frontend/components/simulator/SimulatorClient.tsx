"use client";

import { useState, useMemo } from "react";
import { StockAnalysis } from "@/app/actions/inventory";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface SimulatorClientProps {
    initialData: StockAnalysis[];
}

export function SimulatorClient({ initialData }: SimulatorClientProps) {
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [demandFactor, setDemandFactor] = useState<number>(0); // % change
    const [leadTimeFactor, setLeadTimeFactor] = useState<number>(0); // days change

    const selectedProduct = useMemo(() =>
        initialData.find(p => p.id_produto === selectedProductId),
        [selectedProductId, initialData]);

    // Simulation Calculations
    const simulated = useMemo(() => {
        if (!selectedProduct) return null;

        const originalDemand = selectedProduct.demanda_media_dia;
        // const originalLeadTime = selectedProduct.demanda_leadtime / (originalDemand || 1); // Approx lead time in days derived from total lead time demand / daily demand

        // If data is messy, fallback to standard calculation if fields exist
        // Let's assume standard formula: ROP = (AvgDailyDemand * LeadTime) + SafeStock

        const newDemand = originalDemand * (1 + demandFactor / 100);
        // Lead time in database might not be explicit as "days", but we have 'demanda_leadtime' which is Demand * LT.
        // Let's approximate LT days if not present.
        // Actually, let's use a simpler approach:
        // Lead Time Demand = Daily Demand * Lead Time Days.
        // If we change Lead Time Days by +X days, we add X * Daily Demand to the Lead Time Demand.

        const currentLeadTimeDays = selectedProduct.demanda_leadtime / (selectedProduct.demanda_media_dia || 1);
        const newLeadTimeDays = currentLeadTimeDays + leadTimeFactor;

        const newLeadTimeDemand = newDemand * newLeadTimeDays;

        // Safety Stock Simulation (Simplified: proportional to demand variance root, but here linear to demand and LT)
        // Let's assume Safe Stock scales with sqrt of Lead Time and linear with Demand variability.
        // For this simulator, let's keep it simple: Safe Stock scales with Demand.
        const newSafeStock = selectedProduct.estoque_seguranca * (1 + demandFactor / 100);

        const newROP = newLeadTimeDemand + newSafeStock;

        // Re-calculate Order Qty (Target - Current) or just standard EOQ adjustment
        const newTarget = newROP * 1.5; // Heuristic: Target is usually higher than ROP
        const newOrderQty = Math.max(0, newTarget - selectedProduct.estoque_atual);

        return {
            demand: newDemand,
            leadTimeDays: newLeadTimeDays,
            leadTimeDemand: newLeadTimeDemand,
            safeStock: newSafeStock,
            rop: newROP,
            orderQty: newOrderQty,
            target: newTarget
        };
    }, [selectedProduct, demandFactor, leadTimeFactor]);

    const [searchTerm, setSearchTerm] = useState("");

    const filteredData = useMemo(() => {
        return initialData.filter(item =>
            item.nome_produto.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.codigo_produto.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [initialData, searchTerm]);

    if (!selectedProduct) {
        return (
            <div className="flex flex-col gap-6">
                <div className="rounded-xl border border-white/5 bg-card/60 p-8 pt-6 backdrop-blur-xl">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-white mb-2">Selecione um produto para simular</h2>
                        <input
                            type="text"
                            placeholder="Buscar produto por nome ou SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                        {filteredData.map(item => (
                            <button
                                key={item.id_produto}
                                onClick={() => setSelectedProductId(item.id_produto)}
                                className="flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors text-left group"
                            >
                                <div className="h-10 w-10 shrink-0 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs group-hover:bg-blue-500/30 transition-colors">
                                    {item.codigo_produto.slice(-3)}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-medium text-white truncate text-sm">{item.nome_produto}</p>
                                    <p className="text-xs text-muted-foreground">Estoque: {item.estoque_atual}</p>
                                </div>
                            </button>
                        ))}

                        {filteredData.length === 0 && (
                            <div className="col-span-full py-12 text-center text-muted-foreground">
                                Nenhum produto encontrado.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => {
                        setSelectedProductId(null);
                        setDemandFactor(0);
                        setLeadTimeFactor(0);
                    }}>
                        ← Voltar
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold text-white">{selectedProduct.nome_produto}</h2>
                        <p className="text-muted-foreground text-sm">SKU: {selectedProduct.codigo_produto}</p>
                    </div>
                </div>
                <Button variant="outline" onClick={() => {
                    setDemandFactor(0);
                    setLeadTimeFactor(0);
                }} className="gap-2">
                    <RefreshCw size={16} />
                    Resetar
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Controls */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="rounded-xl border border-white/10 bg-card/40 p-6 backdrop-blur-xl space-y-6">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            <SettingsIcon /> Parâmetros de Simulação
                        </h3>

                        {/* Demand Slider */}
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Variação de Demanda</span>
                                <span className={demandFactor > 0 ? "text-green-400" : demandFactor < 0 ? "text-red-400" : "text-white"}>
                                    {demandFactor > 0 ? "+" : ""}{demandFactor}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min="-50"
                                max="100"
                                value={demandFactor}
                                onChange={(e) => setDemandFactor(Number(e.target.value))}
                                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>-50%</span>
                                <span>0%</span>
                                <span>+100%</span>
                            </div>
                        </div>

                        {/* Lead Time Slider */}
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Variação de Lead Time (Dias)</span>
                                <span className={leadTimeFactor > 0 ? "text-red-400" : leadTimeFactor < 0 ? "text-green-400" : "text-white"}>
                                    {leadTimeFactor > 0 ? "+" : ""}{leadTimeFactor} dias
                                </span>
                            </div>
                            <input
                                type="range"
                                min="-10"
                                max="30"
                                value={leadTimeFactor}
                                onChange={(e) => setLeadTimeFactor(Number(e.target.value))}
                                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>-10 dias</span>
                                <span>0 dias</span>
                                <span>+30 dias</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="rounded-xl border border-white/10 bg-blue-500/5 p-6 backdrop-blur-xl">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="text-blue-400 mt-1" size={20} />
                            <div>
                                <h4 className="text-sm font-medium text-blue-300">Insights</h4>
                                <p className="text-xs text-blue-200/60 mt-1">
                                    Aumentar a demanda em {demandFactor}% exigirá um aumento de estoque de segurança de approximately {simulated?.safeStock.toFixed(0)} un para manter o nível de serviço.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Visualization */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <MetricCard
                            label="Demanda Diária"
                            current={selectedProduct.demanda_media_dia}
                            simulated={simulated?.demand || 0}
                            format={(v: number) => v.toFixed(1)}
                        />
                        <MetricCard
                            label="Ponto de Pedido (ROP)"
                            current={selectedProduct.rop}
                            simulated={simulated?.rop || 0}
                            format={(v: number) => v.toFixed(0)}
                            highlight
                        />
                        <MetricCard
                            label="Sugestão de Compra"
                            current={selectedProduct.quantidade_sugerida}
                            simulated={simulated?.orderQty || 0}
                            format={(v: number) => v.toFixed(0)}
                            highlight
                        />
                    </div>

                    {/* Comparison Chart Area */}
                    <div className="rounded-xl border border-white/10 bg-card/40 p-6 backdrop-blur-xl min-h-[300px] flex flex-col justify-center">
                        <h3 className="text-sm font-medium text-muted-foreground mb-6">Comparativo de Estoque Necessário</h3>

                        {/* Simple CSS Bar Chart */}
                        <div className="space-y-6">
                            <BarRow label="Estoque de Segurança" current={selectedProduct.estoque_seguranca} simulated={simulated?.safeStock || 0} color="bg-yellow-500" />
                            <BarRow label="Estoque de Ciclo (Lead Time)" current={selectedProduct.demanda_leadtime} simulated={simulated?.leadTimeDemand || 0} color="bg-blue-500" />
                            <BarRow label="Estoque Máximo (Alvo)" current={selectedProduct.estoque_alvo} simulated={simulated?.target || 0} color="bg-green-500" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface MetricCardProps {
    label: string;
    current: number;
    simulated: number;
    format: (value: number) => string;
    highlight?: boolean;
}

function MetricCard({ label, current, simulated, format, highlight = false }: MetricCardProps) {
    const diff = simulated - current;
    const percent = current > 0 ? (diff / current) * 100 : 0;

    return (
        <div className={`rounded-xl border p-4 backdrop-blur-xl transition-all ${highlight ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/10'}`}>
            <p className="text-xs text-muted-foreground mb-2">{label}</p>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{format(simulated)}</span>
                <span className="text-xs text-muted-foreground line-through opacity-50">{format(current)}</span>
            </div>
            <div className={`flex items-center gap-1 text-xs mt-2 ${diff > 0 ? 'text-red-400' : diff < 0 ? 'text-green-400' : 'text-gray-400'}`}>
                {diff > 0 ? <TrendingUp size={12} /> : diff < 0 ? <TrendingDown size={12} /> : null}
                <span>{diff > 0 ? "+" : ""}{format(diff)} ({percent.toFixed(1)}%)</span>
            </div>
        </div>
    )
}

interface BarRowProps {
    label: string;
    current: number;
    simulated: number;
    color: string;
}

function BarRow({ label, current, simulated, color }: BarRowProps) {
    const max = Math.max(current, simulated) * 1.5 || 100;

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-xs">
                <span className="text-white">{label}</span>
            </div>
            <div className="relative h-8 w-full bg-white/5 rounded-full overflow-hidden">
                {/* Simulated Bar */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(simulated / max) * 100}%` }}
                    className={`absolute top-0 left-0 h-full ${color} opacity-80 z-20`}
                />
                {/* Current Bar Marker */}
                <div
                    className="absolute top-0 h-full w-0.5 bg-white z-30"
                    style={{ left: `${(current / max) * 100}%` }}
                />
                <span className="absolute top-1/2 -translate-y-1/2 left-2 z-40 text-[10px] font-bold text-black/50 mix-blend-overlay">
                    {simulated.toFixed(0)}
                </span>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Simulado: {simulated.toFixed(0)}</span>
                <span>Atual: {current.toFixed(0)}</span>
            </div>
        </div>
    )
}

function SettingsIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1 1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
    )
}
