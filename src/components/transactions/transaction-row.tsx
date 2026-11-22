import { Pressable, View } from 'react-native';

import { CategoryBadge } from '@/components/category-badge';
import { SkeletonText } from '@/components/skeleton';
import { Text } from '@/components/text';
import { TransactionStatus } from '@/components/transaction-status';
import { TypeIcon } from '@/components/type-icon';
import type { TransactionItem } from '@/lib/api';
import { formatCurrency, formatDateOnly } from '@/lib/format';

/** Valor com sinal na despesa, como no web ("- R$ 50,00"). */
function signedAmount(tx: TransactionItem) {
  const value = formatCurrency(tx.amount);
  return tx.type === 'expense' ? `- ${value}` : value;
}

/**
 * Linha compacta: descrição e valor na mesma linha; embaixo, menores, a data,
 * a categoria e os selos de status (quebram para a linha seguinte se não
 * couberem). Com `onPress`, a linha inteira é tocável (ex.: abrir a edição).
 */
export function TransactionRow({
  tx,
  onPress,
}: {
  tx: TransactionItem;
  onPress?: () => void;
}) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityHint={onPress ? 'abre a edição' : undefined}
      // Pressionado: fundo surface-muted, como o hover das linhas no web
      className='flex-row items-center gap-3 px-4 py-3 active:bg-surface-muted'
    >
      <TypeIcon type={tx.type} />
      <View className='flex-1 gap-1'>
        <View className='flex-row items-start gap-3'>
          {/* Dado do usuário: como foi cadastrado; no máximo 2 linhas */}
          <Text numberOfLines={2} className='flex-1 text-sm font-bold'>
            {tx.description}
          </Text>
          <Text
            variant='value'
            tone={tx.type === 'income' ? 'income' : 'expense'}
            numberOfLines={1}
            className='text-sm font-bold'
          >
            {signedAmount(tx)}
          </Text>
        </View>
        <View className='flex-row flex-wrap items-center gap-x-2 gap-y-1'>
          <Text variant='value' tone='muted' className='text-xs font-medium'>
            {formatDateOnly(tx.date)}
          </Text>
          <View className='shrink'>
            <CategoryBadge
              size='sm'
              name={tx.category?.name}
              color={tx.category?.color}
            />
          </View>
          <TransactionStatus
            compact
            isPaid={tx.isPaid}
            isRecurring={!!tx.recurringRuleId}
            type={tx.type}
          />
        </View>
      </View>
    </Pressable>
  );
}

/** Mesma estrutura da linha (descrição em 1 linha, sem status). */
export function TransactionRowSkeleton() {
  return (
    <View className='flex-row items-center gap-3 px-4 py-3'>
      <View className='size-8 rounded-lg bg-border-custom' />
      <View className='flex-1 gap-1'>
        <View className='flex-row items-start justify-between gap-3'>
          <SkeletonText className='text-sm font-bold' chars={16} />
          <SkeletonText
            variant='value'
            className='text-sm font-bold'
            chars={10}
          />
        </View>
        <View className='flex-row items-center gap-x-2'>
          <SkeletonText
            variant='value'
            className='text-xs font-medium'
            chars={10}
            tone='soft'
          />
          {/* CategoryBadge sm: texto xs + borda de 1px */}
          <View className='rounded-md border border-transparent'>
            <SkeletonText
              className='text-xs font-medium'
              chars={9}
              tone='soft'
            />
          </View>
        </View>
      </View>
    </View>
  );
}
