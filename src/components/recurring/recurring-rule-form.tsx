import { useMutation, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { CategorySelect } from '@/components/category-select';
import { ChipSelect } from '@/components/chip-select';
import { ErrorBox } from '@/components/error-box';
import { FormField } from '@/components/form-field';
import { Input } from '@/components/input';
import { MoneyInput } from '@/components/money-input';
import { useToast } from '@/components/toast';
import { TypeSelect, type TransactionType } from '@/components/type-select';
import {
  createRecurringRule,
  getCategories,
  type RecurringRuleInput,
} from '@/lib/api';
import { currentMonthISO, shortMonthLabel } from '@/lib/dashboard';
import {
  categoryOptions,
  checkMoney,
  checkText,
  startMonthOptions,
  writeErrorMessage,
} from '@/lib/forms';
import { invalidateAfterWrite } from '@/lib/query-client';

type Field = 'amount' | 'description' | 'category' | 'day';
type Errors = Partial<Record<Field, string>>;

/** Dia do mês, inteiro de 1 a 31. */
function checkDay(text: string) {
  const value = Number(text.trim());
  if (!text.trim()) return { ok: false, error: 'Informe o dia.' } as const;
  if (!Number.isInteger(value) || value < 1 || value > 31) {
    return { ok: false, error: 'Use um dia de 1 a 31.' } as const;
  }
  return { ok: true, value } as const;
}

export type RecurringRuleFormProps = {
  /** Avisa a tela que está salvando (para travar o fechar). */
  onSavingChange?: (saving: boolean) => void;
};

/** Criar recorrência (RecurringDialog do web). Ao salvar, avisa, atualiza e fecha. */
export function RecurringRuleForm({ onSavingChange }: RecurringRuleFormProps) {
  const toast = useToast();
  const currentMonth = currentMonthISO();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  // Opcional na recorrência: "" = sem categoria
  const [category, setCategory] = useState('');
  const [day, setDay] = useState('5');
  const [startMonth, setStartMonth] = useState(currentMonth);
  const [errors, setErrors] = useState<Errors>({});

  const categories = useQuery({
    // Mesma chave da tela de Categorias: reaproveita o cache
    queryKey: ['categories', currentMonth],
    queryFn: () => getCategories(currentMonth),
  });
  const categoryNames = categoryOptions(
    categories.data?.map((c) => c.name) ?? [],
  );

  const mutation = useMutation({
    mutationFn: (input: RecurringRuleInput) => createRecurringRule(input),
    onMutate: () => onSavingChange?.(true),
    onSettled: () => onSavingChange?.(false),
    onSuccess: () => {
      // Gera transações no servidor: listas, totais e categorias mudam
      void invalidateAfterWrite('recurring');
      toast.show('success', 'Recorrência criada.');
    },
  });
  const saving = mutation.isPending;

  function clearError(field: Field) {
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function submit() {
    const amountCheck = checkMoney(amount);
    const descriptionCheck = checkText(description, {
      max: 200,
      empty: 'Informe a descrição.',
    });
    // Vazia é permitida; só o tamanho de uma nova é conferido
    const categoryCheck = category.trim()
      ? checkText(category, { max: 50, empty: '' })
      : ({ ok: true, value: '' } as const);
    const dayCheck = checkDay(day);
    setErrors({
      amount: amountCheck.ok ? undefined : amountCheck.error,
      description: descriptionCheck.ok ? undefined : descriptionCheck.error,
      category: categoryCheck.ok ? undefined : categoryCheck.error,
      day: dayCheck.ok ? undefined : dayCheck.error,
    });
    if (
      !amountCheck.ok ||
      !descriptionCheck.ok ||
      !categoryCheck.ok ||
      !dayCheck.ok
    )
      return;

    mutation.mutate(
      {
        type,
        amount: amountCheck.value,
        description: descriptionCheck.value,
        category: categoryCheck.value,
        dayOfMonth: dayCheck.value,
        startMonth,
      },
      // Aqui, e não no useMutation: não dispara se a tela já fechou
      { onSuccess: () => router.back() },
    );
  }

  return (
    <View className='gap-5'>
      <TypeSelect value={type} onChange={setType} disabled={saving} />

      <FormField label='valor por mês' error={errors.amount}>
        <MoneyInput
          accessibilityLabel='valor por mês, em reais'
          value={amount}
          editable={!saving}
          invalid={!!errors.amount}
          onChangeText={(text) => {
            setAmount(text);
            clearError('amount');
          }}
        />
      </FormField>

      <FormField label='descrição' error={errors.description}>
        <Input
          accessibilityLabel='descrição'
          placeholder='Ex.: Aluguel, Netflix, Salário'
          maxLength={200}
          value={description}
          editable={!saving}
          invalid={!!errors.description}
          onChangeText={(text) => {
            setDescription(text);
            clearError('description');
          }}
        />
      </FormField>

      <FormField label='categoria' error={errors.category}>
        <View className='gap-3'>
          {/* Sem a lista do servidor, ainda dá para usar as padrão ou criar uma */}
          {categories.isError && (
            <ErrorBox
              message='Não foi possível carregar suas categorias.'
              onRetry={() => categories.refetch()}
            />
          )}
          <CategorySelect
            allowNone
            options={categoryNames}
            value={category}
            invalid={!!errors.category}
            onChange={(name) => {
              setCategory(name);
              clearError('category');
            }}
          />
        </View>
      </FormField>

      <FormField
        label='todo dia'
        error={errors.day}
        hint='Nos meses mais curtos, entra no último dia.'
      >
        <Input
          accessibilityLabel='dia do mês'
          keyboardType='number-pad'
          inputMode='numeric'
          maxLength={2}
          value={day}
          editable={!saving}
          invalid={!!errors.day}
          onChangeText={(text) => {
            setDay(text);
            clearError('day');
          }}
        />
      </FormField>

      <FormField
        label='começa em'
        hint={
          startMonth < currentMonth
            ? 'Os meses desde então serão lançados agora, como pagos.'
            : undefined
        }
      >
        <ChipSelect
          options={startMonthOptions().map((m) => ({
            value: m,
            label: shortMonthLabel(m),
          }))}
          value={startMonth}
          onChange={setStartMonth}
          accessibilityLabel='começa em'
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
          {saving ? 'salvando...' : 'salvar'}
        </Button>
      </View>
    </View>
  );
}
