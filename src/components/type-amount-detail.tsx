import { View } from 'react-native';

import { Text } from '@/components/text';
import { TypeIcon, type TransactionType } from '@/components/type-icon';
import { formatCurrency } from '@/lib/format';

export type TypeAmountDetailProps = {
  type: TransactionType;
  description: string;
  amount: number;
  /** Linha extra ao lado do valor (ex.: "todo dia 5"). */
  note?: string;
};

/**
 * O item de uma confirmação (ex.: o que vai ser excluído), como na lista: seta
 * do tipo (o sentido não fica só no sinal ou na cor), descrição e o valor.
 */
export function TypeAmountDetail({
  type,
  description,
  amount,
  note,
}: TypeAmountDetailProps) {
  return (
    <View className='flex-row items-center gap-3 rounded-xl border border-border-custom p-3'>
      <TypeIcon type={type} />
      <View className='flex-1 gap-0.5'>
        {/* Dado do usuário: como foi cadastrado */}
        <Text numberOfLines={2} className='text-sm font-bold'>
          {description}
        </Text>
        <View className='flex-row flex-wrap items-center gap-x-2'>
          <Text
            variant='value'
            tone={type === 'income' ? 'income' : 'expense'}
            className='text-sm font-bold'
          >
            {formatCurrency(amount)}
          </Text>
          {note && (
            <Text variant='value' tone='muted' className='text-xs font-medium'>
              {note}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
