
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
import { tools } from '@/lib/ai/tools';
import { getUpcomingSeasonality } from '@/lib/seasonality';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function verifySeasonality() {
    // Dynamic imports
    const { tools } = await import('../lib/ai/tools');
    const { getUpcomingSeasonality } = await import('../lib/seasonality');

    console.log("Checking seasonality...");
    const events = getUpcomingSeasonality();
    const imminent = events.filter(e => e.daysUntil <= 60);

    if (imminent.length > 0) {
        console.log(`Found event: ${imminent[0].name} in ${imminent[0].daysUntil} days.`);
    } else {
        console.log("No imminent events found (check date logic).");
    }

    // Since we can't easily spy on the remote API call's system prompt from here without mocking,
    // we will rely on the AI's response to a specific prompt.

    const prompt = "Quero criar uma campanha de vendas. O que você sugere?";
    console.log(`\nUser: "${prompt}"`);

    // Simulate the logic in route.ts
    let sazonalidadeContext = "";
    if (imminent.length > 0) {
        const event = imminent[0];
        sazonalidadeContext = `
            CONTEXTO DE MOMENTO (SAZONALIDADE):
            O evento "${event.name}" está chegando em ${event.daysUntil} dias.
            Descrição: ${event.description}.
            DICA: Se o usuário pedir sugestões de campanha ou análise de mix, USE essa informação para sugerir ações temáticas.
            `;
    }

    try {
        const result = await streamText({
            model: google('gemini-2.5-pro') as any,
            tools: tools,
            system: `Você é o Assistente IA do SmartOrders.
            ${sazonalidadeContext}`,
            prompt: prompt
        });

        let fullText = "";
        for await (const textPart of result.textStream) {
            fullText += textPart;
        }

        console.log(`\nAI Response: ${fullText}`);

        if (fullText.toLowerCase().includes("carnaval") || fullText.toLowerCase().includes(imminent[0]?.name.toLowerCase())) {
            console.log("SUCCESS: AI mentioned the seasonal event!");
        } else {
            console.log("WARNING: AI did not explicitly mention the event. Check response context.");
        }

    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

verifySeasonality();
