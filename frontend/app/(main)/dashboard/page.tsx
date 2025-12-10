import { ArrowUpRight, AlertTriangle, DollarSign, Package, TrendingUp } from "lucide-react";
import { getStockAnalysis } from "@/app/actions/inventory";
import { ExplainButton } from "@/components/recommendations/ExplainButton";
import { DashboardAnalysisButton } from "@/components/dashboard/DashboardAnalysisButton";

export default async function DashboardPage() {
    const data = await getStockAnalysis();

    // Safety check ensuring data is an array
    if (!Array.isArray(data)) {
        console.error("Dashboard Error: 'data' is not an array", data);
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-red-400">Erro ao carregar dados</h2>
                    <p className="text-muted-foreground">O formato dos dados recebidos é inválido.</p>
                </div>
            </div>
        );
    }

    // Calculate KPIs
    const ruptureItems = data.filter((item) => item.status === "ruptura");
    const ruptureCount = ruptureItems.length;

    // Capital in Stock: sum(estoque_atual * custo)
    const capitalTotal = data.reduce((acc, item) => acc + (item.estoque_atual * item.custo), 0);

    // Purchase Suggestion: sum(quantidade_sugerida * custo)
    const purchaseSuggestionValue = data.reduce((acc, item) => acc + (item.quantidade_sugerida * item.custo), 0);
    const purchaseSuggestionCount = data.filter(item => item.quantidade_sugerida > 0).length;

    // Service Level (Mock calculation as placeholder, e.g., % of items not in rupture)
    // If total items is 0, avoid NaN
    const serviceLevel = data.length > 0
        ? ((data.length - ruptureCount) / data.length) * 100
        : 100;

    // Format helpers
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white/90">Dashboard</h1>
                    <p className="mt-2 text-muted-foreground">
                        Visão geral de estoque, rupturas e sugestões de compra.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">Última atualização: {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    <DashboardAnalysisButton
                        data={{
                            ruptureCount,
                            capitalTotal,
                            purchaseSuggestionValue,
                            serviceLevel,
                            itemCount: data.length
                        }}
                    />
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Card 1: Ruptura */}
                <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Risco de Ruptura</p>
                            <h3 className="mt-2 text-3xl font-bold text-white">{ruptureCount} Itens</h3>
                        </div>
                        <div className="rounded-lg bg-red-500/10 p-2 text-red-400">
                            <AlertTriangle size={20} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm text-red-400">
                        <TrendingUp size={16} />
                        <span className="font-medium">Atenção</span>
                        <span className="text-muted-foreground">items críticos</span>
                    </div>
                </div>

                {/* Card 2: Capital */}
                <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Capital em Estoque</p>
                            <h3 className="mt-2 text-3xl font-bold text-white">{formatCurrency(capitalTotal)}</h3>
                        </div>
                        <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm text-green-400">
                        <ArrowUpRight size={16} />
                        <span className="font-medium">Atualizado</span>
                    </div>
                </div>

                {/* Card 3: Pedidos */}
                <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Sugestão de Compra</p>
                            <h3 className="mt-2 text-3xl font-bold text-white">{formatCurrency(purchaseSuggestionValue)}</h3>
                        </div>
                        <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
                            <Package size={20} />
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                        {purchaseSuggestionCount} itens sugeridos para reposição
                    </p>
                </div>

                {/* Card 4: Nível de Serviço */}
                <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Nível de Serviço</p>
                            <h3 className="mt-2 text-3xl font-bold text-white">{serviceLevel.toFixed(1)}%</h3>
                        </div>
                        <div className="rounded-lg bg-green-500/10 p-2 text-green-400">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    <div className="mt-4 h-2 w-full rounded-full bg-white/5">
                        <div
                            className="h-full rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                            style={{ width: `${serviceLevel}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content Area: Charts & Lists */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column: Big Chart */}
                <div className="glass-card col-span-2 rounded-2xl p-6 h-[400px]">
                    <h3 className="text-lg font-semibold text-white">Evolução de Vendas vs Estoque</h3>
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        {/* Chart Placeholder */}
                        [Gráfico de Linha aqui via Recharts]
                    </div>
                </div>

                {/* Right Column: Alerts List */}
                <div className="glass-card rounded-2xl p-6">
                    <h3 className="mb-4 text-lg font-semibold text-white">Top Riscos de Ruptura</h3>
                    <div className="space-y-4">
                        {ruptureItems.slice(0, 5).map((item) => (
                            <div key={item.id_produto} className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/5 p-3 transition-colors hover:bg-white/10">
                                <div className="h-10 w-10 shrink-0 rounded-lg bg-white/10" />
                                <div className="flex-1 overflow-hidden">
                                    <p className="truncate font-medium text-white">{item.nome_produto}</p>
                                    <p className="text-xs text-muted-foreground">SKU: {item.codigo_produto}</p>
                                </div>
                                <div className="text-right flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-2">
                                        <ExplainButton product={item} />
                                        <p className="text-xs font-bold text-red-400">{item.cobertura_atual_dias.toFixed(0)} dias</p>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">para acabar</p>
                                </div>
                            </div>
                        ))}

                        {ruptureItems.length === 0 && (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                Nenhum risco de ruptura identificado.
                            </div>
                        )}
                    </div>

                    <button className="mt-4 w-full rounded-lg border border-white/10 py-2 text-xs font-medium text-muted-foreground hover:bg-white/5 hover:text-white">
                        Ver todos os itens
                    </button>
                </div>
            </div>

            <ChatComponent />
        </div>
    );
}

import { ChatComponent } from "@/components/ChatComponent";
