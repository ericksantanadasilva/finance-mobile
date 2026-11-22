// Cache das consultas à API (React Query). As consultas chamam o apiFetch,
// que já cuida do token e da renovação; aqui ficam as regras de repetição e
// de atualização.
import {
  focusManager,
  QueryClient,
  type QueryKey,
} from '@tanstack/react-query';
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

// ---------------------------------------------------------------------------
// Depois de gravar. Cada gravação diz o que mudou; as consultas afetadas
// recarregam: as que estão na tela, na hora; as outras, ao serem abertas.
// Invalidar (em vez de montar o cache à mão) mantém iguais ao servidor os
// totais, as ordens e os filtros que o app não calcula.

const AFFECTED = {
  // Totais do mês, gasto das categorias e a própria lista
  transaction: [['transactions'], ['dashboard'], ['categories']],
  category: [['categories']],
  // Criar e retomar geram transações no servidor
  recurring: [['recurring'], ['transactions'], ['dashboard'], ['categories']],
  goal: [['goals']],
} satisfies Record<string, QueryKey[]>;

export type WrittenResource = keyof typeof AFFECTED;

/** Marca como vencidas as consultas que a gravação mudou (por prefixo da chave). */
export function invalidateAfterWrite(resource: WrittenResource) {
  return Promise.all(
    AFFECTED[resource].map((queryKey) =>
      queryClient.invalidateQueries({ queryKey }),
    ),
  );
}

/**
 * Troca um item numa lista simples do cache (ex.: ['goals']) pelo que a API
 * devolveu, para a tela mudar sem esperar a recarga. Use junto com
 * invalidateAfterWrite, que confirma com o servidor.
 */
export function replaceListItem<T extends { id: string }>(
  queryKey: QueryKey,
  item: T,
) {
  queryClient.setQueryData<T[]>(queryKey, (list) =>
    list?.map((current) => (current.id === item.id ? item : current)),
  );
}
