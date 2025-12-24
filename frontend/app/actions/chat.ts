"use server";

import { createClient } from "@/utils/supabase/server";
import { enforceRateLimit } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

export async function sendMessage(message: string, product_data?: any) {
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

        const webhookUrl = process.env.N8N_CHAT_WEBHOOK;
        logger.debug("Connecting to n8n...");
        logger.debug("Webhook URL:", webhookUrl);

        if (!webhookUrl) {
            logger.error("N8N_CHAT_WEBHOOK is undefined!");
            return "Erro: Configuração de chat ausente (ENV).";
        }

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                product_data: product_data,
                user_id: userId
            })
        });

        logger.debug("n8n Response Status:", response.status);

        if (!response.ok) {
            logger.error("n8n Error Text:", response.statusText);
            const text = await response.text();
            logger.error("n8n Error Body:", text);
            return `Erro no n8n (${response.status}): Tente novamente.`;
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            return data.output || data.text || JSON.stringify(data);
        } else {
            const text = await response.text();
            return text;
        }
    } catch (error: any) {
        logger.error("Chat Action Error:", error);
        return `Erro Técnico: ${error.message || String(error)}`;
    }
}
