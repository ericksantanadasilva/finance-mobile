import { CircleCheck, Pause } from 'lucide-react-native';
import { View } from 'react-native';

import { Card } from '@/components/card';
import { CategoryBadge } from '@/components/category-badge';
import { Icon } from '@/components/icon';
import { SkeletonText } from '@/components/skeleton';
import { Text } from '@/components/text';
import { TypeIcon } from '@/components/type-icon';
import type { RecurringRule } from '@/lib/api';
import { formatCurrency } from '@/lib/format';

/** "2026-11" → "11/2026" (como o web). */
function monthLabel(month: string) {
  return month.split('-').reverse().join('/');
}

/**
 * Regra recorrente (card do web). Ativa = adesivo; pausada = plana, com borda
 * fina (sem baixar a opacidade, que derrubaria o contraste do texto). Só
 * leitura: pausar, retomar e excluir entram com as rotas de escrita.
 */
export function RecurringRuleCard({ rule }: { rule: RecurringRule }) {
  return (
    <Card flat={!rule.active} className='gap-4 p-5'>
      <View className='flex-row items-start justify-between gap-3'>
        <View className='shrink flex-row items-center gap-3'>
          <TypeIcon type={rule.type} />
          <View className='shrink gap-1'>
            {/* Dado do usuário: como foi cadastrado */}
            <Text numberOfLines={1} className='text-sm font-bold'>
              {rule.description}
            </Text>
            <View className='flex-row flex-wrap items-center gap-2'>
              <Text
                variant='value'
                tone='muted'
                className='text-xs font-medium'
              >
                Todo dia {rule.dayOfMonth}
              </Text>
              <View className='shrink'>
                <CategoryBadge
                  name={rule.category?.name ?? 'Sem categoria'}
                  color={rule.category?.color}
                />
              </View>
            </View>
          </View>
        </View>
        <Text
          variant='value'
          tone={rule.type === 'income' ? 'income' : 'expense'}
          numberOfLines={1}
          className='text-sm font-bold'
        >
          {rule.type === 'expense' ? '- ' : ''}
          {formatCurrency(rule.amount)}
        </Text>
      </View>

      <View className='flex-row flex-wrap items-center gap-1.5'>
        {rule.active ? <ActiveBadge /> : <PausedBadge />}
        {rule.lastGeneratedMonth && (
          <Text variant='value' tone='muted' className='text-xs font-medium'>
            último lançamento {monthLabel(rule.lastGeneratedMonth)}
          </Text>
        )}
      </View>
    </Card>
  );
}

// Selos no padrão do TransactionStatus: contorno colorido + ícone para estado
// ativo, neutro para pausado (nunca só a cor)
function ActiveBadge() {
  return (
    <View className='flex-row items-center gap-1 rounded-md border-2 border-income bg-surface px-1.5 py-0.5'>
      <Icon icon={CircleCheck} tone='income' size={12} />
      <Text tone='income' className='text-xs font-bold lowercase'>
        Ativa
      </Text>
    </View>
  );
}

function PausedBadge() {
  return (
    <View className='flex-row items-center gap-1 rounded-md border border-border-custom bg-surface-muted px-1.5 py-0.5'>
      <Icon icon={Pause} tone='muted' size={12} />
      <Text tone='muted' className='text-xs font-medium lowercase'>
        Pausada
      </Text>
    </View>
  );
}

/** Mesma estrutura de uma regra ativa, para a altura bater. */
export function RecurringRuleCardSkeleton() {
  return (
    <Card className='gap-4 p-5'>
      <View className='flex-row items-start justify-between gap-3'>
        <View className='flex-row items-center gap-3'>
          <View className='size-8 rounded-lg bg-border-custom' />
          <View className='gap-1'>
            <SkeletonText className='text-sm font-bold' chars={14} />
            <View className='flex-row items-center gap-2'>
              <SkeletonText
                variant='value'
                className='text-xs font-medium'
                chars={9}
                tone='soft'
              />
              {/* CategoryBadge: texto xs + py-0.5 + borda 2 */}
              <View className='rounded-md border-2 border-transparent py-0.5'>
                <SkeletonText
                  className='text-xs font-medium'
                  chars={9}
                  tone='soft'
                />
              </View>
            </View>
          </View>
        </View>
        <SkeletonText
          variant='value'
          className='text-sm font-bold'
          chars={10}
        />
      </View>
      <View className='flex-row items-center gap-1.5'>
        {/* Selo "ativa": texto xs + py-0.5 + borda 2 */}
        <View className='rounded-md border-2 border-transparent py-0.5'>
          <SkeletonText className='text-xs font-bold' chars={7} />
        </View>
        <SkeletonText
          variant='value'
          className='text-xs font-medium'
          chars={24}
          tone='soft'
        />
      </View>
    </Card>
  );
}
