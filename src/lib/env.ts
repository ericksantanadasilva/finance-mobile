// Configuração lida do .env. O Expo só substitui `process.env.EXPO_PUBLIC_*`
// escrito assim, por extenso: `process.env[nome]` e desestruturação não funcionam.
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

export const env = {
  apiUrl: parseApiUrl(rawApiUrl),
};
