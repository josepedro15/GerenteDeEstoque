'use server';

import { logger } from "@/lib/logger";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

interface WhatsAppMessage {
    message: string;
    targetNumber?: string; // Optional, defaults to group/list
}

// UAZAPI Configuration
// UAZAPI Configuration (Evolution API Standard)
const UAZAPI_MEDIA_ENDPOINT_DEFAULT = 'https://atendsoft.uazapi.com/message/sendMedia';
const UAZAPI_TEXT_ENDPOINT_DEFAULT = 'https://atendsoft.uazapi.com/message/sendText';

const UAZAPI_MEDIA_ENDPOINT = process.env.UAZAPI_MEDIA_ENDPOINT || UAZAPI_MEDIA_ENDPOINT_DEFAULT;
const UAZAPI_TEXT_ENDPOINT = process.env.UAZAPI_TEXT_ENDPOINT || UAZAPI_TEXT_ENDPOINT_DEFAULT;
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN || '';
const MARKETING_GROUP_ID = process.env.MARKETING_GROUP_ID || '120363048596644262@g.us';

interface WhatsAppMessage {
    message: string;
    targetNumber?: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video' | 'document' | 'audio';
}

export async function sendToMarketingGroup({ message, targetNumber, mediaUrl, mediaType = 'image' }: WhatsAppMessage) {
    logger.info("Sending message to Marketing Group via WhatsApp (UAZAPI)...");

    if (!WHATSAPP_API_TOKEN) {
        logger.warn("WHATSAPP_API_TOKEN not configured. Logging message instead.");
        logger.info("MOCK SEND:", { message, mediaUrl });
        return { success: true, mock: true };
    }

    try {
        let endpoint = UAZAPI_TEXT_ENDPOINT;
        let body: any = {
            number: targetNumber || MARKETING_GROUP_ID,
            body: message
        };

        if (mediaUrl) {
            endpoint = UAZAPI_MEDIA_ENDPOINT;
            // UAZAPI Media Format: { number, type, file, body (caption) }
            body = {
                number: targetNumber || MARKETING_GROUP_ID,
                type: mediaType,
                file: mediaUrl,
                body: message // Use 'body' for caption based on common UAZAPI patterns (user JSON hinted at this)
            };
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'token': WHATSAPP_API_TOKEN // Token header
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.error("WhatsApp API Error:", errorText);
            throw new Error(`Failed to send WhatsApp message (${response.status})`);
        }

        const data = await response.json();
        logger.info("WhatsApp sent successfully:", data);

        // --- NEW: Log to Database ---
        try {
            const cookieStore = await cookies();
            const supabase = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    cookies: {
                        getAll() { return cookieStore.getAll() },
                        setAll(cookiesToSet: any) { try { cookiesToSet.forEach(({ name, value, options }: any) => cookieStore.set(name, value, options)) } catch { } }
                    }
                }
            );

            await supabase.from('historico_mensagens').insert({
                content: message,
                type: mediaUrl ? (mediaType || 'image') : 'text',
                media_url: mediaUrl || null,
                status: 'sent',
                channel: 'whatsapp',
                metadata: {
                    target: targetNumber || MARKETING_GROUP_ID,
                    api_response: data
                }
            });
        } catch (logError) {
            logger.error("Failed to log message history:", logError);
            // Don't fail the main action if logging fails
        }

        return { success: true, data };

    } catch (e: any) {
        logger.error("Error sending WhatsApp:", e);
        return { success: false, error: e.message };
    }
}
