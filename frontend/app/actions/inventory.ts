"use server";

import { supabase } from "@/lib/supabase";

export interface StockAnalysis {
    id_produto: number;
    codigo_produto: string;
    nome_produto: string;
    tem_venda: boolean;
    estoque_atual: number;
    demanda_media_dia: number;
    desvio_padrao_dia: number;
    demanda_total: number;
    dias_no_periodo: number;
    primeira_data: string;
    ultima_data: string;
    demanda_leadtime: number;
    estoque_seguranca: number;
    rop: number;
    quantidade_sugerida: number;
    cobertura_atual_dias: number;
    estoque_alvo: number;
    status: string;
    prioridade: number;
    preco_venda: number;
    custo: number;
    updated_at: string;
}

export interface Supplier {
    id_fornecedor: string;
    nome_fornecedor: string;
    cidade: string;
    lead_time_padrao: number;
    updated_at: string;
}

export async function getSuppliers(): Promise<Supplier[]> {
    const { data, error } = await supabase
        .from('raw_fornecedores')
        .select('*')
        .order('nome_fornecedor', { ascending: true })
        .limit(100);

    if (error) {
        console.error("Supabase Error (Suppliers):", error);
        return [];
    }

    return data || [];
}

export async function getStockAnalysis(): Promise<StockAnalysis[]> {
    try {
        const { data, error } = await supabase
            .from('analise_estoque')
            .select('*')
            .order('prioridade', { ascending: false })
            .order('quantidade_sugerida', { ascending: false })
            .limit(100);

        if (error) {
            console.error("Supabase Error:", error);
            throw error;
        }

        if (!data || data.length === 0) {
            // Fallback if table is empty (keep mock for development experience if DB is fresh)
            console.warn("Supabase returned no data. Using mock.");
            throw new Error("No data");
        }

        return data.map(sanitizeStockItem);
    } catch (error) {
        console.error("Database Error (Falling back to mock):", error);

        // Mock data matching the new structure
        // Mock data provided by user
        const userMockData = [
            {
                "id_produto": 332,
                "tem_venda": true,
                "estoque_atual": 0,
                "demanda_media_dia": 70,
                "desvio_padrao_dia": 0,
                "demanda_total": 70,
                "dias_no_periodo": 1,
                "primeira_data": "2025-11-21",
                "ultima_data": "2025-11-21",
                "demanda_leadtime": 490,
                "estoque_seguranca": 0,
                "rop": 490,
                "quantidade_sugerida": 2100,
                "cobertura_atual_dias": 0,
                "estoque_alvo": 2100,
                "status": "ruptura",
                "prioridade": 5,
                "preco_venda": 6.89,
                "custo": 4.43,
                "codigo_produto": "000002",
                "nome_produto": "TABUA CEDRO*2.5 X 30 X 0,50M"
            },
            {
                "id_produto": 814,
                "tem_venda": true,
                "estoque_atual": 0,
                "demanda_media_dia": 14,
                "desvio_padrao_dia": 0,
                "demanda_total": 14,
                "dias_no_periodo": 1,
                "primeira_data": "2025-11-21",
                "ultima_data": "2025-11-21",
                "demanda_leadtime": 98,
                "estoque_seguranca": 0,
                "rop": 98,
                "quantidade_sugerida": 420,
                "cobertura_atual_dias": 0,
                "estoque_alvo": 420,
                "status": "ruptura",
                "prioridade": 5
            },
            {
                "id_produto": 2424,
                "tem_venda": false,
                "estoque_atual": 0,
                "demanda_media_dia": -14,
                "desvio_padrao_dia": 0,
                "demanda_total": -14,
                "dias_no_periodo": 1,
                "primeira_data": "2025-11-21",
                "ultima_data": "2025-11-21",
                "demanda_leadtime": -98,
                "estoque_seguranca": 0,
                "rop": -98,
                "quantidade_sugerida": 0,
                "cobertura_atual_dias": 0,
                "estoque_alvo": -420,
                "status": "ok",
                "prioridade": 1
            },
            {
                "id_produto": 4511,
                "tem_venda": false,
                "estoque_atual": 55,
                "demanda_media_dia": 0,
                "desvio_padrao_dia": 0,
                "demanda_total": 0,
                "dias_no_periodo": 0,
                "primeira_data": "",
                "ultima_data": "",
                "demanda_leadtime": 0,
                "estoque_seguranca": 0,
                "rop": 0,
                "quantidade_sugerida": 0,
                "cobertura_atual_dias": 0,
                "estoque_alvo": 0,
                "status": "estoque_parado",
                "prioridade": 2
            },
            {
                "id_produto": 4536,
                "tem_venda": false,
                "estoque_atual": 1078,
                "demanda_media_dia": 0,
                "desvio_padrao_dia": 0,
                "demanda_total": 0,
                "dias_no_periodo": 0,
                "primeira_data": "",
                "ultima_data": "",
                "demanda_leadtime": 0,
                "estoque_seguranca": 0,
                "rop": 0,
                "quantidade_sugerida": 0,
                "cobertura_atual_dias": 0,
                "estoque_alvo": 0,
                "status": "estoque_parado",
                "prioridade": 2
            },
            {
                "id_produto": 4537,
                "tem_venda": false,
                "estoque_atual": 1782,
                "demanda_media_dia": 0,
                "desvio_padrao_dia": 0,
                "demanda_total": 0,
                "dias_no_periodo": 0,
                "primeira_data": "",
                "ultima_data": "",
                "demanda_leadtime": 0,
                "estoque_seguranca": 0,
                "rop": 0,
                "quantidade_sugerida": 0,
                "cobertura_atual_dias": 0,
                "estoque_alvo": 0,
                "status": "estoque_parado",
                "prioridade": 2
            },
            {
                "id_produto": 5996,
                "tem_venda": false,
                "estoque_atual": 22,
                "demanda_media_dia": 0,
                "desvio_padrao_dia": 0,
                "demanda_total": 0,
                "dias_no_periodo": 0,
                "primeira_data": "",
                "ultima_data": "",
                "demanda_leadtime": 0,
                "estoque_seguranca": 0,
                "rop": 0,
                "quantidade_sugerida": 0,
                "cobertura_atual_dias": 0,
                "estoque_alvo": 0,
                "status": "estoque_parado",
                "prioridade": 2
            },
            {
                "id_produto": 8302,
                "tem_venda": false,
                "estoque_atual": 3047,
                "demanda_media_dia": 0,
                "desvio_padrao_dia": 0,
                "demanda_total": 0,
                "dias_no_periodo": 0,
                "primeira_data": "",
                "ultima_data": "",
                "demanda_leadtime": 0,
                "estoque_seguranca": 0,
                "rop": 0,
                "quantidade_sugerida": 0,
                "cobertura_atual_dias": 0,
                "estoque_alvo": 0,
                "status": "estoque_parado",
                "prioridade": 2
            },
            {
                "id_produto": 8501,
                "tem_venda": false,
                "estoque_atual": 770,
                "demanda_media_dia": 0,
                "desvio_padrao_dia": 0,
                "demanda_total": 0,
                "dias_no_periodo": 0,
                "primeira_data": "",
                "ultima_data": "",
                "demanda_leadtime": 0,
                "estoque_seguranca": 0,
                "rop": 0,
                "quantidade_sugerida": 0,
                "cobertura_atual_dias": 0,
                "estoque_alvo": 0,
                "status": "estoque_parado",
                "prioridade": 2
            },
            {
                "id_produto": 8504,
                "tem_venda": false,
                "estoque_atual": 209,
                "demanda_media_dia": 0,
                "desvio_padrao_dia": 0,
                "demanda_total": 0,
                "dias_no_periodo": 0,
                "primeira_data": "",
                "ultima_data": "",
                "demanda_leadtime": 0,
                "estoque_seguranca": 0,
                "rop": 0,
                "quantidade_sugerida": 0,
                "cobertura_atual_dias": 0,
                "estoque_alvo": 0,
                "status": "estoque_parado",
                "prioridade": 2
            }
        ];

        // Sanitize and map to StockAnalysis
        return userMockData.map(sanitizeStockItem);
    }
}

function sanitizeStockItem(item: any): StockAnalysis {
    return {
        ...item,
        codigo_produto: item.codigo_produto || `PROD-${item.id_produto}`,
        nome_produto: item.nome_produto || `Produto ${item.id_produto}`,
        custo: Number(item.custo) || 0,
        preco_venda: Number(item.preco_venda) || 0,
        updated_at: item.updated_at || new Date().toISOString(),
        primeira_data: item.primeira_data || new Date().toISOString().split('T')[0],
        ultima_data: item.ultima_data || new Date().toISOString().split('T')[0],
        cobertura_atual_dias: (item.cobertura_atual_dias === null || item.cobertura_atual_dias === undefined) ? 0 : Number(item.cobertura_atual_dias),

        // Sanitize all numeric fields to prevent crashes
        estoque_atual: Number(item.estoque_atual) || 0,
        quantidade_sugerida: Number(item.quantidade_sugerida) || 0,
        demanda_media_dia: Number(item.demanda_media_dia) || 0,
        demanda_total: Number(item.demanda_total) || 0,
        rop: Number(item.rop) || 0,
        estoque_alvo: Number(item.estoque_alvo) || 0,
        prioridade: Number(item.prioridade) || 0,
        demanda_leadtime: Number(item.demanda_leadtime) || 0,
        estoque_seguranca: Number(item.estoque_seguranca) || 0,
        desvio_padrao_dia: Number(item.desvio_padrao_dia) || 0,
        dias_no_periodo: Number(item.dias_no_periodo) || 0,
    };
}
