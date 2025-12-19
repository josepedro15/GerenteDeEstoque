"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { Calculator, ChevronRight, Loader2, Search } from "lucide-react";
import { runSimulation } from "@/app/actions/simulator";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-4 font-bold text-foreground transition-all hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50"
        >
            {pending ? <Loader2 className="animate-spin" /> : <Calculator size={20} />}
            {pending ? "Calculando Cenários..." : "Simular Impacto"}
            {!pending && <ChevronRight className="transition-transform group-hover:translate-x-1" size={18} />}
        </button>
    );
}

export function ScenarioBuilder({ onSimulationComplete }: { onSimulationComplete: (data: any) => void }) {
    const handleSubmit = async (formData: FormData) => {
        const result = await runSimulation(formData);
        onSimulationComplete(result);
    };

    return (
        <div className="rounded-3xl border border-border bg-accent p-6 backdrop-blur-xl">
            <h2 className="mb-6 text-xl font-semibold text-foreground">Parâmetros de Compra</h2>

            <form action={handleSubmit} className="space-y-6">

                {/* Product Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Produto / SKU</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={18} />
                        <input
                            type="text"
                            name="sku"
                            placeholder="Ex: Cimento CP-II ou SKU 102030"
                            className="w-full rounded-xl border border-border bg-black/50 py-3 pl-10 pr-4 text-foreground placeholder-white/30 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Quantidade</label>
                        <input
                            type="number"
                            name="quantity"
                            placeholder="Ex: 500"
                            className="w-full rounded-xl border border-border bg-black/50 px-4 py-3 text-foreground placeholder-white/30 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Custo Unitário (R$)</label>
                        <input
                            type="number"
                            name="cost"
                            step="0.01"
                            placeholder="Ex: 25.90"
                            className="w-full rounded-xl border border-border bg-black/50 px-4 py-3 text-foreground placeholder-white/30 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Condição de Pagamento</label>
                    <select
                        name="paymentTerms"
                        className="w-full rounded-xl border border-border bg-black/50 px-4 py-3 text-foreground focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                        <option value="30">30 Dias</option>
                        <option value="30/60">30/60 Dias</option>
                        <option value="30/60/90">30/60/90 Dias</option>
                        <option value="120">120 Dias (Negociação Especial)</option>
                    </select>
                </div>

                <div className="rounded-xl bg-yellow-500/10 p-4 border border-yellow-500/20">
                    <p className="text-xs text-yellow-200/80">
                        ⚠ A IA irá considerar o histórico de vendas dos últimos 90 dias para calcular a projeção de saída.
                    </p>
                </div>

                <div className="pt-2">
                    <SubmitButton />
                </div>
            </form>
        </div>
    );
}
