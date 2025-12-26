"use client";

import { motion } from "framer-motion";
import { Skull, AlertTriangle, Flame, Eye, CheckCircle, ArrowRight } from "lucide-react";
import { DashboardMetrics } from "@/types/analytics";
import { formatCurrency } from "@/lib/formatters";

interface AlertPanelProps {
    alerts: DashboardMetrics['alerts'];
    risk: DashboardMetrics['risk'];
}

export function AlertPanel({ alerts, risk }: AlertPanelProps) {
    const cards = [
        {
            id: 'mortos',
            icon: Skull,
            label: 'Produtos Mortos',
            sublabel: 'Sem vendas em 60 dias',
            count: alerts.mortos.count,
            value: alerts.mortos.value,
            color: 'gray',
            bgGradient: 'from-gray-500/10 to-background',
            borderColor: 'border-gray-500/20',
            hoverBorder: 'hover:border-gray-500/40',
            textColor: 'text-gray-400',
            actionLabel: 'Liquidar itens',
        },
        {
            id: 'liquidar',
            icon: Flame,
            label: 'Liquidar Urgente',
            sublabel: 'Cobertura > 1 ano (Curva C)',
            count: alerts.liquidar.count,
            value: alerts.liquidar.value,
            color: 'red',
            bgGradient: 'from-red-500/10 to-background',
            borderColor: 'border-red-500/20',
            hoverBorder: 'hover:border-red-500/40',
            textColor: 'text-red-400',
            actionLabel: 'Criar promoção',
        },
        {
            id: 'ruptura',
            icon: AlertTriangle,
            label: 'Ruptura/Crítico',
            sublabel: 'Perdendo vendas agora',
            count: risk.ruptureCount,
            value: 0, // Calculado diferente
            color: 'orange',
            bgGradient: 'from-orange-500/10 to-background',
            borderColor: 'border-orange-500/20',
            hoverBorder: 'hover:border-orange-500/40',
            textColor: 'text-orange-400',
            actionLabel: 'Comprar urgente',
            showPercentage: true,
            percentage: risk.ruptureShare,
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 w-full"
        >
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {cards.map((card, index) => (
                    <motion.div
                        key={card.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        className={`relative overflow-hidden rounded-2xl border ${card.borderColor} bg-gradient-to-br ${card.bgGradient} p-6 transition-colors ${card.hoverBorder}`}
                    >
                        {/* Background Icon */}
                        <div className="absolute right-0 top-0 p-4 opacity-10">
                            <card.icon size={80} />
                        </div>

                        <div className="relative z-10">
                            {/* Header */}
                            <div className={`mb-2 flex items-center gap-2 ${card.textColor}`}>
                                <card.icon size={18} />
                                <span className="font-bold uppercase tracking-wider text-xs">
                                    {card.label}
                                </span>
                            </div>

                            {/* Count */}
                            <h3 className="text-3xl font-bold text-foreground mb-1">
                                {card.count.toLocaleString('pt-BR')}
                                <span className="text-lg font-normal text-muted-foreground ml-2">itens</span>
                            </h3>

                            {/* Value or Percentage */}
                            <p className="text-sm text-muted-foreground mb-4">
                                {card.showPercentage
                                    ? `${card.percentage?.toFixed(1)}% do estoque`
                                    : card.value > 0
                                        ? `${formatCurrency(card.value)} parados`
                                        : card.sublabel
                                }
                            </p>

                            {/* Action Button */}
                            {card.count > 0 && (
                                <button className={`group flex items-center gap-2 text-sm font-medium ${card.textColor} decoration-${card.color}-400/30 underline-offset-4 hover:underline`}>
                                    {card.actionLabel}
                                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
