import { getSuppliers } from "@/app/actions/inventory";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

export default async function SuppliersPage() {
    const suppliers = await getSuppliers();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Fornecedores</h1>
                    <p className="text-muted-foreground mt-1">Gerenciamento e visualização de parceiros.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur-md">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar fornecedor..."
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
                                <th className="px-6 py-4 font-medium">Fornecedor</th>
                                <th className="px-6 py-4 font-medium">Cidade</th>
                                <th className="px-6 py-4 font-medium">Lead Time (Dias)</th>
                                <th className="px-6 py-4 font-medium">ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {suppliers.map((supplier) => (
                                <tr key={supplier.id_fornecedor} className="group hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xs">
                                                {supplier.nome_fornecedor.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className="font-medium text-white">{supplier.nome_fornecedor}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {supplier.cidade || "-"}
                                    </td>
                                    <td className="px-6 py-4 text-white">
                                        <Badge variant="outline" className="bg-white/5">
                                            {supplier.lead_time_padrao} dias
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-muted-foreground">
                                        {supplier.id_fornecedor}
                                    </td>
                                </tr>
                            ))}

                            {suppliers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                        Nenhum fornecedor encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
