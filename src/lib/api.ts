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
