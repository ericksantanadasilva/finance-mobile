import { Clock, Repeat } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Text } from '@/components/text';

export type TransactionStatusProps = {
  isPaid: boolean;
  isRecurring: boolean;
  type: 'income' | 'expense';
  /** Sem respiro vertical, para caber na linha compacta de Transações. */
  compact?: boolean;
  /** Torna o selo pendente tocável ("a pagar · marcar"). */
  onMarkPaid?: () => void;
  /** Marcando: o selo fica desativado e mostra "marcando...". */
  marking?: boolean;
};

// O selo tem uns 20px de altura: alcança o alvo de toque de ~44px sem mudar o visual
const MARK_HIT_SLOP = { top: 12, bottom: 12, left: 8, right: 8 };

/**
 * Selos de status (TransactionStatus do web): "recorrente" plano e suave;
 * pendente com contorno warning e relógio (nunca só a cor). Com `onMarkPaid`,
 * o pendente vira botão de marcar como pago/recebido, como no web.
 */
export function TransactionStatus({
  isPaid,
  isRecurring,
  type,
  compact = false,
  onMarkPaid,
  marking = false,
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
        <Pressable
          disabled={!onMarkPaid || marking}
          onPress={onMarkPaid}
          hitSlop={MARK_HIT_SLOP}
          // O leitor de tela usa a ação da linha (TransactionRow), não este selo
          accessible={false}
          className={`flex-row items-center gap-1 rounded-md border-2 border-warning bg-surface px-1.5 active:bg-surface-muted ${py} ${marking ? 'opacity-50' : ''}`}
        >
          <Icon icon={Clock} tone='warning' size={12} />
          <Text tone='warning' className='text-xs font-bold lowercase'>
            {type === 'income' ? 'A receber' : 'A pagar'}
            {onMarkPaid && (marking ? ' · marcando...' : ' · marcar')}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
