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
import { PromptInputBox } from "@/components/ui/ai-prompt-box";
import { CampaignCard } from "@/components/chat/CampaignCard";
import { StrategicPlanCard } from "@/components/chat/StrategicPlanCard";
import { saveCampaign, generateCampaign } from "@/app/actions/marketing";
import { uploadImageToStorage } from "@/lib/storage";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp?: string;
    type?: 'text' | 'campaign' | 'campaign_plan';
    campaignData?: any;
    planData?: any;
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


export function ChatInterface({ fullPage = false, hideHeader = false }: { fullPage?: boolean; hideHeader?: boolean }) {
    const { isOpen, closeChat } = useChat();
    const [isExpanded, setIsExpanded] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [isGeneratingAssets, setIsGeneratingAssets] = useState(false);
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

    // Listener para limpar histórico via evento customizado (do header da página)
    useEffect(() => {
        const handleClearEvent = () => {
            handleClearChat();
        };

        window.addEventListener('chat:clear-history', handleClearEvent);
        return () => window.removeEventListener('chat:clear-history', handleClearEvent);
    }, [handleClearChat]);

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

    // Listener para campanhas geradas
    useEffect(() => {
        const handleCampaignEvent = async (e: CustomEvent) => {
            const { campaign, products } = e.detail;

            // Adiciona mensagem do usuário
            const userMsg: Message = {
                id: Date.now().toString(),
                role: "user",
                content: `Gere uma campanha de marketing para ${products?.length || 0} produto(s) com excesso de estoque.`
            };

            // Adiciona mensagem da IA com a campanha
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "Campanha gerada com sucesso! Veja os materiais abaixo:",
                type: 'campaign',
                campaignData: { campaign, products }
            };

            setMessages(prev => [...prev, userMsg, aiMsg]);

            // Salvar campanha no banco de campanhas
            if (userId) {
                console.log("🔄 Tentando salvar campanha...", { userId, productsCount: products?.length });
                try {
                    // Extrair dados de texto
                    const lightCampaign = {
                        channels: {
                            instagram: {
                                copy: campaign?.channels?.instagram?.copy || '',
                                imagePrompt: campaign?.channels?.instagram?.imagePrompt || ''
                            },
                            whatsapp: {
                                script: campaign?.channels?.whatsapp?.script || '',
                                trigger: campaign?.channels?.whatsapp?.trigger || ''
                            },
                            physical: {
                                headline: campaign?.channels?.physical?.headline || '',
                                subheadline: campaign?.channels?.physical?.subheadline || '',
                                offer: campaign?.channels?.physical?.offer || ''
                            }
                        }
                    };

                    const lightProducts = (products || []).slice(0, 10).map((p: any) => ({
                        id: p.id || '',
                        nome: p.nome || '',
                        preco: p.preco || 0,
                        estoque: p.estoque || 0
                    }));

                    // Extrair imagens base64 (usando nomes corretos do n8n: imageUrl e posterUrl)
                    const instagramImageBase64 = campaign?.channels?.instagram?.imageUrl
                        || campaign?.channels?.instagram?.imageBase64
                        || campaign?.channels?.instagram?.image
                        || undefined;
                    const physicalImageBase64 = campaign?.channels?.physical?.posterUrl
                        || campaign?.channels?.physical?.posterBase64
                        || campaign?.channels?.physical?.poster
                        || campaign?.channels?.physical?.image
                        || undefined;

                    console.log("🖼️ Instagram image encontrada:", instagramImageBase64 ? `(${Math.round(instagramImageBase64.length / 1024)}KB)` : 'NÃO');
                    console.log("🖼️ Physical image encontrada:", physicalImageBase64 ? `(${Math.round(physicalImageBase64.length / 1024)}KB)` : 'NÃO');

                    // Upload imagens do CLIENTE para Storage (evita 413 no server action)
                    const timestamp = Date.now();
                    let instagramImageUrl: string | undefined = undefined;
                    let physicalImageUrl: string | undefined = undefined;

                    if (instagramImageBase64 && instagramImageBase64.length > 100) {
                        console.log("📤 Uploading Instagram image do cliente...");
                        const url = await uploadImageToStorage(instagramImageBase64, `${userId}/${timestamp}_instagram.png`);
                        if (url) instagramImageUrl = url;
                    }

                    if (physicalImageBase64 && physicalImageBase64.length > 100) {
                        console.log("📤 Uploading Physical image do cliente...");
                        const url = await uploadImageToStorage(physicalImageBase64, `${userId}/${timestamp}_physical.png`);
                        if (url) physicalImageUrl = url;
                    }

                    // Chamar saveCampaign SEM imagens base64 (apenas URLs)
                    const result = await saveCampaign(
                        userId,
                        lightCampaign,
                        lightProducts,
                        undefined, // não passa mais imagem base64
                        undefined, // não passa mais imagem base64
                        instagramImageUrl,
                        physicalImageUrl
                    );
                    console.log("📝 Resultado saveCampaign:", result);
                    if (result.success) {
                        console.log("✅ Campanha salva com sucesso! ID:", result.id);
                    } else {
                        console.error("❌ Falha ao salvar campanha:", result.error);
                    }
                } catch (err) {
                    console.error("❌ Erro ao salvar campanha:", err);
                }
            } else {
                console.warn("⚠️ userId não disponível, campanha não será salva");
            }

            // Salvar no histórico do chat (sem dados pesados)
            if (userId && sessionId) {
                saveChatMessage(userId, sessionId, 'user', userMsg.content).catch(console.error);
                saveChatMessage(userId, sessionId, 'assistant', 'Campanha gerada com sucesso!').catch(console.error);
            }
        };

        window.addEventListener("chat:campaign-generated", handleCampaignEvent as unknown as EventListener);
        return () => window.removeEventListener("chat:campaign-generated", handleCampaignEvent as unknown as EventListener);
    }, [userId, sessionId]);

    // Auto-scroll quando mensagens mudam
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    // Função para enviar mensagem via PromptInputBox
    const handleSendMessage = async (userContent: string) => {
        if (!userContent.trim() || isLoading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: userContent.trim()
        };

        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        // Salva mensagem do usuário no banco (não bloqueia a UI)
        if (userId && sessionId) {
            saveChatMessage(userId, sessionId, 'user', userContent.trim()).catch(console.error);
        }

        try {
            const response = await sendMessage(userContent.trim());

            // Tenta detectar se é uma resposta de plano estratégico (JSON)
            try {
                const parsed = JSON.parse(response);
                if (parsed.type === 'campaign_plan' && parsed.plan) {
                    const aiMsg: Message = {
                        id: (Date.now() + 1).toString(),
                        role: "assistant",
                        content: "Analisei os produtos e preparei um plano estratégico para sua campanha:",
                        type: 'campaign_plan',
                        planData: parsed.plan
                    };
                    setMessages(prev => [...prev, aiMsg]);

                    if (userId && sessionId) {
                        saveChatMessage(userId, sessionId, 'assistant', 'Plano estratégico gerado').catch(console.error);
                    }
                    setIsLoading(false);
                    return;
                }
            } catch (e) {
                // Não é JSON, continua como texto normal
            }

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        handleSendMessage(input.trim());
        setInput("");
    };

    // Função para aprovar plano estratégico e gerar ativos
    const handleApproveAndGenerate = async (products: any[]) => {
        setIsGeneratingAssets(true);

        // Adiciona mensagem do usuário
        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: "✅ Plano aprovado! Gere os ativos da campanha."
        };
        setMessages(prev => [...prev, userMsg]);

        try {
            // Extrai IDs dos produtos
            const productIds = products.map(p => String(p.id));
            console.log("🚀 Gerando ativos para produtos:", productIds);

            // Chama generateCampaign com os produtos do plano
            const result = await generateCampaign(productIds);
            console.log("📦 Resultado generateCampaign:", result);

            // Dispara evento para handleCampaignEvent processar
            window.dispatchEvent(new CustomEvent('chat:campaign-generated', {
                detail: {
                    campaign: result,
                    products: products.map(p => ({
                        id: p.id,
                        nome: p.nome,
                        preco: p.preco || 0,
                        estoque: p.estoque || 0
                    }))
                }
            }));
        } catch (error) {
            console.error("❌ Erro ao gerar campanha:", error);
            const errorMsg: Message = {
                id: 'error-' + Date.now(),
                role: 'assistant',
                content: 'Desculpe, ocorreu um erro ao gerar os ativos da campanha. Tente novamente.'
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsGeneratingAssets(false);
        }
    };

    return (
        <div className={cn(
            "flex flex-col h-full",
            fullPage
                ? "w-full bg-transparent"
                : "bg-transparent"
        )}>
            {/* Header - só mostra no widget flutuante quando hideHeader é false */}
            {!fullPage && !hideHeader && (
                <div className="flex items-center justify-between p-3 border-b border-border bg-accent">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="font-medium text-foreground text-sm">Assistente IA</span>
                        {isLoadingHistory && (
                            <Loader2 size={12} className="animate-spin text-blue-400" />
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleClearChat}
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
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </Button>
                    </div>
                </div>
            )}

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 min-h-0 overflow-y-auto px-4 md:px-8 lg:px-16 py-4 space-y-4">
                <div className="max-w-4xl mx-auto space-y-4">
                    {isLoadingHistory ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3">
                            <Loader2 size={24} className="animate-spin text-blue-400" />
                            <span className="text-muted-foreground text-sm">Carregando histórico...</span>
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
                                        msg.role === "assistant" ? "bg-blue-500/20 text-blue-400" : "bg-accent text-foreground"
                                    )}>
                                        {msg.role === "assistant" ? <Bot size={18} /> : <User size={18} />}
                                    </div>
                                    <div className={cn(
                                        "rounded-2xl px-4 py-2 text-sm overflow-hidden",
                                        msg.role === "assistant"
                                            ? "bg-card border border-border text-foreground rounded-tl-none"
                                            : "bg-blue-600 text-foreground rounded-tr-none"
                                    )}>
                                        {msg.role === "assistant" ? (
                                            <>
                                                <ReactMarkdown
                                                    components={{
                                                        p: ({ children }) => <p className="mb-2 last:mb-0 text-foreground leading-relaxed">{children}</p>,
                                                        strong: ({ children }) => <span className="font-semibold text-blue-500">{children}</span>,
                                                        ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1 text-foreground">{children}</ul>,
                                                        ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1 text-foreground">{children}</ol>,
                                                        li: ({ children }) => <li>{children}</li>,
                                                        h1: ({ children }) => <h1 className="text-xl font-bold mb-3 text-foreground mt-4 first:mt-0 max-w-full break-words">{children}</h1>,
                                                        h2: ({ children }) => <h2 className="text-lg font-bold mb-2 text-foreground mt-3 first:mt-0 max-w-full break-words">{children}</h2>,
                                                        h3: ({ children }) => <h3 className="text-base font-semibold mb-2 text-blue-500 mt-2 max-w-full break-words">{children}</h3>,
                                                        h4: ({ children }) => <h4 className="text-sm font-semibold mb-1 text-blue-500 mt-2 max-w-full break-words">{children}</h4>,
                                                        hr: () => <hr className="my-3 border-border" />,
                                                        blockquote: ({ children }) => <blockquote className="border-l-2 border-blue-500/50 pl-3 my-2 italic text-muted-foreground bg-blue-500/5 py-1 rounded-r">{children}</blockquote>,
                                                        code: ({ children }) => <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-orange-500 border border-border">{children}</code>
                                                    }}
                                                >
                                                    {cleanContent(msg.content)}
                                                </ReactMarkdown>
                                                {msg.type === 'campaign' && msg.campaignData && (
                                                    <div className="mt-4">
                                                        <CampaignCard
                                                            campaign={msg.campaignData.campaign}
                                                            products={msg.campaignData.products}
                                                        />
                                                    </div>
                                                )}
                                                {msg.type === 'campaign_plan' && msg.planData && (
                                                    <div className="mt-4">
                                                        <StrategicPlanCard
                                                            plan={msg.planData}
                                                            onApprove={handleApproveAndGenerate}
                                                            isLoading={isGeneratingAssets}
                                                        />
                                                    </div>
                                                )}
                                            </>
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
                                    <div className="bg-card border border-border rounded-2xl rounded-tl-none px-4 py-2 flex items-center gap-1">
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="shrink-0 px-4 md:px-8 lg:px-16 py-4">
                <div className="max-w-4xl mx-auto">
                    <PromptInputBox
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
