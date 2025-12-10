import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Search,
    Filter,
    Download,
    ShoppingCart,
    ChevronRight,
    ArrowDown
} from "lucide-react";
import { getStockData } from "@/app/actions/inventory";
import { ExplainButton } from "@/components/recommendations/ExplainButton";

export default async function RecommendationsPage() {
    const { detalhe } = await getStockData();

    // Parse numeric values
    const data = detalhe.map(item => ({
        ...item,
        estoque_atual: parseFloat(item.estoque_atual) || 0,
        media_diaria_venda: parseFloat(item.media_diaria_venda) || 0,
        dias_de_cobertura: parseFloat(item.dias_de_cobertura) || 0,
        preco: parseFloat(item.preco) || 0,
        // rank_por_status seems to be the priority in the new view
        prioridade: parseInt(item.rank_por_status || '999')
    })).sort((a, b) => a.prioridade - b.prioridade);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white/90">
                        Sugestões de Compra (IA)
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        Análise de cobertura e risco de ruptura.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                        <Download className="mr-2 h-4 w-4" />
                        Exportar
                    </Button>
                    <Button disabled className="opacity-50 cursor-not-allowed">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Gerar Pedidos (Em breve)
                    </Button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-md">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar por SKU ou Produto..."
                        className="w-full rounded-lg border border-white/10 bg-black/20 py-2 pl-9 pr-4 text-sm text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-9 text-muted-foreground hover:text-white">
                        <Filter className="mr-2 h-3 w-3" />
                        Status Risco
                    </Button>
                </div>
            </div>

            {/* Recommendations Table */}
            <div className="rounded-xl border border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-xs uppercase text-muted-foreground">
                            <tr>
                                <th className="px-6 py-4 font-medium">Produto / SKU</th>
                                <th className="px-6 py-4 font-medium">Estoque</th>
                                <th className="px-6 py-4 font-medium">Venda Média/Dia</th>
                                <th className="px-6 py-4 font-medium">Cobertura (Dias)</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {data.map((item) => (
                                <tr key={item.id_produto} className="group hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-white/10" />
                                            <div>
                                                <p className="font-medium text-white">{item.produto_descricao}</p>
                                                <p className="text-[10px] text-muted-foreground">SKU: {item.id_produto}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-white">
                                        {item.estoque_atual} un
                                    </td>
                                    <td className="px-6 py-4 text-white">
                                        {item.media_diaria_venda.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`font-bold ${item.dias_de_cobertura < 15 ? 'text-red-400' : 'text-green-400'}`}>
                                            {item.dias_de_cobertura.toFixed(0)} dias
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge
                                            variant={
                                                item.status_ruptura === 'Ruptura' || item.status_ruptura === 'Crítico' ? 'destructive' :
                                                    item.status_ruptura === 'Atenção' ? 'secondary' :
                                                        item.status_ruptura === 'Excesso' ? 'outline' :
                                                            'default'
                                            }
                                            className={
                                                item.status_ruptura === 'Ruptura' || item.status_ruptura === 'Crítico' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' :
                                                    item.status_ruptura === 'Atenção' ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' :
                                                        item.status_ruptura === 'Excesso' ? 'bg-yellow-500/10 text-yellow-400' :
                                                            'bg-green-500/20 text-green-400'
                                            }
                                        >
                                            {item.status_ruptura.toUpperCase()}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* <ExplainButton product={item} /> */}
                                            <Button size="sm" variant="ghost" className="h-8 gap-1">
                                                Detalhes <ChevronRight className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {data.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                        Nenhum dado encontrado na nova visão.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 bg-white/5 px-6 py-4">
                    <p className="text-xs text-muted-foreground">Mostrando {data.length} produtos</p>
                    <div className="flex gap-2">
                        <Button size="sm" variant="ghost" disabled>Anterior</Button>
                        <Button size="sm" variant="ghost">Próximo</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
