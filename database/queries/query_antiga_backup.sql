-- ============================================================
-- ANÁLISE COMPLETA DE ESTOQUE - Gerente de Estoque
-- PERÍODO: 60 DIAS (otimizado para depósito de materiais de construção)
-- ============================================================
-- CORREÇÃO APLICADA: Filtro por mês mais recente no estoque
-- ============================================================

WITH 
-- ============================================================
-- CTE 1: Vendas dos últimos 60 dias
-- ============================================================
vendas_60d AS (
    SELECT 
        t2.id_produto, 
        SUM(ABS(t2.quantidade)) AS qtd_vendida_60d,
        SUM(ABS(t2.quantidade) * t2.preco_unitario) AS faturamento_60d,
        MAX(t1.emissao) AS ultima_venda
    FROM v_vendas t1 
    JOIN v_vendas_itens t2 ON t1.id = t2.id_v_vendas
    WHERE t1.emissao >= (CURRENT_DATE - INTERVAL '60 days')
      AND t2.quantidade > 0
    GROUP BY t2.id_produto
),

-- ============================================================
-- CTE 2: Vendas dos 30 dias ANTERIORES vs últimos 30 dias (para tendência)
-- ============================================================
vendas_30d_atual AS (
    SELECT 
        t2.id_produto, 
        SUM(ABS(t2.quantidade)) AS qtd_vendida_atual,
        SUM(ABS(t2.quantidade) * t2.preco_unitario) AS faturamento_atual
    FROM v_vendas t1 
    JOIN v_vendas_itens t2 ON t1.id = t2.id_v_vendas
    WHERE t1.emissao >= (CURRENT_DATE - INTERVAL '30 days')
      AND t2.quantidade > 0
    GROUP BY t2.id_produto
),

vendas_30d_anterior AS (
    SELECT 
        t2.id_produto, 
        SUM(ABS(t2.quantidade)) AS qtd_vendida_anterior,
        SUM(ABS(t2.quantidade) * t2.preco_unitario) AS faturamento_anterior
    FROM v_vendas t1 
    JOIN v_vendas_itens t2 ON t1.id = t2.id_v_vendas
    WHERE t1.emissao >= (CURRENT_DATE - INTERVAL '60 days')
      AND t1.emissao < (CURRENT_DATE - INTERVAL '30 days')
      AND t2.quantidade > 0
    GROUP BY t2.id_produto
),

-- ============================================================
-- CTE 3: Estoque agrupado por produto (CORRIGIDO - APENAS MÊS ATUAL)
-- ============================================================
estoque_agrupado AS (
    SELECT 
        id_produto,
        SUM(quantidade) AS estoque_total
    FROM v_estoque
    WHERE id_loja = 1
      AND anomes = (SELECT MAX(anomes) FROM v_estoque WHERE id_loja = 1)
    GROUP BY id_produto
),

-- ============================================================
-- CTE 4: Cálculo da Curva ABC (baseado em 60 dias)
-- ============================================================
curva_abc_calc AS (
    SELECT 
        id_produto,
        faturamento_60d,
        SUM(faturamento_60d) OVER (ORDER BY faturamento_60d DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS faturamento_acumulado,
        SUM(faturamento_60d) OVER () AS faturamento_total
    FROM vendas_60d
),

curva_abc AS (
    SELECT 
        id_produto,
        faturamento_60d,
        faturamento_total,
        ROUND((faturamento_acumulado / NULLIF(faturamento_total,
0)) * 100,
2) AS percentual_acumulado,
        CASE 
            WHEN (faturamento_acumulado / NULLIF(faturamento_total,
0)) * 100 <= 80 THEN 'A'
            WHEN (faturamento_acumulado / NULLIF(faturamento_total,
0)) * 100 <= 95 THEN 'B'
            ELSE 'C'
        END AS classe_abc
    FROM curva_abc_calc
),

-- ============================================================
-- CTE 5: Cálculo principal com TODOS os indicadores
-- ============================================================
detalhe_calculado AS (
    SELECT
        p.id AS id_produto,
        TRIM(p.descricao) AS produto_descricao,
        COALESCE(ea.estoque_total,
0) AS estoque_atual,
        COALESCE(p.preco,
0) AS preco,
        COALESCE(p.custo,
0) AS custo,
        ROUND(COALESCE(p.preco,
0) - COALESCE(p.custo,
0),
2) AS margem_unitaria,
        CASE 
            WHEN COALESCE(p.preco,
0) = 0 THEN 0
            ELSE ROUND(((p.preco - p.custo) / p.preco) * 100,
2)
        END AS margem_percentual,
        COALESCE(v60d.qtd_vendida_60d,
0) AS qtd_vendida_60d,
        COALESCE(v60d.faturamento_60d,
0) AS faturamento_60d,
        ROUND((COALESCE(p.preco,
0) - COALESCE(p.custo,
0)) * COALESCE(v60d.qtd_vendida_60d,
0),
2) AS lucro_60d,
        ROUND(COALESCE(v60d.qtd_vendida_60d,
0) / 60.0,
2) AS media_diaria_venda,
        CASE 
            WHEN COALESCE(v60d.qtd_vendida_60d,
0) = 0 THEN 999.0 
            ELSE ROUND(COALESCE(ea.estoque_total,
0) / (NULLIF(COALESCE(v60d.qtd_vendida_60d,
0),
0) / 60.0),
1)
        END AS dias_de_cobertura,
        CASE
            WHEN COALESCE(ea.estoque_total,
0) = 0 AND COALESCE(v60d.qtd_vendida_60d,
0) > 0 THEN '🔴 Ruptura'
            WHEN COALESCE(v60d.qtd_vendida_60d,
0) = 0 
                 OR (COALESCE(ea.estoque_total,
0) / (NULLIF(COALESCE(v60d.qtd_vendida_60d,
0),
0) / 60.0)) > 90 THEN '⚪ Excesso'
            WHEN (COALESCE(ea.estoque_total,
0) / (NULLIF(COALESCE(v60d.qtd_vendida_60d,
0),
0) / 60.0)) < 7 THEN '🟠 Crítico'
            WHEN (COALESCE(ea.estoque_total,
0) / (NULLIF(COALESCE(v60d.qtd_vendida_60d,
0),
0) / 60.0)) <= 15 THEN '🟡 Atenção'
            WHEN (COALESCE(ea.estoque_total,
0) / (NULLIF(COALESCE(v60d.qtd_vendida_60d,
0),
0) / 60.0)) <= 90 THEN '🟢 Saudável'
            ELSE 'Status Desconhecido'
        END AS status_ruptura,
        COALESCE(abc.classe_abc, 'C') AS classe_abc,
        COALESCE(abc.percentual_acumulado,
100) AS percentual_acumulado_abc,
        CASE 
            WHEN COALESCE(ea.estoque_total,
0) = 0 THEN 0
            ELSE ROUND((COALESCE(v60d.qtd_vendida_60d,
0) / 2) / NULLIF(ea.estoque_total,
0),
2)
        END AS giro_mensal,
        ROUND(COALESCE(ea.estoque_total,
0) * COALESCE(p.custo,
0),
2) AS valor_estoque_custo,
        ROUND(COALESCE(ea.estoque_total,
0) * COALESCE(p.preco,
0),
2) AS valor_estoque_venda,
        CASE 
            WHEN COALESCE(v60d.qtd_vendida_60d,
0) = 0 THEN 0
            ELSE GREATEST(0, ROUND((COALESCE(v60d.qtd_vendida_60d,
0) / 60.0 * 60) - COALESCE(ea.estoque_total,
0),
0))
        END AS sugestao_compra_60d,
        COALESCE(v30a.qtd_vendida_atual,
0) AS vendas_periodo_atual,
        COALESCE(v30ant.qtd_vendida_anterior,
0) AS vendas_periodo_anterior,
        CASE 
            WHEN COALESCE(v30ant.qtd_vendida_anterior,
0) = 0 AND COALESCE(v30a.qtd_vendida_atual,
0) > 0 THEN '📈 Novo'
            WHEN COALESCE(v30ant.qtd_vendida_anterior,
0) = 0 THEN '➡️ Sem histórico'
            WHEN COALESCE(v30a.qtd_vendida_atual,
0) > COALESCE(v30ant.qtd_vendida_anterior,
0) * 1.1 THEN '📈 Subindo'
            WHEN COALESCE(v30a.qtd_vendida_atual,
0) < COALESCE(v30ant.qtd_vendida_anterior,
0) * 0.9 THEN '📉 Caindo'
            ELSE '➡️ Estável'
        END AS tendencia,
        CASE 
            WHEN COALESCE(v30ant.qtd_vendida_anterior,
0) = 0 THEN 0
            ELSE ROUND(((COALESCE(v30a.qtd_vendida_atual,
0) - COALESCE(v30ant.qtd_vendida_anterior,
0)) / NULLIF(v30ant.qtd_vendida_anterior,
0)) * 100,
1)
        END AS variacao_percentual,
        v60d.ultima_venda,
        CASE 
            WHEN v60d.ultima_venda IS NULL THEN 999
            ELSE (CURRENT_DATE - v60d.ultima_venda: :date)
        END AS dias_sem_venda,
        CASE
            WHEN COALESCE(ea.estoque_total,
0) = 0 AND COALESCE(v60d.qtd_vendida_60d,
0) > 0 AND COALESCE(abc.classe_abc, 'C') = 'A' THEN '1-URGENTE'
            WHEN COALESCE(ea.estoque_total,
0) = 0 AND COALESCE(v60d.qtd_vendida_60d,
0) > 0 AND COALESCE(abc.classe_abc, 'C') = 'B' THEN '2-ALTA'
            WHEN (COALESCE(ea.estoque_total,
0) / NULLIF(COALESCE(v60d.qtd_vendida_60d,
0) / 60.0,
0)) < 7 AND COALESCE(abc.classe_abc, 'C') = 'A' THEN '2-ALTA'
            WHEN COALESCE(ea.estoque_total,
0) = 0 AND COALESCE(v60d.qtd_vendida_60d,
0) > 0 AND COALESCE(abc.classe_abc, 'C') = 'C' THEN '4-BAIXA'
            WHEN (COALESCE(ea.estoque_total,
0) / NULLIF(COALESCE(v60d.qtd_vendida_60d,
0) / 60.0,
0)) < 7 THEN '3-MEDIA'
            WHEN (COALESCE(ea.estoque_total,
0) / NULLIF(COALESCE(v60d.qtd_vendida_60d,
0) / 60.0,
0)) <= 15 THEN '4-BAIXA'
            ELSE '5-NENHUMA'
        END AS prioridade_compra,
        CASE
            WHEN COALESCE(v60d.qtd_vendida_60d,
0) = 0 AND COALESCE(ea.estoque_total,
0) > 0 THEN '💀 MORTO'
            WHEN (COALESCE(ea.estoque_total,
0) / NULLIF(COALESCE(v60d.qtd_vendida_60d,
0) / 60.0,
0)) > 365 AND COALESCE(abc.classe_abc, 'C') = 'C' THEN '🚨 LIQUIDAR'
            WHEN (COALESCE(ea.estoque_total,
0) / NULLIF(COALESCE(v60d.qtd_vendida_60d,
0) / 60.0,
0)) > 365 THEN '⚠️ AVALIAR'
            WHEN (COALESCE(ea.estoque_total,
0) / NULLIF(COALESCE(v60d.qtd_vendida_60d,
0) / 60.0,
0)) > 180 THEN '📋 ATENÇÃO'
            ELSE '✅ OK'
        END AS alerta_estoque
    FROM estoque_agrupado ea
    LEFT JOIN v_produtos p ON ea.id_produto = p.id
    LEFT JOIN vendas_60d v60d ON ea.id_produto = v60d.id_produto
    LEFT JOIN vendas_30d_atual v30a ON ea.id_produto = v30a.id_produto
    LEFT JOIN vendas_30d_anterior v30ant ON ea.id_produto = v30ant.id_produto
    LEFT JOIN curva_abc abc ON ea.id_produto = abc.id_produto
),

-- ============================================================
-- CTE 6: Sumário agregado por status
-- ============================================================
sumario_agregado AS (
    SELECT 
        status_ruptura, 
        COUNT(id_produto) AS total_produtos,
        SUM(valor_estoque_custo) AS total_valor_estoque,
        SUM(faturamento_60d) AS total_faturamento
    FROM detalhe_calculado 
    GROUP BY status_ruptura
),

-- ============================================================
-- CTE 7: Ranking por status
-- ============================================================
detalhe_amostrado AS (
    SELECT 
        *,
        ROW_NUMBER() OVER (
            PARTITION BY status_ruptura 
            ORDER BY 
                CASE prioridade_compra 
                    WHEN '1-URGENTE' THEN 1 
                    WHEN '2-ALTA' THEN 2 
                    WHEN '3-MEDIA' THEN 3 
                    WHEN '4-BAIXA' THEN 4 
                    ELSE 5 
                END,
                dias_de_cobertura ASC, 
                faturamento_60d DESC,
                id_produto ASC
        ) AS rank_por_status
    FROM detalhe_calculado
)

-- ============================================================
-- SELECT FINAL: Sumário + Detalhes
-- ============================================================
SELECT 
    1 AS tipo_registro_ordem,
    status_ruptura,
    total_produtos,
    total_valor_estoque,
    total_faturamento,
    NULL: :BIGINT AS rank_por_status,
    NULL: :INTEGER AS id_produto,
    NULL: :VARCHAR AS produto_descricao,
    NULL: :NUMERIC AS estoque_atual,
    NULL: :NUMERIC AS preco,
    NULL: :NUMERIC AS custo,
    NULL: :NUMERIC AS margem_unitaria,
    NULL: :NUMERIC AS margem_percentual,
    NULL: :NUMERIC AS qtd_vendida_60d,
    NULL: :NUMERIC AS faturamento_60d,
    NULL: :NUMERIC AS lucro_60d,
    NULL: :NUMERIC AS media_diaria_venda,
    NULL: :NUMERIC AS dias_de_cobertura,
    NULL: :VARCHAR AS classe_abc,
    NULL: :NUMERIC AS percentual_acumulado_abc,
    NULL: :NUMERIC AS giro_mensal,
    NULL: :NUMERIC AS valor_estoque_custo,
    NULL: :NUMERIC AS valor_estoque_venda,
    NULL: :NUMERIC AS sugestao_compra_60d,
    NULL: :NUMERIC AS vendas_periodo_atual,
    NULL: :NUMERIC AS vendas_periodo_anterior,
    NULL: :VARCHAR AS tendencia,
    NULL: :NUMERIC AS variacao_percentual,
    NULL: :DATE AS ultima_venda,
    NULL: :INTEGER AS dias_sem_venda,
    NULL: :VARCHAR AS prioridade_compra,
    NULL: :VARCHAR AS alerta_estoque,
    'SUMARIO' AS tipo_registro
FROM sumario_agregado

UNION ALL

SELECT
    2 AS tipo_registro_ordem,
    status_ruptura,
    NULL: :BIGINT AS total_produtos,
    NULL: :NUMERIC AS total_valor_estoque,
    NULL: :NUMERIC AS total_faturamento,
    rank_por_status,
    id_produto,
    produto_descricao,
    estoque_atual,
    preco,
    custo,
    margem_unitaria,
    margem_percentual,
    qtd_vendida_60d,
    faturamento_60d,
    lucro_60d,
    media_diaria_venda,
    dias_de_cobertura,
    classe_abc,
    percentual_acumulado_abc,
    giro_mensal,
    valor_estoque_custo,
    valor_estoque_venda,
    sugestao_compra_60d,
    vendas_periodo_atual,
    vendas_periodo_anterior,
    tendencia,
    variacao_percentual,
    ultima_venda,
    dias_sem_venda,
    prioridade_compra,
    alerta_estoque,
    'DETALHE' AS tipo_registro
FROM detalhe_amostrado
WHERE rank_por_status <= 99999

ORDER BY tipo_registro_ordem, status_ruptura, rank_por_status;