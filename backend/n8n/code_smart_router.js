// =============================================
// SMART ROUTER - Código para Node "Code" no N8N
// =============================================
// Substitui o "Agente Comercial" (Router LLM) por lógica determinística
// Economia: ~$0.02 por request (GPT-5.1)
// Latência: ~0ms vs ~2-3s do LLM

const body = $input.first().json.body || {};

// Extrai campos relevantes (normalize para lowercase)
const action = (body.action || '').toLowerCase();
const context = (body.context || body.message || '').toLowerCase();
const alertType = (body.alert_type || '').toLowerCase();
const tipoAnalise = (body.product_data?.tipo_analise || body.tipo_analise || '').toLowerCase();

// Inicializa timestamp para métricas
const startTime = Date.now();

// ===========================================
// REGRAS DE ROTEAMENTO (ordem importa!)
// ===========================================

let route = 'ESTOQUE'; // Default fallback

// 📧 EMAIL: Campanhas de e-mail marketing
if (
    action.includes('email') ||
    context.includes('email') ||
    context.includes('e-mail') ||
    context.includes('newsletter') ||
    context.includes('mailing')
) {
    route = 'EMAIL';
}

// 📣 MARKETING: Campanhas, excesso, promoções, redes sociais
else if (
    action.includes('campaign') ||
    action.includes('generate') ||
    action.includes('marketing') ||
    alertType === 'excesso' ||
    tipoAnalise.includes('queima') ||
    tipoAnalise.includes('marketing') ||
    context.includes('campanha') ||
    context.includes('instagram') ||
    context.includes('whatsapp') ||
    context.includes('promoção') ||
    context.includes('promocao') ||
    context.includes('queimar') ||
    context.includes('queima') ||
    context.includes('post') ||
    context.includes('stories') ||
    context.includes('redes sociais')
) {
    route = 'MARKETING';
}

// 🛒 COMPRA: Ruptura, pedidos, reposição, fornecedor
else if (
    alertType === 'ruptura' ||
    tipoAnalise.includes('compra') ||
    tipoAnalise.includes('sugestão') ||
    context.includes('comprar') ||
    context.includes('pedido') ||
    context.includes('fornecedor') ||
    context.includes('repor') ||
    context.includes('ruptura') ||
    context.includes('sugestão') ||
    context.includes('sugestao') ||
    context.includes('reposição') ||
    context.includes('reposicao')
) {
    route = 'COMPRA';
}

// 📊 RELATORIO: Análises e relatórios
else if (
    action.includes('report') ||
    action.includes('relatorio') ||
    context.includes('relatório') ||
    context.includes('relatorio') ||
    context.includes('resumo semanal') ||
    context.includes('análise geral') ||
    context.includes('analise geral') ||
    context.includes('dashboard') ||
    tipoAnalise.includes('geral') ||
    tipoAnalise.includes('dashboard')
) {
    route = 'RELATORIO';
}

// 🤝 NEGOCIACAO: Fornecedores e cotações
else if (
    action.includes('negotiate') ||
    action.includes('cotacao') ||
    context.includes('negociar') ||
    context.includes('cotação') ||
    context.includes('cotacao') ||
    context.includes('desconto fornecedor') ||
    context.includes('melhor preço') ||
    context.includes('pechinchar')
) {
    route = 'NEGOCIACAO';
}

// 📦 ESTOQUE: Default para consultas gerais de estoque
// (já definido como default acima)

// ===========================================
// OUTPUT
// ===========================================

return {
    json: {
        route,
        original_body: body,
        payload_string: JSON.stringify(body, null, 2),
        sessionId: body.user_id || null,
        timestamp: new Date().toISOString(),
        routing_time_ms: Date.now() - startTime,

        // Metadata para debug
        _debug: {
            action,
            context_preview: context.substring(0, 100),
            alert_type: alertType,
            tipo_analise: tipoAnalise
        }
    }
};
