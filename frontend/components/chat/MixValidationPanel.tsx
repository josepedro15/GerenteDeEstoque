"use client";

import { X, AlertTriangle, Sparkles, Filter, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MixValidation {
    canGenerate: boolean;
    status: 'ideal' | 'warning' | 'blocked';
    reason: string;
    title: string;
    description: string;
    suggestions: string[];
    warnings: string[];  // Alertas adicionais (ex: Curva A em estoque crítico)
    missingCurves: ('A' | 'B' | 'C')[];
    mixCount: { A: number; B: number; C: number; total: number };
    mixPercent: { A: number; B: number; C: number };
    riskProducts: Array<{ name: string; abc: string; status: string }>;  // Produtos em risco
}

interface MixValidationPanelProps {
    validation: MixValidation;
    onClose: () => void;
}

const curveColors = {
    A: { bg: 'bg-blue-500', text: 'text-blue-400', light: 'bg-blue-500/20' },
    B: { bg: 'bg-purple-500', text: 'text-purple-400', light: 'bg-purple-500/20' },
    C: { bg: 'bg-orange-500', text: 'text-orange-400', light: 'bg-orange-500/20' },
};

const curveLabels = {
    A: 'Chamariz',
    B: 'Suporte',
    C: 'Queima',
};

export function MixValidationPanel({ validation, onClose }: MixValidationPanelProps) {
    const { mixCount, mixPercent, missingCurves, status, title, description, suggestions } = validation;

    return (
        <div className="fixed left-4 right-4 bottom-4 z-[100] lg:absolute lg:left-full lg:right-auto lg:bottom-20 lg:ml-4 lg:w-80 lg:mb-0">
            <div className={cn(
                "rounded-xl border p-4 shadow-lg backdrop-blur-sm",
                status === 'blocked'
                    ? "bg-red-950/90 border-red-500/50"
                    : "bg-yellow-950/90 border-yellow-500/50"
            )}>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className={cn(
                            "w-5 h-5",
                            status === 'blocked' ? "text-red-400" : "text-yellow-400"
                        )} />
                        <h3 className={cn(
                            "font-semibold",
                            status === 'blocked' ? "text-red-300" : "text-yellow-300"
                        )}>
                            {title}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded hover:bg-white/10 transition-colors"
                    >
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>

                {/* Mix Bar */}
                <div className="mb-3">
                    <div className="text-xs text-muted-foreground mb-1">Mix Atual</div>
                    <div className="flex h-3 rounded-full overflow-hidden bg-muted/30">
                        {mixPercent.A > 0 && (
                            <div
                                className={cn("transition-all", curveColors.A.bg)}
                                style={{ width: `${mixPercent.A}%` }}
                                title={`A: ${mixPercent.A.toFixed(0)}%`}
                            />
                        )}
                        {mixPercent.B > 0 && (
                            <div
                                className={cn("transition-all", curveColors.B.bg)}
                                style={{ width: `${mixPercent.B}%` }}
                                title={`B: ${mixPercent.B.toFixed(0)}%`}
                            />
                        )}
                        {mixPercent.C > 0 && (
                            <div
                                className={cn("transition-all", curveColors.C.bg)}
                                style={{ width: `${mixPercent.C}%` }}
                                title={`C: ${mixPercent.C.toFixed(0)}%`}
                            />
                        )}
                    </div>
                    <div className="flex justify-between mt-1 text-[10px]">
                        <span className={curveColors.A.text}>A: {mixCount.A} ({mixPercent.A.toFixed(0)}%)</span>
                        <span className={curveColors.B.text}>B: {mixCount.B} ({mixPercent.B.toFixed(0)}%)</span>
                        <span className={curveColors.C.text}>C: {mixCount.C} ({mixPercent.C.toFixed(0)}%)</span>
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-3">
                    {description}
                </p>

                {/* Warnings (produtos Curva A em risco) */}
                {validation.warnings.length > 0 && (
                    <div className="mb-3 p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                        {validation.warnings.map((w, i) => (
                            <p key={i} className="text-xs text-red-300">{w}</p>
                        ))}
                        {validation.riskProducts.length > 0 && (
                            <div className="mt-2 text-[10px] text-red-400">
                                Produtos em risco: {validation.riskProducts.map(p => p.name).slice(0, 3).join(', ')}
                                {validation.riskProducts.length > 3 && ` +${validation.riskProducts.length - 3} mais`}
                            </div>
                        )}
                    </div>
                )}

                {/* Suggestions */}
                {suggestions.length > 0 && (
                    <div className="mb-3">
                        <div className="flex items-center gap-1 text-xs text-green-400 mb-1">
                            <Sparkles className="w-3 h-3" />
                            <span>O que adicionar:</span>
                        </div>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                            {suggestions.map((s, i) => (
                                <li key={i} className="flex items-center gap-1">
                                    <ArrowRight className="w-3 h-3 text-green-500" />
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Mix Ideal Reference */}
                <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="text-[10px] text-muted-foreground">
                        <span className="font-medium">Mix Ideal:</span>{' '}
                        <span className={curveColors.A.text}>A: 10-15%</span>{' · '}
                        <span className={curveColors.B.text}>B: 25-30%</span>{' · '}
                        <span className={curveColors.C.text}>C: 55-65%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper function to validate mix
export function validateAbcMix(products: Array<{ abc: string; status?: string; nome?: string }>): MixValidation {
    const count = { A: 0, B: 0, C: 0 };
    const riskProducts: Array<{ name: string; abc: string; status: string }> = [];

    products.forEach(p => {
        const abc = p.abc?.toUpperCase() as 'A' | 'B' | 'C';
        if (count[abc] !== undefined) count[abc]++;

        // Detectar produtos CURVA A com estoque crítico/ruptura
        const status = (p.status || '').toUpperCase();
        if (abc === 'A' && (status.includes('CRÍTICO') || status.includes('RUPTURA') || status.includes('CRITICO'))) {
            riskProducts.push({
                name: p.nome || 'Produto',
                abc: 'A',
                status: status
            });
        }
    });

    const total = count.A + count.B + count.C;
    const percent = {
        A: total > 0 ? (count.A / total) * 100 : 0,
        B: total > 0 ? (count.B / total) * 100 : 0,
        C: total > 0 ? (count.C / total) * 100 : 0,
    };

    // Gerar warnings para produtos em risco
    const warnings: string[] = [];
    if (riskProducts.length > 0) {
        warnings.push(`⚠️ ${riskProducts.length} produto(s) Curva A com estoque baixo! Esses são campeões de venda - colocá-los em promoção pode causar ruptura.`);
    }

    // Determinar status e mensagens
    const hasA = count.A > 0;
    const hasB = count.B > 0;
    const hasC = count.C > 0;
    const curveCount = [hasA, hasB, hasC].filter(Boolean).length;

    // Apenas uma curva - BLOQUEAR
    if (curveCount === 1) {
        if (hasA) {
            return {
                canGenerate: false,
                status: 'blocked',
                reason: 'only_a',
                title: 'Isso não é uma liquidação',
                description: 'Produtos Curva A são seus best-sellers. Para liquidar estoque, adicione produtos B (suporte) e C (queima).',
                suggestions: ['2-3 produtos Curva B (suporte)', '4-6 produtos Curva C (queima principal)'],
                warnings,
                missingCurves: ['B', 'C'],
                mixCount: { ...count, total },
                mixPercent: percent,
                riskProducts,
            };
        }
        if (hasB) {
            return {
                canGenerate: false,
                status: 'blocked',
                reason: 'only_b',
                title: 'Mix incompleto',
                description: 'Campanhas só com Curva B não têm chamariz nem objetivo de queima.',
                suggestions: ['1-2 produtos Curva A (chamariz)', '4-6 produtos Curva C (queima)'],
                warnings,
                missingCurves: ['A', 'C'],
                mixCount: { ...count, total },
                mixPercent: percent,
                riskProducts,
            };
        }
        if (hasC) {
            return {
                canGenerate: false,
                status: 'blocked',
                reason: 'only_c',
                title: 'Falta atratividade',
                description: 'Campanhas só com Curva C têm baixa conversão. Adicione produtos A como chamariz para atrair clientes.',
                suggestions: ['1-2 produtos Curva A (chamariz)', '2-3 produtos Curva B (suporte)'],
                warnings,
                missingCurves: ['A', 'B'],
                mixCount: { ...count, total },
                mixPercent: percent,
                riskProducts,
            };
        }
    }

    // Duas curvas - ALERTA
    if (curveCount === 2) {
        if (!hasA) {
            return {
                canGenerate: true,
                status: 'warning',
                reason: 'no_a',
                title: 'Falta o chamariz',
                description: 'Produtos Curva A atraem clientes. Adicione pelo menos 1 para aumentar a conversão.',
                suggestions: ['1-2 produtos Curva A (chamariz)'],
                warnings,
                missingCurves: ['A'],
                mixCount: { ...count, total },
                mixPercent: percent,
                riskProducts,
            };
        }
        if (!hasB) {
            return {
                canGenerate: true,
                status: 'warning',
                reason: 'no_b',
                title: 'Considere adicionar suporte',
                description: 'Produtos Curva B ajudam a equilibrar margem e volume.',
                suggestions: ['2-3 produtos Curva B (suporte)'],
                warnings,
                missingCurves: ['B'],
                mixCount: { ...count, total },
                mixPercent: percent,
                riskProducts,
            };
        }
        if (!hasC) {
            return {
                canGenerate: true,
                status: 'warning',
                reason: 'no_c',
                title: 'Onde está a queima?',
                description: 'Para uma liquidação efetiva, adicione produtos C com estoque alto.',
                suggestions: ['4-6 produtos Curva C (queima)'],
                warnings,
                missingCurves: ['C'],
                mixCount: { ...count, total },
                mixPercent: percent,
                riskProducts,
            };
        }
    }

    // Três curvas - IDEAL (mas pode ter warnings de produtos em risco)
    return {
        canGenerate: true,
        status: riskProducts.length > 0 ? 'warning' : 'ideal',
        reason: riskProducts.length > 0 ? 'risk_products' : 'ideal',
        title: riskProducts.length > 0 ? 'Atenção: Produtos em risco!' : 'Mix equilibrado!',
        description: riskProducts.length > 0
            ? 'Seu mix tem as três curvas, mas há produtos Curva A com estoque crítico. Considere removê-los da campanha.'
            : 'Seu mix tem as três curvas. Campanha pronta para gerar.',
        suggestions: riskProducts.length > 0
            ? ['Remova produtos Curva A com estoque baixo', 'Substitua por produtos Curva A com estoque saudável']
            : [],
        warnings,
        missingCurves: [],
        mixCount: { ...count, total },
        mixPercent: percent,
        riskProducts,
    };
}

