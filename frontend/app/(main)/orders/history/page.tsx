"use client";

import { useEffect, useState } from "react";
import { getOrderHistory } from "@/app/actions/orders";
import { formatCurrency } from "@/lib/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type HistoryItem = { id: string; supplier_name: string; created_at: string; total_value: number };

export default function OrderHistoryPage() {
    const [orders, setOrders] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            const result = await getOrderHistory();
            if (result.success && result.data) {
                setOrders(result.data as HistoryItem[]);
            }
            setLoading(false);
        };
        fetchHistory();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Histórico de Pedidos</h1>
            </div>

            <div className="grid gap-4">
                {orders.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            Nenhum pedido salvo encontrado.
                        </CardContent>
                    </Card>
                ) : (
                    orders.map((order) => (
                        <Card key={order.id} className="hover:bg-muted/5 transition-colors">
                            <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">{order.supplier_name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar size={14} />
                                            {format(new Date(order.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Total</div>
                                        <div className="font-bold text-lg text-emerald-600">
                                            {formatCurrency(Number(order.total_value))}
                                        </div>
                                    </div>

                                    <Link href={`/orders/history/${order.id}`}>
                                        <Button variant="outline" size="sm" className="gap-2">
                                            Ver Detalhes <ArrowRight size={16} />
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
