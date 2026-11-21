import { Children, useState, type ReactNode } from 'react';
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Text, type TextTone } from '@/components/text';
import { useHardShadow } from '@/lib/hard-shadow';

// Mesmas variantes do Button do web. A hierarquia vem da elevação: adesivo
// (contorno + sombra dura) para a ação principal, plano para a secundária.
// Sem variante de fundo ink: fundo e sombra virariam uma mancha só.

type VariantStyle = {
  container: string;
  /** Fundo ao pressionar, no lugar do hover do web (variantes planas). */
  pressedContainer?: string;
  tone: TextTone;
  pressedTone?: TextTone;
  /** Token do contorno/sombra; sem ele, o botão é plano. */
  shadow?: `--${string}`;
};

const VARIANTS = {
  default: {
    container: 'border-ink bg-surface',
    tone: 'default',
    shadow: '--ink',
  },
  // Plano com borda fina: ação secundária (ex.: cancelar)
  outline: {
    container: 'border-border-custom bg-transparent',
    pressedContainer: 'border-border-custom bg-surface-muted',
    tone: 'muted',
    pressedTone: 'default',
  },
  ghost: {
    container: 'border-transparent bg-transparent',
    pressedContainer: 'border-transparent bg-surface-muted',
    tone: 'default',
  },
  // Roxo só para ações de IA
  ai: {
    container: 'border-ink bg-ai',
    tone: 'ai-foreground',
    shadow: '--ink',
  },
  // Contorno e sombra em --danger-border (preto no claro, rosa no escuro)
  danger: {
    container: 'border-danger-border bg-danger',
    tone: 'danger-foreground',
    shadow: '--danger-border',
  },
} satisfies Record<string, VariantStyle>;

const SIZES = {
  sm: { container: 'h-9 px-3', text: 'text-xs' },
  md: { container: 'h-11 px-5', text: 'text-sm' },
  lg: { container: 'h-12 px-8', text: 'text-sm' },
  icon: { container: 'size-10', text: 'text-sm' },
} as const;

// Ao pressionar, o botão desce sobre a própria sombra (4px = sombra md)
const SUNK: ViewStyle = { transform: [{ translateX: 4 }, { translateY: 4 }] };

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Textos viram o rótulo (negrito, minúsculas); outros elementos ficam como estão. */
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  variant = 'default',
  size = 'md',
  disabled,
  className,
  style,
  children,
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const [pressed, setPressed] = useState(false);
  const v: VariantStyle = VARIANTS[variant];
  const s = SIZES[size];
  const shadow = useHardShadow('md', v.shadow ?? '--ink');

  const isPressed = pressed && !disabled;
  const container =
    isPressed && v.pressedContainer ? v.pressedContainer : v.container;
  const tone = isPressed && v.pressedTone ? v.pressedTone : v.tone;

  let elevation: ViewStyle | undefined;
  if (v.shadow) elevation = isPressed ? SUNK : shadow;

  return (
    <Pressable
      accessibilityRole='button'
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPressIn={(e) => {
        setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        onPressOut?.(e);
      }}
      {...props}
      className={`flex-row items-center justify-center gap-2 rounded-xl border-2 ${container} ${s.container} ${disabled ? 'opacity-50' : ''} ${className ?? ''}`}
      style={[elevation, style]}
    >
      {Children.map(children, (child) =>
        typeof child === 'string' || typeof child === 'number' ? (
          <Text
            tone={tone}
            numberOfLines={1}
            className={`font-bold lowercase ${s.text}`}
          >
            {child}
          </Text>
        ) : (
          child
        ),
      )}
    </Pressable>
  );
}
