// Login nativo do Google (API "Original" da @react-native-google-signin).
// O webClientId faz o Google devolver um ID token com `aud` = client web,
// que o backend valida em POST /api/v1/auth/google.
import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';

import { env } from './env';

let configured = false;

function configureOnce() {
  if (configured) return;
  GoogleSignin.configure({ webClientId: env.googleWebClientId });
  configured = true;
}

/** Abre a escolha de conta. Retorna o ID token, ou null se o usuário cancelar. */
export async function getGoogleIdToken(): Promise<string | null> {
  configureOnce();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) return null;

  const { idToken } = response.data;
  if (!idToken) {
    throw new Error(
      'O Google não devolveu o ID token (confira o webClientId).',
    );
  }
  return idToken;
}

/** Esquece a conta escolhida, para o próximo login mostrar a lista de contas. */
export async function signOutGoogle() {
  configureOnce();
  await GoogleSignin.signOut();
}
