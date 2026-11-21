import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

// Texto do app: fonte e cor do tema por padrão, para nenhuma tela precisar
// lembrar delas. Tamanho, peso e caixa continuam na className.

const VARIANTS = {
  body: 'font-sans',
  // Títulos em Space Mono, como h1/h2 no web
  title: 'font-display font-bold',
  value: 'font-sans',
} as const;

// A cor vem do `tone`, não da className: no NativeWind, entre duas classes de
// cor vence a que vem depois no stylesheet (não na className), então
// `text-income` passado por fora nem sempre sobrescreveria o `text-foreground`.
const TONES = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  income: 'text-income',
  expense: 'text-expense',
  warning: 'text-warning',
  // Sobre fundos coloridos (ex.: rótulo dos botões ai e danger)
  'ai-foreground': 'text-ai-foreground',
  'danger-foreground': 'text-danger-foreground',
} as const;

// A classe tabular-nums do Tailwind usa variáveis CSS que o NativeWind não
// converte; o fontVariant direto funciona no Android e no iOS.
const TABULAR_NUMS = { fontVariant: ['tabular-nums'] } as const;

export type TextVariant = keyof typeof VARIANTS;
export type TextTone = keyof typeof TONES;

export type TextProps = RNTextProps & {
  /** body (padrão), title (Space Mono) ou value (números alinhados). */
  variant?: TextVariant;
  /** Cor do texto. Receita/despesa sempre acompanhadas de seta. */
  tone?: TextTone;
};

export function Text({
  variant = 'body',
  tone = 'default',
  className,
  style,
  ...props
}: TextProps) {
  return (
    <RNText
      accessibilityRole={variant === 'title' ? 'header' : undefined}
      {...props}
      className={`${VARIANTS[variant]} ${TONES[tone]} ${className ?? ''}`}
      style={variant === 'value' ? [TABULAR_NUMS, style] : style}
    />
  );
}
