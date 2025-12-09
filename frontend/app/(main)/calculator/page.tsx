"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Calculator as CalcIcon, TrendingUp } from "lucide-react";

export default function CalculatorPage() {
    const [totalSales, setTotalSales] = useState<number>(0);
    const [periodDays, setPeriodDays] = useState<number>(30); // Default to 30 days
    const [leadTime, setLeadTime] = useState<number>(0); // "Tempo de Entrega"
    const [safetyDays, setSafetyDays] = useState<number>(0); // "Dias de Margem"
    const [currentStock, setCurrentStock] = useState<number>(0);
    const [supplierPrice, setSupplierPrice] = useState<number>(0);

    // Calculations
    const dailyDemand = periodDays > 0 ? totalSales / periodDays : 0;
    const leadTimeDemand = dailyDemand * leadTime;

    // Safety Stock based on Days of Margin
    const safetyStock = dailyDemand * safetyDays;

    const rop = leadTimeDemand + safetyStock;
    const targetStock = rop * 1.5;
    const orderQty = Math.max(0, targetStock - currentStock);
    const estimatedCost = orderQty * supplierPrice;

    const handleReset = () => {
        setTotalSales(0);
        setPeriodDays(30);
        setLeadTime(0);
        setSafetyDays(0);
        setCurrentStock(0);
        setSupplierPrice(0);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Calculadora Simples</h1>
                    <p className="text-muted-foreground mt-1">Calcule sua compra usando termos do dia a dia.</p>
                </div>
                <Button variant="outline" onClick={handleReset} className="gap-2">
                    <RefreshCw size={16} />
                    Limpar
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Inputs */}
                <div className="space-y-6">
                    <div className="rounded-xl border border-white/10 bg-card/40 p-6 backdrop-blur-xl">
                        <h3 className="font-semibold text-white flex items-center gap-2 mb-6">
                            <CalcIcon className="text-blue-400" size={20} /> Dados de Entrada
                        </h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm text-muted-foreground">Vendas no Período (un)</label>
                                    <input
                                        type="number"
                                        value={totalSales || ''}
                                        onChange={(e) => setTotalSales(Number(e.target.value))}
                                        className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                                        placeholder="Ex: 300"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-muted-foreground">Dias do Período</label>
                                    <input
                                        type="number"
                                        value={periodDays || ''}
                                        onChange={(e) => setPeriodDays(Number(e.target.value))}
                                        className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                                        placeholder="Ex: 30"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-muted-foreground">Estoque Atual (Prateleira)</label>
                                <input
                                    type="number"
                                    value={currentStock || ''}
                                    onChange={(e) => setCurrentStock(Number(e.target.value))}
                                    className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                                    placeholder="Ex: 15"
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-muted-foreground">Preço do Fornecedor (R$)</label>
                                <input
                                    type="number"
                                    value={supplierPrice || ''}
                                    onChange={(e) => setSupplierPrice(Number(e.target.value))}
                                    className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                                    placeholder="Ex: 25.50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm text-muted-foreground">Tempo de Entrega (Dias)</label>
                                    <input
                                        type="number"
                                        value={leadTime || ''}
                                        onChange={(e) => setLeadTime(Number(e.target.value))}
                                        className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                                        placeholder="Ex: 5"
                                    />
                                    <p className="text-[10px] text-muted-foreground">Tempo para o fornecedor entregar.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-muted-foreground">Margem de Segurança (Dias)</label>
                                    <input
                                        type="number"
                                        value={safetyDays || ''}
                                        onChange={(e) => setSafetyDays(Number(e.target.value))}
                                        className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                                        placeholder="Ex: 10"
                                    />
                                    <p className="text-[10px] text-muted-foreground">Dias extras de estoque.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="rounded-xl border border-white/10 bg-blue-500/10 p-6 backdrop-blur-xl">
                            <p className="text-sm text-blue-300 mb-1">Ponto de Recompra (Minimo)</p>
                            <p className="text-3xl font-bold text-white">{rop.toFixed(0)} <span className="text-sm font-normal text-muted-foreground">un</span></p>
                            <p className="text-xs text-blue-200/50 mt-2">
                                Você deve comprar quando o estoque baixar para {rop.toFixed(0)} unidades.
                            </p>
                        </div>

                        <div className={`rounded-xl border p-6 backdrop-blur-xl transition-colors ${orderQty > 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-white/5 border-white/10'}`}>
                            <p className={`text-sm mb-1 ${orderQty > 0 ? 'text-green-400' : 'text-muted-foreground'}`}>Sugestão de Compra</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-4xl font-bold text-white">{orderQty.toFixed(0)}</p>
                                <span className="text-sm text-muted-foreground">un</span>
                            </div>

                            {supplierPrice > 0 && orderQty > 0 && (
                                <div className="mt-2 pt-2 border-t border-white/5">
                                    <p className="text-sm text-muted-foreground">Custo Estimado do Pedido:</p>
                                    <p className="text-lg font-semibold text-white">R$ {estimatedCost.toFixed(2)}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-card/20 p-6 backdrop-blur-md">
                        <h4 className="text-sm font-medium text-white mb-4">Entenda o Cálculo</h4>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Venda Diária Média</span>
                                <span className="text-white font-medium">{dailyDemand.toFixed(1)} un/dia</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Consumo na Entrega</span>
                                <span className="text-white font-medium">{leadTimeDemand.toFixed(0)} un</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Estoque de Segurança ({safetyDays} dias)</span>
                                <span className="text-white font-medium">{safetyStock.toFixed(0)} un</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
