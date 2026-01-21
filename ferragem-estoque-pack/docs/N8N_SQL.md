# SQL para n8n - Sincronização

## Workflow 1: Sync dados_estoque

### Node 1: TRUNCATE (antes do Split Out)
```sql
TRUNCATE TABLE dados_estoque;
```

### Node 2: INSERT (após Split Out)
```sql
INSERT INTO dados_estoque (
    id_produto,
    produto_descricao,
    fornecedor_principal,
    cod_fornecedor,
    compras_do_fornecedor,
    ultima_compra_fornecedor,
    qtd_fornecedores,
    todos_fornecedores,
    estoque_atual,
    estoque_transito,
    estoque_projetado,
    pedidos_abertos,
    dias_aguardando,
    fornecedores_pendentes,
    preco,
    custo,
    margem_unitaria,
    margem_percentual,
    qtd_vendida_60d,
    faturamento_60d,
    lucro_60d,
    media_diaria_venda,
    dias_de_cobertura,
    dias_cobertura_projetado,
    status_ruptura,
    classe_abc,
    percentual_acumulado_abc,
    giro_mensal,
    valor_estoque_custo,
    valor_estoque_venda,
    valor_transito_custo,
    sugestao_compra_ajustada,
    sugestao_compra_60d,
    vendas_periodo_atual,
    vendas_periodo_anterior,
    tendencia,
    variacao_percentual,
    ultima_venda,
    dias_sem_venda,
    prioridade_compra,
    alerta_estoque,
    updated_at
)
VALUES (
    {{ $json.id_produto }},
    {{ $json.produto_descricao ? "'" + $json.produto_descricao.replace(/'/g, "''") + "'" : 'NULL' }},
    {{ $json.fornecedor_principal ? "'" + $json.fornecedor_principal.replace(/'/g, "''") + "'" : 'NULL' }},
    {{ $json.cod_fornecedor ? "'" + $json.cod_fornecedor.replace(/'/g, "''") + "'" : 'NULL' }},
    {{ $json.compras_do_fornecedor || 0 }},
    {{ $json.ultima_compra_fornecedor ? "'" + $json.ultima_compra_fornecedor + "'" : 'NULL' }},
    {{ $json.qtd_fornecedores || 0 }},
    {{ $json.todos_fornecedores ? "'" + $json.todos_fornecedores.replace(/'/g, "''") + "'" : 'NULL' }},
    {{ $json.estoque_atual || 0 }},
    {{ $json.estoque_transito || 0 }},
    {{ $json.estoque_projetado || 0 }},
    {{ $json.pedidos_abertos || 0 }},
    {{ $json.dias_aguardando || 'NULL' }},
    {{ $json.fornecedores_pendentes ? "'" + $json.fornecedores_pendentes.replace(/'/g, "''") + "'" : 'NULL' }},
    {{ $json.preco || 0 }},
    {{ $json.custo || 0 }},
    {{ $json.margem_unitaria || 0 }},
    {{ $json.margem_percentual || 0 }},
    {{ $json.qtd_vendida_60d || 0 }},
    {{ $json.faturamento_60d || 0 }},
    {{ $json.lucro_60d || 0 }},
    {{ $json.media_diaria_venda || 0 }},
    {{ $json.dias_cobertura_atual || 0 }},
    {{ $json.dias_cobertura_projetado || 0 }},
    {{ $json.status_ruptura ? "'" + $json.status_ruptura.replace(/'/g, "''") + "'" : 'NULL' }},
    {{ $json.classe_abc ? "'" + $json.classe_abc.replace(/'/g, "''") + "'" : 'NULL' }},
    {{ $json.percentual_acumulado_abc || 0 }},
    {{ $json.giro_mensal || 0 }},
    {{ $json.valor_estoque_custo || 0 }},
    {{ $json.valor_estoque_venda || 0 }},
    {{ $json.valor_transito_custo || 0 }},
    {{ $json.sugestao_compra_ajustada || 0 }},
    {{ $json.sugestao_compra_original || 0 }},
    {{ $json.vendas_periodo_atual || 0 }},
    {{ $json.vendas_periodo_anterior || 0 }},
    {{ $json.tendencia ? "'" + $json.tendencia.replace(/'/g, "''") + "'" : 'NULL' }},
    {{ $json.variacao_percentual || 0 }},
    {{ $json.ultima_venda ? "'" + $json.ultima_venda + "'" : 'NULL' }},
    {{ $json.dias_sem_venda || 0 }},
    {{ $json.prioridade_compra ? "'" + $json.prioridade_compra.replace(/'/g, "''") + "'" : 'NULL' }},
    {{ $json.alerta_estoque ? "'" + $json.alerta_estoque.replace(/'/g, "''") + "'" : 'NULL' }},
    NOW()
);
```

---

## Workflow 2: Sync relatorio_fornecedores

### Node 1: TRUNCATE
```sql
TRUNCATE TABLE relatorio_fornecedores;
```

### Node 2: INSERT
```sql
INSERT INTO relatorio_fornecedores (
    id_fornecedor,
    fornecedor,
    total_produtos,
    produtos_ruptura,
    produtos_chegando,
    produtos_criticos,
    produtos_atencao,
    produtos_ok,
    valor_estoque_custo,
    valor_transito_custo,
    faturamento_60d,
    total_unidades_sugeridas,
    valor_sugestao_compra,
    percentual_ruptura,
    updated_at
)
VALUES (
    {{ $json.id_fornecedor }},
    {{ $json.fornecedor ? "'" + $json.fornecedor.replace(/'/g, "''") + "'" : 'NULL' }},
    {{ $json.total_produtos || 0 }},
    {{ $json.produtos_ruptura || 0 }},
    {{ $json.produtos_chegando || 0 }},
    {{ $json.produtos_criticos || 0 }},
    {{ $json.produtos_atencao || 0 }},
    {{ $json.produtos_ok || 0 }},
    {{ $json.valor_estoque_custo || 0 }},
    {{ $json.valor_transito_custo || 0 }},
    {{ $json.faturamento_60d || 0 }},
    {{ $json.total_unidades_sugeridas || 0 }},
    {{ $json.valor_sugestao_compra || 0 }},
    {{ $json.percentual_ruptura || 0 }},
    NOW()
);
```

---

## Workflow 3: Sync pedidos_transito

### Node 1: TRUNCATE
```sql
TRUNCATE TABLE pedidos_transito;
```

### Node 2: INSERT
```sql
INSERT INTO pedidos_transito (
    id_pedido,
    numero_nf,
    data_pedido,
    dias_aguardando,
    status_pedido,
    fornecedor_nome,
    fornecedor_codigo,
    fornecedor_telefone,
    valor_pedido,
    qtd_itens,
    total_unidades,
    produtos,
    updated_at
)
VALUES (
    {{ $json.id_compra }},
    {{ $json.numero_nf ? "'" + $json.numero_nf.replace(/'/g, "''") + "'" : 'NULL' }},
    {{ $json.data_pedido ? "'" + $json.data_pedido + "'" : "'1900-01-01'" }},
    {{ $json.dias_aguardando || 0 }},
    {{ $json.status_pedido ? "'" + $json.status_pedido.replace(/'/g, "''") + "'" : 'NULL' }},
    {{ $json.fornecedor_nome ? "'" + $json.fornecedor_nome.replace(/'/g, "''") + "'" : 'NULL' }},
    {{ $json.fornecedor_codigo ? "'" + $json.fornecedor_codigo.replace(/'/g, "''") + "'" : 'NULL' }},
    {{ $json.fornecedor_telefone ? "'" + $json.fornecedor_telefone.replace(/'/g, "''") + "'" : 'NULL' }},
    {{ $json.valor_pedido || 0 }},
    {{ $json.qtd_itens || 0 }},
    {{ $json.total_unidades || 0 }},
    {{ $json.produtos ? "'" + $json.produtos.replace(/'/g, "''") + "'" : 'NULL' }},
    NOW()
);
```
