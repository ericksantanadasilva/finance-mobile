import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { CategoryBadge } from '@/components/category-badge';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ErrorBox } from '@/components/error-box';
import { FormField } from '@/components/form-field';
import { Icon } from '@/components/icon';
import { MoneyInput } from '@/components/money-input';
import { Text } from '@/components/text';
import { useToast } from '@/components/toast';
import { setCategoryBudget, type CategoryBudget } from '@/lib/api';
import { shortMonthLabel } from '@/lib/dashboard';
import { formatCurrency } from '@/lib/format';
import { checkMoney, formatMoneyInput, writeErrorMessage } from '@/lib/forms';
import { invalidateAfterWrite, replaceListItem } from '@/lib/query-client';

export type CategoryBudgetFormProps = {
  category: CategoryBudget;
  /** Mês que a tela de Categorias mostra ("YYYY-MM"): o do gasto. */
  month: string;
  /** Avisa a tela que está salvando (para travar o fechar). */
  onSavingChange?: (saving: boolean) => void;
};

/**
 * Limite mensal de uma categoria: definir/alterar pelo campo; remover é uma
 * ação à parte, com confirmação (campo vazio não remove, como no contrato).
 */
export function CategoryBudgetForm({
  category,
  month,
  onSavingChange,
}: CategoryBudgetFormProps) {
  const toast = useToast();
  const hasBudget = !!category.budget;
  const [amount, setAmount] = useState(
    category.budget ? formatMoneyInput(category.budget) : '',
  );
  const [error, setError] = useState<string>();
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const mutation = useMutation({
    mutationFn: (budget: number | null) =>
      setCategoryBudget(category.id, budget, month),
    onMutate: () => onSavingChange?.(true),
    onSettled: () => onSavingChange?.(false),
    onSuccess: (updated, budget) => {
      // O card muda na hora; a recarga confirma (e atualiza os outros meses)
      replaceListItem(['categories', month], updated);
      void invalidateAfterWrite('category');
      toast.show(
        'success',
        budget === null
          ? `Limite de ${category.name} removido.`
          : `Limite de ${category.name} ${hasBudget ? 'alterado' : 'definido'}.`,
      );
    },
  });
  const saving = mutation.isPending;
  const removing = saving && mutation.variables === null;

  function submit() {
    const check = checkMoney(amount);
    setError(check.ok ? undefined : check.error);
    if (!check.ok) return;
    mutation.mutate(check.value, {
      // Aqui, e não no useMutation: não dispara se a tela já fechou
      onSuccess: () => router.back(),
    });
  }

  function remove() {
    mutation.mutate(null, {
      onSuccess: () => {
        setConfirmingRemove(false);
        router.back();
      },
    });
  }

  return (
    <View className='gap-5'>
      <View className='flex-row'>
        <CategoryBadge name={category.name} color={category.color} />
      </View>

      <FormField
        label='quanto posso gastar por mês?'
        error={error}
        hint='O limite vale para todos os meses.'
      >
        <MoneyInput
          accessibilityLabel={`limite mensal de ${category.name}, em reais`}
          value={amount}
          editable={!saving}
          invalid={!!error}
          onChangeText={(text) => {
            setAmount(text);
            setError(undefined);
          }}
        />
      </FormField>

      <Text variant='value' tone='muted' className='text-sm font-medium'>
        Gasto em {shortMonthLabel(month)}: {formatCurrency(category.spent)}
      </Text>

      {/* O erro da remoção aparece no diálogo */}
      {mutation.error && !confirmingRemove && (
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
          accessibilityState={{ disabled: saving, busy: saving && !removing }}
          onPress={submit}
        >
          {saving && !removing ? 'salvando...' : 'salvar'}
        </Button>
      </View>

      {hasBudget && (
        <>
          {/* Separada de cancelar/salvar, para não ser tocada por engano */}
          <View className='border-t border-border-custom pt-5'>
            <Button
              variant='expense'
              className='self-start px-4'
              disabled={saving}
              onPress={() => {
                mutation.reset();
                setConfirmingRemove(true);
              }}
            >
              <Icon icon={Trash2} tone='expense' />
              remover limite
            </Button>
          </View>
          <ConfirmDialog
            open={confirmingRemove}
            title='Remover limite'
            description='Os gastos continuam registrados; a categoria só deixa de ter limite e alertas.'
            detail={
              <View className='flex-row flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border-custom p-3'>
                <View className='shrink'>
                  <CategoryBadge name={category.name} color={category.color} />
                </View>
                <Text variant='value' className='text-sm font-bold'>
                  limite de {formatCurrency(category.budget ?? 0)}
                </Text>
              </View>
            }
            confirmLabel='remover'
            confirmingLabel='removendo...'
            loading={removing}
            error={
              mutation.error && mutation.variables === null
                ? writeErrorMessage(mutation.error)
                : undefined
            }
            onConfirm={remove}
            onClose={() => setConfirmingRemove(false)}
          />
        </>
      )}
    </View>
  );
}
