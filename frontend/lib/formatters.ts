export const parseNumber = (val: string | number | null | undefined): number => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;

    const strVal = val.toString();
    // If it looks like Brazilian format (1.200,00)
    if (strVal.includes(',') && strVal.includes('.')) {
        // Simple heuristic: if comma is last separator, it's decimal
        if (strVal.indexOf(',') > strVal.indexOf('.')) {
            return parseFloat(strVal.replace(/\./g, '').replace(',', '.'));
        }
    }
    // Handle simple comma decimal
    if (strVal.includes(',')) {
        return parseFloat(strVal.replace(',', '.'));
    }

    return parseFloat(strVal);
};

export const normalizeStatus = (status: string | null | undefined): string => {
    if (!status) return 'DESCONHECIDO';

    const upper = status.toUpperCase();
    // IMPORTANTE: Verificar RUPTURA antes de CRÍTICO para diferenciar corretamente
    if (upper.includes('RUPTURA')) return 'RUPTURA';
    if (upper.includes('CRÍTICO') || upper.includes('CRITICO')) return 'CRÍTICO';
    if (upper.includes('ATENÇÃO') || upper.includes('ATENCAO')) return 'ATENÇÃO';
    if (upper.includes('EXCESSO')) return 'EXCESSO';
    if (upper.includes('SAUDÁVEL') || upper.includes('SAUDAVEL') || upper.includes('NORMAL')) return 'SAUDÁVEL';

    return status; // Return original if no match
};

export const cleanStatusText = (status: string): string => {
    // Removes emojis and extra spaces
    return status.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
};

export const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export const formatNumber = (value: number, decimals = 0): string =>
    new Intl.NumberFormat('pt-BR', { maximumFractionDigits: decimals }).format(value);

export const formatPercent = (value: number, showSign = true): string => {
    const sign = showSign && value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
};

export const normalizeAbc = (abc: string | null | undefined): string => {
    if (!abc) return 'C';
    const upper = abc.toUpperCase().trim();
    if (upper === 'A' || upper === 'B' || upper === 'C') return upper;
    return 'C';
};

export const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('pt-BR');
};
