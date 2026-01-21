# FerragemMV - Pack de Estoque

## 📁 Estrutura

```
ferragem-estoque-pack/
├── queries/           # Queries de extração (Firebird/Ferragem)
│   ├── analise_estoque_completa.sql
│   ├── relatorio_por_fornecedor.sql
│   ├── pedidos_em_transito.sql
│   └── analise_completa_unificada.sql
├── migrations/        # Migrações do Supabase
│   ├── 003_add_fornecedor_transito_columns.sql
│   ├── 004_create_relatorio_fornecedores.sql
│   ├── 005_mapeamento_campos.sql
│   └── 006_create_pedidos_transito.sql
├── types/             # Tipos TypeScript
│   ├── estoque.ts
│   └── fornecedor.ts
├── services/          # Serviços Supabase
│   ├── estoque.service.ts
│   ├── relatorioFornecedor.service.ts
│   └── pedidoTransito.service.ts
├── pages/             # Páginas React
│   └── index.tsx      # Dashboard de Estoque
└── docs/
    ├── README.md         # Este arquivo
    ├── ARQUITETURA.md    # Fluxo de dados
    ├── LOGICA_CALCULOS.md # Explicação dos cálculos
    └── N8N_SQL.md        # SQL para n8n
```

---

## 🚀 Instalação

### 1. Supabase - Executar Migrações

Execute na ordem:
```sql
-- 1. Adicionar colunas em dados_estoque
migrations/003_add_fornecedor_transito_columns.sql

-- 2. Criar tabela relatorio_fornecedores
migrations/004_create_relatorio_fornecedores.sql

-- 3. Criar tabela pedidos_transito
migrations/006_create_pedidos_transito.sql
```

### 2. Copiar Arquivos TypeScript

```bash
# Types
cp types/*.ts SEU_PROJETO/src/types/

# Services
cp services/*.ts SEU_PROJETO/src/services/

# Pages
mkdir -p SEU_PROJETO/src/pages/estoque
cp pages/index.tsx SEU_PROJETO/src/pages/estoque/
```

### 3. Atualizar Sidebar

Em `components/layout/sidebar.tsx`:
```tsx
// Adicionar ao import
import { HiChartBar } from "react-icons/hi2";

// Adicionar 'estoque' ao PageId
export type PageId = "estoque" | "products" | ...

// Adicionar item ao navItems
{
  id: "estoque",
  label: "Estoque",
  icon: <HiChartBar className="h-5 w-5" />,
},
```

### 4. Atualizar App.tsx

```tsx
import { EstoqueDashboard } from "@/pages/estoque";

// No renderPage switch:
case "estoque":
  return <EstoqueDashboard currentPage={currentPage} onNavigate={setCurrentPage} />;
```

---

## 🔄 Fluxo de Dados

```
Banco Ferragem (Firebird)
         │
         ▼
   n8n Workflows (3x)
         │
         ▼
   Supabase (3 tabelas)
         │
         ▼
   SmartSales (React)
```

---

## 📊 Tabelas Supabase

| Tabela | Descrição | Campos |
|--------|-----------|--------|
| `dados_estoque` | Análise por produto | 42 campos |
| `relatorio_fornecedores` | Agregado por fornecedor | 14 campos |
| `pedidos_transito` | Pedidos não recebidos | 12 campos |

---

## ⏰ n8n - Agendamento

| Workflow | Horário | Query |
|----------|---------|-------|
| Sync Estoque | 06:00 | analise_estoque_completa.sql |
| Sync Fornecedores | 06:05 | relatorio_por_fornecedor.sql |
| Sync Pedidos | 06:10 | pedidos_em_transito.sql |
