import { Target } from 'lucide-react-native';
import { View } from 'react-native';

import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import type { Goal } from '@/lib/api';
import { formatCurrency } from '@/lib/format';

/**
 * A meta em poucas linhas: alvo, nome e quanto falta. No topo do aporte e
 * como o item de uma confirmação (com a borda via `className`).
 */
export function GoalSummary({
  goal,
  className,
}: {
  goal: Goal;
  className?: string;
}) {
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

  return (
    <View className={`gap-1 ${className ?? ''}`}>
      <View className='flex-row items-center gap-2'>
        <Icon icon={Target} />
        {/* Dado do usuário: como foi cadastrado */}
        <Text numberOfLines={2} className='shrink text-base font-bold'>
          {goal.name}
        </Text>
      </View>
      <Text variant='value' tone='muted' className='text-sm font-medium'>
        Acumulado {formatCurrency(goal.currentAmount)} de{' '}
        {formatCurrency(goal.targetAmount)}
        {remaining > 0
          ? ` · faltam ${formatCurrency(remaining)}`
          : ' · concluída'}
      </Text>
    </View>
  );
}
