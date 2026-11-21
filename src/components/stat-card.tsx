import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Card, CardContent, CardHeader } from '@/components/card';
import { Text } from '@/components/text';

// Classes do valor grande, reaproveitadas pelo skeleton (parte 4) para a
// altura bater com o card carregado.
export const statValueClass = 'text-3xl font-bold tracking-tight';

const TONES = {
  neutral: 'default',
  income: 'income',
  expense: 'expense',
} as const;

export type StatCardProps = {
  label: string;
  /** Receita/despesa: seta para cima/baixo, para não depender só da cor. */
  icon?: ReactNode;
  value: string;
  tone?: keyof typeof TONES;
  note?: ReactNode;
};

/** Card de resumo: faixa com o rótulo e o ícone, valor grande embaixo. */
export function StatCard({
  label,
  icon,
  value,
  tone = 'neutral',
  note,
}: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <Text
          variant='title'
          tone='band-foreground'
          className='shrink text-sm lowercase'
        >
          {label}
        </Text>
        {icon && (
          // Decorativo: o rótulo já diz o que é
          <View
            accessibilityElementsHidden
            importantForAccessibility='no-hide-descendants'
          >
            {icon}
          </View>
        )}
      </CardHeader>
      <CardContent>
        <Text variant='value' tone={TONES[tone]} className={statValueClass}>
          {value}
        </Text>
        {typeof note === 'string' ? (
          <Text tone='muted' className='mt-1 text-xs font-medium'>
            {note}
          </Text>
        ) : (
          note
        )}
      </CardContent>
    </Card>
  );
}
