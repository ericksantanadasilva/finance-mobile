import { Image } from 'expo-image';
import { Link, type Href } from 'expo-router';
import {
  ChevronRight,
  Repeat,
  Tags,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/button';
import { Card, CardContent, CardHeader } from '@/components/card';
import { ErrorBox } from '@/components/error-box';
import { Icon } from '@/components/icon';
import { Page } from '@/components/page';
import { Text } from '@/components/text';
import { getMe } from '@/lib/api';
import { breakAccessTokenForTesting, loadTokens } from '@/lib/session';
import { useSession } from '@/lib/session-context';

const AVATAR = { width: '100%', height: '100%' } as const;

// Telas que não cabem na barra de abas (mesmos ícones do menu do web)
const SHORTCUTS: { href: Href; label: string; icon: LucideIcon }[] = [
  { href: '/more/categories', label: 'Categorias', icon: Tags },
  { href: '/more/recurring', label: 'Recorrentes', icon: Repeat },
];

export default function More() {
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
    <Page title='Mais'>
      <Card>
        {SHORTCUTS.map(({ href, label, icon }, index) => (
          <Link key={label} href={href} asChild>
            <ShortcutRow
              label={label}
              icon={icon}
              first={index === 0}
              last={index === SHORTCUTS.length - 1}
            />
          </Link>
        ))}
      </Card>

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
    </Page>
  );
}

type ShortcutRowProps = {
  label: string;
  icon: LucideIcon;
  first: boolean;
  last: boolean;
  /** Vem do Link (asChild). */
  onPress?: () => void;
};

/** Linha de atalho: divisória fina entre itens, fundo suave ao pressionar. */
function ShortcutRow({ label, icon, first, last, onPress }: ShortcutRowProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      accessibilityRole='link'
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      // 14px = raio do card menos a borda: o fundo ao pressionar encaixa nos cantos
      className={`min-h-14 flex-row items-center gap-3 px-4 ${first ? 'rounded-t-[14px]' : 'border-t border-border-custom'} ${last ? 'rounded-b-[14px]' : ''} ${pressed ? 'bg-surface-muted' : ''}`}
    >
      <Icon icon={icon} tone='muted' size={20} />
      <Text className='flex-1 font-medium lowercase'>{label}</Text>
      <Icon icon={ChevronRight} tone='muted' />
    </Pressable>
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
