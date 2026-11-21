// Tokens da API guardados no SecureStore (criptografado pelo sistema).
// Uma cópia fica em memória para não ler o armazenamento a cada requisição.
import * as SecureStore from 'expo-secure-store';

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

const ACCESS_TOKEN_KEY = 'finance.accessToken';
const REFRESH_TOKEN_KEY = 'finance.refreshToken';

// undefined = ainda não lido do aparelho; null = sem sessão
let cached: Tokens | null | undefined;

export async function loadTokens(): Promise<Tokens | null> {
  if (cached !== undefined) return cached;

  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  ]);
  cached = accessToken && refreshToken ? { accessToken, refreshToken } : null;
  return cached;
}

export async function saveTokens(tokens: Tokens) {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
  ]);
  cached = tokens;
}

/**
 * Só em desenvolvimento: troca o access token em memória por um inválido,
 * para a próxima chamada levar 401 e testar a renovação. O SecureStore não muda.
 */
export function breakAccessTokenForTesting() {
  if (!__DEV__ || !cached) return;
  cached = { ...cached, accessToken: 'token-invalido-de-teste' };
}

export async function clearTokens() {
  cached = null;
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}
