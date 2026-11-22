import { Calendar, CircleCheck, Target } from 'lucide-react-native';
import { View } from 'react-native';

import { Card, CardContent, CardHeader } from '@/components/card';
import { Icon } from '@/components/icon';
import { ProgressBar } from '@/components/progress-bar';
import { SkeletonText } from '@/components/skeleton';
import { Text } from '@/components/text';
import type { Goal } from '@/lib/api';
import { formatCurrency, formatDateOnly } from '@/lib/format';

/**
 * Progresso inteiro, para baixo (99,9% mostra 99%, nunca 100% antes da hora),
 * limitado a 100. O resíduo de ponto flutuante sai antes do floor: 29% pode
 * chegar como 28.999999999999996 e não pode virar 28%.
 */
export function goalProgress(goal: Goal) {
  if (goal.targetAmount <= 0) return 0;
  const percent = (goal.currentAmount / goal.targetAmount) * 100;
  return Math.min(Math.floor(Math.round(percent * 100) / 100), 100);
}

/** Meta (card do web): acumulado em destaque, objetivo ao lado, barra e prazo. */
export function GoalCard({ goal }: { goal: Goal }) {
  const progress = goalProgress(goal);
  // Concluída pelos valores, não pela porcentagem exibida
  const isDone = goal.currentAmount >= goal.targetAmount;

  return (
    <Card>
      <CardHeader className='py-2'>
        <View className='shrink flex-row items-center gap-2'>
          <Icon icon={Target} tone='band-foreground' />
          {/* Nome como foi cadastrado (a faixa não força caixa em dado do usuário) */}
          <Text
            variant='title'
            tone='band-foreground'
            numberOfLines={1}
            className='shrink text-sm'
          >
            {goal.name}
          </Text>
        </View>
      </CardHeader>
      <CardContent className='gap-5'>
        <View className='flex-row items-end justify-between gap-3'>
          <View className='shrink'>
            <Text tone='muted' className='mb-1 text-xs font-medium lowercase'>
              Acumulado
            </Text>
            {/* Uma linha só: se não couber, a fonte diminui */}
            <Text
              variant='value'
              numberOfLines={1}
              adjustsFontSizeToFit
              className='text-2xl font-bold tracking-tight'
            >
              {formatCurrency(goal.currentAmount)}
            </Text>
          </View>
          <View className='items-end'>
            <Text tone='muted' className='mb-1 text-xs font-medium lowercase'>
              Objetivo
            </Text>
            <Text variant='value' tone='muted' className='text-sm font-bold'>
              {formatCurrency(goal.targetAmount)}
            </Text>
          </View>
        </View>

        <View className='gap-3'>
          <ProgressBar
            value={progress}
            label={`progresso da meta ${goal.name}`}
          />
          {/* min-h-6: a mesma altura com o selo "concluída" ou só com a porcentagem */}
          <View className='min-h-6 flex-row items-center justify-between gap-3'>
            <View className='flex-row items-center gap-1.5'>
              <Icon icon={Calendar} tone='muted' size={14} />
              <Text
                variant='value'
                tone='muted'
                className='text-xs font-medium lowercase'
              >
                {goal.deadline ? formatDateOnly(goal.deadline) : 'Sem prazo'}
              </Text>
            </View>
            {isDone ? (
              <View className='flex-row items-center gap-1 rounded-md border-2 border-income bg-surface px-1.5 py-0.5'>
                <Icon icon={CircleCheck} tone='income' size={12} />
                <Text tone='income' className='text-xs font-bold lowercase'>
                  Concluída
                </Text>
              </View>
            ) : (
              <Text variant='value' className='text-xs font-bold'>
                {progress}%
              </Text>
            )}
          </View>
        </View>
      </CardContent>
    </Card>
  );
}

/** Mesma estrutura do card carregado, para a altura bater. */
export function GoalCardSkeleton() {
  return (
    <Card>
      <CardHeader className='py-2'>
        <View className='flex-row items-center gap-2'>
          <View className='size-4 rounded-md bg-border-custom' />
          <SkeletonText variant='title' className='text-sm' chars={12} />
        </View>
      </CardHeader>
      <CardContent className='gap-5'>
        <View className='flex-row items-end justify-between gap-3'>
          <View>
            <View className='mb-1'>
              <SkeletonText
                className='text-xs font-medium'
                chars={9}
                tone='soft'
              />
            </View>
            <SkeletonText
              variant='value'
              className='text-2xl font-bold tracking-tight'
              chars={9}
            />
          </View>
          <View className='items-end'>
            <View className='mb-1'>
              <SkeletonText
                className='text-xs font-medium'
                chars={8}
                tone='soft'
              />
            </View>
            <SkeletonText
              variant='value'
              className='text-sm font-bold'
              chars={10}
            />
          </View>
        </View>
        <View className='gap-3'>
          <View className='h-3 rounded-full bg-surface-muted' />
          <View className='min-h-6 flex-row items-center justify-between gap-3'>
            <SkeletonText
              variant='value'
              className='text-xs font-medium'
              chars={12}
              tone='soft'
            />
            <SkeletonText
              variant='value'
              className='text-xs font-bold'
              chars={3}
            />
          </View>
        </View>
      </CardContent>
    </Card>
  );
}
