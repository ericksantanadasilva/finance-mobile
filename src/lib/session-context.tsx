// Estado da sessão para o app inteiro: único estado global, porque todas as
// telas dependem de "há usuário logado?".
import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import {
  ApiError,
  getMe,
  loginWithGoogle,
  logout,
  setSessionEndedHandler,
  type User,
} from './api';
import { getGoogleIdToken, signOutGoogle } from './google-auth';
import { removePushDevice, resetPushSync, syncPushDevice } from './push';
import { loadTokens } from './session';

export type SessionState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; user: User }
  // Há tokens salvos, mas não deu para confirmar a sessão (ex.: sem rede)
  | { status: 'error'; message: string };

type SessionContextValue = {
  session: SessionState;
  /** Login com Google. Retorna false se o usuário cancelar; erros sobem para a tela. */
  signIn: () => Promise<boolean>;
  signOut: () => Promise<void>;
  /** Tenta de novo confirmar a sessão depois de um erro. */
  retry: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

/** Na abertura do app: sem tokens, vai ao login; com tokens, confirma no backend. */
async function restoreSession(): Promise<SessionState> {
  try {
    const tokens = await loadTokens();
    if (!tokens) return { status: 'signedOut' };

    const user = await getMe();
    return { status: 'signedIn', user };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return { status: 'signedOut' };
    }
    console.error('Erro ao restaurar a sessão:', error);
    return {
      status: 'error',
      message:
        error instanceof ApiError
          ? error.message
          : 'Não foi possível carregar a sessão.',
    };
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>({ status: 'loading' });
  const queryClient = useQueryClient();

  useEffect(() => {
    // Refresh token recusado em qualquer chamada: volta para o login
    setSessionEndedHandler(() => setSession({ status: 'signedOut' }));
    restoreSession().then(setSession);
    return () => setSessionEndedHandler(null);
  }, []);

  // Saiu (pelo botão ou sessão derrubada): o próximo usuário não pode ver os
  // dados do anterior. Roda depois de o Stack.Protected desmontar as abas,
  // então nenhuma tela tenta recarregar sem tokens.
  useEffect(() => {
    if (session.status === 'signedOut') {
      queryClient.clear();
      resetPushSync();
    }
  }, [session.status, queryClient]);

  // Push: com sessão, registra o aparelho ao abrir e ao voltar ao app (ex.:
  // depois de permitir nos ajustes). Nunca pede permissão daqui
  const signedIn = session.status === 'signedIn';
  useEffect(() => {
    if (!signedIn) return;
    void syncPushDevice();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncPushDevice();
    });
    return () => subscription.remove();
  }, [signedIn]);

  async function signIn() {
    const idToken = await getGoogleIdToken();
    if (!idToken) return false;

    const user = await loginWithGoogle(idToken);
    setSession({ status: 'signedIn', user });
    return true;
  }

  async function signOut() {
    // Antes do logout: o DELETE /devices ainda precisa dos tokens
    await removePushDevice();
    await logout();
    try {
      await signOutGoogle();
    } catch (error) {
      // Já saiu do app; só o Google pode pular a escolha de conta no próximo login
      console.warn('Erro ao sair da conta Google:', error);
    }
    setSession({ status: 'signedOut' });
  }

  function retry() {
    setSession({ status: 'loading' });
    restoreSession().then(setSession);
  }

  return (
    <SessionContext.Provider value={{ session, signIn, signOut, retry }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession precisa estar dentro de <SessionProvider>.');
  }
  return value;
}
