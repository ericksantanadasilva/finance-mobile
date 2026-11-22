import { Children, type ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

import { Text } from '@/components/text';
import { type HardShadowSize, useHardShadow } from '@/lib/hard-shadow';

export type CardProps = ViewProps & {
  /** md (padrão); lg em diálogos e no card de login. */
  shadow?: HardShadowSize;
};

/** Card adesivo: contorno ink e sombra dura. */
export function Card({
  shadow: shadowSize = 'md',
  className,
  style,
  ...props
}: CardProps) {
  const shadow = useHardShadow(shadowSize);
  return (
    <View
      {...props}
      className={`rounded-2xl border-2 border-ink bg-surface ${className ?? ''}`}
      style={[shadow, style]}
    />
  );
}

export type CardHeaderProps = Omit<ViewProps, 'children'> & {
  /** Textos viram rótulo em minúsculas; para dado do usuário, passe um <Text> próprio. */
  children: ReactNode;
};

/**
 * Faixa no topo do card: um tom acima da superfície (bg-band) e borda ink,
 * nos dois modos. Nunca invertida (preta no claro ou branca no escuro).
 */
export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <View
      {...props}
      // 14px = raio do card (rounded-2xl, 16px) menos a borda de 2px, para a
      // faixa encaixar no contorno
      className={`flex-row items-center justify-between gap-3 rounded-t-[14px] border-b-2 border-ink bg-band px-4 py-2.5 ${className ?? ''}`}
    >
      {Children.map(children, (child) =>
        typeof child === 'string' || typeof child === 'number' ? (
          <Text
            tone='band-foreground'
            className='shrink text-sm font-medium lowercase'
          >
            {child}
          </Text>
        ) : (
          child
        ),
      )}
    </View>
  );
}

export function CardContent({ className, ...props }: ViewProps) {
  return <View {...props} className={`p-6 ${className ?? ''}`} />;
}
