"use client";

import { useState, useMemo, useEffect } from "react";
import {
    Search, ChevronLeft, ChevronRight, Truck, AlertTriangle,
    ArrowUpDown, ArrowUp, ArrowDown, Download, Users, Package,
    DollarSign, Activity, AlertOctagon, TrendingUp, Info, Eye, ShoppingCart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { relatorioFornecedorService, estoqueService } from "@/lib/services";
import { RelatorioFornecedor } from "@/types/fornecedor";
import { DadosEstoque } from "@/types/estoque";

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<RelatorioFornecedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [currentTab, setCurrentTab] = useState("geral");
    const [currentPage, setCurrentPage] = useState(1);

    // Drill Down State
    const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
    const [supplierProducts, setSupplierProducts] = useState<DadosEstoque[]>([]);
    const [productsLoading, setProductsLoading] = useState(false);

    const ITEMS_PER_PAGE = 25;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await relatorioFornecedorService.getAll();
            setSuppliers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenSupplier = async (supplierName: string) => {
        setSelectedSupplier(supplierName);
        setProductsLoading(true);
        try {
            const products = await estoqueService.getByFornecedor(supplierName);
            setSupplierProducts(products);
        } catch (error) {
            console.error("Erro ao buscar produtos do fornecedor:", error);
        } finally {
            setProductsLoading(false);
        }
    };

    const handleCloseModal = () => {
        setSelectedSupplier(null);
        setSupplierProducts([]);
    };

    // KPIs
    const kpis = useMemo(() => {
        const totalSugestao = suppliers.reduce((acc, s) => acc + (Number(s.valor_sugestao_compra) || 0), 0);
        const fornecedoresRisco = suppliers.filter(s => Number(s.produtos_ruptura) > 0 || Number(s.produtos_criticos) > 0).length;
        const fornecedoresComPedir = suppliers.filter(s => Number(s.valor_sugestao_compra) > 0).length;

        return { totalSugestao, fornecedoresRisco, fornecedoresComPedir };
    }, [suppliers]);

    // Filter logic
    const filteredSuppliers = useMemo(() => {
        let result = suppliers;

        // Text Search
        if (search.trim()) {
            const term = search.toLowerCase();
            result = result.filter(s =>
                s.fornecedor?.toLowerCase().includes(term)
            );
        }

        // Tab Filtering
        if (currentTab === "compras") {
            result = result.filter(s => Number(s.valor_sugestao_compra) > 0);
            result.sort((a, b) => Number(b.valor_sugestao_compra) - Number(a.valor_sugestao_compra));
        } else if (currentTab === "risco") {
            result = result.filter(s => Number(s.produtos_ruptura) > 0);
            result.sort((a, b) => Number(b.produtos_ruptura) - Number(a.produtos_ruptura));
        } else if (currentTab === "pareto") {
            result.sort((a, b) => Number(b.faturamento_60d || b.valor_estoque_custo) - Number(a.faturamento_60d || a.valor_estoque_custo));
        }

        return result;
    }, [suppliers, search, currentTab]);

    // Pagination
    const totalPages = Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE);
    const paginatedSuppliers = filteredSuppliers.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Helper for visual health bar
    const HealthBar = ({ supplier }: { supplier: RelatorioFornecedor }) => {
        const total = (Number(supplier.produtos_ruptura) + Number(supplier.produtos_criticos) + Number(supplier.produtos_atencao) + Number(supplier.produtos_ok)) || 1;
        const pRuptura = (Number(supplier.produtos_ruptura) / total) * 100;
        const pCritico = (Number(supplier.produtos_criticos) / total) * 100;
        const pAtencao = (Number(supplier.produtos_atencao) / total) * 100;
        const pOk = (Number(supplier.produtos_ok) / total) * 100;

        return (
            <div className="flex h-2 w-full rounded-full overflow-hidden bg-muted/30">
                {pRuptura > 0 && <div style={{ width: `${pRuptura}%` }} className="bg-red-500" title={`Ruptura: ${supplier.produtos_ruptura}`} />}
                {pCritico > 0 && <div style={{ width: `${pCritico}%` }} className="bg-amber-500" title={`Crítico: ${supplier.produtos_criticos}`} />}
                {pAtencao > 0 && <div style={{ width: `${pAtencao}%` }} className="bg-blue-400" title={`Atenção: ${supplier.produtos_atencao}`} />}
                {pOk > 0 && <div style={{ width: `${pOk}%` }} className="bg-emerald-400" title={`Saudável: ${supplier.produtos_ok}`} />}
            </div>
        );
    };

    const handleDownload = () => {
        const headers = ["ID", "Fornecedor", "Valor Estoque", "Valor Trânsito", "Sugestão Compra", "Ruptura", "Crítico", "Atenção", "Saudável"];
        const csvContent = [
            headers.join(","),
            ...filteredSuppliers.map(s => [
                s.id_fornecedor,
                `"${s.fornecedor.replace(/"/g, '""')}"`,
                s.valor_estoque_custo,
                s.valor_transito_custo,
                s.valor_sugestao_compra,
                s.produtos_ruptura,
                s.produtos_criticos,
                s.produtos_atencao,
                s.produtos_ok
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `fornecedores_smartorders_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 p-4 lg:p-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Users className="text-primary" size={24} />
                        Gestão de Fornecedores
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Analise o desempenho e necessidades de compra dos seus parceiros.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownload}
                        className="gap-2"
                    >
                        <Download size={16} />
                        Exportar CSV
                    </Button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-card to-card/50 border-primary/10">
                    <CardHeader className="pb-2">
                        <CardDescription>Pipeline de Compras</CardDescription>
                        <CardTitle className="text-2xl text-primary">{formatCurrency(kpis.totalSugestao)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <TrendingUp size={12} className="text-emerald-500" />
                            Necessário para regularizar estoques
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-card to-card/50 border-red-500/10">
                    <CardHeader className="pb-2">
                        <CardDescription>Risco de Ruptura</CardDescription>
                        <CardTitle className="text-2xl text-red-500">{kpis.fornecedoresRisco}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <AlertOctagon size={12} className="text-red-500" />
                            Fornecedores com itens críticos
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-card to-card/50">
                    <CardHeader className="pb-2">
                        <CardDescription>Oportunidades</CardDescription>
                        <CardTitle className="text-2xl">{kpis.fornecedoresComPedir}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <DollarSign size={12} className="text-amber-500" />
                            Parceiros com sugestão de compra ativa
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content with Tabs */}
            <Tabs defaultValue="geral" className="w-full" onValueChange={(val) => { setCurrentTab(val); setCurrentPage(1); }}>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
                    <TabsList className="grid w-full md:w-auto grid-cols-4">
                        <TabsTrigger value="geral">Geral</TabsTrigger>
                        <TabsTrigger value="compras" className="gap-2"><DollarSign size={12} /> Comprar</TabsTrigger>
                        <TabsTrigger value="risco" className="gap-2"><AlertTriangle size={12} /> Risco</TabsTrigger>
                        <TabsTrigger value="pareto" className="gap-2"><Activity size={12} /> ABC</TabsTrigger>
                    </TabsList>

                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar fornecedor..."
                            className="w-full h-9 rounded-md border border-border bg-background py-1 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                        />
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/50 text-[10px] uppercase text-muted-foreground border-b border-border">
                                <tr>
                                    <th className="px-4 py-3 font-semibold min-w-[200px]">Fornecedor</th>
                                    <th className="px-4 py-3 font-semibold w-[150px]">Saúde do Mix</th>
                                    <th className="px-4 py-3 font-semibold text-right">Sugestão (R$)</th>
                                    <th className="px-4 py-3 font-semibold text-right">Estoque (R$)</th>
                                    <th className="px-4 py-3 font-semibold text-right hidden lg:table-cell">Fat. 60d</th>
                                    <th className="px-4 py-3 font-semibold text-center hidden sm:table-cell">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {loading ? (
                                    <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">Carregando dados...</td></tr>
                                ) : paginatedSuppliers.length === 0 ? (
                                    <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">Nenhum resultado encontrado.</td></tr>
                                ) : (
                                    paginatedSuppliers.map((supplier) => (
                                        <tr
                                            key={supplier.id_fornecedor}
                                            className="group hover:bg-muted/30 transition-colors cursor-pointer"
                                            onClick={() => handleOpenSupplier(supplier.fornecedor)}
                                        >
                                            {/* Fornecedor */}
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">
                                                        {supplier.fornecedor}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">ID: {supplier.id_fornecedor} • {supplier.total_produtos || 0} SKUs</span>
                                                </div>
                                            </td>

                                            {/* Health Bar */}
                                            <td className="px-4 py-3 vertical-align-middle">
                                                <div className="flex flex-col gap-1">
                                                    <HealthBar supplier={supplier} />
                                                    <div className="flex justify-between text-[9px] text-muted-foreground px-0.5">
                                                        <span className={Number(supplier.produtos_ruptura) > 0 ? "text-red-400 font-bold" : ""}>{supplier.produtos_ruptura}</span>
                                                        <span>{supplier.produtos_ok}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Sugestão */}
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className={cn(
                                                        "font-bold text-sm",
                                                        Number(supplier.valor_sugestao_compra) > 0 ? "text-primary" : "text-muted-foreground/50"
                                                    )}>
                                                        {formatCurrency(supplier.valor_sugestao_compra)}
                                                    </span>
                                                    {Number(supplier.total_unidades_sugeridas) > 0 && (
                                                        <span className="text-[10px] text-muted-foreground">{supplier.total_unidades_sugeridas} un.</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Estoque */}
                                            <td className="px-4 py-3 text-right text-muted-foreground">
                                                {formatCurrency(supplier.valor_estoque_custo)}
                                            </td>

                                            {/* Faturamento */}
                                            <td className="px-4 py-3 text-right text-muted-foreground hidden lg:table-cell">
                                                {formatCurrency(supplier.faturamento_60d)}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3 text-center hidden sm:table-cell">
                                                <div className="flex items-center justify-center gap-2">
                                                    {Number(supplier.valor_sugestao_compra) > 0 && (
                                                        <Button
                                                            size="sm"
                                                            variant="default"
                                                            className="h-7 text-xs shadow-sm bg-primary hover:bg-primary/90"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // Future implementation: Add to cart or similar
                                                            }}
                                                        >
                                                            Gerar Pedido
                                                        </Button>
                                                    )}
                                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10">
                                                        <Eye size={16} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between border-t border-border bg-muted/20 px-4 py-2">
                        <span className="text-[10px] text-muted-foreground">
                            Página {currentPage} de {totalPages || 1}
                        </span>
                        <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronLeft size={16} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronRight size={16} />
                            </Button>
                        </div>
                    </div>
                </div>
            </Tabs>

            {/* Drill Down Modal */}
            <Modal
                isOpen={!!selectedSupplier}
                onClose={handleCloseModal}
                title={
                    <div className="flex items-center gap-2">
                        <Truck className="text-primary" size={20} />
                        {selectedSupplier || "Detalhes do Fornecedor"}
                    </div>
                }
                description="Listagem completa de produtos deste fornecedor, ordenados por prioridade."
                className="max-w-6xl h-[80vh]"
            >
                {productsLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : supplierProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <Package size={32} className="mb-2 opacity-20" />
                        <p>Nenhum produto encontrado para este fornecedor.</p>
                    </div>
                ) : (
                    <div className="relative overflow-x-auto rounded-lg border border-border">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/50 text-[10px] uppercase text-muted-foreground sticky top-0 z-10">
                                <tr>
                                    <th className="px-3 py-3 font-semibold">Produto</th>
                                    <th className="px-3 py-3 font-semibold text-center">Status</th>
                                    <th className="px-3 py-3 font-semibold text-center">ABC</th>
                                    <th className="px-3 py-3 font-semibold text-right">Estoque</th>
                                    <th className="px-3 py-3 font-semibold text-right">Cobertura</th>
                                    <th className="px-3 py-3 font-semibold text-right">Sugestão</th>
                                    <th className="px-3 py-3 font-semibold text-right">Custo</th>
                                    <th className="px-3 py-3 font-semibold text-right">Preço</th>
                                    <th className="px-3 py-3 font-semibold text-right">Margem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {supplierProducts.map((prod) => (
                                    <tr key={prod.id_produto} className="hover:bg-muted/30">
                                        <td className="px-3 py-2 font-medium max-w-[200px] truncate" title={prod.produto_descricao || ""}>
                                            {prod.produto_descricao}
                                            <span className="block text-[9px] text-muted-foreground font-mono">{prod.id_produto}</span>
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <span className={cn(
                                                "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                                                prod.status_ruptura?.includes("Ruptura") ? "bg-red-500/10 text-red-500" :
                                                    prod.status_ruptura?.includes("Crítico") ? "bg-amber-500/10 text-amber-500" :
                                                        "bg-emerald-500/10 text-emerald-500"
                                            )}>
                                                {prod.status_ruptura?.replace(/[🔴🟢🟡🟠🟣⚪]/g, '').trim() || '-'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-center font-bold text-muted-foreground">{prod.classe_abc}</td>
                                        <td className="px-3 py-2 text-right">{formatNumber(prod.estoque_atual)}</td>
                                        <td className="px-3 py-2 text-right">{Math.round(Number(prod.dias_de_cobertura || 0))}d</td>
                                        <td className="px-3 py-2 text-right">
                                            {Number(prod.sugestao_compra_ajustada) > 0 ? (
                                                <span className="text-primary font-bold">{formatNumber(prod.sugestao_compra_ajustada)}</span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </td>
                                        {/* Custo e Preço removidos por brevidade ou manter se quiser. Mantendo para context. */}
                                        <td className="px-3 py-2 text-right text-muted-foreground">{formatCurrency(prod.custo || 0)}</td>
                                        <td className="px-3 py-2 text-right">{formatCurrency(prod.preco || 0)}</td>
                                        <td className={cn(
                                            "px-3 py-2 text-right font-medium",
                                            (prod.margem_percentual || 0) < 20 ? "text-red-500" : "text-emerald-500"
                                        )}>
                                            {Number(prod.margem_percentual || 0).toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Modal Footer Summary */}
                {!productsLoading && supplierProducts.length > 0 && (
                    <div className="mt-4 flex gap-4 text-xs border-t border-border pt-3">
                        <div>
                            <span className="text-muted-foreground">Total Itens:</span> <span className="font-semibold">{supplierProducts.length}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Valor Sugestão:</span> <span className="font-semibold text-primary">
                                {formatCurrency(supplierProducts.reduce((acc, p) => acc + ((Number(p.sugestao_compra_ajustada) || 0) * (Number(p.custo) || 0)), 0))}
                            </span>
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="p-4 border-t mt-auto flex justify-end gap-2 bg-muted/20 -mx-6 -mb-6 mt-6 rounded-b-lg">
                    <Button variant="outline" onClick={handleCloseModal}>Fechar</Button>
                    <Button
                        onClick={() => window.location.href = `/orders/create?supplier=${encodeURIComponent(selectedSupplier!)}`}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    >
                        <ShoppingCart size={16} /> Gerar Pedido Inteligente (IA)
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
