"use client";

import { motion } from "framer-motion";
import { ShoppingCart, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { PriorityActionItem } from "@/types/analytics";
import { formatCurrency } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";

interface PriorityActionListProps {
    actions: PriorityActionItem[];
}

const priorityColors: Record<string, { bg: string; text: string; border: string }> = {
    '1-URGENTE': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
    '2-ALTA': { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
    '3-MEDIA': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    '4-BAIXA': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
};

const abcColors: Record<string, string> = {
    'A': 'bg-emerald-500/20 text-emerald-400',
    'B': 'bg-blue-500/20 text-blue-400',
    'C': 'bg-gray-500/20 text-gray-400',
};

function getTrendIcon(tendencia: string) {
    if (tendencia.includes('Subindo') || tendencia.includes('Novo')) {
        return <TrendingUp size={14} className="text-emerald-400" />;
    }
    if (tendencia.includes('Caindo')) {
        return <TrendingDown size={14} className="text-red-400" />;
    }
    return <Minus size={14} className="text-muted-foreground" />;
}

export function PriorityActionList({ actions }: PriorityActionListProps) {
    if (actions.length === 0) {
        return (
            <div className="rounded-[20px] bg-card p-8 text-center">
                <ShoppingCart className="mx-auto mb-4 text-muted-foreground" size={48} />
                <p className="text-muted-foreground">Nenhuma ação prioritária no momento</p>
            </div>
        );
    }

    return (
        <div className="rounded-[20px] bg-card p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <ShoppingCart size={20} className="text-emerald-400" />
                    <h3 className="text-lg font-semibold text-foreground">Ações Prioritárias de Compra</h3>
                </div>
                <span className="text-xs text-muted-foreground">{actions.length} itens</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border text-muted-foreground text-xs uppercase">
                            <th className="text-left py-3 px-2">Prioridade</th>
                            <th className="text-left py-3 px-2">Produto</th>
                            <th className="text-center py-3 px-2">ABC</th>
                            <th className="text-right py-3 px-2">Estoque</th>
                            <th className="text-right py-3 px-2">Cobertura</th>
                            <th className="text-right py-3 px-2">Sugestão</th>
                            <th className="text-center py-3 px-2">Tendência</th>
                        </tr>
                    </thead>
                    <tbody>
                        {actions.slice(0, 20).map((action, index) => {
                            const prioStyle = priorityColors[action.prioridade] || priorityColors['4-BAIXA'];
                            const abcStyle = abcColors[action.classeAbc.toUpperCase()] || abcColors['C'];

                            return (
                                <motion.tr
                                    key={action.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="border-b border-border/50 hover:bg-accent/50 transition-colors"
                                >
                                    <td className="py-3 px-2">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${prioStyle.bg} ${prioStyle.text}`}>
                                            {action.prioridade === '1-URGENTE' && <AlertTriangle size={12} />}
                                            {action.prioridade.split('-')[1]}
                                        </span>
                                    </td>
                                    <td className="py-3 px-2">
                                        <div>
                                            <p className="font-medium text-foreground truncate max-w-[200px]" title={action.name}>
                                                {action.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">ID: {action.id}</p>
                                        </div>
                                    </td>
                                    <td className="py-3 px-2 text-center">
                                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${abcStyle}`}>
                                            {action.classeAbc.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="py-3 px-2 text-right font-mono text-foreground">
                                        {action.estoqueAtual.toLocaleString('pt-BR')}
                                    </td>
                                    <td className="py-3 px-2 text-right">
                                        <span className={action.diasCobertura < 7 ? 'text-red-400 font-bold' : 'text-foreground'}>
                                            {action.diasCobertura < 999 ? `${action.diasCobertura.toFixed(0)}d` : '∞'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-2 text-right">
                                        {action.sugestaoCompra > 0 && (
                                            <span className="text-emerald-400 font-bold">
                                                +{action.sugestaoCompra.toLocaleString('pt-BR')}
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 px-2 text-center">
                                        {getTrendIcon(action.tendencia)}
                                    </td>
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {actions.length > 20 && (
                <div className="mt-4 text-center">
                    <button className="text-sm text-muted-foreground hover:text-foreground">
                        Ver mais {actions.length - 20} itens...
                    </button>
                </div>
            )}
        </div>
    );
}
