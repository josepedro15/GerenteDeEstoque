-- =============================================
-- MIGRAÇÃO 002: Adicionar Tabelas de Sazonalidade
-- FerragemMV - Sistema de Estoque Miranda Móveis
-- Data: 2026-01-21
-- =============================================

-- =============================================
-- TABELA: sales_history
-- Descrição: Histórico de vendas para análise sazonal
-- =============================================
CREATE TABLE IF NOT EXISTS sales_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sale_date DATE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_value DECIMAL(10,2) NOT NULL,
    source VARCHAR(50) DEFAULT 'import', -- 'import', 'manual', 'api'
    external_ref VARCHAR(100), -- Referência externa (nota fiscal, etc)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_history_product ON sales_history(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_history_date ON sales_history(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_history_month ON sales_history(EXTRACT(MONTH FROM sale_date));
CREATE INDEX IF NOT EXISTS idx_sales_history_year ON sales_history(EXTRACT(YEAR FROM sale_date));

COMMENT ON TABLE sales_history IS 'Histórico de vendas para análise de sazonalidade';
COMMENT ON COLUMN sales_history.source IS 'Origem do dado: import (planilha), manual, api';

-- =============================================
-- TABELA: product_seasonality
-- Descrição: Índices de sazonalidade calculados por produto/mês
-- =============================================
CREATE TABLE IF NOT EXISTS product_seasonality (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER, -- NULL para média histórica geral
    sales_count INTEGER DEFAULT 0,
    total_quantity INTEGER DEFAULT 0,
    total_value DECIMAL(12,2) DEFAULT 0,
    average_demand DECIMAL(10,2),
    seasonality_index DECIMAL(5,2) DEFAULT 1.0, -- 1.0 = normal, >1 = alta, <1 = baixa
    trend VARCHAR(20) DEFAULT 'stable', -- 'rising', 'falling', 'stable', 'peak', 'low'
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(product_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_product_seasonality_product ON product_seasonality(product_id);
CREATE INDEX IF NOT EXISTS idx_product_seasonality_month ON product_seasonality(month);
CREATE INDEX IF NOT EXISTS idx_product_seasonality_trend ON product_seasonality(trend);
CREATE INDEX IF NOT EXISTS idx_product_seasonality_index ON product_seasonality(seasonality_index);

COMMENT ON TABLE product_seasonality IS 'Índices de sazonalidade calculados por produto e mês';
COMMENT ON COLUMN product_seasonality.seasonality_index IS 'Índice: 1.0 = demanda normal, >1 = alta temporada, <1 = baixa temporada';
COMMENT ON COLUMN product_seasonality.trend IS 'Tendência: rising (crescendo), falling (caindo), stable, peak (pico), low (vale)';

-- Trigger para updated_at
CREATE TRIGGER trigger_product_seasonality_updated_at
    BEFORE UPDATE ON product_seasonality
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- TABELA: category_seasonality
-- Descrição: Sazonalidade agregada por categoria
-- =============================================
CREATE TABLE IF NOT EXISTS category_seasonality (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER,
    total_sales INTEGER DEFAULT 0,
    total_value DECIMAL(12,2) DEFAULT 0,
    seasonality_index DECIMAL(5,2) DEFAULT 1.0,
    trend VARCHAR(20) DEFAULT 'stable',
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(category_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_category_seasonality_category ON category_seasonality(category_id);
CREATE INDEX IF NOT EXISTS idx_category_seasonality_month ON category_seasonality(month);

COMMENT ON TABLE category_seasonality IS 'Sazonalidade agregada por categoria de produto';

-- =============================================
-- TABELA: supplier_seasonality
-- Descrição: Sazonalidade por fornecedor
-- =============================================
CREATE TABLE IF NOT EXISTS supplier_seasonality (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER,
    total_sales INTEGER DEFAULT 0,
    total_value DECIMAL(12,2) DEFAULT 0,
    seasonality_index DECIMAL(5,2) DEFAULT 1.0,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(supplier_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_supplier_seasonality_supplier ON supplier_seasonality(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_seasonality_month ON supplier_seasonality(month);

COMMENT ON TABLE supplier_seasonality IS 'Sazonalidade agregada por fornecedor';
