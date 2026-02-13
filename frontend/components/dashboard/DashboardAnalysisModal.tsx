"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, AlertCircle, MessageCircle } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    analyzeDashboardData,
    type DashboardAnalysisPayload,
} from "@/app/actions/dashboardAnalysis";

interface DashboardAnalysisModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    payload: DashboardAnalysisPayload | null;
}

const SUGGESTED_QUESTION = "Tenho dúvidas sobre a análise do dashboard (ruptura, excessos e prioridades).";

export function DashboardAnalysisModal({
    open,
    onOpenChange,
    payload,
}: DashboardAnalysisModalProps) {
    const { openChatWithQuestion } = useChat();
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const startedRef = useRef(false);

    const runAnalysis = useCallback(async () => {
        if (!payload) return;
        setLoading(true);
        setError(null);
        setAnalysis(null);
        try {
            const result = await analyzeDashboardData(payload);
            if (result.success) {
                setAnalysis(result.analysis);
            } else {
                setError(result.error);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Erro ao analisar.");
        } finally {
            setLoading(false);
        }
    }, [payload]);

    useEffect(() => {
        if (open && payload && !startedRef.current) {
            startedRef.current = true;
            runAnalysis();
        }
    }, [open, payload, runAnalysis]);

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            setAnalysis(null);
            setError(null);
            startedRef.current = false;
        }
        onOpenChange(next);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Análise executiva do dashboard
                    </DialogTitle>
                </DialogHeader>
                <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">
                                Analisando dados do dashboard...
                            </p>
                        </div>
                    )}
                    {error && (
                        <div className="flex items-start gap-2 p-4 rounded-lg bg-destructive/10 text-destructive">
                            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
                    {analysis && !loading && (
                        <div className="prose prose-sm prose-invert max-w-none text-foreground">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    p: ({ children }) => (
                                        <p className="mb-2 last:mb-0">{children}</p>
                                    ),
                                    strong: ({ children }) => (
                                        <strong className="font-semibold text-primary">
                                            {children}
                                        </strong>
                                    ),
                                    ul: ({ children }) => (
                                        <ul className="list-disc ml-4 mb-2 space-y-1">
                                            {children}
                                        </ul>
                                    ),
                                    ol: ({ children }) => (
                                        <ol className="list-decimal ml-4 mb-2 space-y-1">
                                            {children}
                                        </ol>
                                    ),
                                    li: ({ children }) => <li>{children}</li>,
                                    h1: ({ children }) => (
                                        <h1 className="text-lg font-bold mt-4 mb-2 first:mt-0">
                                            {children}
                                        </h1>
                                    ),
                                    h2: ({ children }) => (
                                        <h2 className="text-base font-semibold mt-3 mb-1">
                                            {children}
                                        </h2>
                                    ),
                                }}
                            >
                                {analysis}
                            </ReactMarkdown>
                        </div>
                    )}
                    {payload && !analysis && !error && !loading && (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Iniciando análise...</p>
                        </div>
                    )}
                </div>
                {analysis && !loading && (
                    <div className="flex justify-end pt-2 border-t border-border">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                onOpenChange(false);
                                openChatWithQuestion(SUGGESTED_QUESTION);
                            }}
                            className="gap-2"
                        >
                            <MessageCircle className="h-4 w-4" />
                            Tirar dúvidas no chat
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
