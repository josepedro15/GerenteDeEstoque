"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Send, Package, X, Loader2 } from "lucide-react";
import { getStockData } from "@/app/actions/inventory";
import { cn } from "@/lib/utils";

interface ProductSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

interface SimpleProduct {
    id: string;
    nome: string;
    estoque: number;
    abc: string;
    status: string;
}

const statusColors: Record<string, string> = {
    'RUPTURA': 'bg-red-500/20 text-red-400',
    'CRÍTICO': 'bg-red-500/20 text-red-400',
    'ATENÇÃO': 'bg-orange-500/20 text-orange-400',
    'SAUDÁVEL': 'bg-green-500/20 text-green-400',
    'EXCESSO': 'bg-blue-500/20 text-blue-400',
};

const abcColors: Record<string, string> = {
    'A': 'bg-emerald-500/20 text-emerald-400',
    'B': 'bg-blue-500/20 text-blue-400',
    'C': 'bg-gray-500/20 text-gray-400',
};

export function ProductSidebar({ isOpen, onClose }: ProductSidebarProps) {
    const [products, setProducts] = useState<SimpleProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    // Carregar produtos
    useEffect(() => {
        let mounted = true;

        async function loadProducts() {
            try {
                setLoading(true);
                setError(null);

                const result = await getStockData();

                if (!mounted) return;

                if (!result?.detalhe) {
                    setProducts([]);
                    return;
                }

                // Mapear para formato simples
                const simpleProducts: SimpleProduct[] = result.detalhe
                    .filter((p: any) => p?.id_produto)
                    .slice(0, 500) // Limitar a 500 produtos
                    .map((p: any) => ({
                        id: String(p.id_produto || ''),
                        nome: String(p.produto_descricao || 'Sem nome'),
                        estoque: Number(String(p.estoque_atual || '0').replace(',', '.')) || 0,
                        abc: String(p.classe_abc || 'C').toUpperCase(),
                        status: String(p.status_ruptura || 'SAUDÁVEL')
                            .toUpperCase()
                            .replace(/[^A-ZÁÉÍÓÚÂÊÔ\s]/g, '')
                            .trim() || 'SAUDÁVEL',
                    }));

                // Ordenar por ABC
                simpleProducts.sort((a, b) => {
                    const order: Record<string, number> = { 'A': 1, 'B': 2, 'C': 3 };
                    return (order[a.abc] || 3) - (order[b.abc] || 3);
                });

                setProducts(simpleProducts);
            } catch (err: any) {
                console.error("Erro ProductSidebar:", err);
                if (mounted) {
                    setError("Erro ao carregar produtos");
                    setProducts([]);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        }

        loadProducts();

        return () => { mounted = false; };
    }, []);

    // Filtrar produtos
    const filteredProducts = useMemo(() => {
        if (!search.trim()) return products;
        const term = search.toLowerCase();
        return products.filter(p =>
            p.nome.toLowerCase().includes(term) ||
            p.id.toLowerCase().includes(term)
        );
    }, [products, search]);

    // Enviar para análise
    const handleAnalyze = (product: SimpleProduct) => {
        try {
            window.dispatchEvent(new CustomEvent('chat:send-product', {
                detail: {
                    codigo_produto: product.id,
                    nome_produto: product.nome,
                    estoque_atual: product.estoque,
                    classe_abc: product.abc,
                    status: product.status,
                }
            }));
            if (window.innerWidth < 1024) onClose();
        } catch (err) {
            console.error("Erro ao enviar produto:", err);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay mobile */}
            <div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={onClose}
            />

            {/* Sidebar */}
            <aside className="fixed lg:relative left-0 top-0 h-full w-80 bg-card border-r border-border z-50 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Package size={18} className="text-blue-400" />
                            <h2 className="font-semibold text-foreground">Produtos</h2>
                            <span className="text-xs text-muted-foreground">
                                ({filteredProducts.length})
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
                </div>

                {/* Product List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-3">
                            <Loader2 size={24} className="animate-spin text-blue-400" />
                            <span className="text-sm text-muted-foreground">Carregando...</span>
                        </div>
                    ) : error ? (
                        <div className="p-4 text-center text-red-400 text-sm">
                            {error}
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                            Nenhum produto encontrado
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {filteredProducts.slice(0, 100).map((product) => (
                                <div
                                    key={product.id}
                                    className="p-3 hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-foreground text-sm truncate" title={product.nome}>
                                                {product.nome}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-muted-foreground font-mono">
                                                    {product.id}
                                                </span>
                                                <span className={cn(
                                                    "text-[10px] px-1.5 py-0.5 rounded font-bold",
                                                    abcColors[product.abc] || abcColors['C']
                                                )}>
                                                    {product.abc}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={cn(
                                                    "text-[10px] px-1.5 py-0.5 rounded",
                                                    statusColors[product.status] || statusColors['SAUDÁVEL']
                                                )}>
                                                    {product.status}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {product.estoque.toLocaleString('pt-BR')} un
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
                                </div>
                            ))}
                            {filteredProducts.length > 100 && (
                                <div className="p-3 text-center text-xs text-muted-foreground">
                                    Mostrando 100 de {filteredProducts.length} produtos
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
