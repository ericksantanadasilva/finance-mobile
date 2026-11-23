import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Plus, Target } from 'lucide-react-native';

import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { ErrorBox } from '@/components/error-box';
import { GoalCard, GoalCardSkeleton } from '@/components/goals/goal-card';
import { Icon } from '@/components/icon';
import { Page } from '@/components/page';
import { ApiError, getGoals } from '@/lib/api';

const SKELETON_CARDS = 3;

function errorMessage(error: Error) {
  // Sem resposta (rede, tempo esgotado): a mensagem já é para o usuário
  if (error instanceof ApiError && error.status === 0) return error.message;
  return 'Não foi possível carregar as metas.';
}

export default function Goals() {
  const query = useQuery({ queryKey: ['goals'], queryFn: getGoals });

  return (
    <Page
      title='Metas Financeiras'
      subtitle='Visualize e acompanhe seus sonhos de perto.'
      onRefresh={() => query.refetch()}
      action={
        <Button
          size='sm'
          accessibilityLabel='nova meta'
          onPress={() => router.push('/goal')}
        >
          <Icon icon={Plus} />
          nova
        </Button>
      }
    >
      {query.isPending ? (
        Array.from({ length: SKELETON_CARDS }, (_, i) => (
          <GoalCardSkeleton key={i} />
        ))
      ) : query.isError && !query.data ? (
        <ErrorBox
          message={errorMessage(query.error)}
          onRetry={() => query.refetch()}
        />
      ) : query.data.length === 0 ? (
        <EmptyState
          icon={<Icon icon={Target} tone='muted' size={32} />}
          message='Nenhuma meta ainda. Crie a primeira e acompanhe quanto falta para chegar lá.'
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
          {query.data.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onAddValue={() =>
                router.push({
                  pathname: '/goal-contribution',
                  params: { id: goal.id },
                })
              }
            />
          ))}
        </>
      )}
    </Page>
  );
}
