export type TipoRegistro = 'SUMARIO' | 'DETALHE';

export interface EstoqueBase {
    id: number;
    tipo_registro: TipoRegistro;
    status_ruptura: string;
}

export interface EstoqueSumario extends EstoqueBase {
    tipo_registro: 'SUMARIO';
    total_produtos: string; // From string in DB
    rank_por_status: string; // From string in DB
}

export interface EstoqueDetalhe extends EstoqueBase {
    tipo_registro: 'DETALHE';
    id_produto: string | null; // text in DB, pode ser null
    produto_descricao: string | null;
    estoque_atual: string; // numeric text
    media_diaria_venda: string; // numeric text
    dias_de_cobertura: string; // numeric text
    preco: string; // numeric text
    custo: string; // numeric text
    rank_por_status?: string; // numeric text

    // Campos de margem
    margem_unitaria?: string;
    margem_percentual?: string;

    // Campos de vendas (60 dias)
    qtd_vendida_60d?: string;
    faturamento_60d?: string;
    lucro_60d?: string;

    // Curva ABC
    classe_abc?: string; // 'A', 'B', 'C'
    percentual_acumulado_abc?: string;

    // Giro e valor de estoque
    giro_mensal?: string;
    valor_estoque_custo?: string;
    valor_estoque_venda?: string;

    // Sugestão de compra
    sugestao_compra_60d?: string;

    // Tendência
    vendas_periodo_atual?: string;
    vendas_periodo_anterior?: string;
    tendencia?: string; // '📈 Subindo', '📉 Caindo', '➡️ Estável', etc.
    variacao_percentual?: string;

    // Última venda
    ultima_venda?: string;
    dias_sem_venda?: string;

    // Prioridade e alertas
    prioridade_compra?: string; // '1-URGENTE', '2-ALTA', etc.
    alerta_estoque?: string; // '💀 MORTO', '🚨 LIQUIDAR', etc.
}

export type EstoqueItem = EstoqueSumario | EstoqueDetalhe;
