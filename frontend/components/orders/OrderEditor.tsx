"use client";

import { useState } from "react";
import { OrderProposal, OrderProposalItem, saveOrderProposal } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, Trash2, ArrowLeft, ShoppingCart, Info, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";

interface OrderEditorProps {
    initialProposal: OrderProposal;
    onBack: () => void;
    leadTime?: number;
}

export function OrderEditor({ initialProposal, onBack, leadTime = 7 }: OrderEditorProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [items, setItems] = useState<OrderProposalItem[]>(initialProposal.items);
    const [summary, setSummary] = useState(initialProposal.summary);

    const totalCost = items.reduce((acc, item) => acc + (item.cost * item.suggestedQuantity), 0);
    const totalItems = items.reduce((acc, item) => acc + item.suggestedQuantity, 0);

    const updateQuantity = (index: number, qty: number) => {
        const newItems = [...items];
        newItems[index].suggestedQuantity = Math.max(0, qty);
        setItems(newItems);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleExportPDF = async () => {
        const element = document.getElementById("order-proposal-content");
        if (!element) return;

        try {
            // Clone the element to render it fully expanded (off-screen)
            // This prevents viewport truncation vs scrollHeight issues
            const clone = element.cloneNode(true) as HTMLElement;

            // Set styles to ensure full capture
            clone.style.position = 'absolute';
            clone.style.top = '-9999px';
            clone.style.left = '0';
            clone.style.width = '1200px'; // Fixed width for high-res capture
            clone.style.height = 'auto';
            clone.style.overflow = 'visible';
            clone.style.zIndex = '-1';

            // Remove no-print elements from clone
            const noPrints = clone.querySelectorAll('.no-print');
            noPrints.forEach(el => el.remove());

            // Append to body so it renders
            document.body.appendChild(clone);

            // Wait a moment for images/fonts to settle (optional but safer)
            await new Promise(resolve => setTimeout(resolve, 100));

            const dataUrl = await toPng(clone, {
                quality: 0.95,
                backgroundColor: "#ffffff",
                // Capture the full scroll dimensions of the CLONE
                width: clone.scrollWidth,
                height: clone.scrollHeight
            });

            // Clean up immediately after capture
            document.body.removeChild(clone);

            const pdf = new jsPDF({
                orientation: "landscape",
                unit: "mm",
                format: "a4"
            });

            const imgProps = pdf.getImageProperties(dataUrl);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

            let heightLeft = imgHeight;
            let position = 0;

            // First page
            pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;

            // Subsequent pages
            while (heightLeft > 0) {
                position -= pdfHeight; // Move image up
                pdf.addPage();
                pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfHeight;
            }

            pdf.save(`pedido_${initialProposal.supplierName.replace(/\s+/g, '_').toLowerCase()}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Erro ao gerar PDF. Tente novamente.");
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Update proposal with current items/quantities
            const currentProposal: OrderProposal = {
                ...initialProposal,
                items: items,
                totalCost: totalCost
            };

            const result = await saveOrderProposal(currentProposal, leadTime);
            if (result.success) {
                alert("Pedido salvo com sucesso!");
            } else {
                alert("Erro ao salvar: " + result.error);
            }
        } catch (e) {
            console.error(e);
            alert("Erro ao salvar.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div id="order-proposal-content" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto p-4 bg-white">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft size={18} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <ShoppingCart className="text-indigo-600" />
                            Novo Pedido: {initialProposal.supplierName}
                        </h1>
                        <p className="text-muted-foreground text-sm">Revise os itens sugeridos pela IA antes de enviar.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleExportPDF} className="gap-2 no-print">
                        <Download size={16} /> Exportar PDF
                    </Button>

                </div>
            </div>

            {/* AI Summary */}
            <Card className="bg-indigo-50/50 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-900/30">
                <CardContent className="pt-6 flex gap-4">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full h-fit text-indigo-600">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-indigo-700 dark:text-indigo-400 mb-1">Análise do Assistente</h3>
                        <p className="text-sm text-foreground/80 leading-relaxed">{summary}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Order Table */}
            <Card>
                <CardHeader className="bg-muted/40 pb-4 border-b">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">Itens do Pedido</CardTitle>
                        <div className="text-right">
                            <div className="text-sm text-muted-foreground">Total Estimado</div>
                            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalCost)}</div>
                        </div>
                    </div>
                </CardHeader>
                <div className="table-container overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/20">
                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Produto</th>
                                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Status</th>
                                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Estoque</th>
                                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Custo Unit.</th>
                                <th className="text-right py-3 px-4 font-medium text-muted-foreground w-[120px]">Qtd. Pedido</th>
                                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Subtotal</th>
                                <th className="py-3 px-4 w-[50px]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {items.map((item, idx) => (
                                <tr key={item.productId} className="group hover:bg-muted/10">
                                    <td className="py-3 px-4">
                                        <div className="font-medium">{item.productName}</div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                            <Info size={10} />
                                            {item.reason}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <span className={cn(
                                            "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                                            item.status?.includes("Ruptura") ? "bg-red-50 text-red-600 border-red-200" :
                                                item.status?.includes("Crítico") ? "bg-amber-50 text-amber-600 border-amber-200" :
                                                    "bg-emerald-50 text-emerald-600 border-emerald-200"
                                        )}>
                                            {item.status?.replace(/[🔴🟢🟡🟠🟣⚪]/g, '').trim() || 'Normal'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right text-muted-foreground">
                                        {formatCurrency(item.currentStock).replace('R$', '')} {/* Hacky way to just show number if formatCurrency adds symbol, but wait, currentStock is qty? Check type. Ah type says number. Assuming quantity. */}
                                        {item.currentStock}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        {formatCurrency(item.cost)}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <Input
                                            type="number"
                                            value={item.suggestedQuantity}
                                            onChange={(e) => updateQuantity(idx, Number(e.target.value))}
                                            className="h-8 w-20 text-right font-bold ml-auto"
                                            min={0}
                                        />
                                    </td>
                                    <td className="py-3 px-4 text-right font-medium">
                                        {formatCurrency(item.cost * item.suggestedQuantity)}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeItem(idx)}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-muted-foreground italic">
                                        Nenhum item no pedido.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="bg-muted/20 font-medium">
                            <tr>
                                <td colSpan={4} className="py-3 px-4 text-right">Totais:</td>
                                <td className="py-3 px-4 text-right">{totalItems} itens</td>
                                <td className="py-3 px-4 text-right text-emerald-600 font-bold">{formatCurrency(totalCost)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </Card>

            <div className="flex justify-end gap-2 no-print">
                <Button variant="outline" onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Rascunho
                </Button>
            </div>
        </div>
    );
}
