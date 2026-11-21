import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Card, CardContent, CardHeader } from '@/components/card';
import { SkeletonText } from '@/components/skeleton';
import { Text } from '@/components/text';

// Classes do valor grande, reaproveitadas pelo skeleton para a altura bater
// com o card carregado.
const statValueClass = 'text-3xl font-bold tracking-tight';

const TONES = {
  neutral: 'default',
  income: 'income',
  expense: 'expense',
} as const;

export type StatCardProps = {
  label: string;
  /** Receita/despesa: seta para cima/baixo, para não depender só da cor. */
  icon?: ReactNode;
  /** Já formatado; dinheiro com formatCurrency (src/lib/format.ts). */
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
        {/* Uma linha só: o valor nunca quebra entre o "R$" e o número; se não
            couber, a fonte diminui (a altura da linha fica a mesma) */}
        <Text
          variant='value'
          tone={TONES[tone]}
          numberOfLines={1}
          adjustsFontSizeToFit
          className={statValueClass}
        >
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

/** Mesma estrutura do StatCard, para o skeleton ter a altura do card carregado. */
export function StatCardSkeleton({ hasNote = false }: { hasNote?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <SkeletonText variant='title' className='text-sm' chars={10} />
        <View className='size-4 rounded-md bg-border-custom' />
      </CardHeader>
      <CardContent>
        <SkeletonText variant='value' className={statValueClass} chars={9} />
        {hasNote && (
          <View className='mt-1'>
            <SkeletonText
              className='text-xs font-medium'
              chars={30}
              tone='soft'
            />
          </View>
        )}
      </CardContent>
    </Card>
  );
}
