import { ArrowDown, ArrowUp } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Card, CardContent, CardHeader } from '@/components/card';
import { ChipSelect } from '@/components/chip-select';
import { Icon } from '@/components/icon';
import { SkeletonText } from '@/components/skeleton';
import { Text } from '@/components/text';
import type { DashboardTotal } from '@/lib/api';
import { monthlyFlow, shortMonthLabel, type MonthFlow } from '@/lib/dashboard';
import { formatCurrency } from '@/lib/format';

const RANGES = [
  { value: '3', label: '3 meses' },
  { value: '6', label: '6 meses' },
  { value: '12', label: '1 ano' },
] as const;
type Range = (typeof RANGES)[number]['value'];

// Área das barras (h-48); a mais alta para um pouco abaixo do topo
const CHART_HEIGHT = 192;
const BAR_MAX = CHART_HEIGHT - 8;
const BAR_MIN = 4;

/** Fluxo mensal: barras de receita e despesa por mês, feitas com View. */
export function MonthlyFlowCard({
  totals,
  now,
}: {
  totals: DashboardTotal[];
  now: Date;
}) {
  const [range, setRange] = useState<Range>('6');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const flow = monthlyFlow(totals, Number(range), now);
  // Sem toque (ou mês fora do período): o mês atual, o último da lista
  const selected =
    flow.find((m) => m.month === selectedMonth) ?? flow[flow.length - 1];
  const max = Math.max(0, ...flow.flatMap((m) => [m.income, m.expense]));

  return (
    <Card>
      <CardHeader>
        <Text
          variant='title'
          tone='band-foreground'
          className='text-sm lowercase'
        >
          Fluxo Mensal
        </Text>
      </CardHeader>
      <CardContent className='gap-4 p-4'>
        <ChipSelect
          options={[...RANGES]}
          value={range}
          onChange={setRange}
          accessibilityLabel='período do gráfico'
        />
        <Legend />

        <View>
          <View
            className='flex-row items-end gap-1 border-b-2 border-ink'
            style={{ height: CHART_HEIGHT }}
          >
            {flow.map((m) => (
              <MonthColumn
                key={m.month}
                data={m}
                max={max}
                selected={m.month === selected.month}
                onPress={() => setSelectedMonth(m.month)}
              />
            ))}
          </View>
          <View className='mt-1.5 flex-row gap-1'>
            {flow.map((m) => (
              <Text
                key={m.month}
                tone={m.month === selected.month ? 'default' : 'muted'}
                variant='title'
                numberOfLines={1}
                adjustsFontSizeToFit
                className='flex-1 text-center text-xs'
              >
                {m.label}
              </Text>
            ))}
          </View>
        </View>

        <MonthSummary data={selected} />
      </CardContent>
    </Card>
  );
}

/** Amostra com contorno + seta + nome, como a legenda do web. */
function Legend() {
  return (
    <View className='flex-row items-center gap-4'>
      <LegendItem tone='income' label='receitas' />
      <LegendItem tone='expense' label='despesas' />
    </View>
  );
}

function LegendItem({
  tone,
  label,
}: {
  tone: 'income' | 'expense';
  label: string;
}) {
  return (
    <View className='flex-row items-center gap-1.5'>
      <View
        className={`size-3 rounded-sm border-2 border-ink ${tone === 'income' ? 'bg-income' : 'bg-expense'}`}
      />
      <Icon
        icon={tone === 'income' ? ArrowUp : ArrowDown}
        tone={tone}
        size={14}
      />
      <Text tone='muted' className='text-xs font-medium'>
        {label}
      </Text>
    </View>
  );
}

type MonthColumnProps = {
  data: MonthFlow;
  max: number;
  selected: boolean;
  onPress: () => void;
};

/** Um mês: duas barras lado a lado. Tocar mostra os valores embaixo. */
function MonthColumn({ data, max, selected, onPress }: MonthColumnProps) {
  return (
    <Pressable
      accessibilityRole='button'
      accessibilityState={{ selected }}
      accessibilityLabel={`${shortMonthLabel(data.month)}: receitas ${formatCurrency(data.income)}, despesas ${formatCurrency(data.expense)}`}
      onPress={onPress}
      // Fundo suave no mês tocado, como o cursor do gráfico do web
      className={`h-full flex-1 flex-row items-end justify-center gap-0.5 rounded-t-md px-0.5 ${selected ? 'bg-surface-muted' : ''}`}
    >
      <Bar value={data.income} max={max} className='bg-income' />
      <Bar value={data.expense} max={max} className='bg-expense' />
    </Pressable>
  );
}

function Bar({
  value,
  max,
  className,
}: {
  value: number;
  max: number;
  className: string;
}) {
  // Sem valor, sem barra (um traço de contorno pareceria um valor pequeno)
  if (value <= 0 || max <= 0) return <View className='max-w-8 flex-1' />;

  const height = Math.max((value / max) * BAR_MAX, BAR_MIN);
  return (
    <View
      // Base reta apoiada no eixo, cantos de cima arredondados (como no web)
      className={`max-w-8 flex-1 rounded-t-md border-2 border-b-0 border-ink ${className}`}
      style={{ height }}
    />
  );
}

/** Valores do mês tocado: o papel do tooltip do web. */
function MonthSummary({ data }: { data: MonthFlow }) {
  return (
    <View className='gap-1 rounded-xl border-2 border-border-custom p-3'>
      <Text variant='title' className='text-xs lowercase'>
        {shortMonthLabel(data.month)}
      </Text>
      <SummaryRow tone='income' label='receitas' value={data.income} />
      <SummaryRow tone='expense' label='despesas' value={data.expense} />
    </View>
  );
}

function SummaryRow({
  tone,
  label,
  value,
}: {
  tone: 'income' | 'expense';
  label: string;
  value: number;
}) {
  return (
    <View className='flex-row items-center justify-between gap-4'>
      <View className='flex-row items-center gap-1.5'>
        <Icon
          icon={tone === 'income' ? ArrowUp : ArrowDown}
          tone={tone}
          size={14}
        />
        <Text tone='muted' className='text-sm font-medium'>
          {label}
        </Text>
      </View>
      <Text variant='value' className='text-sm font-bold'>
        {formatCurrency(value)}
      </Text>
    </View>
  );
}

/** Mesma estrutura do card carregado, para a altura bater. */
export function MonthlyFlowCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <SkeletonText variant='title' className='text-sm' chars={12} />
      </CardHeader>
      <CardContent className='gap-4 p-4'>
        {/* Chips: Button sm (h-9) + o pb-1 da rolagem */}
        <View className='flex-row gap-2 pb-1'>
          {[1, 2, 3].map((i) => (
            <View key={i} className='h-9 w-20 rounded-xl bg-border-custom' />
          ))}
        </View>
        <SkeletonText className='text-xs font-medium' chars={24} tone='soft' />
        <View>
          <View
            className='rounded-xl bg-surface-muted'
            style={{ height: CHART_HEIGHT + 2 }}
          />
          <View className='mt-1.5'>
            <SkeletonText
              variant='title'
              className='text-xs'
              chars={30}
              tone='soft'
            />
          </View>
        </View>
        <View className='gap-1 rounded-xl border-2 border-border-custom p-3'>
          <SkeletonText variant='title' className='text-xs' chars={8} />
          <SkeletonText
            className='text-sm font-medium'
            chars={22}
            tone='soft'
          />
          <SkeletonText
            className='text-sm font-medium'
            chars={22}
            tone='soft'
          />
        </View>
      </CardContent>
    </Card>
  );
}
