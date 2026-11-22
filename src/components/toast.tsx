// Avisos curtos por cima das telas (Toaster do web). Ficam na raiz porque o
// sucesso de um formulário aparece depois que ele fecha, na tela de trás.
import {
  CircleCheck,
  CircleX,
  TriangleExclamationPoint,
  type LucideIcon,
} from 'lucide-react-native';
import { createContext, use, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Text, type TextTone } from '@/components/text';
import { useHardShadow } from '@/lib/hard-shadow';

const DURATION_MS = 4_000;
// Mais que isso cobre a tela; os mais antigos saem primeiro
const MAX_VISIBLE = 3;

type ToastTone = 'success' | 'warning' | 'error';

// Contorno, sombra e ícone por tipo: a situação não depende só da cor
const TONES: Record<
  ToastTone,
  { icon: LucideIcon; tone: TextTone; border: string; token: `--${string}` }
> = {
  success: {
    icon: CircleCheck,
    tone: 'income',
    border: 'border-income',
    token: '--income',
  },
  warning: {
    icon: TriangleExclamationPoint,
    tone: 'warning',
    border: 'border-warning',
    token: '--warning',
  },
  error: {
    icon: CircleX,
    tone: 'expense',
    border: 'border-expense',
    token: '--expense',
  },
};

type ToastItem = { id: number; tone: ToastTone; message: string };

type ToastContextValue = {
  show: (tone: ToastTone, message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = use(ToastContext);
  if (!context) throw new Error('useToast fora do ToastProvider.');
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const insets = useSafeAreaInsets();

  function dismiss(id: number) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function show(tone: ToastTone, message: string) {
    const id = nextId.current++;
    setItems((current) =>
      [...current, { id, tone, message }].slice(-MAX_VISIBLE),
    );
    setTimeout(() => dismiss(id), DURATION_MS);
    // No Android a região "polite" do aviso já anuncia; o iOS não tem
    if (Platform.OS === 'ios')
      AccessibilityInfo.announceForAccessibility(message);
  }

  return (
    <ToastContext value={{ show }}>
      {children}
      <View
        // box-none: os toques passam para a tela, exceto nos próprios avisos
        pointerEvents='box-none'
        style={{
          top: insets.top + 8,
          left: insets.left + 16,
          right: insets.right + 16,
        }}
        className='absolute gap-2'
      >
        {items.map((item) => (
          <Animated.View
            key={item.id}
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(150)}
          >
            <Toast item={item} onDismiss={() => dismiss(item.id)} />
          </Animated.View>
        ))}
      </View>
    </ToastContext>
  );
}

function Toast({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: () => void;
}) {
  const style = TONES[item.tone];
  const shadow = useHardShadow('md', style.token);

  return (
    <Pressable
      accessibilityRole='alert'
      accessibilityLiveRegion='polite'
      accessibilityHint='toque para fechar'
      onPress={onDismiss}
      className={`flex-row items-start gap-3 rounded-xl border-2 bg-surface p-4 ${style.border}`}
      style={shadow}
    >
      {/* mt-0.5 centraliza o ícone de 16px na linha de 20px do text-sm */}
      <View className='mt-0.5'>
        <Icon icon={style.icon} tone={style.tone} />
      </View>
      <Text className='flex-1 text-sm font-medium'>{item.message}</Text>
    </Pressable>
  );
}
