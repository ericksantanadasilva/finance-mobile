import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import {
  CircleArrowDown,
  CircleArrowUp,
  Plus,
  Repeat,
} from 'lucide-react-native';

import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { ErrorBox } from '@/components/error-box';
import { Icon } from '@/components/icon';
import { Page } from '@/components/page';
import {
  RecurringRuleCard,
  RecurringRuleCardSkeleton,
} from '@/components/recurring/recurring-rule-card';
import { StatCard, StatCardSkeleton } from '@/components/stat-card';
import { ApiError, getRecurringRules, type RecurringRule } from '@/lib/api';
import { formatCurrency } from '@/lib/format';

const SKELETON_CARDS = 3;

function errorMessage(error: Error) {
  // Sem resposta (rede, tempo esgotado): a mensagem já é para o usuário
  if (error instanceof ApiError && error.status === 0) return error.message;
  return 'Não foi possível carregar as recorrências.';
}

export default function Recurring() {
  const query = useQuery({
    queryKey: ['recurring'],
    queryFn: getRecurringRules,
  });

  return (
    <Page
      title='Recorrentes'
      subtitle='Contas fixas e receitas mensais lançadas automaticamente.'
      back
      onRefresh={() => query.refetch()}
      action={
        <Button
          size='sm'
          accessibilityLabel='nova recorrência'
          onPress={() => router.push('/recurring-rule')}
        >
          <Icon icon={Plus} />
          nova
        </Button>
      }
    >
      {query.isPending ? (
        <>
          <StatCardSkeleton />
          <StatCardSkeleton />
          {Array.from({ length: SKELETON_CARDS }, (_, i) => (
            <RecurringRuleCardSkeleton key={i} />
          ))}
        </>
      ) : query.isError && !query.data ? (
        <ErrorBox
          message={errorMessage(query.error)}
          onRetry={() => query.refetch()}
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
          <Summary rules={query.data} />
          {query.data.length === 0 ? (
            <EmptyState
              icon={<Icon icon={Repeat} tone='muted' size={32} />}
              message='Nenhuma recorrência ainda. Cadastre aluguel, assinaturas ou salário e eles entram sozinhos todo mês.'
            />
          ) : (
            query.data.map((rule) => (
              <RecurringRuleCard key={rule.id} rule={rule} />
            ))
          )}
        </>
      )}
    </Page>
  );
}

/** Total por mês das regras ativas (como no web: pausadas não entram). */
function Summary({ rules }: { rules: RecurringRule[] }) {
  const active = rules.filter((r) => r.active);
  const monthlyExpense = active
    .filter((r) => r.type === 'expense')
    .reduce((acc, r) => acc + r.amount, 0);
  const monthlyIncome = active
    .filter((r) => r.type === 'income')
    .reduce((acc, r) => acc + r.amount, 0);

  return (
    <>
      <StatCard
        label='Despesas fixas / mês'
        icon={<Icon icon={CircleArrowDown} tone='band-foreground' />}
        value={formatCurrency(monthlyExpense)}
        tone='expense'
      />
      <StatCard
        label='Receitas fixas / mês'
        icon={<Icon icon={CircleArrowUp} tone='band-foreground' />}
        value={formatCurrency(monthlyIncome)}
        tone='income'
      />
    </>
  );
}
