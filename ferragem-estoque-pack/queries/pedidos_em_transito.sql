-- ============================================================
-- RELATÓRIO DE PEDIDOS EM TRÂNSITO (DATA FUTURA)
-- ============================================================
-- Lista todos os pedidos de compra ainda não recebidos
-- ============================================================

WITH 
-- Pedidos em aberto com detalhes
pedidos_abertos AS (
    SELECT 
        c.id AS id_compra,
        c.numero AS numero_nf,
        c.modelo,
        c.emissao AS data_pedido,
        CURRENT_DATE - c.emissao::date AS dias_aguardando,
        c.valor_total AS valor_pedido,
        c.id_fornecedor,
        TRIM(f.nome) AS fornecedor_nome,
        TRIM(f.codigo) AS fornecedor_codigo,
        f.telefone AS fornecedor_telefone,
        f.email AS fornecedor_email
    FROM v_compras c
    JOIN v_fornecedores f ON c.id_fornecedor = f.id
    WHERE c.id_loja = 1
      AND c.entrada IS NULL
      AND c.devolucao = 0
),

-- Itens dos pedidos em aberto
itens_pedidos AS (
    SELECT 
        ci.id_compra,
        ci.id_produto,
        TRIM(p.descricao) AS produto_descricao,
        ci.quantidade,
        ci.preco_unitario::numeric,
        ci.valor_total::numeric
    FROM v_compras_itens ci
    JOIN v_produtos p ON ci.id_produto = p.id
    JOIN pedidos_abertos pa ON ci.id_compra = pa.id_compra
)

-- ============================================================
-- RESULTADO: Pedidos em trânsito com itens
-- ============================================================
SELECT 
    pa.id_compra,
    pa.numero_nf,
    pa.data_pedido,
    pa.dias_aguardando,
    CASE 
        WHEN pa.dias_aguardando > 30 THEN '🔴 ATRASADO'
        WHEN pa.dias_aguardando > 15 THEN '🟡 PENDENTE'
        ELSE '🟢 RECENTE'
    END AS status_pedido,
    pa.fornecedor_nome,
    pa.fornecedor_codigo,
    pa.fornecedor_telefone,
    pa.valor_pedido::numeric,
    
    -- Agregações dos itens
    COUNT(ip.id_produto) AS qtd_itens,
    SUM(ip.quantidade) AS total_unidades,
    STRING_AGG(
        ip.produto_descricao || ' (x' || ip.quantidade::text || ')', 
        ', ' 
        ORDER BY ip.produto_descricao
    ) AS produtos

FROM pedidos_abertos pa
LEFT JOIN itens_pedidos ip ON pa.id_compra = ip.id_compra
GROUP BY 
    pa.id_compra,
    pa.numero_nf,
    pa.data_pedido,
    pa.dias_aguardando,
    pa.fornecedor_nome,
    pa.fornecedor_codigo,
    pa.fornecedor_telefone,
    pa.valor_pedido
ORDER BY 
    pa.dias_aguardando DESC,
    pa.data_pedido ASC;
