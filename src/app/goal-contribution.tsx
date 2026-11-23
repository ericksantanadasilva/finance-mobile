import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/button';
import { ErrorBox } from '@/components/error-box';
import { FormScreen } from '@/components/form-screen';
import { GoalContributionForm } from '@/components/goals/goal-contribution-form';
import type { Goal } from '@/lib/api';

/**
 * Adicionar valor a uma meta (/goal-contribution?id=...). Não há
 * GET /goals/:id: a meta vem da lista já carregada.
 */
export default function GoalContributionScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  // Lida uma vez: a lista recarregar por trás não troca o que está na tela
  const [goal] = useState(() =>
    queryClient
      .getQueryData<Goal[]>(['goals'])
      ?.find((g) => g.id === params.id),
  );

  if (!goal) return <NotFound />;

  return (
    <FormScreen title='Adicionar valor' closeDisabled={saving}>
      <GoalContributionForm goal={goal} onSavingChange={setSaving} />
    </FormScreen>
  );
}

/** Aberta por um link sem a lista carregada (ex.: o app foi reaberto aqui). */
function NotFound() {
  return (
    <FormScreen title='Adicionar valor'>
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
