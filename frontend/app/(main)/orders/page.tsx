"use client";

import { useState, useMemo, useEffect } from "react";
import {
    Search, Truck, Calendar, DollarSign, Package, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import { pedidoTransitoService } from "@/lib/services";
import { PedidoTransito } from "@/types/fornecedor";

export default function OrdersPage() {
    const [orders, setOrders] = useState<PedidoTransito[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await pedidoTransitoService.getAll();
            // Filter out placeholder 'SEM PENDÊNCIAS' if necessary, though service handles it
            setOrders(data.filter(d => d.status_pedido !== '✅ SEM PENDÊNCIAS'));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = useMemo(() => {
        if (!search.trim()) return orders;
        const term = search.toLowerCase();
        return orders.filter(o =>
            o.fornecedor_nome.toLowerCase().includes(term) ||
            o.numero_nf?.toLowerCase().includes(term)
        );
    }, [orders, search]);

    return (
        <div className="space-y-4 p-4 lg:p-6 animate-in fade-in duration-300">
            {/* Header */}
            <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <Truck className="text-primary" size={24} />
                    Pedidos em Trânsito
                </h1>
                <p className="text-sm text-muted-foreground">
                    Acompanhamento de entregas e pedidos pendentes
                </p>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full py-12 text-center text-muted-foreground">
                        Carregando pedidos...
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="col-span-full py-12 flex flex-col items-center text-muted-foreground bg-card rounded-xl border border-dashed border-border">
                        <Package size={48} className="mb-4 opacity-20" />
                        <p>Nenhum pedido em trânsito encontrado.</p>
                    </div>
                ) : (
                    filteredOrders.map((order) => (
                        <div key={order.id_pedido} className="flex flex-col rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md hover:border-primary/20">
                            {/* Status Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "text-[10px] font-bold px-2 py-1 rounded-full border",
                                        order.status_pedido === '🔴 ATRASADO' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                            order.status_pedido === '🟡 PENDENTE' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                                "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                    )}>
                                        {order.status_pedido.replace(/[🔴🟡🟢✅]/g, '').trim()}
                                    </span>
                                </div>
                                <span className="text-sm font-bold text-foreground">
                                    {formatCurrency(order.valor_pedido)}
                                </span>
                            </div>

                            {/* Details */}
                            <div className="space-y-2 flex-1">
                                <p className="font-semibold text-foreground truncate" title={order.fornecedor_nome}>
                                    {order.fornecedor_nome}
                                </p>

                                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Calendar size={12} />
                                        <span>{order.data_pedido ? new Date(order.data_pedido).toLocaleDateString() : "N/A"}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <AlertCircle size={12} className={order.dias_aguardando > 30 ? "text-red-400" : ""} />
                                        <span>Há {order.dias_aguardando} dias</span>
                                    </div>
                                    <div className="col-span-2 text-[10px] font-mono mt-1">
                                        NF: {order.numero_nf || "N/A"}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                                <span>{order.qtd_itens || 0} itens</span>
                                <Button variant="ghost" size="sm" className="h-6 text-[10px]">
                                    Ver Detalhes
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
