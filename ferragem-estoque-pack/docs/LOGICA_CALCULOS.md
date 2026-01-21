# 📐 Lógica de Cálculos - Sistema de Estoque

Este documento explica **todos os cálculos e regras de negócio** utilizados no sistema de gestão de estoque.

---

## 1. Dias de Cobertura

Indica quantos dias o estoque atual aguenta com base no ritmo de vendas.

### Fórmula

```sql
-- Cobertura Atual
dias_cobertura = estoque_atual / (qtd_vendida_60d / 60)

-- Cobertura Projetada (inclui pedidos em trânsito)
dias_cobertura_projetado = (estoque_atual + estoque_transito) / (qtd_vendida_60d / 60)
```

| Situação | Resultado |
|----------|-----------|
| Vendeu 600 unidades em 60 dias (10/dia), estoque = 50 | 50 / 10 = **5 dias** |
| Sem vendas em 60 dias | **999 dias** (infinito) |

---

## 2. Status de Ruptura

Classifica a situação do estoque de cada produto.

| Status | Emoji | Condição |
|--------|-------|----------|
| **Ruptura** | 🔴 | estoque = 0 E trânsito = 0 E vendeu nos 60d |
| **Chegando** | 🟣 | estoque = 0 E trânsito > 0 |
| **Excesso** | ⚪ | vendas = 0 OU cobertura > 90 dias |
| **Crítico** | 🟠 | cobertura < 7 dias |
| **Atenção** | 🟡 | cobertura 7-15 dias |
| **Saudável** | 🟢 | cobertura 15-90 dias |

**Por que esses valores?**
- **< 7 dias** = Lead time médio de reposição é ~5 dias
- **15 dias** = Margem de segurança para imprevistos
- **90 dias** = Acima disso, capital parado desnecessariamente

---

## 3. Curva ABC (Pareto)

Classifica produtos por importância no faturamento.

### Fórmula

```sql
percentual_acumulado = SUM(faturamento_60d) OVER (ORDER BY faturamento_60d DESC) 
                       / SUM(faturamento_60d) OVER () * 100
```

| Classe | Critério | Significado |
|--------|----------|-------------|
| **A** | 0% - 80% acumulado | ~20% dos SKUs, 80% da receita |
| **B** | 80% - 95% acumulado | ~30% dos SKUs |
| **C** | 95% - 100% acumulado | ~50% dos SKUs, 5% da receita |

**Base:** Princípio de Pareto (80/20).

---

## 4. Tendência de Vendas

Compara vendas dos últimos 30 dias com os 30 dias anteriores.

### Fórmula

```sql
variacao_percentual = ((vendas_30d_atual - vendas_30d_anterior) / vendas_30d_anterior) * 100
```

| Tendência | Emoji | Condição |
|-----------|-------|----------|
| **Subindo** | 📈 | variação > +10% |
| **Estável** | ➡️ | variação entre -10% e +10% |
| **Caindo** | 📉 | variação < -10% |
| **Novo** | 📈 | anterior = 0 E atual > 0 |

---

## 5. Sugestão de Compra

Calcula quantas unidades comprar para manter 60 dias de estoque.

### Fórmula

```sql
-- Meta: 60 dias de cobertura
meta_estoque = media_diaria_venda * 60

-- Sugestão Original
sugestao_original = meta_estoque - estoque_atual

-- Sugestão Ajustada (desconta trânsito)
sugestao_ajustada = meta_estoque - estoque_atual - estoque_transito

-- Nunca negativo
sugestao = MAX(0, sugestao_ajustada)
```

**Exemplo:** Vende 10/dia, estoque = 20, trânsito = 100
- Meta: 10 × 60 = 600 unidades
- Sugestão: 600 - 20 - 100 = **480 unidades**

---

## 6. Prioridade de Compra

Combina criticidade com importância ABC.

| Prioridade | Condição | Ação |
|------------|----------|------|
| **1-URGENTE** | Ruptura + Classe A | Comprar HOJE |
| **2-ALTA** | Ruptura B OU Crítico A | Esta semana |
| **3-MEDIA** | Crítico (qualquer) | Próximos dias |
| **4-BAIXA** | Ruptura C OU Atenção | Avaliar |
| **5-NENHUMA** | OK | Sem ação |
| **6-AGUARDAR** | Trânsito > 30 dias | Esperar |

---

## 7. Alertas de Estoque

Identifica situações que requerem atenção especial.

| Alerta | Emoji | Condição | Ação |
|--------|-------|----------|------|
| **MORTO** | 💀 | vendas = 0 E estoque > 0 | Avaliar liquidação |
| **LIQUIDAR** | 🚨 | cobertura > 365d E Classe C | Promoção urgente |
| **AVALIAR** | ⚠️ | cobertura > 365d | Revisar demanda |
| **ATENÇÃO** | 📋 | cobertura > 180d | Monitorar |
| **OK** | ✅ | Demais casos | Nenhuma |

---

## 8. Giro Mensal

Indica quantas vezes o estoque gira por mês.

### Fórmula

```sql
giro_mensal = (qtd_vendida_60d / 2) / estoque_atual
```

| Giro | Interpretação |
|------|---------------|
| > 1 | Alto (saudável) |
| = 1 | Gira 1× por mês |
| < 0.5 | Lento (avaliar) |

---

## 9. Margem

Calcula lucratividade do produto.

```sql
margem_unitaria = preco_venda - custo
margem_percentual = ((preco_venda - custo) / preco_venda) * 100
lucro_60d = margem_unitaria * qtd_vendida_60d
```

---

## 10. Fornecedor Principal

Determina o fornecedor mais relevante para cada produto.

### Lógica

1. Fornecedor com **mais compras** do produto
2. Em empate: fornecedor da **compra mais recente**

```sql
ROW_NUMBER() OVER (
    PARTITION BY id_produto 
    ORDER BY COUNT(compras) DESC, MAX(data_compra) DESC
)
```

---

## 11. Status do Pedido em Trânsito

Classifica pedidos não recebidos por tempo de espera.

```sql
dias_aguardando = CURRENT_DATE - data_pedido
```

| Status | Emoji | Condição |
|--------|-------|----------|
| **ATRASADO** | 🔴 | dias > 30 |
| **PENDENTE** | 🟡 | dias 15-30 |
| **RECENTE** | 🟢 | dias < 15 |

**Referência:** Lead time médio da região é ~15 dias.

---

## 12. Relatório por Fornecedor

Agrega dados de todos os produtos de cada fornecedor.

```sql
total_produtos     = COUNT(*)
produtos_ruptura   = COUNT(CASE WHEN status = 'RUPTURA')
valor_estoque      = SUM(estoque * custo)
valor_sugestao     = SUM(sugestao_compra * custo)
percentual_ruptura = produtos_ruptura / total_produtos * 100
```

---

## 📊 Resumo Visual

```
                    FLUXO DE DECISÃO
                         │
           ┌─────────────┼─────────────┐
           │             │             │
      Estoque = 0?   Cobertura?    Vendas?
           │             │             │
    ┌──────┴──────┐     │      ┌──────┴──────┐
    │             │     │      │             │
 Trânsito?     SIM     │    Caindo?      = 0?
    │                   │      │             │
 ┌──┴──┐        ┌──────┼──────┐        ┌────┴────┐
SIM  NÃO       <7d  7-15d  >90d     SIM      Estoque>0?
 │    │         │     │      │       │          │
🟣   🔴        🟠    🟡     ⚪      📉         💀
```

---

> **Atualizado em:** Janeiro/2026  
> **Fonte:** Queries SQL em `/ferragem-estoque-pack/queries/`
