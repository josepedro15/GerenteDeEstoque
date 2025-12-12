import { getStockData } from "@/app/actions/inventory";
import { ExplainButton } from "@/components/recommendations/ExplainButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Search,
    Filter,
    Plus,
    FileEdit,
    Trash2,
    Eye
} from "lucide-react";
import { parseNumber, normalizeStatus, cleanStatusText, formatCurrency } from "@/lib/formatters";

export default async function ProductsPage() {
    const { detalhe } = await getStockData();

    const data = detalhe.map(item => ({
        ...item,
        estoque_atual: parseNumber(item.estoque_atual),
        preco: parseNumber(item.preco),
        custo: parseNumber(item.custo),
        dias_de_cobertura: parseNumber(item.dias_de_cobertura)
    }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white/90">
                        Produtos
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        Gerencie seu catálogo de produtos e estoque.
                    </p>
                </div>
                <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Produto
                </Button>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-md">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar produtos..."
                        className="w-full rounded-lg border border-white/10 bg-black/20 py-2 pl-9 pr-4 text-sm text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
                <Button variant="ghost" size="sm" className="h-9 text-muted-foreground hover:text-white">
                    <Filter className="mr-2 h-3 w-3" />
                    Filtros
                </Button>
            </div>

            {/* Products Table */}
            <div className="rounded-xl border border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-xs uppercase text-muted-foreground">
                            <tr>
                                <th className="px-6 py-4 font-medium">Produto</th>
                                <th className="px-6 py-4 font-medium">Estoque</th>
                                <th className="px-6 py-4 font-medium">Preço</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {data.map((item) => {
                                const statusNorm = normalizeStatus(item.status_ruptura);
                                const preco = item.preco; // Already parsed number
                                const formattedPrice = formatCurrency(preco);

                                return (
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
                                            {item.estoque_atual}
                                        </td>
                                        <td className="px-6 py-4 text-white">
                                            {formattedPrice}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge
                                                variant={
                                                    statusNorm === 'RUPTURA' || statusNorm === 'CRÍTICO' ? 'destructive' :
                                                        statusNorm === 'ATENÇÃO' ? 'secondary' :
                                                            statusNorm === 'EXCESSO' ? 'outline' :
                                                                'default'
                                                }
                                                className={
                                                    statusNorm === 'RUPTURA' || statusNorm === 'CRÍTICO' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' :
                                                        statusNorm === 'ATENÇÃO' ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' :
                                                            statusNorm === 'EXCESSO' ? 'bg-yellow-500/10 text-yellow-400' :
                                                                'bg-green-500/20 text-green-400'
                                                }
                                            >
                                                {cleanStatusText(item.status_ruptura || '')}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* <ExplainButton product={item} /> */}
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-white">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-white">
                                                    <FileEdit className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}

                            {data.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                        Nenhum produto encontrado.
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
