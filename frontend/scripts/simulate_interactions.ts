import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env from .env.local in frontend root (parent of scripts/)
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Level 5 User Personas & Scenarios
const scenarios = [
    // --- Basic Checks ---
    "Quanto tem de cimento?",
    "Tem argamassa no estoque?",
    "Me vê o estoque de tijolo.",
    "Preciso saber do cabo flexivel.",
    "Esgotou a tinta branca?",

    // --- Purchase Intent ---
    "O que tá faltando comprar?",
    "Monta uma lista de compra pra mim.",
    "Tem alguma coisa zerada?",
    "Quais os itens mais criticos?",
    "Verifica se precisa repor o estoque de elétrica.",

    // --- Financials ---
    "Quanto vai custar pra repor o cimento?",
    "Qual o valor total dos pedidos urgentes?",
    "Esse pedido de tubos vai sair caro?",
    "Qual o item mais caro que a gente tem que comprar hoje?",
    "Me dá o custo unitário da areia.",

    // --- Specific SKU/ID ---
    "Vê o item 12842",
    "Estoque do SKU 13571",
    "Produto código 2132 precisa comprar?",
    "Analisa o 6270 pra mim.",
    "O que é o item 2506?",

    // --- Typos & Slang ---
    "Qto tem de cimetno?",
    "Vê as lampada",
    "O estoque de tubos ta ok?",
    "Tem mto piso?",
    "Acabou a colla?",

    // --- Context/Follow-up ---
    "E o preço de venda dele?",
    "Isso dá pra quantos dias?",
    "Quem é o fornecedor disso?",
    "Posso segurar essa compra?",
    "Tem algum substituto pro cimento?",

    // --- Vague/Broad ---
    "Como tá a loja?",
    "Resumo do dia.",
    "Me ajuda com o estoque.",
    "Tudo certo por ai?",
    "Tem novidade?",

    // --- Edge Cases ---
    "Qual a previsão do tempo?",
    "Gera um boleto.",
    "Cadastra um produto novo.",
    "Muda o estoque do cimento pra 100.",
    "Quem comprou isso ontem?"
];

async function runSimulation() {
    // Dynamic import to ensure env vars are loaded first
    const { tools } = await import('../lib/ai/tools');
    const fs = await import('fs');

    console.log(`Starting simulation of ${scenarios.length} scenarios...`);

    // Initialize report file
    const reportPath = 'simulation_report.md';
    fs.writeFileSync(reportPath, `# Relatório de Simulação
Data: ${new Date().toISOString()}

`);

    for (const [index, prompt] of scenarios.entries()) {
        console.log(`\n--- [${index + 1}/${scenarios.length}] ---`);
        console.log(`User: "${prompt}"`);

        let entry = `### ${index + 1}. "${prompt}"\n`;

        try {
            const result = await generateText({
                model: google('gemini-2.5-pro') as any,
                tools: tools,
                system: `Você é o Assistente IA do SmartOrders, operando com a arquitetura Gemini 2.5 Pro.
                OBJETIVO: Atuar como especialista em Logística/Estoque.
                Contexto: O usuário tem conhecimento intermediário (Nível 5). Ele entende o básico mas precisa de orientação clara sobre COMPRA e ESTOQUE e VALORES.
                Use as ferramentas disponíveis para buscar dados reais.`,
                prompt: prompt
            });

            console.log(`AI: ${result.text.substring(0, 50)}...`);
            entry += `**Tools**: \`${result.toolCalls?.map(t => t.toolName).join(', ') || 'none'}\`\n**Resposta**:\n${result.text}\n---\n`;

        } catch (error: any) {
            console.error(`ERROR: ${error.message}`);
            entry += `**Error**: ${error.message}\n---\n`;
        }

        fs.appendFileSync(reportPath, entry);

        // Delay to prevent rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    console.log("Simulation complete.");
}

runSimulation();
