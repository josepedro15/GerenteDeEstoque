"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StrategicPlanCard } from './StrategicPlanCard';
import { CampaignCard } from './CampaignCard';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { getOrCreateSessionId, fetchAuthenticatedUserId } from '@/lib/chat-session';
import { getChatHistory, clearChatSession } from '@/app/actions/chatHistory';
import { Send, Bot, User, Maximize2, Minimize2, ExternalLink, Trash2, Loader2, Sparkles, Check, CheckCircle, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChat as useSidebarChat } from "@/contexts/ChatContext";
import { useChat } from "@ai-sdk/react";
import { PromptInputBox } from "@/components/ui/ai-prompt-box";
// import { saveCampaign, generateCampaign } from "@/app/actions/marketing"; // Unused in this file based on logic, but kept if needed
// import { uploadImageToStorage } from "@/lib/storage";
// import { createBrowserClient } from "@supabase/ssr";
// import { sendActionPlanRequest } from "@/app/actions/action-plan";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp?: string;
    type?: 'text' | 'campaign' | 'campaign_plan';
    campaignData?: any;
    planData?: any;
}

// Helper auxiliar para parsear o conteúdo da mensagem
function parseMessageContent(content: string) {
    if (!content) return { type: 'text', content: '' };

    // Tenta encontrar JSON no conteúdo
    try {
        const jsonMatch = content.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);

        if (jsonMatch) {
            const jsonStr = jsonMatch[0];
            const parsed = JSON.parse(jsonStr);

            if (parsed.type === 'campaign_plan' && parsed.plan) {
                return { type: 'campaign_plan', planData: parsed.plan, original: parsed, content: content.replace(jsonStr, '').trim() };
            }
            if (parsed.channels) {
                return { type: 'campaign', campaignData: { campaign: parsed, products: [] }, original: parsed, content: content.replace(jsonStr, '').trim() };
            }
            if (parsed.type === 'error') {
                return { type: 'text', content: parsed.message || 'Erro' };
            }
        }
    } catch (e) {
        // Ignora erro de parse e retorna texto
    }
    return { type: 'text', content };
}

// Clean markdown content
const cleanContent = (text: string): string => {
    let cleaned = text;
    cleaned = cleaned.replace(/^```markdown\s*/, '').replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');
    return cleaned;
};

// Enhanced formatting for tool results
const formatToolResult = (result: any, resultId: string) => {
    if (!result) return null;

    try {
        // If result is a string, check if it's our formatted stock data
        if (typeof result === 'string') {
            if (result.startsWith('- ')) {
                // Stock data list
                return (
                    <div key={resultId} className="bg-slate-50 p-3 rounded-md text-sm my-2 border border-slate-200">
                        <p className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <Package size={16} /> Análise de Estoque:
                        </p>
                        <ul className="space-y-2">
                            {result.split('\n').map((line: string, i: number) => {
                                // Extract key metrics for highlighting
                                const parts = line.split('Status:');
                                const mainInfo = parts[0];
                                const status = parts[1]?.trim();

                                return (
                                    <li key={i} className="bg-white p-2 rounded border border-slate-100 shadow-sm">
                                        <div className="text-slate-700 text-xs text-wrap">{mainInfo}</div>
                                        {status && (
                                            <div className={`text-xs font-bold mt-1 px-2 py-0.5 rounded-full inline-block ${status.includes('Ruptura') ? 'bg-red-100 text-red-700' :
                                                status.includes('Crítico') ? 'bg-orange-100 text-orange-700' :
                                                    'bg-green-100 text-green-700'
                                                }`}>
                                                {status}
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                );
            }
            // Fallback for simple strings
            return (
                <div key={resultId} className="bg-slate-50 p-3 rounded-md text-sm my-2 text-slate-600 border border-slate-200">
                    <span className="font-semibold block mb-1">Resultado:</span>
                    {result}
                </div>
            );
        }

        // Handle specific object responses (Marketing, CRM, Instagram)
        if (typeof result === 'object') {
            if (result.status === 'ready_for_generation') {
                return (
                    <div key={resultId} className="bg-blue-50 p-3 rounded-md text-sm my-2 border border-blue-100 text-blue-800">
                        <CheckCircle size={16} className="inline mr-2" />
                        Campanha preparada: <strong>{result.context}</strong>
                    </div>
                );
            }
            if (result.action === 'generate_instagram') {
                return (
                    <div key={resultId} className="bg-purple-50 p-3 rounded-md text-sm my-2 border border-purple-100 text-purple-800">
                        <Loader2 size={16} className="inline mr-2 animate-spin" />
                        Gerando conteúdo para Instagram...
                    </div>
                );
            }
            if (result.action === 'generate_whatsapp') {
                return (
                    <div key={resultId} className="bg-green-50 p-3 rounded-md text-sm my-2 border border-green-100 text-green-800">
                        <Loader2 size={16} className="inline mr-2 animate-spin" />
                        Gerando mensagem CRM...
                    </div>
                );
            }
        }

    } catch (e) {
        console.error("Error formatting tool result:", e);
    }

    return (
        <div key={resultId} className="text-xs text-slate-400 italic mt-1">
            Processado.
        </div>
    );
};


export function ChatInterface({ fullPage = false, hideHeader = false, userId: propUserId, sessionId: propSessionId }: { fullPage?: boolean; hideHeader?: boolean; userId?: string; sessionId?: string }) {
    const { isOpen, closeChat } = useSidebarChat();
    const [isExpanded, setIsExpanded] = useState(false);

    const [sessionId, setSessionId] = useState<string>(propSessionId || "");
    const [userId, setUserId] = useState<string>(propUserId || "");
    const [userAvatar, setUserAvatar] = useState<string | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [hasLoadedHistory, setHasLoadedHistory] = useState(false);

    // Debug logging for ChatInterface props
    console.log("[ChatInterface] Render with userId:", userId, "sessionId:", sessionId);

    // AI SDK v5+ adaptation
    // We map 'status' to 'isLoading'. 'useChat' in this version might not manage input state, so we do it locally.
    // 'sendMessage' maps to 'append'. 'regenerate' maps to 'reload'.
    // @ts-ignore
    const { messages, status, sendMessage: append, regenerate: reload, stop, setMessages } = useChat({
        // @ts-ignore
        api: typeof window !== 'undefined' ? `${window.location.origin}/api/chat` : '/api/chat',
        // @ts-ignore
        body: { userId, sessionId },
        // maxSteps: 5, // Removing maxSteps as it might conflict with types
        onError: (error) => {
            console.error("AI Chat Error:", error);
        }
    });

    const isLoading = status === 'streaming' || status === 'submitted';

    // Removed unused input state handling since PromptInputBox is uncontrolled

    const [isGeneratingAssets, setIsGeneratingAssets] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Sync props with state
    useEffect(() => {
        if (propUserId) setUserId(propUserId);
    }, [propUserId]);

    useEffect(() => {
        if (propSessionId && propSessionId !== sessionId) {
            setSessionId(propSessionId);
            setHasLoadedHistory(false);
        }
    }, [propSessionId]);

    // Session Initialization
    useEffect(() => {
        const initializeSession = async () => {
            let currentUserId: string | null = userId;

            if (!currentUserId) {
                currentUserId = await fetchAuthenticatedUserId();
                if (currentUserId) setUserId(currentUserId);
            }

            if (!currentUserId) {
                console.warn("Usuário não autenticado");
                setIsLoadingHistory(false);
                return;
            }

            let currentSessionId = sessionId;
            if (!currentSessionId && !propSessionId) {
                currentSessionId = getOrCreateSessionId();
                setSessionId(currentSessionId);
            }

            try {
                setIsLoadingHistory(true);
                const history = await getChatHistory(currentUserId, 100);
                let targetSession = null;

                if (propSessionId) {
                    targetSession = history.find((s: any) => s.session_id === propSessionId);
                } else if (history && history.length > 0) {
                    targetSession = history[0];
                    if (targetSession.session_id) {
                        setSessionId(targetSession.session_id);
                        localStorage.setItem('chat_session_id', targetSession.session_id);
                    }
                }

                if (targetSession) {
                    const formattedMessages = targetSession.messages.map((m: any) => {
                        let content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
                        // Metadata handling logic if needed...
                        return {
                            id: m.id || crypto.randomUUID(),
                            role: m.role,
                            content: content,
                            parts: [], // Ensure parts exist for UIMessage compatibility
                            createdAt: m.timestamp ? new Date(m.timestamp) : undefined
                        } as any;
                    });
                    // @ts-ignore
                    setMessages(formattedMessages);
                } else {
                    // @ts-ignore
                    setMessages([{
                        id: "welcome",
                        role: "assistant",
                        content: "Olá! Posso ajudar com análises de estoque ou sugestões de compra?",
                        parts: [],
                        createdAt: new Date()
                    } as any]);
                }
            } catch (e) {
                console.error("History load error", e);
                // @ts-ignore
                setMessages([{
                    id: "welcome",
                    role: "assistant",
                    content: "Olá! Posso ajudar com análises de estoque ou sugestões de compra?",
                    parts: [],
                    createdAt: new Date()
                } as any]);
            } finally {
                setIsLoadingHistory(false);
                setHasLoadedHistory(true);
            }
        };

        if (!hasLoadedHistory || (propSessionId && propSessionId !== sessionId)) {
            initializeSession();
        }
    }, [hasLoadedHistory, propSessionId, userId]);

    // Profile Avatar
    useEffect(() => {
        const handleProfileUpdate = () => {
            const stored = localStorage.getItem("user_profile");
            if (stored) {
                const profile = JSON.parse(stored);
                setUserAvatar(profile.avatar || null);
            }
        };
        handleProfileUpdate();
        window.addEventListener("user-profile-updated", handleProfileUpdate);
        return () => window.removeEventListener("user-profile-updated", handleProfileUpdate);
    }, []);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages, isLoading, status]);

    const handleOpenPage = () => {
        closeChat();
        router.push('/chat');
    };

    const handleSendMessage = async (text: string) => {
        if (!text.trim()) return;
        // Check if append exists, otherwise fallback? 
        // Typescript might complain if append is missing from useChat return type.
        // If so, we might need 'sendMessage' or checking imports.
        // Assuming 'append' works for now as it remains in many versions.
        if (append) {
            await append({
                role: 'user',
                content: text
            } as any);
        }
    };

    const clearChatAction = useCallback(async () => {
        if (!userId || !sessionId) return;
        try {
            await clearChatSession(userId, sessionId);
            const newSessionId = crypto.randomUUID();
            localStorage.setItem('chat_session_id', newSessionId);
            setSessionId(newSessionId);
            setMessages([{
                id: "welcome",
                role: "assistant",
                content: "Conversa limpa! Como posso ajudar?",
                parts: [],
                createdAt: new Date()
            } as any]);
        } catch (error) {
            console.error("Erro ao limpar histórico:", error);
        }
    }, [userId, sessionId, setMessages]);

    const handleClearChatClick = useCallback(() => {
        if (window.confirm("Tem certeza que deseja limpar o histórico desta conversa?")) {
            clearChatAction();
        }
    }, [clearChatAction]);

    // Events
    useEffect(() => {
        const handleClearEvent = () => clearChatAction();
        window.addEventListener('chat:clear-history', handleClearEvent);
        return () => window.removeEventListener('chat:clear-history', handleClearEvent);
    }, [clearChatAction]);

    // Handle Product Event
    useEffect(() => {
        const handleProductEvent = async (e: CustomEvent) => {
            const data = e.detail;
            if (!data) return;

            let prompt = "";
            const nivelServico = data.nivel_servico || 0;
            const capital = data.capital_estoque || 0;

            if (data.source === 'dashboard' || data.is_dashboard_analysis) {
                const rupturas = data.risco?.itens_ruptura || 0;
                prompt = `Analise o estado geral do estoque.Ruptura: ${rupturas} itens.Capital Investido: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(capital)}. Nível de Serviço: ${nivelServico}%.O que priorizar ? `;
            } else {
                prompt = `Explique por que o sistema sugeriu comprar ${data.quantidade_sugerida || data.sugestao || 0} un do produto "${data.nome_produto || data.nome}"(SKU: ${data.codigo_produto || data.sku}).`;
            }

            handleSendMessage(prompt);
        };
        window.addEventListener("chat:send-product", handleProductEvent as unknown as EventListener);
        return () => window.removeEventListener("chat:send-product", handleProductEvent as unknown as EventListener);
    }, [append]); // Depend on append or handleSendMessage

    // Handle Batch Event
    useEffect(() => {
        const handleBatchEvent = async (e: CustomEvent) => {
            const { mode, products } = e.detail;
            if (!products || products.length === 0) return;

            const productsList = products.map((p: any) =>
                `* ${p.nome || p.nome_produto || 'Produto Sem Nome'} (SKU: ${p.codigo_produto || p.id}): Estoque ${p.estoque_atual || p.estoque} un, ABC ${p.abc || 'N/A'}, ${p.status || 'N/A'}`
            ).join('\n');

            let prompt = "";
            if (mode === 'analysis') {
                prompt = `Atue como um Especialista em Estoque.Realize uma análise técnica detalhada dos seguintes ${products.length} produtos: \n\n${productsList} \n\nREGRAS: \n1.Diagnóstico: Analise o nível de cobertura atual.\n2.Sugira ações para cada item.\n3.Não gere pedido agora.`;
            } else if (mode === 'purchase') {
                prompt = `Gere ordens de compra para os seguintes produtos: \n\n${productsList} \n\nConsidere reposição para 30 dias.`;
            }
            handleSendMessage(prompt);
        };
        window.addEventListener("chat:analyze-batch", handleBatchEvent as unknown as EventListener);
        return () => window.removeEventListener("chat:analyze-batch", handleBatchEvent as unknown as EventListener);
    }, [append]);

    // Handle Action Plan
    useEffect(() => {
        const handleActionPlanEvent = async (e: CustomEvent) => {
            const data = e.detail;
            if (!data) return;
            handleSendMessage(data.message);
        };
        window.addEventListener("chat:send-action-plan", handleActionPlanEvent as unknown as EventListener);
        return () => window.removeEventListener("chat:send-action-plan", handleActionPlanEvent as unknown as EventListener);
    }, [append]);

    // Handle Campaign Generated (Legacy?)
    useEffect(() => {
        const handleCampaignEvent = async (e: CustomEvent) => {
            const { campaign, products } = e.detail;
            const aiMsg = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: JSON.stringify({ type: 'campaign_plan', plan: campaign, generated: true }),
                parts: [],
                createdAt: new Date()
            } as any;
            // @ts-ignore
            setMessages(prev => [...prev, aiMsg]);
        };
        window.addEventListener("chat:campaign-generated", handleCampaignEvent as unknown as EventListener);
        return () => window.removeEventListener("chat:campaign-generated", handleCampaignEvent as unknown as EventListener);
    }, [setMessages]);

    const handleApproveAndGenerate = async (products: any[]) => {
        setIsGeneratingAssets(true);
        try {
            handleSendMessage("✅ Plano aprovado! Gere os ativos da campanha.");
        } catch (error) {
            console.error("Erro ao solicitar ativos:", error);
        } finally {
            setIsGeneratingAssets(false);
        }
    };


    return (
        <div className={cn(
            "flex flex-col overflow-hidden",
            fullPage ? "w-full h-full absolute inset-0" : "h-full"
        )}>
            {!fullPage && !hideHeader && (
                <div className="flex items-center justify-between p-3 border-b border-border bg-accent">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="font-medium text-foreground text-sm">Assistente IA (v2)</span>
                        {isLoadingHistory && (
                            <Loader2 size={12} className="animate-spin text-blue-400" />
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleClearChatClick}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
                            title="Limpar conversa"
                        >
                            <Trash2 size={14} />
                        </button>
                        <button
                            onClick={handleOpenPage}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 hover:text-foreground text-xs font-medium transition-all border border-blue-500/30"
                        >
                            <ExternalLink size={14} />
                            Abrir Página
                        </button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={closeChat}>
                            <span className="sr-only">Fechar</span>
                            <User size={16} />
                        </Button>
                    </div>
                </div>
            )}

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 sm:px-4 md:px-8 lg:px-16 py-4 space-y-4"
                style={{ minHeight: 0, WebkitOverflowScrolling: 'touch' }}>
                <div className="max-w-4xl mx-auto space-y-4">
                    {isLoadingHistory ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3">
                            <Loader2 size={24} className="animate-spin text-blue-400" />
                            <span className="text-muted-foreground text-sm">Carregando histórico...</span>
                        </div>
                    ) : (
                        <>
                            {messages.map((m) => {
                                const msg = m as any;
                                const { type, planData, campaignData, content } = parseMessageContent(msg.content);
                                const isAssistant = msg.role === 'assistant';

                                return (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            "flex gap-3 max-w-[80%]",
                                            !isAssistant ? "ml-auto flex-row-reverse" : ""
                                        )}
                                    >
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden",
                                            isAssistant ? "bg-blue-500/20 text-blue-400" : "bg-accent text-foreground"
                                        )}>
                                            {isAssistant ? (
                                                <Bot size={18} />
                                            ) : (
                                                userAvatar ? (
                                                    <img src={userAvatar} alt="User" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={18} />
                                                )
                                            )}
                                        </div>

                                        <div className={cn(
                                            "rounded-2xl p-4 text-sm shadow-sm",
                                            isAssistant
                                                ? "bg-card border border-border text-foreground rounded-tl-none"
                                                : "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100 rounded-tr-none"
                                        )}>
                                            {/* Messages Content */}
                                            {type === 'campaign_plan' ? (
                                                <StrategicPlanCard
                                                    plan={planData}
                                                    onApprove={(products) => handleApproveAndGenerate(products)}
                                                />
                                            ) : type === 'campaign' ? (
                                                <CampaignCard
                                                    campaign={campaignData?.campaign}
                                                    products={campaignData?.products}
                                                />
                                            ) : (
                                                isAssistant ? (
                                                    <MarkdownRenderer content={content || msg.content} />
                                                ) : (
                                                    <p className="whitespace-pre-wrap">{content || msg.content}</p>
                                                )
                                            )}

                                            {/* Tool Invocations - Handle both legacy toolInvocations and new parts */}
                                            {'parts' in msg && Array.isArray((msg as any).parts) ? (
                                                <div className="mt-3 space-y-2">
                                                    {(msg as any).parts.map((part: any, idx: number) => {
                                                        if (part.type === 'tool-invocation') {
                                                            const tool = part.toolInvocation;
                                                            return (
                                                                <div key={tool.toolCallId || idx} className="flex flex-col gap-2 p-2.5 rounded-lg bg-accent/50 text-xs text-muted-foreground border border-border/50">
                                                                    <div className="flex items-center gap-2">
                                                                        {tool.state === 'result' ? (
                                                                            <Check size={14} className="text-emerald-500 shrink-0" />
                                                                        ) : (
                                                                            <Loader2 size={14} className="animate-spin text-blue-500 shrink-0" />
                                                                        )}
                                                                        <span className="font-medium text-foreground text-[10px] uppercase tracking-wider">
                                                                            {tool.toolName}
                                                                        </span>
                                                                    </div>
                                                                    {tool.state === 'result' && (
                                                                        <div className="mt-1">
                                                                            {formatToolResult(tool.result, tool.toolCallId)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })}
                                                </div>
                                            ) : (
                                                // Legacy fallback
                                                (msg as any).toolInvocations && (msg as any).toolInvocations.length > 0 && (
                                                    <div className="mb-3 space-y-2">
                                                        {(msg as any).toolInvocations.map((tool: any) => (
                                                            <div key={tool.toolCallId} className="flex flex-col gap-2 p-2.5 rounded-lg bg-accent/50 text-xs text-muted-foreground border border-border/50">
                                                                <div className="flex items-center gap-2">
                                                                    {tool.state === 'result' ? (
                                                                        <Check size={14} className="text-emerald-500 shrink-0" />
                                                                    ) : (
                                                                        <Loader2 size={14} className="animate-spin text-blue-500 shrink-0" />
                                                                    )}
                                                                    <span className="font-medium text-foreground text-[10px] uppercase tracking-wider">
                                                                        {tool.toolName}
                                                                    </span>
                                                                </div>
                                                                {tool.state === 'result' && (
                                                                    <div className="mt-1">
                                                                        {formatToolResult(tool.result, tool.toolCallId)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )
                                            )}

                                        </div>
                                    </div>
                                );
                            })}

                            {isLoading && (
                                <div className="flex gap-3 max-w-[80%]">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden bg-blue-500/20 text-blue-400">
                                        <Bot size={18} />
                                    </div>
                                    <div className="bg-card border border-border text-foreground rounded-2xl p-4 rounded-tl-none flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                        <span className="text-xs text-muted-foreground">Gerando resposta...</span>
                                    </div>
                                </div>
                            )}

                        </>
                    )}
                </div>
            </div>

            <div className="shrink-0 px-3 sm:px-4 md:px-8 lg:px-16 py-3 sm:py-4 border-t border-border/50 bg-background/80 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto">
                    {messages.length <= 1 && !isLoading && (
                        <div className="flex flex-wrap gap-2 mb-3 justify-center">
                            {[
                                { emoji: "📦", text: "Qual o estoque de cimento?" },
                                { emoji: "💰", text: "Qual o valor da argamassa?" },
                                { emoji: "🎯", text: "Como criar uma campanha?" },
                            ].map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSendMessage(action.text)}
                                    className="px-3 py-1.5 text-xs rounded-full border border-border bg-accent hover:bg-accent/80 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                                >
                                    <span>{action.emoji}</span>
                                    <span>{action.text}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    <PromptInputBox
                        // value={input} // Uncontrolled
                        // onChange={(e) => setInput(e.target.value)}
                        onSend={(message) => {
                            if (message.trim() && !isLoading && !isLoadingHistory) {
                                handleSendMessage(message);
                            }
                        }}
                        isLoading={isLoading}
                        placeholder="Digite sua pergunta sobre o estoque..."
                    />
                </div>
            </div>

        </div>
    );
}
