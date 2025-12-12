"use client";

import { useState } from "react";
import { PurchaseSuggestion } from "@/types/analytics";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useChat } from "@/contexts/ChatContext";
import { ShoppingCart, Sparkles, AlertCircle } from "lucide-react";

export function RecommendationEngine({ suggestions }: { suggestions: PurchaseSuggestion[] }) {
    const { sendProductMessage } = useChat();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const toggleAll = () => {
        if (selectedIds.size === suggestions.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(suggestions.map(s => s.id)));
    };

    const selectedItems = suggestions.filter(s => selectedIds.has(s.id));
    const totalCost = selectedItems.reduce((acc, curr) => acc + curr.purchaseCost, 0);

    const handleAnalyze = () => {
        const payload = {
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
                            <th className="px-6 py-4">
                                <Checkbox
                                    checked={selectedIds.size === suggestions.length && suggestions.length > 0}
                                    onCheckedChange={toggleAll}
                                />
                            </th>
                            <th className="px-6 py-4 font-medium">Produto</th>
                            <th className="px-6 py-4 font-medium">Ação Sugerida (Lógica)</th>
                            <th className="px-6 py-4 font-medium">Qtd. Sugerida</th>
                            <th className="px-6 py-4 font-medium">Custo Estimado</th>
                            <th className="px-6 py-4 font-medium">Cobertura</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {suggestions.map((item) => (
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
                                        <p className="text-[10px] text-muted-foreground">SKU: {item.id}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <Badge variant="outline" className={`border ${getActionColor(item.suggestedAction)}`}>
                                        {item.suggestedAction}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4 text-white font-mono">
                                    {item.suggestedQty} un
                                </td>
                                <td className="px-6 py-4 text-white">
                                    {formatCurrency(item.purchaseCost)}
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
