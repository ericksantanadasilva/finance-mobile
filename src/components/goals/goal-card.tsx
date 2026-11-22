import {
  Calendar,
  CalendarX,
  CircleCheck,
  Target,
  TriangleExclamationPoint,
} from 'lucide-react-native';
import { View } from 'react-native';

import { Card, CardContent, CardHeader } from '@/components/card';
import { Icon } from '@/components/icon';
import { ProgressBar } from '@/components/progress-bar';
import { SkeletonText } from '@/components/skeleton';
import { Text } from '@/components/text';
import type { Goal } from '@/lib/api';
import { formatCurrency, formatDateOnly } from '@/lib/format';
import { goalPace, goalProgress, type GoalPace } from '@/lib/goals';

// Cor da barra pelo ritmo, nunca pela porcentagem pura (meta no começo não é
// problema). A cor só reforça: abaixo do ritmo e vencida têm texto e ícone
function barClassName(pace: GoalPace) {
  if (pace.status === 'overdue') return 'bg-expense';
  if (pace.status === 'behind') return 'bg-warning';
  return 'bg-income';
}

function paceLabel(pace: GoalPace) {
  if (pace.status === 'overdue') return ', prazo vencido';
  if (pace.status === 'behind') return ', abaixo do ritmo';
  return '';
}

/**
 * Meta (card do web): acumulado em destaque, objetivo ao lado, barra e prazo.
 * Nas metas com prazo, a barra segue o ritmo (ver lib/goals).
 */
export function GoalCard({ goal }: { goal: Goal }) {
  const progress = goalProgress(goal);
  const pace = goalPace(goal);
  // Concluída pelos valores, não pela porcentagem exibida
  const isDone = pace.status === 'done';

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
            label={`progresso da meta ${goal.name}${paceLabel(pace)}`}
            barClassName={barClassName(pace)}
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
          {pace.status === 'behind' && (
            <PaceNote
              tone='warning'
              icon={TriangleExclamationPoint}
              text={`Abaixo do ritmo · esperado ${pace.expected}% até hoje`}
            />
          )}
          {pace.status === 'overdue' && (
            <PaceNote tone='expense' icon={CalendarX} text='Prazo vencido' />
          )}
        </View>
      </CardContent>
    </Card>
  );
}

/** Situação do ritmo em texto e ícone, além da cor da barra. */
function PaceNote({
  tone,
  icon,
  text,
}: {
  tone: 'warning' | 'expense';
  icon: typeof CalendarX;
  text: string;
}) {
  return (
    <View className='flex-row items-center gap-1.5'>
      <Icon icon={icon} tone={tone} size={14} />
      <Text
        variant='value'
        tone={tone}
        className='shrink text-xs font-bold lowercase'
      >
        {text}
      </Text>
    </View>
  );
}

/** Mesma estrutura do card carregado (sem a linha do ritmo), para a altura bater. */
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
