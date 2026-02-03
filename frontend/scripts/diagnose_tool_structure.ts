import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Mock tool to simulate the real one without DB dependency if needed, 
// OR import the real one if possible. 
// For diagnosis, we want to use the REAL tool to see the REAL return value logic 
// but we can't easily import 'tools.ts' because it depends on 'ai' and 'supabase-js' and 'process.env'.
// Instead, let's define a tool that mimics the return structure EXACTLY as tools.ts does.

const tools = {
    analyzeStock: {
        description: 'Analisar o estoque',
        parameters: z.object({
            filterType: z.string(),
            filterValue: z.string().optional(),
        }),
        execute: async ({ filterType, filterValue }: any) => {
            console.log(`[MOCK TOOL] Executing with ${filterType}, ${filterValue}`);
            // Simulate a successful DB hit:
            return {
                count: 1,
                items: [{
                    id: 123,
                    produto: "Cimento CP II 50kg - TESTE",
                    quantidade: 50,
                    status: "Normal",
                    abc: "A",
                    preco: 29.90
                }]
            };
        },
    },
};

const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY || "",
});

async function runTest() {
    const prompt = "Qual o estoque de cimento?";

    console.log("Iniciando requisição de DIAGNÓSTICO...");
    try {
        const result = await generateText({
            model: google('gemini-2.5-pro'),
            prompt: prompt,
            tools: tools,
            maxSteps: 5,
        } as any);

        console.log("\n--- RESULTADO COMPLETO (JSON) ---");
        console.log(JSON.stringify(result, null, 2));

        console.log("\n--- TOOL RESULTS ---");
        // @ts-ignore
        if (result.toolResults) {
            // @ts-ignore
            console.log(JSON.stringify(result.toolResults, null, 2));
        } else {
            console.log("result.toolResults is UNDEFINED");
        }

        console.log("\n--- STEPS ---");
        if (result.steps) {
            console.log(JSON.stringify(result.steps, null, 2));
        }

    } catch (error) {
        console.error("Erro:", error);
    }
}

runTest();
