import { Bell, BellOff, BellRing, type LucideIcon } from 'lucide-react-native';
import { Linking, View } from 'react-native';

import { Button } from '@/components/button';
import { Card, CardContent, CardHeader } from '@/components/card';
import { ErrorBox } from '@/components/error-box';
import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { useToast } from '@/components/toast';
import { useDismissPushPrompt, useEnablePush, usePushStatus } from '@/lib/push';

const WHAT_YOU_GET =
  'Um aviso no dia em que uma conta vence, um resumo das atrasadas às segundas e um alerta quando uma categoria passa do limite.';

/** Pede a permissão e avisa o resultado (o mesmo no card e na aba "mais"). */
function useEnableWithFeedback() {
  const toast = useToast();
  const enable = useEnablePush();

  function run() {
    enable.mutate(undefined, {
      onSuccess: (permission) => {
        if (permission === 'granted') {
          toast.show('success', 'Avisos ativados.');
        } else {
          toast.show(
            'warning',
            'Sem permissão, os avisos ficam desligados. Dá para ativar depois em "mais".',
          );
        }
      },
      onError: (error) => {
        console.error('Erro ao ativar os avisos:', error);
        toast.show(
          'error',
          'Avisos permitidos, mas não foi possível registrar o aparelho. Tentamos de novo quando o app voltar a abrir.',
        );
      },
    });
  }

  return { run, enabling: enable.isPending };
}

function PushCardHeader({ icon }: { icon: LucideIcon }) {
  return (
    <CardHeader>
      <Text
        variant='title'
        tone='band-foreground'
        className='shrink text-sm lowercase'
      >
        Avisos
      </Text>
      <View
        accessibilityElementsHidden
        importantForAccessibility='no-hide-descendants'
      >
        <Icon icon={icon} tone='band-foreground' />
      </View>
    </CardHeader>
  );
}

/**
 * Convite na Visão Geral: só enquanto a permissão nunca foi pedida e a pessoa
 * não tocou em "agora não". Negado ou ativado, some (a aba "mais" continua).
 */
export function PushPromptCard() {
  const status = usePushStatus();
  const dismiss = useDismissPushPrompt();
  const { run, enabling } = useEnableWithFeedback();

  if (
    status.data?.permission !== 'undetermined' ||
    status.data.promptDismissed
  ) {
    return null;
  }

  return (
    <Card>
      <PushCardHeader icon={BellRing} />
      <CardContent className='gap-4'>
        <Text className='text-sm font-medium'>{WHAT_YOU_GET}</Text>
        <View className='flex-row flex-wrap justify-end gap-3 pb-1 pr-1'>
          <Button
            variant='outline'
            size='sm'
            disabled={enabling || dismiss.isPending}
            onPress={() => dismiss.mutate()}
          >
            agora não
          </Button>
          <Button
            size='sm'
            disabled={enabling || dismiss.isPending}
            accessibilityState={{ disabled: enabling, busy: enabling }}
            onPress={run}
          >
            {enabling ? 'ativando...' : 'ativar avisos'}
          </Button>
        </View>
      </CardContent>
    </Card>
  );
}

/**
 * Situação dos avisos na aba "mais": ativar, ou abrir os ajustes do Android
 * (para desligar, ou quando o sistema não deixa mais perguntar).
 */
export function PushSettingsCard() {
  const status = usePushStatus();
  const { run, enabling } = useEnableWithFeedback();

  if (status.isPending) return null;
  if (status.isError) {
    return (
      <ErrorBox
        message='Não foi possível ler a permissão de avisos.'
        onRetry={() => status.refetch()}
      />
    );
  }

  const { permission } = status.data;
  if (permission === 'unsupported') return null;

  const openSettings = () => void Linking.openSettings();

  return (
    <Card>
      <PushCardHeader icon={permission === 'granted' ? Bell : BellOff} />
      <CardContent className='gap-4'>
        {permission === 'granted' ? (
          <>
            <Text className='text-sm font-medium'>
              Ativados neste aparelho. Para desligar, use os ajustes do Android.
            </Text>
            <Button
              variant='outline'
              size='sm'
              className='self-start'
              onPress={openSettings}
            >
              ajustes do sistema
            </Button>
          </>
        ) : permission === 'blocked' ? (
          <>
            <Text className='text-sm font-medium'>
              Bloqueados nos ajustes do Android. Para receber, permita as
              notificações do Finance.ai por lá.
            </Text>
            <Button size='sm' className='self-start' onPress={openSettings}>
              abrir ajustes
            </Button>
          </>
        ) : (
          <>
            <Text className='text-sm font-medium'>
              Desligados neste aparelho. {WHAT_YOU_GET}
            </Text>
            <Button
              size='sm'
              className='self-start'
              disabled={enabling}
              accessibilityState={{ disabled: enabling, busy: enabling }}
              onPress={run}
            >
              {enabling ? 'ativando...' : 'ativar avisos'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
