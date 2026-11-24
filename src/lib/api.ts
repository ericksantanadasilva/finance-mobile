// Cliente da API do backend (/api/v1). Envia o access token como Bearer e,
// quando ele expira (401), renova com o refresh token e repete a chamada.
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { env } from './env';
import { clearTokens, loadTokens, saveTokens, type Tokens } from './session';

const TIMEOUT_MS = 15_000;

export type User = {
  id: string;
  name: string;
  email?: string;
  image: string | null;
};

type TokensResponse = Tokens & { expiresIn: number };

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
};

/** Erro de uma chamada à API. `status` 0 = sem resposta (rede ou tempo esgotado). */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Fim da sessão: o Context de sessão se registra aqui para voltar ao login.

let onSessionEnded: (() => void) | null = null;

export function setSessionEndedHandler(handler: (() => void) | null) {
  onSessionEnded = handler;
}

async function endSession() {
  await clearTokens();
  onSessionEnded?.();
}

// ---------------------------------------------------------------------------
// Requisição crua: monta a URL e os headers e transforma falha de rede em ApiError.

async function send(
  path: string,
  { method = 'GET', body }: RequestOptions,
  accessToken?: string,
) {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    return await fetch(`${env.apiUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'AbortError';
    throw new ApiError(
      0,
      timedOut
        ? 'O servidor demorou demais para responder.'
        : 'Sem conexão com o servidor.',
    );
  } finally {
    clearTimeout(timeout);
  }
}

/** Lê o JSON da resposta; status de erro vira ApiError com a mensagem do backend. */
async function parse<T>(response: Response): Promise<T> {
  // O tipo T não é validado aqui: confiamos no contrato das rotas /api/v1
  if (response.status === 204) return undefined as T;

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      data &&
      typeof data === 'object' &&
      'error' in data &&
      typeof data.error === 'string'
        ? data.error
        : `HTTP ${response.status}`;
    throw new ApiError(response.status, message);
  }
  return data as T;
}

// ---------------------------------------------------------------------------
// Renovação. O backend gira o refresh token a cada uso: o antigo deixa de
// valer. Se duas chamadas renovassem ao mesmo tempo com o mesmo token, a
// segunda levaria 401 e derrubaria a sessão. Por isso existe uma renovação
// por vez: quem chega enquanto ela está em andamento espera a mesma promessa.

let refreshing: Promise<string | null> | null = null;

/** Novo access token, ou null se a sessão acabou (refresh token recusado). */
function refreshAccessToken() {
  refreshing ??= doRefresh().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

async function doRefresh(): Promise<string | null> {
  const tokens = await loadTokens();
  if (!tokens) return null;

  const response = await send('/api/v1/auth/refresh', {
    method: 'POST',
    body: { refreshToken: tokens.refreshToken },
  });

  if (response.status === 401) {
    await endSession();
    return null;
  }
  // Erro 500 ou de rede sobe como ApiError e os tokens são mantidos:
  // a sessão continua válida, só não deu para renovar agora.
  const next = await parse<TokensResponse>(response);

  // Se o usuário saiu enquanto a renovação estava em andamento, não recria a sessão
  const current = await loadTokens();
  if (current?.refreshToken !== tokens.refreshToken) {
    return current?.accessToken ?? null;
  }

  await saveTokens({
    accessToken: next.accessToken,
    refreshToken: next.refreshToken,
  });
  return next.accessToken;
}

/** Chamada autenticada. Renova o token uma vez se a API responder 401. */
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const tokens = await loadTokens();
  if (!tokens) throw new ApiError(401, 'Sessão encerrada.');

  let response = await send(path, options, tokens.accessToken);

  if (response.status === 401) {
    // Outra chamada pode ter renovado enquanto esta esperava a resposta:
    // nesse caso basta usar o token novo, sem renovar de novo.
    const current = await loadTokens();
    const accessToken =
      current && current.accessToken !== tokens.accessToken
        ? current.accessToken
        : await refreshAccessToken();
    if (!accessToken) throw new ApiError(401, 'Sessão expirada.');

    response = await send(path, options, accessToken);
    // Token recém-renovado recusado: a sessão foi revogada no servidor
    if (response.status === 401) await endSession();
  }

  return parse<T>(response);
}

// ---------------------------------------------------------------------------
// Rotas de autenticação

/** Troca o ID token do Google pelos tokens da API e salva no aparelho. */
export async function loginWithGoogle(idToken: string): Promise<User> {
  const response = await send('/api/v1/auth/google', {
    method: 'POST',
    body: {
      idToken,
      deviceName: Device.modelName ?? undefined,
      platform:
        Platform.OS === 'ios' || Platform.OS === 'android'
          ? Platform.OS
          : undefined,
    },
  });
  const data = await parse<TokensResponse & { user: User }>(response);

  await saveTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });
  return data.user;
}

/**
 * Sai do aparelho. Apaga os tokens locais primeiro, para sair funcionar mesmo
 * sem rede; depois pede ao backend para revogar a sessão.
 */
export async function logout() {
  const tokens = await loadTokens();
  await clearTokens();
  if (!tokens) return;

  try {
    await parse<void>(
      await send('/api/v1/auth/logout', {
        method: 'POST',
        body: { refreshToken: tokens.refreshToken },
      }),
    );
  } catch (error) {
    // O usuário já saiu no aparelho; sem revogar, a sessão expira sozinha no servidor
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Não foi possível revogar a sessão no servidor: ${message}`);
  }
}

export function getMe() {
  return apiFetch<User>('/api/v1/me');
}

// ---------------------------------------------------------------------------
// Visão Geral

/** Soma por mês de competência, tipo e categoria (getDashboardTotals do web). */
export type DashboardTotal = {
  /** ISO; dia 1 do mês de competência, ao meio-dia do fuso do servidor. */
  referenceDate: string;
  type: 'income' | 'expense';
  /** Pago/recebido. Opcional: backend sem a 4i não manda (conta como pago). */
  isPaid?: boolean;
  amount: number;
  category: { name: string; color: string } | null;
};

export async function getDashboard() {
  const data = await apiFetch<{ totals: DashboardTotal[] }>(
    '/api/v1/dashboard',
  );
  return data.totals;
}

// ---------------------------------------------------------------------------
// Transações

export type TransactionItem = {
  id: string;
  description: string;
  amount: number;
  /** ISO; data da compra (sem horário: meio-dia UTC, ou meia-noite nos antigos). */
  date: string;
  referenceDate: string;
  type: 'income' | 'expense';
  isPaid: boolean;
  recurringRuleId: string | null;
  category: { name: string; color: string } | null;
};

export type TransactionSort =
  'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

/** Mesmos filtros da tela web (ver financeiro/app/api/v1/transactions). */
export type TransactionFilters = {
  /** "YYYY-MM" ou "all". */
  month: string;
  q?: string;
  category?: string;
  type?: 'income' | 'expense';
  status?: 'paid' | 'pending';
  sort?: TransactionSort;
};

export type TransactionsPage = {
  items: TransactionItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  /** Do conjunto filtrado inteiro (não só da página). */
  totals: {
    /** Por competência, conta tudo (pago ou não). */
    income: number;
    expense: number;
    /** Sobra dos meses anteriores, só o pago. */
    carryOver: number;
    /**
     * Saldo só pelo pago: carryOver + recebido − pago do conjunto. Opcional:
     * backend sem a 4i não manda.
     */
    balance?: number;
  };
  categories: string[];
  months: string[];
};

export function getTransactions(
  filters: TransactionFilters,
  page: number,
  pageSize = 20,
) {
  const params = new URLSearchParams({
    month: filters.month,
    page: String(page),
    pageSize: String(pageSize),
  });
  if (filters.q?.trim()) params.set('q', filters.q.trim());
  if (filters.category) params.set('category', filters.category);
  if (filters.type) params.set('type', filters.type);
  if (filters.status) params.set('status', filters.status);
  if (filters.sort) params.set('sort', filters.sort);

  return apiFetch<TransactionsPage>(`/api/v1/transactions?${params}`);
}

/** Body de lançamento e de edição (transactionBodySchema do backend). */
export type TransactionInput = {
  /** 1 a 200 caracteres. */
  description: string;
  /** > 0, até 2 casas. */
  amount: number;
  /** "YYYY-MM-DD": data da compra. */
  date: string;
  type: 'income' | 'expense';
  /** Nome (1 a 50); o servidor cria a categoria se não existir. */
  category: string;
  /** "YYYY-MM": mês de competência. */
  referenceMonth: string;
  /**
   * Pago/recebido. Opcional na API (sem ele, o lançamento nasce pago e a
   * edição mantém o atual), mas o app sempre manda. Precisa da 4j: sem ela,
   * a edição com isPaid dá 400.
   */
  isPaid: boolean;
};

/** Despesa que passou de 80% do limite da categoria no mês de competência. */
export type BudgetAlert = {
  category: string;
  spent: number;
  budget: number;
  /** Em 2 casas (arredondado no servidor). */
  percent: number;
};

/** 201 com a transação no formato da lista e o alerta de orçamento, se houver. */
export function createTransaction(input: TransactionInput) {
  return apiFetch<{
    transaction: TransactionItem;
    budgetAlert: BudgetAlert | null;
  }>('/api/v1/transactions', { method: 'POST', body: input });
}

/** Edição completa (o app sempre manda todos os campos). */
export function updateTransaction(id: string, input: TransactionInput) {
  return apiFetch<{ transaction: TransactionItem }>(
    `/api/v1/transactions/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: input },
  );
}

/** Marca como paga/recebida ou volta para pendente (desfazer). */
export function setTransactionPaid(id: string, isPaid: boolean) {
  return apiFetch<{ transaction: TransactionItem }>(
    `/api/v1/transactions/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: { isPaid } },
  );
}

/** Exclui a transação (204, sem corpo). Não há como desfazer. */
export function deleteTransaction(id: string) {
  return apiFetch<void>(`/api/v1/transactions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// ---------------------------------------------------------------------------
// Categorias

/** Categoria com o limite mensal e o gasto no mês de competência. */
export type CategoryBudget = {
  id: string;
  name: string;
  color: string;
  budget: number | null;
  spent: number;
  /** spent / budget * 100 (pode ter resíduo de ponto flutuante); null sem limite. */
  percent: number | null;
};

/** `month` "YYYY-MM"; sem ele, o servidor usa o mês atual. */
export async function getCategories(month?: string) {
  const query = month ? `?month=${encodeURIComponent(month)}` : '';
  const data = await apiFetch<{ categories: CategoryBudget[] }>(
    `/api/v1/categories${query}`,
  );
  return data.categories;
}

/**
 * Define/altera (`budget` > 0) ou remove (`null`) o limite mensal. O limite
 * vale para todos os meses; `month` só escolhe o gasto que volta na resposta.
 */
export async function setCategoryBudget(
  id: string,
  budget: number | null,
  month?: string,
) {
  const query = month ? `?month=${encodeURIComponent(month)}` : '';
  const data = await apiFetch<{ category: CategoryBudget }>(
    `/api/v1/categories/${encodeURIComponent(id)}${query}`,
    { method: 'PATCH', body: { budget } },
  );
  return data.category;
}

// ---------------------------------------------------------------------------
// Recorrentes

export type RecurringRule = {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  dayOfMonth: number;
  /** "YYYY-MM". */
  startMonth: string;
  active: boolean;
  /** "YYYY-MM" do último mês gerado, ou null se nunca gerou. */
  lastGeneratedMonth: string | null;
  category: { name: string; color: string } | null;
};

/** Ativas primeiro, depois por descrição (ordem do servidor, como no web). */
export async function getRecurringRules() {
  const data = await apiFetch<{ rules: RecurringRule[] }>('/api/v1/recurring');
  return data.rules;
}

export type RecurringRuleInput = {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  /** Nome; vazio = sem categoria (criada se não existir). */
  category: string;
  /** 1 a 31; meses curtos usam o último dia. */
  dayOfMonth: number;
  /** "YYYY-MM". */
  startMonth: string;
};

/** Cria a regra; o servidor já lança as ocorrências do início até o mês atual. */
export async function createRecurringRule(input: RecurringRuleInput) {
  const data = await apiFetch<{ rule: RecurringRule }>('/api/v1/recurring', {
    method: 'POST',
    body: input,
  });
  return data.rule;
}

/** Pausa (false) ou retoma (true). Retomar segue do mês atual, sem os meses pausados. */
export async function setRecurringActive(id: string, active: boolean) {
  const data = await apiFetch<{ rule: RecurringRule }>(
    `/api/v1/recurring/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: { active } },
  );
  return data.rule;
}

/** Exclui a regra (204). As transações já lançadas ficam no histórico. */
export function deleteRecurringRule(id: string) {
  return apiFetch<void>(`/api/v1/recurring/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// ---------------------------------------------------------------------------
// Metas

export type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  /** "YYYY-MM-DD" ou null (sem prazo). */
  deadline: string | null;
  /**
   * ISO; início do ritmo (metas antigas: o instante embutido no id). Opcional:
   * backend sem a migration add_goal_created_at não manda.
   */
  createdAt?: string;
};

/** Ordenadas por prazo (ordem do servidor, como no web). */
export async function getGoals() {
  const data = await apiFetch<{ goals: Goal[] }>('/api/v1/goals');
  return data.goals;
}

export type GoalInput = {
  name: string;
  targetAmount: number;
  /** Já guardado (>= 0). */
  currentAmount: number;
  /** "YYYY-MM-DD" ou null (sem prazo). */
  deadline: string | null;
};

/** Cria a meta; volta no formato de GET /goals, já com createdAt. */
export async function createGoal(input: GoalInput) {
  const data = await apiFetch<{ goal: Goal }>('/api/v1/goals', {
    method: 'POST',
    body: input,
  });
  return data.goal;
}

/** Aporte (> 0, incremento no servidor). Passar do objetivo é permitido. */
export async function addToGoal(id: string, amount: number) {
  const data = await apiFetch<{ goal: Goal }>(
    `/api/v1/goals/${encodeURIComponent(id)}/contributions`,
    { method: 'POST', body: { amount } },
  );
  return data.goal;
}

// ---------------------------------------------------------------------------
// Aparelhos (push)

/**
 * Registra (ou renova) o aparelho para push, ligado à sessão atual. Upsert
 * pelo token no servidor: chamar a cada abertura é seguro.
 */
export async function registerPushDevice(expoPushToken: string) {
  const data = await apiFetch<{ device: { id: string } }>('/api/v1/devices', {
    method: 'POST',
    body: { expoPushToken, platform: 'android' },
  });
  return data.device;
}

/** Para de enviar push ao aparelho (204; 404 se já não existir). */
export function deletePushDevice(id: string) {
  return apiFetch<void>(`/api/v1/devices/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
