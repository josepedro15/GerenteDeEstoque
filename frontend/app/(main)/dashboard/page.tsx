import { ArrowUpRight, AlertTriangle, DollarSign, Package, TrendingUp } from "lucide-react";
import { getStockData } from "@/app/actions/inventory";
import { DashboardAnalysisButton } from "@/components/dashboard/DashboardAnalysisButton";
import { parseNumber, normalizeStatus, cleanStatusText, formatCurrency } from "@/lib/formatters";

export const dynamic = 'force-dynamic'; // Force fresh data on every request

export default async function DashboardPage() {
    const { sumario, detalhe } = await getStockData();

    // Parse numeric values from string using the helper
    const items = detalhe.map(item => ({
        ...item,
        estoque_atual: parseNumber(item.estoque_atual),
        custo: parseNumber(item.custo),
        dias_de_cobertura: parseNumber(item.dias_de_cobertura),
        preco: parseNumber(item.preco)
    }));

    if (items.length === 0 && sumario.length === 0) {
        return (
            <div className="p-8 text-center text-red-500 bg-red-100 rounded-lg m-4 border border-red-400">
                <h2 className="text-xl font-bold mb-2">⚠️ Nenhum dado encontrado</h2>
                <p>O array de detalhes está vazio. Verifique:</p>
                <ul className="list-disc text-left inline-block mt-2">
                    <li>Se a tabela <b>dados_estoque</b> tem dados.</li>
                    <li>Se as variáveis de ambiente (URL/KEY) estão no Vercel.</li>
                    <li>Se a política RLS permite leitura (anon key).</li>
                </ul>
            </div>
        );
    }

    // Filter items for the list
    const ruptureItems = items.filter((item) => {
        const normalized = normalizeStatus(item.status_ruptura);
        return normalized === 'CRÍTICO' || normalized === 'RUPTURA';
    });

    // Extract detailed KPIs from Summary rows (which contain pre-calculated totals)
    // Map database status strings (with emojis) to our internal logic
    // DB Statuses found: "⚪ Excesso", "🟠 Crítico", "🟡 Atenção", "🟢 Saudável"

    const getSummaryValue = (statusKey: string) => {
        const found = sumario.find(s => normalizeStatus(s.status_ruptura) === statusKey);
        return found ? parseInt(found.total_produtos) : 0;
    };

    const ruptureCount = getSummaryValue('CRÍTICO'); // 🟠 Crítico
    const attentionCount = getSummaryValue('ATENÇÃO'); // 🟡 Atenção
    const excessCount = getSummaryValue('EXCESSO');    // ⚪ Excesso
    const healthyCount = getSummaryValue('SAUDÁVEL');  // 🟢 Saudável

    // Capital in Stock - Calculate from details as summary might not have it yet
    const capitalTotal = items.reduce((acc, item) => acc + (item.estoque_atual * item.custo), 0);

    const purchaseSuggestionCount = ruptureCount + attentionCount;
    const purchaseSuggestionValue = 0; // Not available in summary

    // Service Level Calculation
    const totalItems = ruptureCount + attentionCount + excessCount + healthyCount;
    // Or use items.length if summary total matches

    const serviceLevel = totalItems > 0
        ? ((totalItems - ruptureCount) / totalItems) * 100
        : 100;

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
                            itemCount: totalItems
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
                        <span className="font-medium">Crítico</span>
                        <span className="text-muted-foreground">repor urgente</span>
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

                {/* Card 3: Pedidos (Adapted to 'Atenção') */}
                <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Atenção</p>
                            <h3 className="mt-2 text-3xl font-bold text-white">{attentionCount} Itens</h3>
                        </div>
                        <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
                            <Package size={20} />
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                        Monitorar cobertura
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
                        {/* Chart Placeholder used here, user can request implementation later */}
                        [Gráfico de Linha temporariamente indisponível - Requer dados históricos]
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
                                    <p className="truncate font-medium text-white">{item.produto_descricao}</p>
                                    <p className="text-xs text-muted-foreground">SKU: {item.id_produto}</p>
                                </div>
                                <div className="text-right flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-bold text-red-400">{item.dias_de_cobertura.toFixed(0)} dias</p>
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

        </div>
    );
}
