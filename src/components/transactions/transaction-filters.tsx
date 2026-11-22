import {
  ArrowDown,
  ArrowUp,
  Check,
  Clock,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ChipSelect, type ChipOption } from '@/components/chip-select';
import { Icon } from '@/components/icon';
import { Input } from '@/components/input';
import { Text } from '@/components/text';
import type { TransactionSort } from '@/lib/api';
import { ALL_MONTHS, shortMonthLabel } from '@/lib/dashboard';

export type TypeFilter = 'all' | 'income' | 'expense';
export type StatusFilter = 'all' | 'paid' | 'pending';

/** Filtros da tela (o texto da busca fica à parte, com debounce). */
export type FilterState = {
  month: string;
  type: TypeFilter;
  status: StatusFilter;
  /** Nome da categoria ou "all". */
  category: string;
  sort: TransactionSort;
};

export function defaultFilters(currentMonth: string): FilterState {
  return {
    month: currentMonth,
    type: 'all',
    status: 'all',
    category: 'all',
    sort: 'date_desc',
  };
}

// Mesmas opções e rótulos do web
const TYPE_OPTIONS: ChipOption<TypeFilter>[] = [
  { value: 'all', label: 'Todas' },
  {
    value: 'income',
    label: 'Receitas',
    icon: ArrowUp,
    activeVariant: 'income',
  },
  {
    value: 'expense',
    label: 'Despesas',
    icon: ArrowDown,
    activeVariant: 'expense',
  },
];

const STATUS_OPTIONS: ChipOption<StatusFilter>[] = [
  { value: 'all', label: 'Qualquer status' },
  { value: 'pending', label: 'Pendentes', icon: Clock },
  { value: 'paid', label: 'Pagas', icon: Check },
];

const SORT_OPTIONS: ChipOption<TransactionSort>[] = [
  { value: 'date_desc', label: 'mais recentes' },
  { value: 'date_asc', label: 'mais antigas' },
  { value: 'amount_desc', label: 'maior valor' },
  { value: 'amount_asc', label: 'menor valor' },
];

export type TransactionFiltersProps = {
  value: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
  search: string;
  onSearchChange: (text: string) => void;
  currentMonth: string;
  /** Meses com lançamentos ("YYYY-MM"), vindos da API. */
  months: string[];
  categories: string[];
  hasActiveFilters: boolean;
  onClear: () => void;
};

/**
 * Filtros no topo: busca e mês sempre à vista; tipo, status, categoria e
 * ordenação recolhidos atrás de "filtros" (com a contagem dos ativos), para não
 * ocupar a tela.
 */
export function TransactionFilters({
  value,
  onChange,
  search,
  onSearchChange,
  currentMonth,
  months,
  categories,
  hasActiveFilters,
  onClear,
}: TransactionFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  // Os recolhidos que estão fora do padrão (a ordenação conta, como filtro visível)
  const hiddenActive = [
    value.type !== 'all',
    value.status !== 'all',
    value.category !== 'all',
    value.sort !== 'date_desc',
  ].filter(Boolean).length;

  // O mês atual aparece mesmo antes do primeiro lançamento dele (como no web)
  const monthOptions: ChipOption<string>[] = [
    { value: ALL_MONTHS, label: 'todos' },
    ...Array.from(new Set([currentMonth, ...months]))
      .sort()
      .reverse()
      .map((m) => ({ value: m, label: shortMonthLabel(m) })),
  ];

  const categoryOptions: ChipOption<string>[] = [
    { value: 'all', label: 'todas' },
    ...categories.map((name) => ({
      value: name,
      label: name,
      preserveCase: true,
    })),
  ];

  return (
    <Card className='gap-4 p-4'>
      <View className='flex-row items-center gap-2'>
        <View className='flex-1'>
          <Input
            icon={Search}
            value={search}
            onChangeText={onSearchChange}
            onClear={() => onSearchChange('')}
            placeholder='Buscar transação...'
            accessibilityLabel='buscar transação'
            returnKeyType='search'
            autoCorrect={false}
          />
        </View>
        <Button
          // Adesivo quando aberto ou com filtro recolhido ativo
          variant={expanded || hiddenActive > 0 ? 'default' : 'outline'}
          accessibilityLabel={`filtros${hiddenActive ? `, ${hiddenActive} ativos` : ''}`}
          accessibilityState={{ expanded }}
          onPress={() => setExpanded((open) => !open)}
        >
          <Icon icon={SlidersHorizontal} />
          {hiddenActive > 0 ? `filtros · ${hiddenActive}` : 'filtros'}
        </Button>
      </View>

      <ChipSelect
        options={monthOptions}
        value={value.month}
        onChange={(month) => onChange({ month })}
        accessibilityLabel='mês'
      />

      {expanded && (
        <View className='gap-3 border-t border-border-custom pt-3'>
          <FilterGroup label='Tipo'>
            <ChipSelect
              options={TYPE_OPTIONS}
              value={value.type}
              onChange={(type) => onChange({ type })}
              accessibilityLabel='tipo'
            />
          </FilterGroup>
          <FilterGroup label='Status'>
            <ChipSelect
              options={STATUS_OPTIONS}
              value={value.status}
              onChange={(status) => onChange({ status })}
              accessibilityLabel='status'
            />
          </FilterGroup>
          {categories.length > 0 && (
            <FilterGroup label='Categoria'>
              <ChipSelect
                options={categoryOptions}
                value={value.category}
                onChange={(category) => onChange({ category })}
                accessibilityLabel='categoria'
              />
            </FilterGroup>
          )}
          <FilterGroup label='Ordenar'>
            <ChipSelect
              options={SORT_OPTIONS}
              value={value.sort}
              onChange={(sort) => onChange({ sort })}
              accessibilityLabel='ordenar'
            />
          </FilterGroup>
        </View>
      )}

      {hasActiveFilters && (
        <Button
          variant='ghost'
          size='sm'
          className='self-start'
          onPress={onClear}
        >
          <Icon icon={X} tone='muted' size={14} />
          limpar filtros
        </Button>
      )}
    </Card>
  );
}

/** Rótulo do grupo (Label do web: text-sm font-bold lowercase, aqui xs). */
function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <View className='gap-1.5'>
      <Text className='text-xs font-bold lowercase'>{label}</Text>
      {children}
    </View>
  );
}
