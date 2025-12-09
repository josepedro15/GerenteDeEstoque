"use client";

import { useChat } from "@/contexts/ChatContext";
import { Sparkles } from "lucide-react";

interface DashboardData {
    ruptureCount: number;
    capitalTotal: number;
    purchaseSuggestionValue: number;
    serviceLevel: number;
    itemCount: number;
}

export function DashboardAnalysisButton({ data }: { data: DashboardData }) {
    const { sendProductMessage } = useChat();

    const handleAnalysis = () => {
        // We reuse sendProductMessage but pass dashboard data. 
        // The prompt format will differ, so we might need to adjust ChatInterface logic 
        // OR we just construct a special "product" object that looks like dashboard stats 
        // ensuring the system prompt understands it.

        // Let's format the data to be friendly to the existing flow, 
        // or rely on the updated system prompt to distinguish.

        const dashboardPayload = {
            ...data,
            is_dashboard_analysis: true,
            nome_produto: "Análise Geral do Dashboard", // Fallback for UI
            codigo_produto: "DASH-001" // Fallback for UI
        };

        sendProductMessage(dashboardPayload);
    };

    return (
        <button
            onClick={handleAnalysis}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-blue-500/20 transition-transform hover:scale-105 active:scale-95"
        >
            <Sparkles size={16} />
            Rodar Análise IA
        </button>
    );
}
