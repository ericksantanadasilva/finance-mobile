import { TriangleExclamationPoint } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Icon } from '@/components/icon';
import { Label } from '@/components/label';
import { Text } from '@/components/text';

export type FormFieldProps = {
  /** Rótulo visível. O campo dentro recebe o mesmo texto em `accessibilityLabel`. */
  label: ReactNode;
  /** Mensagem de erro do campo; substitui a dica enquanto existir. */
  error?: string;
  /** Texto de apoio abaixo do campo. */
  hint?: string;
  children: ReactNode;
};

/** Rótulo, campo e mensagem de erro (com ícone, não só a cor). */
export function FormField({ label, error, hint, children }: FormFieldProps) {
  return (
    <View className='gap-2'>
      <Label>{label}</Label>
      {children}
      {error ? (
        <View
          // Anunciado ao aparecer (validação ao enviar)
          accessibilityLiveRegion='polite'
          className='flex-row items-start gap-1.5'
        >
          {/* mt-0.5 centraliza o ícone de 14px na linha de 16px do text-xs */}
          <View className='mt-0.5'>
            <Icon icon={TriangleExclamationPoint} tone='expense' size={14} />
          </View>
          <Text tone='expense' className='flex-1 text-xs font-bold'>
            {error}
          </Text>
        </View>
      ) : (
        hint && (
          <Text tone='muted' className='text-xs font-medium'>
            {hint}
          </Text>
        )
      )}
    </View>
  );
}
