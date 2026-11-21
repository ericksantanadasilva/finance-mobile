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

- [ ] **1a** Remover telas, componentes, hooks, imagens e script de exemplo do template
- [ ] **1b** Prettier (dev, versão fixa) + `.prettierrc` igual ao `financeiro`
- [ ] **1c** `.gitignore`: ignorar `.env` e `.env.*` (exceto `.env.example`); remover a linha `example`
- [ ] **1d** `EXPO_PUBLIC_API_URL` + `.env.example` + `src/lib/env.ts`
- [ ] **1e** Identidade no `app.json`: nome, slug, scheme, `android.package`, `ios.bundleIdentifier`

### Etapa 2: login com Google

- [ ] **2a** Conta Expo, `eas init`, `eas.json` (perfil `development`), primeira development build Android
- [ ] **2b** SHA-1 (`eas credentials`) → client Android no Google Cloud (mesmo projeto do `GOOGLE_CLIENT_ID`) → `GOOGLE_MOBILE_CLIENT_IDS` no backend
- [ ] **2c** Pacotes: `@react-native-google-signin/google-signin`, `expo-secure-store`, `expo-dev-client` (+ plugin no `app.json`)
- [ ] **2d** Rede local: confirmar HTTP para o IP do PC; se bloqueado, `expo-build-properties` (`usesCleartextTraffic`) só em desenvolvimento
- [ ] **2e** `src/lib/session.ts`, `src/lib/api.ts`, Context de sessão
- [ ] **2f** Telas de login e de sessão (perfil + sair); erros: cancelado, sem rede, 401, 403, 500

### Etapa 3: tema

- [ ] **3a** NativeWind v4 + tokens do `DESIGN_SYSTEM.md` como variáveis CSS (claro/escuro, sem `dark:`)
- [ ] **3b** Fontes Space Grotesk e Space Mono (`@expo-google-fonts/*`, plugin do `expo-font`)
- [ ] **3c** Componentes base: `Button`, `Card`/`CardHeader`, `TypeIcon`, `CategoryBadge`, `StatCard`, `Skeleton`, `EmptyState`, `ErrorBox`
- [ ] **3d** Aplicar o tema nas telas da Etapa 2

### Etapa 4: telas de leitura

- [ ] **4a** Instalar `@tanstack/react-query`; Tabs em JavaScript
- [ ] **4b** Visão Geral (`GET /dashboard`, agregação por mês no app)
- [ ] **4c** Transações (`GET /transactions`, paginação e filtro de mês)
- [ ] **4d** Categorias (`GET /categories`, orçamento com barra de progresso)
- [ ] **4e** Recorrentes (`GET /recurring`)
- [ ] **4f** Metas (`GET /goals`)

Toda tela: carregando (skeleton), vazio, erro e sucesso; puxar para atualizar;
360px sem rolagem lateral; receita/despesa com seta; `R$` em pt-BR.

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
