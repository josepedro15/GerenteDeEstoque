# Plano: IA Proativa no Bate-papo

## Objetivo
A IA deve **ir diretamente atrás da informação**, sem pedir permissão ou dizer "preciso analisar o estoque / permita-me verificar". Ao usuário pedir "indique 3 produtos para promoção", a resposta deve ser já com os 3 produtos indicados, não um pedido de autorização para buscar.

---

## O que foi implementado

### 1. Nova ferramenta: `excess_promo` (analyzeStock)
- **Onde**: `frontend/app/api/chat/tools.ts`
- **O quê**: Novo `filterType: 'excess_promo'` que retorna itens com status contendo "Excesso" (ideais para promoção/liquidação), ordenados por maior cobertura.
- **Uso**: Quando o usuário pedir "produtos para promoção", "itens para liquidação", "o que colocar em promoção", a IA chama essa ferramenta primeiro e depois responde com os itens.

### 2. System prompt: regra de proatividade
- **Onde**: `frontend/app/actions/systemPrompt.ts`
- **O quê**:
  - Seção **"REGRA DE OURO: PROATIVIDADE OBRIGATÓRIA"**: instrui a **nunca** pedir permissão para buscar; chamar a ferramenta primeiro e só depois responder.
  - Instruções explícitas para "indique produtos para promoção" → chamar `analyzeStock` com `excess_promo` na hora.
  - Exemplo 4 (few-shot): usuário pede "3 produtos para promoção"; agente **primeiro** chama a ferramenta, **depois** responde com os 3 itens. Incluído exemplo do que **nunca** fazer ("preciso analisar... permita-me...").
  - Reforço na descrição da ferramenta `analyzeStock` e no protocolo de pensamento: "CHAME A FERRAMENTA PRIMEIRO".

### 3. Fluxo técnico (já existente)
- O chat usa **`sendMessage`** (`app/actions/chat.ts`) com Gemini + ferramentas e **maxSteps: 10**, então o modelo pode chamar tools em loop até ter dados e responder.
- O problema era **comportamental** (o modelo escolhia explicar em vez de chamar a tool); o prompt e a tool dedicada (`excess_promo`) guiam o comportamento.

---

## Como validar
1. Abrir o Bate-papo no app.
2. Enviar: **"Me indica 3 produtos para fazer uma promoção."**
3. **Esperado**: A IA chama a ferramenta, recebe itens com excesso, e responde diretamente com 3 produtos + justificativa (e opção de gerar campanha).
4. **Evitar**: Respostas como "Para indicar os melhores produtos... preciso analisar o estoque... Permita-me analisar."

---

## Se a IA ainda for reativa
- **Conferir** se o chat está usando a action `sendMessage` (Gemini + tools) e não a rota `/api/chat` (N8N). O componente `chat-interface.tsx` chama `sendMessage`; se em algum ambiente a rota N8N for usada, o comportamento proativo depende do fluxo no N8N.
- **Reforçar prompt**: Incluir mais um exemplo negativo no system prompt: "NUNCA responda: 'Preciso analisar o estoque para...' — em vez disso, chame analyzeStock e depois responda."
- **Fallback no código** (opcional): Em `chat.ts`, detectar intenções como "promoção" / "indique produtos" e injetar uma primeira "tool call" forçada (ex.: chamar `analyzeStock({ filterType: 'excess_promo' })` antes de enviar ao modelo) e passar o resultado no contexto. Só recomendado se o ajuste de prompt não for suficiente.

---

## Banco de dados
- O filtro `excess_promo` usa `status_ruptura` contendo "Excesso" (ex.: "⚪ Excesso").
- Se na sua base não existir status "Excesso", a busca pode retornar vazia. Nesse caso, ajustar em `tools.ts` a condição para o campo/código que indica excesso ou alto estoque (ex.: outro status ou `dias_de_cobertura > X`).
