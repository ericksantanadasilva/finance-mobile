import { View } from 'react-native';

import { Text } from '@/components/text';

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
      <Text tone={isIncome ? 'income' : 'expense'} className='font-bold'>
        {isIncome ? '↑' : '↓'}
      </Text>
    </View>
  );
}
