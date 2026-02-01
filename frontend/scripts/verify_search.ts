
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function verify() {
    const { tools } = await import('../lib/ai/tools');

    console.log("Testing search for 'cabo flexivel'...");
    const result = await generateText({
        model: google('gemini-2.5-pro') as any,
        tools: tools,
        system: 'Você é um assistente de busca.',
        prompt: "Tem cabo flexivel?"
    });

    console.log("Response:", result.text);
    if (result.text.toLowerCase().includes("não encontrei") && result.text.length < 100) {
        console.log("FAIL: Still not found.");
    } else {
        console.log("SUCCESS: Found items.");
    }
}

verify();
