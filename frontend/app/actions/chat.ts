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

        // const systemPrompt = ... (removed inline prompt)

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

                const result = await generateText({
                    model: getGeminiModel(modelName) as any,
                    system: systemPrompt,
                    messages: messagesWithHistory,
                    tools: tools as any,
                    maxSteps: 10,
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
                                    const tableHeader = `| SKU | Produto | Estoque | Preço |\n|:---:|:---|:---|---:|`;
                                    const tableRows = toolOutput.items.map((item: any) =>
                                        `| **${item.id}** | ${item.produto} | ${item.quantidade} un ${item.status} | R$ ${item.preco} |`
                                    ).join('\n');

                                    // Contexto Oculto Rico para a IA (Dados Financeiros e Logísticos)
                                    const hiddenContext = toolOutput.items.map((item: any) =>
                                        `[DADOS INTERNOS DO SISTEMA - NÃO EXIBIR NA TABELA, USAR APENAS PARA RESPOSTAS]
                                         PRODUTO: ${item.produto} (ID: ${item.id})
                                         - Custo: R$ ${item.custo ?? '?'} | Margem: ${item.margem ?? '?'}% | Lucro 60d: R$ ${item.lucro_60d ?? '?'}
                                         - Giro Mensal: ${item.giro ?? '?'} | Cobertura: ${item.dias_cobertura ?? '?'} dias | Média/Dia: ${item.media_venda ?? '?'}
                                         - Sugestão Compra: ${item.sugestao_compra ?? '?'} | Tendência: ${item.tendencia ?? '?'}
                                         - Última Venda: ${item.ultimo_venda ?? '?'} | Valor Estoque Total: R$ ${item.valor_estoque ?? '?'}`
                                    ).join('\n\n');

                                    finalResult = `Encontrei os seguintes dados:\n\n${tableHeader}\n${tableRows}\n\n<!--\n>>> CONTEXTO ESTRATÉGICO PARA O AGENTE <<<\n${hiddenContext}\n-->`;
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
