// ============================================================
// SERVIÇO: Pedidos em Trânsito (pedidos_transito)
// ============================================================

import { supabase } from "@/lib/supabase";
import type {
    PedidoTransito,
    FiltroPedido,
    ResumoPedidos,
    StatusPedido,
} from "@/types/fornecedor";

export const pedidoTransitoService = {
    /**
     * Busca todos os pedidos com filtros opcionais
     */
    async getAll(filtros?: FiltroPedido): Promise<PedidoTransito[]> {
        let query = supabase
            .from("pedidos_transito")
            .select("*")
            .order("dias_aguardando", { ascending: false });

        // Filtro por status
        if (filtros?.status_pedido) {
            if (Array.isArray(filtros.status_pedido)) {
                query = query.in("status_pedido", filtros.status_pedido);
            } else {
                query = query.eq("status_pedido", filtros.status_pedido);
            }
        }

        // Filtro por fornecedor
        if (filtros?.fornecedor) {
            query = query.ilike("fornecedor_nome", `%${filtros.fornecedor}%`);
        }

        // Filtro por dias mínimo
        if (filtros?.dias_minimo) {
            query = query.gte("dias_aguardando", filtros.dias_minimo);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Erro ao buscar pedidos:", error);
            throw new Error(`Erro ao buscar pedidos: ${error.message}`);
        }

        return (data || []) as PedidoTransito[];
    },

    /**
     * Busca um pedido por ID
     */
    async getById(idPedido: number): Promise<PedidoTransito | null> {
        const { data, error } = await supabase
            .from("pedidos_transito")
            .select("*")
            .eq("id_pedido", idPedido)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return null;
            }
            console.error("Erro ao buscar pedido:", error);
            throw new Error(`Erro ao buscar pedido: ${error.message}`);
        }

        return data as PedidoTransito;
    },

    /**
     * Busca resumo dos pedidos
     */
    async getResumo(): Promise<ResumoPedidos> {
        const { data, error } = await supabase
            .from("pedidos_transito")
            .select("status_pedido, valor_pedido, dias_aguardando");

        if (error) {
            console.error("Erro ao buscar resumo:", error);
            throw new Error(`Erro ao buscar resumo: ${error.message}`);
        }

        const pedidos = (data || []).filter(p => p.status_pedido !== '✅ SEM PENDÊNCIAS');

        if (pedidos.length === 0) {
            return {
                total_pedidos: 0,
                pedidos_atrasados: 0,
                pedidos_pendentes: 0,
                pedidos_recentes: 0,
                valor_total_transito: 0,
                dias_medio_aguardando: 0,
            };
        }

        return {
            total_pedidos: pedidos.length,
            pedidos_atrasados: pedidos.filter(p => p.status_pedido === '🔴 ATRASADO').length,
            pedidos_pendentes: pedidos.filter(p => p.status_pedido === '🟡 PENDENTE').length,
            pedidos_recentes: pedidos.filter(p => p.status_pedido === '🟢 RECENTE').length,
            valor_total_transito: pedidos.reduce((acc, p) => acc + (Number(p.valor_pedido) || 0), 0),
            dias_medio_aguardando: Math.round(
                pedidos.reduce((acc, p) => acc + (Number(p.dias_aguardando) || 0), 0) / pedidos.length
            ),
        };
    },

    /**
     * Busca pedidos atrasados (> 30 dias)
     */
    async getAtrasados(): Promise<PedidoTransito[]> {
        return this.getAll({ status_pedido: '🔴 ATRASADO' });
    },

    /**
     * Busca pedidos pendentes (15-30 dias)
     */
    async getPendentes(): Promise<PedidoTransito[]> {
        return this.getAll({ status_pedido: '🟡 PENDENTE' });
    },

    /**
     * Verifica se há pedidos (ignora o fallback "sem pendências")
     */
    async temPedidos(): Promise<boolean> {
        const { data, error } = await supabase
            .from("pedidos_transito")
            .select("id_pedido")
            .neq("status_pedido", "✅ SEM PENDÊNCIAS")
            .limit(1);

        if (error) {
            console.error("Erro ao verificar pedidos:", error);
            return false;
        }

        return (data || []).length > 0;
    },

    /**
     * Busca contagem por status
     */
    async getContagemPorStatus(): Promise<Record<StatusPedido, number>> {
        const { data, error } = await supabase
            .from("pedidos_transito")
            .select("status_pedido");

        if (error) {
            console.error("Erro ao buscar contagem:", error);
            throw new Error(`Erro ao buscar contagem: ${error.message}`);
        }

        const contagem: Record<StatusPedido, number> = {
            '🔴 ATRASADO': 0,
            '🟡 PENDENTE': 0,
            '🟢 RECENTE': 0,
            '✅ SEM PENDÊNCIAS': 0,
        };

        (data || []).forEach((row) => {
            const status = row.status_pedido as StatusPedido;
            if (contagem[status] !== undefined) {
                contagem[status]++;
            }
        });

        return contagem;
    },
};
