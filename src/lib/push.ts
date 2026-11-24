// Notificações push (só Android, decisão 11): permissão, canal e registro do
// aparelho na API. A permissão só é pedida por ação da pessoa (decisão 13):
// card da Visão Geral ou item da aba "mais". Nunca na abertura.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import {
  AndroidImportance,
  DEFAULT_ACTION_IDENTIFIER,
  type NotificationResponse,
} from 'expo-notifications';
import { router, type Href } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { ApiError, deletePushDevice, registerPushDevice } from './api';
import { ALL_MONTHS } from './dashboard';
import type { SessionState } from './session-context';

const DEVICE_ID_KEY = 'finance.pushDeviceId';
const PROMPT_DISMISSED_KEY = 'finance.pushPromptDismissed';
// O channelId que a API manda (financeiro/lib/push.ts) e o defaultChannel do
// plugin no app.json. Outro id deixaria os avisos fora do canal criado aqui
const CHANNEL_ID = 'default';

/**
 * - `undetermined`: nunca perguntado (é quando o card aparece)
 * - `denied`: negado, mas o sistema ainda deixa perguntar de novo
 * - `blocked`: negado de vez; só pelos ajustes do Android
 */
export type PushPermission =
  'unsupported' | 'granted' | 'undetermined' | 'denied' | 'blocked';

export type PushStatus = {
  permission: PushPermission;
  /** Tocou em "agora não" no card da Visão Geral. */
  promptDismissed: boolean;
};

const PUSH_STATUS_KEY = ['push-status'];

/** Aviso com o app aberto: mostra como com ele fechado. Chamar uma vez, no início. */
export function showNotificationsInForeground() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function readPermission(): Promise<PushPermission> {
  if (Platform.OS !== 'android') return 'unsupported';
  const { status, granted, canAskAgain } =
    await Notifications.getPermissionsAsync();
  if (granted) return 'granted';
  if (!canAskAgain) return 'blocked';
  return status === 'undetermined' ? 'undetermined' : 'denied';
}

async function getPushStatus(): Promise<PushStatus> {
  const [permission, dismissed] = await Promise.all([
    readPermission(),
    SecureStore.getItemAsync(PROMPT_DISMISSED_KEY),
  ]);
  return { permission, promptDismissed: dismissed === '1' };
}

// No Android 13+ o pedido de permissão não aparece sem um canal criado
async function ensureChannel() {
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Avisos',
    importance: AndroidImportance.DEFAULT,
  });
}

// Já registrado nesta execução e nesta sessão: voltar ao app não repete o POST
let registered = false;

async function register() {
  await ensureChannel();
  const projectId: unknown =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (typeof projectId !== 'string') {
    throw new Error('projectId do EAS ausente na configuração do app.');
  }
  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId,
  });
  const device = await registerPushDevice(token);
  await SecureStore.setItemAsync(DEVICE_ID_KEY, device.id);
  registered = true;
}

/**
 * Para de enviar push a este aparelho. No logout, chamar **antes** de apagar
 * os tokens. Sem rede ou com erro, segue mesmo assim: o servidor desativa os
 * aparelhos da sessão revogada no logout.
 */
export async function removePushDevice() {
  registered = false;
  const id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!id) return;
  try {
    await deletePushDevice(id);
  } catch (error) {
    // 404: o servidor já não tem o aparelho, que é o que se queria
    if (!(error instanceof ApiError && error.status === 404)) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Não foi possível remover o aparelho do push: ${message}`);
    }
  }
  await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
}

/**
 * Com sessão, ao abrir o app e ao voltar para ele. Silencioso e sem pedir
 * permissão: com ela, registra (uma vez por execução; cobre a troca do token
 * e renova o lastSeenAt); sem ela (tirada nos ajustes), remove o aparelho.
 * Falhas só vão para o log e são tentadas de novo na próxima vez.
 */
export async function syncPushDevice() {
  try {
    const permission = await readPermission();
    if (permission === 'unsupported') return;
    if (permission === 'granted') {
      if (!registered) await register();
      return;
    }
    if (registered || (await SecureStore.getItemAsync(DEVICE_ID_KEY))) {
      await removePushDevice();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Não foi possível registrar o aparelho para push: ${message}`);
  }
}

/** Sessão encerrada (logout ou derrubada): o próximo login registra de novo. */
export function resetPushSync() {
  registered = false;
}

/** Permissão e "agora não". Recarrega ao voltar ao app (ex.: dos ajustes). */
export function usePushStatus() {
  return useQuery({
    queryKey: PUSH_STATUS_KEY,
    queryFn: getPushStatus,
    staleTime: 0,
  });
}

/**
 * Pede a permissão (criando o canal antes) e registra o aparelho. Devolve a
 * permissão final; erro no registro sobe (a permissão já foi dada, e a
 * próxima abertura tenta registrar de novo).
 */
export function useEnablePush() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await ensureChannel();
      await Notifications.requestPermissionsAsync();
      const permission = await readPermission();
      if (permission === 'granted') await register();
      return permission;
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: PUSH_STATUS_KEY }),
  });
}

/** "Agora não" no card da Visão Geral: some de vez neste aparelho. */
export function useDismissPushPrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => SecureStore.setItemAsync(PROMPT_DISMISSED_KEY, '1'),
    onSuccess: () =>
      queryClient.setQueryData<PushStatus>(PUSH_STATUS_KEY, (status) =>
        status ? { ...status, promptDismissed: true } : status,
      ),
  });
}

// ---------------------------------------------------------------------------
// Toque na notificação

// Os únicos data.url que a API manda (financeiro/lib/notifications.ts). Vem de
// fora: qualquer outro valor é ignorado, nunca vira navegação
const NOTIFICATION_TARGETS = new Map<string, Href>([
  // Vence hoje e atrasadas. Em todos os meses, como o "ver pendentes" da
  // Visão Geral: só com o status, a tela abriria no mês atual e as atrasadas
  // (de meses anteriores) ficariam de fora
  [
    '/transactions?status=pending',
    {
      pathname: '/transactions',
      params: { status: 'pending', month: ALL_MONTHS },
    },
  ],
  // Orçamento
  ['/more/categories', '/more/categories'],
]);

// O mesmo toque pode chegar pelo listener e pela última resposta (app aberto
// pelo toque): abre uma vez só
let handledNotificationId: string | null = null;

function openNotification(response: NotificationResponse) {
  if (response.actionIdentifier !== DEFAULT_ACTION_IDENTIFIER) return;
  const { identifier, content } = response.notification.request;
  if (identifier === handledNotificationId) return;
  handledNotificationId = identifier;

  // Já tratada: não reabre ao voltar ao app nem no próximo login
  void Notifications.clearLastNotificationResponseAsync();

  const url: unknown = content.data?.url;
  const target =
    typeof url === 'string' ? NOTIFICATION_TARGETS.get(url) : undefined;
  if (!target) {
    console.warn(`Notificação com destino desconhecido: ${String(url)}`);
    return;
  }
  router.navigate(target);
}

/**
 * Tocar na notificação abre a tela do data.url: com o app fechado (a última
 * resposta, lida quando a sessão confirma) e com ele aberto ou em segundo
 * plano (listener). Sem sessão não navega, e o toque é descartado.
 */
export function useNotificationNavigation(status: SessionState['status']) {
  useEffect(() => {
    if (status === 'signedOut') {
      void Notifications.clearLastNotificationResponseAsync();
      return;
    }
    if (status !== 'signedIn') return;

    let active = true;
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (active && response) openNotification(response);
    });
    const subscription =
      Notifications.addNotificationResponseReceivedListener(openNotification);
    return () => {
      active = false;
      subscription.remove();
    };
  }, [status]);
}
