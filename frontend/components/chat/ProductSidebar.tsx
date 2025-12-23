"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Send, Package, X, Loader2, Flame, Check, Sparkles, Filter, ChevronDown, ChevronUp, ShoppingCart } from "lucide-react";
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
                    .map((p: any) => {
                        // Normalizar status - garantir matching correto
                        let rawStatus = String(p.status_ruptura || 'SAUDÁVEL').toUpperCase().trim();
                        // Remover acentos e caracteres especiais para comparação
                        const normalizedStatus = rawStatus
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '') // Remove acentos
                            .replace(/[^A-Z\s]/g, '')
                            .trim();
                        // Mapear para status padronizado
                        let status = 'SAUDÁVEL';
                        if (normalizedStatus.includes('RUPTURA')) status = 'RUPTURA';
                        else if (normalizedStatus.includes('CRITICO')) status = 'CRÍTICO';
                        else if (normalizedStatus.includes('ATENCAO')) status = 'ATENÇÃO';
                        else if (normalizedStatus.includes('SAUDAVEL')) status = 'SAUDÁVEL';
                        else if (normalizedStatus.includes('EXCESSO')) status = 'EXCESSO';

                        return {
                            id: String(p.id_produto || ''),
                            nome: String(p.produto_descricao || 'Sem nome'),
                            estoque: Number(String(p.estoque_atual || '0').replace(',', '.')) || 0,
                            abc: String(p.classe_abc || 'C').toUpperCase(),
                            status: status,
                            cobertura: Number(String(p.dias_de_cobertura || '0').replace(',', '.')) || 0,
                            preco: Number(String(p.preco || '0').replace(',', '.')) || 0,
                            rawData: p, // Dados originais completos
                        };
                    });

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

                // Exibir todos os produtos (sem limite)
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

    // Filtrar produtos conforme aba e busca
    const filteredProducts = useMemo(() => {
        let filtered = products;

        // Busca
        if (search.trim()) {
            const term = search.toLowerCase();
            filtered = filtered.filter(p =>
                p.nome.toLowerCase().includes(term) ||
                p.id.toLowerCase().includes(term)
            );
        }

        return filtered;
    }, [products, search]);

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



    // Ação em lote para produtos (Analisar ou Comprar)
    const handleBatchAction = (action: 'analyze' | 'buy') => {
        const selectedProducts = products.filter(p => selectedIds.includes(p.id));

        window.dispatchEvent(new CustomEvent('chat:analyze-batch', {
            detail: {
                mode: action === 'analyze' ? 'analysis' : 'purchase',
                products: selectedProducts.map(p => ({
                    codigo_produto: p.id,
                    nome_produto: p.nome,
                    estoque_atual: p.estoque,
                    preco: p.preco,
                    abc: p.abc,
                    status: p.status,
                    ...p.rawData
                }))
            }
        }));

        if (window.innerWidth < 1024) onClose();
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
                <div className="p-4 border-b border-border relative z-20 bg-background">
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

                    {/* Search Only */}
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

                    {/* Contador de resultados */}
                    {search.trim() && !loading && (
                        <div className="mt-2 text-xs text-muted-foreground">
                            {filteredProducts.length} produto(s) encontrado(s)
                        </div>
                    )}
                </div>

                {/* Product List */}
                <div className="flex-1 overflow-y-auto relative z-10">
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
                            {filteredProducts.map((product) => {
                                const isSelected = selectedIds.includes(product.id);

                                return (
                                    <div
                                        key={product.id}
                                        onClick={() => toggleSelection(product.id)}
                                        className={cn(
                                            "p-3 transition-colors cursor-pointer hover:bg-accent/50 border-l-4",
                                            isSelected
                                                ? activeTab === 'campaigns'
                                                    ? "bg-pink-500/10 border-pink-500"
                                                    : "bg-blue-500/10 border-blue-500"
                                                : "border-transparent"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            {/* Checkbox Visual Unificado */}
                                            <div className="flex items-center h-full pt-1">
                                                <div className={cn(
                                                    "w-5 h-5 rounded flex items-center justify-center border-2 transition-all duration-150",
                                                    isSelected
                                                        ? activeTab === 'campaigns'
                                                            ? "bg-pink-500 border-pink-500"
                                                            : "bg-blue-500 border-blue-500"
                                                        : "border-gray-400 bg-transparent"
                                                )}>
                                                    {isSelected && (
                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0 ml-2">
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
                        <MixValidationPanel
                            validation={mixValidation}
                            onClose={() => setShowMixPanel(false)}
                        />

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
                {/* Footer: acoes em lote para produtos */}
                {activeTab === 'products' && selectedIds.length > 0 && (
                    <div className="p-4 border-t border-border bg-muted/50 grid grid-cols-2 gap-3">
                        <button
                            onClick={() => handleBatchAction('analyze')}
                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                        >
                            <Sparkles size={18} />
                            Analisar ({selectedIds.length})
                        </button>
                        <button
                            onClick={() => handleBatchAction('buy')}
                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                        >
                            <ShoppingCart size={18} />
                            Comprar ({selectedIds.length})
                        </button>
                    </div>
                )}
            </aside>
        </>
    );
}
