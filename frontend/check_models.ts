
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import dotenv from 'dotenv';
import path from 'path';

// Load env from current dir or parent
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '../.env.local' });

async function testModel(modelId: string) {
    console.log(`Testing model: ${modelId}...`);
    try {
        const { text } = await generateText({
            model: google(modelId),
            prompt: 'Say "Hello" and nothing else.',
        });
        console.log(`[SUCCESS] ${modelId} replied: ${text}`);
        return true;
    } catch (error: any) {
        console.log(`[FAILED] ${modelId}: ${error.message}`);
        return false;
    }
}

async function run() {
    console.log("Checking API Key...");
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        console.log("Error: GOOGLE_GENERATIVE_AI_API_KEY not found in environment.");
    } else {
        console.log("API Key found.");
    }

    // Models to test
    const models = ['gemini-2.5-pro', 'gemini-3-pro-preview', 'gemini-3-pro', 'gemini-2.0-flash-exp'];

    for (const model of models) {
        await testModel(model);
    }
}

run();
