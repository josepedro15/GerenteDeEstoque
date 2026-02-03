"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { sendMessage } from "@/app/actions/chat";
import { getChatHistory, saveChatMessage, clearChatSession } from "@/app/actions/chatHistory";
import { Send, Bot, User, Maximize2, Minimize2, ExternalLink, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChat } from "@/contexts/ChatContext";
import { PromptInputBox } from "@/components/ui/ai-prompt-box";
import { CampaignCard } from "@/components/chat/CampaignCard";
import { StrategicPlanCard } from "@/components/chat/StrategicPlanCard";
import { saveCampaign, generateCampaign } from "@/app/actions/marketing";
import { uploadImageToStorage } from "@/lib/storage";
import { createBrowserClient } from "@supabase/ssr";
import { sendActionPlanRequest } from "@/app/actions/action-plan";

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

// Busca userId do usuário autenticado via Supabase
async function fetchAuthenticatedUserId(): Promise<string | null> {
    if (typeof window === 'undefined') return null;

    try {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user } } = await supabase.auth.getUser();
        return user?.id || null;
    } catch (error) {
        console.error('Erro ao buscar usuário autenticado:', error);
        return null;
    }
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
    const [userAvatar, setUserAvatar] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const hasLoadedHistory = useRef(false);

    // Inicializa IDs no cliente
    useEffect(() => {
        setSessionId(getOrCreateSessionId());

        // Buscar userId do usuário autenticado
        fetchAuthenticatedUserId().then(id => {
            if (id) {
                setUserId(id);
            } else {
                console.warn('Usuário não autenticado - funcionalidades de histórico desabilitadas');
            }
        });

        // Carregar avatar do localStorage
        const stored = localStorage.getItem("user_profile");
        if (stored) {
            const profile = JSON.parse(stored);
            if (profile.avatar) {
                setUserAvatar(profile.avatar);
            }
        }

        // Listener para atualizações de perfil
        const handleProfileUpdate = () => {
            const stored = localStorage.getItem("user_profile");
            if (stored) {
                const profile = JSON.parse(stored);
                setUserAvatar(profile.avatar || null);
            }
        };

        window.addEventListener("user-profile-updated", handleProfileUpdate);
        return () => window.removeEventListener("user-profile-updated", handleProfileUpdate);
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

    // Clean markdown content - remove JSON routing metadata and markdown code fences
    const cleanContent = (text: string): string => {
        let cleaned = text;

        // Remove markdown code fences
        cleaned = cleaned.replace(/^```markdown\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');

        // Remove HTML comments (used for hidden AI context)
        cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

        // Detectar e remover JSON de roteamento no início (formato: "json {...}" ou "{...}")
        const trimmed = cleaned.trim();

        // Verificar se começa com "json" seguido de {
        const jsonPrefixMatch = trimmed.match(/^json\s*(\{)/i);
        const startsWithBrace = trimmed.startsWith('{');

        if (jsonPrefixMatch || startsWithBrace) {
            // Encontrar onde o JSON começa
            const jsonStartIndex = trimmed.indexOf('{');

            if (jsonStartIndex !== -1) {
                // Balancear chaves para encontrar o fim do JSON
                let braceCount = 0;
                let jsonEndIndex = -1;

                for (let i = jsonStartIndex; i < trimmed.length; i++) {
                    if (trimmed[i] === '{') braceCount++;
                    else if (trimmed[i] === '}') braceCount--;

                    if (braceCount === 0) {
                        jsonEndIndex = i;
                        break;
                    }
                }

                if (jsonEndIndex !== -1) {
                    // Extrair o conteúdo após o JSON
                    const afterJson = trimmed.substring(jsonEndIndex + 1).trim();

                    // Se há conteúdo significativo após o JSON, usar esse conteúdo
                    if (afterJson.length > 20) {
                        // Remover possíveis artefatos de formatação
                        cleaned = afterJson
                            .replace(/^---\s*/, '')
                            .replace(/^\s*```\s*/, '')
                            .trim();
                    }
                }
            }
        }

        return cleaned;
    };

    // Limpar conversa
    // Lógica de limpar conversa (sem confirm)
    const clearChatAction = useCallback(async () => {
        if (!userId || !sessionId) {
            console.warn("Tentativa de limpar chat sem userId/sessionId");
            return;
        }

        try {
            // Enviar comando de reset para o webhook
            try {
                await sendMessage('/reset', []);
            } catch (err) {
                console.error("Erro ao enviar /reset para webhook:", err);
            }

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

    // Handler para botão interno (com confirm)
    const handleClearChatClick = useCallback(() => {
        if (window.confirm("Tem certeza que deseja limpar o histórico desta conversa?")) {
            clearChatAction();
        }
    }, [clearChatAction]);

    // Listener para limpar histórico via evento customizado (do header da página)
    useEffect(() => {
        const handleClearEvent = () => {
            // Evento externo já teve confirmação
            clearChatAction();
        };

        window.addEventListener('chat:clear-history', handleClearEvent);
        return () => window.removeEventListener('chat:clear-history', handleClearEvent);
    }, [clearChatAction]);

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
                const response = await sendMessage(prompt, [], data);
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

    // Listener para análise em lote (vindo da sidebar)
    useEffect(() => {
        const handleBatchEvent = async (e: CustomEvent) => {
            const { mode, products } = e.detail;

            if (!products || products.length === 0) return;

            let prompt = "";

            // Formatar lista de produtos para o prompt
            const productsList = products.map((p: any) =>
                `- ${p.nome} (SKU: ${p.codigo_produto || p.id}): Estoque ${p.estoque_atual} un, ABC ${p.abc}, ${p.status}`
            ).join('\n');

            if (mode === 'analysis') {
                prompt = `Atue como um Especialista em Estoque. Realize uma análise técnica detalhada dos seguintes ${products.length} produtos:\n\n${productsList}\n\nREGRAS:\n1. Diagnóstico: Analise o nível de cobertura atual e identifique riscos iminentes (ruptura ou excesso).\n2. Classificação: Verifique se a curva ABC informada condiz com a movimentação recente (se houver dados).\n3. Ação Sugerida: Para cada item, sugira "Manter", "Promover" (se excesso) ou "Repor" (se ruptura).\n4. ALERTA: Não gere pedido de compra agora. Apenas apresente o cenário para tomada de decisão.\nUse tabelas para apresentar os dados.`;
            } else if (mode === 'purchase') {
                prompt = `Gere ordens de compra para os seguintes produtos:\n\n${productsList}\n\nConsidere reposição para 30 dias.`;
            }

            // Simular mensagem do usuário
            const userMsg: Message = {
                id: Date.now().toString(),
                role: "user",
                content: prompt
            };
            setMessages(prev => [...prev, userMsg]);
            setIsLoading(true);

            // Salvar no histórico
            if (userId && sessionId) {
                saveChatMessage(userId, sessionId, 'user', prompt, { source: 'batch_action', data: { mode, products } }).catch(console.error);
            }

            try {
                // Enviar para API
                const response = await sendMessage(prompt, [], {
                    products,
                    type: 'batch_analysis'
                });

                const aiMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: response
                };
                setMessages(prev => [...prev, aiMsg]);

                if (userId && sessionId) {
                    saveChatMessage(userId, sessionId, 'assistant', response).catch(console.error);
                }
            } catch (error) {
                console.error(error);
                setMessages(prev => [...prev, { id: 'error', role: 'assistant', content: 'Erro ao processar análise em lote.' }]);
            } finally {
                setIsLoading(false);
            }
        };

        window.addEventListener("chat:analyze-batch", handleBatchEvent as unknown as EventListener);
        return () => window.removeEventListener("chat:analyze-batch", handleBatchEvent as unknown as EventListener);
    }, [userId, sessionId]);

    // Listener para plano de ação (vindo do modal de alertas)
    useEffect(() => {
        const handleActionPlanEvent = async (e: CustomEvent) => {
            const data = e.detail;

            if (!data) return;

            // Adiciona mensagem do usuário
            const userMsg: Message = {
                id: Date.now().toString(),
                role: "user",
                content: data.message
            };
            setMessages(prev => [...prev, userMsg]);
            setIsLoading(true);

            // Salvar no histórico
            if (userId && sessionId) {
                saveChatMessage(userId, sessionId, 'user', data.message, { source: 'action_plan', data }).catch(console.error);
            }

            try {
                // Enviar para webhook específico de plano de ação (adicionando user_id)
                const payloadWithUser = { ...data, user_id: userId };
                const result = await sendActionPlanRequest(payloadWithUser);

                const aiMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: result.message
                };
                setMessages(prev => [...prev, aiMsg]);

                if (userId && sessionId) {
                    saveChatMessage(userId, sessionId, 'assistant', result.message).catch(console.error);
                }
            } catch (error) {
                console.error(error);
                setMessages(prev => [...prev, { id: 'error', role: 'assistant', content: 'Erro ao gerar plano de ação. Tente novamente.' }]);
            } finally {
                setIsLoading(false);
            }
        };

        window.addEventListener("chat:send-action-plan", handleActionPlanEvent as unknown as EventListener);
        return () => window.removeEventListener("chat:send-action-plan", handleActionPlanEvent as unknown as EventListener);
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

            // VERIFICAR TIPO DE RESPOSTA:
            // - Agente Estratégico: { type: "campaign_plan", ... } ou { success: true, campaign: { type: "campaign_plan", ... } }
            // - Agente de Ativos: { channels: {...} } ou { success: true, channels: {...} }
            // - Resposta de Ajuda: { plan: { type: "ajuda", mensagem: "..." } }

            // Normalizar: a resposta pode vir direta ou aninhada em "campaign"
            const actualCampaign = campaign?.campaign || campaign;

            // VERIFICAR SE É RESPOSTA DE AJUDA (exibir como texto simples)
            const isHelpResponse = actualCampaign?.plan?.type === 'ajuda' ||
                actualCampaign?.plan?.status === 'instrucao' ||
                actualCampaign?.type === 'ajuda';

            if (isHelpResponse) {
                const helpMessage = actualCampaign?.plan?.mensagem ||
                    actualCampaign?.mensagem ||
                    'Para criar uma campanha eficaz, selecione produtos das 3 curvas (A, B e C) e clique em Gerar Campanha.';

                const aiMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: `💡 **Dica:**\n\n${helpMessage}`,
                    type: 'text'
                };

                setMessages(prev => [...prev, userMsg, aiMsg]);

                if (userId && sessionId) {
                    saveChatMessage(userId, sessionId, 'user', userMsg.content).catch(console.error);
                    saveChatMessage(userId, sessionId, 'assistant', helpMessage).catch(console.error);
                }
                return;
            }

            const isPlan = actualCampaign?.type === 'campaign_plan' || actualCampaign?.requires_approval === true;
            const hasChannels = actualCampaign?.channels && Object.keys(actualCampaign.channels).length > 0;

            console.log("📊 Tipo de resposta:", { isPlan, hasChannels, campaignType: actualCampaign?.type });

            if (isPlan) {
                // PLANO ESTRATÉGICO - exibir como texto no chat
                const planStatus = actualCampaign?.plan?.status || 'ajuste_recomendado';
                // Garantir que são arrays
                const planAlerts = Array.isArray(actualCampaign?.alertas)
                    ? actualCampaign.alertas
                    : (Array.isArray(actualCampaign?.plan?.alertas) ? actualCampaign.plan.alertas : []);
                const planProducts = Array.isArray(actualCampaign?.produtos)
                    ? actualCampaign.produtos
                    : (Array.isArray(actualCampaign?.plan?.produtos) ? actualCampaign.plan.produtos : []);

                // Formatar mensagem do plano
                let planMessage = "📋 **Plano Estratégico de Campanha**\n\n";

                if (planStatus === 'ajuste_recomendado') {
                    planMessage += "⚠️ **Ajuste Recomendado**\n\n";
                } else if (planStatus === 'aprovado') {
                    planMessage += "✅ **Plano Aprovado**\n\n";
                }

                // Adicionar alertas
                if (planAlerts.length > 0) {
                    planMessage += "**Alertas:**\n";
                    planAlerts.forEach((alert: any) => {
                        planMessage += `• ${String(alert)}\n`;
                    });
                    planMessage += "\n";
                }

                // Adicionar produtos analisados
                if (planProducts.length > 0) {
                    planMessage += "**Produtos analisados:**\n";
                    planProducts.slice(0, 5).forEach((p: any) => {
                        const curva = p?.curva || p?.abc_curve || '?';
                        const papel = p?.papel || 'Queima';
                        const desconto = p?.desconto_sugerido || 0;
                        planMessage += `• ${p?.nome || p?.name || 'Produto'} (Curva ${curva}) - ${papel} - ${desconto}% OFF\n`;
                    });
                    if (planProducts.length > 5) {
                        planMessage += `  ... e mais ${planProducts.length - 5} produtos\n`;
                    }
                    planMessage += "\n";
                }

                // Adicionar mix e sugestões
                const mix = actualCampaign?.plan?.mix_atual || actualCampaign?.mix_percentual || actualCampaign?.plan?.mix_percentual;
                if (mix) {
                    planMessage += `**Mix ABC:** A: ${mix.A || 0}% | B: ${mix.B || 0}% | C: ${mix.C || 0}%\n\n`;
                }

                // Adicionar nome sugerido e duração
                if (actualCampaign?.nome_sugerido) {
                    planMessage += `**Nome sugerido:** ${actualCampaign.nome_sugerido}\n`;
                }
                if (actualCampaign?.duracao_sugerida) {
                    planMessage += `**Duração:** ${actualCampaign.duracao_sugerida}\n`;
                }

                // Formatar planData na estrutura esperada pelo StrategicPlanCard
                const formattedPlan = {
                    status: planStatus as 'aprovado' | 'ajuste_recomendado' | 'ajuste_necessario',
                    mix_atual: actualCampaign?.plan?.mix_atual || { A: 0, B: 0, C: 0, total: 0 },
                    mix_percentual: actualCampaign?.plan?.mix_percentual || actualCampaign?.mix_percentual || { A: '0%', B: '0%', C: '0%' },
                    alertas: planAlerts,
                    produtos: planProducts,
                    estimativas: actualCampaign?.estimativas || actualCampaign?.plan?.estimativas || { faturamento_potencial: 0, desconto_medio: 0 },
                    tipo_campanha_sugerido: actualCampaign?.tipo_campanha_sugerido || actualCampaign?.plan?.tipo_campanha_sugerido || 'queimao',
                    duracao_sugerida: actualCampaign?.duracao_sugerida || actualCampaign?.plan?.duracao_sugerida || '7 dias',
                    nome_sugerido: actualCampaign?.nome_sugerido || actualCampaign?.plan?.nome_sugerido || 'Promoção Especial'
                };

                const aiMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: planMessage,
                    type: 'campaign_plan',
                    planData: formattedPlan
                };

                setMessages(prev => [...prev, userMsg, aiMsg]);

                // Salvar no histórico do chat
                if (userId && sessionId) {
                    saveChatMessage(userId, sessionId, 'user', userMsg.content).catch(console.error);
                    saveChatMessage(userId, sessionId, 'assistant', planMessage).catch(console.error);
                }

            } else if (hasChannels) {
                // ATIVOS FINAIS - exibir como materiais de campanha
                const aiMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: "Campanha gerada com sucesso! Veja os materiais abaixo:",
                    type: 'campaign',
                    campaignData: { campaign: actualCampaign, products }
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
                                    copy: actualCampaign?.channels?.instagram?.copy || '',
                                    imagePrompt: actualCampaign?.channels?.instagram?.imagePrompt || ''
                                },
                                whatsapp: {
                                    script: actualCampaign?.channels?.whatsapp?.script || '',
                                    trigger: actualCampaign?.channels?.whatsapp?.trigger || ''
                                },
                                physical: {
                                    headline: actualCampaign?.channels?.physical?.headline || '',
                                    subheadline: actualCampaign?.channels?.physical?.subheadline || '',
                                    offer: actualCampaign?.channels?.physical?.offer || ''
                                }
                            }
                        };

                        const lightProducts = (products || []).slice(0, 10).map((p: any) => ({
                            id: p.id || '',
                            nome: p.nome || '',
                            preco: p.preco || 0,
                            estoque: p.estoque || 0
                        }));

                        // Extrair imagens base64
                        const instagramImageBase64 = actualCampaign?.channels?.instagram?.imageUrl
                            || actualCampaign?.channels?.instagram?.imageBase64
                            || actualCampaign?.channels?.instagram?.image
                            || undefined;
                        const physicalImageBase64 = actualCampaign?.channels?.physical?.posterUrl
                            || actualCampaign?.channels?.physical?.posterBase64
                            || actualCampaign?.channels?.physical?.poster
                            || actualCampaign?.channels?.physical?.image
                            || undefined;

                        console.log("🖼️ Instagram image encontrada:", instagramImageBase64 ? `(${Math.round(instagramImageBase64.length / 1024)}KB)` : 'NÃO');
                        console.log("🖼️ Physical image encontrada:", physicalImageBase64 ? `(${Math.round(physicalImageBase64.length / 1024)}KB)` : 'NÃO');

                        // Upload imagens do CLIENTE para Storage
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

                        // Chamar saveCampaign
                        const result = await saveCampaign(
                            userId,
                            lightCampaign,
                            lightProducts,
                            undefined,
                            undefined,
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

                // Salvar no histórico do chat
                if (userId && sessionId) {
                    saveChatMessage(userId, sessionId, 'user', userMsg.content).catch(console.error);
                    saveChatMessage(userId, sessionId, 'assistant', 'Campanha gerada com sucesso!').catch(console.error);
                }
            } else {
                // RESPOSTA DESCONHECIDA ou ERRO - exibir como texto
                const errorContent = campaign?.error || campaign?.message || JSON.stringify(campaign, null, 2);
                const aiMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: `Resposta recebida:\n\n${errorContent}`,
                    type: 'text'
                };

                setMessages(prev => [...prev, userMsg, aiMsg]);

                if (userId && sessionId) {
                    saveChatMessage(userId, sessionId, 'user', userMsg.content).catch(console.error);
                    saveChatMessage(userId, sessionId, 'assistant', errorContent).catch(console.error);
                }
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
            // Constrói histórico para memória (mensagens anteriores)
            const conversationHistory = messages.map(m => ({
                role: m.role as 'user' | 'assistant',
                content: typeof m.content === 'string' ? m.content : ''
            }));

            const response = await sendMessage(userContent.trim(), conversationHistory);

            // Tenta detectar se é uma resposta de plano estratégico ou campanha (JSON)
            try {
                // Limpar resposta - extrair JSON válido
                let jsonString = response;
                let textContent = '';

                // NOVA LÓGICA: Detectar formato "json {...}" seguido de markdown
                // Este é o formato do roteador n8n que retorna metadados + conteúdo
                if (response.toLowerCase().startsWith('json')) {
                    // Encontrar onde o JSON termina (balanceando chaves)
                    const jsonStartIndex = response.indexOf('{');
                    if (jsonStartIndex !== -1) {
                        let braceCount = 0;
                        let jsonEndIndex = -1;

                        for (let i = jsonStartIndex; i < response.length; i++) {
                            if (response[i] === '{') braceCount++;
                            else if (response[i] === '}') braceCount--;

                            if (braceCount === 0) {
                                jsonEndIndex = i;
                                break;
                            }
                        }

                        if (jsonEndIndex !== -1) {
                            // Extrair conteúdo após o JSON
                            textContent = response.substring(jsonEndIndex + 1).trim();

                            // Se tem conteúdo textual após o JSON, exibir o texto ao invés do JSON
                            if (textContent && textContent.length > 50) {
                                // Remover possíveis artefatos de formatação
                                textContent = textContent
                                    .replace(/^---\s*/, '')
                                    .replace(/^\s*```\s*/, '')
                                    .trim();

                                const aiMsg: Message = {
                                    id: (Date.now() + 1).toString(),
                                    role: "assistant",
                                    content: textContent
                                };
                                setMessages(prev => [...prev, aiMsg]);

                                if (userId && sessionId) {
                                    saveChatMessage(userId, sessionId, 'assistant', textContent).catch(console.error);
                                }
                                setIsLoading(false);
                                return;
                            }
                        }
                    }
                }

                // Encontrar primeiro { ou [ que indica início de JSON
                const jsonStartBrace = response.indexOf('{');
                const jsonStartBracket = response.indexOf('[');
                let jsonStart = -1;

                if (jsonStartBrace !== -1 && jsonStartBracket !== -1) {
                    jsonStart = Math.min(jsonStartBrace, jsonStartBracket);
                } else if (jsonStartBrace !== -1) {
                    jsonStart = jsonStartBrace;
                } else if (jsonStartBracket !== -1) {
                    jsonStart = jsonStartBracket;
                }

                if (jsonStart > 0) {
                    jsonString = response.substring(jsonStart);
                }

                // Remover caracteres após o último } ou ]
                const lastBrace = jsonString.lastIndexOf('}');
                const lastBracket = jsonString.lastIndexOf(']');
                const jsonEnd = Math.max(lastBrace, lastBracket);

                if (jsonEnd !== -1 && jsonEnd < jsonString.length - 1) {
                    // Guardar texto após o JSON para possível exibição
                    textContent = jsonString.substring(jsonEnd + 1).trim();
                    jsonString = jsonString.substring(0, jsonEnd + 1);
                }

                console.log("🔍 Tentando parse de JSON:", jsonString.substring(0, 100) + "...");
                let parsed = JSON.parse(jsonString);

                // Se n8n retornar um array (comum em 'All Incoming Items'), pega o primeiro item
                if (Array.isArray(parsed) && parsed.length > 0) {
                    parsed = parsed[0];
                }

                // DETECTAR RESPOSTA DE ROTEAMENTO N8N (tem intent, route, entities, etc.)
                if (parsed.intent || parsed.route || parsed.entities) {
                    // Esta é uma resposta de roteamento, não o conteúdo real
                    // Verificar se tem content_from_memory ou original_question
                    const displayContent = parsed.content_from_memory ||
                        parsed.original_question ||
                        textContent ||
                        'Processando sua solicitação...';

                    // Se tiver texto após o JSON, mostrar esse texto
                    if (textContent && textContent.length > 20) {
                        const aiMsg: Message = {
                            id: (Date.now() + 1).toString(),
                            role: "assistant",
                            content: textContent
                        };
                        setMessages(prev => [...prev, aiMsg]);

                        if (userId && sessionId) {
                            saveChatMessage(userId, sessionId, 'assistant', textContent).catch(console.error);
                        }
                        setIsLoading(false);
                        return;
                    }
                }

                // VERIFICAR SE É RESPOSTA DE AJUDA (exibir como texto simples)
                const isHelpResponse = parsed?.plan?.type === 'ajuda' ||
                    parsed?.plan?.status === 'instrucao' ||
                    parsed?.type === 'ajuda';

                if (isHelpResponse) {
                    const helpMessage = parsed?.plan?.mensagem ||
                        parsed?.mensagem ||
                        'Para criar uma campanha eficaz, selecione produtos das 3 curvas (A, B e C) e clique em Gerar Campanha.';

                    const aiMsg: Message = {
                        id: (Date.now() + 1).toString(),
                        role: "assistant",
                        content: `💡 **Dica:**\n\n${helpMessage}`
                    };
                    setMessages(prev => [...prev, aiMsg]);

                    if (userId && sessionId) {
                        saveChatMessage(userId, sessionId, 'assistant', helpMessage).catch(console.error);
                    }
                    setIsLoading(false);
                    return;
                }

                if (parsed.type === 'campaign_plan' && parsed.plan) {
                    // Validar que plan tem estrutura correta para StrategicPlanCard
                    const validStatuses = ['aprovado', 'ajuste_recomendado', 'ajuste_necessario'];
                    if (!validStatuses.includes(parsed.plan.status)) {
                        // Status inválido - exibir como texto
                        throw new Error('Invalid plan status for StrategicPlanCard');
                    }

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

                // VERIFICAR SE É CAMPANHA COM CHANNELS (ativos finais)
                if (parsed.channels && Object.keys(parsed.channels).length > 0) {
                    const aiMsg: Message = {
                        id: (Date.now() + 1).toString(),
                        role: "assistant",
                        content: "Campanha gerada com sucesso! Veja os materiais abaixo:",
                        type: 'campaign',
                        campaignData: { campaign: parsed, products: [] }
                    };
                    setMessages(prev => [...prev, aiMsg]);

                    if (userId && sessionId) {
                        saveChatMessage(userId, sessionId, 'assistant', 'Campanha gerada com materiais').catch(console.error);
                    }
                    setIsLoading(false);
                    return;
                }
            } catch (e) {
                // Não é JSON ou tem estrutura inválida, continua como texto normal
                console.log("⚠️ Parse JSON falhou, usando resposta como texto:", e);
            }

            // LÓGICA FINAL: Se a resposta começa com JSON de roteamento, extrair apenas o texto
            let finalContent = response;

            // Detectar padrão: json {...} seguido de texto OU {...} seguido de texto
            const jsonMatch = response.match(/^(json\s*)?\{[\s\S]*?\}([\s\S]*)/i);
            if (jsonMatch && jsonMatch[2]) {
                const textAfterJson = jsonMatch[2].trim();
                if (textAfterJson.length > 10) {
                    // Usar o texto após o JSON
                    finalContent = textAfterJson;
                    console.log("✅ Extraído texto após JSON:", finalContent.substring(0, 100) + "...");
                }
            }

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: finalContent
            };
            setMessages(prev => [...prev, aiMsg]);

            // Salva resposta da IA no banco (não bloqueia a UI)
            if (userId && sessionId) {
                saveChatMessage(userId, sessionId, 'assistant', finalContent).catch(console.error);
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

            // Chama generateCampaign com os produtos do plano e contexto de aprovação
            const result = await generateCampaign(productIds, {
                action: 'generate',
                context: 'aprovado'
            });
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
            "flex flex-col overflow-hidden",
            fullPage
                ? "w-full h-full absolute inset-0"
                : "h-full"
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
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </Button>
                    </div>
                </div>
            )}

            {/* Messages Area */}
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
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex gap-3 max-w-[80%]",
                                        msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden",
                                        msg.role === "assistant" ? "bg-blue-500/20 text-blue-400" : "bg-accent text-foreground"
                                    )}>
                                        {msg.role === "assistant" ? (
                                            <Bot size={18} />
                                        ) : userAvatar ? (
                                            <img
                                                src={userAvatar}
                                                alt="Avatar"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <User size={18} />
                                        )}
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
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        p: ({ children }) => <p className="mb-2 last:mb-0 text-foreground leading-relaxed">{children}</p>,
                                                        strong: ({ children }) => <span className="font-semibold text-blue-500">{children}</span>,
                                                        ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1 text-foreground">{children}</ul>,
                                                        ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1 text-foreground">{children}</ol>,
                                                        li: ({ children }) => <li>{children}</li>,
                                                        table: ({ children }) => <div className="overflow-x-auto my-2 border rounded-lg"><table className="min-w-full divide-y divide-border">{children}</table></div>,
                                                        thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
                                                        tbody: ({ children }) => <tbody className="divide-y divide-border bg-card">{children}</tbody>,
                                                        tr: ({ children }) => <tr className="hover:bg-muted/30 transition-colors">{children}</tr>,
                                                        th: ({ children }) => <th className="px-3 py-1.5 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">{children}</th>,
                                                        td: ({ children }) => <td className="px-3 py-1.5 text-xs text-foreground align-middle">{children}</td>,
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
            <div className="shrink-0 px-3 sm:px-4 md:px-8 lg:px-16 py-3 sm:py-4 border-t border-border/50 bg-background/80 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto">
                    {/* Quick Actions */}
                    {messages.length <= 1 && !isLoading && (
                        <div className="flex flex-wrap gap-2 mb-3 justify-center">
                            {[
                                { emoji: "📦", text: "Qual o estoque de cimento?" },
                                { emoji: "💰", text: "Qual o valor da argamassa?" },
                                { emoji: "🎯", text: "Como criar uma campanha?" },
                                { emoji: "🛒", text: "Ajuda com pedido de compras" },
                                { emoji: "🔥", text: "Como fazer queima de estoque?" },
                            ].map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSendMessage(`${action.text}`)}
                                    className="px-3 py-1.5 text-xs rounded-full border border-border bg-accent hover:bg-accent/80 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                                >
                                    <span>{action.emoji}</span>
                                    <span>{action.text}</span>
                                </button>
                            ))}
                        </div>
                    )}
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
