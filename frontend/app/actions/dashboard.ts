'use server';

import { supabase } from '@/lib/supabase';

export async function getMorningBriefingStats() {
    // 1. Ruptures (Ruptura + Crítico)
    const { data: criticalItems, error: errorCritical } = await supabase
        .from('dados_estoque')
        .select('custo, estoque_atual, media_diaria_venda, preco, status_ruptura')
        .eq('tipo_registro', 'DETALHE')
        .or('status_ruptura.ilike.%Ruptura%,status_ruptura.ilike.%Crítico%');

    const ruptureCount = criticalItems?.length || 0;
    // Calculando valor em risco: vendas diárias perdidas * preço
    const ruptureValue = criticalItems?.reduce((acc, item) => {
        const dailySales = parseFloat(item.media_diaria_venda) || 0;
        const price = parseFloat(item.preco) || 0;
        return acc + (dailySales * price * 7); // Estimativa de perda em 7 dias
    }, 0) || 0;

    // 2. Excess (Excesso Status)
    const { data: excessItems, error: errorExcess } = await supabase
        .from('dados_estoque')
        .select('custo, estoque_atual, valor_estoque_custo')
        .eq('tipo_registro', 'DETALHE')
        .ilike('status_ruptura', '%Excesso%');

    const excessCount = excessItems?.length || 0;
    const excessValue = excessItems?.reduce((acc, item) => {
        const stockValue = parseFloat(item.valor_estoque_custo) || 0;
        return acc + stockValue;
    }, 0) || 0;

    // 3. Suppliers (Mocked for now)
    const suppliersStats = {
        late_orders: 3,
        worst_offender: "Fornecedor A" // Placeholder
    };

    return {
        ruptures: {
            count: ruptureCount,
            value: ruptureValue,
            items: criticalItems
        },
        excess: {
            count: excessCount,
            value: excessValue
        },
        suppliers: suppliersStats
    };
}
