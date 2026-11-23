import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Tags } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import {
  BudgetAlert,
  budgetPercent,
  CategoryBudgetCard,
  CategoryBudgetCardSkeleton,
} from '@/components/categories/category-budget-card';
import { ChipSelect } from '@/components/chip-select';
import { EmptyState } from '@/components/empty-state';
import { ErrorBox } from '@/components/error-box';
import { Icon } from '@/components/icon';
import { Page } from '@/components/page';
import { ApiError, getCategories, getDashboard } from '@/lib/api';
import {
  availableMonths,
  currentMonthISO,
  shortMonthLabel,
} from '@/lib/dashboard';

const SKELETON_CARDS = 4;

function errorMessage(error: Error) {
  // Sem resposta (rede, tempo esgotado): a mensagem já é para o usuário
  if (error instanceof ApiError && error.status === 0) return error.message;
  return 'Não foi possível carregar as categorias.';
}

export default function Categories() {
  const currentMonth = currentMonthISO();
  const [month, setMonth] = useState(currentMonth);

  const query = useQuery({
    queryKey: ['categories', month],
    queryFn: () => getCategories(month),
    // Ao trocar de mês, os cards anteriores ficam (esmaecidos) até os novos chegarem
    placeholderData: keepPreviousData,
  });
  // Meses do seletor: os da Visão Geral (mesma consulta, já em cache), pois a
  // API de categorias não devolve a lista
  const dashboard = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  });
  const months = Array.from(
    new Set([currentMonth, ...availableMonths(dashboard.data ?? [])]),
  )
    .sort()
    .reverse();

  const categories = query.data ?? [];
  const overBudget = categories.filter((c) => (budgetPercent(c) ?? 0) >= 100);
  const nearBudget = categories.filter((c) => {
    const percent = budgetPercent(c);
    return percent !== null && percent >= 80 && percent < 100;
  });
  const dimmed = query.isPlaceholderData;

  return (
    <Page
      title='Categorias'
      subtitle='Quanto já foi gasto de cada limite no mês.'
      back
      onRefresh={() => Promise.all([query.refetch(), dashboard.refetch()])}
    >
      <ChipSelect
        options={months.map((m) => ({ value: m, label: shortMonthLabel(m) }))}
        value={month}
        onChange={setMonth}
        accessibilityLabel='mês'
      />

      {query.isPending ? (
        Array.from({ length: SKELETON_CARDS }, (_, i) => (
          <CategoryBudgetCardSkeleton key={i} />
        ))
      ) : query.isError && !query.data ? (
        <ErrorBox
          message={errorMessage(query.error)}
          onRetry={() => query.refetch()}
        />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={<Icon icon={Tags} tone='muted' size={32} />}
          message='Nenhuma categoria ainda. Elas aparecem aqui assim que forem criadas.'
        />
      ) : (
        <>
          {/* Atualização falhou, mas há dados anteriores: mostra os dois */}
          {query.isError && (
            <ErrorBox
              message={errorMessage(query.error)}
              onRetry={() => query.refetch()}
            />
          )}
          <View className={`gap-4 ${dimmed ? 'opacity-60' : ''}`}>
            {overBudget.length > 0 && (
              <BudgetAlert
                tone='expense'
                label='Orçamento estourado neste mês:'
                categories={overBudget}
              />
            )}
            {nearBudget.length > 0 && (
              <BudgetAlert
                tone='warning'
                label='Perto do limite (80% ou mais):'
                categories={nearBudget}
              />
            )}
            {categories.map((category) => (
              <CategoryBudgetCard
                key={category.id}
                category={category}
                // Esmaecido, o card ainda é do mês anterior: o formulário não
                // acharia a categoria no mês novo
                onEditBudget={
                  dimmed
                    ? undefined
                    : () =>
                        router.push({
                          pathname: '/category-budget',
                          params: { id: category.id, month },
                        })
                }
              />
            ))}
          </View>
        </>
      )}
    </Page>
  );
}
