"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Send, Package, X, Loader2, Sparkles, Filter, ChevronDown, ChevronUp, ShoppingCart, MessageSquare, Plus, Trash2, Calendar, Check } from "lucide-react";
import { getStockData } from "@/app/actions/inventory";
import { getChatHistory, clearChatSession, ChatSession } from "@/app/actions/chatHistory";

import { cn } from "@/lib/utils";
import { normalizeStatus, parseNumber } from "@/lib/formatters";
import {
    STATUS_COLORS_COMPACT,
    ABC_COLORS_COMPACT,
    STATUS_OPTIONS,
    ABC_OPTIONS,
    COVERAGE_RANGES,
    ALERT_OPTIONS,
    ALERT_COLORS
} from "@/lib/constants";

interface ProductSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    userId?: string;
    sessionId?: string;
    onSelectSession?: (sessionId: string) => void;
    onNewChat?: () => void;
}

interface SimpleProduct {
    id: string;
    nome: string;
    estoque: number;
    abc: string;
    status: string;
    cobertura: number;
    preco: number;
    alerta: string;
    rawData: any;
}

export function ProductSidebar({ isOpen, onClose, userId, sessionId, onSelectSession, onNewChat }: ProductSidebarProps) {
    const [activeTab, setActiveTab] = useState<'products' | 'history'>('history');

    // Estado da Aba de Produtos
    const [products, setProducts] = useState<SimpleProduct[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [errorProducts, setErrorProducts] = useState<string | null>(null);
    const [productSearch, setProductSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [abcFilter, setAbcFilter] = useState<string[]>([]);
    const [coberturaFilter, setCoberturaFilter] = useState<string[]>([]);
    const [alertFilter, setAlertFilter] = useState<string[]>([]);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

    // Estado da Aba de Histórico
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Toggle Ordenação Estoque
    const toggleSort = () => {
        setSortOrder(prev => {
            if (prev === null) return 'desc';
            if (prev === 'desc') return 'asc';
            return null;
        });
    };

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
    const toggleAlertFilter = (value: string) => {
        setAlertFilter(prev =>
            prev.includes(value) ? prev.filter(a => a !== value) : [...prev, value]
        );
    };
    const clearFilters = () => {
        setStatusFilter([]);
        setAbcFilter([]);
        setCoberturaFilter([]);
        setAlertFilter([]);
        setSortOrder(null);
    };
    const hasActiveFilters = statusFilter.length > 0 || abcFilter.length > 0 || coberturaFilter.length > 0 || alertFilter.length > 0 || sortOrder !== null;

    // Carregar produtos
    useEffect(() => {
        let mounted = true;

        async function loadProducts() {
            try {
                setLoadingProducts(true);
                setErrorProducts(null);

                const result = await getStockData();

                if (!mounted) return;

                if (!result?.produtos) {
                    setProducts([]);
                    return;
                }

                const simpleProducts: SimpleProduct[] = result.produtos
                    .filter((p: any) => p?.id_produto)
                    .map((p: any) => {
                        const alertaEstoque = String(p.alerta_estoque || '').toUpperCase();
                        const statusRuptura = normalizeStatus(p.status_ruptura);

                        let alerta = '';
                        if (alertaEstoque.includes('MORTO')) alerta = 'MORTO';
                        else if (alertaEstoque.includes('LIQUIDAR')) alerta = 'LIQUIDAR';
                        else if (statusRuptura === 'RUPTURA' || statusRuptura === 'CRÍTICO') alerta = 'RUPTURA';

                        return {
                            id: String(p.id_produto || ''),
                            nome: String(p.produto_descricao || 'Sem nome'),
                            estoque: parseNumber(p.estoque_atual),
                            abc: String(p.classe_abc || 'C').toUpperCase().trim(),
                            status: statusRuptura,
                            cobertura: p.dias_de_cobertura === Infinity ? 999 : parseNumber(p.dias_de_cobertura), // Fix Infinity
                            preco: parseNumber(p.preco),
                            alerta,
                            rawData: p,
                        };
                    });

                const uniqueProducts = Array.from(
                    new Map(simpleProducts.map(p => [p.id, p])).values()
                );

                setProducts(uniqueProducts);
            } catch (err: any) {
                console.error("Erro ProductSidebar:", err);
                if (mounted) {
                    setErrorProducts("Erro ao carregar produtos");
                    setProducts([]);
                }
            } finally {
                if (mounted) setLoadingProducts(false);
            }
        }

        if (isOpen && activeTab === 'products' && products.length === 0) {
            loadProducts();
        }

        return () => { mounted = false; };
    }, [isOpen, activeTab]); // Remove products.length check or handle smartly

    // Carregar histórico
    useEffect(() => {
        async function loadHistory() {
            if (!userId) {
                console.log("[ProductSidebar] loadHistory: Sem userId");
                return;
            }
            console.log("[ProductSidebar] loadHistory: Iniciando fetch para userId:", userId);
            try {
                setLoadingHistory(true);
                console.log("[ProductSidebar] loadHistory: Buscando histórico...");
                const history = await getChatHistory(userId, 50);
                console.log("[ProductSidebar] loadHistory: Recuperado:", history.length, "sessões");
                setSessions(history);
            } catch (e) {
                console.error("Erro ao carregar histórico", e);
            } finally {
                setLoadingHistory(false);
            }
        }

        if (isOpen && activeTab === 'history' && userId) {
            loadHistory();
        }
    }, [isOpen, activeTab, userId, sessionId]); // Reload if sessionId changes (new message sent)

    // Filtrar produtos
    const filteredProducts = useMemo(() => {
        let filtered = products;

        if (statusFilter.length > 0) filtered = filtered.filter(p => statusFilter.includes(p.status));
        if (abcFilter.length > 0) filtered = filtered.filter(p => abcFilter.includes(p.abc));
        if (coberturaFilter.length > 0) {
            filtered = filtered.filter(p => {
                return coberturaFilter.some(filterValue => {
                    const option = COVERAGE_RANGES.find(o => o.value === filterValue);
                    if (!option) return false;
                    return p.cobertura >= option.min && p.cobertura < option.max;
                });
            });
        }
        if (alertFilter.length > 0) filtered = filtered.filter(p => alertFilter.includes(p.alerta));

        if (productSearch.trim()) {
            const term = productSearch.toLowerCase();
            filtered = filtered.filter(p =>
                p.nome.toLowerCase().includes(term) ||
                p.id.toLowerCase().includes(term)
            );
        }

        if (sortOrder) {
            filtered = [...filtered].sort((a, b) => {
                if (sortOrder === 'asc') return a.estoque - b.estoque;
                return b.estoque - a.estoque;
            });
        }

        return filtered;
    }, [products, productSearch, statusFilter, abcFilter, coberturaFilter, alertFilter, sortOrder]);

    const toggleSelection = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else if (selectedIds.length < 10) {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBatchAction = (action: 'analyze' | 'buy') => {
        const selectedProducts = products.filter(p => selectedIds.includes(p.id));
        window.dispatchEvent(new CustomEvent('chat:analyze-batch', {
            detail: {
                mode: action === 'analyze' ? 'analysis' : 'purchase',
                products: selectedProducts.map(p => ({
                    ...p.rawData,
                    codigo_produto: p.id,
                    nome_produto: p.nome,
                    nome: p.nome,
                    estoque_atual: p.estoque,
                    preco: p.preco,
                    abc: p.abc,
                    status: p.status
                }))
            }
        }));
        if (window.innerWidth < 1024) onClose();
    };

    const handleDeleteSession = async (e: React.MouseEvent, sid: string) => {
        e.stopPropagation();
        if (!userId) return;
        if (confirm("Tem certeza que deseja apagar esta conversa?")) {
            await clearChatSession(userId, sid);
            setSessions(prev => prev.filter(s => s.session_id !== sid));
            if (sid === sessionId && onNewChat) {
                onNewChat();
            }
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />

            <aside className="fixed lg:relative left-0 top-0 h-full w-[85vw] max-w-80 sm:w-80 bg-card border-r border-border z-50 flex flex-col transition-all duration-300">
                {/* Header Superior com Tabs */}
                <div className="flex border-b border-border bg-background">
                    <button
                        onClick={() => setActiveTab('history')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2",
                            activeTab === 'history'
                                ? "text-purple-400 border-purple-400 bg-purple-500/5"
                                : "text-muted-foreground border-transparent hover:text-foreground hover:bg-accent"
                        )}
                    >
                        <MessageSquare size={16} />
                        Conversas
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2",
                            activeTab === 'products'
                                ? "text-blue-400 border-blue-400 bg-blue-500/5"
                                : "text-muted-foreground border-transparent hover:text-foreground hover:bg-accent"
                        )}
                    >
                        <Package size={16} />
                        Meus Itens
                    </button>
                </div>

                {/* Conteúdo da Aba Produtos */}
                {activeTab === 'products' ? (
                    <>
                        <div className="p-4 border-b border-border relative z-20 bg-background">
                            {/* ... (Search + Filters - Mantidos) ... */}
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={productSearch}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                        placeholder="Buscar produto..."
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
                                >
                                    <Filter size={16} />
                                    {hasActiveFilters && <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />}
                                </button>
                            </div>

                            {/* Filtros Dropdown (Simplificado para o diff) */}
                            {showFilters && (
                                <div className="mt-3 pt-3 border-t border-border space-y-4 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">

                                    {/* Status Filter */}
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Status</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {STATUS_OPTIONS.map(status => (
                                                <button
                                                    key={status}
                                                    onClick={() => toggleStatusFilter(status)}
                                                    className={cn(
                                                        "text-[10px] px-2.5 py-1 rounded-lg border transition-all",
                                                        statusFilter.includes(status)
                                                            ? "bg-blue-500/10 border-blue-500 text-blue-400"
                                                            : "bg-accent/50 border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                                                    )}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* ABC Filter */}
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Curva ABC</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {ABC_OPTIONS.map(abc => (
                                                <button
                                                    key={abc}
                                                    onClick={() => toggleAbcFilter(abc)}
                                                    className={cn(
                                                        "text-[10px] px-2.5 py-1 rounded-lg border transition-all",
                                                        abcFilter.includes(abc)
                                                            ? "bg-blue-500/10 border-blue-500 text-blue-400"
                                                            : "bg-accent/50 border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                                                    )}
                                                >
                                                    {abc}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Coverage Filter */}
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Cobertura</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {COVERAGE_RANGES.map(range => (
                                                <button
                                                    key={range.value}
                                                    onClick={() => toggleCoberturaFilter(range.value)}
                                                    className={cn(
                                                        "text-[10px] px-2.5 py-1 rounded-lg border transition-all",
                                                        coberturaFilter.includes(range.value)
                                                            ? "bg-blue-500/10 border-blue-500 text-blue-400"
                                                            : "bg-accent/50 border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                                                    )}
                                                >
                                                    {range.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Alert Filter */}
                                    <div className="space-y-1.5">
                                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Alertas</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {ALERT_OPTIONS.map(alert => (
                                                <button
                                                    key={alert.value}
                                                    onClick={() => toggleAlertFilter(alert.value)}
                                                    className={cn(
                                                        "text-[10px] px-2.5 py-1 rounded-lg border transition-all",
                                                        alertFilter.includes(alert.value)
                                                            ? "bg-blue-500/10 border-blue-500 text-blue-400"
                                                            : "bg-accent/50 border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                                                    )}
                                                >
                                                    {alert.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
                                        <button onClick={toggleSort} className={cn("flex items-center gap-2 text-[10px] px-3 py-1.5 rounded-lg border transition-colors", sortOrder ? "bg-blue-500/20 text-blue-400 border-blue-500" : "bg-accent border-border text-muted-foreground hover:text-foreground")}>
                                            Estoque {sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                        </button>
                                        <button onClick={clearFilters} className="text-[10px] text-blue-400 ml-auto hover:text-blue-300 transition-colors font-medium">
                                            Limpar Filtros
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-0">
                            {loadingProducts ? (
                                <div className="flex flex-col items-center justify-center h-48 gap-3">
                                    <Loader2 size={24} className="animate-spin text-blue-400" />
                                    <span className="text-sm text-muted-foreground">Carregando produtos...</span>
                                </div>
                            ) : errorProducts ? (
                                <div className="p-4 text-center text-red-400 text-sm">{errorProducts}</div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="p-4 text-center text-muted-foreground text-sm">Nenhum produto encontrado</div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {filteredProducts.map((p) => (
                                        <div key={p.id} onClick={() => toggleSelection(p.id)} className={cn("p-3 cursor-pointer hover:bg-accent/50 border-l-4 transition-colors", selectedIds.includes(p.id) ? "bg-blue-500/10 border-blue-500" : "border-transparent")}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium text-sm text-foreground truncate">{p.nome}</p>
                                                    <div className="flex flex-wrap gap-2 mt-1 items-center">
                                                        <span className={cn("text-[10px] px-1.5 rounded font-bold", ABC_COLORS_COMPACT[p.abc])}>{p.abc}</span>
                                                        {p.status && (
                                                            <span className={cn("text-[10px] px-1.5 rounded font-bold uppercase", STATUS_COLORS_COMPACT[p.status])}>
                                                                {p.status}
                                                            </span>
                                                        )}
                                                        <span className="text-xs text-muted-foreground">{p.estoque} un</span>
                                                    </div>
                                                </div>
                                                {selectedIds.includes(p.id) && <Check size={16} className="text-blue-500" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer Ações */}
                        {selectedIds.length > 0 && (
                            <div className="p-4 border-t border-border bg-muted/50 grid grid-cols-2 gap-3">
                                <button onClick={() => handleBatchAction('analyze')} className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600">
                                    <Sparkles size={16} /> Analisar ({selectedIds.length})
                                </button>
                                <button onClick={() => handleBatchAction('buy')} className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600">
                                    <ShoppingCart size={16} /> Comprar
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    /* Conteúdo da Aba Histórico */
                    <div className="flex flex-col h-full">
                        {/* Botão Nova Conversa */}
                        <div className="p-4 border-b border-border">
                            <button
                                onClick={() => {
                                    if (onNewChat) {
                                        onNewChat();
                                        if (window.innerWidth < 1024) onClose();
                                    }
                                }}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                            >
                                <Plus size={18} />
                                Nova Conversa
                            </button>
                        </div>

                        {/* Lista de Sessões */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {loadingHistory ? (
                                <div className="flex flex-col items-center justify-center h-32 gap-3">
                                    <Loader2 size={24} className="animate-spin text-purple-400" />
                                    <span className="text-sm text-muted-foreground">Carregando conversas...</span>
                                </div>
                            ) : sessions.length === 0 ? (
                                <div className="text-center p-8 text-muted-foreground text-sm">
                                    <MessageSquare size={32} className="mx-auto mb-3 opacity-20" />
                                    Nenhuma conversa anterior
                                </div>
                            ) : (
                                sessions.map((session) => {
                                    const isActive = session.session_id === sessionId;
                                    const lastMsg = session.messages[session.messages.length - 1]?.content || "Nova conversa";
                                    const preview = lastMsg.length > 50 ? lastMsg.substring(0, 50) + "..." : lastMsg;
                                    const date = new Date(session.last_activity).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

                                    return (
                                        <div
                                            key={session.session_id}
                                            onClick={() => {
                                                if (onSelectSession) {
                                                    onSelectSession(session.session_id);
                                                    if (window.innerWidth < 1024) onClose();
                                                }
                                            }}
                                            className={cn(
                                                "group flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border border-transparent",
                                                isActive
                                                    ? "bg-purple-500/10 border-purple-500/20 shadow-sm"
                                                    : "hover:bg-accent hover:border-border"
                                            )}
                                        >
                                            <div className={cn(
                                                "mt-0.5 h-8 w-8 min-w-[2rem] rounded-full flex items-center justify-center text-xs font-bold",
                                                isActive ? "bg-purple-500 text-white" : "bg-accent-foreground/5 text-muted-foreground group-hover:bg-accent-foreground/10"
                                            )}>
                                                {isActive ? <MessageSquare size={14} /> : <Calendar size={14} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={cn(
                                                    "text-sm font-medium truncate",
                                                    isActive ? "text-purple-400" : "text-foreground"
                                                )}>
                                                    {preview || "Sem título"}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                                    {date} • {session.messages.length} msgs
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteSession(e, session.session_id)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                title="Apagar conversa"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
}
