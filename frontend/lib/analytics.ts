import { EstoqueDetalhe } from "@/types/estoque";
import { DashboardMetrics, PurchaseSuggestion } from "@/types/analytics";
import { parseNumber, normalizeStatus } from "./formatters";

export function calculateDashboardMetrics(items: EstoqueDetalhe[]): DashboardMetrics {
    const metrics: DashboardMetrics = {
        financial: {
            totalInventoryValue: 0,
            totalRevenuePotential: 0,
            projectedProfit: 0,
            averageMargin: 0,
            totalSkuCount: 0,
        },
        risk: {
            ruptureCount: 0,
            excessCount: 0,
            ruptureShare: 0,
            healthyShare: 0,
        },
        charts: {
            statusDistribution: [],
            coverageDistribution: [],
        },
        topMovers: {
            rupture: [],
            excess: [],
        }
    };

    // Helper maps for distributions
    const statusCount: Record<string, number> = {
        'RUPTURA': 0, 'CRÍTICO': 0, 'ATENÇÃO': 0, 'SAUDÁVEL': 0, 'EXCESSO': 0
    };

    const coverageBuckets = {
        '0-7 dias': { count: 0, value: 0 },
        '7-15 dias': { count: 0, value: 0 },
        '15-30 dias': { count: 0, value: 0 },
        '30-60 dias': { count: 0, value: 0 },
        '60+ dias': { count: 0, value: 0 },
    };

    let totalItems = 0;

    items.forEach(item => {
        const qty = parseNumber(item.estoque_atual);
        const cost = parseNumber(item.custo);
        const price = parseNumber(item.preco);
        // daily sales unused here but processed below in map
        const coverage = parseNumber(item.dias_de_cobertura);
        const status = normalizeStatus(item.status_ruptura);

        // 1. Financials
        const stockValue = qty * cost;
        const revenuePotential = qty * price;

        metrics.financial.totalInventoryValue += stockValue;
        metrics.financial.totalRevenuePotential += revenuePotential;
        totalItems++;

        // 2. Risk Counts
        if (status === 'RUPTURA' || status === 'CRÍTICO') metrics.risk.ruptureCount++;
        if (status === 'EXCESSO') metrics.risk.excessCount++;

        // 3. Status Distribution
        if (statusCount[status] !== undefined) {
            statusCount[status]++;
        } else {
            // Fallback for unknown statuses, map to 'Outros' or ignore logic
            // Ideally we map standard ones.
        }

        // 4. Coverage Distribution (Value wise)
        if (qty > 0) {
            if (coverage <= 7) coverageBuckets['0-7 dias'].value += stockValue;
            else if (coverage <= 15) coverageBuckets['7-15 dias'].value += stockValue;
            else if (coverage <= 30) coverageBuckets['15-30 dias'].value += stockValue;
            else if (coverage <= 60) coverageBuckets['30-60 dias'].value += stockValue;
            else coverageBuckets['60+ dias'].value += stockValue;
        }

    });

    // Final Calculations
    metrics.financial.totalSkuCount = totalItems;
    metrics.financial.projectedProfit = metrics.financial.totalRevenuePotential - metrics.financial.totalInventoryValue;
    metrics.financial.averageMargin = metrics.financial.totalRevenuePotential > 0
        ? (metrics.financial.projectedProfit / metrics.financial.totalRevenuePotential) * 100
        : 0;

    metrics.risk.ruptureShare = totalItems > 0 ? (metrics.risk.ruptureCount / totalItems) * 100 : 0;

    // Healthy share includes Healthy + Attention? Let's say strictly SAUDÁVEL for now
    const healthyCount = statusCount['SAUDÁVEL'] || 0;
    metrics.risk.healthyShare = totalItems > 0 ? (healthyCount / totalItems) * 100 : 0;

    // Charts Data Construction
    metrics.charts.statusDistribution = [
        { name: 'Crítico/Ruptura', value: statusCount['RUPTURA'] + statusCount['CRÍTICO'], color: '#ef4444' }, // Red
        { name: 'Atenção', value: statusCount['ATENÇÃO'], color: '#f97316' }, // Orange
        { name: 'Saudável', value: statusCount['SAUDÁVEL'], color: '#22c55e' }, // Green
        { name: 'Excesso', value: statusCount['EXCESSO'], color: '#3b82f6' }, // Blue
    ].filter(d => d.value > 0);

    metrics.charts.coverageDistribution = Object.entries(coverageBuckets).map(([range, data]) => ({
        range,
        count: 0, // We tracked value, but logic above used value. Let's stick to Value Distribution which is more impactful financial wise
        value: data.value
    }));

    // Top Movers Logic
    // Sort array copies
    const ruptureItems = items
        .filter(i => {
            const s = normalizeStatus(i.status_ruptura);
            return s === 'RUPTURA' || s === 'CRÍTICO';
        })
        .map(i => ({
            id: i.id_produto,
            name: i.produto_descricao,
            value: parseNumber(i.media_diaria_venda) * parseNumber(i.preco), // Daily Loss Potential
            metricLabel: 'Perda Diária Est.',
            status: i.status_ruptura
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    const excessItems = items
        .filter(i => normalizeStatus(i.status_ruptura) === 'EXCESSO')
        .map(i => ({
            id: i.id_produto,
            name: i.produto_descricao,
            value: parseNumber(i.estoque_atual) * parseNumber(i.custo), // Capital Tied
            metricLabel: 'Capital Parado',
            status: i.status_ruptura
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    metrics.topMovers.rupture = ruptureItems;
    metrics.topMovers.excess = excessItems;

    return metrics;
}

export function generateSuggestions(items: EstoqueDetalhe[], targetDays = 45): PurchaseSuggestion[] {
    return items.map(item => {
        const qty = parseNumber(item.estoque_atual);
        const daily = parseNumber(item.media_diaria_venda);
        const cost = parseNumber(item.custo);
        const coverage = parseNumber(item.dias_de_cobertura);
        const status = normalizeStatus(item.status_ruptura);

        // Logic 1: Deterministic Calculation
        // Required for Target Days
        const requiredStock = daily * targetDays;
        let suggestion = Math.ceil(requiredStock - qty);

        // If negative, it means we have more than enough (Excess)
        if (suggestion < 0) suggestion = 0;

        // Logic 2: Categorization (The "Why")
        let action: PurchaseSuggestion['suggestedAction'] = 'Aguardar';

        if (status === 'RUPTURA' || coverage <= 0) {
            action = 'Comprar Urgente';
            // If sales are 0 but it's rupture, we might not suggest buying unless we have demand signals? 
            // For now, if daily > 0 we buy. If daily = 0, suggestion is 0.
        } else if (coverage < 15) { // Below safety buffer
            action = 'Comprar';
        } else if (status === 'EXCESSO' || coverage > 90) {
            action = 'Queimar Estoque';
            suggestion = 0; // Don't buy
        }

        return {
            id: item.id_produto,
            name: item.produto_descricao,
            currentStock: qty,
            avgDailySales: daily,
            cost: cost,
            coverageDays: coverage,
            status: status,
            suggestedQty: suggestion,
            purchaseCost: suggestion * cost,
            suggestedAction: action
        };
    }).sort((a, b) => {
        // Priority Sort: Urgent > Buy > Wait > Burn
        const priorities: Record<string, number> = { 'Comprar Urgente': 4, 'Comprar': 3, 'Queimar Estoque': 2, 'Aguardar': 1 };
        return (priorities[b.suggestedAction] || 0) - (priorities[a.suggestedAction] || 0) || b.purchaseCost - a.purchaseCost;
    });
}
