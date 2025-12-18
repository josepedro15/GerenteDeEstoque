// =============================================
// SAFE EXECUTOR - Wrapper de Error Handling
// =============================================
// Coloque este código APÓS cada agente LLM para capturar erros
// e garantir que o workflow não quebre

try {
    const agentOutput = $input.first().json.output || $input.first().json.response;

    // Verifica se o agente retornou algo
    if (!agentOutput) {
        throw new Error('Agente não retornou output');
    }

    // Tenta parsear como JSON
    let parsed;
    try {
        // Remove possíveis markdown code blocks
        let cleanOutput = agentOutput;
        if (typeof cleanOutput === 'string') {
            cleanOutput = cleanOutput
                .replace(/^```json\s*/i, '')
                .replace(/^```\s*/i, '')
                .replace(/```\s*$/i, '')
                .trim();
        }

        parsed = typeof cleanOutput === 'string'
            ? JSON.parse(cleanOutput)
            : cleanOutput;

    } catch (parseError) {
        // Se não for JSON válido, retorna como texto puro
        parsed = {
            text: agentOutput,
            format: 'plain',
            _parse_warning: 'Output não era JSON válido, retornando como texto'
        };
    }

    return {
        json: {
            success: true,
            data: parsed,
            error: null,
            timestamp: new Date().toISOString()
        }
    };

} catch (error) {
    // Log do erro para debugging
    console.error('SafeExecutor Error:', error.message);

    return {
        json: {
            success: false,
            data: null,
            error: {
                message: error.message,
                timestamp: new Date().toISOString(),
                fallback: "Não foi possível processar sua solicitação. Tente novamente em instantes."
            }
        }
    };
}
