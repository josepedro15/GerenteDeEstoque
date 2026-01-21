-- ============================================================
-- NOVA TABELA: pedidos_transito
-- Armazena pedidos de compra pendentes de recebimento
-- ============================================================
-- EXECUTAR NO SUPABASE (SQL Editor)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pedidos_transito (
    id BIGSERIAL PRIMARY KEY,
    
    -- Identificação do pedido
    id_pedido INTEGER NOT NULL,
    numero_nf TEXT NULL,
    
    -- Datas
    data_pedido DATE NOT NULL,
    dias_aguardando INTEGER NOT NULL DEFAULT 0,
    
    -- Status calculado
    status_pedido TEXT NOT NULL DEFAULT '🟢 RECENTE',
    -- 🔴 ATRASADO (> 30 dias)
    -- 🟡 PENDENTE (15-30 dias)
    -- 🟢 RECENTE (< 15 dias)
    
    -- Fornecedor
    fornecedor_nome TEXT NOT NULL,
    fornecedor_codigo TEXT NULL,
    fornecedor_telefone TEXT NULL,
    
    -- Valores e quantidades
    valor_pedido NUMERIC(15,2) NOT NULL DEFAULT 0,
    qtd_itens INTEGER NOT NULL DEFAULT 0,
    total_unidades NUMERIC(15,2) NOT NULL DEFAULT 0,
    
    -- Lista de produtos (texto concatenado)
    produtos TEXT NULL,
    
    -- Metadados
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint única: um registro por pedido
    CONSTRAINT pedidos_transito_unique UNIQUE (id_pedido)
);

-- ================================================
-- ÍNDICES
-- ================================================

-- Índice principal por pedido
CREATE INDEX IF NOT EXISTS idx_pedidos_transito_id 
ON public.pedidos_transito USING btree (id_pedido);

-- Índice por fornecedor
CREATE INDEX IF NOT EXISTS idx_pedidos_transito_fornecedor 
ON public.pedidos_transito USING btree (fornecedor_nome);

-- Índice por dias aguardando (ordenação)
CREATE INDEX IF NOT EXISTS idx_pedidos_transito_dias 
ON public.pedidos_transito USING btree (dias_aguardando DESC);

-- Índice por status
CREATE INDEX IF NOT EXISTS idx_pedidos_transito_status 
ON public.pedidos_transito USING btree (status_pedido);

-- Índice para pedidos atrasados
CREATE INDEX IF NOT EXISTS idx_pedidos_transito_atrasados 
ON public.pedidos_transito USING btree (dias_aguardando) 
WHERE dias_aguardando > 30;


-- ================================================
-- TRIGGER PARA UPDATED_AT
-- ================================================

CREATE TRIGGER trigger_pedidos_transito_updated_at
    BEFORE UPDATE ON public.pedidos_transito
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ================================================
-- COMENTÁRIOS
-- ================================================
COMMENT ON TABLE public.pedidos_transito IS 'Pedidos de compra pendentes de recebimento';
COMMENT ON COLUMN public.pedidos_transito.id_pedido IS 'ID do pedido no sistema origem';
COMMENT ON COLUMN public.pedidos_transito.numero_nf IS 'Número da nota fiscal';
COMMENT ON COLUMN public.pedidos_transito.data_pedido IS 'Data de emissão do pedido';
COMMENT ON COLUMN public.pedidos_transito.dias_aguardando IS 'Dias desde a emissão do pedido';
COMMENT ON COLUMN public.pedidos_transito.status_pedido IS 'Status: 🔴 ATRASADO, 🟡 PENDENTE, 🟢 RECENTE';
COMMENT ON COLUMN public.pedidos_transito.fornecedor_nome IS 'Nome do fornecedor';
COMMENT ON COLUMN public.pedidos_transito.fornecedor_codigo IS 'Código do fornecedor';
COMMENT ON COLUMN public.pedidos_transito.fornecedor_telefone IS 'Telefone do fornecedor';
COMMENT ON COLUMN public.pedidos_transito.valor_pedido IS 'Valor total do pedido';
COMMENT ON COLUMN public.pedidos_transito.qtd_itens IS 'Quantidade de itens/produtos no pedido';
COMMENT ON COLUMN public.pedidos_transito.total_unidades IS 'Total de unidades em todos os itens';
COMMENT ON COLUMN public.pedidos_transito.produtos IS 'Lista de produtos: "Cimento (x50), Tijolo (x1000)"';
