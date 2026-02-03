
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Setup Google AI
const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY || "",
});

async function runTest() {
    const prompt = "Hello, are you Gemini 3?";
    console.log("Testing model: gemini-3-pro-preview");

    try {
        const result = await generateText({
            model: google('gemini-3-pro-preview') as any,
            prompt: prompt,
        });

        console.log("--- SUCCESS ---");
        console.log(result.text);
    } catch (error: any) {
        console.error("--- ERROR ---");
        console.error(error.message);
    }
}

runTest();
