// ============================================================
// SERVIÇO: Relatório de Fornecedores (relatorio_fornecedores)
// ============================================================

import { supabase } from "@/lib/supabase";
import type {
    RelatorioFornecedor,
    FiltroFornecedor,
    ResumoFornecedores,
} from "@/types/fornecedor";

export const relatorioFornecedorService = {
    /**
     * Busca todos os fornecedores com filtros opcionais
     */
    async getAll(filtros?: FiltroFornecedor): Promise<RelatorioFornecedor[]> {
        let query = supabase
            .from("relatorio_fornecedores")
            .select("*");

        // Ordenação
        const ordenarPor = filtros?.ordenar_por || "valor_sugestao_compra";
        const direcao = filtros?.direcao || "desc";
        query = query.order(ordenarPor, { ascending: direcao === "asc" });

        // Busca textual
        if (filtros?.busca) {
            query = query.ilike("fornecedor", `%${filtros.busca}%`);
        }

        // Filtro por ruptura
        if (filtros?.com_ruptura) {
            query = query.gt("produtos_ruptura", 0);
        }

        // Filtro por críticos
        if (filtros?.com_criticos) {
            query = query.gt("produtos_criticos", 0);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Erro ao buscar fornecedores:", error);
            throw new Error(`Erro ao buscar fornecedores: ${error.message}`);
        }

        return (data || []) as RelatorioFornecedor[];
    },

    /**
     * Busca um fornecedor por ID
     */
    async getById(idFornecedor: number): Promise<RelatorioFornecedor | null> {
        const { data, error } = await supabase
            .from("relatorio_fornecedores")
            .select("*")
            .eq("id_fornecedor", idFornecedor)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return null;
            }
            console.error("Erro ao buscar fornecedor:", error);
            throw new Error(`Erro ao buscar fornecedor: ${error.message}`);
        }

        return data as RelatorioFornecedor;
    },

    /**
     * Busca resumo geral dos fornecedores
     */
    async getResumo(): Promise<ResumoFornecedores> {
        const { data, error } = await supabase
            .from("relatorio_fornecedores")
            .select("produtos_ruptura, produtos_criticos, valor_sugestao_compra");

        if (error) {
            console.error("Erro ao buscar resumo:", error);
            throw new Error(`Erro ao buscar resumo: ${error.message}`);
        }

        const fornecedores = data || [];

        return {
            total_fornecedores: fornecedores.length,
            fornecedores_com_ruptura: fornecedores.filter(f => Number(f.produtos_ruptura) > 0).length,
            fornecedores_com_criticos: fornecedores.filter(f => Number(f.produtos_criticos) > 0).length,
            valor_total_sugestao: fornecedores.reduce((acc, f) => acc + (Number(f.valor_sugestao_compra) || 0), 0),
        };
    },

    /**
     * Busca fornecedores com problemas (ruptura ou crítico)
     */
    async getComProblemas(): Promise<RelatorioFornecedor[]> {
        const { data, error } = await supabase
            .from("relatorio_fornecedores")
            .select("*")
            .or("produtos_ruptura.gt.0,produtos_criticos.gt.0")
            .order("produtos_ruptura", { ascending: false })
            .order("produtos_criticos", { ascending: false });

        if (error) {
            console.error("Erro ao buscar fornecedores com problemas:", error);
            throw new Error(`Erro ao buscar fornecedores: ${error.message}`);
        }

        return (data || []) as RelatorioFornecedor[];
    },

    /**
     * Busca top N fornecedores por valor de sugestão de compra
     */
    async getTopPorSugestao(limit: number = 10): Promise<RelatorioFornecedor[]> {
        const { data, error } = await supabase
            .from("relatorio_fornecedores")
            .select("*")
            .gt("valor_sugestao_compra", 0)
            .order("valor_sugestao_compra", { ascending: false })
            .limit(limit);

        if (error) {
            console.error("Erro ao buscar top fornecedores:", error);
            throw new Error(`Erro ao buscar fornecedores: ${error.message}`);
        }

        return (data || []) as RelatorioFornecedor[];
    },

    /**
     * Busca fornecedores para dropdown/select
     */
    async getForSelect(): Promise<Array<{ id: number; nome: string }>> {
        const { data, error } = await supabase
            .from("relatorio_fornecedores")
            .select("id_fornecedor, fornecedor")
            .order("fornecedor");

        if (error) {
            console.error("Erro ao buscar fornecedores:", error);
            return [];
        }

        return (data || []).map(f => ({
            id: f.id_fornecedor,
            nome: f.fornecedor,
        }));
    },
};
