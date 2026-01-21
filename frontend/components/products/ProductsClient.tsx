"use client";

import { useState, useMemo, useEffect, memo } from "react";
import {
    Search, ChevronLeft, ChevronRight, Package, ArrowUpDown, ArrowUp, ArrowDown,
    TrendingUp, TrendingDown, Minus, AlertTriangle, ShoppingCart, DollarSign,
    Calendar, BarChart2, Percent, Layers, Download
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/formatters";
import { STATUS_COLORS, ABC_COLORS, STATUS_OPTIONS, ABC_OPTIONS } from "@/lib/constants";

// Tipo completo com todos os campos
export interface Product {
    id: string;
    nome: string;

    // Estoque
    estoque: number;
    estoqueTransito: number;
    estoqueProjetado: number;
    cobertura: number;
    coberturaProjetada: number;
    mediaVenda: number;

    // Fornecedor
    fornecedorPrincipal: string;

    // Financeiro
    preco: number;
    custo: number;
    margemUnitaria: number;
    margemPercentual: number;

    // Vendas
    qtdVendida60d: number;
    faturamento60d: number;
    lucro60d: number;

    // Classificação
    abc: string;
    status: string;
    giroMensal: number;

    // Valores
    valorEstoqueCusto: number;
    valorEstoqueVenda: number;
    valorTransito: number;

    // Sugestão
    sugestaoCompra: number;
    sugestaoAjustada: number;

    // Tendência
    tendencia: string;
    variacaoPercentual: number;

    // Última venda
    ultimaVenda: string | null;
    diasSemVenda: number;

    // Alertas
    prioridadeCompra: string;
    alertaEstoque: string;

    // Pedidos
    pedidosAbertos: number;
}

interface ProductsClientProps {
    initialProducts: Product[];
}

const ITEMS_PER_PAGE = 25;

// Componente de Tendência
function TrendBadge({ tendencia, variacao }: { tendencia: string; variacao: number }) {
    if (!tendencia) return <span className="text-muted-foreground">-</span>;

    const isUp = tendencia.includes('Subindo') || variacao > 0;
    const isDown = tendencia.includes('Caindo') || variacao < 0;

    return (
        <div className={cn(
            "flex items-center gap-1 text-xs font-medium",
            isUp && "text-emerald-400",
            isDown && "text-red-400",
            !isUp && !isDown && "text-muted-foreground"
        )}>
            {isUp && <TrendingUp size={14} />}
            {isDown && <TrendingDown size={14} />}
            {!isUp && !isDown && <Minus size={14} />}
            <span>{formatPercent(variacao)}</span>
        </div>
    );
}

// Componente de Prioridade
function PriorityBadge({ priority }: { priority: string }) {
    if (!priority) return <span className="text-muted-foreground">-</span>;

    const isUrgent = priority.includes('URGENTE');
    const isHigh = priority.includes('ALTA');

    return (
        <span className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full",
            isUrgent && "bg-red-500/20 text-red-400",
            isHigh && !isUrgent && "bg-amber-500/20 text-amber-400",
            !isUrgent && !isHigh && "bg-zinc-500/20 text-zinc-400"
        )}>
            {priority.replace(/^\d+-/, '')}
        </span>
    );
}

export function ProductsClient({ initialProducts }: ProductsClientProps) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [abcFilter, setAbcFilter] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: 'asc' | 'desc' } | null>(null);

    const STATUS_OPTIONS = ['RUPTURA', 'CRÍTICO', 'ATENÇÃO', 'SAUDÁVEL', 'EXCESSO'];
    const ABC_OPTIONS = ['A', 'B', 'C'];

    // Sort handler
    const handleSort = (key: keyof Product) => {
        setSortConfig(current => {
            if (current?.key === key) {
                if (current.direction === 'asc') return { key, direction: 'desc' };
                return null;
            }
            return { key, direction: 'asc' };
        });
    };

    // Sorting icon
    const SortIcon = ({ field }: { field: keyof Product }) => {
        if (sortConfig?.key !== field) return <ArrowUpDown size={12} className="opacity-30" />;
        return sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
    };

    // Filter logic
    const filteredProducts = useMemo(() => {
        let result = initialProducts;

        if (search.trim()) {
            const term = search.toLowerCase();
            result = result.filter(p =>
                p.nome.toLowerCase().includes(term) ||
                p.id.toLowerCase().includes(term)
            );
        }

        if (statusFilter.length > 0) {
            result = result.filter(p => statusFilter.includes(p.status));
        }

        if (abcFilter.length > 0) {
            result = result.filter(p => abcFilter.includes(p.abc));
        }

        if (sortConfig) {
            result = [...result].sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                // Handle null/undefined values
                if (aValue == null && bValue == null) return 0;
                if (aValue == null) return 1;
                if (bValue == null) return -1;
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [initialProducts, search, statusFilter, abcFilter, sortConfig]);

    // Download Handler
    const handleDownload = () => {
        const headers = [
            "ID", "Nome", "Status", "ABC", "Estoque", "Estoque Trânsito",
            "Cobertura (dias)", "Preço", "Custo", "Margem %",
            "Vendas 60d", "Faturamento 60d", "Giro Mensal",
            "Sugestão Ajustada", "Fornecedor", "Prioridade", "Alerta"
        ];

        const csvContent = [
            headers.join(","),
            ...filteredProducts.map(p => [
                p.id,
                `"${p.nome.replace(/"/g, '""')}"`, // Escape quotes
                p.status,
                p.abc,
                p.estoque,
                p.estoqueTransito,
                p.cobertura,
                p.preco,
                p.custo,
                p.margemPercentual.toFixed(2),
                p.qtdVendida60d,
                p.faturamento60d,
                p.giroMensal.toFixed(2),
                p.sugestaoAjustada,
                `"${p.fornecedorPrincipal.replace(/"/g, '""')}"`,
                p.prioridadeCompra,
                p.alertaEstoque
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `estoque_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Pagination
    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter, abcFilter]);

    const toggleStatus = (status: string) => {
        setStatusFilter(prev =>
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
    };

    const toggleAbc = (abc: string) => {
        setAbcFilter(prev =>
            prev.includes(abc) ? prev.filter(a => a !== abc) : [...prev, abc]
        );
    };

    return (
        <div className="space-y-3 sm:space-y-4 p-2 sm:p-4 lg:p-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Layers className="text-primary" size={20} />
                        Gestão de Estoque
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {formatNumber(initialProducts.length)} produtos no catálogo
                    </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                    <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground mr-2">
                        <DollarSign size={14} className="text-emerald-400" />
                        Valor: {formatCurrency(initialProducts.reduce((acc, p) => acc + p.valorEstoqueVenda, 0))}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-2"
                        onClick={handleDownload}
                    >
                        <Download size={16} />
                        <span className="hidden sm:inline">Exportar CSV</span>
                    </Button>
                </div>
            </div>

            {/* Search + Filters */}
            <div className="flex flex-col gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row gap-3 items-stretch">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por nome ou SKU..."
                            className="w-full h-10 rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Status:</span>
                        <div className="flex flex-wrap gap-1">
                            {STATUS_OPTIONS.map(status => {
                                const config = STATUS_COLORS[status] || STATUS_COLORS['SAUDÁVEL'];
                                return (
                                    <button
                                        key={status}
                                        onClick={() => toggleStatus(status)}
                                        className={cn(
                                            "text-[10px] px-2 py-0.5 rounded-full border transition-all font-medium",
                                            statusFilter.includes(status)
                                                ? `${config.bg} ${config.text} ${config.border}`
                                                : "bg-background border-border text-muted-foreground hover:border-foreground/30"
                                        )}
                                    >
                                        {status}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">ABC:</span>
                        <div className="flex gap-1">
                            {ABC_OPTIONS.map(abc => {
                                const config = ABC_COLORS[abc] || ABC_COLORS['C'];
                                return (
                                    <button
                                        key={abc}
                                        onClick={() => toggleAbc(abc)}
                                        className={cn(
                                            "h-6 w-7 flex items-center justify-center text-[10px] rounded border transition-all font-bold",
                                            abcFilter.includes(abc)
                                                ? `${config.bg} ${config.text} border-transparent`
                                                : "bg-background border-border text-muted-foreground hover:border-foreground/30"
                                        )}
                                    >
                                        {abc}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {(statusFilter.length > 0 || abcFilter.length > 0 || search) && (
                        <button
                            onClick={() => { setStatusFilter([]); setAbcFilter([]); setSearch(''); }}
                            className="text-[10px] text-red-400 hover:text-red-300 underline"
                        >
                            Limpar filtros
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                    <table className="w-full text-left text-xs min-w-[600px] lg:min-w-0">
                        <thead className="bg-muted/50 text-[10px] uppercase text-muted-foreground border-b border-border sticky top-0">
                            <tr>
                                <th className="px-2 sm:px-4 py-3 font-semibold whitespace-nowrap min-w-[180px] sm:min-w-[250px]">Produto</th>
                                <th className="px-2 sm:px-3 py-3 font-semibold text-center">Status</th>
                                <th className="px-2 sm:px-3 py-3 font-semibold text-center">ABC</th>
                                <th
                                    className="px-3 py-3 font-semibold cursor-pointer hover:bg-muted/70 transition-colors whitespace-nowrap"
                                    onClick={() => handleSort('estoque')}
                                >
                                    <div className="flex items-center gap-1">Est. <span className="text-purple-400">(+Trâns.)</span> <SortIcon field="estoque" /></div>
                                </th>
                                <th
                                    className="px-3 py-3 font-semibold cursor-pointer hover:bg-muted/70 transition-colors whitespace-nowrap"
                                    onClick={() => handleSort('cobertura')}
                                >
                                    <div className="flex items-center gap-1">Cobertura <SortIcon field="cobertura" /></div>
                                </th>
                                <th
                                    className="px-2 sm:px-3 py-3 font-semibold cursor-pointer hover:bg-muted/70 transition-colors whitespace-nowrap"
                                    onClick={() => handleSort('preco')}
                                >
                                    <div className="flex items-center gap-1">Preço <SortIcon field="preco" /></div>
                                </th>
                                <th
                                    className="hidden md:table-cell px-3 py-3 font-semibold cursor-pointer hover:bg-muted/70 transition-colors whitespace-nowrap"
                                    onClick={() => handleSort('custo')}
                                >
                                    <div className="flex items-center gap-1">Custo <SortIcon field="custo" /></div>
                                </th>
                                <th
                                    className="hidden md:table-cell px-3 py-3 font-semibold cursor-pointer hover:bg-muted/70 transition-colors whitespace-nowrap"
                                    onClick={() => handleSort('margemPercentual')}
                                >
                                    <div className="flex items-center gap-1">Margem % <SortIcon field="margemPercentual" /></div>
                                </th>
                                <th
                                    className="hidden sm:table-cell px-3 py-3 font-semibold cursor-pointer hover:bg-muted/70 transition-colors whitespace-nowrap"
                                    onClick={() => handleSort('qtdVendida60d')}
                                >
                                    <div className="flex items-center gap-1">Vendas 60d <SortIcon field="qtdVendida60d" /></div>
                                </th>
                                <th
                                    className="hidden lg:table-cell px-3 py-3 font-semibold cursor-pointer hover:bg-muted/70 transition-colors whitespace-nowrap"
                                    onClick={() => handleSort('faturamento60d')}
                                >
                                    <div className="flex items-center gap-1">Fat. 60d <SortIcon field="faturamento60d" /></div>
                                </th>
                                <th
                                    className="hidden lg:table-cell px-3 py-3 font-semibold cursor-pointer hover:bg-muted/70 transition-colors whitespace-nowrap"
                                    onClick={() => handleSort('giroMensal')}
                                >
                                    <div className="flex items-center gap-1">Giro <SortIcon field="giroMensal" /></div>
                                </th>
                                <th className="hidden lg:table-cell px-3 py-3 font-semibold whitespace-nowrap">Tendência</th>
                                <th
                                    className="hidden sm:table-cell px-3 py-3 font-semibold cursor-pointer hover:bg-muted/70 transition-colors whitespace-nowrap"
                                    onClick={() => handleSort('sugestaoAjustada')}
                                >
                                    <div className="flex items-center gap-1">Sug. Ajust. <SortIcon field="sugestaoAjustada" /></div>
                                </th>
                                <th className="hidden lg:table-cell px-3 py-3 font-semibold whitespace-nowrap">Fornecedor</th>
                                <th className="hidden xl:table-cell px-3 py-3 font-semibold whitespace-nowrap">Prioridade</th>
                                <th className="hidden xl:table-cell px-3 py-3 font-semibold whitespace-nowrap">Alerta</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {paginatedProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={15} className="py-16 text-center text-muted-foreground">
                                        <Package className="mx-auto h-10 w-10 mb-3 opacity-20" />
                                        <p>Nenhum produto encontrado.</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedProducts.map((product) => {
                                    const statusCfg = STATUS_COLORS[product.status] || STATUS_COLORS['SAUDÁVEL'];
                                    const abcCfg = ABC_COLORS[product.abc] || ABC_COLORS['C'];

                                    return (
                                        <tr key={product.id} className="group hover:bg-muted/30 transition-colors">
                                            {/* Produto */}
                                            <td className="px-2 sm:px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded bg-muted/50 flex items-center justify-center text-muted-foreground/50 shrink-0">
                                                        <Package size={16} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-foreground truncate max-w-[140px] sm:max-w-[200px]" title={product.nome}>
                                                            {product.nome}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground font-mono">
                                                            {product.id}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-2 sm:px-3 py-3 text-center">
                                                <span className={cn(
                                                    "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                                                    statusCfg.bg, statusCfg.text
                                                )}>
                                                    {product.status}
                                                </span>
                                            </td>

                                            {/* ABC */}
                                            <td className="px-2 sm:px-3 py-3 text-center">
                                                <span className={cn(
                                                    "inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold",
                                                    abcCfg.bg, abcCfg.text
                                                )}>
                                                    {product.abc}
                                                </span>
                                            </td>

                                            {/* Estoque + Trânsito */}
                                            <td className="px-3 py-3 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="font-medium">{formatNumber(product.estoque)} un</span>
                                                    {product.estoqueTransito > 0 && (
                                                        <span className="text-[10px] text-purple-400">+{formatNumber(product.estoqueTransito)} trâns.</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Cobertura */}
                                            <td className="px-3 py-3 text-right">
                                                <span className={cn(
                                                    "font-medium",
                                                    product.cobertura <= 7 && "text-red-400",
                                                    product.cobertura > 7 && product.cobertura <= 30 && "text-amber-400",
                                                    product.cobertura > 30 && "text-emerald-400"
                                                )}>
                                                    {formatNumber(product.cobertura, 0)} dias
                                                </span>
                                            </td>

                                            {/* Preço */}
                                            <td className="px-3 py-3 text-right font-medium">
                                                {formatCurrency(product.preco)}
                                            </td>

                                            {/* Custo */}
                                            <td className="hidden md:table-cell px-3 py-3 text-right text-muted-foreground">
                                                {formatCurrency(product.custo)}
                                            </td>

                                            {/* Margem % */}
                                            <td className="hidden md:table-cell px-3 py-3 text-right">
                                                <span className={cn(
                                                    "font-medium",
                                                    product.margemPercentual >= 30 && "text-emerald-400",
                                                    product.margemPercentual >= 15 && product.margemPercentual < 30 && "text-amber-400",
                                                    product.margemPercentual < 15 && "text-red-400"
                                                )}>
                                                    {product.margemPercentual.toFixed(1)}%
                                                </span>
                                            </td>

                                            {/* Vendas 60d */}
                                            <td className="hidden sm:table-cell px-3 py-3 text-right font-medium">
                                                {formatNumber(product.qtdVendida60d)} un
                                            </td>

                                            {/* Faturamento 60d */}
                                            <td className="hidden lg:table-cell px-3 py-3 text-right text-muted-foreground">
                                                {formatCurrency(product.faturamento60d)}
                                            </td>

                                            {/* Giro */}
                                            <td className="hidden lg:table-cell px-3 py-3 text-right">
                                                <span className={cn(
                                                    product.giroMensal >= 1 ? "text-emerald-400" : "text-muted-foreground"
                                                )}>
                                                    {product.giroMensal.toFixed(2)}x
                                                </span>
                                            </td>

                                            {/* Tendência */}
                                            <td className="hidden lg:table-cell px-3 py-3">
                                                <TrendBadge tendencia={product.tendencia} variacao={product.variacaoPercentual} />
                                            </td>

                                            {/* Sugestão Ajustada */}
                                            <td className="hidden sm:table-cell px-3 py-3 text-right">
                                                {product.sugestaoAjustada > 0 ? (
                                                    <span className="flex items-center justify-end gap-1 text-amber-400 font-medium">
                                                        <ShoppingCart size={12} />
                                                        {formatNumber(product.sugestaoAjustada)}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </td>

                                            {/* Fornecedor */}
                                            <td className="hidden lg:table-cell px-3 py-3 text-left">
                                                <span className="text-[10px] text-muted-foreground truncate max-w-[100px] block" title={product.fornecedorPrincipal}>
                                                    {product.fornecedorPrincipal || '-'}
                                                </span>
                                            </td>

                                            {/* Prioridade */}
                                            <td className="hidden xl:table-cell px-3 py-3 text-center">
                                                <PriorityBadge priority={product.prioridadeCompra} />
                                            </td>

                                            {/* Alerta */}
                                            <td className="hidden xl:table-cell px-3 py-3 text-center">
                                                {product.alertaEstoque ? (
                                                    <span className="text-[10px] whitespace-nowrap">
                                                        {product.alertaEstoque}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-border bg-muted/20 px-3 sm:px-4 py-2 sm:py-3">
                    <div className="text-[10px] sm:text-[11px] text-muted-foreground">
                        <strong>{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</strong> - <strong>{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}</strong> de <strong>{filteredProducts.length}</strong>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="h-9 w-9 sm:h-7 sm:w-7 p-0"
                        >
                            <ChevronLeft size={18} className="sm:w-4 sm:h-4" />
                        </Button>
                        <span className="text-xs font-medium px-1 sm:px-2 min-w-[60px] sm:min-w-[80px] text-center">
                            {currentPage} / {totalPages || 1}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="h-9 w-9 sm:h-7 sm:w-7 p-0"
                        >
                            <ChevronRight size={18} className="sm:w-4 sm:h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
