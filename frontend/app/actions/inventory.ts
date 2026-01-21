"use server";

import { supabase } from "@/lib/supabase";
import { DadosEstoque, ResumoEstoque } from "@/types/estoque";
import { logger } from "@/lib/logger";

export interface StockData {
    produtos: DadosEstoque[];
    resumo: ResumoEstoque;
}

// Filtros para busca paginada
export interface StockFilters {
    status?: string;
    abc?: string;
    search?: string;
    minCoverage?: number;
    maxCoverage?: number;
    alerta?: string;
}

// Resultado paginado
export interface PaginatedStockResult {
    items: DadosEstoque[];
    totalCount: number;
    totalValue: number;
    currentPage: number;
    totalPages: number;
    pageSize: number;
}

/**
 * Busca dados de estoque com paginação server-side
 */
export async function getStockDataPaginated(
    page = 1,
    pageSize = 50,
    filters?: StockFilters
): Promise<PaginatedStockResult> {
    try {
        const from = (page - 1) * pageSize;

        let query = supabase
            .from('dados_estoque')
            .select('*', { count: 'exact' })
            .range(from, from + pageSize - 1)
            .order('prioridade_compra', { ascending: true })
            .order('dias_de_cobertura', { ascending: true });

        // Aplicar filtros
        if (filters?.status) {
            query = query.ilike('status_ruptura', `%${filters.status}%`);
        }
        if (filters?.abc) {
            query = query.eq('classe_abc', filters.abc);
        }
        if (filters?.search) {
            query = query.or(`produto_descricao.ilike.%${filters.search}%`);
        }
        if (filters?.alerta) {
            if (filters.alerta === 'RUPTURA') {
                query = query.or('status_ruptura.ilike.%Ruptura%,status_ruptura.ilike.%Crítico%');
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

        // Calcular valor total
        let totalValue = 0;
        try {
            const { data: valueData } = await supabase
                .from('dados_estoque')
                .select('valor_estoque_custo');

            if (valueData) {
                totalValue = valueData.reduce((sum, item) => {
                    const value = Number(item.valor_estoque_custo || 0);
                    return sum + (isNaN(value) ? 0 : value);
                }, 0);
            }
        } catch (valueError) {
            logger.debug("Não foi possível calcular valor total:", valueError);
        }

        return {
            items: (data || []) as DadosEstoque[],
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
 */
export async function getStockData(): Promise<StockData> {
    try {
        const PAGE_SIZE = 1000;
        let allData: DadosEstoque[] = [];
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
                allData = [...allData, ...data] as DadosEstoque[];
                from += PAGE_SIZE;
                if (data.length < PAGE_SIZE) {
                    hasMore = false;
                }
            }
        }

        if (allData.length === 0) {
            return {
                produtos: [],
                resumo: {
                    total_produtos: 0,
                    produtos_ruptura: 0,
                    produtos_chegando: 0,
                    produtos_criticos: 0,
                    produtos_atencao: 0,
                    produtos_ok: 0,
                    valor_total_estoque: 0,
                    valor_sugestao_compra: 0,
                    total_classe_a: 0,
                    total_classe_b: 0,
                    total_classe_c: 0,
                }
            };
        }

        const resumo: ResumoEstoque = {
            total_produtos: allData.length,
            produtos_ruptura: allData.filter(p => p.status_ruptura?.includes('Ruptura')).length,
            produtos_chegando: allData.filter(p => p.status_ruptura?.includes('Chegando')).length,
            produtos_criticos: allData.filter(p => p.status_ruptura?.includes('Crítico')).length,
            produtos_atencao: allData.filter(p => p.status_ruptura?.includes('Atenção')).length,
            produtos_ok: allData.filter(p => p.status_ruptura?.includes('Saudável')).length,
            valor_total_estoque: allData.reduce((acc, p) => acc + (Number(p.valor_estoque_custo) || 0), 0),
            valor_sugestao_compra: allData.reduce((acc, p) => acc + ((Number(p.sugestao_compra_ajustada) || 0) * (Number(p.custo) || 0)), 0),
            total_classe_a: allData.filter(p => p.classe_abc === 'A').length,
            total_classe_b: allData.filter(p => p.classe_abc === 'B').length,
            total_classe_c: allData.filter(p => p.classe_abc === 'C').length,
        };

        logger.debug(`Loaded ${allData.length} products`);
        return { produtos: allData, resumo };
    } catch (error) {
        logger.error("Database Error:", error);
        return {
            produtos: [],
            resumo: {
                total_produtos: 0,
                produtos_ruptura: 0,
                produtos_chegando: 0,
                produtos_criticos: 0,
                produtos_atencao: 0,
                produtos_ok: 0,
                valor_total_estoque: 0,
                valor_sugestao_compra: 0,
                total_classe_a: 0,
                total_classe_b: 0,
                total_classe_c: 0,
            }
        };
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
    return [];
}
