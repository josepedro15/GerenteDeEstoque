"use server";

import { createClient } from "@/utils/supabase/server";
import { enforceRateLimit } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

// Tipo para mensagens do histórico
interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
}

// Versão COM memória - recebe histórico de conversa
export async function sendMessage(
    message: string,
    conversationHistory: ConversationMessage[] = [],
    product_data?: any
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || "anonymous";

        // Apply rate limiting
        try {
            enforceRateLimit('chat', userId);
        } catch (rateLimitError: any) {
            return `Erro: ${rateLimitError.message}`;
        }

        const { generateText } = await import('ai');
        const { getGeminiModel, fallbackModels } = await import('@/lib/gemini');
        const { tools } = await import('@/app/api/chat/tools');

        const { systemPrompt } = await import('@/app/actions/systemPrompt');

        const msg = message.trim().toLowerCase();

        // Confirmação "usar os 3 primeiros": extrair link da última resposta do assistente e devolver o link de campanha
        const intentConfirmarTres = /pode\s+ser\s+os\s+3|usar\s+os\s+3\s+sugeridos|sim,?\s+os\s+3|os\s+3\s+primeiros|quero\s+os\s+3\s+primeiros|pode\s+ser\s+os\s+três|os\s+três\s+primeiros/i.test(msg);
        if (intentConfirmarTres && conversationHistory.length > 0) {
            const lastAssistant = [...conversationHistory].reverse().find(m => m.role === 'assistant');
            const content = lastAssistant?.content || '';
            const match = content.match(/\/marketing\/new\?productIds=([^)\s"'\]]+)/);
            if (match && match[1]) {
                const productIdsParam = decodeURIComponent(match[1].replace(/&.*$/, ''));
                const campaignUrl = `/marketing/new?productIds=${encodeURIComponent(productIdsParam)}`;
                return `Beleza! **[Clique aqui para abrir a campanha com os 3 produtos](${campaignUrl})** — você será redirecionado à página de campanhas e a produção já começará com eles.`;
            }
        }

        // Intenção clara: servidor escolhe o filtro e chama a ferramenta direto (sem depender do modelo)
        const intentPromo = /indique|indica|me d[eê]|quero\s+(ver\s+)?(os\s+)?(3\s+)?(produtos?|itens?)|(3\s+)?produtos?\s+para\s+(fazer\s+)?(uma\s+)?promoção|produtos?\s+para\s+promoção|itens?\s+para\s+liquidação|liquidação|colocar\s+em\s+promo/i.test(msg);
        const intentFalta = /o\s+que\s+est[aá]\s+em\s+falta|o\s+que\s+(preciso\s+)?repor|o\s+que\s+comprar|itens?\s+em\s+falta|estoque\s+em\s+falta|o\s+que\s+falta|reporem|em\s+ruptura/i.test(msg);

        if (intentPromo || intentFalta) {
            const filterType = intentPromo ? 'excess_promo' : 'low_stock';
            try {
                const toolResult = await (tools as any).analyzeStock.execute({ filterType });
                if (toolResult?.error) {
                    return `Erro ao consultar estoque: ${toolResult.error}`;
                }
                if (!toolResult?.items?.length) {
                    if (intentPromo) {
                        return 'Nenhum item em **excesso** de estoque encontrado no momento para promoção. Os itens disponíveis estão em nível crítico ou normal. Quer que eu consulte o estoque geral ou itens em falta?';
                    }
                    return toolResult?.message || 'Nenhum item encontrado com os critérios fornecidos.';
                }
                const statusStr = (s: unknown) => (s != null ? String(s) : '');
                let displayItems = intentPromo
                    ? toolResult.items.filter((item: any) => {
                        const s = statusStr(item.status).toLowerCase();
                        return !s.includes('crítico') && !s.includes('ruptura');
                    })
                    : toolResult.items;
                if (intentPromo && displayItems.length === 0) {
                    return 'Nenhum item em **excesso** de estoque encontrado no momento para promoção. Quer que eu consulte o estoque geral?';
                }
                const tableHeader = `| SKU | Produto | Estoque | Preço |\n|:---:|:---|:---|---:|`;
                const tableRows = displayItems.slice(0, 10).map((item: any) =>
                    `| **${item.id}** | ${item.produto} | ${item.quantidade} un ${item.status} | R$ ${item.preco} |`
                ).join('\n');
                const hiddenContext = toolResult.items.map((item: any) =>
                    `[DADOS INTERNOS - NÃO EXIBIR]\n PRODUTO: ${item.produto} (ID: ${item.id})\n Custo: R$ ${item.custo ?? '?'} | Margem: ${item.margem ?? '?'}% | Cobertura: ${item.dias_cobertura ?? '?'} dias`
                ).join('\n\n');
                if (intentPromo) {
                    const topIds = displayItems.slice(0, 3).map((i: any) => i.id).join(',');
                    const campaignUrl = `/marketing/new?productIds=${encodeURIComponent(topIds)}`;
                    return `Estes produtos estão em **excesso de estoque**, ideais para promoção (liberam capital parado):\n\n${tableHeader}\n${tableRows}\n\nPosso usar os **3 primeiros** da lista para a campanha, ou você prefere escolher outros?\n\n• **[Usar os 3 sugeridos](${campaignUrl})** — redireciona à página de campanhas e inicia com eles.\n• **Outros da lista acima** — diga os SKUs ou nomes (ex.: "quero o 4721 e o 15231").\n• **Montar sua lista** — peça para eu listar mais opções do estoque ou indique produtos específicos.\n\nComo prefere?\n\n<!--\n${hiddenContext}\n-->`;
                }
                return `Estes itens estão em falta ou com estoque crítico:\n\n${tableHeader}\n${tableRows}\n\n<!--\n${hiddenContext}\n-->`;
            } catch (e: any) {
                logger.error("Chat intent direct tool call:", e);
            }
            // Se a chamada direta falhar, segue para o modelo
        }

        let lastError;
        let finalResult;
        const errorLog: string[] = [];

        console.log("[Chat Action] Fallback Models Loaded:", fallbackModels);
        console.log("[Chat Action] API Key Check:", !!process.env.GOOGLE_GENERATIVE_AI_API_KEY || !!process.env.GOOGLE_API_KEY);
        console.log(`[Chat Action]Histórico recebido: ${conversationHistory.length} mensagens`);

        for (const modelName of fallbackModels) {
            try {
                console.log(`[Chat Action] Tentando modelo: ${modelName} `);

                // MEMÓRIA: Usa histórico passado + mensagem atual
                // Filtra mensagens de boas-vindas/sistema e limita a últimas 10
                const filteredHistory = conversationHistory
                    .filter(m => {
                        if (!m.content || typeof m.content !== 'string') return false;
                        if (m.content.includes('Conversa limpa!')) return false;
                        if (m.content.includes('Como posso ajudar')) return false;
                        return m.content.trim().length > 0;
                    })
                    .slice(-10); // Apenas últimas 10 mensagens

                const messagesWithHistory = [
                    ...filteredHistory.map(m => ({
                        role: m.role as 'user' | 'assistant',
                        content: m.content
                    })),
                    { role: 'user' as const, content: message }
                ];

                console.log(`[Chat Action] Enviando ${messagesWithHistory.length} mensagens para o modelo`);

                const isDashboardAnalysis = typeof message === 'string' && message.includes('Analise os dados do DASHBOARD') && message.includes('não chame ferramentas');
                const toolsToUse = isDashboardAnalysis ? {} : (tools as any);

                const result = await generateText({
                    model: getGeminiModel(modelName) as any,
                    system: systemPrompt,
                    messages: messagesWithHistory,
                    tools: toolsToUse,
                    maxSteps: isDashboardAnalysis ? 1 : 10,
                } as any);

                if (result.text && result.text.length > 0) {
                    finalResult = result.text;
                    break; // Success
                }

                // Fallback: Se não gerou texto mas usou ferramentas, tentar recuperar o resultado da tool
                if (result.finishReason === 'tool-calls' && result.steps && result.steps.length > 0) {
                    console.warn(`[Chat Action] Modelo ${modelName} parou em 'tool-calls' sem texto.Tentando recuperar último resultado de tool.`);

                    // Procurar no histórico de passos por resultados de ferramentas
                    for (let i = result.steps.length - 1; i >= 0; i--) {
                        const step = result.steps[i];
                        // @ts-ignore
                        if (step.toolResults && step.toolResults.length > 0) {
                            // @ts-ignore
                            // A propriedade correta na SDK AI 3.x/4.x costuma ser 'result', mas vamos garantir
                            const toolResObj = step.toolResults[0] as any;
                            const toolOutput = toolResObj.result || toolResObj.output || toolResObj;

                            console.log(`[Chat Action] Resultado recuperado do step ${i}: `, JSON.stringify(toolOutput));

                            if (toolOutput) {
                                // Tentar formatar melhor se for o formato conhecido count/items
                                if (toolOutput.items && Array.isArray(toolOutput.items)) {
                                    const filterType = toolOutput.filterType as string | undefined;
                                    const userAskedForPromo = /promoção|liquidação|fazer uma promo|produtos para promo|itens para promo|colocar em promo/i.test(message);
                                    const treatAsPromo = filterType === 'excess_promo' || userAskedForPromo;

                                    const statusStr = (s: unknown) => (s != null ? String(s) : '');
                                    let displayItems = toolOutput.items;
                                    if (treatAsPromo) {
                                        displayItems = toolOutput.items.filter((item: any) => {
                                            const s = statusStr(item.status).toLowerCase();
                                            return !s.includes('crítico') && !s.includes('ruptura');
                                        });
                                        if (displayItems.length === 0 && userAskedForPromo) {
                                            try {
                                                const excessResult = await (tools as any).analyzeStock.execute({ filterType: 'excess_promo' });
                                                if (excessResult?.items?.length > 0) {
                                                    displayItems = excessResult.items;
                                                } else {
                                                    finalResult = 'Nenhum item em **excesso** de estoque encontrado no momento para promoção. Os itens disponíveis estão em nível crítico ou normal. Quer que eu consulte o estoque geral ou itens em falta?';
                                                    break;
                                                }
                                            } catch (_) {
                                                finalResult = 'Nenhum item em **excesso** de estoque encontrado no momento para promoção. Quer que eu consulte o estoque geral?';
                                                break;
                                            }
                                        } else if (displayItems.length === 0) {
                                            finalResult = 'Nenhum item em **excesso** de estoque encontrado no momento para promoção.';
                                            break;
                                        }
                                    }
                                    const tableHeader = `| SKU | Produto | Estoque | Preço |\n|:---:|:---|:---|---:|`;
                                    const tableRows = displayItems.slice(0, 10).map((item: any) =>
                                        `| **${item.id}** | ${item.produto} | ${item.quantidade} un ${item.status} | R$ ${item.preco} |`
                                    ).join('\n');

                                    let prefix = 'Dados encontrados:\n\n';
                                    let suffix = '';
                                    if (treatAsPromo) {
                                        prefix = 'Estes produtos estão em **excesso de estoque**, ideais para promoção (liberam capital parado):\n\n';
                                        const topIds = displayItems.slice(0, 3).map((i: any) => i.id).join(',');
                                        const campaignUrl = `/marketing/new?productIds=${encodeURIComponent(topIds)}`;
                                        suffix = `\n\nPosso usar os **3 primeiros** da lista para a campanha, ou você prefere escolher outros?\n\n• **Usar os 3 sugeridos** — [clique aqui](${campaignUrl}) para ir à página de campanhas com eles.\n• **Outros da lista** — diga os SKUs ou nomes.\n• **Montar sua lista** — peça mais opções do estoque ou indique produtos específicos.\n\nComo prefere?`;
                                    } else if (filterType === 'low_stock') {
                                        prefix = 'Estes itens estão em falta ou com estoque crítico:\n\n';
                                    }

                                    // Contexto Oculto Rico para a IA (Dados Financeiros e Logísticos)
                                    const hiddenContext = toolOutput.items.map((item: any) =>
                                        `[DADOS INTERNOS DO SISTEMA - NÃO EXIBIR NA TABELA, USAR APENAS PARA RESPOSTAS]
                                         PRODUTO: ${item.produto} (ID: ${item.id})
                                         - Custo: R$ ${item.custo ?? '?'} | Margem: ${item.margem ?? '?'}% | Lucro 60d: R$ ${item.lucro_60d ?? '?'}
                                         - Giro Mensal: ${item.giro ?? '?'} | Cobertura: ${item.dias_cobertura ?? '?'} dias | Média/Dia: ${item.media_venda ?? '?'}
                                         - Sugestão Compra: ${item.sugestao_compra ?? '?'} | Tendência: ${item.tendencia ?? '?'}
                                         - Última Venda: ${item.ultimo_venda ?? '?'} | Valor Estoque Total: R$ ${item.valor_estoque ?? '?'}`
                                    ).join('\n\n');

                                    finalResult = `${prefix}${tableHeader}\n${tableRows}${suffix}\n\n<!--\n>>> CONTEXTO ESTRATÉGICO PARA O AGENTE <<<\n${hiddenContext}\n-->`;
                                } else if (toolOutput.message) {
                                    finalResult = toolOutput.message;
                                } else {
                                    finalResult = `Dados encontrados: ${JSON.stringify(toolOutput)} `;
                                }
                                break;
                            }
                        }
                    }

                    if (!finalResult) {
                        finalResult = "A ferramenta foi executada, mas não consegui processar o resultado automaticamente. Tente reformular a pergunta.";
                    }
                    break;
                }

                throw new Error(`Modelo retornou resposta vazia.FinishReason: ${result.finishReason} `);
            } catch (error: any) {
                const errorMsg = `[${modelName}]: ${error.message || String(error)} `;
                console.warn(`[Chat Action] Erro com modelo ${modelName}: `, error);
                errorLog.push(errorMsg);
                lastError = error;
            }
        }

        if (finalResult) {
            return finalResult;
        }

        const debugInfo = errorLog.length > 0 ? errorLog.join(' | ') : "Nenhum erro capturado, mas sem resultado.";
        throw lastError || new Error(`Falha Geral.Detalhes: ${debugInfo} `);

    } catch (error: any) {
        logger.error("Chat Action Error:", error);
        return `Erro Técnico: ${error.message || String(error)} `;
    }
}
