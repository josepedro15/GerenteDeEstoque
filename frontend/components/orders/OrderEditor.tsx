"use client";

import { useState } from "react";
import { OrderProposal, OrderProposalItem, saveOrderProposal } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    ArrowLeft,
    Save,
    Loader2,
    CheckCircle2,
    Package,
    Trash2,
    AlertTriangle,
    TrendingUp,
} from "lucide-react";

interface OrderEditorProps {
    initialProposal: OrderProposal;
    onBack: () => void;
    leadTime: number;
}

export function OrderEditor({ initialProposal, onBack, leadTime }: OrderEditorProps) {
    const [items, setItems] = useState<OrderProposalItem[]>(initialProposal.items);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const totalCost = items.reduce((acc, item) => acc + item.cost * item.suggestedQuantity, 0);
    const totalItems = items.reduce((acc, item) => acc + item.suggestedQuantity, 0);

    const updateQuantity = (index: number, quantity: number) => {
        setItems((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], suggestedQuantity: Math.max(0, quantity) };
            return updated;
        });
    };

    const removeItem = (index: number) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const activeItems = items.filter((i) => i.suggestedQuantity > 0);
            const proposal: OrderProposal = {
                ...initialProposal,
                items: activeItems,
                totalCost,
            };
            const result = await saveOrderProposal(proposal, leadTime);
            if (result.success) {
                setSaved(true);
            } else {
                setError(result.error || "Erro ao salvar pedido.");
            }
        } catch {
            setError("Erro desconhecido ao salvar.");
        } finally {
            setSaving(false);
        }
    };

    const getStatusColor = (status: string) => {
        if (status?.includes("Ruptura")) return "text-red-600 bg-red-50 border-red-200";
        if (status?.includes("Crítico")) return "text-orange-600 bg-orange-50 border-orange-200";
        if (status?.includes("Atenção")) return "text-yellow-600 bg-yellow-50 border-yellow-200";
        return "text-green-600 bg-green-50 border-green-200";
    };

    if (saved) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4 animate-in fade-in">
                <div className="bg-green-100 p-4 rounded-full">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-xl font-bold">Pedido Salvo!</h2>
                <p className="text-muted-foreground text-center max-w-md">
                    Pedido para <strong>{initialProposal.supplierName}</strong> com{" "}
                    {items.filter((i) => i.suggestedQuantity > 0).length} itens salvo no histórico.
                </p>
                <div className="flex gap-2 mt-4">
                    <Button variant="outline" onClick={onBack}>
                        Voltar
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">
                            Pedido: {initialProposal.supplierName}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Lead Time: {leadTime} dias | {items.length} itens
                        </p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={saving || items.length === 0}>
                    {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <Save className="h-4 w-4 mr-2" />
                    )}
                    Salvar Pedido
                </Button>
            </div>

            {initialProposal.summary && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-blue-800">Análise da IA</p>
                        <p className="text-sm text-blue-700 mt-1">{initialProposal.summary}</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white border rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Total Itens</p>
                    <p className="text-2xl font-bold">{totalItems}</p>
                </div>
                <div className="bg-white border rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Produtos</p>
                    <p className="text-2xl font-bold">
                        {items.filter((i) => i.suggestedQuantity > 0).length}
                    </p>
                </div>
                <div className="bg-white border rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Custo Total Estimado</p>
                    <p className="text-2xl font-bold text-primary">
                        R$ {totalCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left p-3 font-medium">Produto</th>
                                <th className="text-center p-3 font-medium">Status</th>
                                <th className="text-center p-3 font-medium">Estoque</th>
                                <th className="text-center p-3 font-medium">Custo Unit.</th>
                                <th className="text-center p-3 font-medium w-32">Qtd. Pedido</th>
                                <th className="text-center p-3 font-medium">Subtotal</th>
                                <th className="text-center p-3 font-medium">Motivo</th>
                                <th className="text-center p-3 font-medium w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {items.map((item, index) => (
                                <tr key={item.productId} className="hover:bg-muted/30 transition-colors">
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                                            <div>
                                                <p className="font-medium truncate max-w-[200px]">
                                                    {item.productName}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {item.productId}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3 text-center">
                                        <span
                                            className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(item.status)}`}
                                        >
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-center font-mono">
                                        {item.currentStock}
                                    </td>
                                    <td className="p-3 text-center font-mono">
                                        R$ {item.cost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-3 text-center">
                                        <Input
                                            type="number"
                                            min={0}
                                            value={item.suggestedQuantity}
                                            onChange={(e) =>
                                                updateQuantity(index, parseInt(e.target.value) || 0)
                                            }
                                            className="w-24 mx-auto text-center"
                                        />
                                    </td>
                                    <td className="p-3 text-center font-mono font-medium">
                                        R${" "}
                                        {(item.cost * item.suggestedQuantity).toLocaleString("pt-BR", {
                                            minimumFractionDigits: 2,
                                        })}
                                    </td>
                                    <td className="p-3 text-center">
                                        <span className="text-xs text-muted-foreground">
                                            {item.reason}
                                        </span>
                                    </td>
                                    <td className="p-3 text-center">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-red-600"
                                            onClick={() => removeItem(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {items.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                        Nenhum item no pedido. Todos foram removidos.
                    </div>
                )}
            </div>
        </div>
    );
}
