"use client";

import { useState, useMemo } from "react";
import { Search, Filter, ChevronLeft, ChevronRight, Package, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";

// Types derived from what page.tsx was using, but more strict
export interface Product {
    id: string;
    nome: string;
    estoque: number;
    preco: number;
    custo: number;
    abc: string;
    status: string;
    cobertura: number;
    // Keeping raw data if needed for simple display
}

interface ProductsClientProps {
    initialProducts: Product[];
}

const ITEMS_PER_PAGE = 20;

const statusColors: Record<string, string> = {
    'RUPTURA': 'bg-red-500/20 text-red-400 hover:bg-red-500/30',
    'CRÍTICO': 'bg-red-500/20 text-red-400 hover:bg-red-500/30',
    'ATENÇÃO': 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30',
    'SAUDÁVEL': 'bg-green-500/20 text-green-400 hover:bg-green-500/30',
    'EXCESSO': 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30',
};

const abcColors: Record<string, string> = {
    'A': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
    'B': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    'C': 'bg-gray-500/20 text-gray-400 border-gray-500/50',
};

export function ProductsClient({ initialProducts }: ProductsClientProps) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [abcFilter, setAbcFilter] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: 'asc' | 'desc' } | null>(null);

    // Filter Options
    const allStatuses = ['RUPTURA', 'CRÍTICO', 'ATENÇÃO', 'SAUDÁVEL', 'EXCESSO'];
    const allAbc = ['A', 'B', 'C'];

    // Handle Sort
    const handleSort = (key: keyof Product) => {
        setSortConfig(current => {
            if (current?.key === key) {
                if (current.direction === 'asc') return { key, direction: 'desc' };
                return null;
            }
            return { key, direction: 'asc' };
        });
    };

    // Filter Logic
    const filteredProducts = useMemo(() => {
        let result = initialProducts;

        // Search
        if (search.trim()) {
            const term = search.toLowerCase();
            result = result.filter(p =>
                p.nome.toLowerCase().includes(term) ||
                p.id.toLowerCase().includes(term)
            );
        }

        // Status Filter
        if (statusFilter.length > 0) {
            result = result.filter(p => statusFilter.includes(p.status));
        }

        // ABC Filter
        if (abcFilter.length > 0) {
            result = result.filter(p => abcFilter.includes(p.abc));
        }

        // Sorting
        if (sortConfig) {
            result = [...result].sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [initialProducts, search, statusFilter, abcFilter, sortConfig]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Reset page when filters change
    useMemo(() => {
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
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Gestão de Estoque
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        Visualize e gerencie métricas de {initialProducts.length} produtos.
                    </p>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col gap-4 p-4 rounded-xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    {/* Search */}
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por nome, SKU..."
                            className="w-full h-10 rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                        />
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-border/50">
                    {/* Status Filter */}
                    <div className="space-y-1.5">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</span>
                        <div className="flex flex-wrap gap-2">
                            {allStatuses.map(status => (
                                <button
                                    key={status}
                                    onClick={() => toggleStatus(status)}
                                    className={cn(
                                        "text-[10px] px-2.5 py-1 rounded-full border transition-all font-medium",
                                        statusFilter.includes(status)
                                            ? statusColors[status] + " border-transparent shadow-sm"
                                            : "bg-background border-border text-muted-foreground hover:border-foreground/20"
                                    )}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ABC Filter */}
                    <div className="space-y-1.5">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Curva ABC</span>
                        <div className="flex flex-wrap gap-2">
                            {allAbc.map(abc => (
                                <button
                                    key={abc}
                                    onClick={() => toggleAbc(abc)}
                                    className={cn(
                                        "h-6 w-8 flex items-center justify-center text-[10px] rounded border transition-all font-bold",
                                        abcFilter.includes(abc)
                                            ? abcColors[abc]
                                            : "bg-background border-border text-muted-foreground hover:border-foreground/20"
                                    )}
                                >
                                    {abc}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border">
                            <tr>
                                <th className="px-6 py-4 font-medium w-[40%]">Produto</th>
                                <th
                                    className="px-6 py-4 font-medium cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => handleSort('estoque')}
                                >
                                    <div className="flex items-center gap-2">
                                        Estoque
                                        {sortConfig?.key === 'estoque' && (
                                            sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                                        )}
                                        {sortConfig?.key !== 'estoque' && <ArrowUpDown size={12} className="opacity-30" />}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-4 font-medium cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => handleSort('preco')}
                                >
                                    <div className="flex items-center gap-2">
                                        Preço
                                        {sortConfig?.key === 'preco' && (
                                            sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                                        )}
                                        {sortConfig?.key !== 'preco' && <ArrowUpDown size={12} className="opacity-30" />}
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-medium text-center">Status</th>
                                <th className="px-6 py-4 font-medium text-center">ABC</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {paginatedProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                                        <Package className="mx-auto h-8 w-8 mb-3 opacity-20" />
                                        Nenhum produto encontrado com os filtros atuais.
                                    </td>
                                </tr>
                            ) : (
                                paginatedProducts.map((product) => (
                                    <tr key={product.id} className="group hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-accent/50 flex items-center justify-center text-muted-foreground/50">
                                                    <Package size={20} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-foreground truncate max-w-[300px]" title={product.nome}>
                                                        {product.nome}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                                                        SKU: <span className="font-mono bg-muted px-1 rounded">{product.id}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium">{product.estoque.toLocaleString('pt-BR')} un</span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    Cobertura: {product.cobertura.toFixed(0)} dias
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-muted-foreground">
                                            {formatCurrency(product.preco)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "border-0 font-medium px-2.5",
                                                    statusColors[product.status] || "bg-secondary text-secondary-foreground"
                                                )}
                                            >
                                                {product.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={cn(
                                                "inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold border",
                                                abcColors[product.abc] || "border-border text-muted-foreground"
                                            )}>
                                                {product.abc}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination */}
                <div className="flex items-center justify-between border-t border-border bg-muted/20 px-6 py-4">
                    <div className="text-xs text-muted-foreground">
                        Mostrando <strong>{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</strong> a <strong>{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}</strong> de <strong>{filteredProducts.length}</strong> produtos
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-1 text-sm font-medium px-2">
                            Pagina {currentPage} de {totalPages || 1}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
