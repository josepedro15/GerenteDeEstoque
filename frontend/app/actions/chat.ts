"use server";

import { createClient } from "@/utils/supabase/server";

export async function sendMessage(message: string, product_data?: any) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const webhookUrl = process.env.N8N_CHAT_WEBHOOK;
        console.log("DEBUG: Connecting to n8n...");
        console.log("DEBUG: Webhook URL:", webhookUrl);

        if (!webhookUrl) {
            console.error("DEBUG: N8N_CHAT_WEBHOOK is undefined!");
            return "Erro: Configuração de chat ausente (ENV).";
        }

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                product_data: product_data,
                user_id: user?.id || "anonymous"
            })
        });

        console.log("DEBUG: n8n Response Status:", response.status);

        if (!response.ok) {
            console.error("DEBUG: n8n Error Text:", response.statusText);
            const text = await response.text();
            console.error("DEBUG: n8n Error Body:", text);
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
        console.error("Chat Action Error:", error);
        return `Erro Técnico: ${error.message || String(error)}`;
    }
}
