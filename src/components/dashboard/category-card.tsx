import { useState } from 'react';
import { View } from 'react-native';

import { Card, CardContent, CardHeader } from '@/components/card';
import { CategoryBadge, categoryColor } from '@/components/category-badge';
import { ChipSelect } from '@/components/chip-select';
import { SkeletonText } from '@/components/skeleton';
import { Text } from '@/components/text';
import type { DashboardTotal } from '@/lib/api';
import {
  ALL_MONTHS,
  availableMonths,
  categoryExpenses,
  currentMonthISO,
  shortMonthLabel,
  type CategoryExpense,
} from '@/lib/dashboard';
import { formatCurrency } from '@/lib/format';

/**
 * Despesas por categoria no mês (no lugar da rosca do web): valor e uma barra
 * com a proporção do total, na cor da categoria.
 */
export function CategoryCard({
  totals,
  now,
}: {
  totals: DashboardTotal[];
  now: Date;
}) {
  const current = currentMonthISO(now);
  const [month, setMonth] = useState(current);

  // O mês atual entra mesmo sem lançamentos: é o filtro padrão (no web o
  // Select ficaria sem rótulo nesse caso)
  const months = Array.from(new Set([current, ...availableMonths(totals)]))
    .sort()
    .reverse();
  const options = [
    { value: ALL_MONTHS, label: 'todos' },
    ...months.map((m) => ({ value: m, label: shortMonthLabel(m) })),
  ];

  const categories = categoryExpenses(totals, month);
  const total = categories.reduce((acc, c) => acc + c.value, 0);

  return (
    <Card>
      <CardHeader>
        <Text
          variant='title'
          tone='band-foreground'
          className='text-sm lowercase'
        >
          Categorias
        </Text>
      </CardHeader>
      <CardContent className='gap-4 p-4'>
        <ChipSelect
          options={options}
          value={month}
          onChange={setMonth}
          accessibilityLabel='mês das categorias'
        />

        <View className='flex-row items-center justify-between gap-4'>
          <Text tone='muted' className='text-xs font-medium lowercase'>
            Total de despesas
          </Text>
          <Text variant='value' className='text-sm font-bold'>
            {formatCurrency(total)}
          </Text>
        </View>

        {categories.length > 0 ? (
          <View className='gap-4'>
            {categories.map((category) => (
              <CategoryRow
                key={category.name}
                category={category}
                total={total}
              />
            ))}
          </View>
        ) : (
          <Text tone='muted' className='py-4 text-center text-xs font-medium'>
            sem despesas neste período
          </Text>
        )}
      </CardContent>
    </Card>
  );
}

function CategoryRow({
  category,
  total,
}: {
  category: CategoryExpense;
  total: number;
}) {
  const share = total > 0 ? category.value / total : 0;
  const color = categoryColor(category.color);
  const percent = Math.round(share * 100);

  return (
    <View
      accessible
      accessibilityLabel={`${category.name}: ${formatCurrency(category.value)}, ${percent}% das despesas`}
      className='gap-1.5'
    >
      <View className='flex-row items-center justify-between gap-3'>
        <View className='shrink'>
          <CategoryBadge name={category.name} color={category.color} />
        </View>
        <Text variant='value' className='text-sm font-bold'>
          {formatCurrency(category.value)}
        </Text>
      </View>
      <View className='flex-row items-center gap-2'>
        {/* Trilho com contorno, como a ProgressBar do web */}
        <View className='h-3 flex-1 overflow-hidden rounded-full border-2 border-ink bg-surface-muted'>
          <View
            className={`h-full ${color ? '' : 'bg-muted-foreground'}`}
            style={{
              width: `${share * 100}%`,
              backgroundColor: color,
            }}
          />
        </View>
        <Text variant='value' tone='muted' className='w-10 text-right text-xs'>
          {percent}%
        </Text>
      </View>
    </View>
  );
}

/** Mesma estrutura do card carregado, com 4 categorias. */
export function CategoryCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <SkeletonText variant='title' className='text-sm' chars={10} />
      </CardHeader>
      <CardContent className='gap-4 p-4'>
        <View className='flex-row gap-2 pb-1'>
          {[1, 2, 3].map((i) => (
            <View key={i} className='h-9 w-24 rounded-xl bg-border-custom' />
          ))}
        </View>
        <View className='flex-row items-center justify-between gap-4'>
          <SkeletonText
            className='text-xs font-medium'
            chars={16}
            tone='soft'
          />
          <SkeletonText
            variant='value'
            className='text-sm font-bold'
            chars={10}
          />
        </View>
        <View className='gap-4'>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} className='gap-1.5'>
              <View className='flex-row items-center justify-between gap-3'>
                {/* CategoryBadge: texto xs + py-0.5 + borda 2 */}
                <View className='rounded-md border-2 border-transparent py-0.5'>
                  <SkeletonText className='text-xs font-medium' chars={12} />
                </View>
                <SkeletonText
                  variant='value'
                  className='text-sm font-bold'
                  chars={10}
                />
              </View>
              {/* h-4: a linha real tem a altura do "%" (text-xs), não do trilho */}
              <View className='h-4 justify-center'>
                <View className='h-3 rounded-full bg-surface-muted' />
              </View>
            </View>
          ))}
        </View>
      </CardContent>
    </Card>
  );
}
