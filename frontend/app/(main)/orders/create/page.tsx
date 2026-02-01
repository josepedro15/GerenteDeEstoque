"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { generateOrderProposal, OrderProposal } from "@/app/actions/orders";
import { OrderEditor } from "@/components/orders/OrderEditor";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function OrderCreator() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const supplierParam = searchParams.get("supplier");

    const [step, setStep] = useState<'input' | 'generating' | 'complete'>('input');
    const [leadTime, setLeadTime] = useState<string>("7"); // Default 7 days
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [proposal, setProposal] = useState<OrderProposal | null>(null);

    // Initial check
    useEffect(() => {
        if (!supplierParam) {
            setError("Fornecedor não especificado.");
            setStep('complete'); // Go to error state essentially
        }
    }, [supplierParam]);

    const handleGenerate = async () => {
        if (!supplierParam) return;
        setLoading(true);
        setStep('generating');
        setError(null);

        try {
            const days = parseInt(leadTime) || 7;
            const result = await generateOrderProposal(supplierParam, days);
            if (result.success && result.data) {
                setProposal(result.data);
                setStep('complete');
            } else {
                setError(result.error || "Erro ao gerar proposta.");
                setStep('input'); // Allow retry? or stay in generating? Let's go back to input or error view.
                // Actually error view is better to show what happened
            }
        } catch (e) {
            setError("Erro desconhecido ao conectar com o servidor.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading || step === 'generating') {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center space-y-4 animate-in fade-in">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <div className="text-center">
                    <h2 className="text-lg font-semibold">Analisando Estoque & Sazonalidade...</h2>
                    <p className="text-muted-foreground text-sm">
                        Considerando Lead Time de {leadTime} dias para {supplierParam}.
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-[50vh] flex flex-col items-center justify-center text-center p-4">
                <div className="bg-red-100 p-4 rounded-full mb-4 text-red-600">
                    <AlertCircle size={32} />
                </div>
                <h2 className="text-xl font-bold mb-2">Não foi possível gerar o pedido</h2>
                <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.back()}>Voltar</Button>
                    <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
                </div>
            </div>
        );
    }

    if (step === 'input') {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center p-4 bg-muted/10">
                <div className="bg-white p-8 rounded-xl shadow-sm border max-w-md w-full space-y-6">
                    <div className="text-center">
                        <h1 className="text-xl font-bold">Novo Pedido: {supplierParam}</h1>
                        <p className="text-muted-foreground text-sm mt-1">Configure os parâmetros para a IA.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Lead Time do Fornecedor (Dias)</label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    value={leadTime}
                                    onChange={(e) => setLeadTime(e.target.value)}
                                    min={1}
                                    className="text-lg"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Tempo estimado entre o pedido e a entrega. A IA usará isso para calcular a cobertura de estoque necessária.
                            </p>
                        </div>

                        <Button className="w-full h-12 text-lg" onClick={handleGenerate}>
                            Gerar Sugestão de Pedido
                        </Button>
                    </div>
                    <div className="flex justify-center">
                        <Button variant="link" size="sm" onClick={() => router.back()} className="text-muted-foreground">
                            Cancelar
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8">
            {proposal && (
                <OrderEditor
                    initialProposal={proposal}
                    onBack={() => router.back()}
                    leadTime={parseInt(leadTime) || 7}
                />
            )}
        </div>
    );
}

export default function OrderCreatePage() {
    return (
        <Suspense fallback={<div className="p-8">Carregando...</div>}>
            <OrderCreator />
        </Suspense>
    );
}
