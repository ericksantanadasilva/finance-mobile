import { ArrowDown, ArrowUp } from 'lucide-react-native';
import { View } from 'react-native';

import { Icon } from '@/components/icon';

export type TransactionType = 'income' | 'expense';

/**
 * Seta de receita/despesa num quadrado contornado: a direção diz o tipo, a cor
 * só reforça. O leitor de tela ouve "receita" ou "despesa", não a seta.
 */
export function TypeIcon({ type }: { type: TransactionType }) {
  const isIncome = type === 'income';
  return (
    <View
      accessible
      accessibilityRole='image'
      accessibilityLabel={isIncome ? 'receita' : 'despesa'}
      className={`size-8 shrink-0 items-center justify-center rounded-lg border-2 ${isIncome ? 'border-income' : 'border-expense'}`}
    >
      <Icon
        icon={isIncome ? ArrowUp : ArrowDown}
        tone={isIncome ? 'income' : 'expense'}
      />
    </View>
  );
}
