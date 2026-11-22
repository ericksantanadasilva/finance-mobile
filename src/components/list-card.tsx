import { useState, type ReactNode } from 'react';
import { View, type LayoutChangeEvent, type ViewStyle } from 'react-native';

import { Text } from '@/components/text';
import { useHardShadow } from '@/lib/hard-shadow';

// Card adesivo para FlatList. Contorno, fundo e sombra são UMA moldura,
// desenhada uma vez por trás das linhas: ela fica na célula do cabeçalho (a
// primeira da lista, desenhada antes das linhas) e desce até o fim do rodapé.
// As linhas são transparentes, só com a divisória fina. Desenhar a borda e a
// sombra em cada fatia deixava emendas (arredondamento de pixels entre células).
//
// Uso: a faixa (ListCardTop) é o último item do ListHeaderComponent e o
// ListCardBottom é o ListFooterComponent inteiro. A FlatList precisa de
// removeClippedSubviews={false}: senão o Android solta o cabeçalho ao rolar e a
// moldura some junto.

/** Mede a moldura: do topo da faixa até o fim do conteúdo (fim do rodapé). */
export function useListCardFrame(contentStyle: ViewStyle) {
  const [bandY, setBandY] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  const top = Number(contentStyle.paddingTop ?? 0) + bandY;
  const bottom = contentHeight - Number(contentStyle.paddingBottom ?? 0);

  return {
    frameHeight: Math.max(bottom - top, 0),
    onBandLayout: (event: LayoutChangeEvent) =>
      setBandY(event.nativeEvent.layout.y),
    onContentSizeChange: (_width: number, height: number) =>
      setContentHeight(height),
  };
}

/**
 * Faixa do topo (CardHeader) + a moldura do card inteiro, por trás das linhas.
 * Até a primeira medida, a moldura cobre só a faixa.
 */
export function ListCardTop({
  title,
  aside,
  frameHeight,
  onLayout,
}: {
  title: string;
  /** Texto à direita (ex.: contagem). */
  aside?: ReactNode;
  frameHeight: number;
  onLayout: (event: LayoutChangeEvent) => void;
}) {
  const shadow = useHardShadow();

  return (
    <View onLayout={onLayout}>
      <View
        className='absolute inset-x-0 top-0 rounded-2xl border-2 border-ink bg-surface'
        style={[
          shadow,
          frameHeight > 0 ? { height: frameHeight } : { bottom: 0 },
        ]}
      />
      {/* Mesmo retângulo do topo da moldura: as bordas coincidem */}
      <View className='flex-row items-center justify-between gap-3 rounded-t-2xl border-2 border-ink bg-band px-4 py-2.5'>
        <Text
          variant='title'
          tone='band-foreground'
          className='shrink text-sm lowercase'
        >
          {title}
        </Text>
        {aside}
      </View>
    </View>
  );
}

/** Divisória fina entre itens, por dentro do contorno. */
function Divider() {
  return <View className='h-px bg-border-custom' />;
}

/** Uma linha do card: transparente, por dentro dos 2px do contorno. */
export function ListCardRow({
  first,
  dimmed = false,
  children,
}: {
  first: boolean;
  /** Atualizando com outros filtros: os dados antigos ficam esmaecidos. */
  dimmed?: boolean;
  children: ReactNode;
}) {
  return (
    <View className='mx-0.5'>
      {!first && <Divider />}
      <View className={dimmed ? 'opacity-60' : ''}>{children}</View>
    </View>
  );
}

/** Fim do card: a moldura termina junto com ele. */
export function ListCardBottom({ children }: { children: ReactNode }) {
  return (
    <View className='mx-0.5 mb-0.5'>
      <Divider />
      <View className='gap-3 px-4 py-3'>{children}</View>
    </View>
  );
}
