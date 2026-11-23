import { TriangleExclamationPoint, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ErrorBox } from '@/components/error-box';
import { Icon } from '@/components/icon';
import { Text } from '@/components/text';

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  /** O item afetado (ex.: a transação, com a seta do tipo e o valor). */
  detail?: ReactNode;
  /** Rótulo do botão de confirmar (padrão: "excluir"). */
  confirmLabel?: string;
  /** Rótulo durante o envio (padrão: "excluindo..."). */
  confirmingLabel?: string;
  /** Enviando: botões desativados e não fecha por fora nem pelo voltar. */
  loading?: boolean;
  /** Erro do envio; o diálogo fica aberto para tentar de novo. */
  error?: string;
  onConfirm: () => void;
  onClose: () => void;
};

/**
 * Confirmação de ação destrutiva (ConfirmDialog do web): fundo escurecido,
 * card adesivo com ícone de alerta, "cancelar" plano e confirmar em danger.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  detail,
  confirmLabel = 'excluir',
  confirmingLabel = 'excluindo...',
  loading = false,
  error,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  function close() {
    if (!loading) onClose();
  }

  return (
    <Modal
      visible={open}
      transparent
      animationType='fade'
      // O app é edge-to-edge: o fundo cobre também as barras do sistema
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={close}
    >
      <View className='flex-1 items-center justify-center p-4'>
        {/* Fundo: tocar fora fecha (ignorado pelo leitor de tela, que usa o X) */}
        <Pressable
          className='absolute inset-0 bg-overlay'
          onPress={close}
          accessible={false}
        />
        <Card
          shadow='lg'
          accessibilityViewIsModal
          className='w-full max-w-sm gap-4 p-6'
        >
          <Button
            variant='ghost'
            size='icon'
            accessibilityLabel='fechar'
            disabled={loading}
            onPress={close}
            className='absolute right-2 top-2'
          >
            <Icon icon={X} tone='muted' />
          </Button>

          <View className='size-12 items-center justify-center self-center rounded-full border-2 border-ink bg-surface-muted'>
            <Icon icon={TriangleExclamationPoint} tone='expense' size={24} />
          </View>

          <View className='gap-2'>
            <Text
              accessibilityRole='header'
              className='text-center text-base font-bold'
            >
              {title}
            </Text>
            <Text
              tone='muted'
              className='text-center text-sm font-medium leading-relaxed'
            >
              {description}
            </Text>
          </View>

          {detail}

          {error && <ErrorBox message={error} />}

          <View className='flex-row gap-3 pt-2'>
            <Button
              variant='outline'
              className='flex-1 px-4'
              disabled={loading}
              onPress={close}
            >
              cancelar
            </Button>
            <Button
              variant='danger'
              className='flex-1 px-4'
              disabled={loading}
              accessibilityState={{ disabled: loading, busy: loading }}
              onPress={onConfirm}
            >
              {loading ? confirmingLabel : confirmLabel}
            </Button>
          </View>
        </Card>
      </View>
    </Modal>
  );
}
