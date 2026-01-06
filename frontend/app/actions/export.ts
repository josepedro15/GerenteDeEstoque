'use server';

import { createClient } from "@/utils/supabase/server";
import { logger } from "@/lib/logger";
import { logAuditAction, AUDIT_ACTIONS } from "./audit";
import { EstoqueDetalhe } from "@/types/estoque";

/**
 * Prepara dados de produtos para exportação
 * Retorna dados formatados que podem ser convertidos em Excel no cliente
 */
export async function prepareExportData(
    filters?: {
        status?: string;
        abc?: string;
        search?: string;
    }
): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Usuário não autenticado" };
        }

        // Construir query
        let query = supabase
            .from('dados_estoque')
            .select('*')
            .eq('tipo_registro', 'DETALHE')
            .order('produto_descricao', { ascending: true });

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

        const { data, error } = await query;

        if (error) {
            logger.error("Error fetching export data:", error);
            return { success: false, error: error.message };
        }

        // Formatar dados para exportação
        const exportData = (data || []).map((item: EstoqueDetalhe) => ({
            'Código': item.id_produto || '',
            'Descrição': item.produto_descricao || '',
            'Estoque Atual': item.estoque_atual,
            'Preço': item.preco,
            'Custo': item.custo,
            'Margem Unitária': item.margem_unitaria || '',
            'Margem %': item.margem_percentual || '',
            'Dias de Cobertura': item.dias_de_cobertura,
            'Média Diária': item.media_diaria_venda,
            'Classe ABC': item.classe_abc || '',
            'Status': item.status_ruptura || '',
            'Giro Mensal': item.giro_mensal || '',
            'Valor Estoque (Custo)': item.valor_estoque_custo || '',
            'Valor Estoque (Venda)': item.valor_estoque_venda || '',
            'Tendência': item.tendencia || '',
            'Prioridade Compra': item.prioridade_compra || '',
            'Alerta': item.alerta_estoque || ''
        }));

        // Log audit (non-blocking - don't fail export if audit fails)
        try {
            await logAuditAction(AUDIT_ACTIONS.EXPORT_EXCEL, 'products', undefined, {
                new: { count: exportData.length, filters }
            });
        } catch (auditError) {
            logger.warn("Audit logging failed, but export continues:", auditError);
        }

        return { success: true, data: exportData };
    } catch (e: any) {
        logger.error("Error preparing export data:", e);
        return { success: false, error: e.message };
    }
}

/**
 * Prepara resumo do dashboard para exportação PDF
 */
export async function prepareDashboardExport(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Usuário não autenticado" };
        }

        // Buscar dados agregados
        const { data: allData, error } = await supabase
            .from('dados_estoque')
            .select('*')
            .eq('tipo_registro', 'DETALHE');

        if (error) {
            logger.error("Error fetching dashboard data:", error);
            return { success: false, error: error.message };
        }

        const products = allData || [];

        // Calcular métricas
        const totalProducts = products.length;
        const totalValue = products.reduce((sum, p) => sum + (Number(p.estoque_atual) * Number(p.preco || 0)), 0);
        const avgCoverage = products.reduce((sum, p) => sum + Number(p.dias_de_cobertura || 0), 0) / totalProducts;

        // Agrupar por status
        const statusGroups: Record<string, number> = {};
        products.forEach(p => {
            const status = p.status_ruptura || 'Indefinido';
            statusGroups[status] = (statusGroups[status] || 0) + 1;
        });

        // Agrupar por ABC
        const abcGroups: Record<string, number> = {};
        products.forEach(p => {
            const abc = p.classe_abc || 'N/A';
            abcGroups[abc] = (abcGroups[abc] || 0) + 1;
        });

        const dashboardData = {
            generatedAt: new Date().toISOString(),
            summary: {
                totalProducts,
                totalValue,
                avgCoverage: avgCoverage.toFixed(1),
            },
            statusDistribution: statusGroups,
            abcDistribution: abcGroups,
            topExcessStock: products
                .sort((a, b) => Number(b.dias_de_cobertura) - Number(a.dias_de_cobertura))
                .slice(0, 10)
                .map(p => ({
                    codigo: p.id_produto,
                    descricao: p.produto_descricao,
                    cobertura: p.dias_de_cobertura,
                    estoque: p.estoque_atual
                })),
            criticalItems: products
                .filter(p => (p.status_ruptura || '').toLowerCase().includes('ruptura'))
                .slice(0, 10)
                .map(p => ({
                    codigo: p.id_produto,
                    descricao: p.produto_descricao,
                    status: p.status_ruptura,
                    estoque: p.estoque_atual
                }))
        };

        // Log audit (non-blocking)
        try {
            await logAuditAction(AUDIT_ACTIONS.EXPORT_PDF, 'dashboard');
        } catch (auditError) {
            logger.warn("Audit logging failed:", auditError);
        }

        return { success: true, data: dashboardData };
    } catch (e: any) {
        logger.error("Error preparing dashboard export:", e);
        return { success: false, error: e.message };
    }
}
