import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  useTheme,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import { SessionProvider, useSession } from '@/lib/session-context';

// O splash fica na tela até a sessão ser confirmada (evita piscar o login)
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SessionProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootNavigator />
      </ThemeProvider>
    </SessionProvider>
  );
}

function RootNavigator() {
  const { session } = useSession();
  const loading = session.status === 'loading';

  useEffect(() => {
    if (!loading) SplashScreen.hide();
  }, [loading]);

  if (loading) return null;
  if (session.status === 'error') return <SessionError />;

  const signedIn = session.status === 'signedIn';
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name='index' />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name='login' />
      </Stack.Protected>
    </Stack>
  );
}

/** Há tokens salvos, mas não deu para confirmar a sessão (ex.: servidor fora do ar). */
function SessionError() {
  const { session, retry } = useSession();
  const { colors } = useTheme();
  const message =
    session.status === 'error' ? session.message : 'Erro ao carregar a sessão.';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View accessibilityRole='alert' style={styles.alert}>
        <Text style={{ color: colors.text }}>
          não foi possível abrir sua sessão
        </Text>
        <Text style={{ color: colors.text }}>{message}</Text>
      </View>
      <Pressable
        accessibilityRole='button'
        onPress={retry}
        style={[styles.button, { borderColor: colors.text }]}
      >
        <Text style={{ color: colors.text }}>tentar de novo</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  alert: {
    gap: 4,
    alignItems: 'center',
  },
  button: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});
