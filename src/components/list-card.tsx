import { useState, type ReactNode } from 'react';
import {
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type ViewStyle,
} from 'react-native';

import { Text } from '@/components/text';
import { useHardShadow } from '@/lib/hard-shadow';

// Card adesivo para FlatList, sem emendas e sem depender de medida em dia.
//
// - A MOLDURA (contorno, fundo e sombra) é desenhada uma vez, por trás das
//   linhas, na célula do cabeçalho (a primeira da lista, desenhada antes delas).
//   Desenhar borda e sombra em cada fatia deixava emendas (arredondamento de
//   pixels entre células).
// - A altura dela é a do conteúdo medido MAIS uma folga: a medida
//   (onContentSizeChange) chega depois de as linhas novas aparecerem, e a
//   moldura não pode ficar curta nesse intervalo.
// - O FIM do card é do rodapé, o último item da lista: ele desenha laterais,
//   borda de baixo, cantos e sombra, por cima da moldura (mesmas bordas, no
//   mesmo lugar: sobreposição, não encaixe, então não há fresta). Assim o fim
//   acompanha a lista no mesmo quadro em que as linhas novas entram.
// - Abaixo do rodapé, uma máscara na cor do fundo esconde a moldura que sobra.
//
// Uso: a faixa (ListCardTop) é o último item do ListHeaderComponent e o
// ListCardBottom é o ListFooterComponent inteiro. A FlatList precisa de
// removeClippedSubviews={false}: senão o Android solta o cabeçalho ao rolar e a
// moldura some junto.

// Deslocamento da sombra dura md (useHardShadow)
const SHADOW = 4;
// Altura da máscara abaixo do rodapé: cobre a folga da moldura e, se a lista
// encolher (ex.: trocar de filtro), a sobra até a medida nova chegar. É um View
// liso, sem sombra: altura grande não custa.
const MASK_HEIGHT = 20_000;

/**
 * Altura da moldura: do topo da faixa até o fim do conteúdo, mais uma folga de
 * duas telas (uma página nova cabe nela antes de a medida chegar).
 */
export function useListCardFrame(contentStyle: ViewStyle) {
  const { height: screenHeight } = useWindowDimensions();
  const [bandY, setBandY] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  const top = Number(contentStyle.paddingTop ?? 0) + bandY;
  const bottom = contentHeight - Number(contentStyle.paddingBottom ?? 0);

  return {
    frameHeight: Math.max(bottom - top, 0) + screenHeight * 2,
    onBandLayout: (event: LayoutChangeEvent) =>
      setBandY(event.nativeEvent.layout.y),
    onContentSizeChange: (_width: number, height: number) =>
      setContentHeight(height),
  };
}

/** Faixa do topo (CardHeader) + a moldura, por trás das linhas. */
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
      {/* Sem fim visível: o rodapé desenha a borda de baixo e a máscara
          esconde o resto */}
      <View
        className='absolute inset-x-0 top-0 rounded-t-2xl border-2 border-ink bg-surface'
        style={[shadow, { height: frameHeight }]}
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

/** Fim do card: desenha a parte de baixo dele e esconde a moldura que sobra. */
export function ListCardBottom({ children }: { children: ReactNode }) {
  const shadow = useHardShadow();

  return (
    <View>
      {/* Máscara (desenhada antes da peça, então fica por baixo dela e da
          sombra dela). Começa SHADOW abaixo do topo do rodapé: até ali, a
          faixa de sombra à direita é a da moldura, que emenda com a do rodapé */}
      <View
        className='absolute bg-background'
        style={{
          top: SHADOW,
          left: -SHADOW,
          right: -SHADOW * 2,
          height: MASK_HEIGHT,
        }}
      />
      <View
        className='rounded-b-2xl border-x-2 border-b-2 border-ink bg-surface'
        style={shadow}
      >
        <Divider />
        <View className='gap-3 px-4 py-3'>{children}</View>
      </View>
    </View>
  );
}
