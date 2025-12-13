"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { motion } from "framer-motion";
import { Sparkles, TrendingDown, Calendar, Star, Loader2, CheckCircle2 } from "lucide-react";
import { generateCampaign } from "@/app/actions/marketing";

// Mock Data for "Opportunities"
const opportunities = [
    { id: '1', name: "Cimento CP-II 50kg", reason: "EXCESS", label: "Excesso Crítico (>90d)", stock: 500, price: 28.90 },
    { id: '2', name: "Porcelanato 80x80 Bege", reason: "SEASONAL", label: "Alta Sazonalidade Verão", stock: 120, price: 89.90 },
    { id: '3', name: "Kit Ferramentas 20pcs", reason: "NEW", label: "Lançamento da Semana", stock: 50, price: 159.00 },
];

function SubmitButton({ disabled }: { disabled: boolean }) {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending || disabled}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-pink-600 py-4 font-bold text-white transition-all hover:bg-pink-500 hover:shadow-lg hover:shadow-pink-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {pending ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
            {pending ? "Criando Magia..." : "Gerar Campanha com IA"}
        </button>
    );
}

export function OpportunityRadar({ onCampaignGenerated }: { onCampaignGenerated: (data: any) => void }) {
    const [selected, setSelected] = useState<string[]>([]);

    const toggleSelect = (id: string) => {
        if (selected.includes(id)) {
            setSelected(selected.filter(i => i !== id));
        } else {
            setSelected([...selected, id]);
        }
    };

    const handleSubmit = async (formData: FormData) => {
        // Append selected IDs manually or handle via hidden inputs
        // For server action, we prefer binding or simple passing
        const result = await generateCampaign(selected);
        onCampaignGenerated(result);
    };

    return (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="mb-6 text-xl font-semibold text-white flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Radar de Oportunidades
            </h2>

            <form action={handleSubmit}>
                <div className="space-y-3 mb-6">
                    {opportunities.map((item) => {
                        const isSelected = selected.includes(item.id);
                        return (
                            <div
                                key={item.id}
                                onClick={() => toggleSelect(item.id)}
                                className={`cursor-pointer relative overflow-hidden rounded-xl border p-4 transition-all ${isSelected
                                        ? "border-pink-500 bg-pink-500/10"
                                        : "border-white/10 bg-black/40 hover:bg-white/5"
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${item.reason === 'EXCESS' ? 'bg-red-500/20 text-red-400' :
                                                item.reason === 'SEASONAL' ? 'bg-orange-500/20 text-orange-400' :
                                                    'bg-blue-500/20 text-blue-400'
                                            }`}>
                                            {item.reason === 'EXCESS' ? <TrendingDown size={18} /> :
                                                item.reason === 'SEASONAL' ? <Calendar size={18} /> :
                                                    <Star size={18} />}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white">{item.name}</h3>
                                            <p className="text-xs text-muted-foreground">{item.label}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-white">R$ {item.price.toFixed(2)}</p>
                                        <p className="text-xs text-muted-foreground">{item.stock} un</p>
                                    </div>
                                </div>
                                {isSelected && (
                                    <div className="absolute top-2 right-2 text-pink-500">
                                        <CheckCircle2 size={16} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="rounded-xl bg-pink-500/10 p-4 border border-pink-500/20 mb-6">
                    <p className="text-xs text-pink-200/80">
                        ✨ Selecione um ou mais itens. A IA irá criar posts, textos e scripts focados no objetivo (Queima ou Margem).
                    </p>
                </div>

                <SubmitButton disabled={selected.length === 0} />
            </form>
        </div>
    );
}
