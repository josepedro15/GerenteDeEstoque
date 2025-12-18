import { describe, it, expect } from 'vitest';
import { parseNumber, normalizeStatus, cleanStatusText, formatCurrency } from './formatters';

describe('parseNumber', () => {
    it('deve retornar 0 para null ou undefined', () => {
        expect(parseNumber(null)).toBe(0);
        expect(parseNumber(undefined)).toBe(0);
    });

    it('deve retornar o número se já for number', () => {
        expect(parseNumber(42)).toBe(42);
        expect(parseNumber(3.14)).toBe(3.14);
    });

    it('deve parsear string simples', () => {
        expect(parseNumber('100')).toBe(100);
        expect(parseNumber('3.14')).toBe(3.14);
    });

    it('deve parsear formato brasileiro com vírgula decimal', () => {
        expect(parseNumber('100,50')).toBe(100.5);
        expect(parseNumber('1,5')).toBe(1.5);
    });

    it('deve parsear formato brasileiro completo (1.200,50)', () => {
        expect(parseNumber('1.200,50')).toBe(1200.5);
        expect(parseNumber('10.000,00')).toBe(10000);
        expect(parseNumber('1.234.567,89')).toBe(1234567.89);
    });
});

describe('normalizeStatus', () => {
    it('deve retornar DESCONHECIDO para null ou undefined', () => {
        expect(normalizeStatus(null)).toBe('DESCONHECIDO');
        expect(normalizeStatus(undefined)).toBe('DESCONHECIDO');
    });

    it('deve normalizar variações de CRÍTICO', () => {
        expect(normalizeStatus('CRÍTICO')).toBe('CRÍTICO');
        expect(normalizeStatus('CRITICO')).toBe('CRÍTICO');
        expect(normalizeStatus('crítico')).toBe('CRÍTICO');
        expect(normalizeStatus('🔴 RUPTURA')).toBe('CRÍTICO');
        expect(normalizeStatus('RUPTURA')).toBe('CRÍTICO');
    });

    it('deve normalizar variações de ATENÇÃO', () => {
        expect(normalizeStatus('ATENÇÃO')).toBe('ATENÇÃO');
        expect(normalizeStatus('ATENCAO')).toBe('ATENÇÃO');
        expect(normalizeStatus('🟡 Atenção')).toBe('ATENÇÃO');
    });

    it('deve normalizar variações de EXCESSO', () => {
        expect(normalizeStatus('EXCESSO')).toBe('EXCESSO');
        expect(normalizeStatus('excesso')).toBe('EXCESSO');
        expect(normalizeStatus('🔵 EXCESSO')).toBe('EXCESSO');
    });

    it('deve normalizar variações de SAUDÁVEL', () => {
        expect(normalizeStatus('SAUDÁVEL')).toBe('SAUDÁVEL');
        expect(normalizeStatus('SAUDAVEL')).toBe('SAUDÁVEL');
        expect(normalizeStatus('NORMAL')).toBe('SAUDÁVEL');
        expect(normalizeStatus('🟢 Saudável')).toBe('SAUDÁVEL');
    });

    it('deve retornar original se não reconhecer', () => {
        expect(normalizeStatus('OUTRO_STATUS')).toBe('OUTRO_STATUS');
    });
});

describe('cleanStatusText', () => {
    it('deve remover emojis do texto', () => {
        expect(cleanStatusText('🔴 RUPTURA')).toBe('RUPTURA');
        expect(cleanStatusText('🟢 Saudável')).toBe('Saudável');
        expect(cleanStatusText('🟡 Atenção')).toBe('Atenção');
    });

    it('deve manter texto sem emojis', () => {
        expect(cleanStatusText('RUPTURA')).toBe('RUPTURA');
        expect(cleanStatusText('Normal')).toBe('Normal');
    });

    it('deve remover espaços extras', () => {
        expect(cleanStatusText('  TESTE  ')).toBe('TESTE');
    });
});

describe('formatCurrency', () => {
    it('deve formatar para Real brasileiro', () => {
        expect(formatCurrency(1000)).toBe('R$\u00A01.000,00');
        expect(formatCurrency(1234.56)).toBe('R$\u00A01.234,56');
        expect(formatCurrency(0)).toBe('R$\u00A00,00');
    });

    it('deve formatar valores negativos', () => {
        expect(formatCurrency(-500)).toBe('-R$\u00A0500,00');
    });

    it('deve formatar centavos corretamente', () => {
        expect(formatCurrency(0.99)).toBe('R$\u00A00,99');
        expect(formatCurrency(0.01)).toBe('R$\u00A00,01');
    });
});
