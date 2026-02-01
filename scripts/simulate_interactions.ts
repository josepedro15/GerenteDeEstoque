
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { tools } from '../lib/ai/tools';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Force load .env.local from frontend directory
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

// Level 5 User Personas & Scenarios
const scenarios = [
    // --- Basic Checks ---
    "Quanto tem de cimento?",
    "Tem argamassa no estoque?",
    "Me vê o estoque de tijolo.",
    "Preciso saber do cabo flexivel.",
    "Esgotou a tinta branca?",

    // --- Purchase Intent (Level 5 doesn't know exact 'sugestao', asks generally) ---
    "O que tá faltando comprar?",
    "Monta uma lista de compra pra mim.",
    "Tem alguma coisa zerada?",
    "Quais os itens mais criticos?",
    "Verifica se precisa repor o estoque de elétrica.",

    // --- Financials (Level 5 cares about cost but might be vague) ---
    "Quanto vai custar pra repor o cimento?",
    "Qual o valor total dos pedidos urgentes?",
    "Esse pedido de tubos vai sair caro?",
    "Qual o item mais caro que a gente tem que comprar hoje?",
    "Me dá o custo unitário da areia.",

    // --- Specific SKU/ID (Testing the fixes) ---
    "Vê o item 12842",
    "Estoque do SKU 2132",
    "Produto código 13571 precisa comprar?",
    "Analisa o 6270 pra mim.",
    "O que é o item 2506?",

    // --- Typos & Slang ---
    "Qto tem de cimetno?",
    "Vê as lampada",
    "O estoque de tubos ta ok?",
    "Tem mto piso?",
    "Acabou a colla?",

    // --- Context/Follow-up (Simulated one-shots) ---
    "E o preço de venda dele?",
    "Isso dá pra quantos dias?",
    "Quem é o fornecedor disso?",
    "Posso segurar essa compra?",
    "Tem algum substituto pro cimento?", // Hard question for current tools

    // --- Vague/Broad ---
    "Como tá a loja?",
    "Resumo do dia.",
    "Me ajuda com o estoque.",
    "Tudo certo por ai?",
    "Tem novidade?",

    // --- Out of Scope / Edge Cases ---
    "Qual a previsão do tempo?",
    "Gera um boleto.",
    "Cadastra um produto novo.",
    "Muda o estoque do cimento pra 100.",
    "Quem comprou isso ontem?",

    // --- More Specifics ---
    "Tem luva de correr?",
    "Joelho 90 graus tem quantos?",
    "Capa para chuva ta tendo?",
    "Serra marmore precisa repor?",
    "Disco de corte ta em falta?",
    "Vê se tem telha.",
    "Caixa d'agua de 1000L, como estamos?",
    "Torneira de cozinha tem?",
    "Chuveiro lorenzetti estoque.",
    "Lâmpada LED 9w tem bastante?",
    "Fita isolante ta acabando?",
    "Cimento votoran preço.",
    "Cal hidratada estoque.",
    "Rejunte branco tem?",
    "Massa corrida 18l preço."
];

async function runSimulation() {
    console.log(`Starting simulation of ${scenarios.length} scenarios...\n`);
    const results = [];

    // Use a subset or parallelize if too slow, but sequential is safer for rate limits
    for (const [index, prompt] of scenarios.entries()) {
        console.log(`[${index + 1}/${scenarios.length}] User: "${prompt}"`);
        try {
            const { text, toolCalls } = await generateText({
                model: google('gemini-2.5-pro') as any, // Cast to any for checking
                tools: tools,
                maxSteps: 5, // Allow tool usage
                system: `Você é o Assistente IA do SmartOrders, operando com a arquitetura Gemini 2.5 Pro.
                OBJETIVO: Atuar como especialista em Logística/Estoque.
                Contexto: O usuário tem conhecimento intermediário (Nível 5). Ele entende o básico mas precisa de orientação clara sobre COMPRA e ESTOQUE e VALORES.
                Use as ferramentas disponíveis para buscar dados reais.`,
                prompt: prompt
            });

            results.push({
                id: index + 1,
                prompt,
                response: text,
                toolsUsed: toolCalls?.map(t => t.toolName).join(', ') || 'none'
            });
            console.log(`   -> AI: ${text.substring(0, 50)}... [Tools: ${toolCalls?.length || 0}]\n`);

        } catch (error: any) {
            console.error(`   -> ERROR: ${error.message}\n`);
            results.push({
                id: index + 1,
                prompt,
                response: `ERROR: ${error.message}`,
                toolsUsed: 'error'
            });
        }

        // Small delay to avoid aggressive rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Write report
    const reportPath = path.resolve('simulation_report.md');
    const reportContent = `# Relatório de Simulação (Cenários de Usuário Nível 5)
Data: ${new Date().toISOString()}

## Resumo
Total de Cenários: ${scenarios.length}

## Detalhes
${results.map(r => `
### ${r.id}. "${r.prompt}"
**Tools**: \`${r.toolsUsed}\`
**Resposta**:
${r.response}
---`).join('\n')}
`;

    fs.writeFileSync(reportPath, reportContent);
    console.log(`\nSimulation complete. Report saved to ${reportPath}`);
}

runSimulation();
