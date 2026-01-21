// ============================================================
// SERVIÇO: Análise de Estoque (dados_estoque)
// ============================================================

import { supabase } from "@/lib/supabase";
import type {
    DadosEstoque,
    FiltroEstoque,
    ResumoEstoque,
    StatusRuptura,
    ClasseABC,
} from "@/types/estoque";

export const estoqueService = {
    /**
     * Busca todos os produtos com filtros opcionais
     */
    async getAll(filtros?: FiltroEstoque): Promise<DadosEstoque[]> {
        let query = supabase
            .from("dados_estoque")
            .select("*")
            .order("prioridade_compra", { ascending: true })
            .order("dias_de_cobertura", { ascending: true });

        // Filtro por status de ruptura
        if (filtros?.status_ruptura) {
            if (Array.isArray(filtros.status_ruptura)) {
                query = query.in("status_ruptura", filtros.status_ruptura);
            } else {
                query = query.eq("status_ruptura", filtros.status_ruptura);
            }
        }

        // Filtro por classe ABC
        if (filtros?.classe_abc) {
            if (Array.isArray(filtros.classe_abc)) {
                query = query.in("classe_abc", filtros.classe_abc);
            } else {
                query = query.eq("classe_abc", filtros.classe_abc);
            }
        }

        // Filtro por prioridade
        if (filtros?.prioridade_compra) {
            if (Array.isArray(filtros.prioridade_compra)) {
                query = query.in("prioridade_compra", filtros.prioridade_compra);
            } else {
                query = query.eq("prioridade_compra", filtros.prioridade_compra);
            }
        }

        // Filtro por fornecedor
        if (filtros?.fornecedor_principal) {
            query = query.ilike("fornecedor_principal", `%${filtros.fornecedor_principal}%`);
        }

        // Filtro por tendência
        if (filtros?.tendencia) {
            query = query.eq("tendencia", filtros.tendencia);
        }

        // Busca textual
        if (filtros?.busca) {
            query = query.or(
                `produto_descricao.ilike.%${filtros.busca}%,fornecedor_principal.ilike.%${filtros.busca}%`
            );
        }

        const { data, error } = await query;

        if (error) {
            console.error("Erro ao buscar estoque:", error);
            throw new Error(`Erro ao buscar estoque: ${error.message}`);
        }

        return (data || []) as DadosEstoque[];
    },

    /**
     * Busca um produto por ID
     */
    async getById(idProduto: number): Promise<DadosEstoque | null> {
        const { data, error } = await supabase
            .from("dados_estoque")
            .select("*")
            .eq("id_produto", idProduto)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return null;
            }
            console.error("Erro ao buscar produto:", error);
            throw new Error(`Erro ao buscar produto: ${error.message}`);
        }

        return data as DadosEstoque;
    },

    /**
     * Busca resumo geral do estoque
     */
    async getResumo(): Promise<ResumoEstoque> {
        const { data, error } = await supabase
            .from("dados_estoque")
            .select("status_ruptura, classe_abc, valor_estoque_custo, sugestao_compra_ajustada, custo");

        if (error) {
            console.error("Erro ao buscar resumo:", error);
            throw new Error(`Erro ao buscar resumo: ${error.message}`);
        }

        const produtos = data || [];

        return {
            total_produtos: produtos.length,
            produtos_ruptura: produtos.filter(p => p.status_ruptura === '🔴 Ruptura').length,
            produtos_chegando: produtos.filter(p => p.status_ruptura === '🟣 Chegando').length,
            produtos_criticos: produtos.filter(p => p.status_ruptura === '🟠 Crítico').length,
            produtos_atencao: produtos.filter(p => p.status_ruptura === '🟡 Atenção').length,
            produtos_ok: produtos.filter(p => p.status_ruptura === '🟢 Saudável').length,
            valor_total_estoque: produtos.reduce((acc, p) => acc + (Number(p.valor_estoque_custo) || 0), 0),
            valor_sugestao_compra: produtos.reduce((acc, p) => acc + ((Number(p.sugestao_compra_ajustada) || 0) * (Number(p.custo) || 0)), 0),
            total_classe_a: produtos.filter(p => p.classe_abc === 'A').length,
            total_classe_b: produtos.filter(p => p.classe_abc === 'B').length,
            total_classe_c: produtos.filter(p => p.classe_abc === 'C').length,
        };
    },

    /**
     * Busca top N produtos urgentes
     */
    async getTopUrgentes(limit: number = 10): Promise<DadosEstoque[]> {
        const { data, error } = await supabase
            .from("dados_estoque")
            .select("*")
            .in("prioridade_compra", ["1-URGENTE", "2-ALTA"])
            .order("prioridade_compra", { ascending: true })
            .order("dias_de_cobertura", { ascending: true })
            .limit(limit);

        if (error) {
            console.error("Erro ao buscar urgentes:", error);
            throw new Error(`Erro ao buscar urgentes: ${error.message}`);
        }

        return (data || []) as DadosEstoque[];
    },

    /**
     * Busca produtos por status
     */
    async getByStatus(status: StatusRuptura): Promise<DadosEstoque[]> {
        return this.getAll({ status_ruptura: status });
    },

    /**
     * Busca produtos por classe ABC
     */
    async getByClasse(classe: ClasseABC): Promise<DadosEstoque[]> {
        return this.getAll({ classe_abc: classe });
    },

    /**
     * Busca produtos por fornecedor
     */
    async getByFornecedor(fornecedor: string): Promise<DadosEstoque[]> {
        return this.getAll({ fornecedor_principal: fornecedor });
    },

    /**
     * Busca lista de fornecedores únicos
     */
    async getFornecedoresUnicos(): Promise<string[]> {
        const { data, error } = await supabase
            .from("dados_estoque")
            .select("fornecedor_principal")
            .not("fornecedor_principal", "is", null)
            .not("fornecedor_principal", "eq", "(Sem fornecedor)");

        if (error) {
            console.error("Erro ao buscar fornecedores:", error);
            return [];
        }

        const fornecedores = new Set<string>();
        (data || []).forEach((row) => {
            if (row.fornecedor_principal) fornecedores.add(row.fornecedor_principal);
        });

        return Array.from(fornecedores).sort();
    },

    /**
     * Busca contagem por status
     */
    async getContagemPorStatus(): Promise<Record<StatusRuptura, number>> {
        const { data, error } = await supabase
            .from("dados_estoque")
            .select("status_ruptura");

        if (error) {
            console.error("Erro ao buscar contagem:", error);
            throw new Error(`Erro ao buscar contagem: ${error.message}`);
        }

        const contagem: Record<string, number> = {
            '🔴 Ruptura': 0,
            '🟣 Chegando': 0,
            '🟠 Crítico': 0,
            '🟡 Atenção': 0,
            '🟢 Saudável': 0,
            '⚪ Excesso': 0,
        };

        (data || []).forEach((row) => {
            if (row.status_ruptura && contagem[row.status_ruptura] !== undefined) {
                contagem[row.status_ruptura]++;
            }
        });

        return contagem as Record<StatusRuptura, number>;
    },

    /**
     * Busca contagem por classe ABC
     */
    async getContagemPorABC(): Promise<Record<ClasseABC, number>> {
        const { data, error } = await supabase
            .from("dados_estoque")
            .select("classe_abc");

        if (error) {
            console.error("Erro ao buscar contagem ABC:", error);
            throw new Error(`Erro ao buscar contagem ABC: ${error.message}`);
        }

        const contagem: Record<ClasseABC, number> = { A: 0, B: 0, C: 0 };

        (data || []).forEach((row) => {
            if (row.classe_abc && contagem[row.classe_abc as ClasseABC] !== undefined) {
                contagem[row.classe_abc as ClasseABC]++;
            }
        });

        return contagem;
    },
};
