"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Send, Package, X, Loader2, Flame, Check, Sparkles, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { getStockData } from "@/app/actions/inventory";
import { generateCampaign } from "@/app/actions/marketing";
import { cn } from "@/lib/utils";
import { MixValidationPanel, validateAbcMix } from "./MixValidationPanel";

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
    cobertura: number;
    preco: number;
    rawData: any; // Dados originais completos da row
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

// Opções de filtro
const statusOptions = ['RUPTURA', 'CRÍTICO', 'ATENÇÃO', 'SAUDÁVEL', 'EXCESSO'];
const abcOptions = ['A', 'B', 'C'];
const coberturaOptions = [
    { label: 'Crítica (< 7d)', value: 'low', min: 0, max: 7 },
    { label: 'Atenção (7-30d)', value: 'medium', min: 7, max: 30 },
    { label: 'Saudável (30-90d)', value: 'healthy', min: 30, max: 90 },
    { label: 'Excesso (> 90d)', value: 'high', min: 90, max: 9999 },
];

export function ProductSidebar({ isOpen, onClose }: ProductSidebarProps) {
    const [products, setProducts] = useState<SimpleProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    // Nova: aba ativa
    const [activeTab, setActiveTab] = useState<'products' | 'campaigns'>('products');

    // Nova: seleção múltipla para campanhas
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [generating, setGenerating] = useState(false);
    const [showMixPanel, setShowMixPanel] = useState(false);

    // Filtros
    const [showFilters, setShowFilters] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [abcFilter, setAbcFilter] = useState<string[]>([]);
    const [coberturaFilter, setCoberturaFilter] = useState<string[]>([]);

    // Toggle de filtros
    const toggleStatusFilter = (status: string) => {
        setStatusFilter(prev =>
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
    };
    const toggleAbcFilter = (abc: string) => {
        setAbcFilter(prev =>
            prev.includes(abc) ? prev.filter(a => a !== abc) : [...prev, abc]
        );
    };
    const toggleCoberturaFilter = (value: string) => {
        setCoberturaFilter(prev =>
            prev.includes(value) ? prev.filter(c => c !== value) : [...prev, value]
        );
    };
    const clearFilters = () => {
        setStatusFilter([]);
        setAbcFilter([]);
        setCoberturaFilter([]);
    };
    const hasActiveFilters = statusFilter.length > 0 || abcFilter.length > 0 || coberturaFilter.length > 0;

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

                const simpleProducts: SimpleProduct[] = result.detalhe
                    .filter((p: any) => p?.id_produto)
                    .map((p: any) => ({
                        id: String(p.id_produto || ''),
                        nome: String(p.produto_descricao || 'Sem nome'),
                        estoque: Number(String(p.estoque_atual || '0').replace(',', '.')) || 0,
                        abc: String(p.classe_abc || 'C').toUpperCase(),
                        status: String(p.status_ruptura || 'SAUDÁVEL')
                            .toUpperCase()
                            .replace(/[^A-ZÁÉÍÓÚÂÊÔ\s]/g, '')
                            .trim() || 'SAUDÁVEL',
                        cobertura: Number(String(p.dias_de_cobertura || '0').replace(',', '.')) || 0,
                        preco: Number(String(p.preco || '0').replace(',', '.')) || 0,
                        rawData: p, // Dados originais completos
                    }));

                // Ordenar por prioridade de status (urgentes primeiro) e depois por ABC
                const statusOrder: Record<string, number> = {
                    'RUPTURA': 1,
                    'CRÍTICO': 2,
                    'ATENÇÃO': 3,
                    'SAUDÁVEL': 4,
                    'EXCESSO': 5,
                };
                const abcOrder: Record<string, number> = { 'A': 1, 'B': 2, 'C': 3 };

                simpleProducts.sort((a, b) => {
                    const statusDiff = (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
                    if (statusDiff !== 0) return statusDiff;
                    return (abcOrder[a.abc] || 3) - (abcOrder[b.abc] || 3);
                });

                // Limitar a 1000 produtos para performance
                setProducts(simpleProducts.slice(0, 1000));
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

    // Filtrar produtos conforme aba, busca e filtros
    const filteredProducts = useMemo(() => {
        let filtered = products;

        // Aba campanhas: ordenar por cobertura (excesso primeiro) mas NÃO filtrar automaticamente
        // Deixar usuário filtrar manualmente se quiser

        // Filtro por status
        if (statusFilter.length > 0) {
            filtered = filtered.filter(p => statusFilter.includes(p.status));
        }

        // Filtro por curva ABC
        if (abcFilter.length > 0) {
            filtered = filtered.filter(p => abcFilter.includes(p.abc));
        }

        // Filtro por cobertura
        if (coberturaFilter.length > 0) {
            filtered = filtered.filter(p => {
                return coberturaFilter.some(filterValue => {
                    const option = coberturaOptions.find(o => o.value === filterValue);
                    if (!option) return false;
                    return p.cobertura >= option.min && p.cobertura < option.max;
                });
            });
        }

        // Busca
        if (search.trim()) {
            const term = search.toLowerCase();
            filtered = filtered.filter(p =>
                p.nome.toLowerCase().includes(term) ||
                p.id.toLowerCase().includes(term)
            );
        }

        return filtered;
    }, [products, search, activeTab, statusFilter, abcFilter, coberturaFilter]);

    // Toggle seleção para campanhas
    const toggleSelection = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else if (selectedIds.length < 10) {
            setSelectedIds([...selectedIds, id]);
        }
    };

    // Enviar para análise individual - envia todos os dados da row
    const handleAnalyze = (product: SimpleProduct) => {
        try {
            window.dispatchEvent(new CustomEvent('chat:send-product', {
                detail: {
                    // Dados da visualização
                    codigo_produto: product.id,
                    nome_produto: product.nome,
                    estoque_atual: product.estoque,
                    classe_abc: product.abc,
                    status: product.status,
                    cobertura: product.cobertura,
                    preco: product.preco,
                    // Dados originais completos da row do banco
                    ...product.rawData
                }
            }));
            if (window.innerWidth < 1024) onClose();
        } catch (err) {
            console.error("Erro ao enviar produto:", err);
        }
    };

    // Validar mix ABC dos produtos selecionados
    const mixValidation = useMemo(() => {
        const selected = products.filter(p => selectedIds.includes(p.id));
        return validateAbcMix(selected);
    }, [selectedIds, products]);

    // Gerar campanha (com validação)
    const handleGenerateCampaign = async () => {
        if (selectedIds.length === 0 || generating) return;

        // Verificar se mix está bloqueado
        if (!mixValidation.canGenerate) {
            setShowMixPanel(true);
            return;
        }
        // Fechar painel se estava aberto
        setShowMixPanel(false);

        setGenerating(true);
        try {
            const result = await generateCampaign(selectedIds);

            // Enviar resultado para o chat
            window.dispatchEvent(new CustomEvent('chat:campaign-generated', {
                detail: {
                    type: 'campaign',
                    campaign: result,
                    products: products.filter(p => selectedIds.includes(p.id)),
                }
            }));

            setSelectedIds([]);
            if (window.innerWidth < 1024) onClose();
        } catch (err) {
            console.error("Erro ao gerar campanha:", err);
        } finally {
            setGenerating(false);
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
                {/* Tabs */}
                <div className="flex border-b border-border">
                    <button
                        onClick={() => { setActiveTab('products'); setSelectedIds([]); }}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
                            activeTab === 'products'
                                ? "text-foreground bg-accent border-b-2 border-blue-500"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Package size={16} />
                        Produtos
                    </button>
                    <button
                        onClick={() => setActiveTab('campaigns')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
                            activeTab === 'campaigns'
                                ? "text-foreground bg-accent border-b-2 border-pink-500"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Flame size={16} />
                        Campanhas
                    </button>
                    <button
                        onClick={onClose}
                        className="p-3 text-muted-foreground hover:text-foreground lg:hidden"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Header da aba */}
                <div className="p-4 border-b border-border">
                    {activeTab === 'products' ? (
                        <div className="text-xs text-muted-foreground mb-3">
                            Selecione um produto para análise individual
                        </div>
                    ) : (
                        <div className="text-xs text-muted-foreground mb-3">
                            Selecione até 10 produtos para gerar campanha
                            <span className="ml-1 text-pink-400">({selectedIds.length}/10)</span>
                        </div>
                    )}

                    {/* Search + Filter Toggle */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por nome ou SKU..."
                                className="w-full pl-9 pr-3 py-2 text-sm bg-accent border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn(
                                "p-2 rounded-lg border transition-colors relative",
                                showFilters || hasActiveFilters
                                    ? "bg-blue-500/10 border-blue-500 text-blue-400"
                                    : "bg-accent border-border text-muted-foreground hover:text-foreground"
                            )}
                            title="Filtros"
                        >
                            <Filter size={16} />
                            {hasActiveFilters && (
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                        </button>
                    </div>

                    {/* Filtros colapsáveis */}
                    {showFilters && (
                        <div className="mt-3 pt-3 border-t border-border space-y-3">
                            {/* Status */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-muted-foreground">Status</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {statusOptions.map(status => (
                                        <button
                                            key={status}
                                            onClick={() => toggleStatusFilter(status)}
                                            className={cn(
                                                "text-[10px] px-2 py-1 rounded-full border transition-colors",
                                                statusFilter.includes(status)
                                                    ? statusColors[status] + " border-current"
                                                    : "bg-accent border-border text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Curva ABC */}
                            <div>
                                <span className="text-xs font-medium text-muted-foreground block mb-2">Curva ABC</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {abcOptions.map(abc => (
                                        <button
                                            key={abc}
                                            onClick={() => toggleAbcFilter(abc)}
                                            className={cn(
                                                "text-[10px] px-3 py-1 rounded-full border transition-colors font-bold",
                                                abcFilter.includes(abc)
                                                    ? abcColors[abc] + " border-current"
                                                    : "bg-accent border-border text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            {abc}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Cobertura */}
                            <div>
                                <span className="text-xs font-medium text-muted-foreground block mb-2">Cobertura</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {coberturaOptions.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => toggleCoberturaFilter(option.value)}
                                            className={cn(
                                                "text-[10px] px-2 py-1 rounded-full border transition-colors",
                                                coberturaFilter.includes(option.value)
                                                    ? "bg-blue-500/20 text-blue-400 border-blue-500"
                                                    : "bg-accent border-border text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Limpar filtros */}
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    Limpar filtros
                                </button>
                            )}
                        </div>
                    )}

                    {/* Contador de resultados */}
                    {(hasActiveFilters || search.trim()) && !loading && (
                        <div className="mt-2 text-xs text-muted-foreground">
                            {filteredProducts.length} produto(s) encontrado(s)
                        </div>
                    )}
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
                            {activeTab === 'campaigns'
                                ? "Nenhum produto com excesso encontrado"
                                : "Nenhum produto encontrado"
                            }
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {filteredProducts.slice(0, 100).map((product) => {
                                const isSelected = selectedIds.includes(product.id);

                                return (
                                    <div
                                        key={product.id}
                                        onClick={() => activeTab === 'campaigns' ? toggleSelection(product.id) : null}
                                        className={cn(
                                            "p-3 transition-colors",
                                            activeTab === 'campaigns'
                                                ? "cursor-pointer hover:bg-accent/50"
                                                : "hover:bg-accent/50",
                                            isSelected && "bg-pink-500/10 border-l-2 border-pink-500"
                                        )}
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
                                                    {activeTab === 'campaigns' && (
                                                        <span className="text-xs text-blue-400">
                                                            {product.cobertura.toFixed(0)}d
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {activeTab === 'products' ? (
                                                <button
                                                    onClick={() => handleAnalyze(product)}
                                                    className="shrink-0 p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-colors"
                                                    title="Analisar produto"
                                                >
                                                    <Send size={14} />
                                                </button>
                                            ) : (
                                                <div className={cn(
                                                    "shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                                    isSelected
                                                        ? "border-pink-500 bg-pink-500 text-white"
                                                        : "border-border"
                                                )}>
                                                    {isSelected && <Check size={12} />}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer: botão gerar campanha */}
                {activeTab === 'campaigns' && (
                    <div className="relative p-4 border-t border-border bg-muted/50">
                        {/* Mix Validation Panel */}
                        {showMixPanel && mixValidation && (
                            <MixValidationPanel
                                validation={mixValidation}
                                onFilterCurve={(abc) => {
                                    setAbcFilter([abc]);
                                    setShowMixPanel(false);
                                }}
                                onClose={() => setShowMixPanel(false)}
                            />
                        )}

                        {/* Mix Status Indicator */}
                        {selectedIds.length > 0 && (
                            <div className="mb-3">
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-muted-foreground">Mix ABC</span>
                                    <span className={cn(
                                        "font-medium",
                                        mixValidation.status === 'ideal' && "text-green-400",
                                        mixValidation.status === 'warning' && "text-yellow-400",
                                        mixValidation.status === 'blocked' && "text-red-400"
                                    )}>
                                        {mixValidation.status === 'ideal' && '✓ Ideal'}
                                        {mixValidation.status === 'warning' && '⚠ Atenção'}
                                        {mixValidation.status === 'blocked' && '✗ Bloqueado'}
                                    </span>
                                </div>
                                <div className="flex h-2 rounded-full overflow-hidden bg-muted/50">
                                    {mixValidation.mixPercent.A > 0 && (
                                        <div className="bg-blue-500" style={{ width: `${mixValidation.mixPercent.A}%` }} />
                                    )}
                                    {mixValidation.mixPercent.B > 0 && (
                                        <div className="bg-purple-500" style={{ width: `${mixValidation.mixPercent.B}%` }} />
                                    )}
                                    {mixValidation.mixPercent.C > 0 && (
                                        <div className="bg-orange-500" style={{ width: `${mixValidation.mixPercent.C}%` }} />
                                    )}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleGenerateCampaign}
                            disabled={selectedIds.length === 0 || generating}
                            className={cn(
                                "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all",
                                selectedIds.length > 0
                                    ? mixValidation.canGenerate
                                        ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90"
                                        : "bg-gradient-to-r from-red-600 to-red-700 text-white hover:opacity-90"
                                    : "bg-accent text-muted-foreground cursor-not-allowed"
                            )}
                        >
                            {generating ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Gerando...
                                </>
                            ) : !mixValidation.canGenerate && selectedIds.length > 0 ? (
                                <>
                                    <Sparkles size={18} />
                                    Ajustar Mix ({selectedIds.length})
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    Gerar Campanha ({selectedIds.length})
                                </>
                            )}
                        </button>
                    </div>
                )}
            </aside>
        </>
    );
}
