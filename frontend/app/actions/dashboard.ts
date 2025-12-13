'use server';

import { supabase } from '@/lib/supabase';

export async function getMorningBriefingStats() {
    // 1. Ruptures (Critical Status)
    const { data: criticalItems, error: errorCritical } = await supabase
        .from('dm_analise_estoque')
        .select('custo, estoque_alvo')
        .eq('status', 'CRÍTICO');

    const ruptureCount = criticalItems?.length || 0;
    const ruptureValue = criticalItems?.reduce((acc, item) => acc + (Number(item.custo) * Number(item.estoque_alvo)), 0) || 0; // Estimated lost revenue or needed investment? Using target stock * cost as "Risk"

    // 2. Excess (Excess Status)
    const { data: excessItems, error: errorExcess } = await supabase
        .from('dm_analise_estoque')
        .select('custo, estoque_atual, estoque_seguranca')
        .eq('status', 'EXCESSO');

    const excessCount = excessItems?.length || 0;
    const excessValue = excessItems?.reduce((acc, item) => {
        const excessQty = Number(item.estoque_atual) - Number(item.estoque_seguranca);
        return acc + (excessQty * Number(item.custo));
    }, 0) || 0;

    // 3. Suppliers (Mocked for now as we don't have dm_leadtime populated properly yet or just raw tables)
    // In a real scenario, join raw_compras with raw_fornecedores where status = 'Pendente' and data_prevista_entrega < NOW()
    const suppliersStats = {
        late_orders: 3,
        worst_offender: "Fornecedor A" // Placeholder
    };

    return {
        ruptures: {
            count: ruptureCount,
            value: ruptureValue,
            items: criticalItems // Send full list if needed for chat context
        },
        excess: {
            count: excessCount,
            value: excessValue
        },
        suppliers: suppliersStats
    };
}
