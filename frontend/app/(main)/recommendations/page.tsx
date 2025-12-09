import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Search,
    Filter,
    Download,
    ShoppingCart,
    ChevronRight
} from "lucide-react";
import { getStockAnalysis } from "@/app/actions/inventory";
import { ExplainButton } from "@/components/recommendations/ExplainButton";

export default async function RecommendationsPage() {
    const data = await getStockAnalysis();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white/90">
                        Sugestões de Compra (IA)
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        Análise preditiva de demanda e reposição de estoque.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                        <Download className="mr-2 h-4 w-4" />
                        Exportar
                    </Button>
                    <Button>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Gerar Pedidos Selecionados
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
                        Fornecedor
                    </Button>
                    <Button variant="ghost" size="sm" className="h-9 text-muted-foreground hover:text-white">
                        <Filter className="mr-2 h-3 w-3" />
                        Categoria
                    </Button>
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
                                <th className="px-6 py-4 font-medium">Demanda Total</th>
                                <th className="px-6 py-4 font-medium">Sugestão IA</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Prioridade</th>
                                <th className="px-6 py-4 font-medium">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {data.map((item) => (
                                <tr key={item.codigo_produto} className="group hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-white/10" />
                                            <div>
                                                <p className="font-medium text-white">{item.nome_produto}</p>
                                                <p className="text-[10px] text-muted-foreground">SKU: {item.codigo_produto}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-white">
                                        {item.estoque_atual} un
                                        <span className={`block text-[10px] ${item.cobertura_atual_dias < 10 ? 'text-red-400' : 'text-green-400'}`}>
                                            Cobertura: {item.cobertura_atual_dias?.toFixed(0) ?? 0} dias
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-white">
                                        {item.demanda_total.toLocaleString('pt-BR')} un
                                        <span className="block text-[10px] text-muted-foreground">
                                            Média: {item.demanda_media_dia.toFixed(1)}/dia
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="default" className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30">
                                                +{item.quantidade_sugerida} un
                                            </Badge>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">
                                            ROP: {item.rop.toFixed(0)} | Alvo: {item.estoque_alvo.toFixed(0)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge
                                            variant={
                                                item.status === 'ruptura' ? 'destructive' :
                                                    item.status === 'baixo_estoque' ? 'secondary' : // Using secondary as warning-like if variant 'warning' doesn't exist, check Badge definition but usually default/secondary/destructive/outline
                                                        item.status === 'excesso_estoque' ? 'outline' :
                                                            'default'
                                            }
                                            className={
                                                item.status === 'ruptura' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' :
                                                    item.status === 'baixo_estoque' ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' :
                                                        item.status === 'excesso_estoque' ? 'bg-yellow-500/10 text-yellow-400' :
                                                            'bg-green-500/20 text-green-400'
                                            }
                                        >
                                            {item.status.replace('_', ' ').toUpperCase()}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-white">
                                        {item.prioridade}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <ExplainButton product={item} />
                                            <Button size="sm" variant="ghost" className="h-8 gap-1">
                                                Detalhes <ChevronRight className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {data.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                                        Nenhuma sugestão encontrada.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 bg-white/5 px-6 py-4">
                    <p className="text-xs text-muted-foreground">Mostrando {data.length} sugestões</p>
                    <div className="flex gap-2">
                        <Button size="sm" variant="ghost" disabled>Anterior</Button>
                        <Button size="sm" variant="ghost">Próximo</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
