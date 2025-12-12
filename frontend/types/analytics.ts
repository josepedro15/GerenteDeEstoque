export interface DashboardMetrics {
    financial: {
        totalInventoryValue: number; // Cost basis
        totalRevenuePotential: number; // Retail basis
        projectedProfit: number;
        averageMargin: number;
        totalSkuCount: number;
    };
    risk: {
        ruptureCount: number;
        excessCount: number;
        ruptureShare: number; // Percentage
        healthyShare: number; // Percentage
    };
    charts: {
        statusDistribution: { name: string; value: number; color: string }[];
        coverageDistribution: { range: string; count: number; value: number }[];
    };
    topMovers: {
        rupture: TopMoverItem[];
        excess: TopMoverItem[];
    };
}

export interface PurchaseSuggestion {
    id: string;
    name: string;
    currentStock: number;
    avgDailySales: number;
    cost: number;
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
}
