import { View } from 'react-native';

import { Text, type TextVariant } from '@/components/text';

export type SkeletonTextProps = {
  /**
   * As mesmas classes de texto do conteúdo real (tamanho, peso), para a altura
   * bater. Margens ficam fora, num View em volta: aqui aumentariam a barra.
   */
  className?: string;
  /** A mesma variante do texto real (a fonte muda a altura da linha). */
  variant?: TextVariant;
  /** Largura aproximada da barra, em caracteres. */
  chars?: number;
  tone?: 'strong' | 'soft';
};

/**
 * Linha "fantasma": a barra tem a altura do texto real, então nada pula quando
 * os dados chegam. O fundo fica no View e o texto, só para medir, com
 * opacity-0 (color transparent não escondia o texto no Android).
 */
export function SkeletonText({
  className,
  variant,
  chars = 12,
  tone = 'strong',
}: SkeletonTextProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility='no-hide-descendants'
      className={`max-w-full self-start rounded-md ${tone === 'strong' ? 'bg-border-custom' : 'bg-surface-muted'}`}
    >
      <Text
        variant={variant}
        numberOfLines={1}
        className={`opacity-0 ${className ?? ''}`}
      >
        {'0'.repeat(chars)}
      </Text>
    </View>
  );
}
