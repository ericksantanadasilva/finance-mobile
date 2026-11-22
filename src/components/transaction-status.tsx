import { Clock, Repeat } from 'lucide-react-native';
import { View } from 'react-native';

import { Icon } from '@/components/icon';
import { Text } from '@/components/text';

export type TransactionStatusProps = {
  isPaid: boolean;
  isRecurring: boolean;
  type: 'income' | 'expense';
  /** Sem respiro vertical, para caber na linha compacta de Transações. */
  compact?: boolean;
};

/**
 * Selos de status (TransactionStatus do web): "recorrente" plano e suave;
 * pendente com contorno warning e relógio (nunca só a cor). Só leitura: marcar
 * como pago entra quando a API mobile tiver as rotas de escrita.
 */
export function TransactionStatus({
  isPaid,
  isRecurring,
  type,
  compact = false,
}: TransactionStatusProps) {
  if (!isRecurring && isPaid) return null;
  const py = compact ? '' : 'py-0.5';

  return (
    <View className='flex-row flex-wrap items-center gap-1.5'>
      {isRecurring && (
        <View
          className={`flex-row items-center gap-1 rounded-md border border-border-custom bg-surface-muted px-1.5 ${py}`}
        >
          <Icon icon={Repeat} tone='muted' size={12} />
          <Text tone='muted' className='text-xs font-medium lowercase'>
            Recorrente
          </Text>
        </View>
      )}
      {!isPaid && (
        <View
          className={`flex-row items-center gap-1 rounded-md border-2 border-warning bg-surface px-1.5 ${py}`}
        >
          <Icon icon={Clock} tone='warning' size={12} />
          <Text tone='warning' className='text-xs font-bold lowercase'>
            {type === 'income' ? 'A receber' : 'A pagar'}
          </Text>
        </View>
      )}
    </View>
  );
}
