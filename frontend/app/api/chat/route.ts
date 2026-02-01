import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY,
});
import { streamText, generateText } from 'ai';
import { tools } from '@/lib/ai/tools';
// Use 'supabaseAdmin' for server-side writes to bypass RLS
import { supabaseAdmin } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { getUpcomingSeasonality } from '@/lib/seasonality';

export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { messages: rawMessages, userId, sessionId } = await req.json();

        // Sanitize messages to standard CoreMessage format (role, content)
        // Filter out messages with empty content (often tool calls from UI SDK) to prevent Gemini 500 error
        const messages = rawMessages
            .filter((m: any) => m.content && typeof m.content === 'string' && m.content.trim() !== "")
            .map((m: any) => ({
                role: m.role,
                content: m.content,
            }));

        console.log(`[Chat API] Received request. userId: '${userId}', sessionId: '${sessionId}', msgs: ${messages.length}`);

        // Get Seasonality Context
        const events = getUpcomingSeasonality();
        let sazonalidadeContext = "";

        const imminentEvents = events.filter(e => e.daysUntil <= 60);

        if (imminentEvents.length > 0) {
            const event = imminentEvents[0]; // Focus on the most immediate one
            sazonalidadeContext = `
            CONTEXTO DE MOMENTO (SAZONALIDADE):
            O evento "${event.name}" está chegando em ${event.daysUntil} dias.
            Descrição: ${event.description}.
            DICA: Se o usuário pedir sugestões de campanha ou análise de mix, USE essa informação para sugerir ações temáticas.
            `;
        }

        // 0. Save User Message immediately
        if (sessionId && userId) {
            console.log("[Chat API] Saving user message to DB...");
            const lastUserMessage = messages[messages.length - 1];
            if (lastUserMessage && lastUserMessage.role === 'user') {
                const { error: saveError } = await supabaseAdmin.from('chat_history').insert({
                    session_id: sessionId,
                    user_id: userId,
                    role: 'user',
                    content: lastUserMessage.content
                });
                if (saveError) console.error("[Chat API] User Save Error:", saveError);
                else console.log("[Chat API] User Save SUCCESS");
            }
        } else {
            console.warn("[Chat API] Skipping save: Missing sessionId or userId");
        }

        // 1. Initial Call to check for Tool Usage
        let initialResult = await generateText({
            model: google('gemini-2.5-pro') as any,
            messages,
            tools: tools,
            system: `Você é o Assistente IA do SmartOrders, operando com a arquitetura Gemini 2.5 Pro.
            ${sazonalidadeContext}
            OBJETIVO PRINCIPAL: Atuar como um especialista em Logística e Gestão de Estoque.
            REGRAS:
            - Se precisar de dados, chame a tool analyzeStock.
            - IMPORTANTE: Se a tool for chamada, eu (o sistema) vou te devolver os dados na próxima mensagem. Aguarde.
            `,
        });

        console.log(`[Chat API] Step 1 Finish Reason: ${initialResult.finishReason}`);
        console.log(`[Chat API] Step 1 ToolCalls: ${initialResult.toolCalls.length}`);

        // 2. Check if Tool was called
        if (initialResult.toolCalls.length > 0) {
            console.log("[Chat API] Tool detected. Executing manually...");

            const toolCall = initialResult.toolCalls[0]; // Handle first tool call
            let toolResultContent = "";

            if (toolCall.toolName === 'analyzeStock') {
                try {
                    const tc = toolCall as any;
                    const args = tc.args || tc.input || {};
                    console.log(`[Chat API] Executing analyzeStock with args:`, JSON.stringify(args));

                    // Direct invocation of the tool's execute function
                    // @ts-ignore
                    const result = await tools.analyzeStock.execute(args, { messages, toolCallId: toolCall.toolCallId });

                    toolResultContent = `SYSTEM: A ferramenta analyzeStock retornou: "${result}". Use isso para responder ao usuário agora.`;
                } catch (err: any) {
                    console.error("Tool Execution Error:", err);
                    toolResultContent = `SYSTEM: Erro ao executar ferramenta: ${err.message}`;
                }
            } else {
                toolResultContent = `SYSTEM: Tool ${toolCall.toolName} not supported in manual loop.`;
            }

            // 3. Re-Trigger with Data
            const newMessages: any[] = [
                ...messages,
                { role: 'assistant', content: initialResult.text || '' },
                { role: 'user', content: toolResultContent }
            ];

            console.log("[Chat API] Re-triggering model with tool data...");

            const finalResult = streamText({
                model: google('gemini-2.5-pro') as any,
                messages: newMessages,
                system: `Você é o Assistente IA do SmartOrders.
                DADOS FORNECIDOS PELO SISTEMA.
                AGORA: Analise os dados fornecidos na última mensagem e responda à pergunta original do usuário com precisão.
                ${sazonalidadeContext}`,
                onFinish: async ({ text }) => {
                    try {
                        if (sessionId && userId) {
                            console.log(`[Chat API] [Manual Retrigger] Saving assistant response... Session: ${sessionId}`);
                            const { error } = await supabaseAdmin.from('chat_history').insert({
                                session_id: sessionId, user_id: userId, role: 'assistant', content: text,
                                metadata: { method: 'manual_retrigger', toolCalls: initialResult.toolCalls }
                            });
                            if (error) console.error("[Chat API] [Manual Retrigger] Save ERROR:", error);
                            else console.log("[Chat API] [Manual Retrigger] Save SUCCESS.");
                        }
                    } catch (e) { console.error("[Chat API] [Manual Retrigger] Save EXCEPTION:", e); }
                }
            });

            return finalResult.toUIMessageStreamResponse();

        } else {
            console.log("[Chat API] No tool usage. Streaming response...");
            const finalResult = streamText({
                model: google('gemini-2.5-pro') as any,
                messages: messages,
                system: `Você é o Assistente IA do SmartOrders.
                ${sazonalidadeContext}`,
                onFinish: async ({ text }) => {
                    try {
                        if (sessionId && userId) {
                            console.log(`[Chat API] [Direct Stream] Saving assistant response... Session: ${sessionId}`);
                            const { error } = await supabaseAdmin.from('chat_history').insert({
                                session_id: sessionId, user_id: userId, role: 'assistant', content: text,
                                metadata: { method: 'direct_stream' }
                            });
                            if (error) console.error("[Chat API] [Direct Stream] Save ERROR:", error);
                            else console.log("[Chat API] [Direct Stream] Save SUCCESS.");
                        }
                    } catch (e) { console.error("[Chat API] [Direct Stream] Save EXCEPTION:", e); }
                }
            });
            return finalResult.toUIMessageStreamResponse();
        }

    } catch (e: any) {
        console.error("[Chat API Error]:", e);
        return new Response(JSON.stringify({ error: e.message || 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
