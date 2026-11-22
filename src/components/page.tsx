import { router } from 'expo-router';
import { BottomTabBarHeightContext } from 'expo-router/js-tabs';
import { ArrowLeft } from 'lucide-react-native';
import { useUnstableNativeVariable } from 'nativewind';
import { use, useState, type ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { Text } from '@/components/text';

// p-4 das páginas no mobile do web
const PADDING = 16;

export type PageProps = {
  title: string;
  /** Mostra o botão de voltar (telas empilhadas, ex.: categorias em "mais"). */
  back?: boolean;
  /** Linha de apoio abaixo do título. */
  subtitle?: string;
  /** Liga o "puxar para atualizar"; o indicador some quando a promessa termina. */
  onRefresh?: () => Promise<unknown>;
  children: ReactNode;
};

/**
 * Página com título (h1 do web: Space Mono, minúsculas) e conteúdo rolável. A
 * barra de abas flutua por cima: o fim do conteúdo ganha a altura que ela
 * cobre (já com a área segura), para o último item não ficar escondido.
 */
export function Page({
  title,
  back = false,
  subtitle,
  onRefresh,
  children,
}: PageProps) {
  const insets = useSafeAreaInsets();
  // Fora das abas não há barra: só a área segura
  const tabBarHeight = use(BottomTabBarHeightContext) ?? insets.bottom;
  const [refreshing, setRefreshing] = useState(false);
  // O indicador nativo recebe cor por prop: lida dos tokens
  const spinner: unknown = useUnstableNativeVariable('--foreground');
  const spinnerBackground: unknown = useUnstableNativeVariable('--surface');

  async function handleRefresh() {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <ScrollView
      className='flex-1 bg-background'
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            // Abaixo da barra de status (o app desenha atrás dela)
            progressViewOffset={insets.top}
            colors={typeof spinner === 'string' ? [spinner] : undefined}
            tintColor={typeof spinner === 'string' ? spinner : undefined}
            progressBackgroundColor={
              typeof spinnerBackground === 'string'
                ? spinnerBackground
                : undefined
            }
          />
        ) : undefined
      }
      contentContainerStyle={{
        gap: PADDING,
        paddingTop: insets.top + PADDING,
        paddingBottom: tabBarHeight + PADDING,
        paddingLeft: insets.left + PADDING,
        paddingRight: insets.right + PADDING,
      }}
    >
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
      {children}
    </ScrollView>
  );
}
