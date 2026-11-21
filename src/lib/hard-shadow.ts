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

/**
 * Estilo da sombra dura para passar no `style` de uma View.
 * `color` troca o token da sombra, como o `[--ink:var(--danger-border)]` do web
 * (ex.: botão danger). O contorno do elemento deve usar o mesmo token.
 */
export function useHardShadow(
  size: HardShadowSize = 'md',
  color: `--${string}` = '--ink',
): ViewStyle {
  const value: unknown = useUnstableNativeVariable(color);

  if (typeof value !== 'string') {
    if (__DEV__) console.warn(`useHardShadow: token ${color} não encontrado.`);
    return {};
  }

  const offset = OFFSETS[size];
  return { boxShadow: `${offset}px ${offset}px 0px 0px ${value}` };
}
