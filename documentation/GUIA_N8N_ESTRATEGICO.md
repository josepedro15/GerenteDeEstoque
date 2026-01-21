# Instruções para Adicionar Agente Estratégico no n8n

## Visão Geral
Este guia explica como adicionar o **Agente Estratégico de Campanhas** ao workflow existente.

---

## Passo 1: Atualizar Agente Analisador2

No **System Prompt**, adicione o novo intent na lista de INTENTS DISPONÍVEIS:

```
- campanha_estrategica: seleção de produtos para criar campanha de liquidação com análise ABC
```

---

## Passo 2: Atualizar Construir Contexto RAG1

Substitua o código JavaScript para incluir `curva` nos produtos e a nova rota:

```javascript
// ... código existente ...
const produtosFormatados = produtos.map(p => ({
  nome: p.produto_descricao, 
  id: p.id_produto, 
  estoque: p.estoque_atual, 
  curva: p.classe_abc,  // ← NOVO
  // ...
}));

function mapIntentToRoute(intent) {
  const map = {
    'campanha_marketing': 'MARKETING',
    'campanha_estrategica': 'CAMPANHA',  // ← NOVO
    'sugestao_compra': 'COMPRA',
    'negociacao': 'NEGOCIACAO',
    'relatorio_geral': 'RELATORIO'
  };
  return map[intent] || 'ESTOQUE';
}
```

---

## Passo 3: Atualizar Construir Contexto Conversa1

Adicione a mesma rota no `mapIntentToRoute`:

```javascript
'campanha_estrategica': 'CAMPANHA'
```

---

## Passo 4: Adicionar Condição no Switch Router2

1. **Edit** o node Switch Router2
2. Clique em **Add Output**
3. Configure:
   - Output Key: `CAMPANHA`
   - Condição: `{{ $json.route }}` equals `CAMPANHA`

---

## Passo 5: Adicionar Node Agente Estratégico

1. Arraste um node **AI Agent** para o canvas
2. Configure:
   - **Name**: `Agente Estratégico Campanhas`
   - **Text**: `={{ $json.payload_string }}`
   - **System Message**: Cole o prompt do arquivo `SYSTEM_PROMPT_ESTRATEGICO.md`
   - **Position**: Abaixo do Agente Negociação2

---

## Passo 6: Adicionar Node Safe Executor

1. Arraste um node **Code** para o canvas
2. Configure:
   - **Name**: `Safe Executor Estratégico`
   - **Code**: Veja `n8n_estrategico_update.json` → `step_5_new_nodes_to_add`

---

## Passo 7: Conectar os Nodes

```
Switch Router2 (CAMPANHA) → Agente Estratégico Campanhas
Agente Estratégico → Safe Executor Estratégico
Safe Executor → Respond to Webhook4
```

Conectar também:
- OpenAI Chat Model4 → Agente Estratégico (ai_languageModel)
- Google Gemini Chat Model6 → Agente Estratégico (ai_languageModel)
- Simple Memory4 → Agente Estratégico (ai_memory)

---

## Teste

Envie uma mensagem como:
> "Quero criar uma campanha de liquidação com esses produtos: Porcelanato, Argamassa, Rejunte"

O sistema deve retornar um JSON com análise ABC e sugestões.
