// ============================================================
// TIPOS: Análise de Estoque (dados_estoque)
// ============================================================

export interface DadosEstoque {
    id: number;
    id_produto: number;
    produto_descricao: string | null;

    // Fornecedor
    fornecedor_principal: string | null;
    cod_fornecedor: string | null;
    compras_do_fornecedor: number;
    ultima_compra_fornecedor: string | null;
    qtd_fornecedores: number;
    todos_fornecedores: string | null;

    // Estoque
    estoque_atual: number;
    estoque_transito: number;
    estoque_projetado: number;
    pedidos_abertos: number;
    dias_aguardando: number | null;
    fornecedores_pendentes: string | null;

    // Preços e Margens
    preco: number;
    custo: number;
    margem_unitaria: number;
    margem_percentual: number;

    // Vendas
    qtd_vendida_60d: number;
    faturamento_60d: number;
    lucro_60d: number;
    media_diaria_venda: number;

    // Cobertura
    dias_de_cobertura: number;
    dias_cobertura_projetado: number;

    // Classificação
    status_ruptura: StatusRuptura;
    classe_abc: ClasseABC;
    percentual_acumulado_abc: number;
    giro_mensal: number;

    // Valores de Estoque
    valor_estoque_custo: number;
    valor_estoque_venda: number;
    valor_transito_custo: number;

    // Sugestão de Compra
    sugestao_compra_ajustada: number;
    sugestao_compra_60d: number;

    // Tendência
    vendas_periodo_atual: number;
    vendas_periodo_anterior: number;
    tendencia: Tendencia;
    variacao_percentual: number;

    // Datas
    ultima_venda: string | null;
    dias_sem_venda: number;

    // Alertas
    prioridade_compra: PrioridadeCompra;
    alerta_estoque: AlertaEstoque;

    // Metadados
    created_at?: string;
    updated_at?: string;
}

// ============================================================
// ENUMS E TIPOS AUXILIARES
// ============================================================

export type StatusRuptura =
    | '🔴 Ruptura'
    | '🟣 Chegando'
    | '🟠 Crítico'
    | '🟡 Atenção'
    | '🟢 Saudável'
    | '⚪ Excesso';

export type ClasseABC = 'A' | 'B' | 'C';

export type Tendencia =
    | '📈 Subindo'
    | '📈 Novo'
    | '➡️ Estável'
    | '➡️ Sem histórico'
    | '📉 Caindo';

export type PrioridadeCompra =
    | '1-URGENTE'
    | '2-ALTA'
    | '3-MEDIA'
    | '4-BAIXA'
    | '5-NENHUMA'
    | '6-AGUARDAR';

export type AlertaEstoque =
    | '✅ OK'
    | '📋 ATENÇÃO'
    | '⚠️ AVALIAR'
    | '🚨 LIQUIDAR'
    | '💀 MORTO';

// ============================================================
// TIPOS PARA FILTROS
// ============================================================

export interface FiltroEstoque {
    status_ruptura?: StatusRuptura | StatusRuptura[];
    classe_abc?: ClasseABC | ClasseABC[];
    prioridade_compra?: PrioridadeCompra | PrioridadeCompra[];
    fornecedor_principal?: string;
    tendencia?: Tendencia;
    busca?: string;
}

export interface OrdenacaoEstoque {
    campo: keyof DadosEstoque;
    direcao: 'asc' | 'desc';
}

// ============================================================
// TIPOS PARA CARDS DE RESUMO
// ============================================================

export interface ResumoEstoque {
    total_produtos: number;
    produtos_ruptura: number;
    produtos_chegando: number;
    produtos_criticos: number;
    produtos_atencao: number;
    produtos_ok: number;
    valor_total_estoque: number;
    valor_sugestao_compra: number;
    total_classe_a: number;
    total_classe_b: number;
    total_classe_c: number;
}

// ============================================================
// CONSTANTES
// ============================================================

export const STATUS_RUPTURA_OPTIONS: StatusRuptura[] = [
    '🔴 Ruptura',
    '🟣 Chegando',
    '🟠 Crítico',
    '🟡 Atenção',
    '🟢 Saudável',
    '⚪ Excesso'
];

export const PRIORIDADE_OPTIONS: PrioridadeCompra[] = [
    '1-URGENTE',
    '2-ALTA',
    '3-MEDIA',
    '4-BAIXA',
    '5-NENHUMA',
    '6-AGUARDAR'
];

export const TENDENCIA_OPTIONS: Tendencia[] = [
    '📈 Subindo',
    '📈 Novo',
    '➡️ Estável',
    '➡️ Sem histórico',
    '📉 Caindo'
];

export const CLASSE_ABC_OPTIONS: ClasseABC[] = ['A', 'B', 'C'];

// ============================================================
// CORES POR STATUS
// ============================================================

export const STATUS_CORES: Record<StatusRuptura, string> = {
    '🔴 Ruptura': 'bg-red-500',
    '🟣 Chegando': 'bg-purple-500',
    '🟠 Crítico': 'bg-orange-500',
    '🟡 Atenção': 'bg-yellow-500',
    '🟢 Saudável': 'bg-green-500',
    '⚪ Excesso': 'bg-gray-400',
};

export const ABC_CORES: Record<ClasseABC, string> = {
    'A': 'bg-green-500',
    'B': 'bg-yellow-500',
    'C': 'bg-red-500',
};
