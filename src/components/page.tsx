import { router, useScrollToTop } from 'expo-router';
import { BottomTabBarHeightContext } from 'expo-router/js-tabs';
import { ArrowLeft } from 'lucide-react-native';
import { useUnstableNativeVariable } from 'nativewind';
import {
  use,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from 'react';
import {
  RefreshControl,
  ScrollView,
  View,
  type RefreshControlProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { Text } from '@/components/text';

// p-4 das páginas no mobile do web
export const PAGE_PADDING = 16;

/**
 * Respiro do conteúdo de uma página rolável (ScrollView ou FlatList). A barra
 * de abas flutua por cima: o fim ganha a altura que ela cobre (já com a área
 * segura), para o último item não ficar escondido.
 */
export function usePageContentStyle(): ViewStyle {
  const insets = useSafeAreaInsets();
  // Fora das abas não há barra: só a área segura
  const tabBarHeight = use(BottomTabBarHeightContext) ?? insets.bottom;

  return {
    paddingTop: insets.top + PAGE_PADDING,
    paddingBottom: tabBarHeight + PAGE_PADDING,
    paddingLeft: insets.left + PAGE_PADDING,
    paddingRight: insets.right + PAGE_PADDING,
  };
}

/** Estado do "puxar para atualizar": o indicador some quando a promessa termina. */
export function useRefresh(onRefresh?: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }

  return { refreshing, refresh };
}

/** RefreshControl nas cores do tema e abaixo da barra de status. */
export function ThemedRefreshControl(props: RefreshControlProps) {
  const insets = useSafeAreaInsets();
  // O indicador nativo recebe cor por prop: lida dos tokens
  const spinner: unknown = useUnstableNativeVariable('--foreground');
  const background: unknown = useUnstableNativeVariable('--surface');

  return (
    <RefreshControl
      // O app desenha atrás da barra de status
      progressViewOffset={insets.top}
      colors={typeof spinner === 'string' ? [spinner] : undefined}
      tintColor={typeof spinner === 'string' ? spinner : undefined}
      progressBackgroundColor={
        typeof background === 'string' ? background : undefined
      }
      // Repassa tudo, inclusive children/style que o ScrollView injeta
      {...props}
    />
  );
}

export type PageHeaderProps = {
  title: string;
  /** Mostra o botão de voltar (telas empilhadas, ex.: categorias em "mais"). */
  back?: boolean;
  /** Linha de apoio abaixo do título. */
  subtitle?: string;
};

/** Título da página (h1 do web: Space Mono, minúsculas). */
export function PageHeader({ title, back = false, subtitle }: PageHeaderProps) {
  return (
    <View className='flex-row items-center gap-3'>
      {back && (
        <Button
          variant='outline'
          size='icon'
          accessibilityLabel='voltar'
          onPress={() => router.back()}
        >
          <Icon icon={ArrowLeft} />
        </Button>
      )}
      <View className='shrink gap-0.5'>
        <Text variant='title' className='text-xl lowercase'>
          {title}
        </Text>
        {subtitle && (
          <Text tone='muted' className='text-xs font-medium'>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}

export type PageProps = PageHeaderProps & {
  /** Liga o "puxar para atualizar". */
  onRefresh?: () => Promise<unknown>;
  children: ReactNode;
};

/** Página rolável com título. Listas longas usam as peças acima numa FlatList. */
export function Page({ onRefresh, children, ...header }: PageProps) {
  const contentStyle = usePageContentStyle();
  const { refreshing, refresh } = useRefresh(onRefresh);
  // Tocar de novo na aba ativa volta ao topo (só na primeira tela da pilha)
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  useScrollToTop(scrollRef);

  return (
    <ScrollView
      ref={scrollRef}
      className='flex-1 bg-background'
      refreshControl={
        onRefresh ? (
          <ThemedRefreshControl refreshing={refreshing} onRefresh={refresh} />
        ) : undefined
      }
      contentContainerStyle={{ ...contentStyle, gap: PAGE_PADDING }}
    >
      <PageHeader {...header} />
      {children}
    </ScrollView>
  );
}
