
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Setup Google AI
const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY || "",
});

async function runTest() {
    const prompt = `
Atue como um Especialista em Estoque. Realize uma análise técnica detalhada dos seguintes 10 produtos:
* 		undefined (SKU: 12842): Estoque 1 un, ABC A, CRÍTICO
* 		undefined (SKU: 2132): Estoque 1 un, ABC A, CRÍTICO
* 		undefined (SKU: 13571): Estoque 12 un, ABC A, CRÍTICO
* 		undefined (SKU: 6270): Estoque 1 un, ABC B, CRÍTICO
* 		undefined (SKU: 14680): Estoque 1 un, ABC B, CRÍTICO
* 		undefined (SKU: 10889): Estoque 1 un, ABC B, CRÍTICO
* 		undefined (SKU: 2506): Estoque 7 un, ABC B, CRÍTICO
* 		undefined (SKU: 812): Estoque 1 un, ABC B, CRÍTICO
* 		undefined (SKU: 2891): Estoque 1 un, ABC C, CRÍTICO
* 		undefined (SKU: 2460): Estoque 4 un, ABC B, CRÍTICO
REGRAS:
* 		Diagnóstico: Analise o nível de cobertura atual e identifique riscos iminentes (ruptura ou excesso).
* 		Classificação: Verifique se a curva ABC informada condiz com a movimentação recente (se houver dados).
* 		Ação Sugerida: Para cada item, sugira "Manter", "Promover" (se excesso) ou "Repor" (se ruptura).
* 		ALERTA: Não gere pedido de compra agora. Apenas apresente o cenário para tomada de decisão. Use tabelas para apresentar os dados.
  `;

    try {
        console.log("Iniciando requisição para gemini-2.5-pro...");
        const result = await generateText({
            model: google('gemini-2.5-pro') as any,
            prompt: prompt,
        });

        console.log("--- RESPOSTA DA IA ---");
        console.log(result.text);
        console.log("----------------------");
    } catch (error: any) {
        if (error.statusCode === 404 || error.message.includes('not found')) {
            console.error("ERRO: Modelo gemini-2.5-pro não encontrado.");
            console.log("Tentando fallback para gemini-1.5-flash...");
            try {
                const result = await generateText({
                    model: google('gemini-1.5-flash') as any,
                    prompt: prompt,
                });
                console.log("--- RESPOSTA DA IA (FALLBACK 1.5-FLASH) ---");
                console.log(result.text);
            } catch (e) {
                console.error("Erro no fallback:", e);
            }
        } else {
            console.error("Erro na requisição:", error);
        }
    }
}

runTest();
