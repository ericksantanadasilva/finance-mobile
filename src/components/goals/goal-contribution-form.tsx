import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { ErrorBox } from '@/components/error-box';
import { FormField } from '@/components/form-field';
import { GoalSummary } from '@/components/goals/goal-summary';
import { MoneyInput } from '@/components/money-input';
import { useToast } from '@/components/toast';
import { addToGoal, type Goal } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { checkMoney, writeErrorMessage } from '@/lib/forms';
import { invalidateAfterWrite, replaceListItem } from '@/lib/query-client';

export type GoalContributionFormProps = {
  goal: Goal;
  /** Avisa a tela que está salvando (para travar o fechar). */
  onSavingChange?: (saving: boolean) => void;
};

/**
 * Aporte na meta (UpdateGoalDialog do web). Sem desfazer: a API só aceita
 * valor > 0. Se o aporte completa a meta, o aviso diz isso na mesma mensagem.
 */
export function GoalContributionForm({
  goal,
  onSavingChange,
}: GoalContributionFormProps) {
  const toast = useToast();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string>();

  const mutation = useMutation({
    mutationFn: (value: number) => addToGoal(goal.id, value),
    onMutate: () => onSavingChange?.(true),
    onSettled: () => onSavingChange?.(false),
    onSuccess: (updated, value) => {
      // O card muda na hora; a recarga confirma
      replaceListItem(['goals'], updated);
      void invalidateAfterWrite('goal');
      const added = formatCurrency(value);
      const completed =
        goal.currentAmount < goal.targetAmount &&
        updated.currentAmount >= updated.targetAmount;
      toast.show(
        'success',
        completed
          ? `${added} adicionados. Meta ${goal.name} concluída!`
          : `${added} adicionados à meta.`,
      );
    },
  });
  const saving = mutation.isPending;

  function submit() {
    const check = checkMoney(amount);
    setError(check.ok ? undefined : check.error);
    if (!check.ok) return;
    mutation.mutate(check.value, {
      // Aqui, e não no useMutation: não dispara se a tela já fechou
      onSuccess: () => router.back(),
    });
  }

  return (
    <View className='gap-5'>
      <GoalSummary goal={goal} />

      <FormField label='quanto deseja adicionar?' error={error}>
        <MoneyInput
          accessibilityLabel={`valor a adicionar em ${goal.name}, em reais`}
          autoFocus
          value={amount}
          editable={!saving}
          invalid={!!error}
          onChangeText={(text) => {
            setAmount(text);
            setError(undefined);
          }}
        />
      </FormField>

      {mutation.error && (
        <ErrorBox message={writeErrorMessage(mutation.error)} />
      )}

      <View className='flex-row gap-3 pb-1 pr-1'>
        <Button
          variant='outline'
          size='lg'
          className='flex-1 px-4'
          disabled={saving}
          onPress={() => router.back()}
        >
          cancelar
        </Button>
        <Button
          size='lg'
          className='flex-1 px-4'
          disabled={saving}
          accessibilityState={{ disabled: saving, busy: saving }}
          onPress={submit}
        >
          {saving ? 'salvando...' : 'adicionar'}
        </Button>
      </View>
    </View>
  );
}
