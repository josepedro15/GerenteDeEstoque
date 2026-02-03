
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Setup Google AI
const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY || "",
});

const models = [
    'gemini-3-pro-preview',
    'gemini-3-flash-preview',
    'gemini-2.5-flash'
];

async function verifyModels() {
    console.log("Verificando modelos disponíveis...");

    for (const modelName of models) {
        process.stdout.write(`Testing ${modelName}... `);
        try {
            const result = await generateText({
                model: google(modelName) as any,
                prompt: "Hi",
            });
            console.log(`✅ OK`);
        } catch (error: any) {
            console.log(`❌ FALHOU`);
            console.log(`   Erro: ${error.message.split('\n')[0]}`); // First line only
        }
    }
}

verifyModels();
