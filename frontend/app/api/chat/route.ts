import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { getStockAnalysis } from '@/app/actions/inventory';

export const maxDuration = 30;

// @ts-ignore
export async function POST(req: Request) {
    const { messages } = await req.json();

    const result = await streamText({
        model: openai('gpt-4o'),
        messages,
        system: 'Você é um assistente especialista em gestão de estoque. Use as ferramentas disponíveis para responder perguntas sobre o inventário, rupturas e sugestões de compra.',
        tools: {
            getInventory: tool({
                description: 'Obtém a análise atual do estoque, incluindo itens em ruptura, sugestões de compra e níveis de estoque.',
                parameters: z.object({
                    query: z.string().optional().describe('Contexto opcional para a busca')
                }),
                execute: async ({ query }) => {
                    const data = await getStockAnalysis();
                    // Return a summary or top items to avoid token limits if data is huge
                    // specific fields to keep it concise
                    return data.slice(0, 50).map(item => ({
                        produto: item.nome_produto,
                        codigo: item.codigo_produto,
                        status: item.status,
                        estoque: item.estoque_atual,
                        sugestao: item.quantidade_sugerida,
                        ruptura_dias: item.cobertura_atual_dias
                    }));
                },
            }),
        },
    });

    return result.toTextStreamResponse();
}
