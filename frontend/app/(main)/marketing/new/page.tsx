"use client";
"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Search, Filter, ShoppingCart, Sparkles, AlertTriangle,
    Check, X, Megaphone, Loader2, BarChart2, TrendingUp, Wand2, ShoppingBasket, Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    getMarketingProducts,
    generateCampaignWithGemini,
    saveCampaign,
    ProductCandidate,
    CampaignStrategy,
    getCategories,
    getBestCampaignCandidates,
    getFilterCounts
} from "@/app/actions/marketing";
import { sendToMarketingGroup } from "@/app/actions/whatsapp";
import { CampaignEditor } from "@/components/marketing/CampaignEditor";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { getUpcomingSeasonality, SeasonalityEvent } from "@/lib/seasonality";
import { CalendarDays } from "lucide-react";


// Helper for Toast (if standard hook doesn't exist, I'll use a local mock or check imports later. 
// Usually shadcn/ui has useToast in components/ui/use-toast)
// I'll assume standard shadcn setup.

const LIMIT = 50;

export default function MarketingPage() {
    // State
    const [step, setStep] = useState<'selection' | 'editor'>('selection');
    const [products, setProducts] = useState<ProductCandidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [sending, setSending] = useState(false);
    const [upcomingEvent, setUpcomingEvent] = useState<SeasonalityEvent | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Filters State
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
    const [minStock, setMinStock] = useState<string>("");

    // Wizard State
    const [wizardOpen, setWizardOpen] = useState(false);

    // Pagination
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 50;

    // Initial Load
    useEffect(() => {
        // Load Seasonality
        const events = getUpcomingSeasonality();
        if (events.length > 0 && events[0].daysUntil <= 60) {
            setUpcomingEvent(events[0]);
        }

        // Load Categories
        getCategories().then(setCategories);

        // Removed duplicate loadProducts() call to avoid race condition
    }, []);

    // Filters
    const [search, setSearch] = useState("");
    const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(['ALL']));
    const [counts, setCounts] = useState<Record<string, number>>({});

    // Selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Strategy Result
    const [strategy, setStrategy] = useState<CampaignStrategy | null>(null);

    // Initial Load & Filter Change
    useEffect(() => {
        setOffset(0);
        setHasMore(true);
        loadProducts(true);
    }, [activeFilters, search, selectedCategory, minStock]);

    // Load Counts
    useEffect(() => {
        getFilterCounts().then(setCounts).catch(console.error);
    }, []);

    async function loadProducts(reset: boolean = false) {
        if (!reset && !hasMore) return;

        setLoading(true);
        setError(null);
        try {
            const currentOffset = reset ? 0 : offset;

            const filters: any = { limit: LIMIT, offset: currentOffset };
            if (search.length > 2) filters.search = search;
            if (minStock && Number(minStock) > 0) filters.minStock = Number(minStock);
            if (selectedCategory && selectedCategory !== 'ALL') filters.categories = [selectedCategory];

            // Parse Active Filters
            if (!activeFilters.has('ALL')) {
                const curves: string[] = [];
                const statuses: string[] = [];
                const trends: string[] = [];

                activeFilters.forEach(filter => {
                    // Curves
                    if (['A', 'B', 'C'].includes(filter)) curves.push(filter);

                    // Statuses
                    if (filter === 'EXCESSO') statuses.push('⚪ Excesso');
                    if (filter === 'SAUDAVEL') statuses.push('🟢 Saudável');
                    if (filter === 'ATENCAO') statuses.push('🟡 Atenção');
                    if (filter === 'CRITICO') statuses.push('🟠 Crítico');

                    // Trends
                    if (filter === 'CAINDO') trends.push('📉 Caindo');
                    if (filter === 'SUBINDO') { trends.push('📈 Subindo'); trends.push('📈 Novo'); }
                    if (filter === 'ESTAVEL') trends.push('➡️ Estável');
                });

                if (curves.length > 0) filters.curves = curves;
                if (statuses.length > 0) filters.statuses = statuses;
                if (trends.length > 0) filters.trends = trends;
            }

            const data = await getMarketingProducts(filters);

            if (reset) {
                setProducts(data);
                setOffset(LIMIT);
            } else {
                setProducts(prev => [...prev, ...data]);
                setOffset(prev => prev + LIMIT);
            }
            setHasMore(data.length === LIMIT);

        } catch (e) {
            console.error(e);
            setError("Falha ao carregar produtos. Verifique sua conexão.");
        } finally {
            setLoading(false);
        }
    }

    // Handle Selection
    const toggleProduct = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const selectedProducts = useMemo(() => {
        return products.filter(p => selectedIds.has(p.id));
        // Note: If we paginate/filter out selected products from the main list, we might lose them here.
        // In a real app we'd keep a separate 'cart' state with full product objects.
        // For simplicity, we assume they remain in the list or we need to manage 'cartProducts' separately.
    }, [products, selectedIds]);

    // To persist selected products across filter changes, we should maintain a separate 'cart' 
    // but for this MVP, let's just assume we only select from visible. 
    // Refinement: Add a `cart` state.

    const [cart, setCart] = useState<ProductCandidate[]>([]);

    const handleAddToCart = (product: ProductCandidate) => {
        if (cart.find(p => p.id === product.id)) {
            setCart(prev => prev.filter(p => p.id !== product.id));
        } else {
            setCart(prev => [...prev, product]);
        }
    };

    // Mix Analysis
    const mixData = useMemo(() => {
        const counts = { A: 0, B: 0, C: 0 };
        cart.forEach(p => {
            const curve = (p.abc || 'C').toUpperCase();
            if (curve in counts) counts[curve as keyof typeof counts]++;
        });
        return [
            { name: 'Curva A (Chamariz)', value: counts.A, color: '#10b981' }, // Emerald-500
            { name: 'Curva B (Apoio)', value: counts.B, color: '#f59e0b' },   // Amber-500
            { name: 'Curva C (Lucro/Queima)', value: counts.C, color: '#ef4444' } // Red-500
        ].filter(d => d.value > 0);
    }, [cart]);

    // Validation Warning
    const coherenceWarning = useMemo(() => {
        if (cart.length === 0) return null;
        const categories = new Set(cart.map(p => p.category));
        if (categories.size > 3) return "Muitas categorias diferentes. Tente focar em um tema (ex: Pintura).";
        if (cart.length < 3) return "Adicione mais produtos para criar um mix atrativo (Min: 3).";
        return null;
    }, [cart]);

    // Action: Generate
    const handleGenerate = async () => {
        if (cart.length === 0) return;
        setGenerating(true);
        try {
            // Determine Context based on Mix
            const aCount = cart.filter(p => p.abc === 'A').length;
            const cCount = cart.filter(p => p.abc === 'C').length;
            let context = "Campanha de Varejo Geral";
            if (aCount > cCount) context = "Campanha de Atração (Foco em Curva A)";
            if (cCount > aCount) context = "Campanha de Queima de Estoque (Foco em Curva C - Excesso)";

            const result = await generateCampaignWithGemini(cart, context);

            if (result.success && result.data) {
                setStrategy(result.data);
                setStep('editor');
            } else {
                alert("Erro ao gerar campanha: " + result.error);
            }
        } catch (e) {
            console.error(e);
            alert("Erro de conexão.");
        } finally {
            setGenerating(false);
        }
    };

    // Action: Send / Save
    const handleSend = async (finalStrategy: CampaignStrategy, visualUrl?: string) => {
        setSending(true);
        try {
            // 1. Save to DB
            // Determine if visualUrl corresponds to Instagram or Physical to save correctly
            // For now, we'll try to guess based on strategy, or just save generic if needed.
            // The saveCampaign signature is: saveCampaign(userId, campaign, products, context, model, instaUrl, physicalUrl)

            // Heuristic: If we have a visualUrl, check if it matches what we might have stored or just save it as instagram (most common)
            const isInsta = visualUrl && finalStrategy.channels.instagram.image_options?.some(opt => opt.prompt) || true; // Fallback

            const saveResult = await saveCampaign(
                "user-id-placeholder", // We need to get this from session in a real component or let the server action handle it via cookies
                finalStrategy,
                cart,
                undefined,
                undefined,
                visualUrl // Assuming primary visual is Instagram for now
            );

            if (!saveResult.success) {
                console.error("Failed to save history", saveResult.error);
                alert(`Erro ao salvar histórico: ${saveResult.error}`);
                return; // Stop execution
            }

            // 2. Send to WhatsApp
            const shareLink = `${window.location.origin}/share/${saveResult.id}`;

            const msg = `🚀 *NOVA CAMPANHA GERADA*\n\n` +
                `*Título:* ${finalStrategy.report.title}\n` +
                `*Gancho:* ${finalStrategy.report.hook}\n\n` +
                `📊 *Ver Relatório Completo:* ${shareLink}\n\n` +
                `*--- Resumo Instagram ---*\n${finalStrategy.channels.instagram.copy.slice(0, 100)}...`;

            const sendResult = await sendToMarketingGroup({
                message: msg,
                mediaUrl: visualUrl,
                mediaType: 'image'
            });

            if (sendResult.success) {
                if (sendResult.mock) {
                    alert("Campanha salva! (WhatsApp simulado - Configure o token para envio real)");
                } else {
                    alert("Campanha enviada com sucesso para o grupo de Marketing!");
                }
            } else {
                alert(`Campanha salva, mas erro ao enviar WhatsApp: ${sendResult.error}`);
            }
            // Reset or Redirect?
            // window.location.href = '/marketing';

        } catch (e) {
            console.error(e);
            alert("Erro ao enviar campanha.");
        } finally {
            setSending(false);
        }
    };

    if (step === 'editor' && strategy) {
        return (
            <div className="p-6 max-w-7xl mx-auto">
                <CampaignEditor
                    strategy={strategy}
                    onBack={() => setStep('selection')}
                    onSend={handleSend}
                    isSending={sending}
                />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-theme(spacing.16))] flex flex-col lg:flex-row overflow-hidden bg-muted/10">

            {/* LEFT: Product Selection */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-border bg-background">
                {/* Seasonality Alert in Header */}
                {upcomingEvent && (
                    <div className="mx-4 mt-4 mb-2 flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 rounded-lg text-xs font-semibold border border-amber-200 shadow-sm animate-in slide-in-from-top-2">
                        <div className="p-1.5 bg-white rounded-full shadow-sm text-amber-600">
                            <CalendarDays size={14} />
                        </div>
                        <div className="flex-1">
                            <span className="block font-bold text-amber-900 uppercase tracking-wider text-[10px] mb-0.5">Sazonalidade Detectada</span>
                            {upcomingEvent.name} chega em <span className="underline decoration-amber-400 decoration-2 underline-offset-2">{upcomingEvent.daysUntil} dias</span>.
                            <span className="hidden sm:inline font-normal text-amber-700 ml-1">({upcomingEvent.description})</span>
                        </div>
                    </div>
                )}

                <div className="px-4 pb-4 border-b border-border space-y-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Megaphone className="text-primary" />
                            Nova Campanha
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Selecione produtos estratégicos para criar um mix de alta conversão.
                        </p>
                    </div>

                    {/* Search Tools */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar produtos..."
                                className="pl-9 bg-muted/30"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && loadProducts()}
                            />
                        </div>
                        <Button
                            variant="default"
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md border-0 gap-2 px-4"
                            onClick={() => setWizardOpen(true)}
                        >
                            <Bot size={16} />
                            <span className="hidden sm:inline">Assistente</span>
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => setFiltersOpen(true)}>
                            <Filter size={16} />
                        </Button>
                    </div>

                    {/* TABS Filters */}
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide py-2">
                        {[
                            { id: 'ALL', label: 'Todos' },
                            // Curves
                            { id: 'A', label: 'Curva A', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                            { id: 'B', label: 'Curva B', color: 'text-amber-600 bg-amber-50 border-amber-200' },
                            { id: 'C', label: 'Curva C', color: 'text-red-600 bg-red-50 border-red-200' },
                            // Statuses (Exact matches from DB with Emojis)
                            { id: 'EXCESSO', label: '⚪ Excesso', color: 'text-purple-600 bg-purple-50 border-purple-200' },
                            { id: 'SAUDAVEL', label: '🟢 Saudável', color: 'text-blue-600 bg-blue-50 border-blue-200' },
                            { id: 'ATENCAO', label: '🟡 Atenção', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
                            { id: 'CRITICO', label: '🟠 Crítico', color: 'text-orange-600 bg-orange-50 border-orange-200' },
                            // Trends
                            { id: 'CAINDO', label: '📉 Caindo', color: 'text-red-600 bg-red-50 border-red-200' },
                            { id: 'SUBINDO', label: '📈 Subindo', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                            { id: 'ESTAVEL', label: '➡️ Estável', color: 'text-gray-600 bg-gray-50 border-gray-200' },
                        ].map(tab => {
                            const count = counts[tab.id];
                            const isActive = activeFilters.has(tab.id);

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        const newFilters = new Set(activeFilters);
                                        if (tab.id === 'ALL') {
                                            newFilters.clear();
                                            newFilters.add('ALL');
                                        } else {
                                            newFilters.delete('ALL');
                                            if (newFilters.has(tab.id)) {
                                                newFilters.delete(tab.id);
                                                if (newFilters.size === 0) newFilters.add('ALL');
                                            } else {
                                                newFilters.add(tab.id);
                                            }
                                        }
                                        setActiveFilters(newFilters);
                                    }}
                                    className={`
                                        px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 border
                                        ${isActive
                                            ? (tab.id === 'ALL' ? 'bg-zinc-900 text-white border-zinc-900' : `${tab.color} ring-1 ring-offset-1 ring-zinc-300`)
                                            : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'}
                                    `}
                                >
                                    {isActive && tab.id !== 'ALL' && <Check className="w-3 h-3" />}
                                    {tab.label}
                                    {count !== undefined && (
                                        <span className={`text-xs ml-1 opacity-80 ${isActive ? '' : 'text-zinc-400'}`}>
                                            ({count})
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Product List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
                    {loading ? (
                        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-muted-foreground" /></div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-10 text-destructive gap-2">
                            <AlertTriangle size={24} />
                            <p className="font-medium">{error}</p>
                            <Button variant="link" onClick={() => loadProducts()} className="text-destructive underline">
                                Tentar novamente
                            </Button>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                            <Search size={24} className="opacity-20" />
                            <p>Nenhum produto encontrado.</p>
                        </div>
                    ) : (
                        products.map(p => {
                            const isSelected = !!cart.find(c => c.id === p.id);
                            return (
                                <div
                                    key={p.id}
                                    onClick={() => handleAddToCart(p)}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                                        isSelected
                                            ? "bg-primary/5 border-primary ring-1 ring-primary"
                                            : "bg-card border-border hover:border-primary/50"
                                    )}
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline" className={cn(
                                                "text-[10px] h-5 px-1",
                                                p.abc === 'A' ? "text-emerald-600 border-emerald-200" :
                                                    p.abc === 'B' ? "text-amber-600 border-amber-200" :
                                                        "text-red-600 border-red-200"
                                            )}>
                                                {p.abc}
                                            </Badge>
                                            <span className="font-medium text-sm truncate" title={p.name}>{p.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span>Estoque: <strong>{p.stock}</strong></span>
                                            <span>Cobertura: <strong>{p.coverage}d</strong></span>
                                        </div>
                                    </div>
                                    <div className="text-right pl-4">
                                        <div className="font-bold text-sm">{formatCurrency(p.price)}</div>
                                        {isSelected && <Check className="w-4 h-4 text-primary ml-auto mt-1" />}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Load More Button */}
                {hasMore && products.length > 0 && (
                    <div className="p-4 border-t border-border bg-background">
                        <Button
                            variant="outline"
                            className="w-full text-muted-foreground"
                            onClick={() => loadProducts(false)}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Carregando...
                                </>
                            ) : (
                                "Carregar Mais Produtos"
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {/* RIGHT: Cart & Strategy */}
            <div className="w-full lg:w-[400px] flex flex-col bg-muted/20 border-l border-border">
                <div className="p-6 flex-1 flex flex-col overflow-hidden">
                    <h2 className="font-semibold mb-4 flex items-center gap-2">
                        <ShoppingCart size={18} />
                        Seu Mix ({cart.length})
                    </h2>

                    {/* Cart List */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin mb-4">
                        {cart.length === 0 ? (
                            <div className="flex flex-col gap-4 p-8 text-center items-center justify-center h-[300px] text-muted-foreground border-2 border-dashed rounded-xl bg-muted/5">
                                <ShoppingBasket size={48} className="opacity-20 mb-2" />
                                <p className="font-medium">Seu mix está vazio</p>
                                <p className="text-sm max-w-[200px]">
                                    Selecione produtos da lista ao lado ou use a <span className="text-indigo-600 font-bold cursor-pointer hover:underline" onClick={() => setWizardOpen(true)}>Assistente Estratégico</span> para sugestões automáticas.
                                </p>
                            </div>
                        ) : (
                            cart.map(p => (
                                <div key={p.id} className="flex justify-between items-center bg-background p-3 rounded-lg border text-sm animate-in zoom-in-50 shadow-sm">
                                    <div className="flex-1 min-w-0 pr-3">
                                        <div className="font-medium truncate" title={p.name}>{p.name}</div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                            <span className="flex items-center gap-1">
                                                <div className={cn("w-1.5 h-1.5 rounded-full", p.abc === 'A' ? "bg-emerald-500" : p.abc === 'B' ? "bg-amber-500" : "bg-red-500")} />
                                                Curva {p.abc}
                                            </span>
                                            <span>Est: <strong>{p.stock}</strong></span>
                                            <span>{formatCurrency(p.price)}</span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 shrink-0"
                                        onClick={(e) => { e.stopPropagation(); handleAddToCart(p); }}
                                    >
                                        <X size={16} />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Mix Analysis Chart */}
                    {cart.length > 0 && (
                        <div className="bg-background rounded-xl p-4 border shadow-sm mb-4">
                            <h3 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1">
                                <BarChart2 size={12} /> ANÁLISE DO MIX
                            </h3>
                            <div className="h-[120px] w-full flex items-center gap-4">
                                <div className="h-full w-[120px] relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={mixData} dataKey="value" innerRadius={35} outerRadius={50} paddingAngle={2}>
                                                {mixData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex-1 space-y-1 text-xs">
                                    {mixData.map(d => (
                                        <div key={d.name} className="flex items-center justify-between">
                                            <div className="flex items-center gap-1">
                                                <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                                                <span>{d.name.split(' ')[2] || d.name}</span>
                                            </div>
                                            <span className="font-bold">{d.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Coherence Warning */}
                    {coherenceWarning && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-xs flex gap-2 mb-4 animate-in slide-in-from-bottom-2">
                            <AlertTriangle size={16} className="shrink-0" />
                            {coherenceWarning}
                        </div>
                    )}

                    <Button
                        size="lg"
                        className="w-full gap-2 shadow-lg shadow-primary/20"
                        disabled={cart.length === 0 || generating}
                        onClick={handleGenerate}
                    >
                        {generating ? (
                            <>
                                <Sparkles className="animate-spin" size={18} />
                                Analisando Estratégia...
                            </>
                        ) : (
                            <>
                                <Sparkles size={18} />
                                Gerar Estratégia
                            </>
                        )}
                    </Button>
                </div>
            </div>
            {/* Filter Modal */}
            <Modal
                isOpen={filtersOpen}
                onClose={() => setFiltersOpen(false)}
                title="Filtros Avançados"
                description="Refine sua busca por produtos específicos."
            >
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Categoria</label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todas as Categorias</SelectItem>
                                {categories.map(c => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Estoque Mínimo</label>
                        <Input
                            type="number"
                            placeholder="Ex: 10"
                            value={minStock}
                            onChange={e => setMinStock(e.target.value)}
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setFiltersOpen(false)}>Cancelar</Button>
                        <Button onClick={() => { setFiltersOpen(false); loadProducts(); }}>Aplicar Filtros</Button>
                    </div>
                </div>
            </Modal>

            {/* Magic Wizard Dialog */}
            <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Bot className="w-5 h-5 text-purple-600" />
                            Assistente Estratégico IA
                        </DialogTitle>
                        <DialogDescription>
                            Escolha um objetivo para que nossa IA selecione os melhores produtos para você.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Card
                            className="cursor-pointer hover:border-red-400 hover:bg-red-50/10 transition-all group border-muted"
                            onClick={async () => {
                                setWizardOpen(false);
                                setLoading(true);
                                try {
                                    const candidates = await getBestCampaignCandidates('clearance');
                                    if (candidates.length === 0) {
                                        alert("Não encontramos produtos de Curva C com estoque para sugerir.");
                                    } else {
                                        setCart(candidates);
                                        // Merge to visible list
                                        setProducts(prev => {
                                            const existingIds = new Set(prev.map(p => p.id));
                                            const newProducts = candidates.filter(c => !existingIds.has(c.id));
                                            return [...newProducts, ...prev];
                                        });
                                    }
                                } catch (e) {
                                    console.error(e);
                                } finally {
                                    setLoading(false);
                                }
                            }}
                        >
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-3 bg-red-100 text-red-600 rounded-full group-hover:scale-110 transition-transform">
                                    <TrendingUp size={24} className="rotate-180" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base">Queima de Estoque</h3>
                                    <p className="text-sm text-muted-foreground">Focar em produtos parados (Curva C) para liberar caixa.</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card
                            className="cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/10 transition-all group border-muted"
                            onClick={async () => {
                                setWizardOpen(false);
                                setLoading(true);
                                try {
                                    const candidates = await getBestCampaignCandidates('attraction');
                                    if (candidates.length === 0) {
                                        alert("Não encontramos produtos de Curva A para sugerir.");
                                    } else {
                                        setCart(candidates);
                                        // Merge
                                        setProducts(prev => {
                                            const existingIds = new Set(prev.map(p => p.id));
                                            const newProducts = candidates.filter(c => !existingIds.has(c.id));
                                            return [...newProducts, ...prev];
                                        });
                                    }
                                } catch (e) {
                                    console.error(e);
                                } finally {
                                    setLoading(false);
                                }
                            }}
                        >
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full group-hover:scale-110 transition-transform">
                                    <Megaphone size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base">Atrair Clientes</h3>
                                    <p className="text-sm text-muted-foreground">Usar produtos campeões (Curva A) para gerar fluxo na loja.</p>
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                    <div className="flex justify-end">
                        <Button variant="ghost" onClick={() => setWizardOpen(false)}>Cancelar</Button>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}
