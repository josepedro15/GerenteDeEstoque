'use server';

export async function runSimulation(formData: FormData) {
    const sku = formData.get('sku');
    const quantity = Number(formData.get('quantity'));
    const cost = Number(formData.get('cost'));
    const paymentTerms = formData.get('paymentTerms') as string;

    // In a real app, we would make a POST to n8n here
    // const response = await fetch('https://n8n.webhook.url/simulation', { body: JSON.stringify({...}) })

    // MOCKING THE AI RESPONSE FOR DEMO
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate AI thinking time

    const totalInvestment = quantity * cost;
    const projectedCoverage = 45; // Mock
    const riskLevel = projectedCoverage > 60 ? 'HIGH' : projectedCoverage < 15 ? 'LOW' : 'MEDIUM';

    return {
        success: true,
        input: { sku, quantity, cost, paymentTerms },
        analysis: {
            riskLevel: riskLevel, // LOW, MEDIUM, HIGH
            projectedCoverage: projectedCoverage,
            financialImpact: totalInvestment,
            aiVerdict: `A compra de **${quantity} unidades** de ${sku} eleva sua cobertura para **${projectedCoverage} dias**.\n\n` +
                `Embora o risco seja **${riskLevel}**, o prazo de ${paymentTerms} permite girar o estoque antes do vencimento da primeira parcela.\n\n` +
                `*Sugestão:* Tente negociar 5% de desconto para pagamento à vista se tiver caixa disponível.`
        },
        charts: {
            // Mock data for a line chart (Stock Level over Time)
            projection: [
                { day: 'Hoje', stock: quantity + 50 },
                { day: '+15d', stock: quantity + 20 },
                { day: '+30d', stock: quantity - 50 },
                { day: '+45d', stock: quantity - 120 },
            ]
        }
    };
}
