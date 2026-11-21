import type { LucideIcon } from 'lucide-react-native';
import { useUnstableNativeVariable } from 'nativewind';

import type { TextTone } from '@/components/text';

// Mesmos tons do Text. O SVG recebe a cor por prop (não por classe), então ela
// é lida do token, como a sombra dura; acompanha o modo claro/escuro.
const TONE_TOKENS: Record<TextTone, `--${string}`> = {
  default: '--foreground',
  muted: '--muted-foreground',
  income: '--income',
  expense: '--expense',
  warning: '--warning',
  'band-foreground': '--band-foreground',
  'ai-foreground': '--ai-foreground',
  'danger-foreground': '--danger-foreground',
};

export type IconProps = {
  icon: LucideIcon;
  tone?: TextTone;
  /** 16 = w-4 h-4 do web. */
  size?: number;
};

/** Ícone do lucide na cor de um token. Decorativo: o texto ao lado dá o sentido. */
export function Icon({
  icon: LucideComponent,
  tone = 'default',
  size = 16,
}: IconProps) {
  const color: unknown = useUnstableNativeVariable(TONE_TOKENS[tone]);

  return (
    <LucideComponent
      size={size}
      color={typeof color === 'string' ? color : undefined}
      accessibilityElementsHidden
      importantForAccessibility='no-hide-descendants'
    />
  );
}
