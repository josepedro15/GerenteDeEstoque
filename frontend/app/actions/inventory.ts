"use server";

import { supabase } from "@/lib/supabase";
import { EstoqueItem, EstoqueSumario, EstoqueDetalhe } from "@/types/estoque";

export interface StockData {
    sumario: EstoqueSumario[];
    detalhe: EstoqueDetalhe[];
}

export async function getStockData(): Promise<StockData> {
    try {
        const { data, error } = await supabase
            .from('dados_estoque')
            .select('*');

        if (error) {
            console.error("Supabase Error:", error);
            throw error;
        }

        if (!data) {
            return { sumario: [], detalhe: [] };
        }

        const rawData = data as EstoqueItem[];

        // Classification fallback: If tipo_registro is missing, deduce from columns.
        // Summary rows generally have id_produto as null/undefined.
        // Detail rows have id_produto populated.
        const sumario = rawData.filter((item): item is EstoqueSumario => {
            const anyItem = item as any;
            return anyItem.tipo_registro?.toUpperCase() === 'SUMARIO' ||
                (!anyItem.id_produto && !!anyItem.total_produtos);
        });

        const detalhe = rawData.filter((item): item is EstoqueDetalhe => {
            const anyItem = item as any;
            return anyItem.tipo_registro?.toUpperCase() === 'DETALHE' ||
                (!!anyItem.id_produto);
        });

        return { sumario, detalhe };
    } catch (error) {
        console.error("Database Error:", error);
        return { sumario: [], detalhe: [] };
    }
}


// Deprecated: kept for backward compatibility if needed during transition, but simply calls the new one or returns empty
export async function getStockAnalysis() {
    return [];
}

export interface Supplier {
    id_fornecedor: number;
    nome_fornecedor: string;
    cidade: string;
    lead_time_padrao: number;
}

export async function getSuppliers(): Promise<Supplier[]> {
    // Placeholder to fix build. Future todo: migrate suppliers to new architecture if needed.
    return [];
}
