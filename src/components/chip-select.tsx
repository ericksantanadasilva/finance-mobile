import type { LucideIcon } from 'lucide-react-native';
import { ScrollView } from 'react-native';

import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { Text } from '@/components/text';

/** Variantes do chip ativo; receita/despesa contornam na cor delas, como no web. */
type ActiveVariant = 'default' | 'income' | 'expense';

const ACTIVE_TONE = {
  default: 'default',
  income: 'income',
  expense: 'expense',
} as const;

export type ChipOption<T extends string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
  activeVariant?: ActiveVariant;
  /** Dado do usuário (ex.: nome de categoria): mostra como foi cadastrado. */
  preserveCase?: boolean;
};

export type ChipSelectProps<T extends string> = {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Nome do grupo para o leitor de tela (ex.: "período do gráfico"). */
  accessibilityLabel: string;
};

/**
 * Escolha de uma opção em chips (no lugar do Select do web): o ativo é adesivo,
 * os outros são planos. Rola na horizontal quando não cabe (ex.: meses).
 */
export function ChipSelect<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: ChipSelectProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps='handled'
      accessibilityRole='radiogroup'
      accessibilityLabel={accessibilityLabel}
      // pb/pr: espaço para a sombra do chip ativo não ser cortada
      contentContainerClassName='gap-2 pb-1 pr-1'
    >
      {options.map((option) => {
        const selected = option.value === value;
        const active = option.activeVariant ?? 'default';
        const tone = selected ? ACTIVE_TONE[active] : 'muted';
        return (
          <Button
            key={option.value}
            size='sm'
            variant={selected ? active : 'outline'}
            accessibilityRole='radio'
            accessibilityState={{ selected, checked: selected }}
            onPress={() => onChange(option.value)}
          >
            {option.icon && <Icon icon={option.icon} tone={tone} size={14} />}
            {option.preserveCase ? (
              // Texto próprio: o do Button aplica lowercase
              <Text tone={tone} numberOfLines={1} className='text-xs font-bold'>
                {option.label}
              </Text>
            ) : (
              option.label
            )}
          </Button>
        );
      })}
    </ScrollView>
  );
}
