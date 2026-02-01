"use client";

import { useEffect, useState, use } from "react";
import { getOrder, OrderProposal } from "@/app/actions/orders";
import { OrderEditor } from "@/components/orders/OrderEditor";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function OrderHistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const router = useRouter();
    const [proposal, setProposal] = useState<OrderProposal | null>(null);
    const [leadTime, setLeadTime] = useState<number>(7);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrder = async () => {
            const result = await getOrder(unwrappedParams.id);
            if (result.success && result.data) {
                setProposal(result.data.proposal);
                setLeadTime(result.data.meta.lead_time || 7);
            } else {
                setError("Pedido não encontrado.");
            }
            setLoading(false);
        };
        fetchOrder();
    }, [unwrappedParams.id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !proposal) {
        return (
            <div className="h-[50vh] flex flex-col items-center justify-center text-center p-4">
                <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">Erro</h2>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => router.back()}>Voltar</Button>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8">
            <OrderEditor
                initialProposal={proposal}
                onBack={() => router.back()}
                leadTime={leadTime}
            />
        </div>
    );
}
