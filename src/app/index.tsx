import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { Card, CardContent, CardHeader } from '@/components/card';
import { CenteredScreen } from '@/components/centered-screen';
import { ErrorBox } from '@/components/error-box';
import { Text } from '@/components/text';
import { getMe } from '@/lib/api';
import { breakAccessTokenForTesting, loadTokens } from '@/lib/session';
import { useSession } from '@/lib/session-context';

const AVATAR = { width: '100%', height: '100%' } as const;

// Tela da sessão (provisória): vira a Visão Geral na Etapa 4
export default function SessionScreen() {
  const { session, signOut } = useSession();
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
    <CenteredScreen>
      <View className='w-full max-w-md gap-4'>
        <Card>
          <CardHeader>sua conta</CardHeader>
          <CardContent className='flex-row items-center gap-4'>
            {/* Borda no View: o Image do expo-image não lê className */}
            {user.image && (
              <View className='size-14 overflow-hidden rounded-full border-2 border-ink'>
                <Image
                  accessibilityIgnoresInvertColors
                  alt=''
                  source={user.image}
                  style={AVATAR}
                />
              </View>
            )}
            {/* Dado do usuário: como foi cadastrado, sem forçar caixa */}
            <View className='flex-1 gap-0.5'>
              <Text className='text-lg font-bold'>{user.name}</Text>
              {user.email && (
                <Text tone='muted' className='text-sm'>
                  {user.email}
                </Text>
              )}
            </View>
          </CardContent>
        </Card>

        {/* Plano: sair é secundário, não destrói dados */}
        <Button
          variant='outline'
          disabled={signingOut}
          accessibilityState={{ disabled: signingOut, busy: signingOut }}
          onPress={handleSignOut}
        >
          {signingOut ? 'saindo...' : 'sair'}
        </Button>

        {error && <ErrorBox message={error} />}

        {__DEV__ && <RefreshTest />}
        {/* Provisório (Etapa 3) */}
        {__DEV__ && (
          <Link
            href='/theme-test'
            className='self-center font-sans text-sm text-muted-foreground underline'
          >
            [dev] vitrine do tema
          </Link>
        )}
      </View>
    </CenteredScreen>
  );
}

/**
 * Só em desenvolvimento: estraga o access token e dispara 3 chamadas ao mesmo
 * tempo. Se a renovação estiver certa, as 3 dão certo com UMA renovação só.
 */
function RefreshTest() {
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
    // Tracejado e plano: ferramenta de desenvolvimento, fora da hierarquia
    <View className='mt-4 gap-2 rounded-2xl border-2 border-dashed border-border-custom p-4'>
      <Text tone='muted' className='text-sm font-medium'>
        [dev] teste da renovação
      </Text>
      <Button
        variant='outline'
        size='sm'
        disabled={running}
        accessibilityState={{ disabled: running, busy: running }}
        onPress={run}
      >
        {running ? 'testando...' : 'estragar access token e chamar /me 3x'}
      </Button>
      {result && (
        <Text selectable variant='value' className='text-sm'>
          {result}
        </Text>
      )}
    </View>
  );
}
