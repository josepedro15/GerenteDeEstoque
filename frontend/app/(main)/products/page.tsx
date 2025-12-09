import { getStockAnalysis } from "@/app/actions/inventory";
import { ExplainButton } from "@/components/recommendations/ExplainButton";
import { Badge } from "@/components/ui/badge";
import { Search, Package, AlertCircle } from "lucide-react";

export default async function ProductsPage() {
    const products = await getStockAnalysis();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Produtos & Estoque</h1>
                    <p className="text-muted-foreground mt-1">Visão geral do catálogo, preços e níveis de estoque.</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-blue-600/10 px-4 py-2 rounded-lg border border-blue-600/20">
                        <span className="text-xs text-blue-400 block">Total de SKUs</span>
                        <span className="text-xl font-bold text-blue-100">{products.length}</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-md">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar produto por nome ou SKU..."
                        className="w-full rounded-lg border border-white/10 bg-black/20 py-2 pl-9 pr-4 text-sm text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-xs uppercase text-muted-foreground">
                            <tr>
                                <th className="px-6 py-4 font-medium">Produto / SKU</th>
                                <th className="px-6 py-4 font-medium text-right">Estoque</th>
                                <th className="px-6 py-4 font-medium text-right">Custo Unit.</th>
                                <th className="px-6 py-4 font-medium text-right">Preço Venda</th>
                                <th className="px-6 py-4 font-medium text-right">Margem</th>
                                <th className="px-6 py-4 font-medium text-center">Status</th>
                                <th className="px-6 py-4 font-medium text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {products.map((product) => {
                                const margin = product.preco_venda > 0
                                    ? ((product.preco_venda - product.custo) / product.preco_venda) * 100
                                    : 0;

                                return (
                                    <tr key={product.id_produto} className="group hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                                    <Package size={20} />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="font-medium text-white truncate max-w-[250px]">{product.nome_produto}</p>
                                                    <p className="text-xs text-muted-foreground">{product.codigo_produto}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`font-medium ${product.estoque_atual === 0 ? 'text-red-400' : 'text-white'}`}>
                                                {product.estoque_atual}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-muted-foreground">
                                            R$ {product.custo.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-white font-medium">
                                            R$ {product.preco_venda.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-xs px-2 py-1 rounded-full ${margin >= 30 ? 'bg-green-500/10 text-green-400' : margin > 0 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {margin.toFixed(1)}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {product.estoque_atual === 0 ? (
                                                <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/20 hover:bg-red-500/30">
                                                    Sem Estoque
                                                </Badge>
                                            ) : product.estoque_atual < product.estoque_seguranca ? (
                                                <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">
                                                    Baixo
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="border-green-500/50 text-green-500">
                                                    Normal
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <ExplainButton product={product} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
