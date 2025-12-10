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

        const sumario = rawData.filter((item): item is EstoqueSumario => item.tipo_registro === 'SUMARIO');
        const detalhe = rawData.filter((item): item is EstoqueDetalhe => item.tipo_registro === 'DETALHE');

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
