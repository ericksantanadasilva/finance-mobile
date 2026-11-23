import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { router, useScrollToTop } from 'expo-router';
import { BottomTabBarHeightContext } from 'expo-router/js-tabs';
import {
  ArrowLeftRight,
  ArrowUp,
  CircleArrowDown,
  CircleArrowUp,
  Plus,
  SearchX,
  Wallet,
} from 'lucide-react-native';
import { useUnstableNativeVariable } from 'nativewind';
import { use, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Card, CardHeader } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { ErrorBox } from '@/components/error-box';
import { Icon } from '@/components/icon';
import {
  ListCardBottom,
  ListCardRow,
  ListCardTop,
  useListCardFrame,
} from '@/components/list-card';
import {
  PageHeader,
  ThemedRefreshControl,
  usePageContentStyle,
  useRefresh,
} from '@/components/page';
import { SkeletonText } from '@/components/skeleton';
import { StatCard, StatCardSkeleton } from '@/components/stat-card';
import { Text } from '@/components/text';
import {
  defaultFilters,
  TransactionFilters,
  type FilterState,
} from '@/components/transactions/transaction-filters';
import {
  TransactionRow,
  TransactionRowSkeleton,
} from '@/components/transactions/transaction-row';
import {
  ApiError,
  getTransactions,
  type TransactionFilters as ApiFilters,
  type TransactionItem,
  type TransactionsPage,
} from '@/lib/api';
import { ALL_MONTHS, currentMonthISO } from '@/lib/dashboard';
import { formatCurrency } from '@/lib/format';

const PAGE_SIZE = 20;
const SKELETON_ROWS = 6;
// Busca e faixa de valor esperam o usuário parar de digitar (como no web)
const SEARCH_DEBOUNCE_MS = 400;

function errorMessage(error: Error) {
  // Sem resposta (rede, tempo esgotado): a mensagem já é para o usuário
  if (error instanceof ApiError && error.status === 0) return error.message;
  return 'Não foi possível carregar as transações.';
}

export default function Transactions() {
  const currentMonth = currentMonthISO();
  const [filters, setFilters] = useState<FilterState>(() =>
    defaultFilters(currentMonth),
  );
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedSearch(search),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timeout);
  }, [search]);

  const apiFilters: ApiFilters = {
    month: filters.month,
    q: debouncedSearch.trim() || undefined,
    category: filters.category === 'all' ? undefined : filters.category,
    type: filters.type === 'all' ? undefined : filters.type,
    status: filters.status === 'all' ? undefined : filters.status,
    sort: filters.sort,
  };

  const query = useInfiniteQuery({
    queryKey: ['transactions', apiFilters],
    queryFn: ({ pageParam }) =>
      getTransactions(apiFilters, pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page < last.totalPages ? last.page + 1 : undefined,
    // Ao trocar de filtro, a lista anterior fica (esmaecida) até a nova chegar
    placeholderData: keepPreviousData,
  });

  const firstPage = query.data?.pages[0];
  // Paginação por offset: um lançamento novo entre páginas pode repetir um item
  const items = dedupe(query.data?.pages.flatMap((p) => p.items) ?? []);

  const hasActiveFilters =
    !!debouncedSearch.trim() ||
    filters.category !== 'all' ||
    filters.month !== currentMonth ||
    filters.type !== 'all' ||
    filters.status !== 'all';

  function clearFilters() {
    setSearch('');
    setDebouncedSearch('');
    setFilters(defaultFilters(currentMonth));
  }

  const contentStyle = usePageContentStyle();
  const frame = useListCardFrame(contentStyle);
  const { refreshing, refresh } = useRefresh(() => query.refetch());
  const dimmed = query.isPlaceholderData;
  // A faixa "lançamentos" encosta na primeira linha; sem ela, respiro embaixo
  const showBand = query.isPending || items.length > 0;

  // Tocar de novo na aba "transações" volta ao topo (como no Instagram)
  const listRef = useRef<FlatList<TransactionItem>>(null);
  useScrollToTop(listRef);
  // Botão "voltar ao topo": só depois de rolar uma tela e meia
  const { height: screenHeight } = useWindowDimensions();
  const [showToTop, setShowToTop] = useState(false);

  const header = (
    <View className={`gap-4 ${showBand ? '' : 'pb-4'}`}>
      <PageHeader
        title='Transações'
        subtitle='Consulte e filtre seu histórico financeiro completo.'
        action={
          <Button
            size='sm'
            accessibilityLabel='nova transação'
            onPress={() =>
              router.push({
                pathname: '/transaction',
                // Lança na competência que está sendo vista
                params:
                  filters.month === ALL_MONTHS ? {} : { month: filters.month },
              })
            }
          >
            <Icon icon={Plus} />
            nova
          </Button>
        }
      />
      <TransactionFilters
        value={filters}
        onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
        search={search}
        onSearchChange={setSearch}
        currentMonth={currentMonth}
        months={firstPage?.months ?? []}
        categories={firstPage?.categories ?? []}
        hasActiveFilters={hasActiveFilters}
        onClear={clearFilters}
      />

      {query.isPending ? (
        <>
          {/* Abre no mês atual, que costuma ter sobra: receitas com a nota;
              o saldo tem sempre a nota "conta só o que foi pago" */}
          <StatCardSkeleton hasNote />
          <StatCardSkeleton />
          <StatCardSkeleton hasNote />
        </>
      ) : query.isError && !firstPage ? (
        <ErrorBox
          message={errorMessage(query.error)}
          onRetry={() => query.refetch()}
        />
      ) : firstPage ? (
        <>
          {/* Atualização falhou, mas há dados anteriores: mostra os dois */}
          {query.isError && !query.isFetchNextPageError && (
            <ErrorBox
              message={errorMessage(query.error)}
              onRetry={() => query.refetch()}
            />
          )}
          <View className={`gap-4 ${dimmed ? 'opacity-60' : ''}`}>
            <Summary page={firstPage} />
          </View>
        </>
      ) : null}

      {query.isPending ? (
        <ListSkeleton />
      ) : (
        items.length > 0 && (
          <ListCardTop
            frameHeight={frame.frameHeight}
            onLayout={frame.onBandLayout}
            title='Lançamentos'
            aside={
              <Text
                variant='value'
                tone='band-foreground'
                className='text-xs font-medium'
              >
                {firstPage?.total}
              </Text>
            }
          />
        )
      )}
    </View>
  );

  return (
    <View className='flex-1 bg-background'>
      <FlatList
        ref={listRef}
        className='flex-1'
        contentContainerStyle={contentStyle}
        // A moldura do card fica na célula do cabeçalho: ela não pode ser solta
        removeClippedSubviews={false}
        onContentSizeChange={frame.onContentSizeChange}
        onScroll={(event) =>
          setShowToTop(event.nativeEvent.contentOffset.y > screenHeight * 1.5)
        }
        scrollEventThrottle={100}
        data={query.isPending ? [] : items}
        keyExtractor={(tx) => tx.id}
        renderItem={({ item, index }) => (
          <ListCardRow first={index === 0} dimmed={dimmed}>
            <TransactionRow
              tx={item}
              onPress={() =>
                router.push({
                  pathname: '/transaction',
                  params: { id: item.id },
                })
              }
            />
          </ListCardRow>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          query.isPending || (query.isError && !firstPage) ? undefined : (
            <EmptyList filtered={hasActiveFilters} onClear={clearFilters} />
          )
        }
        ListFooterComponent={
          items.length > 0 && firstPage ? (
            <ListFooter
              loaded={items.length}
              total={firstPage.total}
              loadingMore={query.isFetchingNextPage}
              error={query.isFetchNextPageError}
              onRetry={() => query.fetchNextPage()}
            />
          ) : undefined
        }
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage && !dimmed) {
            query.fetchNextPage();
          }
        }}
        // Carrega a próxima página quando falta meia tela para o fim
        onEndReachedThreshold={0.5}
        keyboardShouldPersistTaps='handled'
        keyboardDismissMode='on-drag'
        refreshControl={
          <ThemedRefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      />
      {showToTop && (
        <ScrollToTopButton
          onPress={() =>
            listRef.current?.scrollToOffset({ offset: 0, animated: true })
          }
        />
      )}
    </View>
  );
}

/** Flutua acima da barra de abas, à direita. */
function ScrollToTopButton({ onPress }: { onPress: () => void }) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = use(BottomTabBarHeightContext) ?? insets.bottom;

  return (
    <View
      className='absolute'
      style={{ bottom: tabBarHeight + 12, right: insets.right + 16 }}
    >
      <Button size='icon' accessibilityLabel='voltar ao topo' onPress={onPress}>
        <Icon icon={ArrowUp} />
      </Button>
    </View>
  );
}

/** Card de lançamentos carregando: mesma faixa, linhas e rodapé do real. */
function ListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <SkeletonText variant='title' className='text-sm' chars={11} />
      </CardHeader>
      {Array.from({ length: SKELETON_ROWS }, (_, i) => (
        <View key={i}>
          {i > 0 && <View className='h-px bg-border-custom' />}
          <TransactionRowSkeleton />
        </View>
      ))}
      <View className='h-px bg-border-custom' />
      <View className='items-center px-4 py-3'>
        <SkeletonText className='text-xs font-medium' chars={8} tone='soft' />
      </View>
    </Card>
  );
}

/**
 * Resumo do conjunto filtrado (como no web). A sobra dos meses anteriores só
 * vem vendo um mês inteiro sem outros filtros: positiva soma nas receitas,
 * negativa nas despesas. O saldo conta só o que foi pago (`balance` da API).
 */
function Summary({ page }: { page: TransactionsPage }) {
  const { income, expense, carryOver, balance } = page.totals;
  const incomeTotal = income + Math.max(carryOver, 0);
  const expenseTotal = expense + Math.max(-carryOver, 0);

  return (
    <>
      <StatCard
        label='Receitas'
        icon={<Icon icon={CircleArrowUp} tone='band-foreground' />}
        value={formatCurrency(incomeTotal)}
        tone='income'
        note={
          carryOver > 0
            ? `${formatCurrency(carryOver)} do mês anterior`
            : undefined
        }
      />
      <StatCard
        label='Despesas'
        icon={<Icon icon={CircleArrowDown} tone='band-foreground' />}
        value={formatCurrency(expenseTotal)}
        tone='expense'
        note={
          carryOver < 0
            ? `${formatCurrency(-carryOver)} do mês anterior`
            : undefined
        }
      />
      <StatCard
        label='Saldo'
        icon={<Icon icon={Wallet} tone='band-foreground' />}
        // Backend sem a 4i não manda o balance: fica a conta antiga (conta tudo)
        value={formatCurrency(balance ?? incomeTotal - expenseTotal)}
        note={balance === undefined ? undefined : 'Conta só o que foi pago'}
      />
    </>
  );
}

function EmptyList({
  filtered,
  onClear,
}: {
  filtered: boolean;
  onClear: () => void;
}) {
  if (!filtered) {
    return (
      <EmptyState
        icon={<Icon icon={ArrowLeftRight} tone='muted' size={32} />}
        message='Nenhuma transação neste mês ainda.'
      />
    );
  }
  return (
    <View className='gap-3'>
      <EmptyState
        icon={<Icon icon={SearchX} tone='muted' size={32} />}
        message='Nenhuma transação corresponde aos filtros.'
      />
      <Button variant='outline' className='self-center' onPress={onClear}>
        limpar filtros
      </Button>
    </View>
  );
}

function ListFooter({
  loaded,
  total,
  loadingMore,
  error,
  onRetry,
}: {
  loaded: number;
  total: number;
  loadingMore: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  const spinner: unknown = useUnstableNativeVariable('--muted-foreground');

  // Tudo dentro do rodapé do card: a moldura termina no fim do rodapé
  return (
    <ListCardBottom>
      {loadingMore ? (
        <View className='flex-row items-center gap-2 self-center'>
          <ActivityIndicator
            size='small'
            color={typeof spinner === 'string' ? spinner : undefined}
          />
          <Text tone='muted' className='text-xs font-medium'>
            carregando mais...
          </Text>
        </View>
      ) : (
        <Text
          variant='value'
          tone='muted'
          className='self-center text-xs font-medium'
        >
          {loaded} de {total}
        </Text>
      )}
      {error && (
        <ErrorBox
          message='Não foi possível carregar mais transações.'
          onRetry={onRetry}
        />
      )}
    </ListCardBottom>
  );
}

function dedupe(items: TransactionItem[]) {
  const seen = new Set<string>();
  return items.filter((tx) => {
    if (seen.has(tx.id)) return false;
    seen.add(tx.id);
    return true;
  });
}
