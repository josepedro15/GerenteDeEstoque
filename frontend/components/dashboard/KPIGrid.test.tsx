import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KPIGrid } from './KPIGrid';

const mockMetrics = {
    totalInventoryValue: 150000,
    totalRevenuePotential: 250000,
    projectedProfit: 100000,
    averageMargin: 40,
    totalSkuCount: 500,
    ruptureShare: 5.5,
    averageGiro: 15,
    totalTransitValue: 20000,
    totalSugestaoAjustada: 50000,
};

describe('KPIGrid', () => {
    it('deve renderizar todos os 4 cards de KPI', () => {
        render(<KPIGrid metrics={mockMetrics} />);

        expect(screen.getByText('Valor em Estoque (Custo)')).toBeInTheDocument();
        expect(screen.getByText('Receita Potencial')).toBeInTheDocument();
        expect(screen.getByText('Lucro Projetado')).toBeInTheDocument();
        expect(screen.getByText('Share de Ruptura')).toBeInTheDocument();
    });

    it('deve exibir valores formatados em moeda', () => {
        render(<KPIGrid metrics={mockMetrics} />);

        // Usando regex para lidar com diferentes espaços (NBSP vs espaço normal)
        expect(screen.getByText(/R\$\s*150\.000,00/)).toBeInTheDocument();
        expect(screen.getByText(/R\$\s*250\.000,00/)).toBeInTheDocument();
        expect(screen.getByText(/R\$\s*100\.000,00/)).toBeInTheDocument();
    });

    it('deve exibir contagem de SKUs', () => {
        render(<KPIGrid metrics={mockMetrics} />);

        expect(screen.getByText('500 SKUs totais')).toBeInTheDocument();
    });

    it('deve exibir share de ruptura formatado', () => {
        render(<KPIGrid metrics={mockMetrics} />);

        expect(screen.getByText('5.5%')).toBeInTheDocument();
    });

    it('deve exibir margem projetada formatada', () => {
        render(<KPIGrid metrics={mockMetrics} />);

        expect(screen.getByText('Margem proj. 40.0%')).toBeInTheDocument();
    });

    it('deve renderizar corretamente com valores zero', () => {
        const zeroMetrics = {
            totalInventoryValue: 0,
            totalRevenuePotential: 0,
            projectedProfit: 0,
            averageMargin: 0,
            totalSkuCount: 0,
            ruptureShare: 0,
            averageGiro: 0,
            totalTransitValue: 0,
            totalSugestaoAjustada: 0,
        };


        render(<KPIGrid metrics={zeroMetrics} />);

        // Usando regex para capturar R$ 0,00 com qualquer tipo de espaço
        expect(screen.getAllByText(/R\$\s*0,00/).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('0 SKUs totais')).toBeInTheDocument();
        expect(screen.getByText('0.0%')).toBeInTheDocument();
    });
});
