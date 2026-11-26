import {
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { Link } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useUnstableNativeVariable } from 'nativewind';
import { useRef, useState, type ComponentRef } from 'react';
import { View, type TextInput } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { CenteredScreen } from '@/components/centered-screen';
import { ErrorBox } from '@/components/error-box';
import { FormField } from '@/components/form-field';
import { Input } from '@/components/input';
import { LoginBlobs } from '@/components/login-blobs';
import { Text } from '@/components/text';
import { ApiError } from '@/lib/api';
import { useSession } from '@/lib/session-context';

/** Mensagem para o usuário a partir do erro do Google ou da API. */
function googleErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 0) return error.message; // sem rede / tempo esgotado
    if (error.status === 401)
      return 'Não foi possível validar sua conta Google.';
    if (error.status === 403)
      return 'Esta conta não tem permissão para entrar.';
    return 'Erro no servidor. Tente de novo em instantes.';
  }
  if (isErrorWithCode(error)) {
    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return 'O Google Play Services está indisponível ou desatualizado.';
    }
    // Ex.: DEVELOPER_ERROR (código 10) = SHA-1, pacote ou webClientId não batem
    return `Não foi possível entrar com o Google (código ${error.code}).`;
  }
  return 'Não foi possível entrar com o Google.';
}

/** 429: o Retry-After vem em segundos; a mensagem arredonda para minutos. */
function tooManyAttemptsMessage(retryAfterSeconds?: number) {
  if (retryAfterSeconds === undefined) {
    return 'Muitas tentativas. Tente de novo mais tarde.';
  }
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return `Muitas tentativas. Tente de novo em ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}.`;
}

// Mensagem do 401: só ela marca os dois campos como inválidos (como no web)
const INVALID_CREDENTIALS = 'E-mail ou senha incorretos.';

/** Mensagem para o usuário a partir do erro do login por e-mail e senha. */
function passwordErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) return 'Não foi possível entrar.';
  switch (error.status) {
    case 0:
      return error.message; // sem rede / tempo esgotado
    case 400:
      return 'Confira o e-mail e a senha.';
    case 401:
      return INVALID_CREDENTIALS;
    case 429:
      return tooManyAttemptsMessage(error.retryAfterSeconds);
    default:
      return 'Erro no servidor. Tente de novo em instantes.';
  }
}

// Só o formato básico; quem decide se o e-mail existe é o servidor
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = { email?: string; password?: string };

function checkCredentials(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email) errors.email = 'Informe o e-mail.';
  else if (!EMAIL_FORMAT.test(email)) errors.email = 'E-mail inválido.';
  if (!password) errors.password = 'Informe a senha.';
  return errors;
}

export default function Login() {
  const { signIn, signInWithPassword } = useSession();
  const [pending, setPending] = useState<'google' | 'password' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);

  const busy = pending !== null;
  const credentialsInvalid = error === INVALID_CREDENTIALS;

  async function handleGoogle() {
    if (busy) return;
    setPending('google');
    setError(null);
    try {
      // Se der certo, o Stack.Protected troca para a tela da sessão sozinho
      await signIn();
    } catch (err) {
      // Toque duplo enquanto a janela do Google já está aberta: não é erro
      if (isErrorWithCode(err) && err.code === statusCodes.IN_PROGRESS) return;
      console.error('Erro no login:', err);
      setError(googleErrorMessage(err));
    } finally {
      setPending(null);
    }
  }

  async function handlePassword() {
    if (busy) return;
    const trimmedEmail = email.trim();
    const errors = checkCredentials(trimmedEmail, password);
    setFieldErrors(errors);
    setError(null);
    if (errors.email || errors.password) return;

    setPending('password');
    try {
      await signInWithPassword(trimmedEmail, password);
    } catch (err) {
      // Só o ApiError (status e "Invalid credentials"): nada de e-mail ou senha
      console.error('Erro no login com senha:', err);
      setError(passwordErrorMessage(err));
      if (err instanceof ApiError && err.status === 401) {
        passwordRef.current?.focus();
      }
    } finally {
      setPending(null);
    }
  }

  return (
    <CenteredScreen decoration={<LoginBlobs />}>
      {/* Como o login do web: card adesivo com a sombra grande */}
      <Card shadow='lg' className='w-full max-w-md gap-6 p-6'>
        <View className='items-center gap-6'>
          <View className='flex-row items-center gap-2'>
            <BrandLogo size='md' />
            <Text variant='title' className='text-xl'>
              Finance.ai
            </Text>
          </View>
          <View className='items-center gap-2'>
            <Text variant='title' className='text-center text-xl lowercase'>
              Bem-vindo ao Finance.ai
            </Text>
            <Text tone='muted' className='text-center text-sm font-medium'>
              Organize suas finanças com o poder da IA.
            </Text>
          </View>
        </View>

        {/* Secundário (outline), como no web; o rótulo na cor do texto, com o ícone */}
        <Button
          variant='outline'
          size='lg'
          disabled={busy}
          accessibilityState={{ disabled: busy, busy: pending === 'google' }}
          onPress={handleGoogle}
        >
          <GoogleIcon />
          <Text numberOfLines={1} className='text-sm font-bold lowercase'>
            {pending === 'google' ? 'entrando...' : 'entrar com google'}
          </Text>
        </Button>

        <View className='flex-row items-center gap-3'>
          <View className='h-px flex-1 bg-border-custom' />
          <Text tone='muted' className='text-xs font-medium lowercase'>
            ou
          </Text>
          <View className='h-px flex-1 bg-border-custom' />
        </View>

        <View className='gap-4'>
          <FormField label='e-mail' error={fieldErrors.email}>
            <Input
              accessibilityLabel='e-mail'
              placeholder='seu@email.com'
              value={email}
              maxLength={254}
              invalid={!!fieldErrors.email || credentialsInvalid}
              keyboardType='email-address'
              autoComplete='email'
              // "username" liga o e-mail à senha no gerenciador de senhas do iOS
              textContentType='username'
              autoCapitalize='none'
              autoCorrect={false}
              returnKeyType='next'
              // Não fecha o teclado ao ir para a senha
              submitBehavior='submit'
              onSubmitEditing={() => passwordRef.current?.focus()}
              onChangeText={(text) => {
                setEmail(text);
                setFieldErrors((e) => ({ ...e, email: undefined }));
              }}
            />
          </FormField>

          <FormField label='senha' error={fieldErrors.password}>
            <Input
              ref={passwordRef}
              accessibilityLabel='senha'
              placeholder='••••••••'
              value={password}
              maxLength={256}
              invalid={!!fieldErrors.password || credentialsInvalid}
              secureTextEntry={!passwordVisible}
              autoComplete='current-password'
              textContentType='password'
              autoCapitalize='none'
              autoCorrect={false}
              returnKeyType='go'
              // Rótulo da tecla só existe no Android; no iOS fica "Ir"
              returnKeyLabel='entrar'
              onSubmitEditing={handlePassword}
              onChangeText={(text) => {
                setPassword(text);
                setFieldErrors((e) => ({ ...e, password: undefined }));
              }}
              action={{
                icon: passwordVisible ? EyeOff : Eye,
                label: passwordVisible ? 'ocultar senha' : 'mostrar senha',
                onPress: () => setPasswordVisible((v) => !v),
              }}
            />
          </FormField>

          <Button
            size='lg'
            disabled={busy}
            accessibilityState={{
              disabled: busy,
              busy: pending === 'password',
            }}
            onPress={handlePassword}
          >
            {pending === 'password' ? 'entrando...' : 'entrar'}
          </Button>

          {error && <ErrorBox message={error} />}
        </View>

        <Text tone='muted' className='text-center text-xs font-medium'>
          Criou a conta com o Google? Use o botão acima.
        </Text>
      </Card>

      {/* Provisório (Etapa 3) */}
      {__DEV__ && (
        <Link
          href='/theme-test'
          className='font-sans text-sm text-muted-foreground underline'
        >
          [dev] vitrine do tema
        </Link>
      )}
    </CenteredScreen>
  );
}

/** "G" do Google numa cor só (como no web), na cor do texto do botão. */
function GoogleIcon() {
  const color: unknown = useUnstableNativeVariable('--foreground');
  const fill = typeof color === 'string' ? color : undefined;

  return (
    <Svg
      width={20}
      height={20}
      viewBox='0 0 24 24'
      accessibilityElementsHidden
      importantForAccessibility='no-hide-descendants'
    >
      <Path
        fill={fill}
        d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
      />
      <Path
        fill={fill}
        d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
      />
      <Path
        fill={fill}
        d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
      />
      <Path
        fill={fill}
        d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
      />
    </Svg>
  );
}
