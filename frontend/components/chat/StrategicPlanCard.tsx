"use client";

import { useState } from "react";
import {
    CheckCircle2,
    AlertTriangle,
    XCircle,
    TrendingUp,
    Package,
    Percent,
    Calendar,
    Sparkles,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StrategicPlan {
    status: 'aprovado' | 'ajuste_recomendado' | 'ajuste_necessario';
    mix_atual: { A: number; B: number; C: number; total: number };
    mix_percentual: { A: string; B: string; C: string };
    alertas: string[];
    produtos: Array<{
        id: number;
        nome: string;
        curva: string;
        estoque: number;
        preco?: number;
        desconto_sugerido: number;
        papel: string;
    }>;
    estimativas: {
        faturamento_potencial: number;
        desconto_medio: number;
    };
    tipo_campanha_sugerido: string;
    duracao_sugerida: string;
    nome_sugerido: string;
}

interface StrategicPlanCardProps {
    plan: StrategicPlan;
    onApprove: (products: any[]) => void;
    onAdjust?: () => void;
    isLoading?: boolean;
}

const statusConfig = {
    aprovado: {
        icon: CheckCircle2,
        color: 'text-green-500',
        bg: 'bg-green-500/10',
        border: 'border-green-500/30',
        label: 'Mix Aprovado'
    },
    ajuste_recomendado: {
        icon: AlertTriangle,
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/30',
        label: 'Ajuste Recomendado'
    },
    ajuste_necessario: {
        icon: XCircle,
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        label: 'Ajuste Necessário'
    }
};

const curvaColors: Record<string, string> = {
    'A': 'bg-blue-500',
    'B': 'bg-purple-500',
    'C': 'bg-orange-500'
};

const papelBadge: Record<string, { bg: string; text: string }> = {
    'chamariz': { bg: 'bg-blue-500/20', text: 'text-blue-400' },
    'suporte': { bg: 'bg-purple-500/20', text: 'text-purple-400' },
    'queima': { bg: 'bg-orange-500/20', text: 'text-orange-400' }
};

const tipoLabel: Record<string, string> = {
    'flash_sale': '⚡ Flash Sale',
    'queimao': '🔥 Queimão',
    'kit': '📦 Kit Promocional',
    'progressivo': '📈 Progressivo'
};

export function StrategicPlanCard({ plan, onApprove, onAdjust, isLoading }: StrategicPlanCardProps) {
    const [showProducts, setShowProducts] = useState(true);
    const status = statusConfig[plan.status] || statusConfig.ajuste_necessario;
    const StatusIcon = status.icon;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <div className={cn(
            "rounded-xl border p-4 space-y-4",
            "bg-card/50 backdrop-blur-sm",
            status.border
        )}>
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-yellow-500" />
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">
                            Plano Estratégico
                        </span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                        {plan.nome_sugerido || 'Nova Campanha'}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                            {tipoLabel[plan.tipo_campanha_sugerido] || plan.tipo_campanha_sugerido}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {plan.duracao_sugerida}
                        </span>
                    </div>
                </div>
                <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                    status.bg, status.color
                )}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {status.label}
                </div>
            </div>

            {/* Alertas */}
            {plan.alertas && plan.alertas.length > 0 && (
                <div className="space-y-2">
                    {plan.alertas.map((alerta, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
                        >
                            <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                            <span className="text-sm text-yellow-200">{alerta}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Mix ABC Visual */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Composição do Mix</span>
                    <span className="text-foreground font-medium">
                        {plan.mix_atual.total} produtos
                    </span>
                </div>

                {/* Progress bar style */}
                <div className="flex h-3 rounded-full overflow-hidden bg-muted/50">
                    {plan.mix_atual.A > 0 && (
                        <div
                            className="bg-blue-500 transition-all"
                            style={{ width: plan.mix_percentual.A }}
                            title={`Curva A: ${plan.mix_percentual.A}`}
                        />
                    )}
                    {plan.mix_atual.B > 0 && (
                        <div
                            className="bg-purple-500 transition-all"
                            style={{ width: plan.mix_percentual.B }}
                            title={`Curva B: ${plan.mix_percentual.B}`}
                        />
                    )}
                    {plan.mix_atual.C > 0 && (
                        <div
                            className="bg-orange-500 transition-all"
                            style={{ width: plan.mix_percentual.C }}
                            title={`Curva C: ${plan.mix_percentual.C}`}
                        />
                    )}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span className="text-muted-foreground">A: {plan.mix_percentual.A}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                        <span className="text-muted-foreground">B: {plan.mix_percentual.B}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                        <span className="text-muted-foreground">C: {plan.mix_percentual.C}</span>
                    </div>
                </div>
            </div>

            {/* Estimativas */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 text-green-400 mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs">Faturamento Potencial</span>
                    </div>
                    <span className="text-lg font-semibold text-green-400">
                        {formatCurrency(plan.estimativas.faturamento_potencial)}
                    </span>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-2 text-blue-400 mb-1">
                        <Percent className="w-4 h-4" />
                        <span className="text-xs">Desconto Médio</span>
                    </div>
                    <span className="text-lg font-semibold text-blue-400">
                        {plan.estimativas.desconto_medio}%
                    </span>
                </div>
            </div>

            {/* Produtos */}
            <div className="space-y-2">
                <button
                    onClick={() => setShowProducts(!showProducts)}
                    className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <span className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Produtos ({plan.produtos.length})
                    </span>
                    {showProducts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showProducts && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {plan.produtos.map((produto, i) => (
                            <div
                                key={produto.id || i}
                                className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm"
                            >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
                                        curvaColors[produto.curva] || 'bg-gray-500'
                                    )}>
                                        {produto.curva}
                                    </div>
                                    <span className="truncate text-foreground">
                                        {produto.nome}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-xs",
                                        papelBadge[produto.papel]?.bg || 'bg-gray-500/20',
                                        papelBadge[produto.papel]?.text || 'text-gray-400'
                                    )}>
                                        {produto.papel}
                                    </span>
                                    <span className="text-orange-400 font-medium">
                                        -{produto.desconto_sugerido}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
                <button
                    onClick={() => onApprove(plan.produtos)}
                    disabled={isLoading}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all",
                        "bg-green-600 hover:bg-green-500 text-white",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                >
                    {isLoading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Gerando...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-4 h-4" />
                            Aprovar e Gerar Ativos
                        </>
                    )}
                </button>
                {onAdjust && (
                    <button
                        onClick={onAdjust}
                        disabled={isLoading}
                        className={cn(
                            "px-4 py-2.5 rounded-lg font-medium transition-all",
                            "bg-muted hover:bg-muted/80 text-foreground",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                    >
                        Ajustar
                    </button>
                )}
            </div>
        </div>
    );
}
