"use client";

import { BookOpen, Calculator, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LogicPage() {
    return (
        <div className="space-y-6 p-4 lg:p-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <Calculator size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Lógica de Cálculos</h1>
                    <p className="text-muted-foreground">Entenda como as sugestões e métricas são geradas pelo sistema.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Sugestão de Compra */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Info size={18} className="text-blue-400" />
                            Sugestão de Compra
                        </CardTitle>
                        <CardDescription>Como calculamos quanto comprar</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        <p>
                            A sugestão de compra visa garantir estoque suficiente para cobrir o <strong>Lead Time</strong> do fornecedor + <strong>Margem de Segurança</strong>.
                        </p>
                        <div className="bg-muted p-3 rounded-lg font-mono text-xs">
                            Sugestão = (Média Venda Diária × Dias Cobertura Alvo) - Estoque Atual - Trânsito
                        </div>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>Se o resultado for negativo, a sugestão é 0.</li>
                            <li>Consideramos o Estoque em Trânsito para evitar encomendas duplicadas.</li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Classificação ABC */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Info size={18} className="text-amber-400" />
                            Classificação ABC
                        </CardTitle>
                        <CardDescription>Critério de importância dos produtos</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        <p>
                            Classificamos os produtos com base na sua representatividade no faturamento total dos últimos 60 dias.
                        </p>
                        <ul className="space-y-2">
                            <li className="flex items-center justify-between">
                                <span><strong className="text-emerald-400">Classe A</strong> (80% do faturamento)</span>
                                <span className="text-xs bg-muted px-2 py-1 rounded">Alta prioridade</span>
                            </li>
                            <li className="flex items-center justify-between">
                                <span><strong className="text-blue-400">Classe B</strong> (15% do faturamento)</span>
                                <span className="text-xs bg-muted px-2 py-1 rounded">Média prioridade</span>
                            </li>
                            <li className="flex items-center justify-between">
                                <span><strong className="text-muted-foreground">Classe C</strong> (5% do faturamento)</span>
                                <span className="text-xs bg-muted px-2 py-1 rounded">Baixa prioridade</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Status de Estoque */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Info size={18} className="text-emerald-400" />
                            Definição de Status
                        </CardTitle>
                        <CardDescription>Quando um produto entra em alerta?</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                                <h4 className="font-bold text-red-500 mb-1">RUPTURA</h4>
                                <p className="text-xs text-muted-foreground">Estoque zerado. Perda imediata de vendas.</p>
                            </div>
                            <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                                <h4 className="font-bold text-amber-500 mb-1">CRÍTICO</h4>
                                <p className="text-xs text-muted-foreground">Cobertura menor que 15 dias. Risco iminente.</p>
                            </div>
                            <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
                                <h4 className="font-bold text-blue-500 mb-1">ATENÇÃO</h4>
                                <p className="text-xs text-muted-foreground">Cobertura entre 15 e 30 dias. Monitorar.</p>
                            </div>
                            <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                                <h4 className="font-bold text-emerald-500 mb-1">SAUDÁVEL</h4>
                                <p className="text-xs text-muted-foreground">Cobertura acima de 30 dias. Estoque seguro.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
