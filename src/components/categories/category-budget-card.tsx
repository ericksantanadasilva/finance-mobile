import { Pencil, Plus, TriangleExclamationPoint } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/button';
import { Card, CardContent, CardHeader } from '@/components/card';
import { CategoryBadge, categoryColor } from '@/components/category-badge';
import { Icon } from '@/components/icon';
import { ProgressBar } from '@/components/progress-bar';
import { SkeletonText } from '@/components/skeleton';
import { Text } from '@/components/text';
import type { CategoryBudget } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { useHardShadow } from '@/lib/hard-shadow';

/**
 * Porcentagem sem o resíduo de ponto flutuante da API (ex.: 110.00000000000001).
 * Arredonda em 2 casas antes de comparar com 80/100: um gasto igual ao limite
 * pode chegar como 99.99999999999999 e tem de contar como estourado.
 */
export function budgetPercent(category: CategoryBudget) {
  if (!category.budget || category.percent === null) return null;
  return Math.round(category.percent * 100) / 100;
}

// Faixas do orçamento (as do web): a cor reforça, mas o texto e o ícone de
// alerta sempre dizem a situação
function budgetTone(percent: number) {
  if (percent >= 100) return { bar: 'bg-expense', text: 'expense' } as const;
  if (percent >= 80) return { bar: 'bg-warning', text: 'warning' } as const;
  return { bar: 'bg-income', text: 'income' } as const;
}

// O lápis tem 16px: alcança o alvo de toque de ~44px sem crescer a faixa
const EDIT_HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

/**
 * Card da categoria: faixa com a cor e o nome; gasto e limite do mês. Com
 * `onEditBudget`, o lápis (com limite) ou "definir limite mensal" (sem) abrem
 * o formulário do limite.
 */
export function CategoryBudgetCard({
  category,
  onEditBudget,
}: {
  category: CategoryBudget;
  onEditBudget?: () => void;
}) {
  const percent = budgetPercent(category);
  const color = categoryColor(category.color);

  return (
    <Card>
      <CardHeader className='py-2'>
        <View className='shrink flex-row items-center gap-2'>
          <View
            className={`size-3 shrink-0 rounded-full border-2 border-ink ${color ? '' : 'bg-muted-foreground'}`}
            style={color ? { backgroundColor: color } : undefined}
          />
          {/* Nome como foi cadastrado (a faixa não força caixa em dado do usuário) */}
          <Text
            variant='title'
            tone='band-foreground'
            numberOfLines={1}
            className='shrink text-sm'
          >
            {category.name}
          </Text>
        </View>
        {onEditBudget && !!category.budget && (
          <Pressable
            accessibilityRole='button'
            accessibilityLabel={`alterar limite de ${category.name}`}
            hitSlop={EDIT_HIT_SLOP}
            onPress={onEditBudget}
            className='rounded-md p-1 active:opacity-60'
          >
            <Icon icon={Pencil} tone='band-foreground' />
          </Pressable>
        )}
      </CardHeader>
      <CardContent className='p-4'>
        {category.budget && percent !== null ? (
          <BudgetProgress
            name={category.name}
            spent={category.spent}
            budget={category.budget}
            percent={percent}
          />
        ) : onEditBudget ? (
          <Button
            variant='outline'
            size='sm'
            accessibilityLabel={`definir limite mensal de ${category.name}`}
            onPress={onEditBudget}
          >
            <Icon icon={Plus} tone='muted' />
            definir limite mensal
          </Button>
        ) : (
          <Text tone='muted' className='text-xs font-medium'>
            Sem limite mensal
          </Text>
        )}
      </CardContent>
    </Card>
  );
}

function BudgetProgress({
  name,
  spent,
  budget,
  percent,
}: {
  name: string;
  spent: number;
  budget: number;
  percent: number;
}) {
  const tone = budgetTone(percent);

  return (
    <View className='gap-2'>
      <View className='flex-row justify-between gap-2'>
        <Text variant='value' tone={tone.text} className='text-xs font-bold'>
          {formatCurrency(spent)}
        </Text>
        <Text variant='value' tone='muted' className='text-xs font-medium'>
          de {formatCurrency(budget)}
        </Text>
      </View>
      <ProgressBar
        value={percent}
        label={`orçamento de ${name}`}
        barClassName={tone.bar}
      />
      <View className='flex-row items-center gap-1.5'>
        {percent >= 80 && (
          <Icon icon={TriangleExclamationPoint} tone={tone.text} size={14} />
        )}
        <Text
          variant='value'
          tone={tone.text}
          className='shrink text-xs font-bold'
        >
          {percent >= 100
            ? `Estourou ${formatCurrency(spent - budget)}`
            : `${Math.round(percent)}% usado · restam ${formatCurrency(budget - spent)}`}
        </Text>
      </View>
    </View>
  );
}

/**
 * Alerta de orçamento do mês (BudgetAlert do web): contorno e sombra na cor da
 * situação, ícone e texto dizem o que aconteceu; as categorias como selo.
 */
export function BudgetAlert({
  tone,
  label,
  categories,
}: {
  tone: 'expense' | 'warning';
  label: string;
  categories: CategoryBudget[];
}) {
  // Como o [--ink:var(--expense)] do web: contorno e sombra na cor da situação
  const shadow = useHardShadow(
    'md',
    tone === 'expense' ? '--expense' : '--warning',
  );

  return (
    <View
      className={`flex-row items-start gap-3 rounded-2xl border-2 bg-surface p-4 ${tone === 'expense' ? 'border-expense' : 'border-warning'}`}
      style={shadow}
    >
      <View className='mt-0.5'>
        <Icon icon={TriangleExclamationPoint} tone={tone} size={20} />
      </View>
      <View className='flex-1 flex-row flex-wrap items-center gap-2'>
        <Text className='text-sm font-bold'>{label}</Text>
        {categories.map((c) => (
          <CategoryBadge key={c.id} name={c.name} color={c.color} />
        ))}
      </View>
    </View>
  );
}

/** Mesma estrutura do card com limite, para a altura bater. */
export function CategoryBudgetCardSkeleton() {
  return (
    <Card>
      <CardHeader className='py-2'>
        <View className='flex-row items-center gap-2'>
          <View className='size-3 rounded-full bg-border-custom' />
          <SkeletonText variant='title' className='text-sm' chars={10} />
        </View>
      </CardHeader>
      <CardContent className='gap-2 p-4'>
        <View className='flex-row justify-between gap-2'>
          <SkeletonText
            variant='value'
            className='text-xs font-bold'
            chars={9}
          />
          <SkeletonText
            variant='value'
            className='text-xs font-medium'
            chars={12}
            tone='soft'
          />
        </View>
        <View className='h-3 rounded-full bg-surface-muted' />
        <SkeletonText
          variant='value'
          className='text-xs font-bold'
          chars={26}
          tone='soft'
        />
      </CardContent>
    </Card>
  );
}
