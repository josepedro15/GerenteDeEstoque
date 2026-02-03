/**
 * Teste DIRETO da IA: Verificar se escolhe os filtros corretos
 * Bypassa Next.js e chama o modelo diretamente
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Carregar env vars
dotenv.config({ path: resolve(__dirname, '../.env.local') });

import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { tools } from '../app/api/chat/tools';

interface TestCase {
    id: number;
    pergunta: string;
    filtroEsperado: 'specific_item' | 'low_stock' | 'category' | 'general';
    valorEsperado?: string;
    nivel: 'basico' | 'intermediario';
}

const testCases: TestCase[] = [
    // === PERGUNTAS ESPECÍFICAS (specific_item) ===
    { id: 1, pergunta: "Qual o estoque de cimento?", filtroEsperado: 'specific_item', valorEsperado: 'cimento', nivel: 'basico' },
    { id: 2, pergunta: "tem argamassa?", filtroEsperado: 'specific_item', valorEsperado: 'argamassa', nivel: 'basico' },
    { id: 3, pergunta: "cadê o tubo pvc", filtroEsperado: 'specific_item', valorEsperado: 'tubo', nivel: 'basico' },
    { id: 4, pergunta: "me mostra os dados da madeira", filtroEsperado: 'specific_item', valorEsperado: 'madeira', nivel: 'intermediario' },
    { id: 5, pergunta: "quanto tem de tijolo?", filtroEsperado: 'specific_item', valorEsperado: 'tijolo', nivel: 'basico' },
    { id: 6, pergunta: "olha ai a quantidade de areia", filtroEsperado: 'specific_item', valorEsperado: 'areia', nivel: 'basico' },
    { id: 7, pergunta: "preciso saber do cal", filtroEsperado: 'specific_item', valorEsperado: 'cal', nivel: 'intermediario' },
    { id: 8, pergunta: "ta faltando ceramica?", filtroEsperado: 'specific_item', valorEsperado: 'ceramica', nivel: 'basico' },
    { id: 9, pergunta: "vê pra mim o ferro", filtroEsperado: 'specific_item', valorEsperado: 'ferro', nivel: 'basico' },
    { id: 10, pergunta: "quantos sacos de cimento tem", filtroEsperado: 'specific_item', valorEsperado: 'cimento', nivel: 'basico' },
    { id: 11, pergunta: "cimento ta acabando?", filtroEsperado: 'specific_item', valorEsperado: 'cimento', nivel: 'basico' },
    { id: 12, pergunta: "argamassa ainda tem?", filtroEsperado: 'specific_item', valorEsperado: 'argamassa', nivel: 'basico' },
    { id: 13, pergunta: "mostra ai o estoque de piso", filtroEsperado: 'specific_item', valorEsperado: 'piso', nivel: 'basico' },
    { id: 14, pergunta: "qual a situacao da tinta", filtroEsperado: 'specific_item', valorEsperado: 'tinta', nivel: 'intermediario' },
    { id: 15, pergunta: "quantos metros de mangueira tem?", filtroEsperado: 'specific_item', valorEsperado: 'mangueira', nivel: 'basico' },
    { id: 16, pergunta: "procura la se tem cola", filtroEsperado: 'specific_item', valorEsperado: 'cola', nivel: 'basico' },
    { id: 17, pergunta: "quero ver quanto tem de gesso", filtroEsperado: 'specific_item', valorEsperado: 'gesso', nivel: 'basico' },
    { id: 18, pergunta: "parafuso ta zerado?", filtroEsperado: 'specific_item', valorEsperado: 'parafuso', nivel: 'basico' },
    { id: 19, pergunta: "da uma olhada no cano", filtroEsperado: 'specific_item', valorEsperado: 'cano', nivel: 'basico' },
    { id: 20, pergunta: "ainda tem arame?", filtroEsperado: 'specific_item', valorEsperado: 'arame', nivel: 'basico' },

    // === PERGUNTAS GENÉRICAS DE RUPTURA (low_stock) ===
    { id: 21, pergunta: "O que preciso comprar?", filtroEsperado: 'low_stock', nivel: 'basico' },
    { id: 22, pergunta: "ta faltando o que?", filtroEsperado: 'low_stock', nivel: 'basico' },
    { id: 23, pergunta: "quais produtos em falta", filtroEsperado: 'low_stock', nivel: 'intermediario' },
    { id: 24, pergunta: "me mostra o que ta acabando", filtroEsperado: 'low_stock', nivel: 'basico' },
    { id: 25, pergunta: "qual item em ruptura?", filtroEsperado: 'low_stock', nivel: 'intermediario' },
    { id: 26, pergunta: "tem coisa faltando ai?", filtroEsperado: 'low_stock', nivel: 'basico' },
    { id: 27, pergunta: "ta crítico o que?", filtroEsperado: 'low_stock', nivel: 'basico' },
    { id: 28, pergunta: "fazer pedido de compras", filtroEsperado: 'low_stock', nivel: 'intermediario' },
    { id: 29, pergunta: "cadê os produtos em falta", filtroEsperado: 'low_stock', nivel: 'basico' },
    { id: 30, pergunta: "que produtos tao zerados?", filtroEsperado: 'low_stock', nivel: 'basico' },

    // === VARIAÇÕES DIFÍCEIS (podem confundir) ===
    { id: 31, pergunta: "cimento ta em falta?", filtroEsperado: 'specific_item', valorEsperado: 'cimento', nivel: 'basico' },
    { id: 32, pergunta: "argamassa acabou?", filtroEsperado: 'specific_item', valorEsperado: 'argamassa', nivel: 'basico' },
    { id: 33, pergunta: "tem que comprar cimento?", filtroEsperado: 'specific_item', valorEsperado: 'cimento', nivel: 'basico' },
    { id: 34, pergunta: "cadê meu cimento", filtroEsperado: 'specific_item', valorEsperado: 'cimento', nivel: 'basico' },
    { id: 35, pergunta: "o tubo ta critico?", filtroEsperado: 'specific_item', valorEsperado: 'tubo', nivel: 'basico' },

    // === PERGUNTAS COM ERROS DE DIGITAÇÃO ===
    { id: 36, pergunta: "simeto", filtroEsperado: 'specific_item', valorEsperado: 'cimento', nivel: 'basico' },
    { id: 37, pergunta: "argamasa", filtroEsperado: 'specific_item', valorEsperado: 'argamassa', nivel: 'basico' },
    { id: 38, pergunta: "tem tuboo?", filtroEsperado: 'specific_item', valorEsperado: 'tubo', nivel: 'basico' },

    // === MÚLTIPLOS PRODUTOS ===
    { id: 42, pergunta: "tem cimento e argamassa?", filtroEsperado: 'specific_item', valorEsperado: 'cimento', nivel: 'intermediario' },
    { id: 43, pergunta: "cadê tubo e cano", filtroEsperado: 'specific_item', valorEsperado: 'tubo', nivel: 'basico' },

    // === PERGUNTAS SOBRE VALOR/PREÇO ===
    { id: 46, pergunta: "quanto custa o cimento?", filtroEsperado: 'specific_item', valorEsperado: 'cimento', nivel: 'basico' },
    { id: 47, pergunta: "qual o preço da argamassa", filtroEsperado: 'specific_item', valorEsperado: 'argamassa', nivel: 'intermediario' },
    { id: 48, pergunta: "valor do tubo pvc", filtroEsperado: 'specific_item', valorEsperado: 'tubo', nivel: 'intermediario' },
];

const systemPrompt = `Você é um Especialista em Logística e Gerente de Estoque Inteligente.

REGRAS CRÍTICAS DE EXECUÇÃO:
1.  SEMPRE que o usuário perguntar sobre um PRODUTO ESPECÍFICO, você É OBRIGADO a chamar a ferramenta 'analyzeStock' com filterType='specific_item'.
2.  NUNCA afirme que vai buscar sem efetivamente chamar a tool.
3.  NUNCA invente números ou valores.
4.  Se o usuário perguntar "Qual o estoque de cimento?" ou "Qual o valor do tubo?", sua PRIMEIRA ação deve ser chamar analyzeStock({ filterType: 'specific_item', filterValue: 'cimento' }).
5.  Se o usuário perguntar "O que preciso comprar hoje?", "O que está em falta?", chame analyzeStock({ filterType: 'low_stock' }).
6.  OBRIGATÓRIO: Após chamar uma ferramenta, você DEVE gerar uma resposta de texto resumindo o que encontrou.`;

interface TestResult {
    id: number;
    pergunta: string;
    nivel: string;
    esperado: string;
    sucesso: boolean;
    filtroUsado?: string;
    valorUsado?: string;
    tempoMs?: number;
}

async function runTests() {
    console.log('\n🧪 TESTE DE FILTROS - 50 CASOS DE USO REAL\n');
    console.log('═'.repeat(80));

    const resultados: TestResult[] = [];
    let sucessos = 0;
    let falhas = 0;

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error('❌ Nenhuma API key encontrada!');
        return;
    }

    for (const test of testCases) {
        const startTime = Date.now();

        try {
            const result = await generateText({
                model: google('gemini-2.5-flash'),
                system: systemPrompt,
                messages: [{ role: 'user', content: test.pergunta }],
                tools: tools as any,
                maxSteps: 5,
            } as any);

            const tempoMs = Date.now() - startTime;

            // Verificar se alguma tool foi chamada
            const toolCalls = result.steps?.flatMap(step =>
                'toolCalls' in step ? step.toolCalls : []
            ) || [];

            const analyzeStockCall = toolCalls.find((call: any) => call.toolName === 'analyzeStock');

            if (analyzeStockCall) {
                // DEBUG: Ver estrutura real
                console.log('RAW CALL:', JSON.stringify(analyzeStockCall, null, 2));

                // @ts-ignore
                const args = analyzeStockCall.args || analyzeStockCall.input || {};
                const filtroUsado = args.filterType;
                const valorUsado = args.filterValue;

                const filtroCorreto = filtroUsado === test.filtroEsperado;
                const valorCorreto = !test.valorEsperado ||
                    (valorUsado && valorUsado.toLowerCase().includes(test.valorEsperado.toLowerCase()));

                const sucesso = filtroCorreto && (valorCorreto || !test.valorEsperado);

                if (sucesso) {
                    sucessos++;
                    console.log(`✅ #${test.id.toString().padStart(2, '0')} [${tempoMs}ms] "${test.pergunta}"`);
                    console.log(`   → ${filtroUsado}${valorUsado ? `: "${valorUsado}"` : ''}`);
                } else {
                    falhas++;
                    console.log(`❌ #${test.id.toString().padStart(2, '0')} [${tempoMs}ms] "${test.pergunta}"`);
                    console.log(`   Esperado: ${test.filtroEsperado}${test.valorEsperado ? `: "${test.valorEsperado}"` : ''}`);
                    console.log(`   Recebido: ${filtroUsado}${valorUsado ? `: "${valorUsado}"` : ''}`);
                }

                resultados.push({
                    id: test.id,
                    pergunta: test.pergunta,
                    nivel: test.nivel,
                    esperado: `${test.filtroEsperado}${test.valorEsperado ? `: ${test.valorEsperado}` : ''}`,
                    sucesso,
                    filtroUsado,
                    valorUsado,
                    tempoMs
                });
            } else {
                falhas++;
                console.log(`⚠️  #${test.id.toString().padStart(2, '0')} [${tempoMs}ms] "${test.pergunta}" → NENHUMA TOOL CHAMADA`);
                resultados.push({
                    id: test.id,
                    pergunta: test.pergunta,
                    nivel: test.nivel,
                    esperado: `${test.filtroEsperado}${test.valorEsperado ? `: ${test.valorEsperado}` : ''}`,
                    sucesso: false,
                    filtroUsado: 'NENHUMA',
                    tempoMs
                });
            }

        } catch (error: any) {
            falhas++;
            const tempoMs = Date.now() - startTime;
            console.log(`💥 #${test.id.toString().padStart(2, '0')} [${tempoMs}ms] ERRO: ${error.message?.substring(0, 50)}`);
            resultados.push({
                id: test.id,
                pergunta: test.pergunta,
                nivel: test.nivel,
                esperado: `${test.filtroEsperado}${test.valorEsperado ? `: ${test.valorEsperado}` : ''}`,
                sucesso: false,
                filtroUsado: 'ERRO',
                tempoMs
            });
        }

        // Delay entre testes
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log('\n' + '═'.repeat(80));
    console.log('\n📊 RESULTADOS FINAIS\n');
    console.log(`Total de testes: ${testCases.length}`);
    console.log(`✅ Sucessos: ${sucessos} (${Math.round(sucessos / testCases.length * 100)}%)`);
    console.log(`❌ Falhas: ${falhas} (${Math.round(falhas / testCases.length * 100)}%)`);

    // Tempo médio
    const tempoMedio = resultados.reduce((acc, r) => acc + (r.tempoMs || 0), 0) / resultados.length;
    console.log(`⏱️  Tempo médio: ${Math.round(tempoMedio)}ms`);

    // Análise por nível
    const basicoSucesso = resultados.filter(r => r.nivel === 'basico' && r.sucesso).length;
    const basicoTotal = resultados.filter(r => r.nivel === 'basico').length;
    const intermediarioSucesso = resultados.filter(r => r.nivel === 'intermediario' && r.sucesso).length;
    const intermediarioTotal = resultados.filter(r => r.nivel === 'intermediario').length;

    console.log(`\n📈 Por nível de usuário:`);
    console.log(`  Básico: ${basicoSucesso}/${basicoTotal} (${Math.round(basicoSucesso / basicoTotal * 100)}%)`);
    console.log(`  Intermediário: ${intermediarioSucesso}/${intermediarioTotal} (${Math.round(intermediarioSucesso / intermediarioTotal * 100)}%)`);

    // Falhas críticas (usuários básicos)
    const falhasCriticas = resultados.filter(r => !r.sucesso && r.nivel === 'basico');
    if (falhasCriticas.length > 0) {
        console.log(`\n⚠️  FALHAS CRÍTICAS (${falhasCriticas.length} casos básicos):`);
        falhasCriticas.slice(0, 10).forEach(f => {
            console.log(`  #${f.id}: "${f.pergunta}"`);
            console.log(`    💡 Esperado: ${f.esperado} | Recebido: ${f.filtroUsado}${f.valorUsado ? `: ${f.valorUsado}` : ''}`);
        });
        if (falhasCriticas.length > 10) {
            console.log(`  ... e mais ${falhasCriticas.length - 10} falhas`);
        }
    }

    console.log('\n' + '═'.repeat(80) + '\n');

    // Retornar taxa de sucesso
    return { sucessos, falhas, taxaSucesso: Math.round(sucessos / testCases.length * 100) };
}

runTests()
    .then(result => {
        if (result && result.taxaSucesso < 80) {
            console.log('⚠️  Taxa de sucesso abaixo de 80% - considere revisar as descrições das tools!');
            process.exit(1);
        } else {
            console.log('✅ Testes concluídos com sucesso!');
            process.exit(0);
        }
    })
    .catch(error => {
        console.error('💥 Erro fatal:', error);
        process.exit(1);
    });
