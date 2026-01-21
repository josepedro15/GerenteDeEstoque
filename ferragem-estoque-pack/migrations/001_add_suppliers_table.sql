-- =============================================
-- MIGRAÇÃO 001: Adicionar Tabela de Fornecedores
-- FerragemMV - Sistema de Estoque Miranda Móveis
-- Data: 2026-01-21
-- =============================================

-- =============================================
-- TABELA: suppliers
-- Descrição: Fornecedores dos produtos
-- =============================================
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    cnpj VARCHAR(20) UNIQUE,
    payment_terms TEXT,
    delivery_days INTEGER,
    min_order_value DECIMAL(10,2),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_strategic BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para buscas frequentes
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(code);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_suppliers_strategic ON suppliers(is_strategic);
CREATE INDEX IF NOT EXISTS idx_suppliers_city ON suppliers(city);
CREATE INDEX IF NOT EXISTS idx_suppliers_state ON suppliers(state);

-- Comentários
COMMENT ON TABLE suppliers IS 'Fornecedores de produtos da loja';
COMMENT ON COLUMN suppliers.code IS 'Código interno do fornecedor';
COMMENT ON COLUMN suppliers.payment_terms IS 'Condições de pagamento acordadas';
COMMENT ON COLUMN suppliers.delivery_days IS 'Prazo médio de entrega em dias';
COMMENT ON COLUMN suppliers.min_order_value IS 'Valor mínimo de pedido em reais';
COMMENT ON COLUMN suppliers.is_strategic IS 'Indica se é um fornecedor estratégico para campanhas';

-- Trigger para updated_at
CREATE TRIGGER trigger_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ALTERAÇÃO: Adicionar supplier_id na tabela products
-- =============================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);

COMMENT ON COLUMN products.supplier_id IS 'Fornecedor principal do produto';
