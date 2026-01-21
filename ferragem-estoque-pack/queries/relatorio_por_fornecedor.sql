-- ============================================================
-- RELATÓRIO AGRUPADO POR FORNECEDOR
-- ============================================================
-- Visão consolidada de estoque e compras por fornecedor
-- ============================================================

WITH 
-- Estoque atual
estoque_agrupado AS (
    SELECT 
        id_produto,
        SUM(quantidade) AS estoque_total
    FROM v_estoque
    WHERE id_loja = 1
      AND anomes = (SELECT MAX(anomes) FROM v_estoque WHERE id_loja = 1)
    GROUP BY id_produto
),

-- Vendas 60 dias
vendas_60d AS (
    SELECT 
        t2.id_produto, 
        SUM(ABS(t2.quantidade)) AS qtd_vendida_60d,
        SUM(ABS(t2.quantidade) * t2.preco_unitario) AS faturamento_60d
    FROM v_vendas t1 
    JOIN v_vendas_itens t2 ON t1.id = t2.id_v_vendas
    WHERE t1.emissao >= (CURRENT_DATE - INTERVAL '60 days')
      AND t2.quantidade > 0
    GROUP BY t2.id_produto
),

-- Estoque em trânsito
estoque_transito AS (
    SELECT 
        ci.id_produto,
        SUM(ci.quantidade) AS qtd_em_transito
    FROM v_compras c
    JOIN v_compras_itens ci ON c.id = ci.id_compra
    WHERE c.id_loja = 1
      AND c.entrada IS NULL
      AND c.devolucao = 0
    GROUP BY ci.id_produto
),

-- Fornecedor principal por produto
fornecedor_por_produto AS (
    SELECT 
        ci.id_produto,
        c.id_fornecedor,
        TRIM(f.nome) AS fornecedor_nome,
        COUNT(DISTINCT c.id) AS qtd_compras,
        ROW_NUMBER() OVER (
            PARTITION BY ci.id_produto 
            ORDER BY COUNT(DISTINCT c.id) DESC, MAX(c.emissao) DESC
        ) AS rank_fornecedor
    FROM v_compras c
    JOIN v_compras_itens ci ON c.id = ci.id_compra
    JOIN v_fornecedores f ON c.id_fornecedor = f.id
    WHERE c.devolucao = 0
      AND c.id_loja = 1
    GROUP BY ci.id_produto, c.id_fornecedor, f.nome
),

fornecedor_principal AS (
    SELECT id_produto, id_fornecedor, fornecedor_nome
    FROM fornecedor_por_produto
    WHERE rank_fornecedor = 1
),

-- Status de ruptura por produto
produtos_status AS (
    SELECT
        ea.id_produto,
        COALESCE(fp.fornecedor_nome, '(Sem fornecedor)') AS fornecedor,
        COALESCE(fp.id_fornecedor, 0) AS id_fornecedor,
        COALESCE(ea.estoque_total, 0) AS estoque_atual,
        COALESCE(et.qtd_em_transito, 0) AS estoque_transito,
        COALESCE(v60d.qtd_vendida_60d, 0) AS vendas_60d,
        COALESCE(v60d.faturamento_60d, 0) AS faturamento_60d,
        COALESCE(p.custo, 0) AS custo,
        COALESCE(p.preco, 0) AS preco,
        -- Status
        CASE
            WHEN COALESCE(ea.estoque_total, 0) = 0 
                 AND COALESCE(et.qtd_em_transito, 0) = 0 
                 AND COALESCE(v60d.qtd_vendida_60d, 0) > 0 
            THEN 'RUPTURA'
            WHEN COALESCE(ea.estoque_total, 0) = 0 
                 AND COALESCE(et.qtd_em_transito, 0) > 0 
            THEN 'CHEGANDO'
            WHEN (COALESCE(ea.estoque_total, 0) / NULLIF(COALESCE(v60d.qtd_vendida_60d, 0) / 60.0, 0)) < 7 
            THEN 'CRITICO'
            WHEN (COALESCE(ea.estoque_total, 0) / NULLIF(COALESCE(v60d.qtd_vendida_60d, 0) / 60.0, 0)) <= 15 
            THEN 'ATENCAO'
            ELSE 'OK'
        END AS status,
        -- Sugestão de compra
        CASE 
            WHEN COALESCE(v60d.qtd_vendida_60d, 0) = 0 THEN 0
            ELSE GREATEST(0, ROUND(
                (COALESCE(v60d.qtd_vendida_60d, 0) / 60.0 * 60)
                - COALESCE(ea.estoque_total, 0)
                - COALESCE(et.qtd_em_transito, 0)
            , 0))
        END AS sugestao_compra
    FROM estoque_agrupado ea
    LEFT JOIN v_produtos p ON ea.id_produto = p.id
    LEFT JOIN vendas_60d v60d ON ea.id_produto = v60d.id_produto
    LEFT JOIN estoque_transito et ON ea.id_produto = et.id_produto
    LEFT JOIN fornecedor_principal fp ON ea.id_produto = fp.id_produto
)

-- ============================================================
-- RESULTADO AGRUPADO POR FORNECEDOR
-- ============================================================
SELECT 
    fornecedor,
    id_fornecedor,
    
    -- Contagens
    COUNT(*) AS total_produtos,
    SUM(CASE WHEN status = 'RUPTURA' THEN 1 ELSE 0 END) AS produtos_ruptura,
    SUM(CASE WHEN status = 'CHEGANDO' THEN 1 ELSE 0 END) AS produtos_chegando,
    SUM(CASE WHEN status = 'CRITICO' THEN 1 ELSE 0 END) AS produtos_criticos,
    SUM(CASE WHEN status = 'ATENCAO' THEN 1 ELSE 0 END) AS produtos_atencao,
    SUM(CASE WHEN status = 'OK' THEN 1 ELSE 0 END) AS produtos_ok,
    
    -- Valores
    ROUND(SUM(estoque_atual * custo), 2) AS valor_estoque_custo,
    ROUND(SUM(estoque_transito * custo), 2) AS valor_transito_custo,
    ROUND(SUM(faturamento_60d), 2) AS faturamento_60d,
    
    -- Sugestão de compra
    ROUND(SUM(sugestao_compra), 0) AS total_unidades_sugeridas,
    ROUND(SUM(sugestao_compra * custo), 2) AS valor_sugestao_compra,
    
    -- % de ruptura
    ROUND(
        SUM(CASE WHEN status = 'RUPTURA' THEN 1 ELSE 0 END)::numeric 
        / NULLIF(COUNT(*), 0) * 100
    , 1) AS percentual_ruptura

FROM produtos_status
GROUP BY fornecedor, id_fornecedor
ORDER BY 
    SUM(CASE WHEN status = 'RUPTURA' THEN 1 ELSE 0 END) DESC,
    SUM(sugestao_compra * custo) DESC;
