import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { DateField } from '@/components/date-field';
import { ErrorBox } from '@/components/error-box';
import { FormField } from '@/components/form-field';
import { GoalSummary } from '@/components/goals/goal-summary';
import { Icon } from '@/components/icon';
import { Input } from '@/components/input';
import { MoneyInput } from '@/components/money-input';
import { Text } from '@/components/text';
import { useToast } from '@/components/toast';
import {
  ApiError,
  createGoal,
  deleteGoal,
  updateGoal,
  type Goal,
  type GoalInput,
  type GoalUpdate,
} from '@/lib/api';
import {
  checkMoney,
  checkText,
  formatMoneyInput,
  writeErrorMessage,
  type Check,
} from '@/lib/forms';
import {
  invalidateAfterWrite,
  queryClient,
  replaceListItem,
} from '@/lib/query-client';

type Field = 'name' | 'target' | 'current';
type Errors = Partial<Record<Field, string>>;

export type GoalFormProps = {
  /** Meta a editar; sem ela, o formulário cria uma nova. */
  goal?: Goal;
  /** Avisa a tela que está salvando (para travar o fechar). */
  onSavingChange?: (saving: boolean) => void;
};

/**
 * Só o que mudou: mandar o currentAmount sem a pessoa ter mexido nele apagaria
 * um aporte feito em outro aparelho enquanto a tela estava aberta.
 */
function changedFields(goal: Goal, input: GoalInput): GoalUpdate {
  const changes: GoalUpdate = {};
  if (input.name !== goal.name) changes.name = input.name;
  if (input.targetAmount !== goal.targetAmount) {
    changes.targetAmount = input.targetAmount;
  }
  if (input.currentAmount !== goal.currentAmount) {
    changes.currentAmount = input.currentAmount;
  }
  if (input.deadline !== goal.deadline) changes.deadline = input.deadline;
  return changes;
}

/**
 * Meta excluída em outro aparelho (404): o erro fica na tela e a lista por
 * trás recarrega, já sem ela.
 */
function refreshIfGone(error: Error) {
  if (error instanceof ApiError && error.status === 404) {
    void invalidateAfterWrite('goal');
  }
}

/**
 * Criar ou editar meta (GoalDialog do web). Na edição, "excluir meta" no fim,
 * com confirmação. Ao salvar, avisa, atualiza a lista
 * e fecha.
 */
export function GoalForm({ goal, onSavingChange }: GoalFormProps) {
  const toast = useToast();
  const [name, setName] = useState(goal?.name ?? '');
  const [target, setTarget] = useState(
    goal ? formatMoneyInput(goal.targetAmount) : '',
  );
  const [current, setCurrent] = useState(
    goal ? formatMoneyInput(goal.currentAmount) : '',
  );
  const [deadline, setDeadline] = useState<string | null>(
    goal?.deadline ?? null,
  );
  const [errors, setErrors] = useState<Errors>({});

  const mutation = useMutation({
    mutationFn: (input: GoalInput) =>
      goal
        ? updateGoal(goal.id, changedFields(goal, input))
        : createGoal(input),
    onMutate: () => onSavingChange?.(true),
    onSettled: () => onSavingChange?.(false),
    onSuccess: (saved) => {
      // Na edição, o card muda na hora; a recarga confirma
      if (goal) replaceListItem(['goals'], saved);
      void invalidateAfterWrite('goal');
      toast.show('success', goal ? 'Alterações salvas.' : 'Meta criada.');
    },
    onError: refreshIfGone,
  });

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const removal = useMutation({
    mutationFn: (id: string) => deleteGoal(id),
    onMutate: () => onSavingChange?.(true),
    onSettled: () => onSavingChange?.(false),
    onSuccess: (_, id) => {
      // Sai da lista na hora; a recarga confirma
      queryClient.setQueryData<Goal[]>(['goals'], (goals) =>
        goals?.filter((g) => g.id !== id),
      );
      void invalidateAfterWrite('goal');
      toast.show('success', 'Meta excluída.');
    },
    onError: refreshIfGone,
  });

  const saving = mutation.isPending || removal.isPending;

  function confirmDelete() {
    if (!goal) return;
    removal.mutate(goal.id, {
      // Como no salvar: não volta uma a mais se a tela já fechou
      onSuccess: () => {
        setConfirmingDelete(false);
        router.back();
      },
    });
  }

  function clearError(field: Field) {
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function submit() {
    const nameCheck = checkText(name, {
      max: 100,
      empty: 'Informe o nome da meta.',
    });
    const targetCheck = checkMoney(target);
    // Opcional: vazio é zero
    const currentCheck: Check<number> = current.trim()
      ? checkMoney(current, { allowZero: true })
      : { ok: true, value: 0 };
    setErrors({
      name: nameCheck.ok ? undefined : nameCheck.error,
      target: targetCheck.ok ? undefined : targetCheck.error,
      current: currentCheck.ok ? undefined : currentCheck.error,
    });
    if (!nameCheck.ok || !targetCheck.ok || !currentCheck.ok) return;

    const input: GoalInput = {
      name: nameCheck.value,
      targetAmount: targetCheck.value,
      currentAmount: currentCheck.value,
      deadline,
    };
    // Nada mudou: não há o que mandar
    if (goal && Object.keys(changedFields(goal, input)).length === 0) {
      router.back();
      return;
    }

    mutation.mutate(
      input,
      // Aqui, e não no useMutation: não dispara se a tela já fechou
      { onSuccess: () => router.back() },
    );
  }

  return (
    <View className='gap-5'>
      <FormField label='nome do objetivo' error={errors.name}>
        <Input
          accessibilityLabel='nome do objetivo'
          placeholder='Ex.: Viagem, Carro novo'
          maxLength={100}
          value={name}
          editable={!saving}
          invalid={!!errors.name}
          onChangeText={(text) => {
            setName(text);
            clearError('name');
          }}
        />
      </FormField>

      <FormField
        label={
          <>
            valor alvo (<Text className='normal-case'>R$</Text>)
          </>
        }
        error={errors.target}
      >
        <MoneyInput
          accessibilityLabel='valor alvo, em reais'
          value={target}
          editable={!saving}
          invalid={!!errors.target}
          onChangeText={(text) => {
            setTarget(text);
            clearError('target');
          }}
        />
      </FormField>

      <FormField
        label={
          <>
            já guardado (<Text className='normal-case'>R$</Text>)
          </>
        }
        error={errors.current}
        hint={
          goal
            ? 'Corrija se algum aporte foi lançado errado.'
            : 'Opcional. Vazio começa do zero.'
        }
      >
        <MoneyInput
          accessibilityLabel='já guardado, em reais'
          value={current}
          editable={!saving}
          invalid={!!errors.current}
          onChangeText={(text) => {
            setCurrent(text);
            clearError('current');
          }}
        />
      </FormField>

      <FormField label='prazo final' hint='Opcional. Vazio = sem prazo.'>
        <DateField
          accessibilityLabel='prazo final'
          clearable
          placeholder='Sem prazo'
          value={deadline}
          disabled={saving}
          onChange={setDeadline}
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
          {mutation.isPending ? 'salvando...' : 'salvar'}
        </Button>
      </View>

      {goal && (
        <>
          {/* Separada de cancelar/salvar, para não ser tocada por engano */}
          <View className='border-t border-border-custom pt-5'>
            <Button
              variant='expense'
              className='self-start px-4'
              disabled={saving}
              onPress={() => {
                removal.reset();
                setConfirmingDelete(true);
              }}
            >
              <Icon icon={Trash2} tone='expense' />
              excluir meta
            </Button>
          </View>
          <ConfirmDialog
            open={confirmingDelete}
            title='Excluir meta'
            description='A meta e o valor acumulado deixam de aparecer. Essa ação não poderá ser desfeita.'
            detail={
              <GoalSummary
                goal={goal}
                className='rounded-xl border border-border-custom p-3'
              />
            }
            loading={removal.isPending}
            error={removal.error ? writeErrorMessage(removal.error) : undefined}
            onConfirm={confirmDelete}
            onClose={() => setConfirmingDelete(false)}
          />
        </>
      )}
    </View>
  );
}
