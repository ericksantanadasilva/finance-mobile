import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
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
  children: ReactNode;
};

/**
 * Página com título (h1 do web: Space Mono, minúsculas) e conteúdo rolável. O
 * respiro de baixo fica com a barra de abas, que já soma a área segura.
 */
export function Page({ title, back = false, children }: PageProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className='flex-1 bg-background'
      contentContainerStyle={{
        gap: PADDING,
        paddingTop: insets.top + PADDING,
        paddingBottom: PADDING * 2,
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
        <Text variant='title' className='shrink text-xl lowercase'>
          {title}
        </Text>
      </View>
      {children}
    </ScrollView>
  );
}
