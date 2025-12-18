// =============================================
// ALERT ENGINE - Código para Cron Trigger no N8N
// =============================================
// Este código analisa os dados de estoque e gera alertas proativos
// Execute a cada 6 horas via Cron Trigger no n8n

const items = $input.all().map(i => i.json);
const alerts = [];
const now = new Date();

// Configurações de thresholds (ajuste conforme necessário)
const CONFIG = {
    RUPTURA_IMINENTE_DIAS: 3,      // Alerta quando cobertura < X dias
    ESTOQUE_PARADO_DIAS: 120,       // Alerta quando cobertura > X dias
    VALOR_MINIMO_ALERTA: 1000,      // Só alerta se valor > R$ X
    MAX_ALERTAS: 20                  // Limite de alertas por execução
};

// Contadores para resumo
let stats = {
    total_analisados: 0,
    rupturas: 0,
    rupturas_iminentes: 0,
    estoques_parados: 0,
    valor_em_risco: 0,
    capital_parado: 0
};

items.forEach(item => {
    stats.total_analisados++;

    // Parse dos valores (tratando formato brasileiro)
    const parseNum = (val) => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        return parseFloat(val.toString().replace(/\./g, '').replace(',', '.')) || 0;
    };

    const cobertura = parseNum(item.dias_de_cobertura);
    const estoque = parseNum(item.estoque_atual);
    const demanda = parseNum(item.media_diaria_venda);
    const custo = parseNum(item.custo);
    const preco = parseNum(item.preco);
    const sku = item.id_produto || item.codigo_produto || 'N/A';
    const nome = item.produto_descricao || item.nome_produto || 'Produto sem nome';

    // ==========================================
    // ALERTA 1: Ruptura atual (estoque = 0 com demanda)
    // ==========================================
    if (estoque === 0 && demanda > 0) {
        const perdaDiaria = demanda * preco;

        if (perdaDiaria >= CONFIG.VALOR_MINIMO_ALERTA) {
            stats.rupturas++;
            stats.valor_em_risco += perdaDiaria;

            alerts.push({
                type: 'RUPTURA',
                severity: 'CRITICAL',
                priority: 1,
                sku: sku,
                nome: nome,
                title: `🔥 RUPTURA: ${nome}`,
                message: `Produto zerado! Perda estimada de ${formatCurrency(perdaDiaria)}/dia.`,
                data: {
                    demanda_diaria: demanda,
                    perda_diaria: perdaDiaria,
                    dias_sem_estoque: 0
                },
                action: {
                    type: 'COMPRA_URGENTE',
                    label: 'Comprar Agora',
                    suggested_qty: Math.ceil(demanda * 30) // 30 dias de cobertura
                },
                created_at: now.toISOString()
            });
        }
    }

    // ==========================================
    // ALERTA 2: Ruptura iminente (< X dias de cobertura)
    // ==========================================
    else if (cobertura > 0 && cobertura <= CONFIG.RUPTURA_IMINENTE_DIAS && demanda > 0) {
        const valorEmRisco = estoque * preco;

        if (valorEmRisco >= CONFIG.VALOR_MINIMO_ALERTA) {
            stats.rupturas_iminentes++;

            alerts.push({
                type: 'RUPTURA_IMINENTE',
                severity: 'HIGH',
                priority: 2,
                sku: sku,
                nome: nome,
                title: `⚠️ ATENÇÃO: ${nome}`,
                message: `Vai zerar em ${Math.ceil(cobertura)} dias! Estoque atual: ${estoque} un.`,
                data: {
                    cobertura_dias: cobertura,
                    estoque_atual: estoque,
                    demanda_diaria: demanda
                },
                action: {
                    type: 'COMPRA',
                    label: 'Planejar Compra',
                    suggested_qty: Math.ceil(demanda * 45) - estoque // 45 dias de cobertura
                },
                created_at: now.toISOString()
            });
        }
    }

    // ==========================================
    // ALERTA 3: Estoque parado (> X dias de cobertura)
    // ==========================================
    else if (cobertura > CONFIG.ESTOQUE_PARADO_DIAS) {
        const capitalParado = estoque * custo;

        if (capitalParado >= CONFIG.VALOR_MINIMO_ALERTA) {
            stats.estoques_parados++;
            stats.capital_parado += capitalParado;

            alerts.push({
                type: 'ESTOQUE_PARADO',
                severity: 'MEDIUM',
                priority: 3,
                sku: sku,
                nome: nome,
                title: `💤 PARADO: ${nome}`,
                message: `${Math.floor(cobertura)} dias de cobertura. Capital parado: ${formatCurrency(capitalParado)}.`,
                data: {
                    cobertura_dias: cobertura,
                    estoque_atual: estoque,
                    capital_parado: capitalParado,
                    custo_unitario: custo
                },
                action: {
                    type: 'QUEIMA',
                    label: 'Criar Campanha',
                    suggested_discount: cobertura > 180 ? 30 : 15 // % de desconto sugerido
                },
                created_at: now.toISOString()
            });
        }
    }
});

// Ordena por prioridade e limita quantidade
const sortedAlerts = alerts
    .sort((a, b) => a.priority - b.priority || b.data.capital_parado - a.data.capital_parado)
    .slice(0, CONFIG.MAX_ALERTAS);

// Helper para formatar moeda
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Retorna resultado
return {
    json: {
        success: true,
        timestamp: now.toISOString(),
        summary: {
            total_analisados: stats.total_analisados,
            total_alertas: sortedAlerts.length,
            rupturas_atuais: stats.rupturas,
            rupturas_iminentes: stats.rupturas_iminentes,
            estoques_parados: stats.estoques_parados,
            valor_em_risco_diario: formatCurrency(stats.valor_em_risco),
            capital_parado_total: formatCurrency(stats.capital_parado)
        },
        alerts: sortedAlerts,
        config_used: CONFIG
    }
};
