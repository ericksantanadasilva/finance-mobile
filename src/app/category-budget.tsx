import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/components/button';
import { CategoryBudgetForm } from '@/components/categories/category-budget-form';
import { ErrorBox } from '@/components/error-box';
import { FormScreen } from '@/components/form-screen';
import type { CategoryBudget } from '@/lib/api';
import { currentMonthISO } from '@/lib/dashboard';

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Definir, alterar ou remover o limite (/category-budget?id=...&month=YYYY-MM).
 * Não há GET /categories/:id: a categoria vem da lista do mês já carregada.
 */
export default function CategoryBudgetScreen() {
  const params = useLocalSearchParams<{ id?: string; month?: string }>();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const month =
    params.month && MONTH.test(params.month) ? params.month : currentMonthISO();

  // Lida uma vez: a lista recarregar por trás não troca o que está no formulário
  const [category] = useState(() =>
    queryClient
      .getQueryData<CategoryBudget[]>(['categories', month])
      ?.find((c) => c.id === params.id),
  );

  if (!category) return <NotFound />;

  return (
    <FormScreen
      title={category.budget ? 'Alterar limite' : 'Definir limite'}
      closeDisabled={saving}
    >
      <CategoryBudgetForm
        category={category}
        month={month}
        onSavingChange={setSaving}
      />
    </FormScreen>
  );
}

/** Aberta por um link sem a lista carregada (ex.: o app foi reaberto aqui). */
function NotFound() {
  return (
    <FormScreen title='Limite'>
      <ErrorBox message='Não foi possível abrir esta categoria. Volte para a lista e tente de novo.' />
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
