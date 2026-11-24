# Plano: app mobile do Finance.ai (Expo)

App mobile do Finance.ai. O backend é o app Next.js `financeiro` (repositório
separado), pelas rotas `/api/v1/*`. Contrato e decisões da API:
`financeiro/docs/PLANO_API_MOBILE.md`. Visual: `financeiro/DESIGN_SYSTEM.md`.

Este repositório é **público**: nenhum segredo entra no Git.

## Base

- Expo SDK 58, React Native 0.88, React 19.3, TypeScript, Expo Router (`src/app`).
- npm (`package-lock.json`): comandos com `npx`; pacotes com `npx expo install`.
- Plataforma de desenvolvimento: **Android** (aparelho físico, development build).
  iOS fica para depois.

## Decisões

| #   | Tema                 | Decisão                                                                                                                            |
| --- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Identificadores      | `android.package` e `ios.bundleIdentifier` = `br.dev.ericksantana.financeai`                                                       |
| 2   | Plataforma           | Tudo no Android primeiro. iOS depois (exige Apple Developer Program para instalar build em aparelho físico)                        |
| 3   | Estilo               | NativeWind v4 estável (Tailwind v3). Se não funcionar no SDK 58, parar e decidir entre v5 (RC) e Uniwind                           |
| 4   | Client IDs do Google | No `app.json` (não são segredos e o EAS Build roda na nuvem sem o `.env`). Segredos nunca vão para o app                           |
| 5   | Navegação            | `Tabs` em JavaScript (estilizáveis no padrão neo-brutalista), não `NativeTabs`                                                     |
| 6   | Busca de dados       | `@tanstack/react-query`, instalado na etapa em que for usado                                                                       |
| 7   | Visão Geral          | Sem biblioteca de gráficos na primeira versão (cards e barras com `View`)                                                          |
| 8   | Login                | Google Sign-In nativo (`@react-native-google-signin/google-signin`, API "Original"), `webClientId` = `GOOGLE_CLIENT_ID` do backend |
| 9   | Tokens               | Access token (1h) + refresh token no `expo-secure-store`                                                                           |
| 10  | Formatação           | Prettier com aspas simples, igual ao `financeiro`                                                                                  |
| 11  | Push: plataforma     | Só Android por enquanto (push no iOS exige o Apple Developer Program)                                                              |
| 12  | Push: Firebase       | `google-services.json` fora do Git: variável de arquivo `GOOGLE_SERVICES_JSON` no EAS, lida por um `app.config.ts`                 |
| 13  | Push: permissão      | Pedida só por ação da pessoa: card "ativar avisos" na Visão Geral e item na aba "mais". Nunca na abertura do app                   |

## Ambiente de desenvolvimento

- Backend: `npm run dev` no PC (porta 3000), com o `.env` apontando para o banco de dev.
- Aparelho na mesma rede. A URL da API vem de `EXPO_PUBLIC_API_URL` no `.env`
  (fora do Git); o `.env.example` mostra o formato.
- `EXPO_PUBLIC_*` vai embutido no bundle: só valores públicos.
- Na development build o JS vem do Metro no PC, que lê o `.env`. Builds
  `preview`/`production` no EAS precisam das variáveis configuradas no EAS.
- Firewall do Windows: liberar a porta 3000 na rede privada.

## Arquitetura do app

```
src/app/            telas (Expo Router); _layout.tsx define os navegadores
src/components/     componentes visuais (Button, Card, StatCard...)
src/lib/            env, cliente da API, sessão (tokens), formatação
```

- `src/lib/api.ts`: `fetch` com `Authorization: Bearer`. No 401, renova o token
  **uma vez só** (renovações simultâneas com o mesmo refresh token derrubam a
  sessão, por causa da rotação) e repete a chamada.
- Sessão em um Context: único estado global, porque todas as telas dependem de
  "há usuário logado?".
- Rotas protegidas pelo Expo Router (conferir a API na documentação do SDK 58).

## Etapas

Cada sub-etapa termina com `npx tsc --noEmit` + `npx expo lint`, a lista de
arquivos, como testar e uma sugestão de commit.

### Etapa 1: base do projeto

- [x] **1a** Remover telas, componentes, hooks, imagens e script de exemplo do template
- [x] **1b** Prettier (dev, versão fixa) + `.prettierrc` igual ao `financeiro`; ESLint (`eslint-config-expo`, via `npx expo lint`)
- [x] **1c** `.gitignore`: ignorar `.env` e `.env.*` (exceto `.env.example`); remover a linha `example`
- [x] **1d** `EXPO_PUBLIC_API_URL` + `.env.example` + `src/lib/env.ts`
- [x] **1e** Identidade no `app.json`: nome, slug, scheme, `android.package`, `ios.bundleIdentifier`

### Etapa 2: login com Google

- [x] **2a** Conta Expo, `eas init`, `eas.json` (perfil `development`), primeira development build Android
- [x] **2b** SHA-1 (`eas credentials`) → client Android no Google Cloud (mesmo projeto do `GOOGLE_CLIENT_ID`) → `GOOGLE_MOBILE_CLIENT_IDS` no backend
- [x] **2c** Pacotes: `@react-native-google-signin/google-signin`, `expo-secure-store` (+ plugins no `app.json`, `iosUrlScheme` e `extra.googleWebClientId`); o `expo-dev-client` entrou na 2a
- [x] **2d** Rede local: HTTP para o IP do PC funciona na development build (debug); `expo-build-properties` não foi necessário
- [x] **2e** `src/lib/session.ts`, `src/lib/api.ts`, Context de sessão
- [x] **2f** Telas de login e de sessão (perfil + sair); erros: cancelado, sem rede, 401, 403, 500

### Etapa 3: tema

- [x] **3a** NativeWind v4 + tokens do `DESIGN_SYSTEM.md` como variáveis CSS (claro/escuro, sem `dark:`)
- [x] **3b** Fontes Space Grotesk e Space Mono (`@expo-google-fonts/*`, plugin do `expo-font`)
- [x] **3c** Componentes base: `Button`, `Card`/`CardHeader`, `TypeIcon`, `CategoryBadge`, `StatCard`, `Skeleton`, `EmptyState`, `ErrorBox`
- [x] **3d** Aplicar o tema nas telas da Etapa 2

### Etapa 4: telas de leitura

- [x] **4a** Instalar `@tanstack/react-query`; Tabs em JavaScript
- [x] **4b** Visão Geral (`GET /dashboard`, agregação por mês no app)
- [x] **4c** Transações (`GET /transactions`, paginação e filtro de mês)
- [x] **4d** Categorias (`GET /categories`, orçamento com barra de progresso)
- [x] **4e** Recorrentes (`GET /recurring`)
- [x] **4f** Metas (`GET /goals`); cor da barra pelo ritmo (no ritmo, abaixo do ritmo, prazo vencido, concluída), com texto e ícone além da cor. Backend: migration `add_goal_created_at` (`Goal.createdAt`, metas antigas preenchidas pelo instante do cuid) e `createdAt` na rota mobile

Toda tela: carregando (skeleton), vazio, erro e sucesso; puxar para atualizar;
360px sem rolagem lateral; receita/despesa com seta; `R$` em pt-BR.

### Etapa 5: escrita

Depende das rotas de escrita do backend (Etapa 4 do `PLANO_API_MOBILE.md`).
O que o app precisa de cada rota está em [ESCRITA_BACKEND.md](ESCRITA_BACKEND.md).

- [x] **5a** Base dos formulários: `Label`, campo de valor em R$, seletor de
      data e de mês, formulário em rota modal (`FormScreen`), confirmação
      destrutiva (`ConfirmDialog`), aviso de sucesso/erro (toast);
      `useMutation` + invalidação das consultas afetadas. Validação própria em
      `lib/forms` (sem Zod no app); calendário do `@expo/ui`, que já estava na
      build (sem pacote novo nem build nova)
- [x] **5b** Lançar e editar transação (mês de competência, categoria existente
      ou nova); mostrar o alerta de orçamento que volta na resposta
- [x] **5c** Marcar como pago/recebido (com desfazer) e excluir transação
- [x] **5d** Definir e remover o limite mensal de uma categoria
- [x] **5e** Recorrência: criar, pausar/retomar e excluir (o histórico fica).
      Fora da 5e: editar regra (não existe na API nem no web). Antes, decidir o
      que acontece com as ocorrências já lançadas (só as próximas mudam?); até
      lá, excluir e criar de novo
- [x] **5f** Metas: criar e adicionar valor. Fora da 5f: editar e excluir meta
      (o web tem; a API ainda não). Estão no "Depois" da 4h do
      `PLANO_API_MOBILE.md` (`PATCH /goals/:id` e `DELETE /goals/:id`)
- [x] **5g** Saldo pelo pago (depois da 5f; depende da 4i da API): saldo atual
      só com o pago/recebido (também "meses anteriores" e o saldo anterior de
      Transações). Decisão: "saldo" é sempre só o pago, em qualquer tela; em
      Transações, o card de saldo usa `totals.balance` da API (saldo anterior +
      recebido − pago do conjunto filtrado), e receitas e despesas seguem por
      competência, contando tudo. Card de pendentes do mês (a pagar e a receber, incluindo as
      atrasadas com selo "atrasada"; meses futuros fora) e saldo previsto
      (atual + a receber − a pagar). Receitas, despesas e limites continuam
      por competência, contando tudo. Depois, em passo separado: "pago?" no
      lançamento e na edição (5h). Detalhes em
      [ESCRITA_BACKEND.md](ESCRITA_BACKEND.md#depois-da-escrita-saldo-pelo-pago-get-apiv1dashboard)
      - Nota: a lista de Transações também mostra o selo "atrasada" (como no
        web): estático, contorno warning e relógio, ao lado do "a pagar ·
        marcar", que segue o único tocável. Mesma regra do card: não paga e
        competência anterior ao mês atual em São Paulo. Em telas estreitas os
        selos quebram de linha sem passar da largura
- [x] **5h** Lançar já pendente (depende da 4j da API, que precisa estar
      publicada antes do app): campo "Situação" no formulário de transação
      (pago / a pagar, ou recebido / a receber), no padrão do seletor de tipo;
      pago ao lançar, o valor da transação ao editar. `isPaid` no
      `TransactionInput`: o lançamento manda o escolhido, a edição sempre manda
      o atual. Desmarcar fica na edição e no "desfazer" do aviso. Contrato em
      [ESCRITA_BACKEND.md](ESCRITA_BACKEND.md#depois-passo-separado-lançar-já-pendente)

Todo formulário: validação com mensagem no campo, botão desativado e com
"salvando..." durante o envio, sucesso visível, erro da API em `ErrorBox`,
teclado sem cobrir o campo; ações destrutivas sempre com confirmação.

### Etapa 6: notificações push (n8n)

Depende da Etapa 5 do `PLANO_API_MOBILE.md` (seção "Push"): `PushDevice`,
`POST /api/v1/devices`, `DELETE /api/v1/devices/:id`, `lib/push.ts` e a rota
`dispatch` (5a a 5e prontas no dev). O workflow diário no n8n (5f) só é
preciso para os avisos chegarem sozinhos, às 9h; para testar, basta chamar o
`dispatch`. Decisões 11 a 13.

Avisos que a API manda (às 9h, agrupados, no máximo 3 por dia): vence hoje
(despesas pendentes com data de hoje), atrasadas (resumo semanal, às
segundas) e orçamento (80% e 100% do limite, uma vez por limiar no mês).
Cada um leva `data.url`: `/transactions?status=pending` ou `/more/categories`.

Antes da 6a: Firebase, credencial FCM V1 no expo.dev e a variável
`GOOGLE_SERVICES_JSON` no EAS (passos no navegador). `EXPO_ACCESS_TOKEN` e
Enhanced Security são do backend, mas na ordem certa: o token no `.env` da API
**antes** de ligar o Enhanced Security, senão o envio passa a dar
`UNAUTHORIZED`. Feito: Enhanced Security ligado na conta ES Labs depois do
primeiro envio; o `EXPO_ACCESS_TOKEN` é de um robô com o papel Viewer, que
basta para enviar.

- [x] **6a** Pacote e build:
  - `expo-notifications` 58.1.8, fixa. O SDK 58 pede `~58.1.9`, mas ela saiu
    em 11/11/2026 (menos de 2 semanas); o `expo-doctor` avisa até a troca.
    Trocar pela 58.1.9 a partir de 25/11/2026, antes da 7d. `expo-constants`
    e `expo-device` já estavam instalados
  - `app.config.ts` por cima do `app.json` (que continua sendo a base), só
    para `android.googleServicesFile = process.env.GOOGLE_SERVICES_JSON ??
    './google-services.json'`. O arquivo local serve para o `npx expo
    run:android`, que não recebe as variáveis do EAS
  - `google-services.json` e a chave da conta de serviço do Firebase
    (`*-firebase-adminsdk-*.json`) no `.gitignore`
  - Plugin `expo-notifications` no `app.json`: ícone
    `assets/images/notification-icon.png` (provisório: cópia do ícone
    monocromático do template; o Android só usa a transparência), cor
    `#111111` (ink, o primary do web; no Android 12+ é o círculo atrás do
    ícone branco) e canal padrão `default`, o `channelId` que a API manda
  - `"environment": "development"` no perfil `development` do `eas.json` (as
    variáveis de `preview`/`production` ficam para a 7b)
  - Development build nova no EAS e instalada no aparelho. O Expo Go não
    recebe push no Android desde o SDK 53
- [x] **6b** Registro do aparelho e logout (testado em dois aparelhos: envio,
      chave única pulando o repetido, logout e permissão tirada nos ajustes;
      o caminho de negar a permissão não foi testado):
  - `lib/push.ts` (app): ao abrir com sessão e permissão já concedida, cria o
    canal `default` (nome visível "Avisos"), pega o token (`getExpoPushTokenAsync` com o `projectId`
    do EAS), chama `POST /devices` e guarda o `device.id` no
    `expo-secure-store`. Silencioso: se falhar, registra no log e tenta de
    novo na próxima abertura. Nunca pede permissão sozinho
  - Ativar: cria o canal **antes** de pedir (no Android 13+ o pedido não
    aparece sem canal), pede a permissão e registra
  - Card "ativar avisos" na Visão Geral: só com permissão ainda não
    decidida; "agora não" esconde o card (guardado no aparelho). Item na aba
    "mais" com a situação (ativados / desativados) e a ação. Negado sem poder
    pedir de novo: o item explica e abre as configurações do Android
    (`Linking.openSettings()`)
  - Logout: `DELETE /devices/:id` **antes** de apagar os tokens e de
    `/auth/logout` (o `logout()` hoje apaga os tokens primeiro). Sem rede ou
    com erro, segue o logout: o backend desativa os aparelhos da sessão
    revogada. Apaga o `device.id` guardado
  - App aberto: `setNotificationHandler` mostra o aviso (`shouldShowBanner`
    e `shouldShowList`)
- [x] **6c** Toque na notificação abre a tela certa (testado com o app
      aberto, em segundo plano e fechado, nos dois destinos):
  - No `_layout.tsx` raiz, com sessão: `getLastNotificationResponseAsync`
    (app fechado) e `addNotificationResponseReceivedListener` (app aberto ou
    em segundo plano). Usar as versões `Async`: as síncronas estão
    obsoletas no SDK 58
  - `data.url` vem de fora: só abre os dois valores que a API manda.
    `/transactions?status=pending` abre Transações com pendentes **em todos
    os meses**, como o "ver pendentes" (só com o status, a tela ficaria no
    mês atual e as atrasadas sumiriam); `/more/categories` abre Categorias.
    Qualquer outro é ignorado (fica no log)
  - Depois de abrir, `clearLastNotificationResponseAsync`, para não reabrir
    ao voltar ao app. Sem sessão, não navega (o login vem primeiro)
  - O mesmo toque pode chegar pelo listener e pela última resposta: abre uma
    vez só (pelo id da notificação)
  - Teste nos três estados (aberto, em segundo plano, fechado), disparando
    pelo `dispatch` no dev
- [ ] **6d** Preferências de aviso (`notifications.due`, `.overdue` e
      `.budget` no `User.settings`, todas ligadas por padrão), quando a API
      tiver o `PATCH /me` (no "Depois" da 4h do `PLANO_API_MOBILE.md`)

### Etapa 7: publicação

- [ ] **7a** API em produção com HTTPS (VPS + reverse proxy), migrations
      `add_mobile_session` e `add_goal_created_at` no banco de produção,
      `MOBILE_JWT_SECRET` e `GOOGLE_MOBILE_CLIENT_IDS` no ambiente
- [ ] **7b** Perfis `preview` e `production` no `eas.json`, com
      `EXPO_PUBLIC_API_URL` (HTTPS) nas variáveis do EAS
- [ ] **7c** Client Android do Google para a chave de produção (SHA-1 do EAS e,
      se for para a Play Store, a da Play)
- [ ] **7d** Build de produção (APK para instalar direto ou AAB para a Play
      Store) e teste completo contra a API de produção

### Etapa 8: acabamento

- [ ] **8a** Ícone e splash com a logo FN (fundo do splash no tema, não o azul
      do template; build nova), inclusive o ícone da notificação
      (`notification-icon.png`, branco com fundo transparente)
- [ ] **8b** (opcional) Rosca de categorias na Visão Geral com `react-native-svg`
- [ ] **8c** Formas decorativas no login (magenta e roxo, como no web)
- [ ] **8d** README com prints das telas nos dois modos
- [ ] **8e** Calendário próprio em JS no lugar do `DatePickerDialog` nativo:
      cabeçalho com a data num formato que caiba (ex.: "dom., 22 de nov."),
      fonte Space Grotesk, dia escolhido adesivo, setas de mês, seletor de ano
      (para prazos de meta) e rótulos para leitor de tela em cada dia e seta.
      O nativo não resolve: o `@expo/ui` não expõe o `dateFormatter` do
      Material 3, e a data por extenso em `headlineLarge` sai cortada

## Riscos e cuidados

- **iOS 16**: o SDK 58 exige iOS 16.4+. O iPhone 8 vai até 16.7.x, então só
  funciona atualizado. SDKs futuros devem deixar o iOS 16 de fora.
- **Expo Go** não roda o Google Sign-In: desenvolvimento só com development build.
- **Google Sign-In "Original"**: funciona, mas o SDK do Google por baixo está
  obsoleto no Android. Alternativa futura: `react-native-nitro-google-signin`.
- **SHA-1 por chave**: a keystore do EAS (dev) e a do Google Play têm SHA-1
  diferentes; cada uma precisa de um client Android no Google Cloud.
- **NativeWind e SDK 58**: a v4 declara suporte até o SDK 57.
- **Sombra dura no Android**: `elevation` sempre desfoca; usar `boxShadow` (sem desfoque).
- **Fontes no Android**: `fontWeight` não troca o peso de fonte personalizada;
  cada peso é uma família (`SpaceGrotesk_700Bold`).
- **Fuso horário**: o `referenceDate` é montado no fuso do servidor. Agrupar por
  mês do mesmo jeito que o web, para nada cair no mês errado.
- **IP do PC**: se mudar, o `.env` precisa ser atualizado (fixar o IP no roteador ajuda).
