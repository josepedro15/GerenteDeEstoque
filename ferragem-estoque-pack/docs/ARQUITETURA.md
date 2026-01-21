# Arquitetura do Sistema

## Fluxo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                    BANCO FERRAGEM (Firebird)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │v_produtos│ │v_vendas  │ │v_compras │ │v_fornecedores    │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                    3 Queries SQL (SELECT)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         n8n WORKFLOWS                           │
│  ┌────────────────┐ ┌───────────────┐ ┌───────────────────┐    │
│  │analise_estoque │ │relat_fornec.  │ │pedidos_transito   │    │
│  │ 4865 produtos  │ │ ~200 fornec.  │ │ N pedidos         │    │
│  └────────────────┘ └───────────────┘ └───────────────────┘    │
│                              │                                  │
│              TRUNCATE + INSERT (substitui tudo)                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE (PostgreSQL)                      │
│  ┌────────────────┐ ┌───────────────┐ ┌───────────────────┐    │
│  │ dados_estoque  │ │relat_fornec.  │ │pedidos_transito   │    │
│  │   42 campos    │ │  14 campos    │ │   12 campos       │    │
│  └────────────────┘ └───────────────┘ └───────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                         Supabase JS
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SMARTSALES (React)                         │
│  ┌────────────────┐ ┌───────────────┐ ┌───────────────────┐    │
│  │   Dashboard    │ │Lista Produtos │ │Pedidos Trânsito   │    │
│  │Cards + Gráficos│ │Filtros + ABC  │ │Alertas + Status   │    │
│  └────────────────┘ └───────────────┘ └───────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Queries de Extração

### analise_estoque_completa.sql
- Usa CTEs para calcular vendas 60d, estoque atual, trânsito
- Relaciona produto → fornecedor via histórico de compras
- Calcula ABC, tendência, sugestão de compra
- Retorna 42 campos por produto

### relatorio_por_fornecedor.sql
- Agrupa dados por fornecedor
- Contagem de produtos por status (ruptura, crítico, etc)
- Valores consolidados (estoque, sugestão)
- Retorna 14 campos por fornecedor

### pedidos_em_transito.sql
- Lista pedidos não recebidos (entrada IS NULL)
- Calcula dias aguardando
- Status: ATRASADO (>30d), PENDENTE (15-30d), RECENTE (<15d)
- Retorna 12 campos por pedido

---

## Serviços TypeScript

### estoqueService
- `getAll(filtros)` - Lista com filtros
- `getById(id)` - Busca por ID
- `getResumo()` - Cards de resumo
- `getTopUrgentes(n)` - Top N urgentes
- `getContagemPorStatus()` - Contagem por status
- `getContagemPorABC()` - Contagem A/B/C

### relatorioFornecedorService
- `getAll(filtros)` - Lista com filtros
- `getById(id)` - Busca por ID
- `getResumo()` - Resumo geral
- `getComProblemas()` - Com ruptura/crítico
- `getTopPorSugestao(n)` - Top por valor

### pedidoTransitoService
- `getAll(filtros)` - Lista com filtros
- `getById(id)` - Busca por ID
- `getResumo()` - Resumo geral
- `getAtrasados()` - Pedidos > 30 dias
- `temPedidos()` - Verifica se há pedidos

---

## Páginas

### Dashboard (/estoque)
1. **Cards de Resumo**
   - Total produtos
   - Valor estoque
   - Produtos críticos
   - Pedidos em trânsito

2. **Gráfico Status**
   - Barra de progresso por status
   - 🔴 Ruptura, 🟣 Chegando, 🟠 Crítico, 🟡 Atenção, 🟢 OK

3. **Curva ABC**
   - Círculos A/B/C com contagem

4. **Tabela Top 10 Urgentes**
   - Produto, Fornecedor, Estoque, Cobertura, Status, Tendência, Sugestão
