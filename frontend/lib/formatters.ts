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
    if (upper.includes('CRÍTICO') || upper.includes('CRITICO') || upper.includes('RUPTURA')) return 'CRÍTICO';
    if (upper.includes('ATENÇÃO') || upper.includes('ATENCAO')) return 'ATENÇÃO';
    if (upper.includes('EXCESSO')) return 'EXCESSO';
    if (upper.includes('SAUDÁVEL') || upper.includes('SAUDAVEL') || upper.includes('NORMAL')) return 'SAUDÁVEL';

    return status; // Return original if no match, stripping emojis might be good for UI logic but keeping for display
};

export const cleanStatusText = (status: string): string => {
    // Removes emojis and extra spaces
    return status.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
};

export const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
