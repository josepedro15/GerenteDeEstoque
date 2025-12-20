"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, Package, X, Filter, ChevronDown, Loader2 } from "lucide-react";
import { getStockData } from "@/app/actions/inventory";
import { EstoqueDetalhe } from "@/types/estoque";
import { cn } from "@/lib/utils";

interface ProductSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    className?: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
    'RUPTURA': { bg: 'bg-red-500/20', text: 'text-red-400' },
    'CRÍTICO': { bg: 'bg-red-500/20', text: 'text-red-400' },
    'ATENÇÃO': { bg: 'bg-orange-500/20', text: 'text-orange-400' },
    'SAUDÁVEL': { bg: 'bg-green-500/20', text: 'text-green-400' },
    'EXCESSO': { bg: 'bg-blue-500/20', text: 'text-blue-400' },
};

export function ProductSidebar({ isOpen, onClose, className }: ProductSidebarProps) {
    const [products, setProducts] = useState<EstoqueDetalhe[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("TODOS");
    const [showFilters, setShowFilters] = useState(false);

    // Carregar produtos
    useEffect(() => {
        async function loadProducts() {
            setLoading(true);
            try {
                const { detalhe } = await getStockData();
                // Ordenar por curva ABC (A primeiro) e depois por nome
                const sorted = detalhe
                    .filter(p => p.id_produto)
                    .sort((a, b) => {
                        const abcOrder = { 'A': 1, 'B': 2, 'C': 3 };
                        const abcA = abcOrder[(a.classe_abc || 'C').toUpperCase() as 'A' | 'B' | 'C'] || 3;
                        const abcB = abcOrder[(b.classe_abc || 'C').toUpperCase() as 'A' | 'B' | 'C'] || 3;
                        if (abcA !== abcB) return abcA - abcB;
                        return (a.produto_descricao || '').localeCompare(b.produto_descricao || '');
                    });
                setProducts(sorted);
            } catch (error) {
                console.error("Erro ao carregar produtos:", error);
            } finally {
                setLoading(false);
            }
        }
        loadProducts();
    }, []);

    // Filtrar produtos
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = search === "" ||
                (p.produto_descricao?.toLowerCase().includes(search.toLowerCase())) ||
                (p.id_produto?.toLowerCase().includes(search.toLowerCase()));

            const status = (p.status_ruptura || '').toUpperCase();
            const matchesStatus = statusFilter === "TODOS" || status.includes(statusFilter);

            return matchesSearch && matchesStatus;
        });
    }, [products, search, statusFilter]);

    // Enviar produto para análise
    const handleAnalyze = (product: EstoqueDetalhe) => {
        window.dispatchEvent(new CustomEvent('chat:send-product', {
            detail: {
                codigo_produto: product.id_produto,
                nome_produto: product.produto_descricao,
                estoque_atual: product.estoque_atual,
                dias_cobertura: product.dias_de_cobertura,
                status: product.status_ruptura,
                classe_abc: product.classe_abc,
                sugestao: product.sugestao_compra_60d,
                alerta: product.alerta_estoque,
                tendencia: product.tendencia,
            }
        }));

        // Fechar sidebar no mobile
        if (window.innerWidth < 1024) {
            onClose();
        }
    };

    return (
        <>
            {/* Overlay para mobile */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                initial={{ x: -320 }}
                animate={{ x: isOpen ? 0 : -320 }}
                transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                className={cn(
                    "fixed lg:relative left-0 top-0 h-full w-80 bg-card border-r border-border z-50 flex flex-col",
                    "lg:translate-x-0",
                    className
                )}
            >
                {/* Header */}
                <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Package size={18} className="text-blue-400" />
                            <h2 className="font-semibold text-foreground">Produtos</h2>
                            <span className="text-xs text-muted-foreground">
                                ({filteredProducts.length.toLocaleString('pt-BR')})
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground lg:hidden"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por nome ou SKU..."
                            className="w-full pl-9 pr-3 py-2 text-sm bg-accent border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                    </div>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 mt-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                        <Filter size={12} />
                        <span>Filtros</span>
                        <ChevronDown size={12} className={cn("transition-transform", showFilters && "rotate-180")} />
                    </button>

                    {/* Filters */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {['TODOS', 'RUPTURA', 'CRÍTICO', 'ATENÇÃO', 'SAUDÁVEL', 'EXCESSO'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => setStatusFilter(status)}
                                            className={cn(
                                                "px-2 py-1 text-xs rounded-full border transition-colors",
                                                statusFilter === status
                                                    ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                                                    : "border-border text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Product List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-3">
                            <Loader2 size={24} className="animate-spin text-blue-400" />
                            <span className="text-sm text-muted-foreground">Carregando produtos...</span>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                            Nenhum produto encontrado
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {filteredProducts.slice(0, 100).map((product, index) => {
                                const status = (product.status_ruptura || 'SAUDÁVEL').toUpperCase().replace(/[🔴🟠🟡🟢🔵]/g, '').trim();
                                const statusStyle = statusColors[status] || statusColors['SAUDÁVEL'];
                                const abc = (product.classe_abc || 'C').toUpperCase();

                                return (
                                    <motion.div
                                        key={product.id_produto || index}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: Math.min(index * 0.01, 0.5) }}
                                        className="p-3 hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-foreground text-sm truncate" title={product.produto_descricao || ''}>
                                                    {product.produto_descricao || 'Sem descrição'}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-muted-foreground font-mono">
                                                        {product.id_produto}
                                                    </span>
                                                    <span className={cn(
                                                        "text-[10px] px-1.5 py-0.5 rounded font-bold",
                                                        abc === 'A' ? 'bg-emerald-500/20 text-emerald-400' :
                                                            abc === 'B' ? 'bg-blue-500/20 text-blue-400' :
                                                                'bg-gray-500/20 text-gray-400'
                                                    )}>
                                                        {abc}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={cn(
                                                        "text-[10px] px-1.5 py-0.5 rounded",
                                                        statusStyle.bg, statusStyle.text
                                                    )}>
                                                        {status}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {parseFloat(product.estoque_atual || '0').toLocaleString('pt-BR')} un
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleAnalyze(product)}
                                                className="shrink-0 p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-colors"
                                                title="Analisar produto"
                                            >
                                                <Send size={14} />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                            {filteredProducts.length > 100 && (
                                <div className="p-3 text-center text-xs text-muted-foreground">
                                    Mostrando 100 de {filteredProducts.length.toLocaleString('pt-BR')} produtos
                                    <br />
                                    <span className="text-blue-400">Use a busca para encontrar mais</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.aside>
        </>
    );
}
