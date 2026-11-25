import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// p-6 do conteúdo somado às áreas do sistema
const PADDING = 24;

export type CenteredScreenProps = {
  children: ReactNode;
  /**
   * Fundo decorativo (ex.: as formas do login): preso à tela, atrás do
   * conteúdo, sem receber toque e escondido do leitor de tela. O que passar
   * da borda é cortado.
   */
  decoration?: ReactNode;
};

/**
 * Tela com o conteúdo centralizado (login, sessão, erro de sessão). Rola se não
 * couber; o app desenha atrás das barras do sistema (edge-to-edge), então o
 * respiro soma as áreas seguras.
 */
export function CenteredScreen({ children, decoration }: CenteredScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className='flex-1 overflow-hidden bg-background'>
      {decoration && (
        <View
          pointerEvents='none'
          accessibilityElementsHidden
          importantForAccessibility='no-hide-descendants'
          className='absolute inset-0'
        >
          {decoration}
        </View>
      )}
      <ScrollView
        className='flex-1'
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
    </View>
  );
}
