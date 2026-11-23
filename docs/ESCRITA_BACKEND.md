# Escrita no app mobile: o que o backend precisa

Pedido para a sessão do `financeiro`. Descreve as rotas de escrita que a
Etapa 5 do app (`docs/PLANO_MOBILE.md`) vai usar, comparadas com a Etapa 4 do
`financeiro/docs/PLANO_API_MOBILE.md` ("Rotas de escrita com validação").

As regras de negócio já existem em `lib/finance/*` e são as mesmas do web. O
pedido é expor essas funções em `/api/v1` com validação, e corrigir alguns
pontos encontrados na leitura do código (seção "Ajustes").

## Resumo

| #   | Ação no app                  | Rota                                   | No plano da API?           |
| --- | ---------------------------- | -------------------------------------- | -------------------------- |
| 1   | Lançar transação             | `POST /api/v1/transactions`            | Sim                        |
| 2   | Editar transação             | `PATCH /api/v1/transactions/:id`       | Sim ("campos e/ou isPaid") |
| 3   | Marcar como pago / desfazer  | `PATCH /api/v1/transactions/:id`       | Sim (mesma rota)           |
| 4   | Excluir transação            | `DELETE /api/v1/transactions/:id`      | Sim                        |
| 5   | Definir / remover limite     | `PATCH /api/v1/categories/:id`         | Sim ("budget")             |
| 6   | Criar recorrência            | `POST /api/v1/recurring`               | Sim                        |
| 7   | Pausar / retomar recorrência | `PATCH /api/v1/recurring/:id`          | Sim ("active")             |
| 8   | Excluir recorrência          | `DELETE /api/v1/recurring/:id`         | Sim                        |
| 9   | Criar meta                   | `POST /api/v1/goals`                   | Sim                        |
| 10  | Adicionar valor à meta       | `POST /api/v1/goals/:id/contributions` | Sim                        |
| —   | Percentual arredondado       | `GET /categories` e `budgetAlert`      | **Não** (novo)             |

Todas as rotas que o app vai usar já estão previstas. As diferenças são os
detalhes de contrato abaixo (status, formato de resposta e validações), o
arredondamento do percentual e os ajustes.

Previstas no plano, mas **não usadas na Etapa 5 do app** (podem vir depois):
`POST /categories`, `DELETE /categories/:id`, `PATCH /goals/:id`,
`DELETE /goals/:id` e `PATCH /me`.

Observação sobre o plano da API: a Etapa 3 (rotas de leitura) aparece
desmarcada, mas as cinco rotas existem e o app já usa todas.

## Convenções (todas as rotas)

- **Autenticação:** só `Authorization: Bearer` (`requireMobileUser`), como as
  rotas de leitura. O `userId` vem do token, nunca do body.
- **Dono:** toda mutação por `id` filtra `{ id, userId }`. Não existe ou é de
  outro usuário → **404** (não 403, para não revelar que o id existe).
- **Validação:** Zod com `parseJsonBody` (`lib/api-validation.ts`), no formato
  de erro que já existe: `400 { error, issues: [{ path, message }] }`.
- **Status:**

  | Situação                   | Status | Corpo                                |
  | -------------------------- | ------ | ------------------------------------ |
  | Criou                      | `201`  | o recurso criado                     |
  | Alterou                    | `200`  | o recurso alterado                   |
  | Excluiu                    | `204`  | vazio                                |
  | Validação                  | `400`  | `{ error, issues }`                  |
  | Token                      | `401`  | `{ error }`                          |
  | Não existe / outro usuário | `404`  | `{ error }`                          |
  | Conflito (nome repetido)   | `409`  | `{ error }`                          |
  | Falha inesperada           | `500`  | `{ error: 'Internal Server Error' }` |

- **Formato do recurso:** o mesmo item que a rota de leitura correspondente já
  devolve (`TransactionItem`, item de `GET /categories`, `RecurringRuleItem`,
  item de `GET /goals` com `createdAt`). Assim o app atualiza o cache sem uma
  segunda chamada.
- **Valores e datas:** dinheiro em `number` (até 2 casas, `> 0`, no máximo
  `99999999.99` pelo `Decimal(10, 2)`). Datas sem horário em `"YYYY-MM-DD"`,
  meses em `"YYYY-MM"`. O servidor monta as datas como hoje (`parseDateOnly`,
  competência no dia 1 ao meio-dia).
- **Recorrências:** as rotas que alteram dados gerados por regras chamam
  `generateForUser` como o web já faz (criar e retomar).

## Rotas

### 1. Lançar transação: `POST /api/v1/transactions`

Usa `createTransaction(userId, data, referenceMonth)`.

```jsonc
// body
{
  "description": "Mercado", // trim, 1 a 200 caracteres
  "amount": 152.9, // > 0, até 2 casas
  "date": "2026-11-21", // YYYY-MM-DD (data da compra)
  "type": "expense", // "income" | "expense"
  "category": "Alimentação", // nome; criada se não existir (trim, 1 a 50)
  "referenceMonth": "2026-11", // YYYY-MM (competência); opcional, ver Ajustes
}
```

```jsonc
// 201
{
  "transaction": {/* TransactionItem, como em GET /transactions */},
  "budgetAlert": null, // ou { category, spent, budget, percent }
}
```

Regras:

- `budgetAlert` só para despesa e só quando a categoria tem limite e passou de
  80% no mês de competência (como hoje). `percent` arredondado (ver Ajustes).
- Falha ao calcular o alerta não impede o lançamento (como hoje).
- Hoje `createTransaction` devolve só o `id`: a rota precisa buscar o
  `TransactionItem` (com a categoria) para responder.

### 2. Editar transação: `PATCH /api/v1/transactions/:id`

Usa `updateTransaction(userId, id, data, referenceMonth)`.

```jsonc
// body: o conjunto completo (o app sempre manda todos os campos ao editar)
{
  "description": "Mercado",
  "amount": 152.9,
  "date": "2026-11-21",
  "type": "expense",
  "category": "Alimentação",
  "referenceMonth": "2026-11", // obrigatório aqui
}
```

`200 { transaction: TransactionItem }`.

Regras:

- Editar uma ocorrência de recorrência mantém o `recurringRuleId` e não altera a
  regra (como no web).
- `budgetAlert` não é pedido na edição.

### 3. Marcar como pago / desfazer: `PATCH /api/v1/transactions/:id`

Usa `setTransactionPaid(userId, id, isPaid)`.

```jsonc
{ "isPaid": true } // false = desfazer
```

`200 { transaction: TransactionItem }`. `setTransactionPaid` devolve `false`
quando não encontra → `404`.

Sugestão para a rota única: o body é **um dos dois formatos** (edição completa
ou `{ isPaid }`), validado com `z.union`. O app não mistura os dois.

### 4. Excluir transação: `DELETE /api/v1/transactions/:id`

Usa `deleteTransaction(userId, id)`. `204`. O erro `P2025` do Prisma vira
`404`.

Regra (já existe): apagar uma ocorrência de recorrência não faz a regra
recriá-la (`lastGeneratedMonth`).

### 5. Definir / remover limite: `PATCH /api/v1/categories/:id`

Usa `setCategoryBudget(userId, id, budget)`.

```jsonc
{ "budget": 800 } // > 0; null remove o limite
```

`200 { category }` com o mesmo formato de `GET /categories` para o mês atual
(`spent` e `percent` recalculados), ou aceitar `?month=` como a leitura.

Regras:

- Hoje `setCategoryBudget` usa `updateMany` e não informa se achou a
  categoria: a rota precisa conferir (`count === 0` → `404`).
- `0` é tratado como "sem limite" pela função; no contrato, o app manda `null`
  para remover, e a API pode rejeitar `0` com `400` para não haver dois jeitos.

### 6. Criar recorrência: `POST /api/v1/recurring`

Usa `createRecurringRule(userId, input)`.

```jsonc
{
  "description": "Aluguel",
  "amount": 1500, // > 0
  "type": "expense",
  "category": "Moradia", // opcional; vazio = sem categoria
  "dayOfMonth": 5, // 1 a 31 (meses curtos usam o último dia)
  "startMonth": "2026-11", // YYYY-MM
}
```

`201 { rule: RecurringRuleItem }`.

Regras (já existem):

- Gera na hora as ocorrências do mês de início até o atual (no máximo 36 meses).
  Meses passados entram como pagos; o atual, pendente.
- `createRecurringRule` devolve `{ success: false, error }` em entrada
  inválida: a rota converte em `400 { error }`. Com o Zod na frente, isso vira
  só uma segunda barreira.

### 7. Pausar / retomar: `PATCH /api/v1/recurring/:id`

Usa `toggleRecurringRule(userId, id, active)`.

```jsonc
{ "active": false }
```

`200 { rule: RecurringRuleItem }`. `false` da função → `404`.

Regra (já existe): retomar continua do mês atual, sem preencher o período
pausado, e gera a ocorrência do mês.

### 8. Excluir recorrência: `DELETE /api/v1/recurring/:id`

Usa `deleteRecurringRule(userId, id)`. `204`. As transações já geradas ficam
no histórico (`onDelete: SetNull`).

Hoje a função usa `deleteMany` e ignora o resultado: a rota precisa do `count`
para responder `404` quando não apagou nada.

### 9. Criar meta: `POST /api/v1/goals`

Usa `createGoal(userId, data)`.

```jsonc
{
  "name": "Viagem", // trim, 1 a 100
  "targetAmount": 10000, // > 0
  "currentAmount": 0, // >= 0; opcional, padrão 0
  "deadline": "2027-06-30", // YYYY-MM-DD ou null
}
```

`201 { goal }` no formato de `GET /goals`, **com `createdAt`** (o app usa para
o ritmo).

Regra: hoje `parseDeadline` transforma uma data inválida em `null` sem avisar.
Na API, data inválida deve dar `400`, não virar "sem prazo".

### 10. Adicionar valor: `POST /api/v1/goals/:id/contributions`

Usa `addToGoal(userId, id, amount)`.

```jsonc
{ "amount": 250 } // > 0
```

`200 { goal }` atualizado (formato de `GET /goals`).

Regras:

- `addToGoal` só rejeita `NaN`: aceita zero e negativo. O web valida `> 0` no
  diálogo (`UpdateGoalDialog`); a API precisa validar também (Zod `positive()`).
- O incremento é atômico (`increment`), então dois aportes ao mesmo tempo
  somam certo.
- Passar do objetivo é permitido (a meta fica concluída).

## Ajustes encontrados no código atual

1. **Percentual com resíduo de ponto flutuante.** `getCategoriesWithBudget` e
   `getBudgetStatus` devolvem `(spent / budget) * 100` cru, por exemplo
   `110.00000000000001` ou `99.99999999999999` num gasto igual ao limite.
   Pedido: arredondar em 2 casas na API (`Math.round(x * 100) / 100`) antes de
   devolver e antes de comparar com 80/100 (o `budgetAlert` usa `>= 80`). O app
   já arredonda na tela; com a API arredondando, web e app passam a comparar o
   mesmo número.
2. **Mês de competência padrão em UTC.** `createTransaction` usa
   `new Date().toISOString().slice(0, 7)` quando não recebe o mês. Das 21h à
   meia-noite (Brasília) do último dia do mês, isso cai no mês seguinte.
   Pedido: usar `currentMonthISO(APP_TIME_ZONE)`, como as rotas de leitura. O app
   vai mandar `referenceMonth` sempre, mas o padrão também deve estar certo.
3. **Categoria com nome repetido.** `Category` tem `@@unique([name, userId])`.
   Quem criar categoria por nome (`POST /categories`, se vier) deve responder
   `409`, não `500`. Nas rotas acima a categoria é criada por `upsert`, então
   não há conflito.
4. **Cor de categoria nova.** `createTransaction` usa
   `DEFAULT_CATEGORY_COLORS[nome] || '#71717a'`; `updateTransaction` e
   `createRecurringRule` usam sempre `'#71717a'`. Sugestão: a mesma regra nos
   três, para a cor não depender de por onde a categoria nasceu.
5. **Cor inválida no banco.** O padrão da coluna `Category.color` é
   `"bg-zinc-500"` (uma classe, não uma cor). O app e o web tratam, mas, se vier
   `POST /categories`, validar hex (`#rgb`/`#rrggbb`). Trocar o padrão da coluna
   exigiria migration, então fica como sugestão.
6. **Aporte negativo.** Ver rota 10: validar `> 0` na API.

## Ordem sugerida

1. Ajuste 1 (percentual) e ajuste 2 (mês padrão), que mudam rotas existentes.
2. Transações (rotas 1 a 4): são as mais usadas e destravam as etapas 5b e 5c.
3. Limite (5), recorrências (6 a 8) e metas (9 e 10).

Para cada rota, o app testa: criar/alterar, conferir na tela web local que o
mesmo dado aparece, e os erros (`400` com campo, `404` com id de outro usuário,
sem rede).

## Depois da escrita: saldo pelo pago (`GET /api/v1/dashboard`)

Item **4b** do `PLANO_API_MOBILE.md`; no app, item **5g** do `PLANO_MOBILE.md`.
Hoje marcar como pago não muda nenhum número: os totais contam tudo. A regra
nova faz o pago ter efeito.

### Regra

- Receitas e despesas do mês, o gráfico mensal e as categorias continuam por
  competência e contam tudo, pago ou não. O limite das categorias também.
- O saldo atual conta só o pago/recebido. Isso vale também para "meses
  anteriores" da Visão Geral e para o saldo anterior de Transações
  (`carryOver`), para as duas telas baterem.
- Pendentes: tudo o que não foi pago com competência até o mês atual. Os de
  meses anteriores aparecem com o selo "atrasada"; meses futuros ficam fora.
- Saldo previsto = saldo atual + a receber − a pagar (dos pendentes acima).

### O que o app precisa

1. **`GET /api/v1/dashboard`**: cada total ganha `isPaid` (o `groupBy` de
   `getDashboardTotals` passa a agrupar também por ele). Só acréscimo: um app
   antigo ignora o campo e continua somando tudo.

   ```jsonc
   {
     "totals": [
       {
         "referenceDate": "2026-11-01T12:00:00.000Z",
         "type": "expense",
         "isPaid": false,
         "amount": 10,
         "category": { "name": "Lazer", "color": "#71717a" },
       },
     ],
   }
   ```

   O app calcula saldo atual, a pagar, a receber, atrasadas e previsto a
   partir disso, como já faz com os totais de hoje. O web faz a mesma conta em
   `DashboardClient.tsx`.

2. **`GET /api/v1/transactions`**: `totals.carryOver` soma só as transações
   pagas (`isPaid: true` no `where` da soma dos meses anteriores). Muda também o
   saldo anterior da tela de Transações do web, que usa o mesmo serviço.

3. **Selo "atrasada" na lista**: não precisa de nada novo. O `TransactionItem`
   já tem `isPaid` e `referenceDate`; o app (e o web) mostram o selo quando a
   transação está pendente e a competência é anterior ao mês atual (fuso de São
   Paulo).

### Antes de virar a regra: pendentes antigas

Lançamentos comuns nascem pagos (`isPaid` tem `DEFAULT true` desde o
`0_init`, e `createTransaction` não o grava). Só as recorrências nascem
pendentes: `generateForUser` cria a ocorrência do mês corrente com
`isPaid: false`, e nada a marca depois. Até agora isso não aparecia; com a regra
nova, toda ocorrência antiga não marcada sai do saldo de uma vez.

No banco de dev só há uma pendente (recorrência de nov/2026). A produção precisa
ser medida antes. Se houver pendentes com competência anterior ao mês da
virada, um script de dados (não uma migration de schema) as marca como pagas,
só as criadas antes da virada: elas sempre contaram no saldo, então o saldo de
ninguém muda no dia. As do mês corrente continuam pendentes. É um `UPDATE` em
dados reais: só com autorização, depois de backup, informando quantas linhas
mudou.

### Ordem

1. API: `isPaid` nos totais do dashboard (nenhum número muda ainda).
2. App: os cálculos e cards novos, tratando `isPaid` ausente como pago (funciona
   antes e depois do item 1).
3. Produção: o script de dados, se a medição pedir, antes do item 4.
4. API e web: `carryOver` só com o pago; Visão Geral do web com saldo pelo pago,
   pendentes e previsto. É aqui que o saldo muda para as pessoas: junto com o
   app publicado.

### Depois (passo separado): lançar já pendente

Hoje só recorrências ficam pendentes, então o card de pendentes mostraria só
elas. Num passo seguinte:

- `isPaid` opcional no body do lançamento (`POST /transactions`) e da edição
  completa (`PATCH /transactions/:id`), no `transactionBodySchema`, com padrão
  `true`.
- O web ganha "desmarcar" (o `TransactionStatus` hoje só marca) e o campo
  "pago?" no lançamento; o app, o mesmo campo no formulário.
