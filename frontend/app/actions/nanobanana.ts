'use server';

import { logger } from "@/lib/logger";

const NANOBANANA_API_KEY = process.env.NANOBANANA_API_KEY || '';

export async function generateMarketingImage(prompt: string, type: 'instagram' | 'pdv'): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    if (!NANOBANANA_API_KEY) {
        // Fallback to GEMINI_API_KEY if NANOBANANA_API_KEY is not set, assuming they might use the same key
        if (!process.env.GEMINI_API_KEY) {
            return { success: false, error: "API Key not configured (NANOBANANA_API_KEY or GEMINI_API_KEY)." };
        }
    }

    const apiKey = NANOBANANA_API_KEY || process.env.GEMINI_API_KEY;

    try {
        // Construct a richer prompt based on type
        let finalPrompt = prompt;
        if (type === 'instagram') {
            finalPrompt = `Generate a high-quality Instagram social media post image: ${prompt}. Photorealistic, professional lighting.`;
        } else if (type === 'pdv') {
            finalPrompt = `Generate a high-quality retail poster image: ${prompt}. Clear clear, professional graphic design, suitable for printing.`;
        }

        // Using the endpoint provided by the user from N8N
        // Using Gemini 3 Flash Preview
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
                // Add generation config if needed, e.g. for images
                // For native image generation models in Gemini API, it's often a different payload.
                // If the user's N8N works with: contents -> parts -> text, it implies the model returns an image in valid response.
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Gemini API Error: ${err}`);
        }

        const data = await response.json();

        // Parse response. 
        // If it's real image generation, it usually comes as inline_data or a signed uri.
        // If it's standard Gemini, it returns text.
        // Let's log it to debug if possible, but for now try to extract standard image fields.

        const part = data.candidates?.[0]?.content?.parts?.[0];
        const possibleImage = part?.inline_data?.data || part?.inlineData?.data || part?.text;

        if (possibleImage) {
            // If it's base64 (inline_data or inlineData)
            if (part?.inline_data || part?.inlineData) {
                const mime = (part?.inline_data || part?.inlineData).mime_type || (part?.inline_data || part?.inlineData).mimeType || 'image/png';
                return { success: true, imageUrl: `data:${mime};base64,${possibleImage}` };
            }
            // If text (maybe a URL?)
            if (possibleImage.startsWith('http')) {
                return { success: true, imageUrl: possibleImage };
            }
        }

        return { success: false, error: "Image data not found in response." };

    } catch (e: any) {
        logger.error("Image generation error:", e);
        return { success: false, error: e.message };
    }
}
