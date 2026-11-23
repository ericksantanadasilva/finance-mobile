import { useMutation } from '@tanstack/react-query';
import { CircleCheck, Pause, Play, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { CategoryBadge } from '@/components/category-badge';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Icon } from '@/components/icon';
import { SkeletonText } from '@/components/skeleton';
import { Text } from '@/components/text';
import { useToast } from '@/components/toast';
import { TypeAmountDetail } from '@/components/type-amount-detail';
import { TypeIcon } from '@/components/type-icon';
import {
  ApiError,
  deleteRecurringRule,
  setRecurringActive,
  type RecurringRule,
} from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { writeErrorMessage } from '@/lib/forms';
import {
  invalidateAfterWrite,
  queryClient,
  replaceListItem,
} from '@/lib/query-client';

/** "2026-11" → "11/2026" (como o web). */
function monthLabel(month: string) {
  return month.split('-').reverse().join('/');
}

/**
 * Regra recorrente (card do web). Ativa = adesivo; pausada = plana, com borda
 * fina (sem baixar a opacidade, que derrubaria o contraste do texto). No
 * rodapé, pausar/retomar e excluir (com confirmação).
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

      <RuleActions rule={rule} />
    </Card>
  );
}

/** Sem rede ou regra apagada: a mensagem dos formulários; o resto, a do web. */
function actionErrorMessage(error: Error, fallback: string) {
  if (error instanceof ApiError && (error.status === 0 || error.status === 404))
    return writeErrorMessage(error);
  return fallback;
}

/**
 * Pausar/retomar (sem confirmação: desfaz-se no mesmo botão) e excluir (com
 * confirmação). Os avisos ficam no useMutation: aparecem mesmo se o card sair
 * da tela antes da resposta.
 */
function RuleActions({ rule }: { rule: RecurringRule }) {
  const toast = useToast();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const toggle = useMutation({
    mutationFn: (active: boolean) => setRecurringActive(rule.id, active),
    onSuccess: async (updated) => {
      // O card muda na hora; retomar lança o mês atual: o resto recarrega
      replaceListItem(['recurring'], updated);
      toast.show(
        'success',
        updated.active
          ? 'Recorrência retomada. Os meses pausados não são lançados.'
          : 'Recorrência pausada.',
      );
      await invalidateAfterWrite('recurring');
    },
    onError: (error) =>
      toast.show(
        'error',
        actionErrorMessage(error, 'Não foi possível atualizar a recorrência.'),
      ),
  });

  const removal = useMutation({
    mutationFn: () => deleteRecurringRule(rule.id),
    onSuccess: () => {
      setConfirmingDelete(false);
      // Sai da lista na hora (o card desmonta com o diálogo)
      queryClient.setQueryData<RecurringRule[]>(['recurring'], (rules) =>
        rules?.filter((r) => r.id !== rule.id),
      );
      void invalidateAfterWrite('recurring');
      toast.show('success', 'Recorrência excluída. O histórico foi mantido.');
    },
  });

  const busy = toggle.isPending || removal.isPending;
  const toggleLabel = toggle.isPending
    ? rule.active
      ? 'pausando...'
      : 'retomando...'
    : rule.active
      ? 'pausar'
      : 'retomar';

  return (
    <>
      {/* pb/pr: espaço para a sombra do excluir não ser cortada */}
      <View className='flex-row gap-3 pb-1 pr-1'>
        <Button
          variant='outline'
          size='sm'
          className='flex-1'
          disabled={busy}
          accessibilityLabel={`${rule.active ? 'pausar' : 'retomar'} ${rule.description}`}
          accessibilityState={{ disabled: busy, busy: toggle.isPending }}
          onPress={() => toggle.mutate(!rule.active)}
        >
          <Icon icon={rule.active ? Pause : Play} tone='muted' size={14} />
          {toggleLabel}
        </Button>
        <Button
          variant='expense'
          size='sm'
          className='flex-1'
          disabled={busy}
          accessibilityLabel={`excluir ${rule.description}`}
          onPress={() => {
            removal.reset();
            setConfirmingDelete(true);
          }}
        >
          <Icon icon={Trash2} tone='expense' size={14} />
          excluir
        </Button>
      </View>
      <ConfirmDialog
        open={confirmingDelete}
        title='Excluir recorrência'
        description='Novos lançamentos deixarão de ser gerados. As transações já criadas continuam no seu histórico.'
        detail={
          <TypeAmountDetail
            type={rule.type}
            description={rule.description}
            amount={rule.amount}
            note={`todo dia ${rule.dayOfMonth}`}
          />
        }
        loading={removal.isPending}
        error={removal.error ? writeErrorMessage(removal.error) : undefined}
        onConfirm={() => removal.mutate()}
        onClose={() => setConfirmingDelete(false)}
      />
    </>
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
      {/* Botões pausar/excluir: h-9 (sm), com o respiro da sombra */}
      <View className='flex-row gap-3 pb-1 pr-1'>
        <View className='h-9 flex-1 rounded-xl border-2 border-border-custom' />
        <View className='h-9 flex-1 rounded-xl border-2 border-border-custom' />
      </View>
    </Card>
  );
}
