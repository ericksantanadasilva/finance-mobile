import { router } from 'expo-router';
import { CircleCheck, Clock } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { Card, CardContent, CardHeader } from '@/components/card';
import { Icon } from '@/components/icon';
import { SkeletonText } from '@/components/skeleton';
import { Text } from '@/components/text';
import { TypeIcon, type TransactionType } from '@/components/type-icon';
import { ALL_MONTHS, type PendingSummary } from '@/lib/dashboard';
import { formatCurrency } from '@/lib/format';

export type PendingCardProps = {
  toPay: PendingSummary;
  toReceive: PendingSummary;
  hasPending: boolean;
};

/**
 * Pendentes até o mês atual (card do web): a pagar e a receber com a seta do
 * tipo; as de meses anteriores com o selo "atrasada". "Ver pendentes" abre
 * Transações filtrada por pendentes em todos os meses.
 */
export function PendingCard({
  toPay,
  toReceive,
  hasPending,
}: PendingCardProps) {
  return (
    <Card>
      <CardHeader>
        <Text
          variant='title'
          tone='band-foreground'
          className='shrink text-sm lowercase'
        >
          Pendentes
        </Text>
        <View
          accessibilityElementsHidden
          importantForAccessibility='no-hide-descendants'
        >
          <Icon icon={Clock} tone='band-foreground' />
        </View>
      </CardHeader>
      <CardContent>
        {hasPending ? (
          <View className='gap-4'>
            <View>
              <PendingRow type='expense' label='A pagar' summary={toPay} />
              <View className='my-3 h-px bg-border-custom' />
              <PendingRow type='income' label='A receber' summary={toReceive} />
            </View>
            <Button
              variant='outline'
              size='sm'
              className='self-end'
              onPress={() =>
                router.navigate({
                  pathname: '/transactions',
                  params: { status: 'pending', month: ALL_MONTHS },
                })
              }
            >
              ver pendentes
            </Button>
          </View>
        ) : (
          <View className='flex-row items-center gap-2 rounded-xl border border-border-custom p-4'>
            <Icon icon={CircleCheck} tone='muted' />
            <Text tone='muted' className='flex-1 text-sm font-medium'>
              Nada pendente até este mês.
            </Text>
          </View>
        )}
      </CardContent>
    </Card>
  );
}

function PendingRow({
  type,
  label,
  summary,
}: {
  type: TransactionType;
  label: string;
  summary: PendingSummary;
}) {
  return (
    <View className='gap-2'>
      <View className='flex-row items-center gap-3'>
        <TypeIcon type={type} />
        <Text className='text-sm font-bold lowercase'>{label}</Text>
        {/* Uma linha só: se não couber, a fonte diminui */}
        <Text
          variant='value'
          tone={type}
          numberOfLines={1}
          adjustsFontSizeToFit
          className='flex-1 text-right text-lg font-bold'
        >
          {formatCurrency(summary.total)}
        </Text>
      </View>
      {summary.overdue > 0 && (
        // ml-11: alinha com o rótulo (seta de 32px + gap de 12px)
        <View className='ml-11 flex-row flex-wrap items-center gap-2'>
          <View className='flex-row items-center gap-1 rounded-md border-2 border-warning bg-surface px-1.5 py-0.5'>
            <Icon icon={Clock} tone='warning' size={12} />
            <Text tone='warning' className='text-xs font-bold lowercase'>
              Atrasada
            </Text>
          </View>
          <Text tone='muted' className='shrink text-xs font-medium'>
            {formatCurrency(summary.overdue)} de meses anteriores
          </Text>
        </View>
      )}
    </View>
  );
}

/** Mesma estrutura do card com pendentes (sem atrasadas), para a altura bater. */
export function PendingCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <SkeletonText variant='title' className='text-sm' chars={9} />
        <View className='size-4 rounded-md bg-border-custom' />
      </CardHeader>
      <CardContent className='gap-4'>
        <View>
          {[0, 1].map((i) => (
            <View key={i}>
              {i === 1 && <View className='my-3 h-px bg-border-custom' />}
              <View className='flex-row items-center gap-3'>
                <View className='size-8 rounded-lg bg-border-custom' />
                <SkeletonText
                  className='text-sm font-bold'
                  chars={9}
                  tone='soft'
                />
                <View className='flex-1 items-end'>
                  <SkeletonText
                    variant='value'
                    className='text-lg font-bold'
                    chars={10}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
        {/* Botão "ver pendentes" (sm: h-9) */}
        <View className='h-9 w-32 self-end rounded-xl border-2 border-border-custom' />
      </CardContent>
    </Card>
  );
}
