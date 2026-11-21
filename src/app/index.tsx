import { Image } from 'expo-image';
import { useTheme } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getMe } from '@/lib/api';
import { breakAccessTokenForTesting, loadTokens } from '@/lib/session';
import { useSession } from '@/lib/session-context';

// Tela da sessão (provisória): vira a Visão Geral na Etapa 4
export default function SessionScreen() {
  const { session, signOut } = useSession();
  const { colors } = useTheme();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (session.status !== 'signedIn') return null;
  const { user } = session;

  async function handleSignOut() {
    setSigningOut(true);
    setError(null);
    try {
      // Se der certo, o Stack.Protected volta para o login sozinho
      await signOut();
    } catch (err) {
      console.error('Erro ao sair:', err);
      setError('Não foi possível sair. Tente de novo.');
      setSigningOut(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {user.image && (
        <Image
          accessibilityIgnoresInvertColors
          alt=''
          source={user.image}
          style={styles.avatar}
        />
      )}
      <Text style={[styles.name, { color: colors.text }]}>{user.name}</Text>
      {user.email && <Text style={{ color: colors.text }}>{user.email}</Text>}

      <Pressable
        accessibilityRole='button'
        accessibilityState={{ disabled: signingOut, busy: signingOut }}
        disabled={signingOut}
        onPress={handleSignOut}
        style={[
          styles.button,
          { borderColor: colors.text },
          signingOut && styles.disabled,
        ]}
      >
        <Text style={{ color: colors.text }}>
          {signingOut ? 'saindo...' : 'sair'}
        </Text>
      </Pressable>

      {error && (
        <Text accessibilityRole='alert' style={{ color: colors.text }}>
          {error}
        </Text>
      )}

      {__DEV__ && <RefreshTest />}
    </View>
  );
}

/**
 * Só em desenvolvimento: estraga o access token e dispara 3 chamadas ao mesmo
 * tempo. Se a renovação estiver certa, as 3 dão certo com UMA renovação só.
 */
function RefreshTest() {
  const { colors } = useTheme();
  const [result, setResult] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    setResult(null);
    try {
      const before = await loadTokens();
      breakAccessTokenForTesting();

      const results = await Promise.allSettled([getMe(), getMe(), getMe()]);
      const ok = results.filter((r) => r.status === 'fulfilled').length;
      const after = await loadTokens();
      const rotated =
        !!before && !!after && before.refreshToken !== after.refreshToken;

      setResult(
        `${ok}/3 chamadas ok · refresh token trocado: ${rotated ? 'sim' : 'não'}`,
      );
    } catch (error) {
      setResult(`erro: ${error instanceof Error ? error.message : error}`);
    } finally {
      setRunning(false);
    }
  }

  return (
    <View style={styles.devBox}>
      <Text style={{ color: colors.text }}>[dev] teste da renovação</Text>
      <Pressable
        accessibilityRole='button'
        accessibilityState={{ disabled: running, busy: running }}
        disabled={running}
        onPress={run}
        style={[
          styles.button,
          { borderColor: colors.text },
          running && styles.disabled,
        ]}
      >
        <Text style={{ color: colors.text }}>
          {running ? 'testando...' : 'estragar access token e chamar /me 3x'}
        </Text>
      </Pressable>
      {result && (
        <Text selectable style={{ color: colors.text }}>
          {result}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  button: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  disabled: {
    opacity: 0.6,
  },
  devBox: {
    marginTop: 32,
    alignItems: 'center',
    gap: 8,
  },
});
