'use server';

import { logger } from "@/lib/logger";

const NANOBANANA_API_KEY = process.env.NANOBANANA_API_KEY || '';

export async function generateMarketingImage(prompt: string, type: 'instagram' | 'pdv'): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    if (!NANOBANANA_API_KEY) {
        if (!process.env.GEMINI_API_KEY) {
            return { success: false, error: "API Key not configured (NANOBANANA_API_KEY or GEMINI_API_KEY)." };
        }
    }

    const apiKey = NANOBANANA_API_KEY || process.env.GEMINI_API_KEY;

    try {
        let finalPrompt = prompt;
        if (type === 'instagram') {
            finalPrompt = `Generate a high-quality Instagram social media post image: ${prompt}. Photorealistic, professional lighting.`;
        } else if (type === 'pdv') {
            finalPrompt = `Generate a high-quality retail poster image: ${prompt}. Clear clear, professional graphic design, suitable for printing.`;
        }

        const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: finalPrompt }
                    ]
                }],
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Gemini API Error: ${err}`);
        }

        const data = await response.json();

        const part = data.candidates?.[0]?.content?.parts?.[0];
        const possibleImage = part?.inline_data?.data || part?.inlineData?.data || part?.text;

        if (possibleImage) {
            if (part?.inline_data || part?.inlineData) {
                const mime = (part?.inline_data || part?.inlineData).mime_type || (part?.inline_data || part?.inlineData).mimeType || 'image/png';
                return { success: true, imageUrl: `data:${mime};base64,${possibleImage}` };
            }
            if (typeof possibleImage === 'string' && possibleImage.startsWith('http')) {
                return { success: true, imageUrl: possibleImage };
            }
        }

        return { success: false, error: "Image data not found in response." };

    } catch (e: unknown) {
        const err = e instanceof Error ? e : new Error(String(e));
        logger.error("Image generation error:", err);
        return { success: false, error: err.message };
    }
}
