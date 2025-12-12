"use client";

import { useState, useMemo } from "react";
import { PurchaseSuggestion } from "@/types/analytics";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useChat } from "@/contexts/ChatContext";
import { ShoppingCart, Sparkles, AlertCircle, ArrowUpDown } from "lucide-react";

export function RecommendationEngine({ suggestions }: { suggestions: PurchaseSuggestion[] }) {
    const { sendProductMessage } = useChat();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [sortCriteria, setSortCriteria] = useState<string>("impacto");

    const sortedSuggestions = useMemo(() => {
        return [...suggestions].sort((a, b) => {
            switch (sortCriteria) {
                case "impacto": return b.totalValue - a.totalValue; // Capital tied
                case "quantidade": return b.currentStock - a.currentStock;
                case "valor": return b.price - a.price;
                case "sugestao": return b.suggestedQty - a.suggestedQty;
                default: return 0;
            }
        });
    }, [suggestions, sortCriteria]);

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const toggleAll = () => {
        if (selectedIds.size === sortedSuggestions.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(sortedSuggestions.map(s => s.id)));
    };

    const selectedItems = sortedSuggestions.filter(s => selectedIds.has(s.id));
    const totalCost = selectedItems.reduce((acc, curr) => acc + curr.purchaseCost, 0);

    const handleAnalyze = () => {
        const payload = {
            tipo_analise: "ANALISE DE QUEIMA",
            is_purchase_plan: true,
            total_investimento: totalCost,
            sku_count: selectedItems.length,
            itens: selectedItems.map(s => ({
                sku: s.id,
                nome: s.name,
                sugestao: s.suggestedQty,
                motivo: s.suggestedAction,
                custo_est: s.purchaseCost
            })),
            contexto: "O usuário selecionou estes itens para um possível pedido de compra. Analise a viabilidade, riscos e sugira negociações."
        };

        sendProductMessage(payload);
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'Comprar Urgente': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'Comprar': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
            case 'Queimar Estoque': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            default: return 'text-muted-foreground bg-white/5 border-white/10';
        }
    };

    return (
        <div className="space-y-4">
            {/* Controls Bar */}
            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <ArrowUpDown size={14} /> Ordenar por:
                    </span>
                    <Select value={sortCriteria} onValueChange={setSortCriteria}>
                        <SelectTrigger className="w-[180px] bg-black/20 border-white/10 text-white">
                            <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="impacto">Maior Valor em Estoque</SelectItem>
                            <SelectItem value="quantidade">Maior Quantidade</SelectItem>
                            <SelectItem value="valor">Maior Preço (Venda)</SelectItem>
                            <SelectItem value="sugestao">Maior Sugestão Compra</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Action Bar */}
            {selectedIds.size > 0 && (
                <div className="sticky top-4 z-50 flex items-center justify-between rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                            <ShoppingCart size={20} />
                        </div>
                        <div>
                            <p className="font-semibold text-white">{selectedIds.size} itens selecionados</p>
                            <p className="text-sm text-blue-200">Total Previsto: {formatCurrency(totalCost)}</p>
                        </div>
                    </div>
                    <Button onClick={handleAnalyze} className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Analisar Plano com IA
                    </Button>
                </div>
            )}

            {/* Table */}
            <div className="rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-xs uppercase text-muted-foreground">
                        <tr>
                            <th className="px-6 py-4 w-[40px]">
                                <Checkbox
                                    checked={selectedIds.size === sortedSuggestions.length && sortedSuggestions.length > 0}
                                    onCheckedChange={toggleAll}
                                />
                            </th>
                            <th className="px-6 py-4 font-medium">Produto</th>
                            <th className="px-6 py-4 font-medium">Estoque Atual</th>
                            <th className="px-6 py-4 font-medium">Valor Total</th>
                            <th className="px-6 py-4 font-medium">Sugestão</th>
                            <th className="px-6 py-4 font-medium">Custo / Preço</th>
                            <th className="px-6 py-4 font-medium">Cobertura</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {sortedSuggestions.map((item) => (
                            <tr key={item.id} className={`group hover:bg-white/5 transition-colors ${selectedIds.has(item.id) ? 'bg-blue-500/5' : ''}`}>
                                <td className="px-6 py-4">
                                    <Checkbox
                                        checked={selectedIds.has(item.id)}
                                        onCheckedChange={() => toggleSelection(item.id)}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <div>
                                        <p className="font-medium text-white max-w-[250px] truncate" title={item.name}>{item.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className={`border text-[10px] px-1 py-0 ${getActionColor(item.suggestedAction)}`}>
                                                {item.suggestedAction}
                                            </Badge>
                                            <p className="text-[10px] text-muted-foreground">SKU: {item.id}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-white">
                                    {item.currentStock} un
                                </td>
                                <td className="px-6 py-4 text-white font-medium">
                                    {formatCurrency(item.totalValue)}
                                </td>
                                <td className="px-6 py-4 text-white">
                                    <span className="font-mono bg-white/10 px-2 py-1 rounded text-xs">
                                        {item.suggestedQty > 0 ? `+${item.suggestedQty}` : '0'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xs">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-muted-foreground">C: {formatCurrency(item.cost)}</span>
                                        <span className="text-green-400">V: {formatCurrency(item.price)}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className={`flex items-center gap-2 ${item.coverageDays < 15 ? 'text-red-400' : 'text-green-400'}`}>
                                        {item.coverageDays.toFixed(0)} dias
                                        {item.coverageDays <= 0 && <AlertCircle size={12} />}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
