// TriangleExclamationPoint é o nome atual do AlertTriangle usado no web
import { TriangleExclamationPoint } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
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
        {/* mt-0.5 centraliza o ícone de 16px na linha de 20px do text-sm */}
        <View className='mt-0.5'>
          <Icon icon={TriangleExclamationPoint} tone='expense' />
        </View>
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
