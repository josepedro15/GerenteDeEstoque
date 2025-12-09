"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { sendMessage } from "@/app/actions/chat";
import { Send, Bot, User, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

import { useChat } from "@/contexts/ChatContext";

export function ChatInterface() {
    const { isOpen, closeChat } = useChat(); // Consuming context for visibility
    const [isExpanded, setIsExpanded] = useState(false);

    const cleanContent = (text: string) => {
        return text.replace(/^```markdown\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');
    };

    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "assistant",
            content: "Olá! Posso ajudar com análises de estoque ou sugestões de compra?"
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Listen to "Explain Product" events
    useEffect(() => {
        const handleProductEvent = async (e: CustomEvent) => {
            const data = e.detail;
            let prompt = "";

            if (data.is_dashboard_analysis) {
                prompt = `Analise o estado geral do meu estoque atual. Tenho ${data.ruptureCount} itens em ruptura, ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.capitalTotal)} em capital parado e nível de serviço de ${data.serviceLevel.toFixed(1)}%. O que devo priorizar?`;
            } else {
                prompt = `Explique por que o sistema sugeriu comprar ${data.quantidade_sugerida} un do produto "${data.nome_produto}" (SKU: ${data.codigo_produto}).`;
            }

            // Add user message to UI immediately
            const userMsg: Message = {
                id: Date.now().toString(),
                role: "user",
                content: prompt
            };
            setMessages(prev => [...prev, userMsg]);
            setIsLoading(true);

            try {
                // Pass product/dashboard data as second argument
                const response = await sendMessage(prompt, data);
                const aiMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: response
                };
                setMessages(prev => [...prev, aiMsg]);
            } catch (error) {
                console.error(error);
                setMessages(prev => [...prev, { id: 'error', role: 'assistant', content: 'Erro ao analisar dados.' }]);
            } finally {
                setIsLoading(false);
            }
        };

        window.addEventListener("chat:send-product" as any, handleProductEvent);
        return () => window.removeEventListener("chat:send-product" as any, handleProductEvent);
    }, []);

    // if (!isOpen) return null; // REMOVE THIS LINE to fix Hooks Rule

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]); // Added isOpen dependency to scroll when opening

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input
        };

        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await sendMessage(userMsg.content);
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: response
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Use CSS to hide/show and position fixed
    return (
        <div className={cn(
            "fixed bg-[#1a1c23] border border-white/10 rounded-xl shadow-2xl flex flex-col z-50 transition-all duration-300 ease-in-out",
            isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-10 pointer-events-none",
            isExpanded ? "bottom-4 right-4 w-[800px] h-[80vh]" : "bottom-4 right-4 w-[400px] h-[600px]"
        )}>
            {/* Header / Close Button */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="font-medium text-white">Assistente IA</span>
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-white"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-white" onClick={closeChat}>
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
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/5 bg-white/5 backdrop-blur-md">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Digite sua pergunta sobre o estoque..."
                        className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-slate-500"
                    />
                    <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                        <Send size={18} />
                    </Button>
                </form>
            </div>
        </div>
    );
}
