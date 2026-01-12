"use server";

import { logger } from "@/lib/logger";

interface ActionPlanPayload {
    action: string;
    alertType: string;
    alertLabel: string;
    totalQuantity: number;
    totalValue: number;
    message: string;
    user_id?: string;
}

const WEBHOOK_URL = "https://webhook.aiensed.com/webhook/estoque";

export async function sendActionPlanRequest(payload: ActionPlanPayload): Promise<{ success: boolean; message: string }> {
    try {
        logger.debug("Enviando para webhook de plano de ação:", payload);

        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        logger.debug("Resposta do webhook:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            logger.error("Erro no webhook:", errorText);
            return {
                success: false,
                message: `Erro ao enviar para o agente (${response.status})`
            };
        }

        // Tentar parsear resposta
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            return {
                success: true,
                message: data.output || data.text || "Plano de ação solicitado com sucesso!"
            };
        } else {
            const text = await response.text();
            return {
                success: true,
                message: text || "Plano de ação solicitado com sucesso!"
            };
        }
    } catch (error: any) {
        logger.error("Erro ao enviar plano de ação:", error);
        return {
            success: false,
            message: `Erro técnico: ${error.message || String(error)}`
        };
    }
}
