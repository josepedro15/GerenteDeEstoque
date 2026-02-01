
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // Try to load from .env.local

async function testModel(modelId: string) {
    console.log(`Testing model: ${modelId}...`);
    try {
        const { text } = await generateText({
            model: google(modelId),
            prompt: 'Say "Hello World" if you can hear me.',
        });
        console.log(`[SUCCESS] ${modelId} replied: ${text}`);
        return true;
    } catch (error: any) {
        console.error(`[FAILED] ${modelId}: ${error.message}`);
        return false;
    }
}

async function run() {
    console.log("Checking API Key...");
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        console.error("Error: GOOGLE_GENERATIVE_AI_API_KEY not found in environment.");
    }

    // Models to test
    const models = ['gemini-2.5-pro', 'gemini-3-pro-preview', 'gemini-3-pro'];

    for (const model of models) {
        await testModel(model);
    }
}

run();
