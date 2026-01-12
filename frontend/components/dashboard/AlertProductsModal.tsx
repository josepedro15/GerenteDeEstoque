"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Package, AlertTriangle, Skull, Flame, Loader2, ChevronDown, Wand2 } from "lucide-react";
import { getStockDataPaginated, PaginatedStockResult } from "@/app/actions/inventory";
import { sendActionPlanRequest } from "@/app/actions/action-plan";
import { EstoqueDetalhe } from "@/types/estoque";
import { formatCurrency, parseNumber } from "@/lib/formatters";

export type AlertType = 'mortos' | 'liquidar' | 'ruptura';

interface AlertProductsModalProps {
    isOpen: boolean;
    onClose: () => void;
    alertType: AlertType;
}

const alertConfig: Record<AlertType, {
    label: string;
    sublabel: string;
    icon: typeof Skull;
    color: string;
    bgGradient: string;
    borderColor: string;
    filterValue: string;
}> = {
    mortos: {
        label: 'Produtos Mortos',
        sublabel: 'Sem vendas em 60 dias',
        icon: Skull,
        color: 'text-gray-400',
        bgGradient: 'from-gray-500/20 to-background',
        borderColor: 'border-gray-500/30',
        filterValue: 'MORTO'
    },
    liquidar: {
        label: 'Liquidar Urgente',
        sublabel: 'Cobertura > 1 ano (Curva C)',
        icon: Flame,
        color: 'text-red-400',
        bgGradient: 'from-red-500/20 to-background',
        borderColor: 'border-red-500/30',
        filterValue: 'LIQUIDAR'
    },
    ruptura: {
        label: 'Ruptura/Crítico',
        sublabel: 'Perdendo vendas agora',
        icon: AlertTriangle,
        color: 'text-orange-400',
        bgGradient: 'from-orange-500/20 to-background',
        borderColor: 'border-orange-500/30',
        filterValue: 'RUPTURA'
    }
};

export function AlertProductsModal({ isOpen, onClose, alertType }: AlertProductsModalProps) {
    const [items, setItems] = useState<EstoqueDetalhe[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [totalValue, setTotalValue] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [sendingPlan, setSendingPlan] = useState(false);

    const config = alertConfig[alertType];
    const Icon = config.icon;

    useEffect(() => {
        if (isOpen) {
            setItems([]);
            setPage(1);
            loadItems(1);
        }
    }, [isOpen, alertType]);

    async function loadItems(pageNum: number) {
        setLoading(true);
        try {
            const result = await getStockDataPaginated(pageNum, 20, {
                alerta: config.filterValue
            });

            if (pageNum === 1) {
                setItems(result.items);
            } else {
                setItems(prev => [...prev, ...result.items]);
            }

            setTotalCount(result.totalCount);
            setTotalValue(result.totalValue || 0);
            setHasMore(result.currentPage < result.totalPages);
            setPage(pageNum);
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
        } finally {
            setLoading(false);
        }
    }

    function handleLoadMore() {
        if (!loading && hasMore) {
            loadItems(page + 1);
        }
    }

    async function handleSendToAgent() {
        setSendingPlan(true);
        try {
            const payload = {
                action: 'criar_plano_acao',
                alertType: alertType,
                alertLabel: config.label,
                totalQuantity: totalCount,
                totalValue: totalValue,
                message: `Preciso de um plano de ação para ${config.label.toLowerCase()}. Tenho ${totalCount.toLocaleString('pt-BR')} itens parados totalizando ${formatCurrency(totalValue)}.`
            };

            const result = await sendActionPlanRequest(payload);

            if (result.success) {
                // Close modal after success
                onClose();
            } else {
                console.error('Erro:', result.message);
            }
        } catch (error) {
            console.error('Erro ao enviar para o agente:', error);
        } finally {
            setSendingPlan(false);
        }
    }

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-4 z-50 flex items-center justify-center pointer-events-none"
                    >
                        <div
                            className={`relative w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-3xl border ${config.borderColor} bg-gradient-to-br ${config.bgGradient} backdrop-blur-xl shadow-2xl pointer-events-auto`}
                        >
                            {/* Header */}
                            <div className="sticky top-0 z-10 flex flex-col gap-4 p-6 border-b border-white/10 bg-background/80 backdrop-blur-xl">
                                {/* Action Button - Top */}
                                <button
                                    onClick={handleSendToAgent}
                                    disabled={sendingPlan || totalCount === 0}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-white font-medium shadow-lg shadow-purple-500/20"
                                >
                                    {sendingPlan ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Gerando plano de ação...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 size={18} />
                                            Criar plano de ação ({totalCount.toLocaleString('pt-BR')} itens • {formatCurrency(totalValue)})
                                        </>
                                    )}
                                </button>

                                {/* Title Row */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${config.bgGradient} ${config.borderColor} border`}>
                                            <Icon size={24} className={config.color} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-foreground">{config.label}</h2>
                                            <p className="text-sm text-muted-foreground">
                                                {config.sublabel} • {totalCount.toLocaleString('pt-BR')} produtos
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                                    >
                                        <X size={20} className="text-muted-foreground" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="overflow-y-auto max-h-[calc(85vh-100px)] p-6">
                                {loading && items.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                        <p className="mt-4 text-muted-foreground">Carregando produtos...</p>
                                    </div>
                                ) : items.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <Package className="h-12 w-12 text-muted-foreground/50" />
                                        <p className="mt-4 text-muted-foreground">Nenhum produto encontrado</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Table */}
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-white/10">
                                                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Produto</th>
                                                        <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Estoque</th>
                                                        <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Cobertura</th>
                                                        <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor</th>
                                                        <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Curva</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {items.map((item, index) => (
                                                        <motion.tr
                                                            key={item.id_produto || index}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: index * 0.02 }}
                                                            className="hover:bg-white/5 transition-colors"
                                                        >
                                                            <td className="py-3 px-4">
                                                                <div>
                                                                    <p className="font-medium text-foreground truncate max-w-[300px]">
                                                                        {item.produto_descricao || 'Sem descrição'}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {item.id_produto}
                                                                    </p>
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-4 text-right font-mono text-sm text-foreground">
                                                                {parseNumber(item.estoque_atual).toLocaleString('pt-BR')}
                                                            </td>
                                                            <td className="py-3 px-4 text-right font-mono text-sm">
                                                                <span className={
                                                                    parseNumber(item.dias_de_cobertura) <= 7 ? 'text-red-400' :
                                                                        parseNumber(item.dias_de_cobertura) <= 30 ? 'text-orange-400' :
                                                                            'text-foreground'
                                                                }>
                                                                    {parseNumber(item.dias_de_cobertura).toFixed(0)} dias
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4 text-right font-mono text-sm text-foreground">
                                                                {formatCurrency(parseNumber(item.valor_estoque_custo || '0'))}
                                                            </td>
                                                            <td className="py-3 px-4 text-center">
                                                                <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${item.classe_abc === 'A' ? 'bg-emerald-500/20 text-emerald-400' :
                                                                    item.classe_abc === 'B' ? 'bg-blue-500/20 text-blue-400' :
                                                                        'bg-gray-500/20 text-gray-400'
                                                                    }`}>
                                                                    {item.classe_abc || 'C'}
                                                                </span>
                                                            </td>
                                                        </motion.tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Load More */}
                                        {hasMore && (
                                            <div className="mt-6 flex justify-center">
                                                <button
                                                    onClick={handleLoadMore}
                                                    disabled={loading}
                                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium ${config.color}`}
                                                >
                                                    {loading ? (
                                                        <>
                                                            <Loader2 size={16} className="animate-spin" />
                                                            Carregando...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronDown size={16} />
                                                            Carregar mais ({totalCount - items.length} restantes)
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
