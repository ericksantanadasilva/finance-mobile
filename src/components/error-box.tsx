import { View } from 'react-native';

import { Button } from '@/components/button';
import { Text } from '@/components/text';

export type ErrorBoxProps = {
  message: string;
  /** Mostra "tentar de novo" (no app não há recarregar a página). */
  onRetry?: () => void;
};

/** Erro na tela: contorno expense, fundo surface e ícone de alerta. */
export function ErrorBox({ message, onRetry }: ErrorBoxProps) {
  return (
    <View
      accessibilityRole='alert'
      accessibilityLiveRegion='polite'
      className='gap-3 rounded-xl border-2 border-expense bg-surface p-3'
    >
      <View className='flex-row items-start gap-2'>
        {/* Provisório até a biblioteca de ícones (AlertTriangle no web) */}
        <Text
          accessibilityElementsHidden
          importantForAccessibility='no'
          tone='expense'
          className='text-sm font-bold'
        >
          !
        </Text>
        <Text className='flex-1 text-sm font-medium'>{message}</Text>
      </View>
      {onRetry && (
        <Button
          variant='outline'
          size='sm'
          className='self-start'
          onPress={onRetry}
        >
          tentar de novo
        </Button>
      )}
    </View>
  );
}
