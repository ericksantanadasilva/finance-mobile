import '@/global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme, View } from 'react-native';

import { CenteredScreen } from '@/components/centered-screen';
import { ErrorBox } from '@/components/error-box';
import { Text } from '@/components/text';
import { ToastProvider } from '@/components/toast';
import {
  showNotificationsInForeground,
  useNotificationNavigation,
} from '@/lib/push';
import { queryClient } from '@/lib/query-client';
import { SessionProvider, useSession } from '@/lib/session-context';

// O splash fica na tela até a sessão ser confirmada (evita piscar o login)
SplashScreen.preventAutoHideAsync();
showNotificationsInForeground();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    // Por fora da sessão: ela limpa o cache ao sair
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ThemeProvider
          value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
        >
          {/* auto: ícones escuros no claro e claros no escuro; o fundo atrás
              da barra é a própria tela (edge-to-edge) */}
          <StatusBar style='auto' />
          <ToastProvider>
            <RootNavigator />
          </ToastProvider>
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const { session } = useSession();
  const loading = session.status === 'loading';
  // Antes dos returns abaixo: hooks sempre na mesma ordem
  useNotificationNavigation(session.status);

  useEffect(() => {
    if (!loading) SplashScreen.hide();
  }, [loading]);

  if (loading) return null;
  if (session.status === 'error') return <SessionError />;

  const signedIn = session.status === 'signedIn';
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name='(tabs)' />
        {/* Formulário por cima das abas (sobe de baixo no Android) */}
        <Stack.Screen name='transaction' options={{ presentation: 'modal' }} />
        <Stack.Screen
          name='category-budget'
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name='recurring-rule'
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name='goal' options={{ presentation: 'modal' }} />
        <Stack.Screen
          name='goal-contribution'
          options={{ presentation: 'modal' }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name='login' />
      </Stack.Protected>
      {/* Provisório (Etapa 3): vitrine do tema, só em desenvolvimento */}
      <Stack.Protected guard={__DEV__}>
        <Stack.Screen name='theme-test' />
      </Stack.Protected>
    </Stack>
  );
}

/** Há tokens salvos, mas não deu para confirmar a sessão (ex.: servidor fora do ar). */
function SessionError() {
  const { session, retry } = useSession();
  const message =
    session.status === 'error' ? session.message : 'Erro ao carregar a sessão.';

  return (
    <CenteredScreen>
      <View className='w-full max-w-md gap-4'>
        <Text variant='title' className='text-xl lowercase'>
          Não foi possível abrir sua sessão
        </Text>
        <ErrorBox message={message} onRetry={retry} />
      </View>
    </CenteredScreen>
  );
}
