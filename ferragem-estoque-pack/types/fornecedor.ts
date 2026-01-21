// ============================================================
// TIPOS: Relatório de Fornecedores (relatorio_fornecedores)
// ============================================================

export interface RelatorioFornecedor {
    id: number;
    id_fornecedor: number;
    fornecedor: string;

    // Contagens
    total_produtos: number;
    produtos_ruptura: number;
    produtos_chegando: number;
    produtos_criticos: number;
    produtos_atencao: number;
    produtos_ok: number;

    // Valores
    valor_estoque_custo: number;
    valor_transito_custo: number;
    faturamento_60d: number;

    // Sugestão de Compra
    total_unidades_sugeridas: number;
    valor_sugestao_compra: number;

    // Indicadores
    percentual_ruptura: number;

    // Metadados
    created_at?: string;
    updated_at?: string;
}

// ============================================================
// TIPOS PARA FILTROS
// ============================================================

export interface FiltroFornecedor {
    busca?: string;
    com_ruptura?: boolean;
    com_criticos?: boolean;
    ordenar_por?: 'fornecedor' | 'total_produtos' | 'produtos_ruptura' | 'valor_sugestao_compra';
    direcao?: 'asc' | 'desc';
}

// ============================================================
// TIPOS PARA CARDS DE RESUMO
// ============================================================

export interface ResumoFornecedores {
    total_fornecedores: number;
    fornecedores_com_ruptura: number;
    fornecedores_com_criticos: number;
    valor_total_sugestao: number;
}

// ============================================================
// TIPOS: Pedidos em Trânsito (pedidos_transito)
// ============================================================

export interface PedidoTransito {
    id: number;
    id_pedido: number;
    numero_nf: string | null;
    data_pedido: string | null;
    dias_aguardando: number;
    status_pedido: StatusPedido;
    fornecedor_nome: string;
    fornecedor_codigo: string | null;
    fornecedor_telefone: string | null;
    valor_pedido: number;
    qtd_itens: number;
    total_unidades: number;
    produtos: string | null;

    // Metadados
    created_at?: string;
    updated_at?: string;
}

export type StatusPedido =
    | '🔴 ATRASADO'
    | '🟡 PENDENTE'
    | '🟢 RECENTE'
    | '✅ SEM PENDÊNCIAS';

// ============================================================
// TIPOS PARA FILTROS
// ============================================================

export interface FiltroPedido {
    status_pedido?: StatusPedido | StatusPedido[];
    fornecedor?: string;
    dias_minimo?: number;
}

// ============================================================
// TIPOS PARA CARDS DE RESUMO
// ============================================================

export interface ResumoPedidos {
    total_pedidos: number;
    pedidos_atrasados: number;
    pedidos_pendentes: number;
    pedidos_recentes: number;
    valor_total_transito: number;
    dias_medio_aguardando: number;
}

// ============================================================
// CONSTANTES
// ============================================================

export const STATUS_PEDIDO_OPTIONS: StatusPedido[] = [
    '🔴 ATRASADO',
    '🟡 PENDENTE',
    '🟢 RECENTE',
    '✅ SEM PENDÊNCIAS'
];
