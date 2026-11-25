import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/button';
import { ErrorBox } from '@/components/error-box';
import { FormScreen } from '@/components/form-screen';
import { GoalForm } from '@/components/goals/goal-form';
import type { Goal } from '@/lib/api';

/**
 * Criar (/goal) ou editar (/goal?id=...) meta. Não há GET /goals/:id: a meta
 * editada vem da lista já carregada.
 */
export default function GoalScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  // Lida uma vez: a lista recarregar por trás não troca o que está no formulário
  const [goal] = useState(() => {
    if (!params.id) return undefined;
    return (
      queryClient
        .getQueryData<Goal[]>(['goals'])
        ?.find((g) => g.id === params.id) ?? null
    );
  });

  if (goal === null) return <NotFound />;

  return (
    <FormScreen
      title={goal ? 'Editar meta' : 'Nova meta'}
      closeDisabled={saving}
    >
      <GoalForm goal={goal} onSavingChange={setSaving} />
    </FormScreen>
  );
}

/** Aberta por um link sem a lista carregada (ex.: o app foi reaberto aqui). */
function NotFound() {
  return (
    <FormScreen title='Editar meta'>
      <ErrorBox message='Não foi possível abrir esta meta. Volte para a lista e tente de novo.' />
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
