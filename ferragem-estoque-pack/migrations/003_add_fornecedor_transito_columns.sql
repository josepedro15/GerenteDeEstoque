-- ============================================================
-- MIGRAÇÃO: Adicionar campos de Fornecedor e Estoque em Trânsito
-- Tabela: dados_estoque
-- ============================================================
-- EXECUTAR NO SUPABASE (SQL Editor)
-- ============================================================

-- ================================================
-- PARTE 1: NOVOS CAMPOS DE FORNECEDOR
-- ================================================

-- Fornecedor principal (derivado do histórico de compras)
ALTER TABLE public.dados_estoque 
ADD COLUMN IF NOT EXISTS fornecedor_principal TEXT NULL;

-- Código do fornecedor
ALTER TABLE public.dados_estoque 
ADD COLUMN IF NOT EXISTS cod_fornecedor TEXT NULL;

-- Quantidade de compras deste fornecedor
ALTER TABLE public.dados_estoque 
ADD COLUMN IF NOT EXISTS compras_do_fornecedor INTEGER NULL DEFAULT 0;

-- Data da última compra do fornecedor
ALTER TABLE public.dados_estoque 
ADD COLUMN IF NOT EXISTS ultima_compra_fornecedor TIMESTAMPTZ NULL;

-- Quantidade de fornecedores alternativos
ALTER TABLE public.dados_estoque 
ADD COLUMN IF NOT EXISTS qtd_fornecedores INTEGER NULL DEFAULT 0;

-- Lista de todos os fornecedores (separados por |)
ALTER TABLE public.dados_estoque 
ADD COLUMN IF NOT EXISTS todos_fornecedores TEXT NULL;


-- ================================================
-- PARTE 2: CAMPOS DE ESTOQUE EM TRÂNSITO
-- ================================================

-- Quantidade em trânsito (pedidos não recebidos)
ALTER TABLE public.dados_estoque 
ADD COLUMN IF NOT EXISTS estoque_transito NUMERIC NULL DEFAULT 0;

-- Estoque projetado (atual + trânsito)
ALTER TABLE public.dados_estoque 
ADD COLUMN IF NOT EXISTS estoque_projetado NUMERIC NULL DEFAULT 0;

-- Quantidade de pedidos abertos
ALTER TABLE public.dados_estoque 
ADD COLUMN IF NOT EXISTS pedidos_abertos INTEGER NULL DEFAULT 0;

-- Dias aguardando recebimento
ALTER TABLE public.dados_estoque 
ADD COLUMN IF NOT EXISTS dias_aguardando INTEGER NULL;

-- Fornecedores com pedidos pendentes
ALTER TABLE public.dados_estoque 
ADD COLUMN IF NOT EXISTS fornecedores_pendentes TEXT NULL;

-- Dias de cobertura considerando trânsito
ALTER TABLE public.dados_estoque 
ADD COLUMN IF NOT EXISTS dias_cobertura_projetado NUMERIC NULL;

-- Valor do estoque em trânsito (a custo)
ALTER TABLE public.dados_estoque 
ADD COLUMN IF NOT EXISTS valor_transito_custo NUMERIC NULL DEFAULT 0;

-- Sugestão de compra ajustada (desconta trânsito)
ALTER TABLE public.dados_estoque 
ADD COLUMN IF NOT EXISTS sugestao_compra_ajustada NUMERIC NULL DEFAULT 0;


-- ================================================
-- PARTE 3: ÍNDICES ADICIONAIS
-- ================================================

-- Índice para busca por fornecedor
CREATE INDEX IF NOT EXISTS idx_dados_estoque_fornecedor 
ON public.dados_estoque USING btree (fornecedor_principal);

-- Índice para filtrar produtos com estoque em trânsito
CREATE INDEX IF NOT EXISTS idx_dados_estoque_transito 
ON public.dados_estoque USING btree (estoque_transito) 
WHERE estoque_transito > 0;

-- Índice para pedidos abertos
CREATE INDEX IF NOT EXISTS idx_dados_estoque_pedidos 
ON public.dados_estoque USING btree (pedidos_abertos) 
WHERE pedidos_abertos > 0;


-- ================================================
-- COMENTÁRIOS DAS NOVAS COLUNAS
-- ================================================
COMMENT ON COLUMN public.dados_estoque.fornecedor_principal IS 'Fornecedor principal derivado do histórico de compras';
COMMENT ON COLUMN public.dados_estoque.cod_fornecedor IS 'Código do fornecedor principal';
COMMENT ON COLUMN public.dados_estoque.compras_do_fornecedor IS 'Quantidade de compras realizadas com este fornecedor';
COMMENT ON COLUMN public.dados_estoque.ultima_compra_fornecedor IS 'Data da última compra com o fornecedor principal';
COMMENT ON COLUMN public.dados_estoque.qtd_fornecedores IS 'Quantidade de fornecedores alternativos para este produto';
COMMENT ON COLUMN public.dados_estoque.todos_fornecedores IS 'Lista de todos os fornecedores separados por |';
COMMENT ON COLUMN public.dados_estoque.estoque_transito IS 'Quantidade em pedidos de compra não recebidos';
COMMENT ON COLUMN public.dados_estoque.estoque_projetado IS 'Estoque atual + estoque em trânsito';
COMMENT ON COLUMN public.dados_estoque.pedidos_abertos IS 'Quantidade de pedidos de compra pendentes';
COMMENT ON COLUMN public.dados_estoque.dias_aguardando IS 'Dias desde o pedido mais antigo não recebido';
COMMENT ON COLUMN public.dados_estoque.fornecedores_pendentes IS 'Fornecedores com pedidos pendentes de recebimento';
COMMENT ON COLUMN public.dados_estoque.dias_cobertura_projetado IS 'Dias de cobertura considerando estoque em trânsito';
COMMENT ON COLUMN public.dados_estoque.valor_transito_custo IS 'Valor do estoque em trânsito a preço de custo';
COMMENT ON COLUMN public.dados_estoque.sugestao_compra_ajustada IS 'Sugestão de compra descontando o que já está em trânsito';
