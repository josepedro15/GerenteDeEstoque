-- ============================================================
-- ANÁLISE COMPLETA DE ESTOQUE - VERSÃO COMPLETA
-- ============================================================
-- FUNCIONALIDADES:
-- ✅ Estoque atual + em trânsito (data futura)
-- ✅ Relacionamento Produto → Fornecedor (derivado)
-- ✅ Curva ABC + Tendência + Status de Ruptura
-- ✅ Sugestão de compra ajustada
-- ============================================================
-- APENAS LEITURA - SEM ESCRITA NO BANCO
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
-- CTE 2: Vendas 30 dias (atual vs anterior - para tendência)
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
-- CTE 3: Estoque atual (apenas mês mais recente)
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
-- CTE 4: ESTOQUE EM TRÂNSITO (compras não recebidas)
-- ============================================================
estoque_transito AS (
    SELECT 
        ci.id_produto,
        SUM(ci.quantidade) AS qtd_em_transito,
        COUNT(DISTINCT c.id) AS qtd_pedidos_abertos,
        MIN(c.emissao) AS pedido_mais_antigo,
        MAX(c.emissao) AS pedido_mais_recente,
        CURRENT_DATE - MIN(c.emissao)::date AS dias_aguardando,
        STRING_AGG(DISTINCT TRIM(f.nome), ' | ' ORDER BY TRIM(f.nome)) AS fornecedores_pendentes
    FROM v_compras c
    JOIN v_compras_itens ci ON c.id = ci.id_compra
    LEFT JOIN v_fornecedores f ON c.id_fornecedor = f.id
    WHERE c.id_loja = 1
      AND c.entrada IS NULL           -- Ainda não recebeu
      AND c.devolucao = 0             -- Não é devolução
    GROUP BY ci.id_produto
),

-- ============================================================
-- CTE 5: FORNECEDOR POR PRODUTO (derivado do histórico)
-- ============================================================
fornecedor_por_produto AS (
    SELECT 
        ci.id_produto,
        c.id_fornecedor,
        TRIM(f.nome) AS fornecedor_nome,
        TRIM(f.codigo) AS fornecedor_codigo,
        COUNT(DISTINCT c.id) AS qtd_compras,
        SUM(ci.quantidade) AS qtd_total_comprada,
        SUM(ci.valor_total::numeric) AS valor_total_comprado,
        MAX(c.emissao) AS ultima_compra,
        ROW_NUMBER() OVER (
            PARTITION BY ci.id_produto 
            ORDER BY COUNT(DISTINCT c.id) DESC, MAX(c.emissao) DESC
        ) AS rank_fornecedor
    FROM v_compras c
    JOIN v_compras_itens ci ON c.id = ci.id_compra
    JOIN v_fornecedores f ON c.id_fornecedor = f.id
    WHERE c.devolucao = 0
      AND c.id_loja = 1
    GROUP BY ci.id_produto, c.id_fornecedor, f.nome, f.codigo
),

-- Fornecedor PRINCIPAL (mais compras ou mais recente)
fornecedor_principal AS (
    SELECT 
        id_produto,
        id_fornecedor,
        fornecedor_nome,
        fornecedor_codigo,
        qtd_compras,
        ultima_compra
    FROM fornecedor_por_produto
    WHERE rank_fornecedor = 1
),

-- Lista de TODOS os fornecedores por produto
fornecedor_lista AS (
    SELECT 
        id_produto,
        COUNT(DISTINCT id_fornecedor) AS qtd_fornecedores,
        STRING_AGG(DISTINCT fornecedor_nome, ' | ' ORDER BY fornecedor_nome) AS todos_fornecedores
    FROM fornecedor_por_produto
    GROUP BY id_produto
),

-- ============================================================
-- CTE 6: Curva ABC (baseado em faturamento 60 dias)
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
        ROUND((faturamento_acumulado / NULLIF(faturamento_total, 0)) * 100, 2) AS percentual_acumulado,
        CASE 
            WHEN (faturamento_acumulado / NULLIF(faturamento_total, 0)) * 100 <= 80 THEN 'A'
            WHEN (faturamento_acumulado / NULLIF(faturamento_total, 0)) * 100 <= 95 THEN 'B'
            ELSE 'C'
        END AS classe_abc
    FROM curva_abc_calc
),

-- ============================================================
-- CTE 7: CÁLCULO PRINCIPAL COM TODOS OS INDICADORES
-- ============================================================
detalhe_calculado AS (
    SELECT
        p.id AS id_produto,
        TRIM(p.descricao) AS produto_descricao,
        
        -- ========== FORNECEDOR ==========
        COALESCE(fp.fornecedor_nome, '(Sem fornecedor)') AS fornecedor_principal,
        fp.fornecedor_codigo AS cod_fornecedor,
        COALESCE(fp.qtd_compras, 0) AS compras_do_fornecedor,
        fp.ultima_compra AS ultima_compra_fornecedor,
        COALESCE(fl.qtd_fornecedores, 0) AS qtd_fornecedores,
        fl.todos_fornecedores,
        
        -- ========== ESTOQUE ==========
        COALESCE(ea.estoque_total, 0) AS estoque_atual,
        COALESCE(et.qtd_em_transito, 0) AS estoque_transito,
        COALESCE(ea.estoque_total, 0) + COALESCE(et.qtd_em_transito, 0) AS estoque_projetado,
        
        -- ========== INFO TRÂNSITO ==========
        COALESCE(et.qtd_pedidos_abertos, 0) AS pedidos_abertos,
        et.dias_aguardando,
        et.fornecedores_pendentes,
        
        -- ========== PREÇOS ==========
        COALESCE(p.preco, 0) AS preco,
        COALESCE(p.custo, 0) AS custo,
        ROUND(COALESCE(p.preco, 0) - COALESCE(p.custo, 0), 2) AS margem_unitaria,
        CASE 
            WHEN COALESCE(p.preco, 0) = 0 THEN 0
            ELSE ROUND(((p.preco - p.custo) / p.preco) * 100, 2)
        END AS margem_percentual,
        
        -- ========== VENDAS ==========
        COALESCE(v60d.qtd_vendida_60d, 0) AS qtd_vendida_60d,
        COALESCE(v60d.faturamento_60d, 0) AS faturamento_60d,
        ROUND((COALESCE(p.preco, 0) - COALESCE(p.custo, 0)) * COALESCE(v60d.qtd_vendida_60d, 0), 2) AS lucro_60d,
        ROUND(COALESCE(v60d.qtd_vendida_60d, 0) / 60.0, 2) AS media_diaria_venda,
        
        -- ========== DIAS DE COBERTURA (ATUAL) ==========
        CASE 
            WHEN COALESCE(v60d.qtd_vendida_60d, 0) = 0 THEN 999.0 
            ELSE ROUND(COALESCE(ea.estoque_total, 0) / (NULLIF(COALESCE(v60d.qtd_vendida_60d, 0), 0) / 60.0), 1)
        END AS dias_cobertura_atual,
        
        -- ========== DIAS DE COBERTURA PROJETADO ==========
        CASE 
            WHEN COALESCE(v60d.qtd_vendida_60d, 0) = 0 THEN 999.0 
            ELSE ROUND(
                (COALESCE(ea.estoque_total, 0) + COALESCE(et.qtd_em_transito, 0)) 
                / (NULLIF(COALESCE(v60d.qtd_vendida_60d, 0), 0) / 60.0)
            , 1)
        END AS dias_cobertura_projetado,
        
        -- ========== STATUS DE RUPTURA AJUSTADO ==========
        CASE
            WHEN COALESCE(ea.estoque_total, 0) = 0 
                 AND COALESCE(et.qtd_em_transito, 0) = 0 
                 AND COALESCE(v60d.qtd_vendida_60d, 0) > 0 
            THEN '🔴 Ruptura'
            
            WHEN COALESCE(ea.estoque_total, 0) = 0 
                 AND COALESCE(et.qtd_em_transito, 0) > 0 
                 AND COALESCE(v60d.qtd_vendida_60d, 0) > 0 
            THEN '🟣 Chegando'
            
            WHEN COALESCE(v60d.qtd_vendida_60d, 0) = 0 
                 OR (COALESCE(ea.estoque_total, 0) / (NULLIF(COALESCE(v60d.qtd_vendida_60d, 0), 0) / 60.0)) > 90 
            THEN '⚪ Excesso'
            
            WHEN (COALESCE(ea.estoque_total, 0) / (NULLIF(COALESCE(v60d.qtd_vendida_60d, 0), 0) / 60.0)) < 7 
            THEN '🟠 Crítico'
            
            WHEN (COALESCE(ea.estoque_total, 0) / (NULLIF(COALESCE(v60d.qtd_vendida_60d, 0), 0) / 60.0)) <= 15 
            THEN '🟡 Atenção'
            
            WHEN (COALESCE(ea.estoque_total, 0) / (NULLIF(COALESCE(v60d.qtd_vendida_60d, 0), 0) / 60.0)) <= 90 
            THEN '🟢 Saudável'
            
            ELSE 'Status Desconhecido'
        END AS status_ruptura,
        
        -- ========== CURVA ABC ==========
        COALESCE(abc.classe_abc, 'C') AS classe_abc,
        COALESCE(abc.percentual_acumulado, 100) AS percentual_acumulado_abc,
        
        -- ========== GIRO ==========
        CASE 
            WHEN COALESCE(ea.estoque_total, 0) = 0 THEN 0
            ELSE ROUND((COALESCE(v60d.qtd_vendida_60d, 0) / 2) / NULLIF(ea.estoque_total, 0), 2)
        END AS giro_mensal,
        
        -- ========== VALORES ==========
        ROUND(COALESCE(ea.estoque_total, 0) * COALESCE(p.custo, 0), 2) AS valor_estoque_custo,
        ROUND(COALESCE(ea.estoque_total, 0) * COALESCE(p.preco, 0), 2) AS valor_estoque_venda,
        ROUND(COALESCE(et.qtd_em_transito, 0) * COALESCE(p.custo, 0), 2) AS valor_transito_custo,
        
        -- ========== SUGESTÃO DE COMPRA AJUSTADA ==========
        CASE 
            WHEN COALESCE(v60d.qtd_vendida_60d, 0) = 0 THEN 0
            ELSE GREATEST(0, ROUND(
                (COALESCE(v60d.qtd_vendida_60d, 0) / 60.0 * 60)
                - COALESCE(ea.estoque_total, 0)
                - COALESCE(et.qtd_em_transito, 0)
            , 0))
        END AS sugestao_compra_ajustada,
        
        -- Sugestão original (para comparação)
        CASE 
            WHEN COALESCE(v60d.qtd_vendida_60d, 0) = 0 THEN 0
            ELSE GREATEST(0, ROUND((COALESCE(v60d.qtd_vendida_60d, 0) / 60.0 * 60) - COALESCE(ea.estoque_total, 0), 0))
        END AS sugestao_compra_original,
        
        -- ========== TENDÊNCIA ==========
        COALESCE(v30a.qtd_vendida_atual, 0) AS vendas_periodo_atual,
        COALESCE(v30ant.qtd_vendida_anterior, 0) AS vendas_periodo_anterior,
        CASE 
            WHEN COALESCE(v30ant.qtd_vendida_anterior, 0) = 0 AND COALESCE(v30a.qtd_vendida_atual, 0) > 0 THEN '📈 Novo'
            WHEN COALESCE(v30ant.qtd_vendida_anterior, 0) = 0 THEN '➡️ Sem histórico'
            WHEN COALESCE(v30a.qtd_vendida_atual, 0) > COALESCE(v30ant.qtd_vendida_anterior, 0) * 1.1 THEN '📈 Subindo'
            WHEN COALESCE(v30a.qtd_vendida_atual, 0) < COALESCE(v30ant.qtd_vendida_anterior, 0) * 0.9 THEN '📉 Caindo'
            ELSE '➡️ Estável'
        END AS tendencia,
        CASE 
            WHEN COALESCE(v30ant.qtd_vendida_anterior, 0) = 0 THEN 0
            ELSE ROUND(((COALESCE(v30a.qtd_vendida_atual, 0) - COALESCE(v30ant.qtd_vendida_anterior, 0)) / NULLIF(v30ant.qtd_vendida_anterior, 0)) * 100, 1)
        END AS variacao_percentual,
        
        -- ========== ÚLTIMA VENDA ==========
        v60d.ultima_venda,
        CASE 
            WHEN v60d.ultima_venda IS NULL THEN 999
            ELSE (CURRENT_DATE - v60d.ultima_venda::date)
        END AS dias_sem_venda,
        
        -- ========== PRIORIDADE DE COMPRA ==========
        CASE
            WHEN COALESCE(ea.estoque_total, 0) = 0 
                 AND COALESCE(et.qtd_em_transito, 0) = 0 
                 AND COALESCE(v60d.qtd_vendida_60d, 0) > 0 
                 AND COALESCE(abc.classe_abc, 'C') = 'A' 
            THEN '1-URGENTE'
            
            WHEN (COALESCE(ea.estoque_total, 0) = 0 AND COALESCE(et.qtd_em_transito, 0) = 0 AND COALESCE(v60d.qtd_vendida_60d, 0) > 0 AND COALESCE(abc.classe_abc, 'C') = 'B')
                 OR ((COALESCE(ea.estoque_total, 0) / NULLIF(COALESCE(v60d.qtd_vendida_60d, 0) / 60.0, 0)) < 7 AND COALESCE(abc.classe_abc, 'C') = 'A')
            THEN '2-ALTA'
            
            WHEN (COALESCE(ea.estoque_total, 0) / NULLIF(COALESCE(v60d.qtd_vendida_60d, 0) / 60.0, 0)) < 7 
            THEN '3-MEDIA'
            
            WHEN (COALESCE(ea.estoque_total, 0) = 0 AND COALESCE(et.qtd_em_transito, 0) = 0 AND COALESCE(v60d.qtd_vendida_60d, 0) > 0 AND COALESCE(abc.classe_abc, 'C') = 'C')
                 OR ((COALESCE(ea.estoque_total, 0) / NULLIF(COALESCE(v60d.qtd_vendida_60d, 0) / 60.0, 0)) <= 15)
            THEN '4-BAIXA'
            
            WHEN COALESCE(et.qtd_em_transito, 0) > 0 
                 AND (COALESCE(ea.estoque_total, 0) + COALESCE(et.qtd_em_transito, 0)) / NULLIF(COALESCE(v60d.qtd_vendida_60d, 0) / 60.0, 0) >= 30
            THEN '6-AGUARDAR'
            
            ELSE '5-NENHUMA'
        END AS prioridade_compra,
        
        -- ========== ALERTA DE ESTOQUE ==========
        CASE
            WHEN COALESCE(v60d.qtd_vendida_60d, 0) = 0 AND COALESCE(ea.estoque_total, 0) > 0 THEN '💀 MORTO'
            WHEN (COALESCE(ea.estoque_total, 0) / NULLIF(COALESCE(v60d.qtd_vendida_60d, 0) / 60.0, 0)) > 365 AND COALESCE(abc.classe_abc, 'C') = 'C' THEN '🚨 LIQUIDAR'
            WHEN (COALESCE(ea.estoque_total, 0) / NULLIF(COALESCE(v60d.qtd_vendida_60d, 0) / 60.0, 0)) > 365 THEN '⚠️ AVALIAR'
            WHEN (COALESCE(ea.estoque_total, 0) / NULLIF(COALESCE(v60d.qtd_vendida_60d, 0) / 60.0, 0)) > 180 THEN '📋 ATENÇÃO'
            ELSE '✅ OK'
        END AS alerta_estoque
        
    FROM estoque_agrupado ea
    LEFT JOIN v_produtos p ON ea.id_produto = p.id
    LEFT JOIN vendas_60d v60d ON ea.id_produto = v60d.id_produto
    LEFT JOIN vendas_30d_atual v30a ON ea.id_produto = v30a.id_produto
    LEFT JOIN vendas_30d_anterior v30ant ON ea.id_produto = v30ant.id_produto
    LEFT JOIN curva_abc abc ON ea.id_produto = abc.id_produto
    LEFT JOIN estoque_transito et ON ea.id_produto = et.id_produto
    LEFT JOIN fornecedor_principal fp ON ea.id_produto = fp.id_produto
    LEFT JOIN fornecedor_lista fl ON ea.id_produto = fl.id_produto
)

-- ============================================================
-- SELECT FINAL
-- ============================================================
SELECT * FROM detalhe_calculado
ORDER BY 
    CASE prioridade_compra 
        WHEN '1-URGENTE' THEN 1 
        WHEN '2-ALTA' THEN 2 
        WHEN '3-MEDIA' THEN 3 
        WHEN '4-BAIXA' THEN 4 
        WHEN '5-NENHUMA' THEN 5
        WHEN '6-AGUARDAR' THEN 6
        ELSE 7 
    END,
    dias_cobertura_atual ASC,
    faturamento_60d DESC;
