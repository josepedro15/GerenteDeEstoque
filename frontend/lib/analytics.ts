import { EstoqueDetalhe } from "@/types/estoque";
import { DashboardMetrics, PurchaseSuggestion, PriorityActionItem } from "@/types/analytics";
import { parseNumber, normalizeStatus } from "./formatters";

// Helper para normalizar alertas
function normalizeAlerta(alerta: string | null | undefined): string {
    if (!alerta) return 'OK';
    if (alerta.includes('MORTO')) return 'MORTO';
    if (alerta.includes('LIQUIDAR')) return 'LIQUIDAR';
    if (alerta.includes('AVALIAR')) return 'AVALIAR';
    if (alerta.includes('ATENÇÃO')) return 'ATENCAO';
    return 'OK';
}

// Helper para normalizar tendência
function normalizeTendencia(tendencia: string | null | undefined): string {
    if (!tendencia) return 'ESTAVEL';
    if (tendencia.includes('Subindo') || tendencia.includes('Novo')) return 'SUBINDO';
    if (tendencia.includes('Caindo')) return 'CAINDO';
    return 'ESTAVEL';
}

export function calculateDashboardMetrics(items: EstoqueDetalhe[]): DashboardMetrics {
    // Filtrar apenas itens com id_produto válido
    const validItems = items.filter(item => item.id_produto !== null && item.id_produto !== undefined);
    const totalItems = validItems.length;

    // Inicializar contadores
    const statusCount: Record<string, number> = {
        'RUPTURA': 0, 'CRÍTICO': 0, 'ATENÇÃO': 0, 'SAUDÁVEL': 0, 'EXCESSO': 0
    };

    const alertCount = { MORTO: 0, LIQUIDAR: 0, AVALIAR: 0, ATENCAO: 0, OK: 0 };
    const alertValue = { MORTO: 0, LIQUIDAR: 0, AVALIAR: 0, ATENCAO: 0, OK: 0 };

    const abcCount = { A: 0, B: 0, C: 0 };
    const abcValue = { A: 0, B: 0, C: 0 };

    const trendCount = { SUBINDO: 0, ESTAVEL: 0, CAINDO: 0 };

    const coverageBuckets = {
        '0-7 dias': { count: 0, value: 0 },
        '7-15 dias': { count: 0, value: 0 },
        '15-30 dias': { count: 0, value: 0 },
        '30-60 dias': { count: 0, value: 0 },
        '60+ dias': { count: 0, value: 0 },
    };

    let totalInventoryValue = 0;
    let totalRevenuePotential = 0;
    let totalGiro = 0;
    let giroCount = 0;

    // Processar cada item
    validItems.forEach(item => {
        const qty = parseNumber(item.estoque_atual);
        const cost = parseNumber(item.custo);
        const price = parseNumber(item.preco);
        const coverage = parseNumber(item.dias_de_cobertura);
        const giro = parseNumber(item.giro_mensal);
        const status = normalizeStatus(item.status_ruptura);
        const alerta = normalizeAlerta(item.alerta_estoque);
        const abc = (item.classe_abc || 'C').toUpperCase();
        const tendencia = normalizeTendencia(item.tendencia);

        const stockValue = qty * cost;
        const revenuePotential = qty * price;

        // 1. Financials
        totalInventoryValue += stockValue;
        totalRevenuePotential += revenuePotential;

        if (giro > 0) {
            totalGiro += giro;
            giroCount++;
        }

        // 2. Status counts
        if (statusCount[status] !== undefined) {
            statusCount[status]++;
        }

        // 3. Alert counts
        if (alertCount[alerta as keyof typeof alertCount] !== undefined) {
            alertCount[alerta as keyof typeof alertCount]++;
            alertValue[alerta as keyof typeof alertValue] += stockValue;
        }

        // 4. ABC counts
        if (abc === 'A' || abc === 'B' || abc === 'C') {
            abcCount[abc as 'A' | 'B' | 'C']++;
            abcValue[abc as 'A' | 'B' | 'C'] += stockValue;
        }

        // 5. Trend counts
        if (trendCount[tendencia as keyof typeof trendCount] !== undefined) {
            trendCount[tendencia as keyof typeof trendCount]++;
        }

        // 6. Coverage Distribution
        if (qty > 0) {
            if (coverage <= 7) coverageBuckets['0-7 dias'].value += stockValue;
            else if (coverage <= 15) coverageBuckets['7-15 dias'].value += stockValue;
            else if (coverage <= 30) coverageBuckets['15-30 dias'].value += stockValue;
            else if (coverage <= 60) coverageBuckets['30-60 dias'].value += stockValue;
            else coverageBuckets['60+ dias'].value += stockValue;
        }
    });

    // Calcular métricas finais
    const projectedProfit = totalRevenuePotential - totalInventoryValue;
    const averageMargin = totalRevenuePotential > 0 ? (projectedProfit / totalRevenuePotential) * 100 : 0;
    const averageGiro = giroCount > 0 ? totalGiro / giroCount : 0;
    const ruptureCount = statusCount['RUPTURA'] + statusCount['CRÍTICO'];
    const excessCount = statusCount['EXCESSO'];
    const healthyCount = statusCount['SAUDÁVEL'];

    // Top Movers com ABC e Alerta
    const ruptureItems = validItems
        .filter(i => {
            const s = normalizeStatus(i.status_ruptura);
            return s === 'RUPTURA' || s === 'CRÍTICO';
        })
        .map(i => ({
            id: i.id_produto as string,
            name: i.produto_descricao || 'Sem descrição',
            value: parseNumber(i.media_diaria_venda) * parseNumber(i.preco),
            metricLabel: 'Perda Diária Est.',
            status: i.status_ruptura,
            classeAbc: i.classe_abc || 'C',
            alerta: i.alerta_estoque || '✅ OK'
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    const excessItems = validItems
        .filter(i => normalizeStatus(i.status_ruptura) === 'EXCESSO')
        .map(i => ({
            id: i.id_produto as string,
            name: i.produto_descricao || 'Sem descrição',
            value: parseNumber(i.estoque_atual) * parseNumber(i.custo),
            metricLabel: 'Capital Parado',
            status: i.status_ruptura,
            classeAbc: i.classe_abc || 'C',
            alerta: i.alerta_estoque || '✅ OK'
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    // Priority Actions - ordenado por prioridade
    const priorityOrder: Record<string, number> = {
        '1-URGENTE': 1, '2-ALTA': 2, '3-MEDIA': 3, '4-BAIXA': 4, '5-NENHUMA': 5
    };

    const priorityActions: PriorityActionItem[] = validItems
        .filter(i => i.prioridade_compra && i.prioridade_compra !== '5-NENHUMA')
        .map(i => ({
            id: i.id_produto as string,
            name: i.produto_descricao || 'Sem descrição',
            prioridade: i.prioridade_compra || '5-NENHUMA',
            classeAbc: i.classe_abc || 'C',
            status: i.status_ruptura,
            alerta: i.alerta_estoque || '✅ OK',
            estoqueAtual: parseNumber(i.estoque_atual),
            diasCobertura: parseNumber(i.dias_de_cobertura),
            valorEstoque: parseNumber(i.valor_estoque_custo),
            sugestaoCompra: parseNumber(i.sugestao_compra_60d),
            tendencia: i.tendencia || '➡️ Estável'
        }))
        .sort((a, b) => {
            const prioA = priorityOrder[a.prioridade] || 5;
            const prioB = priorityOrder[b.prioridade] || 5;
            if (prioA !== prioB) return prioA - prioB;
            // Se mesma prioridade, ordenar por valor
            return b.valorEstoque - a.valorEstoque;
        })
        .slice(0, 50);

    return {
        financial: {
            totalInventoryValue,
            totalRevenuePotential,
            projectedProfit,
            averageMargin,
            totalSkuCount: totalItems,
            averageGiro,
        },
        risk: {
            ruptureCount,
            excessCount,
            ruptureShare: totalItems > 0 ? (ruptureCount / totalItems) * 100 : 0,
            healthyShare: totalItems > 0 ? (healthyCount / totalItems) * 100 : 0,
        },
        alerts: {
            mortos: { count: alertCount.MORTO, value: alertValue.MORTO },
            liquidar: { count: alertCount.LIQUIDAR, value: alertValue.LIQUIDAR },
            avaliar: { count: alertCount.AVALIAR, value: alertValue.AVALIAR },
            atencao: { count: alertCount.ATENCAO, value: alertValue.ATENCAO },
            ok: { count: alertCount.OK, value: alertValue.OK },
        },
        abc: {
            a: { count: abcCount.A, percentage: totalItems > 0 ? (abcCount.A / totalItems) * 100 : 0, value: abcValue.A },
            b: { count: abcCount.B, percentage: totalItems > 0 ? (abcCount.B / totalItems) * 100 : 0, value: abcValue.B },
            c: { count: abcCount.C, percentage: totalItems > 0 ? (abcCount.C / totalItems) * 100 : 0, value: abcValue.C },
        },
        trends: {
            subindo: { count: trendCount.SUBINDO, percentage: totalItems > 0 ? (trendCount.SUBINDO / totalItems) * 100 : 0 },
            estavel: { count: trendCount.ESTAVEL, percentage: totalItems > 0 ? (trendCount.ESTAVEL / totalItems) * 100 : 0 },
            caindo: { count: trendCount.CAINDO, percentage: totalItems > 0 ? (trendCount.CAINDO / totalItems) * 100 : 0 },
            novo: { count: 0, percentage: 0 }, // Calculado separadamente se necessário
        },
        charts: {
            statusDistribution: [
                { name: 'Crítico/Ruptura', value: statusCount['RUPTURA'] + statusCount['CRÍTICO'], color: '#ef4444' },
                { name: 'Atenção', value: statusCount['ATENÇÃO'], color: '#f97316' },
                { name: 'Saudável', value: statusCount['SAUDÁVEL'], color: '#22c55e' },
                { name: 'Excesso', value: statusCount['EXCESSO'], color: '#3b82f6' },
            ].filter(d => d.value > 0),
            coverageDistribution: Object.entries(coverageBuckets).map(([range, data]) => ({
                range,
                count: 0,
                value: data.value
            })),
        },
        topMovers: {
            rupture: ruptureItems,
            excess: excessItems,
        },
        priorityActions,
    };
}

export function generateSuggestions(items: EstoqueDetalhe[], targetDays = 60): PurchaseSuggestion[] {
    // Filtrar apenas itens com id_produto válido
    return items
        .filter(item => item.id_produto !== null && item.id_produto !== undefined)
        .map(item => {
            const qty = parseNumber(item.estoque_atual);
            const daily = parseNumber(item.media_diaria_venda);
            const cost = parseNumber(item.custo);
            const price = parseNumber(item.preco);
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
                id: item.id_produto as string,
                name: item.produto_descricao || 'Sem descrição',
                currentStock: qty,
                avgDailySales: daily,
                cost: cost,
                price: price,
                totalValue: qty * cost,
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
