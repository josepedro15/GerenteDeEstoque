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
    const [sortCriteria, setSortCriteria] = useState<string>("prioridade");

    const sortedSuggestions = useMemo(() => {
        return [...suggestions].sort((a, b) => {
            switch (sortCriteria) {
                case "prioridade": {
                    const priorities: Record<string, number> = {
                        'Comprar Urgente': 4, 'Comprar': 3, 'Aguardar': 2, 'Queimar Estoque': 1
                    };
                    const prioA = priorities[a.suggestedAction] || 0;
                    const prioB = priorities[b.suggestedAction] || 0;
                    if (prioA !== prioB) return prioB - prioA;
                    // Mesma prioridade: menor cobertura primeiro (mais urgente)
                    return a.coverageDays - b.coverageDays;
                }
                case "cobertura": return a.coverageDays - b.coverageDays; // Menor cobertura primeiro
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
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            if (newSet.size >= 5) {
                alert("Para garantir uma análise de alta qualidade, selecione no máximo 5 itens por vez.");
                return;
            }
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const toggleAll = () => {
        if (selectedIds.size > 0) {
            setSelectedIds(new Set());
        } else {
            // Select top 5 or all if less than 5
            const limit = Math.min(5, sortedSuggestions.length);
            const topItems = sortedSuggestions.slice(0, limit).map(s => s.id);
            setSelectedIds(new Set(topItems));
        }
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
                estoque_atual: s.currentStock,
                custo_unit: s.cost,
                preco_venda: s.price,
                valor_total_estoque: s.totalValue,
                cobertura: s.coverageDays,
                sugestao_compra: s.suggestedQty,
                motivo: s.suggestedAction,
                custo_estimado_compra: s.purchaseCost
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
            default: return 'text-muted-foreground bg-accent border-border';
        }
    };

    return (
        <div className="space-y-4">
            {/* Controls Bar */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-accent p-4 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <ArrowUpDown size={14} /> Ordenar por:
                    </span>
                    <Select value={sortCriteria} onValueChange={setSortCriteria}>
                        <SelectTrigger className="w-[180px] bg-muted border-border text-foreground">
                            <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="prioridade">Prioridade de Compra</SelectItem>
                            <SelectItem value="cobertura">Menor Cobertura (Urgente)</SelectItem>
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
                            <p className="font-semibold text-foreground">{selectedIds.size} itens selecionados</p>
                            <p className="text-sm text-blue-200">Total Previsto: {formatCurrency(totalCost)}</p>
                        </div>
                    </div>
                    <Button onClick={handleAnalyze} className="bg-blue-600 hover:bg-blue-500 text-foreground shadow-lg shadow-blue-500/20">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Analisar Plano com IA
                    </Button>
                </div>
            )}

            {/* Table */}
            <div className="rounded-xl border border-border bg-accent backdrop-blur-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-accent text-xs uppercase text-muted-foreground">
                        <tr>
                            <th className="px-6 py-4 w-[40px]">
                                <Checkbox
                                    checked={selectedIds.size > 0}
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
                            <tr key={item.id} className={`group hover:bg-accent transition-colors ${selectedIds.has(item.id) ? 'bg-blue-500/5' : ''}`}>
                                <td className="px-6 py-4">
                                    <Checkbox
                                        checked={selectedIds.has(item.id)}
                                        onCheckedChange={() => toggleSelection(item.id)}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <div>
                                        <p className="font-medium text-foreground max-w-[250px] truncate" title={item.name}>{item.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className={`border text-[10px] px-1 py-0 ${getActionColor(item.suggestedAction)}`}>
                                                {item.suggestedAction}
                                            </Badge>
                                            <p className="text-[10px] text-muted-foreground">SKU: {item.id}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-foreground">
                                    {item.currentStock} un
                                </td>
                                <td className="px-6 py-4 text-foreground font-medium">
                                    {formatCurrency(item.totalValue)}
                                </td>
                                <td className="px-6 py-4 text-foreground">
                                    <span className="font-mono bg-accent px-2 py-1 rounded text-xs">
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
