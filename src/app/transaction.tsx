import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/button';
import { ErrorBox } from '@/components/error-box';
import { FormScreen } from '@/components/form-screen';
import { TransactionForm } from '@/components/transactions/transaction-form';
import type { TransactionsPage } from '@/lib/api';

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Lançar (/transaction?month=YYYY-MM) ou editar (/transaction?id=...).
 * Não há GET /transactions/:id: a transação editada vem da lista já carregada.
 */
export default function TransactionScreen() {
  const params = useLocalSearchParams<{ id?: string; month?: string }>();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  // Lida uma vez: a lista recarregar por trás não troca o que está no formulário
  const [transaction] = useState(() => {
    if (!params.id) return undefined;
    const lists = queryClient.getQueriesData<InfiniteData<TransactionsPage>>({
      queryKey: ['transactions'],
    });
    for (const [, data] of lists) {
      for (const page of data?.pages ?? []) {
        const found = page.items.find((tx) => tx.id === params.id);
        if (found) return found;
      }
    }
    return null;
  });

  if (transaction === null) return <NotFound />;

  return (
    <FormScreen
      title={transaction ? 'Editar lançamento' : 'Novo lançamento'}
      closeDisabled={saving}
    >
      <TransactionForm
        transaction={transaction}
        defaultMonth={
          params.month && MONTH.test(params.month) ? params.month : undefined
        }
        onSavingChange={setSaving}
      />
    </FormScreen>
  );
}

/** Aberta por um link sem a lista carregada (ex.: o app foi reaberto aqui). */
function NotFound() {
  return (
    <FormScreen title='Editar lançamento'>
      <ErrorBox message='Não foi possível abrir esta transação. Volte para a lista e tente de novo.' />
      <Button
        variant='outline'
        className='self-start'
        onPress={() => router.back()}
      >
        voltar
      </Button>
    </FormScreen>
  );
}
