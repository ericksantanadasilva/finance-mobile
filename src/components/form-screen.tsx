import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { PAGE_PADDING } from '@/components/page';
import { Text } from '@/components/text';

export type FormScreenProps = {
  title: string;
  /** Fechar sem salvar; desativado enquanto salva. */
  closeDisabled?: boolean;
  children: ReactNode;
};

/**
 * Tela de formulário aberta por cima (rota modal, no lugar do diálogo do web):
 * título, botão de fechar e conteúdo rolável que sobe com o teclado.
 */
export function FormScreen({
  title,
  closeDisabled = false,
  children,
}: FormScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    // No Android edge-to-edge a janela não encolhe com o teclado: o padding
    // do KeyboardAvoidingView é que abre espaço (nos dois sistemas)
    <KeyboardAvoidingView behavior='padding' className='flex-1 bg-background'>
      <ScrollView
        // Tocar num chip com o teclado aberto escolhe o chip
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={{
          paddingTop: insets.top + PAGE_PADDING,
          paddingBottom: insets.bottom + PAGE_PADDING,
          paddingLeft: insets.left + PAGE_PADDING,
          paddingRight: insets.right + PAGE_PADDING,
          gap: 20,
        }}
      >
        <View className='flex-row items-center justify-between gap-3'>
          <Text variant='title' className='shrink text-xl lowercase'>
            {title}
          </Text>
          <Button
            variant='outline'
            size='icon'
            accessibilityLabel='fechar'
            disabled={closeDisabled}
            onPress={() => router.back()}
          >
            <Icon icon={X} />
          </Button>
        </View>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
