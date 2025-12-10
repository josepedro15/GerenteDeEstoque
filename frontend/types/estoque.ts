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
    id_produto: string; // text in DB
    produto_descricao: string;
    estoque_atual: string; // numeric text
    media_diaria_venda: string; // numeric text
    dias_de_cobertura: string; // numeric text
    preco: string; // numeric text
    custo: string; // numeric text
}

export type EstoqueItem = EstoqueSumario | EstoqueDetalhe;
