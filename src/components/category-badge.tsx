import { View } from 'react-native';

import { Text } from '@/components/text';

// A coluna color aceita qualquer texto (o padrão do Prisma é "bg-zinc-500", uma
// classe, não uma cor). Só hex vai para o style: cor inválida dá erro no RN.
const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** A cor da categoria, se for um hex válido; senão undefined (use o token muted). */
export function categoryColor(color?: string | null) {
  return color && HEX_COLOR.test(color) ? color : undefined;
}

// sm: linhas compactas (contorno de 1px, menos respiro); a cor continua no
// contorno e na bolinha
const SIZES = {
  md: 'gap-1.5 border-2 px-2 py-0.5',
  sm: 'gap-1 border px-1.5',
} as const;

export type CategoryBadgeProps = {
  name?: string | null;
  color?: string | null;
  size?: keyof typeof SIZES;
};

/**
 * Selo de categoria. A cor do banco aparece só no contorno e na bolinha; o
 * texto fica na cor do tema, legível nos dois modos. O nome aparece como foi
 * cadastrado (sem forçar caixa).
 */
export function CategoryBadge({
  name,
  color,
  size = 'md',
}: CategoryBadgeProps) {
  const valid = categoryColor(color);

  return (
    <View
      className={`max-w-full flex-row items-center self-start rounded-md ${SIZES[size]} ${valid ? '' : 'border-muted-foreground'}`}
      style={valid ? { borderColor: valid } : undefined}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility='no-hide-descendants'
        className={`size-2 shrink-0 rounded-full ${valid ? '' : 'bg-muted-foreground'}`}
        style={valid ? { backgroundColor: valid } : undefined}
      />
      <Text numberOfLines={1} className='shrink text-xs font-medium'>
        {name || 'Geral'}
      </Text>
    </View>
  );
}
