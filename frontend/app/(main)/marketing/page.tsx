"use client";

import { motion } from "framer-motion";
import { Megaphone, Rocket, Sparkles } from "lucide-react";
import { useState } from "react";
import { OpportunityRadar } from "@/components/marketing/OpportunityRadar";
import { CampaignResult } from "@/components/marketing/CampaignResult";

export default function MarketingPage() {
    const [campaign, setCampaign] = useState<any>(null);

    return (
        <div className="min-h-screen bg-[#050505] p-8 text-white">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-auto max-w-7xl"
            >
                <header className="mb-10 border-b border-white/10 pb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/20 text-pink-400 p-2">
                            <Megaphone size={32} />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Agente de Marketing Criativo</h1>
                    </div>
                    <p className="max-w-2xl text-muted-foreground">
                        Transforme oportunidades de estoque em campanhas de vendas completas.
                        Selecione os produtos e deixe a IA criar o conteúdo.
                    </p>
                </header>

                <div className="grid gap-8 lg:grid-cols-12">
                    {/* Left Column: Input (Radar) */}
                    <div className="lg:col-span-5">
                        <OpportunityRadar onCampaignGenerated={setCampaign} />
                    </div>

                    {/* Right Column: Output (Result) */}
                    <div className="lg:col-span-7">
                        <CampaignResult campaign={campaign} />
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
