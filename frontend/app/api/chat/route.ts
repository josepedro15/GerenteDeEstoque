// @ts-nocheck
import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { getStockAnalysis } from '@/app/actions/inventory';

export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();
        const lastMessage = messages[messages.length - 1];

        // Ensure Webhook URL is available
        const webhookUrl = process.env.N8N_CHAT_WEBHOOK;
        if (!webhookUrl) {
            return new Response("Configuração de Webhook ausente (N8N_CHAT_WEBHOOK)", { status: 500 });
        }

        // Call N8N Webhook
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chatInput: lastMessage.content,
                messages: messages, // Send full history if N8N needs it
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return new Response(`Erro no N8N: ${errorText}`, { status: response.status });
        }

        // Assuming N8N returns the answer directly as JSON or Text
        // If N8N returns { "output": "Hello" }
        const data = await response.json();

        // Extract the text response. Adjust based on your actual N8N output node.
        // Common patterns: data.output, data.text, or just data[0].output
        const reply = data.output || data.text || data.message || JSON.stringify(data);

        return new Response(reply);

    } catch (error) {
        console.error("Chat Error:", error);
        return new Response("Erro interno no processamento do chat.", { status: 500 });
    }
}
