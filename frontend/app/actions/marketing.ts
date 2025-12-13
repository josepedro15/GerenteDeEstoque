'use server';

export async function generateCampaign(productIds: string[]) {
    // In a real scenario, fetch product details from DB using IDs
    // Then send to n8n webhook

    await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate thinking

    // Mock Response
    return {
        success: true,
        summary: {
            objective: "Queima de Estoque",
            tone: "Urgente & Promocional"
        },
        channels: {
            instagram: {
                copy: "🚨 QUEIMA DE ESTOQUE! 🚨\n\nSó hoje você leva Cimento CP-II com preço de custo! É pra zerar o pátio.\n\n🏗 Ideal para sua obra render mais.\n🏃‍♂️ Corra que restam poucas unidades.\n\n📍 Venha nos visitar ou peça pelo link na bio!\n\n#Oferta #Construção #Cimento #PromoçãoRelampago",
                imagePrompt: "Foto de alta qualidade de sacos de cimento empilhados em um armazém organizado, com iluminação dramática e um selo vermelho grande escrito 'OFERTA URGENTE' em 3D no canto.",
                sticker: "🔥 SÓ HOJE"
            },
            whatsapp: {
                script: "Olá [Nome do Cliente]! Tudo bem? \n\nAqui é o Pedro da SmartOrders. \n\nEstou com uma oportunidade única hoje: Cimento CP-II saindo a *R$ 28,90*! 🔥\n\nO preço tá muito abaixo da tabela, mas é só para as últimas 500 unidades. \n\nPosso separar quantos sacos pra você? 🚛",
                trigger: "Escassez: Últimas 500 unidades"
            },
            physical: {
                headline: "A OPORTUNIDADE QUE SUA OBRA ESPERAVA",
                subheadline: "Cimento CP-II com preço de fábrica. Leve agora.",
                offer: "De R$ 32,90 por R$ 28,90",
                layout: "Cartaz A3 com fundo amarelo e letras pretas impactantes."
            }
        }
    };
}
