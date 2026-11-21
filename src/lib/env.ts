import Constants from 'expo-constants';

// Configuração do app. A URL da API vem do .env; o client ID do Google, do
// app.json (não é segredo e o EAS Build não lê o .env).

// O Expo só substitui `process.env.EXPO_PUBLIC_*` escrito assim, por extenso:
// `process.env[nome]` e desestruturação não funcionam.
const rawApiUrl = process.env.EXPO_PUBLIC_API_URL;

function parseApiUrl(value: string | undefined) {
  const url = value?.trim();
  if (!url) {
    throw new Error(
      'EXPO_PUBLIC_API_URL não definida. Copie o .env.example para .env e reinicie o `npx expo start`.',
    );
  }
  if (!/^https?:\/\/[^\s/]+/.test(url)) {
    throw new Error(
      `EXPO_PUBLIC_API_URL inválida: "${url}". Use o formato http://192.168.0.10:3000.`,
    );
  }
  // Sem barra no fim, para montar as rotas como `${apiUrl}/api/v1/...`
  return url.replace(/\/+$/, '');
}

/** Client web do Google (o GOOGLE_CLIENT_ID do backend), em `expo.extra` do app.json. */
function parseGoogleWebClientId(value: unknown) {
  if (
    typeof value !== 'string' ||
    !value.endsWith('.apps.googleusercontent.com')
  ) {
    throw new Error(
      'expo.extra.googleWebClientId ausente ou inválido no app.json (deve terminar em .apps.googleusercontent.com).',
    );
  }
  return value;
}

export const env = {
  apiUrl: parseApiUrl(rawApiUrl),
  googleWebClientId: parseGoogleWebClientId(
    Constants.expoConfig?.extra?.googleWebClientId,
  ),
};
