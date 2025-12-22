"use server";

import { supabase } from "@/lib/supabase";
import { EstoqueItem, EstoqueSumario, EstoqueDetalhe } from "@/types/estoque";

export interface StockData {
    sumario: EstoqueSumario[];
    detalhe: EstoqueDetalhe[];
}

export async function getStockData(): Promise<StockData> {
    try {
        // Supabase has a default limit of 1000 rows per query
        // We need to paginate to get all records
        const PAGE_SIZE = 1000;
        let allData: any[] = [];
        let from = 0;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await supabase
                .from('dados_estoque')
                .select('*')
                .range(from, from + PAGE_SIZE - 1)
                .order('id', { ascending: true });

            if (error) {
                console.error("Supabase Error:", error);
                throw error;
            }

            if (!data || data.length === 0) {
                hasMore = false;
            } else {
                allData = [...allData, ...data];
                from += PAGE_SIZE;
                // If we got less than PAGE_SIZE, we've reached the end
                if (data.length < PAGE_SIZE) {
                    hasMore = false;
                }
            }
        }

        if (allData.length === 0) {
            return { sumario: [], detalhe: [] };
        }

        const rawData = allData;

        // Filter SUMARIO: tipo_registro is 'SUMARIO'
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
