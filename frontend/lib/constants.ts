/**
 * Constantes de cores e configurações visuais para status e classificações
 * Centralizado para uso em todo o projeto
 */

// Status de estoque
export const STOCK_STATUS = {
    RUPTURA: 'RUPTURA',
    CRITICO: 'CRÍTICO',
    ATENCAO: 'ATENÇÃO',
    SAUDAVEL: 'SAUDÁVEL',
    EXCESSO: 'EXCESSO',
} as const;

export type StockStatus = typeof STOCK_STATUS[keyof typeof STOCK_STATUS];

// Classificação ABC
export const ABC_CLASS = {
    A: 'A',
    B: 'B',
    C: 'C',
} as const;

export type AbcClass = typeof ABC_CLASS[keyof typeof ABC_CLASS];

// Cores para status de estoque
export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    'RUPTURA': { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
    'CRÍTICO': { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
    'ATENÇÃO': { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
    'SAUDÁVEL': { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    'EXCESSO': { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
};

// Cores compactas para badges menores (sidebar, etc)
export const STATUS_COLORS_COMPACT: Record<string, string> = {
    'RUPTURA': 'bg-red-500/20 text-red-400',
    'CRÍTICO': 'bg-red-500/20 text-red-400',
    'ATENÇÃO': 'bg-orange-500/20 text-orange-400',
    'SAUDÁVEL': 'bg-green-500/20 text-green-400',
    'EXCESSO': 'bg-blue-500/20 text-blue-400',
};

// Cores para classificação ABC
export const ABC_COLORS: Record<string, { bg: string; text: string }> = {
    'A': { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    'B': { bg: 'bg-blue-500/20', text: 'text-blue-400' },
    'C': { bg: 'bg-zinc-500/20', text: 'text-zinc-400' },
};

// Cores compactas para ABC
export const ABC_COLORS_COMPACT: Record<string, string> = {
    'A': 'bg-emerald-500/20 text-emerald-400',
    'B': 'bg-blue-500/20 text-blue-400',
    'C': 'bg-gray-500/20 text-gray-400',
};

// Ranges de cobertura de estoque
export const COVERAGE_RANGES = [
    { label: 'Crítica (< 7d)', value: 'low', min: 0, max: 7 },
    { label: 'Atenção (7-30d)', value: 'medium', min: 7, max: 30 },
    { label: 'Saudável (30-90d)', value: 'healthy', min: 30, max: 90 },
    { label: 'Excesso (> 90d)', value: 'high', min: 90, max: 9999 },
] as const;

// Labels para curvas ABC em campanhas
export const ABC_CAMPAIGN_LABELS: Record<string, string> = {
    'A': 'Chamariz',
    'B': 'Suporte',
    'C': 'Queima',
};

// Opções de filtros
export const STATUS_OPTIONS = ['RUPTURA', 'CRÍTICO', 'ATENÇÃO', 'SAUDÁVEL', 'EXCESSO'] as const;
export const ABC_OPTIONS = ['A', 'B', 'C'] as const;

// Alertas especiais (dashboard)
export const ALERT_OPTIONS = [
    { value: 'MORTO', label: 'Mortos', icon: 'skull', color: 'bg-gray-500/20 text-gray-400' },
    { value: 'LIQUIDAR', label: 'Liquidar', icon: 'flame', color: 'bg-red-500/20 text-red-400' },
    { value: 'RUPTURA', label: 'Ruptura', icon: 'alert', color: 'bg-orange-500/20 text-orange-400' },
] as const;

export const ALERT_COLORS: Record<string, string> = {
    'MORTO': 'bg-gray-500/20 text-gray-400 border-gray-500',
    'LIQUIDAR': 'bg-red-500/20 text-red-400 border-red-500',
    'RUPTURA': 'bg-orange-500/20 text-orange-400 border-orange-500',
};
