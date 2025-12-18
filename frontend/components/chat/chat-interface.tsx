"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { sendMessage } from "@/app/actions/chat";
import { getChatHistory, saveChatMessage, clearChatSession } from "@/app/actions/chatHistory";
import { Send, Bot, User, Maximize2, Minimize2, ExternalLink, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { useChat } from "@/contexts/ChatContext";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp?: string;
}

// Gera ou recupera sessionId do localStorage
function getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return crypto.randomUUID();

    const stored = localStorage.getItem('chat_session_id');
    if (stored) return stored;

    const newId = crypto.randomUUID();
    localStorage.setItem('chat_session_id', newId);
    return newId;
}

// TODO: Substituir por contexto de auth real quando disponível
function getUserId(): string {
    // Por enquanto usando um placeholder - substituir por auth.uid() real
    if (typeof window === 'undefined') return '';

    const stored = localStorage.getItem('user_id');
    if (stored) return stored;

    // Fallback para desenvolvimento
    const devId = '3afe2fba-ef22-474a-8888-d55380066dd3';
    localStorage.setItem('user_id', devId);
    return devId;
}

export function ChatInterface() {
    const { isOpen, closeChat } = useChat();
    const [isExpanded, setIsExpanded] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [sessionId, setSessionId] = useState<string>("");
    const [userId, setUserId] = useState<string>("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const hasLoadedHistory = useRef(false);

    // Inicializa IDs no cliente
    useEffect(() => {
        setSessionId(getOrCreateSessionId());
        setUserId(getUserId());
    }, []);

    // Carrega histórico do banco de dados (com timeout)
    useEffect(() => {
        if (!userId || hasLoadedHistory.current) return;

        // Timeout de segurança - garante que o chat não fique travado
        const timeout = setTimeout(() => {
            if (isLoadingHistory) {
                console.warn("Timeout no carregamento do histórico");
                setIsLoadingHistory(false);
                setMessages([{
                    id: "welcome",
                    role: "assistant",
                    content: "Olá! Posso ajudar com análises de estoque ou sugestões de compra?"
                }]);
                hasLoadedHistory.current = true;
            }
        }, 3000);

        async function loadHistory() {
            setIsLoadingHistory(true);
            try {
                const sessions = await getChatHistory(userId, 100);

                if (sessions && sessions.length > 0) {
                    // Pega a sessão mais recente
                    const latestSession = sessions[0];

                    // Atualiza o sessionId para continuar na mesma sessão
                    setSessionId(latestSession.session_id);
                    localStorage.setItem('chat_session_id', latestSession.session_id);

                    // Carrega mensagens históricas
                    const historicMessages: Message[] = latestSession.messages.map(m => ({
                        id: m.id,
                        role: m.role,
                        content: m.content,
                        timestamp: m.timestamp
                    }));

                    setMessages(historicMessages);
                } else {
                    // Primeira vez - mostra mensagem de boas-vindas
                    setMessages([{
                        id: "welcome",
                        role: "assistant",
                        content: "Olá! Posso ajudar com análises de estoque ou sugestões de compra?"
                    }]);
                }

                hasLoadedHistory.current = true;
            } catch (error) {
                console.error("Erro ao carregar histórico:", error);
                setMessages([{
                    id: "welcome",
                    role: "assistant",
                    content: "Olá! Posso ajudar com análises de estoque ou sugestões de compra?"
                }]);
                hasLoadedHistory.current = true;
            } finally {
                clearTimeout(timeout);
                setIsLoadingHistory(false);
            }
        }

        loadHistory();

        return () => clearTimeout(timeout);
    }, [userId]);


    const handleOpenPage = () => {
        closeChat();
        router.push('/chat');
    };

    const cleanContent = (text: string) => {
        return text.replace(/^```markdown\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');
    };

    // Limpar conversa
    const handleClearChat = useCallback(async () => {
        if (!userId || !sessionId) return;

        const confirmed = window.confirm("Tem certeza que deseja limpar o histórico desta conversa?");
        if (!confirmed) return;

        try {
            await clearChatSession(userId, sessionId);

            // Cria nova sessão
            const newSessionId = crypto.randomUUID();
            localStorage.setItem('chat_session_id', newSessionId);
            setSessionId(newSessionId);

            // Reseta mensagens
            setMessages([{
                id: "welcome",
                role: "assistant",
                content: "Conversa limpa! Como posso ajudar?"
            }]);
        } catch (error) {
            console.error("Erro ao limpar histórico:", error);
        }
    }, [userId, sessionId]);

    // Listen to "Explain Product" events
    useEffect(() => {
        const handleProductEvent = async (e: CustomEvent) => {
            const data = e.detail;
            let prompt = "";

            if (data.is_dashboard_analysis) {
                const capital = data.financeiro?.total_estoque || 0;
                const nivelServico = data.risco?.share_audavel || 0;

                prompt = `Analise o estado geral do meu estoque atual. Tenho ${data.risco?.itens_ruptura || 0} itens em ruptura, ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(capital)} em capital investido e nível de serviço de ${nivelServico.toFixed(1)}%. O que devo priorizar?`;
            } else {
                prompt = `Explique por que o sistema sugeriu comprar ${data.quantidade_sugerida || data.sugestao || 0} un do produto "${data.nome_produto || data.nome}" (SKU: ${data.codigo_produto || data.sku}).`;
            }

            const userMsg: Message = {
                id: Date.now().toString(),
                role: "user",
                content: prompt
            };
            setMessages(prev => [...prev, userMsg]);
            setIsLoading(true);

            // Salva mensagem do usuário no banco
            if (userId && sessionId) {
                await saveChatMessage(userId, sessionId, 'user', prompt, { source: 'product_event', data });
            }

            try {
                const response = await sendMessage(prompt, data);
                const aiMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: response
                };
                setMessages(prev => [...prev, aiMsg]);

                // Salva resposta da IA no banco
                if (userId && sessionId) {
                    await saveChatMessage(userId, sessionId, 'assistant', response);
                }
            } catch (error) {
                console.error(error);
                setMessages(prev => [...prev, { id: 'error', role: 'assistant', content: 'Erro ao analisar dados.' }]);
            } finally {
                setIsLoading(false);
            }
        };

        window.addEventListener("chat:send-product", handleProductEvent as unknown as EventListener);
        return () => window.removeEventListener("chat:send-product", handleProductEvent as unknown as EventListener);
    }, [userId, sessionId]);

    // Auto-scroll quando mensagens mudam
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userContent = input.trim();
        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: userContent
        };

        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        // Salva mensagem do usuário no banco (não bloqueia a UI)
        if (userId && sessionId) {
            saveChatMessage(userId, sessionId, 'user', userContent).catch(console.error);
        }

        try {
            const response = await sendMessage(userContent);
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: response
            };
            setMessages(prev => [...prev, aiMsg]);

            // Salva resposta da IA no banco (não bloqueia a UI)
            if (userId && sessionId) {
                saveChatMessage(userId, sessionId, 'assistant', response).catch(console.error);
            }
        } catch (error) {
            console.error(error);
            const errorMsg: Message = {
                id: 'error-' + Date.now(),
                role: 'assistant',
                content: 'Desculpe, ocorreu um erro. Tente novamente.'
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={cn(
            "fixed bg-[#1a1c23] border border-white/10 rounded-xl shadow-2xl flex flex-col z-50 transition-all duration-300 ease-in-out",
            isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-10 pointer-events-none",
            isExpanded ? "bottom-4 right-4 w-[800px] h-[80vh]" : "bottom-4 right-4 w-[400px] h-[600px]"
        )}>
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="font-medium text-white text-sm">Assistente IA</span>
                    {isLoadingHistory && (
                        <Loader2 size={12} className="animate-spin text-blue-400" />
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleClearChat}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-colors"
                        title="Limpar conversa"
                    >
                        <Trash2 size={14} />
                    </button>
                    <button
                        onClick={handleOpenPage}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 hover:text-white text-xs font-medium transition-all border border-blue-500/30"
                    >
                        <ExternalLink size={14} />
                        Abrir Página
                    </button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-white"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-white" onClick={closeChat}>
                        <span className="sr-only">Fechar</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20"
            >
                {isLoadingHistory ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                        <Loader2 size={24} className="animate-spin text-blue-400" />
                        <span className="text-neutral-500 text-sm">Carregando histórico...</span>
                    </div>
                ) : (
                    <>
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex gap-3 max-w-[80%]",
                                    msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                    msg.role === "assistant" ? "bg-blue-500/20 text-blue-400" : "bg-white/10 text-white"
                                )}>
                                    {msg.role === "assistant" ? <Bot size={18} /> : <User size={18} />}
                                </div>
                                <div className={cn(
                                    "rounded-2xl px-4 py-2 text-sm overflow-hidden",
                                    msg.role === "assistant"
                                        ? "bg-white/5 text-slate-200 rounded-tl-none"
                                        : "bg-blue-600 text-white rounded-tr-none"
                                )}>
                                    {msg.role === "assistant" ? (
                                        <ReactMarkdown
                                            components={{
                                                p: ({ children }) => <p className="mb-2 last:mb-0 text-slate-300 leading-relaxed">{children}</p>,
                                                strong: ({ children }) => <span className="font-semibold text-blue-400">{children}</span>,
                                                ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1 text-slate-300">{children}</ul>,
                                                ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1 text-slate-300">{children}</ol>,
                                                li: ({ children }) => <li>{children}</li>,
                                                h1: ({ children }) => <h1 className="text-xl font-bold mb-3 text-white mt-4 first:mt-0 max-w-full break-words">{children}</h1>,
                                                h2: ({ children }) => <h2 className="text-lg font-bold mb-2 text-white mt-3 first:mt-0 max-w-full break-words">{children}</h2>,
                                                h3: ({ children }) => <h3 className="text-base font-semibold mb-2 text-blue-200 mt-2 max-w-full break-words">{children}</h3>,
                                                h4: ({ children }) => <h4 className="text-sm font-semibold mb-1 text-blue-200 mt-2 max-w-full break-words">{children}</h4>,
                                                hr: () => <hr className="my-3 border-white/10" />,
                                                blockquote: ({ children }) => <blockquote className="border-l-2 border-blue-500/50 pl-3 my-2 italic text-slate-400 bg-blue-500/5 py-1 rounded-r">{children}</blockquote>,
                                                code: ({ children }) => <code className="bg-black/40 px-1.5 py-0.5 rounded text-xs font-mono text-yellow-200 border border-white/5">{children}</code>
                                            }}
                                        >
                                            {cleanContent(msg.content)}
                                        </ReactMarkdown>
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3 max-w-[80%]">
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                                    <Bot size={18} />
                                </div>
                                <div className="bg-white/5 rounded-2xl rounded-tl-none px-4 py-2 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/5 bg-white/5 backdrop-blur-md">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Digite sua pergunta sobre o estoque..."
                        className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-slate-500"
                        disabled={isLoadingHistory}
                    />
                    <Button type="submit" size="icon" disabled={isLoading || isLoadingHistory || !input.trim()}>
                        <Send size={18} />
                    </Button>
                </form>
            </div>
        </div>
    );
}
