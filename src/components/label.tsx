import { Text, type TextProps } from '@/components/text';

/**
 * Rótulo de campo (Label do web): text-sm, negrito, minúsculas. "R$" e dados
 * do usuário dentro dele vão num Text com `normal-case`.
 */
export function Label({ className, ...props }: TextProps) {
  return (
    <Text
      className={`text-sm font-bold lowercase ${className ?? ''}`}
      {...props}
    />
  );
}
