export interface DashboardMetrics {
    financial: {
        totalInventoryValue: number; // Cost basis
        totalRevenuePotential: number; // Retail basis
        projectedProfit: number;
        averageMargin: number;
        totalSkuCount: number;
        averageGiro: number;
        // NOVO: Trânsito e Sugestão
        totalTransitValue: number;
        totalSugestaoAjustada: number;
    };
    risk: {
        ruptureCount: number;
        excessCount: number;
        chegandoCount: number; // NOVO
        ruptureShare: number; // Percentage
        healthyShare: number; // Percentage
    };
    // NOVO: Métricas de Alertas
    alerts: {
        mortos: { count: number; value: number };
        liquidar: { count: number; value: number };
        avaliar: { count: number; value: number };
        atencao: { count: number; value: number };
        ok: { count: number; value: number };
    };
    // NOVO: Métricas ABC
    abc: {
        a: { count: number; percentage: number; value: number };
        b: { count: number; percentage: number; value: number };
        c: { count: number; percentage: number; value: number };
    };
    // NOVO: Tendências
    trends: {
        subindo: { count: number; percentage: number };
        estavel: { count: number; percentage: number };
        caindo: { count: number; percentage: number };
        novo: { count: number; percentage: number };
    };
    charts: {
        statusDistribution: { name: string; value: number; color: string }[];
        coverageDistribution: { range: string; count: number; value: number }[];
    };
    topMovers: {
        rupture: TopMoverItem[];
        excess: TopMoverItem[];
    };
    // NOVO: Lista de prioridades
    priorityActions: PriorityActionItem[];
}

export interface PurchaseSuggestion {
    id: string;
    name: string;
    currentStock: number;
    avgDailySales: number;
    cost: number;
    price: number;
    totalValue: number; // Current Stock * Cost
    coverageDays: number;
    status: string;
    suggestedQty: number; // Calculated: (Avg * Target) - Stock
    purchaseCost: number; // Qty * Cost
    suggestedAction: 'Comprar Urgente' | 'Comprar' | 'Aguardar' | 'Queimar Estoque';
}

export interface TopMoverItem {
    id: string;
    name: string;
    value: number; // Revenue lost (for rupture) or Capital tied (for excess)
    metricLabel: string; // "Venda Diária" or "Estoque"
    status: string;
    classeAbc?: string; // NOVO
    alerta?: string; // NOVO
}

// NOVO: Item de ação prioritária
export interface PriorityActionItem {
    id: string;
    name: string;
    prioridade: string; // '1-URGENTE', '2-ALTA', etc.
    classeAbc: string;
    status: string;
    alerta: string;
    estoqueAtual: number;
    diasCobertura: number;
    valorEstoque: number;
    sugestaoCompra: number;
    tendencia: string;
}
