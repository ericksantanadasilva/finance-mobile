import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/text';

export type EmptyStateProps = {
  message: string;
  /** Ícone suave (muted), decorativo. */
  icon?: ReactNode;
};

/** Lista vazia: bloco tracejado e plano, ícone suave e uma frase. */
export function EmptyState({ message, icon }: EmptyStateProps) {
  return (
    <View className='items-center gap-3 rounded-2xl border-2 border-dashed border-border-custom p-12'>
      {icon && (
        <View
          accessibilityElementsHidden
          importantForAccessibility='no-hide-descendants'
        >
          {icon}
        </View>
      )}
      <Text tone='muted' className='text-center text-sm font-medium'>
        {message}
      </Text>
    </View>
  );
}
