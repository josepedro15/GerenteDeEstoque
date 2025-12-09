-- =============================================
-- RAW DATA LAYERS (ERP MIRRORS) - 14 TABLES
-- =============================================

-- 1. BASE RECORDS (Cadastros)

CREATE TABLE IF NOT EXISTS raw_produtos (
    sku VARCHAR(100) PRIMARY KEY,
    nome_produto TEXT,
    categoria VARCHAR(100),
    departamento VARCHAR(100),
    unidade_medida VARCHAR(20),
    custo_atual DECIMAL(10,2),
    preco_venda DECIMAL(10,2),
    status_produto VARCHAR(20), -- Ativo/Inativo
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS raw_clientes (
    id_cliente VARCHAR(50) PRIMARY KEY,
    nome_cliente TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    segmento VARCHAR(50),
    data_cadastro DATE,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS raw_fornecedores (
    id_fornecedor VARCHAR(50) PRIMARY KEY,
    nome_fornecedor TEXT,
    cnpj VARCHAR(20),
    cidade VARCHAR(100),
    lead_time_padrao INT,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS raw_lojas (
    id_loja VARCHAR(50) PRIMARY KEY,
    nome_loja TEXT,
    cidade VARCHAR(100),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS raw_vendedores (
    id_vendedor VARCHAR(50) PRIMARY KEY,
    nome_vendedor TEXT,
    id_loja VARCHAR(50),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. FINANCIALS (Financeiro)

CREATE TABLE IF NOT EXISTS raw_plano_contas (
    codigo_conta VARCHAR(50) PRIMARY KEY,
    descricao_conta TEXT,
    tipo_conta VARCHAR(20), -- Receita/Despesa
    grupo_conta VARCHAR(50),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS raw_formas_pagamentos (
    id_forma_pagto VARCHAR(50) PRIMARY KEY,
    descricao TEXT,
    taxa_adm DECIMAL(5,2),
    dias_recebimento INT,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS raw_contas_pagar (
    id_titulo VARCHAR(50) PRIMARY KEY,
    id_fornecedor VARCHAR(50),
    data_emissao DATE,
    data_vencimento DATE,
    data_pagamento DATE,
    valor_titulo DECIMAL(12,2),
    valor_pago DECIMAL(12,2),
    status_titulo VARCHAR(30), -- Aberto, Pago, Atrasado
    codigo_conta VARCHAR(50),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS raw_contas_receber (
    id_titulo VARCHAR(50) PRIMARY KEY,
    id_cliente VARCHAR(50),
    id_venda VARCHAR(50),
    data_emissao DATE,
    data_vencimento DATE,
    data_recebimento DATE,
    valor_titulo DECIMAL(12,2),
    valor_recebido DECIMAL(12,2),
    status_titulo VARCHAR(30),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. MOVEMENTS (Movimentação)

CREATE TABLE IF NOT EXISTS raw_estoque (
    id_registro SERIAL PRIMARY KEY,
    sku VARCHAR(100),
    id_loja VARCHAR(50),
    saldo_atual DECIMAL(10,2),
    estoque_minimo DECIMAL(10,2),
    estoque_maximo DECIMAL(10,2),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_estoque_sku_loja UNIQUE (sku, id_loja)
);

CREATE TABLE IF NOT EXISTS raw_vendas (
    id_venda VARCHAR(50) PRIMARY KEY,
    data_venda TIMESTAMP,
    id_cliente VARCHAR(50),
    id_vendedor VARCHAR(50),
    id_loja VARCHAR(50),
    valor_total DECIMAL(12,2),
    status_venda VARCHAR(30),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS raw_vendas_itens (
    id_item_venda VARCHAR(50) PRIMARY KEY,
    id_venda VARCHAR(50),
    sku VARCHAR(100),
    quantidade DECIMAL(10,2),
    valor_unitario DECIMAL(10,2),
    custo_unitario DECIMAL(10,2),
    desconto DECIMAL(10,2),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS raw_compras (
    id_pedido_compra VARCHAR(50) PRIMARY KEY,
    data_pedido TIMESTAMP,
    data_prevista_entrega DATE,
    id_fornecedor VARCHAR(50),
    id_loja VARCHAR(50),
    valor_total DECIMAL(12,2),
    status_pedido VARCHAR(30), -- Pendente, Entregue, Cancelado
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS raw_compras_itens (
    id_item_compra VARCHAR(50) PRIMARY KEY,
    id_pedido_compra VARCHAR(50),
    sku VARCHAR(100),
    quantidade_pedida DECIMAL(10,2),
    quantidade_entregue DECIMAL(10,2),
    valor_unitario DECIMAL(10,2),
    updated_at TIMESTAMP DEFAULT NOW()
);


-- =============================================
-- ANALYTICAL LAYERS (DATA MARTS)
-- =============================================

CREATE TABLE IF NOT EXISTS dm_analise_estoque (
    id_produto INT PRIMARY KEY,
    codigo_produto VARCHAR(50),
    nome_produto TEXT,
    tem_venda BOOLEAN,
    estoque_atual DECIMAL(10,2),
    demanda_media_dia DECIMAL(10,2),
    desvio_padrao_dia DECIMAL(10,2),
    demanda_total DECIMAL(10,2),
    dias_no_periodo INT,
    primeira_data DATE,
    ultima_data DATE,
    demanda_leadtime DECIMAL(10,2),
    estoque_seguranca DECIMAL(10,2),
    rop DECIMAL(10,2),
    quantidade_sugerida DECIMAL(10,2),
    cobertura_atual_dias DECIMAL(10,2),
    estoque_alvo DECIMAL(10,2),
    status VARCHAR(50),
    prioridade INT,
    preco_venda DECIMAL(10,2),
    custo DECIMAL(10,2),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela solicitada para análise de estoque
CREATE TABLE IF NOT EXISTS analise_estoque (
    id_produto INT PRIMARY KEY,
    data_referencia TIMESTAMP DEFAULT NOW(),
    codigo_produto VARCHAR(50),
    nome_produto TEXT,
    preco_venda DECIMAL(10,2),
    custo DECIMAL(10,2),
    tem_venda BOOLEAN,
    dias_com_venda INT,
    estoque_atual DECIMAL(10,2),
    demanda_media_dia DECIMAL(10,2),
    desvio_padrao_dia DECIMAL(10,2),
    demanda_total DECIMAL(10,2),
    dias_no_periodo INT,
    primeira_data TIMESTAMP,
    ultima_data TIMESTAMP,
    demanda_leadtime DECIMAL(10,2),
    estoque_seguranca DECIMAL(10,2),
    rop DECIMAL(10,2),
    estoque_alvo DECIMAL(10,2),
    quantidade_sugerida DECIMAL(10,2),
    cobertura_atual_dias DECIMAL(10,2),
    status VARCHAR(50),
    prioridade INT,
    updated_at TIMESTAMP DEFAULT NOW()
);
