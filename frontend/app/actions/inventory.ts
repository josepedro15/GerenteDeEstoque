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

        const rawData = data as any[];

        // Filter SUMARIO: tipo_registro is 'SUMARIO'
        // CASTING note: The database returns everything as strings usually, but our interface expects numbers.
        // We will pass the raw strings to the frontend and let the frontend formatters handle parsing
        // OR we map them here. Since we made `formatters.ts`, let's keep raw data flowing to components 
        // essentially, or loosely cast.

        const sumario = rawData.filter(item => item.tipo_registro === 'SUMARIO') as EstoqueSumario[];

        const detalhe = rawData.filter(item => item.tipo_registro === 'DETALHE') as EstoqueDetalhe[];

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
