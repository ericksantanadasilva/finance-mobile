import { ScrollView } from 'react-native';

import { Button } from '@/components/button';

export type ChipOption<T extends string> = { value: T; label: string };

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
      accessibilityRole='radiogroup'
      accessibilityLabel={accessibilityLabel}
      // pb/pr: espaço para a sombra do chip ativo não ser cortada
      contentContainerClassName='gap-2 pb-1 pr-1'
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Button
            key={option.value}
            size='sm'
            variant={selected ? 'default' : 'outline'}
            accessibilityRole='radio'
            accessibilityState={{ selected, checked: selected }}
            onPress={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        );
      })}
    </ScrollView>
  );
}
