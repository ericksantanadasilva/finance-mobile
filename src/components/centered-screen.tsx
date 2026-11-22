import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// p-6 do conteúdo somado às áreas do sistema
const PADDING = 24;

/**
 * Tela com o conteúdo centralizado (login, sessão, erro de sessão). Rola se não
 * couber; o app desenha atrás das barras do sistema (edge-to-edge), então o
 * respiro soma as áreas seguras.
 */
export function CenteredScreen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className='flex-1 bg-background'
      // Tudo no style (sem contentContainerClassName): o padding depende dos insets
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        paddingTop: insets.top + PADDING,
        paddingBottom: insets.bottom + PADDING,
        paddingLeft: insets.left + PADDING,
        paddingRight: insets.right + PADDING,
      }}
      keyboardShouldPersistTaps='handled'
    >
      {children}
    </ScrollView>
  );
}
