
import result from 'dotenv';
result.config({ path: '.env.local' });
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { tools } from '../app/api/chat/tools';

const MODEL_NAME = 'gemini-2.5-flash';

async function testContextFlow() {
    console.log(`🤖 Testando fluxo de contexto com modelo: ${MODEL_NAME}`);

    const systemPrompt = `Você é um Especialista em Logística e Gerente de Estoque Inteligente.
    
    REGRAS CRÍTICAS DE EXECUÇÃO:
    1.  SEMPRE que o usuário perguntar sobre "quantidades", "status", "nível de estoque", "valor", "preço", "custo", "comprar" ou qualquer dado técnico de um item específico, você É OBRIGADO a chamar a ferramenta 'analyzeStock'.
    2.  NUNCA afirme que vai buscar ou que está analisando sem efetivamente chamar a tool.
    3.  NUNCA invente números ou valores monetários. Se a ferramenta não retornar dados, diga que não encontrou o produto.
    4.  Se o usuário perguntar "Qual o estoque de cimento?" ou "Qual o valor do tubo?", sua PRIMEIRA ação deve ser chamar analyzeStock({ filterType: 'specific_item', filterValue: '...' }).
    5.  Se a busca retornar vazio, avise o usuário que o produto não foi localizado no banco de dados.
    6.  Se o usuário perguntar "O que preciso comprar hoje?", "O que está em falta?" ou "Fazer pedido de compras", chame analyzeStock({ filterType: 'low_stock' }). MAS ATENÇÃO: Se o usuário estiver perguntando "qual comprar?" dentro de um contexto de um produto específico (ex: falando de cimento), NÃO use low_stock global.
    7.  OBRIGATÓRIO: Após chamar uma ferramenta, você DEVE gerar uma resposta de texto resumindo o que encontrou. NUNCA pare na chamada da ferramenta.
    8.  CONTEXTO É REI: Antes de chamar uma tool, olhe as mensagens anteriores. Se o usuário perguntar "e o preço?", "tem estoque?" ou "qual comprar?", ele está falando do item anterior. Mantenha o foco no produto do contexto.`;

    // 1. Simular histórico onde já buscamos cimento
    const history = [
        { role: 'user', content: 'Qual o estoque de cimento?' },
        {
            role: 'assistant',
            content: `Encontrei os seguintes dados:
- CIMENTO CAUE CPIV 50 KG (SKU: 327): 2 un, 🟠 Crítico
- CIMENTO VOTORAN CPIV 50 KG (SKU: 325): 108 un, 🟠 Crítico
- CIMENTO GAUCHO CPIV RS 32 50 KG (SKU: 19578): 188 un, 🟠 Crítico
- CIMENTO COLA ACI COLARTE 20KG (SKU: 14729): 61 un, 🟡 Atenção`
        }
    ];

    const newMessage = "qual delas devo comprar?";

    console.log(`\n💬 Histórico simulado:\nUser: ${history[0].content}\nAssistant: [Lista de cimentos...]\nUser: ${newMessage}`);

    try {
        const result = await generateText({
            model: google(MODEL_NAME),
            system: systemPrompt,
            messages: [
                ...history,
                { role: 'user', content: newMessage }
            ] as any,
            tools: tools,
            maxSteps: 1 // Queremos ver a PRIMEIRA decisão
        } as any);

        console.log('\n🔍 Resultado da IA:');

        if (result.toolCalls && result.toolCalls.length > 0) {
            const call: any = result.toolCalls[0];
            console.log(`🛠 Tool Chamada: ${call.toolName}`);
            console.log(`📦 Argumentos:`, JSON.stringify(call.args, null, 2));

            if (call.toolName === 'analyzeStock' && call.args.filterType === 'low_stock') {
                console.error('❌ FALHA: IA chamou low_stock (perdeu contexto!)');
            } else if (call.toolName === 'analyzeStock' && call.args.filterType === 'specific_item') {
                console.log('✅ SUCESSO: IA manteve contexto específico (specific_item)');
            } else {
                console.log('⚠️ OUTRO: IA chamou outra coisa:', call.toolName, call.args);
            }

        } else {
            console.log('📝 Resposta de Texto Direta:', result.text);
            console.log('Analyzes context? likely yes because it answered directly.');
            // Se responder diretamente recomendando com base no histórico, também é sucesso!
            if (result.text.toLowerCase().includes('caue') || result.text.toLowerCase().includes('votoran')) {
                console.log('✅ SUCESSO: IA recomendou baseada no histórico!');
            }
        }

    } catch (error) {
        console.error('Erro na execução:', error);
    }
}

testContextFlow();
