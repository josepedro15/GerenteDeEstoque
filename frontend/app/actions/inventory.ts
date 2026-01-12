"use server";

import { supabase } from "@/lib/supabase";
import { EstoqueSumario, EstoqueDetalhe } from "@/types/estoque";
import { logger } from "@/lib/logger";

export interface StockData {
    sumario: EstoqueSumario[];
    detalhe: EstoqueDetalhe[];
}

// Filtros para busca paginada
export interface StockFilters {
    status?: string;
    abc?: string;
    search?: string;
    minCoverage?: number;
    maxCoverage?: number;
    alerta?: string; // 'MORTO', 'LIQUIDAR', 'RUPTURA', etc.
}

// Resultado paginado
export interface PaginatedStockResult {
    items: EstoqueDetalhe[];
    totalCount: number;
    totalValue: number;
    currentPage: number;
    totalPages: number;
    pageSize: number;
}

/**
 * Busca dados de estoque com paginação server-side
 * Ideal para listagens de produtos onde não precisa de todos os dados
 */
export async function getStockDataPaginated(
    page = 1,
    pageSize = 50,
    filters?: StockFilters
): Promise<PaginatedStockResult> {
    try {
        const from = (page - 1) * pageSize;

        // Construir query base
        let query = supabase
            .from('dados_estoque')
            .select('*', { count: 'exact' })
            .eq('tipo_registro', 'DETALHE')
            .range(from, from + pageSize - 1)
            .order('id', { ascending: true });

        // Aplicar filtros
        if (filters?.status) {
            query = query.ilike('status_ruptura', `%${filters.status}%`);
        }
        if (filters?.abc) {
            query = query.eq('classe_abc', filters.abc);
        }
        if (filters?.search) {
            query = query.or(`produto_descricao.ilike.%${filters.search}%,id_produto.ilike.%${filters.search}%`);
        }
        if (filters?.alerta) {
            // Filtro especial para RUPTURA que usa status_ruptura
            if (filters.alerta === 'RUPTURA') {
                query = query.or('status_ruptura.ilike.%RUPTURA%,status_ruptura.ilike.%CRÍTICO%');
            } else {
                query = query.ilike('alerta_estoque', `%${filters.alerta}%`);
            }
        }

        const { data, count, error } = await query;

        if (error) {
            logger.error("Supabase Error (paginated):", error);
            throw error;
        }

        const totalCount = count || 0;
        const totalPages = Math.ceil(totalCount / pageSize);

        // Calcular valor total dos itens na página (nota: para valor total real, seria necessária query separada)
        // Aqui fazemos uma query separada para obter o totalValue de todos os itens filtrados
        let totalValue = 0;
        try {
            let valueQuery = supabase
                .from('dados_estoque')
                .select('valor_estoque_custo')
                .eq('tipo_registro', 'DETALHE');

            // Aplicar os mesmos filtros para a query de valor total
            if (filters?.status) {
                valueQuery = valueQuery.ilike('status_ruptura', `%${filters.status}%`);
            }
            if (filters?.abc) {
                valueQuery = valueQuery.eq('classe_abc', filters.abc);
            }
            if (filters?.search) {
                valueQuery = valueQuery.or(`produto_descricao.ilike.%${filters.search}%,id_produto.ilike.%${filters.search}%`);
            }
            if (filters?.alerta) {
                if (filters.alerta === 'RUPTURA') {
                    valueQuery = valueQuery.or('status_ruptura.ilike.%RUPTURA%,status_ruptura.ilike.%CRÍTICO%');
                } else {
                    valueQuery = valueQuery.ilike('alerta_estoque', `%${filters.alerta}%`);
                }
            }

            // Paginar para obter todos os valores
            const { data: allValues } = await valueQuery;
            if (allValues) {
                totalValue = allValues.reduce((sum, item) => {
                    const value = parseFloat(String(item.valor_estoque_custo || 0));
                    return sum + (isNaN(value) ? 0 : value);
                }, 0);
            }
        } catch (valueError) {
            logger.debug("Não foi possível calcular valor total:", valueError);
        }

        return {
            items: (data || []) as EstoqueDetalhe[],
            totalCount,
            totalValue,
            currentPage: page,
            totalPages,
            pageSize
        };
    } catch (error) {
        logger.error("Database Error (paginated):", error);
        return {
            items: [],
            totalCount: 0,
            totalValue: 0,
            currentPage: page,
            totalPages: 0,
            pageSize
        };
    }
}

/**
 * Busca TODOS os dados de estoque
 * Usado pelo dashboard que precisa calcular métricas sobre todos os produtos
 * @deprecated Para listagens, use getStockDataPaginated
 */
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
                logger.error("Supabase Error:", error);
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

        // Filter by tipo_registro
        const sumario = allData.filter(item => item.tipo_registro === 'SUMARIO') as EstoqueSumario[];
        const detalhe = allData.filter(item => item.tipo_registro === 'DETALHE') as EstoqueDetalhe[];

        logger.debug(`Loaded ${detalhe.length} products, ${sumario.length} summary records`);
        return { sumario, detalhe };
    } catch (error) {
        logger.error("Database Error:", error);
        return { sumario: [], detalhe: [] };
    }
}


// Deprecated: kept for backward compatibility
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

