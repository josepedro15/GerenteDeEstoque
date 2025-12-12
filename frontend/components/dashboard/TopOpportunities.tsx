import { TopMoverItem } from "@/types/analytics";
import { formatCurrency } from "@/lib/formatters";
import { ExplainButton } from "@/components/recommendations/ExplainButton";

export function TopOpportunities({
    ruptureItems,
    excessItems
}: {
    ruptureItems: TopMoverItem[];
    excessItems: TopMoverItem[]
}) {
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Rupture Opportunities */}
            <div className="rounded-xl border border-white/5 bg-white/5 p-6 backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">🔥 Principais Rupturas (Receita Perdida)</h3>
                </div>
                <div className="space-y-4">
                    {ruptureItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
                            <div className="flex-1 min-w-0 pr-4">
                                <p className="font-medium text-white truncate">{item.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{item.id}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right">
                                    <p className="font-bold text-red-400">{formatCurrency(item.value)}</p>
                                    <p className="text-[10px] text-muted-foreground">Perda Diária Est.</p>
                                </div>
                                <ExplainButton product={{ ...item, id_produto: item.id, produto_descricao: item.name }} />
                            </div>
                        </div>
                    ))}
                    {ruptureItems.length === 0 && <p className="text-muted-foreground text-sm">Nenhuma ruptura crítica encontrada.</p>}
                </div>
            </div>

            {/* Excess Opportunities */}
            <div className="rounded-xl border border-white/5 bg-white/5 p-6 backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">🧊 Estoque Parado (Capital Imobilizado)</h3>
                </div>
                <div className="space-y-4">
                    {excessItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
                            <div className="flex-1 min-w-0 pr-4">
                                <p className="font-medium text-white truncate">{item.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{item.id}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right">
                                    <p className="font-bold text-blue-400">{formatCurrency(item.value)}</p>
                                    <p className="text-[10px] text-muted-foreground">Valor Total</p>
                                </div>
                                <ExplainButton product={{ ...item, id_produto: item.id, produto_descricao: item.name }} />
                            </div>
                        </div>
                    ))}
                    {excessItems.length === 0 && <p className="text-muted-foreground text-sm">Nenhum excesso crítico encontrado.</p>}
                </div>
            </div>
        </div>
    );
}
