/**
 * Teste: Verificar se a IA escolhe os filtros corretos para diferentes tipos de perguntas
 * Simula usuários com baixo nível técnico fazendo perguntas variadas
 */

import { sendMessage } from '../app/actions/chat';

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

    // === PERGUNTAS CONTEXTUAIS (segunda mensagem numa conversa) ===
    { id: 39, pergunta: "e esse ta caro?", filtroEsperado: 'general', nivel: 'basico' },
    { id: 40, pergunta: "devo comprar qual?", filtroEsperado: 'general', nivel: 'basico' },
    { id: 41, pergunta: "quanto custa?", filtroEsperado: 'general', nivel: 'basico' },

    // === MÚLTIPLOS PRODUTOS ===
    { id: 42, pergunta: "tem cimento e argamassa?", filtroEsperado: 'specific_item', valorEsperado: 'cimento', nivel: 'intermediario' },
    { id: 43, pergunta: "cadê tubo e cano", filtroEsperado: 'specific_item', valorEsperado: 'tubo', nivel: 'basico' },

    // === PERGUNTAS COM NÚMEROS/SKU ===
    { id: 44, pergunta: "qual estoque do SKU 327?", filtroEsperado: 'specific_item', valorEsperado: '327', nivel: 'intermediario' },
    { id: 45, pergunta: "produto 1229", filtroEsperado: 'specific_item', valorEsperado: '1229', nivel: 'intermediario' },

    // === PERGUNTAS SOBRE VALOR/PREÇO ===
    { id: 46, pergunta: "quanto custa o cimento?", filtroEsperado: 'specific_item', valorEsperado: 'cimento', nivel: 'basico' },
    { id: 47, pergunta: "qual o preço da argamassa", filtroEsperado: 'specific_item', valorEsperado: 'argamassa', nivel: 'intermediario' },
    { id: 48, pergunta: "valor do tubo pvc", filtroEsperado: 'specific_item', valorEsperado: 'tubo', nivel: 'intermediario' },

    // === PERGUNTAS GERAIS ===
    { id: 49, pergunta: "como ta o estoque?", filtroEsperado: 'general', nivel: 'basico' },
    { id: 50, pergunta: "tudo ok no deposito?", filtroEsperado: 'general', nivel: 'basico' },
];

interface TestResult {
    id: number;
    pergunta: string;
    nivel: string;
    esperado: string;
    sucesso: boolean;
    filtroUsado?: string;
    valorUsado?: string;
    resposta?: string;
    erro?: string;
}

async function runTests() {
    console.log('\n🧪 INICIANDO TESTES DE FILTROS - 50 CASOS\n');
    console.log('═'.repeat(80));

    const resultados: TestResult[] = [];
    let sucessos = 0;
    let falhas = 0;

    // Interceptar console.log para capturar os filtros usados
    const originalLog = console.log;
    let ultimoFiltro: { filterType?: string; filterValue?: string } = {};

    console.log = (...args: any[]) => {
        const msg = args.join(' ');
        if (msg.includes('[analyzeStock] Executing with filterType:')) {
            const match = msg.match(/filterType: (\w+), filterValue: (.+)/);
            if (match) {
                ultimoFiltro = {
                    filterType: match[1],
                    filterValue: match[2] === 'undefined' ? undefined : match[2]
                };
            }
        }
        originalLog(...args);
    };

    for (const test of testCases) {
        try {
            ultimoFiltro = {};

            // Executar teste
            const response = await sendMessage(test.pergunta, []);

            // Verificar se o filtro correto foi usado
            const filtroCorreto = ultimoFiltro.filterType === test.filtroEsperado;
            const valorCorreto = !test.valorEsperado ||
                (ultimoFiltro.filterValue && ultimoFiltro.filterValue.toLowerCase().includes(test.valorEsperado.toLowerCase()));

            const sucesso = filtroCorreto && (valorCorreto || !test.valorEsperado);

            if (sucesso) {
                sucessos++;
                console.log(`✅ #${test.id} - "${test.pergunta}" → ${ultimoFiltro.filterType} (${ultimoFiltro.filterValue || 'N/A'})`);
            } else {
                falhas++;
                console.log(`❌ #${test.id} - "${test.pergunta}"`);
                console.log(`   Esperado: ${test.filtroEsperado} (${test.valorEsperado || 'N/A'})`);
                console.log(`   Recebido: ${ultimoFiltro.filterType || 'NENHUM'} (${ultimoFiltro.filterValue || 'N/A'})`);
            }

            resultados.push({
                id: test.id,
                pergunta: test.pergunta,
                nivel: test.nivel,
                esperado: `${test.filtroEsperado}${test.valorEsperado ? `: ${test.valorEsperado}` : ''}`,
                sucesso,
                filtroUsado: ultimoFiltro.filterType,
                valorUsado: ultimoFiltro.filterValue,
                resposta: typeof response === 'string' ? response.substring(0, 100) : 'N/A'
            });

        } catch (error: any) {
            falhas++;
            console.log(`💥 #${test.id} - ERRO: ${error.message}`);
            resultados.push({
                id: test.id,
                pergunta: test.pergunta,
                nivel: test.nivel,
                esperado: `${test.filtroEsperado}${test.valorEsperado ? `: ${test.valorEsperado}` : ''}`,
                sucesso: false,
                erro: error.message
            });
        }

        // Delay entre testes para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Restaurar console.log
    console.log = originalLog;

    console.log('\n' + '═'.repeat(80));
    console.log('\n📊 RESULTADOS FINAIS\n');
    console.log(`Total de testes: ${testCases.length}`);
    console.log(`✅ Sucessos: ${sucessos} (${Math.round(sucessos / testCases.length * 100)}%)`);
    console.log(`❌ Falhas: ${falhas} (${Math.round(falhas / testCases.length * 100)}%)`);

    // Análise por nível de usuário
    const basicoSucesso = resultados.filter(r => r.nivel === 'basico' && r.sucesso).length;
    const basicoTotal = resultados.filter(r => r.nivel === 'basico').length;
    const intermediarioSucesso = resultados.filter(r => r.nivel === 'intermediario' && r.sucesso).length;
    const intermediarioTotal = resultados.filter(r => r.nivel === 'intermediario').length;

    console.log(`\n📈 Por nível de usuário:`);
    console.log(`  Básico: ${basicoSucesso}/${basicoTotal} (${Math.round(basicoSucesso / basicoTotal * 100)}%)`);
    console.log(`  Intermediário: ${intermediarioSucesso}/${intermediarioTotal} (${Math.round(intermediarioSucesso / intermediarioTotal * 100)}%)`);

    // Mostrar falhas críticas
    const falhasCriticas = resultados.filter(r => !r.sucesso && r.nivel === 'basico');
    if (falhasCriticas.length > 0) {
        console.log(`\n⚠️  FALHAS CRÍTICAS (usuários básicos):`);
        falhasCriticas.forEach(f => {
            console.log(`  #${f.id}: "${f.pergunta}"`);
            console.log(`    Esperado: ${f.esperado}`);
            console.log(`    Recebido: ${f.filtroUsado || 'NENHUM'} (${f.valorUsado || 'N/A'})`);
        });
    }

    console.log('\n' + '═'.repeat(80) + '\n');
}

// Executar testes
runTests().catch(console.error);
