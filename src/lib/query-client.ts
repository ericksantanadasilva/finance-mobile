// Cache das consultas à API (React Query). As consultas chamam o apiFetch,
// que já cuida do token e da renovação; aqui ficam as regras de repetição e
// de atualização.
import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';

import { ApiError } from './api';

// No celular não há "foco da janela": o equivalente é o app voltar para a
// frente. Assim os dados vencidos recarregam ao reabrir o app.
focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener('change', (state) => {
    handleFocus(state === 'active');
  });
  return () => subscription.remove();
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Trocar de aba ou voltar de uma tela não recarrega dados de menos de 30s
      staleTime: 30_000,
      retry: (failureCount, error) => {
        // 4xx não muda repetindo (o 401 já foi renovado pelo apiFetch)
        if (
          error instanceof ApiError &&
          error.status >= 400 &&
          error.status < 500
        ) {
          return false;
        }
        // Sem rede, tempo esgotado ou 5xx: mais 2 tentativas
        return failureCount < 2;
      },
    },
  },
});
