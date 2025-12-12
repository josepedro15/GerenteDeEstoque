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

export interface TopMoverItem {
    id: string;
    name: string;
    value: number; // Revenue lost (for rupture) or Capital tied (for excess)
    metricLabel: string; // "Venda Diária" or "Estoque"
    status: string;
}
