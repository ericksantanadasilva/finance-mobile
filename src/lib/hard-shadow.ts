// Sombra dura do design system (deslocada, sem desfoque, na cor do --ink).
// No Android, a classe de sombra do NativeWind não desenha nada e o elevation
// sempre desfoca; o boxShadow do React Native com a cor lida do token funciona
// e acompanha o modo claro/escuro.
import { useUnstableNativeVariable } from 'nativewind';
import type { ViewStyle } from 'react-native';

const OFFSETS = {
  sm: 2, // shadow-hard-sm do web
  md: 4, // shadow-hard (padrão)
  lg: 6, // shadow-hard-lg (diálogos, card de login)
} as const;

export type HardShadowSize = keyof typeof OFFSETS;

/** Estilo da sombra dura para passar no `style` de uma View. */
export function useHardShadow(size: HardShadowSize = 'md'): ViewStyle {
  const ink: unknown = useUnstableNativeVariable('--ink');

  if (typeof ink !== 'string') {
    if (__DEV__) console.warn('useHardShadow: token --ink não encontrado.');
    return {};
  }

  const offset = OFFSETS[size];
  return { boxShadow: `${offset}px ${offset}px 0px 0px ${ink}` };
}
