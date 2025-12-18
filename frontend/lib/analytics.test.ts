import { describe, it, expect } from 'vitest';
import { calculateDashboardMetrics, generateSuggestions } from './analytics';
import { EstoqueDetalhe } from '@/types/estoque';

// Helper para criar item de estoque fake
const createFakeItem = (overrides: Partial<EstoqueDetalhe> = {}): EstoqueDetalhe => ({
    id: 1,
    tipo_registro: 'DETALHE',
    id_produto: 'SKU001',
    produto_descricao: 'Produto Teste',
    estoque_atual: '100',
    media_diaria_venda: '10',
    dias_de_cobertura: '10',
    preco: '50',
    custo: '30',
    status_ruptura: 'SAUDÁVEL',
    ...overrides
});

describe('calculateDashboardMetrics', () => {
    it('deve retornar métricas zeradas para array vazio', () => {
        const result = calculateDashboardMetrics([]);

        expect(result.financial.totalInventoryValue).toBe(0);
        expect(result.financial.totalRevenuePotential).toBe(0);
        expect(result.financial.totalSkuCount).toBe(0);
        expect(result.risk.ruptureCount).toBe(0);
    });

    it('deve calcular valor total do estoque corretamente', () => {
        const items = [
            createFakeItem({ estoque_atual: '100', custo: '10' }), // 1000
            createFakeItem({ estoque_atual: '50', custo: '20' }),  // 1000
        ];

        const result = calculateDashboardMetrics(items);

        expect(result.financial.totalInventoryValue).toBe(2000);
    });

    it('deve calcular potencial de receita corretamente', () => {
        const items = [
            createFakeItem({ estoque_atual: '100', preco: '50' }), // 5000
            createFakeItem({ estoque_atual: '50', preco: '100' }), // 5000
        ];

        const result = calculateDashboardMetrics(items);

        expect(result.financial.totalRevenuePotential).toBe(10000);
    });

    it('deve calcular margem média corretamente', () => {
        const items = [
            createFakeItem({ estoque_atual: '100', custo: '30', preco: '50' }), // custo 3000, venda 5000, lucro 2000
        ];

        const result = calculateDashboardMetrics(items);

        // Lucro 2000 / Receita 5000 = 40%
        expect(result.financial.averageMargin).toBe(40);
    });

    it('deve contar itens em ruptura/crítico', () => {
        const items = [
            createFakeItem({ status_ruptura: 'RUPTURA' }),
            createFakeItem({ status_ruptura: 'CRÍTICO' }),
            createFakeItem({ status_ruptura: 'SAUDÁVEL' }),
            createFakeItem({ status_ruptura: 'EXCESSO' }),
        ];

        const result = calculateDashboardMetrics(items);

        expect(result.risk.ruptureCount).toBe(2);
        expect(result.risk.excessCount).toBe(1);
    });

    it('deve calcular share de ruptura corretamente', () => {
        const items = [
            createFakeItem({ status_ruptura: 'RUPTURA' }),
            createFakeItem({ status_ruptura: 'SAUDÁVEL' }),
            createFakeItem({ status_ruptura: 'SAUDÁVEL' }),
            createFakeItem({ status_ruptura: 'SAUDÁVEL' }),
        ];

        const result = calculateDashboardMetrics(items);

        // 1 ruptura de 4 itens = 25%
        expect(result.risk.ruptureShare).toBe(25);
    });

    it('deve gerar distribuição de status corretamente', () => {
        const items = [
            createFakeItem({ status_ruptura: 'RUPTURA' }),
            createFakeItem({ status_ruptura: 'CRÍTICO' }),
            createFakeItem({ status_ruptura: 'SAUDÁVEL' }),
            createFakeItem({ status_ruptura: 'SAUDÁVEL' }),
            createFakeItem({ status_ruptura: 'EXCESSO' }),
        ];

        const result = calculateDashboardMetrics(items);

        const critico = result.charts.statusDistribution.find(d => d.name === 'Crítico/Ruptura');
        const saudavel = result.charts.statusDistribution.find(d => d.name === 'Saudável');
        const excesso = result.charts.statusDistribution.find(d => d.name === 'Excesso');

        expect(critico?.value).toBe(2);
        expect(saudavel?.value).toBe(2);
        expect(excesso?.value).toBe(1);
    });

    it('deve identificar top 5 itens em ruptura', () => {
        const items = [
            createFakeItem({ id_produto: 'A', status_ruptura: 'RUPTURA', media_diaria_venda: '10', preco: '100' }),
            createFakeItem({ id_produto: 'B', status_ruptura: 'RUPTURA', media_diaria_venda: '5', preco: '100' }),
            createFakeItem({ id_produto: 'C', status_ruptura: 'SAUDÁVEL', media_diaria_venda: '100', preco: '100' }),
        ];

        const result = calculateDashboardMetrics(items);

        expect(result.topMovers.rupture.length).toBe(2);
        expect(result.topMovers.rupture[0].id).toBe('A'); // Maior perda diária
    });

    it('deve identificar top 5 itens em excesso', () => {
        const items = [
            createFakeItem({ id_produto: 'A', status_ruptura: 'EXCESSO', estoque_atual: '1000', custo: '10' }),
            createFakeItem({ id_produto: 'B', status_ruptura: 'EXCESSO', estoque_atual: '500', custo: '10' }),
            createFakeItem({ id_produto: 'C', status_ruptura: 'SAUDÁVEL', estoque_atual: '2000', custo: '10' }),
        ];

        const result = calculateDashboardMetrics(items);

        expect(result.topMovers.excess.length).toBe(2);
        expect(result.topMovers.excess[0].id).toBe('A'); // Maior capital parado
    });
});

describe('generateSuggestions', () => {
    it('deve gerar sugestão vazia para array vazio', () => {
        const result = generateSuggestions([]);
        expect(result).toHaveLength(0);
    });

    it('deve calcular quantidade sugerida baseado em dias de cobertura alvo', () => {
        const items = [
            createFakeItem({
                estoque_atual: '100',
                media_diaria_venda: '10',
                dias_de_cobertura: '10',
                status_ruptura: 'ATENÇÃO'
            })
        ];

        const result = generateSuggestions(items, 45);

        // Precisa de 45 dias * 10/dia = 450 unidades
        // Tem 100, precisa comprar 350
        expect(result[0].suggestedQty).toBe(350);
    });

    it('deve sugerir "Comprar Urgente" para item em RUPTURA', () => {
        const items = [
            createFakeItem({
                estoque_atual: '0',
                media_diaria_venda: '10',
                dias_de_cobertura: '0',
                status_ruptura: 'RUPTURA'
            })
        ];

        const result = generateSuggestions(items, 45);

        expect(result[0].suggestedAction).toBe('Comprar Urgente');
    });

    it('deve sugerir "Comprar Urgente" quando cobertura é zero', () => {
        const items = [
            createFakeItem({
                estoque_atual: '0',
                media_diaria_venda: '10',
                dias_de_cobertura: '0',
                status_ruptura: 'SAUDÁVEL'
            })
        ];

        const result = generateSuggestions(items, 45);

        expect(result[0].suggestedAction).toBe('Comprar Urgente');
    });

    it('deve sugerir "Comprar" quando cobertura < 15 dias', () => {
        const items = [
            createFakeItem({
                estoque_atual: '100',
                media_diaria_venda: '10',
                dias_de_cobertura: '10',
                status_ruptura: 'ATENÇÃO'
            })
        ];

        const result = generateSuggestions(items, 45);

        expect(result[0].suggestedAction).toBe('Comprar');
    });

    it('deve sugerir "Queimar Estoque" para item em EXCESSO', () => {
        const items = [
            createFakeItem({
                estoque_atual: '1000',
                media_diaria_venda: '1',
                dias_de_cobertura: '1000',
                status_ruptura: 'EXCESSO'
            })
        ];

        const result = generateSuggestions(items, 45);

        expect(result[0].suggestedAction).toBe('Queimar Estoque');
        expect(result[0].suggestedQty).toBe(0);
    });

    it('deve sugerir "Queimar Estoque" quando cobertura > 90 dias', () => {
        const items = [
            createFakeItem({
                estoque_atual: '1000',
                media_diaria_venda: '5',
                dias_de_cobertura: '200',
                status_ruptura: 'SAUDÁVEL'
            })
        ];

        const result = generateSuggestions(items, 45);

        expect(result[0].suggestedAction).toBe('Queimar Estoque');
    });

    it('deve sugerir "Aguardar" para estoque saudável com boa cobertura', () => {
        const items = [
            createFakeItem({
                estoque_atual: '300',
                media_diaria_venda: '5',
                dias_de_cobertura: '60',
                status_ruptura: 'SAUDÁVEL'
            })
        ];

        const result = generateSuggestions(items, 45);

        expect(result[0].suggestedAction).toBe('Aguardar');
    });

    it('deve ordenar por prioridade (Urgente > Comprar > Queimar > Aguardar)', () => {
        const items = [
            createFakeItem({ id_produto: 'A', dias_de_cobertura: '60', status_ruptura: 'SAUDÁVEL' }), // Aguardar
            createFakeItem({ id_produto: 'B', dias_de_cobertura: '0', status_ruptura: 'RUPTURA' }), // Urgente
            createFakeItem({ id_produto: 'C', dias_de_cobertura: '10', status_ruptura: 'ATENÇÃO' }), // Comprar
            createFakeItem({ id_produto: 'D', dias_de_cobertura: '200', status_ruptura: 'EXCESSO' }), // Queimar
        ];

        const result = generateSuggestions(items, 45);

        expect(result[0].suggestedAction).toBe('Comprar Urgente');
        expect(result[1].suggestedAction).toBe('Comprar');
        expect(result[2].suggestedAction).toBe('Queimar Estoque');
        expect(result[3].suggestedAction).toBe('Aguardar');
    });

    it('deve calcular custo de compra corretamente', () => {
        const items = [
            createFakeItem({
                estoque_atual: '100',
                media_diaria_venda: '10',
                custo: '25',
                dias_de_cobertura: '10',
                status_ruptura: 'ATENÇÃO'
            })
        ];

        const result = generateSuggestions(items, 45);

        // Sugestão: 350 unidades * R$ 25 = R$ 8.750
        expect(result[0].purchaseCost).toBe(8750);
    });

    it('não deve sugerir quantidade negativa', () => {
        const items = [
            createFakeItem({
                estoque_atual: '500', // Mais do que precisa
                media_diaria_venda: '5',
                dias_de_cobertura: '100',
                status_ruptura: 'SAUDÁVEL'
            })
        ];

        const result = generateSuggestions(items, 45);

        // 45 * 5 = 225 preciso, tenho 500, não comprar
        expect(result[0].suggestedQty).toBe(0);
    });
});
