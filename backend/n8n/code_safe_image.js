// =============================================
// SAFE IMAGE GENERATOR - Error Handling para Gemini Image
// =============================================
// Coloque este código APÓS nodes de geração de imagem (Panfleto, Cartaz)
// para garantir fallback quando a imagem não for gerada

const item = $input.item;
const binaryPropertyName = 'data';

try {
    // Verifica se a imagem foi gerada
    if (!item.binary || !item.binary[binaryPropertyName]) {
        console.warn('Imagem não encontrada no output binário');

        return {
            json: {
                imageUrl: null,
                success: false,
                error: "Imagem não foi gerada",
                fallback_prompt: item.json?.prompt || item.json?.layout || "Prompt não disponível",
                suggestion: "Tente simplificar o prompt ou gerar novamente"
            }
        };
    }

    const binaryData = item.binary[binaryPropertyName];

    // Verifica se os dados binários existem
    if (!binaryData.data) {
        throw new Error('Dados binários da imagem estão vazios');
    }

    const mimeType = binaryData.mimeType || 'image/png';
    const base64String = `data:${mimeType};base64,${binaryData.data}`;

    // Valida tamanho mínimo (imagem muito pequena pode indicar erro)
    if (binaryData.data.length < 1000) {
        console.warn('Imagem gerada parece muito pequena, pode estar corrompida');
    }

    return {
        json: {
            imageUrl: base64String,
            success: true,
            error: null,
            mimeType: mimeType,
            size_bytes: binaryData.data.length
        }
    };

} catch (error) {
    console.error('SafeImageGenerator Error:', error.message);

    return {
        json: {
            imageUrl: null,
            success: false,
            error: error.message,
            fallback_prompt: item.json?.prompt || item.json?.layout || null
        }
    };
}
