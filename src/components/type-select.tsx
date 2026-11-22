import { CircleArrowDown, CircleArrowUp } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import type { TransactionItem } from '@/lib/api';

export type TransactionType = TransactionItem['type'];

const OPTIONS = [
  { value: 'income', label: 'receita', icon: CircleArrowUp },
  { value: 'expense', label: 'despesa', icon: CircleArrowDown },
] as const;

export type TypeSelectProps = {
  value: TransactionType;
  onChange: (value: TransactionType) => void;
  disabled?: boolean;
};

/**
 * Receita ou despesa (botões de tipo do TransactionDialog do web): o escolhido
 * fica adesivo na cor do tipo, o outro plano; a seta reforça entrada/saída.
 */
export function TypeSelect({ value, onChange, disabled }: TypeSelectProps) {
  return (
    <View
      accessibilityRole='radiogroup'
      accessibilityLabel='tipo'
      // pr/pb: espaço para a sombra do escolhido não ser cortada
      className='flex-row gap-3 pb-1 pr-1'
    >
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <Button
            key={option.value}
            variant={selected ? option.value : 'outline'}
            accessibilityRole='radio'
            accessibilityState={{ selected, checked: selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            className='flex-1'
          >
            <Icon icon={option.icon} tone={selected ? option.value : 'muted'} />
            {option.label}
          </Button>
        );
      })}
    </View>
  );
}
