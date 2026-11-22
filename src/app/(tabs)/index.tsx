import { useQuery } from '@tanstack/react-query';
import {
  CircleArrowDown,
  CircleArrowUp,
  LayoutDashboard,
  Wallet,
} from 'lucide-react-native';

import {
  CategoryCard,
  CategoryCardSkeleton,
} from '@/components/dashboard/category-card';
import {
  MonthlyFlowCard,
  MonthlyFlowCardSkeleton,
} from '@/components/dashboard/monthly-flow-card';
import { EmptyState } from '@/components/empty-state';
import { ErrorBox } from '@/components/error-box';
import { Icon } from '@/components/icon';
import { Page } from '@/components/page';
import { StatCard, StatCardSkeleton } from '@/components/stat-card';
import { ApiError, getDashboard, type DashboardTotal } from '@/lib/api';
import { currentMonthSummary } from '@/lib/dashboard';
import { formatCurrency } from '@/lib/format';

function errorMessage(error: Error) {
  // Sem resposta (rede, tempo esgotado): a mensagem já é para o usuário
  if (error instanceof ApiError && error.status === 0) return error.message;
  return 'Não foi possível carregar a visão geral.';
}

export default function Overview() {
  const query = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard });
  const now = new Date();

  return (
    <Page
      title='Visão Geral'
      subtitle='Análise baseada no mês de competência.'
      onRefresh={() => query.refetch()}
    >
      {query.isPending ? (
        <>
          <StatCardSkeleton hasNote />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <MonthlyFlowCardSkeleton />
          <CategoryCardSkeleton />
        </>
      ) : query.isError && !query.data ? (
        <ErrorBox
          message={errorMessage(query.error)}
          onRetry={() => query.refetch()}
        />
      ) : query.data.length === 0 ? (
        <EmptyState
          icon={<Icon icon={LayoutDashboard} tone='muted' size={32} />}
          message='Nenhuma transação ainda. Seus lançamentos aparecem aqui assim que forem cadastrados.'
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
          <Summary totals={query.data} now={now} />
          <MonthlyFlowCard totals={query.data} now={now} />
          <CategoryCard totals={query.data} now={now} />
        </>
      )}
    </Page>
  );
}

function Summary({ totals, now }: { totals: DashboardTotal[]; now: Date }) {
  const { balance, previousBalance, income, expense } = currentMonthSummary(
    totals,
    now,
  );

  return (
    <>
      <StatCard
        label='Saldo Atual'
        icon={<Icon icon={Wallet} tone='band-foreground' />}
        value={formatCurrency(balance)}
        note={`Meses anteriores: ${formatCurrency(previousBalance)}`}
      />
      <StatCard
        label='Receitas'
        icon={<Icon icon={CircleArrowUp} tone='band-foreground' />}
        value={formatCurrency(income)}
        tone='income'
      />
      <StatCard
        label='Despesas'
        icon={<Icon icon={CircleArrowDown} tone='band-foreground' />}
        value={formatCurrency(expense)}
        tone='expense'
      />
    </>
  );
}
