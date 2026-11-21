import {
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { Link, useTheme } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ApiError } from '@/lib/api';
import { useSession } from '@/lib/session-context';

/** Mensagem para o usuário a partir do erro do Google ou da API. */
function loginErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 0) return error.message; // sem rede / tempo esgotado
    if (error.status === 401)
      return 'Não foi possível validar sua conta Google.';
    if (error.status === 403)
      return 'Esta conta não tem permissão para entrar.';
    return 'Erro no servidor. Tente de novo em instantes.';
  }
  if (isErrorWithCode(error)) {
    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return 'O Google Play Services está indisponível ou desatualizado.';
    }
    // Ex.: DEVELOPER_ERROR (código 10) = SHA-1, pacote ou webClientId não batem
    return `Não foi possível entrar com o Google (código ${error.code}).`;
  }
  return 'Não foi possível entrar com o Google.';
}

export default function Login() {
  const { signIn } = useSession();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setLoading(true);
    setError(null);
    try {
      // Se der certo, o Stack.Protected troca para a tela da sessão sozinho
      await signIn();
    } catch (err) {
      // Toque duplo enquanto a janela do Google já está aberta: não é erro
      if (isErrorWithCode(err) && err.code === statusCodes.IN_PROGRESS) return;
      console.error('Erro no login:', err);
      setError(loginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text
        accessibilityRole='header'
        style={[styles.title, { color: colors.text }]}
      >
        Finance.ai
      </Text>

      <Pressable
        accessibilityRole='button'
        accessibilityState={{ disabled: loading, busy: loading }}
        disabled={loading}
        onPress={handleSignIn}
        style={[
          styles.button,
          { borderColor: colors.text },
          loading && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={{ color: colors.text }}>entrar com google</Text>
        )}
      </Pressable>

      {error && (
        <Text accessibilityRole='alert' style={{ color: colors.text }}>
          {error}
        </Text>
      )}

      {/* Provisório (Etapa 3) */}
      {__DEV__ && (
        <Link href='/theme-test' style={{ color: colors.text }}>
          [dev] vitrine do tema
        </Link>
      )}
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  button: {
    minWidth: 200,
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
});
