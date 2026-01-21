-- ============================================================
-- MAPEAMENTO DE CAMPOS: Query → Supabase
-- Para uso no n8n ou script de sincronização
-- ============================================================

/*
==============================================================
TABELA: dados_estoque
==============================================================

Campo Query                  | Campo Supabase              | Observação
-----------------------------|-----------------------------|-----------------
id_produto                   | id_produto                  | Mesmo nome
produto_descricao            | produto_descricao           | Mesmo nome
fornecedor_principal         | fornecedor_principal        | NOVO
cod_fornecedor               | cod_fornecedor              | NOVO
compras_do_fornecedor        | compras_do_fornecedor       | NOVO (converter para INT)
ultima_compra_fornecedor     | ultima_compra_fornecedor    | NOVO
qtd_fornecedores             | qtd_fornecedores            | NOVO (converter para INT)
todos_fornecedores           | todos_fornecedores          | NOVO
estoque_atual                | estoque_atual               | Mesmo nome
estoque_transito             | estoque_transito            | NOVO
estoque_projetado            | estoque_projetado           | NOVO
pedidos_abertos              | pedidos_abertos             | NOVO
dias_aguardando              | dias_aguardando             | NOVO
fornecedores_pendentes       | fornecedores_pendentes      | NOVO
preco                        | preco                       | Mesmo nome
custo                        | custo                       | Mesmo nome
margem_unitaria              | margem_unitaria             | Mesmo nome
margem_percentual            | margem_percentual           | Mesmo nome
qtd_vendida_60d              | qtd_vendida_60d             | Mesmo nome
faturamento_60d              | faturamento_60d             | Mesmo nome
lucro_60d                    | lucro_60d                   | Mesmo nome
media_diaria_venda           | media_diaria_venda          | Mesmo nome
dias_cobertura_atual         | dias_de_cobertura           | RENOMEAR se preferir
dias_cobertura_projetado     | dias_cobertura_projetado    | NOVO
status_ruptura               | status_ruptura              | Mesmo nome
classe_abc                   | classe_abc                  | Mesmo nome
percentual_acumulado_abc     | percentual_acumulado_abc    | Mesmo nome
giro_mensal                  | giro_mensal                 | Mesmo nome
valor_estoque_custo          | valor_estoque_custo         | Mesmo nome
valor_estoque_venda          | valor_estoque_venda         | Mesmo nome
valor_transito_custo         | valor_transito_custo        | NOVO
sugestao_compra_ajustada     | sugestao_compra_ajustada    | NOVO
sugestao_compra_original     | sugestao_compra_60d         | Mapear para campo existente
vendas_periodo_atual         | vendas_periodo_atual        | Mesmo nome
vendas_periodo_anterior      | vendas_periodo_anterior     | Mesmo nome
tendencia                    | tendencia                   | Mesmo nome
variacao_percentual          | variacao_percentual         | Mesmo nome
ultima_venda                 | ultima_venda                | Mesmo nome
dias_sem_venda               | dias_sem_venda              | Mesmo nome
prioridade_compra            | prioridade_compra           | Mesmo nome
alerta_estoque               | alerta_estoque              | Mesmo nome


==============================================================
TABELA: relatorio_fornecedores
==============================================================

Campo Query                  | Campo Supabase              | Tipo
-----------------------------|-----------------------------|---------
id_fornecedor                | id_fornecedor               | INTEGER
fornecedor                   | fornecedor                  | TEXT
total_produtos               | total_produtos              | INTEGER
produtos_ruptura             | produtos_ruptura            | INTEGER
produtos_chegando            | produtos_chegando           | INTEGER
produtos_criticos            | produtos_criticos           | INTEGER
produtos_atencao             | produtos_atencao            | INTEGER
produtos_ok                  | produtos_ok                 | INTEGER
valor_estoque_custo          | valor_estoque_custo         | NUMERIC
valor_transito_custo         | valor_transito_custo        | NUMERIC
faturamento_60d              | faturamento_60d             | NUMERIC
total_unidades_sugeridas     | total_unidades_sugeridas    | NUMERIC
valor_sugestao_compra        | valor_sugestao_compra       | NUMERIC
percentual_ruptura           | percentual_ruptura          | NUMERIC


==============================================================
CONVERSÕES NECESSÁRIAS NO N8N
==============================================================

1. Campos retornados como STRING que devem ser numéricos:
   - estoque_atual, estoque_transito, estoque_projetado
   - qtd_vendida_60d, faturamento_60d, lucro_60d
   - compras_do_fornecedor, qtd_fornecedores
   - total_produtos, produtos_ruptura, etc.

2. Use parseFloat() ou Number() no n8n:
   
   Exemplo no Code node:
   ```javascript
   return items.map(item => {
     const data = item.json;
     return {
       json: {
         id_produto: data.id_produto,
         estoque_atual: parseFloat(data.estoque_atual) || 0,
         estoque_transito: parseFloat(data.estoque_transito) || 0,
         compras_do_fornecedor: parseInt(data.compras_do_fornecedor) || 0,
         // ... demais campos
       }
     };
   });
   ```

3. Para upsert no Supabase:
   - Use o node "Supabase" com operação "Upsert"
   - Conflict columns: id_produto (para dados_estoque)
   - Conflict columns: id_fornecedor (para relatorio_fornecedores)

*/
