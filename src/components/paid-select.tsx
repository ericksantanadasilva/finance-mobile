import { CircleCheck, Clock } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import type { TransactionType } from '@/components/type-select';

export type PaidSelectProps = {
  value: boolean;
  onChange: (isPaid: boolean) => void;
  /** Muda os rótulos: recebido / a receber na receita, pago / a pagar na despesa. */
  type: TransactionType;
  disabled?: boolean;
};

/**
 * Situação do lançamento (campo do TransactionDialog do web), no padrão do
 * TypeSelect: pago fica adesivo, pendente fica adesivo em warning, como o selo
 * "a pagar"; o ícone (check ou relógio) diz a situação além da cor.
 */
export function PaidSelect({
  value,
  onChange,
  type,
  disabled,
}: PaidSelectProps) {
  const income = type === 'income';
  const options = [
    {
      isPaid: true,
      label: income ? 'recebido' : 'pago',
      icon: CircleCheck,
      variant: 'default',
      tone: 'default',
    },
    {
      isPaid: false,
      label: income ? 'a receber' : 'a pagar',
      icon: Clock,
      variant: 'warning',
      tone: 'warning',
    },
  ] as const;

  return (
    <View
      accessibilityRole='radiogroup'
      accessibilityLabel='situação'
      // pr/pb: espaço para a sombra do escolhido não ser cortada
      className='flex-row gap-3 pb-1 pr-1'
    >
      {options.map((option) => {
        const selected = option.isPaid === value;
        return (
          <Button
            key={option.label}
            variant={selected ? option.variant : 'outline'}
            accessibilityRole='radio'
            accessibilityState={{ selected, checked: selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(option.isPaid)}
            className='flex-1'
          >
            <Icon icon={option.icon} tone={selected ? option.tone : 'muted'} />
            {option.label}
          </Button>
        );
      })}
    </View>
  );
}
