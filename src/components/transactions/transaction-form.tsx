import { useMutation, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { CategorySelect } from '@/components/category-select';
import { ChipSelect } from '@/components/chip-select';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { DateField } from '@/components/date-field';
import { ErrorBox } from '@/components/error-box';
import { FormField } from '@/components/form-field';
import { Icon } from '@/components/icon';
import { Input } from '@/components/input';
import { MoneyInput } from '@/components/money-input';
import { Text } from '@/components/text';
import { useToast } from '@/components/toast';
import { TypeAmountDetail } from '@/components/type-amount-detail';
import { TypeSelect, type TransactionType } from '@/components/type-select';
import {
  createTransaction,
  deleteTransaction,
  getCategories,
  updateTransaction,
  type BudgetAlert,
  type TransactionInput,
  type TransactionItem,
} from '@/lib/api';
import { currentMonthISO, shortMonthLabel } from '@/lib/dashboard';
import { todayISO } from '@/lib/dates';
import { formatCurrency } from '@/lib/format';
import {
  categoryOptions,
  checkMoney,
  checkText,
  formatMoneyInput,
  referenceMonthOptions,
  writeErrorMessage,
} from '@/lib/forms';
import { invalidateAfterWrite } from '@/lib/query-client';

type Field = 'amount' | 'description' | 'category';
type Errors = Partial<Record<Field, string>>;

/** Mesmo texto do aviso do web (TransactionDialog). */
function budgetAlertMessage(alert: BudgetAlert) {
  const spent = formatCurrency(alert.spent);
  const budget = formatCurrency(alert.budget);
  return alert.percent >= 100
    ? `Orçamento de ${alert.category} estourado: ${spent} de ${budget}.`
    : `${alert.category}: ${Math.round(alert.percent)}% do orçamento usado (${spent} de ${budget}).`;
}

export type TransactionFormProps = {
  /** Transação a editar; sem ela, é um lançamento novo. */
  transaction?: TransactionItem;
  /** Competência de um lançamento novo ("YYYY-MM"), ex.: o mês do filtro. */
  defaultMonth?: string;
  /** Avisa a tela que está salvando (para travar o fechar). */
  onSavingChange?: (saving: boolean) => void;
};

/** Lançar ou editar uma transação. Ao salvar, avisa, atualiza as listas e fecha. */
export function TransactionForm({
  transaction,
  defaultMonth,
  onSavingChange,
}: TransactionFormProps) {
  const toast = useToast();
  const editing = !!transaction;

  // Datas da API em ISO: o dia e o mês são os do UTC (como formatDateOnly e o web)
  const initialMonth = transaction
    ? new Date(transaction.referenceDate).toISOString().slice(0, 7)
    : (defaultMonth ?? currentMonthISO());

  const [type, setType] = useState<TransactionType>(
    transaction?.type ?? 'expense',
  );
  const [amount, setAmount] = useState(
    transaction ? formatMoneyInput(transaction.amount) : '',
  );
  const [description, setDescription] = useState(
    transaction?.description ?? '',
  );
  const [category, setCategory] = useState(transaction?.category?.name ?? '');
  const [date, setDate] = useState(
    transaction
      ? new Date(transaction.date).toISOString().slice(0, 10)
      : todayISO(),
  );
  const [month, setMonth] = useState(initialMonth);
  const [errors, setErrors] = useState<Errors>({});

  const categoriesMonth = currentMonthISO();
  const categories = useQuery({
    // Mesma chave da tela de Categorias: reaproveita o cache
    queryKey: ['categories', categoriesMonth],
    queryFn: () => getCategories(categoriesMonth),
  });
  const categoryNames = categoryOptions(
    categories.data?.map((c) => c.name) ?? [],
    // A da transação editada aparece como chip mesmo antes da lista chegar
    transaction?.category?.name,
  );

  const mutation = useMutation({
    mutationFn: async (input: TransactionInput) => {
      if (transaction) {
        await updateTransaction(transaction.id, input);
        return null;
      }
      const result = await createTransaction(input);
      return result.budgetAlert;
    },
    onMutate: () => onSavingChange?.(true),
    onSettled: () => onSavingChange?.(false),
    onSuccess: (budgetAlert) => {
      void invalidateAfterWrite('transaction');
      toast.show(
        'success',
        editing ? 'Alterações salvas.' : 'Lançamento salvo.',
      );
      if (budgetAlert) toast.show('warning', budgetAlertMessage(budgetAlert));
    },
  });

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const removal = useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onMutate: () => onSavingChange?.(true),
    onSettled: () => onSavingChange?.(false),
    onSuccess: () => {
      void invalidateAfterWrite('transaction');
      toast.show('success', 'Transação excluída.');
    },
  });

  const saving = mutation.isPending || removal.isPending;

  function confirmDelete() {
    if (!transaction) return;
    removal.mutate(transaction.id, {
      // Como no salvar: não volta uma a mais se a tela já fechou
      onSuccess: () => {
        setConfirmingDelete(false);
        router.back();
      },
    });
  }

  function clearError(field: Field) {
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function submit() {
    const amountCheck = checkMoney(amount);
    const descriptionCheck = checkText(description, {
      max: 200,
      empty: 'Informe a descrição.',
    });
    const categoryCheck = checkText(category, {
      max: 50,
      empty: 'Escolha ou crie uma categoria.',
    });
    setErrors({
      amount: amountCheck.ok ? undefined : amountCheck.error,
      description: descriptionCheck.ok ? undefined : descriptionCheck.error,
      category: categoryCheck.ok ? undefined : categoryCheck.error,
    });
    if (!amountCheck.ok || !descriptionCheck.ok || !categoryCheck.ok) return;

    mutation.mutate(
      {
        type,
        amount: amountCheck.value,
        description: descriptionCheck.value,
        category: categoryCheck.value,
        date,
        referenceMonth: month,
      },
      {
        // Aqui, e não no useMutation: este callback não dispara se a tela já
        // fechou (voltar do Android durante o envio), e não volta uma a mais
        onSuccess: () => router.back(),
      },
    );
  }

  return (
    <View className='gap-5'>
      {transaction?.recurringRuleId && (
        <Text tone='muted' className='text-sm font-medium'>
          Esta é uma ocorrência de recorrência: a edição vale só para ela, não
          para a regra.
        </Text>
      )}

      <TypeSelect value={type} onChange={setType} disabled={saving} />

      <FormField
        label={
          <>
            valor (<Text className='normal-case'>R$</Text>)
          </>
        }
        error={errors.amount}
      >
        <MoneyInput
          accessibilityLabel='valor em reais'
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
          placeholder='Ex.: Mercado'
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

      <FormField label='data da compra'>
        <DateField
          accessibilityLabel='data da compra'
          value={date}
          disabled={saving}
          onChange={(value) => value && setDate(value)}
        />
      </FormField>

      <FormField
        label='mês de competência'
        hint='O mês em que o valor entra nos totais e gráficos.'
      >
        <ChipSelect
          options={referenceMonthOptions(initialMonth).map((m) => ({
            value: m,
            label: shortMonthLabel(m),
          }))}
          value={month}
          onChange={setMonth}
          accessibilityLabel='mês de competência'
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

      {transaction && (
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
              excluir transação
            </Button>
          </View>
          <ConfirmDialog
            open={confirmingDelete}
            title='Excluir transação'
            detail={
              <TypeAmountDetail
                type={transaction.type}
                description={transaction.description}
                amount={transaction.amount}
              />
            }
            description={
              transaction.recurringRuleId
                ? 'Só esta ocorrência será removida; a recorrência continua. Essa ação não poderá ser desfeita.'
                : 'Tem certeza que deseja remover esta transação? Essa ação não poderá ser desfeita.'
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
