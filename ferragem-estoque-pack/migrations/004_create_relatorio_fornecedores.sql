-- ============================================================
-- NOVA TABELA: relatorio_fornecedores
-- Armazena dados agregados por fornecedor
-- ============================================================
-- EXECUTAR NO SUPABASE (SQL Editor)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.relatorio_fornecedores (
    id BIGSERIAL PRIMARY KEY,
    
    -- Identificação do fornecedor
    id_fornecedor INTEGER NOT NULL,
    fornecedor TEXT NOT NULL,
    
    -- Contagens de produtos por status
    total_produtos INTEGER NOT NULL DEFAULT 0,
    produtos_ruptura INTEGER NOT NULL DEFAULT 0,
    produtos_chegando INTEGER NOT NULL DEFAULT 0,
    produtos_criticos INTEGER NOT NULL DEFAULT 0,
    produtos_atencao INTEGER NOT NULL DEFAULT 0,
    produtos_ok INTEGER NOT NULL DEFAULT 0,
    
    -- Valores financeiros
    valor_estoque_custo NUMERIC(15,2) NOT NULL DEFAULT 0,
    valor_transito_custo NUMERIC(15,2) NOT NULL DEFAULT 0,
    faturamento_60d NUMERIC(15,2) NOT NULL DEFAULT 0,
    
    -- Sugestão de compra
    total_unidades_sugeridas NUMERIC(15,2) NOT NULL DEFAULT 0,
    valor_sugestao_compra NUMERIC(15,2) NOT NULL DEFAULT 0,
    
    -- Indicadores
    percentual_ruptura NUMERIC(5,2) NOT NULL DEFAULT 0,
    
    -- Metadados
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint única: um registro por fornecedor
    CONSTRAINT relatorio_fornecedores_unique UNIQUE (id_fornecedor)
);

-- ================================================
-- ÍNDICES
-- ================================================

-- Índice principal por fornecedor
CREATE INDEX IF NOT EXISTS idx_relatorio_fornecedores_id 
ON public.relatorio_fornecedores USING btree (id_fornecedor);

-- Índice por nome do fornecedor
CREATE INDEX IF NOT EXISTS idx_relatorio_fornecedores_nome 
ON public.relatorio_fornecedores USING btree (fornecedor);

-- Índice para ordenação por ruptura
CREATE INDEX IF NOT EXISTS idx_relatorio_fornecedores_ruptura 
ON public.relatorio_fornecedores USING btree (produtos_ruptura DESC);

-- Índice para ordenação por valor de sugestão
CREATE INDEX IF NOT EXISTS idx_relatorio_fornecedores_sugestao 
ON public.relatorio_fornecedores USING btree (valor_sugestao_compra DESC);

-- Índice para fornecedores críticos (com ruptura ou críticos)
CREATE INDEX IF NOT EXISTS idx_relatorio_fornecedores_criticos 
ON public.relatorio_fornecedores USING btree (produtos_ruptura, produtos_criticos) 
WHERE produtos_ruptura > 0 OR produtos_criticos > 0;


-- ================================================
-- TRIGGER PARA UPDATED_AT
-- ================================================

-- Usa a mesma função já existente no banco
CREATE TRIGGER trigger_relatorio_fornecedores_updated_at
    BEFORE UPDATE ON public.relatorio_fornecedores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ================================================
-- COMENTÁRIOS
-- ================================================
COMMENT ON TABLE public.relatorio_fornecedores IS 'Relatório agregado de estoque por fornecedor';
COMMENT ON COLUMN public.relatorio_fornecedores.id_fornecedor IS 'ID do fornecedor no sistema origem';
COMMENT ON COLUMN public.relatorio_fornecedores.fornecedor IS 'Nome do fornecedor';
COMMENT ON COLUMN public.relatorio_fornecedores.total_produtos IS 'Total de produtos deste fornecedor';
COMMENT ON COLUMN public.relatorio_fornecedores.produtos_ruptura IS 'Produtos em ruptura (sem estoque e sem pedido)';
COMMENT ON COLUMN public.relatorio_fornecedores.produtos_chegando IS 'Produtos sem estoque mas com pedido chegando';
COMMENT ON COLUMN public.relatorio_fornecedores.produtos_criticos IS 'Produtos com menos de 7 dias de cobertura';
COMMENT ON COLUMN public.relatorio_fornecedores.produtos_atencao IS 'Produtos com 7-15 dias de cobertura';
COMMENT ON COLUMN public.relatorio_fornecedores.produtos_ok IS 'Produtos com estoque saudável';
COMMENT ON COLUMN public.relatorio_fornecedores.valor_estoque_custo IS 'Valor total do estoque a preço de custo';
COMMENT ON COLUMN public.relatorio_fornecedores.valor_transito_custo IS 'Valor em trânsito a preço de custo';
COMMENT ON COLUMN public.relatorio_fornecedores.faturamento_60d IS 'Faturamento dos últimos 60 dias';
COMMENT ON COLUMN public.relatorio_fornecedores.total_unidades_sugeridas IS 'Total de unidades sugeridas para compra';
COMMENT ON COLUMN public.relatorio_fornecedores.valor_sugestao_compra IS 'Valor total sugerido para compra (R$)';
COMMENT ON COLUMN public.relatorio_fornecedores.percentual_ruptura IS 'Percentual de produtos em ruptura';


-- ================================================
-- RLS (Row Level Security) - se necessário
-- ================================================
-- ALTER TABLE public.relatorio_fornecedores ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Acesso público de leitura" ON public.relatorio_fornecedores
--     FOR SELECT USING (true);
-- 
-- CREATE POLICY "Apenas sistema pode inserir/atualizar" ON public.relatorio_fornecedores
--     FOR ALL USING (auth.role() = 'service_role');
