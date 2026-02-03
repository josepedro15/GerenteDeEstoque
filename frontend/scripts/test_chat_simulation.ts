
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Dynamic imports are handled inside runTest
import { generateText } from 'ai';

async function runTest() {
    console.log("🚀 Starting Debug of Chat Action Logic...");

    // Import modules AFTER dotenv config
    const { getGeminiModel, fallbackModels } = await import('../lib/gemini');
    const { tools } = await import('../app/api/chat/tools');

    console.log("Gemini API Key present:", !!process.env.GOOGLE_GENERATIVE_AI_API_KEY || !!process.env.GOOGLE_API_KEY);
    console.log("Fallback Models:", fallbackModels);

    const systemPrompt = `Você é um Especialista em Logística e Gerente de Estoque Inteligente.
    SUA MISSÃO:
    1.  Analisar o estoque com precisão.
    2.  Ao receber um pedido de "Análise de Compra", verificar itens com status "Ruptura" ou "Crítico".
    3.  SEMPRE use a ferramenta 'analyzeStock' para buscar dados reais.
    `;

    for (const modelName of fallbackModels) {
        try {
            console.log(`\n--------------------------------------------`);
            console.log(`[DEBUG] Tentando modelo: ${modelName}`);

            const result = await generateText({
                model: getGeminiModel(modelName) as any,
                system: systemPrompt,
                prompt: "Qual o valor da argamassa?",
                tools: tools as any,
                maxSteps: 5,
            } as any);

            console.log(`✅ SUCCESS with ${modelName}`);
            console.log("FULL RESULT DUMP:", JSON.stringify(result, null, 2));
            return;
        } catch (error: any) {
            console.error(`❌ FAILED with ${modelName}:`, error.message);
            // Print full error if it has more details
            if (error.response) console.error("Response:", error.response);
        }
    }
    console.error("❌ ALL MODELS FAILED in debug script.");
}

runTest();
