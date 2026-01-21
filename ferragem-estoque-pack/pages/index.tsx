// ============================================================
// PÁGINA: Dashboard de Estoque
// ============================================================

import { useState, useEffect } from "react";
import { Sidebar, type PageId } from "@/components/layout/sidebar";
import { estoqueService } from "@/services/estoque.service";
import { pedidoTransitoService } from "@/services/pedidoTransito.service";
import type { DadosEstoque, ResumoEstoque, StatusRuptura, ClasseABC } from "@/types/estoque";
import type { ResumoPedidos } from "@/types/fornecedor";
import { cn } from "@/lib/utils";
import {
    HiExclamationTriangle,
    HiArrowPath,
    HiChartBar,
    HiTruck,
    HiCube,
    HiArrowTrendingUp,
    HiArrowTrendingDown,
} from "react-icons/hi2";

interface EstoqueDashboardProps {
    currentPage: PageId;
    onNavigate: (page: PageId) => void;
}

export function EstoqueDashboard({ currentPage, onNavigate }: EstoqueDashboardProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [resumoEstoque, setResumoEstoque] = useState<ResumoEstoque | null>(null);
    const [resumoPedidos, setResumoPedidos] = useState<ResumoPedidos | null>(null);
    const [topUrgentes, setTopUrgentes] = useState<DadosEstoque[]>([]);
    const [contagemStatus, setContagemStatus] = useState<Record<StatusRuptura, number> | null>(null);
    const [contagemABC, setContagemABC] = useState<Record<ClasseABC, number> | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setIsLoading(true);
        setError(null);

        try {
            const [resumo, pedidos, urgentes, statusCount, abcCount] = await Promise.all([
                estoqueService.getResumo(),
                pedidoTransitoService.getResumo(),
                estoqueService.getTopUrgentes(10),
                estoqueService.getContagemPorStatus(),
                estoqueService.getContagemPorABC(),
            ]);

            setResumoEstoque(resumo);
            setResumoPedidos(pedidos);
            setTopUrgentes(urgentes);
            setContagemStatus(statusCount);
            setContagemABC(abcCount);
        } catch (err) {
            console.error("Erro ao carregar dados:", err);
            setError("Erro ao carregar dados do estoque");
        } finally {
            setIsLoading(false);
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat("pt-BR").format(value);
    };

    return (
        <div className="flex min-h-screen bg-miranda-dark">
            <Sidebar currentPage={currentPage} onNavigate={onNavigate} />

            <main className="flex-1 p-6 lg:p-8 overflow-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Dashboard de Estoque</h1>
                        <p className="text-white/60 mt-1">Visão geral do estoque e alertas</p>
                    </div>
                    <button
                        onClick={loadData}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-miranda-primary/20 hover:bg-miranda-primary/30 text-miranda-primary rounded-lg transition-colors disabled:opacity-50"
                    >
                        <HiArrowPath className={cn("h-5 w-5", isLoading && "animate-spin")} />
                        Atualizar
                    </button>
                </div>

                {/* Erro */}
                {error && (
                    <div className="mb-6 p-4 bg-destructive/20 border border-destructive/30 rounded-lg text-white">
                        {error}
                    </div>
                )}

                {/* Loading */}
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <HiArrowPath className="h-8 w-8 animate-spin text-miranda-primary" />
                    </div>
                ) : (
                    <>
                        {/* Cards de Resumo */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {/* Total Produtos */}
                            <div className="bg-miranda-gray rounded-xl p-5 border border-white/10">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <HiCube className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <span className="text-white/60 text-sm">Total Produtos</span>
                                </div>
                                <div className="text-2xl font-bold text-white">
                                    {formatNumber(resumoEstoque?.total_produtos || 0)}
                                </div>
                            </div>

                            {/* Valor Estoque */}
                            <div className="bg-miranda-gray rounded-xl p-5 border border-white/10">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-green-500/20 rounded-lg">
                                        <HiChartBar className="h-5 w-5 text-green-400" />
                                    </div>
                                    <span className="text-white/60 text-sm">Valor Estoque</span>
                                </div>
                                <div className="text-2xl font-bold text-white">
                                    {formatCurrency(resumoEstoque?.valor_total_estoque || 0)}
                                </div>
                            </div>

                            {/* Produtos Críticos */}
                            <div className="bg-miranda-gray rounded-xl p-5 border border-white/10">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-orange-500/20 rounded-lg">
                                        <HiExclamationTriangle className="h-5 w-5 text-orange-400" />
                                    </div>
                                    <span className="text-white/60 text-sm">Críticos</span>
                                </div>
                                <div className="text-2xl font-bold text-orange-400">
                                    {formatNumber((resumoEstoque?.produtos_ruptura || 0) + (resumoEstoque?.produtos_criticos || 0))}
                                </div>
                                <div className="text-xs text-white/40 mt-1">
                                    {resumoEstoque?.produtos_ruptura || 0} ruptura + {resumoEstoque?.produtos_criticos || 0} críticos
                                </div>
                            </div>

                            {/* Pedidos em Trânsito */}
                            <div className="bg-miranda-gray rounded-xl p-5 border border-white/10">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-purple-500/20 rounded-lg">
                                        <HiTruck className="h-5 w-5 text-purple-400" />
                                    </div>
                                    <span className="text-white/60 text-sm">Em Trânsito</span>
                                </div>
                                <div className="text-2xl font-bold text-white">
                                    {formatNumber(resumoPedidos?.total_pedidos || 0)}
                                </div>
                                {(resumoPedidos?.pedidos_atrasados || 0) > 0 && (
                                    <div className="text-xs text-red-400 mt-1">
                                        ⚠️ {resumoPedidos?.pedidos_atrasados} atrasados
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status e ABC */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Status de Estoque */}
                            <div className="bg-miranda-gray rounded-xl p-5 border border-white/10">
                                <h3 className="text-lg font-semibold text-white mb-4">Status do Estoque</h3>
                                <div className="space-y-3">
                                    {contagemStatus && Object.entries(contagemStatus).map(([status, count]) => (
                                        <div key={status} className="flex items-center justify-between">
                                            <span className="text-sm">{status}</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full",
                                                            status.includes("Ruptura") && "bg-red-500",
                                                            status.includes("Chegando") && "bg-purple-500",
                                                            status.includes("Crítico") && "bg-orange-500",
                                                            status.includes("Atenção") && "bg-yellow-500",
                                                            status.includes("OK") && "bg-green-500",
                                                        )}
                                                        style={{ width: `${Math.min((count / (resumoEstoque?.total_produtos || 1)) * 100, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-white text-sm font-medium w-12 text-right">{formatNumber(count)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Curva ABC */}
                            <div className="bg-miranda-gray rounded-xl p-5 border border-white/10">
                                <h3 className="text-lg font-semibold text-white mb-4">Curva ABC</h3>
                                <div className="flex items-center justify-around h-40">
                                    {contagemABC && Object.entries(contagemABC).map(([classe, count]) => (
                                        <div key={classe} className="text-center">
                                            <div
                                                className={cn(
                                                    "w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold",
                                                    classe === "A" && "bg-green-500/20 text-green-400",
                                                    classe === "B" && "bg-yellow-500/20 text-yellow-400",
                                                    classe === "C" && "bg-red-500/20 text-red-400",
                                                )}
                                            >
                                                {classe}
                                            </div>
                                            <div className="mt-2 text-lg font-semibold text-white">{formatNumber(count)}</div>
                                            <div className="text-xs text-white/40">
                                                {((count / (resumoEstoque?.total_produtos || 1)) * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Top Urgentes */}
                        <div className="bg-miranda-gray rounded-xl p-5 border border-white/10">
                            <h3 className="text-lg font-semibold text-white mb-4">Top 10 Urgentes</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left text-white/60 text-sm border-b border-white/10">
                                            <th className="pb-3 font-medium">Produto</th>
                                            <th className="pb-3 font-medium">Fornecedor</th>
                                            <th className="pb-3 font-medium text-right">Estoque</th>
                                            <th className="pb-3 font-medium text-right">Cobertura</th>
                                            <th className="pb-3 font-medium text-center">Status</th>
                                            <th className="pb-3 font-medium text-center">Tendência</th>
                                            <th className="pb-3 font-medium text-right">Sugestão</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {topUrgentes.map((produto) => (
                                            <tr key={produto.id_produto} className="text-sm hover:bg-white/5">
                                                <td className="py-3 text-white max-w-xs truncate">
                                                    {produto.produto_descricao}
                                                </td>
                                                <td className="py-3 text-white/60 max-w-xs truncate">
                                                    {produto.fornecedor_principal}
                                                </td>
                                                <td className="py-3 text-white text-right">
                                                    {formatNumber(produto.estoque_atual)}
                                                </td>
                                                <td className="py-3 text-right">
                                                    <span className={cn(
                                                        "font-medium",
                                                        produto.dias_de_cobertura <= 3 && "text-red-400",
                                                        produto.dias_de_cobertura > 3 && produto.dias_de_cobertura <= 7 && "text-orange-400",
                                                        produto.dias_de_cobertura > 7 && "text-green-400",
                                                    )}>
                                                        {produto.dias_de_cobertura.toFixed(1)} dias
                                                    </span>
                                                </td>
                                                <td className="py-3 text-center">
                                                    <span className="text-xs">{produto.status_ruptura}</span>
                                                </td>
                                                <td className="py-3 text-center">
                                                    {produto.tendencia?.includes("Subindo") && <HiArrowTrendingUp className="inline h-4 w-4 text-green-400" />}
                                                    {produto.tendencia?.includes("Caindo") && <HiArrowTrendingDown className="inline h-4 w-4 text-red-400" />}
                                                    {produto.tendencia?.includes("Estável") && <span className="text-white/40">→</span>}
                                                </td>
                                                <td className="py-3 text-white text-right font-medium">
                                                    {formatNumber(produto.sugestao_compra_ajustada)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
