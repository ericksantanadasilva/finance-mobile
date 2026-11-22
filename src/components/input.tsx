import { X, type LucideIcon } from 'lucide-react-native';
import { useUnstableNativeVariable } from 'nativewind';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';

import { Icon } from '@/components/icon';
import { Text } from '@/components/text';

export type InputProps = TextInputProps & {
  /** Ícone à esquerda (ex.: Search). Decorativo: use accessibilityLabel. */
  icon?: LucideIcon;
  /** Texto fixo à esquerda (ex.: "R$"), no lugar do ícone. */
  prefix?: string;
  /** Mostra um X para apagar o texto quando houver valor. */
  onClear?: () => void;
  /** Campo com erro: contorno expense (aria-invalid do web). */
  invalid?: boolean;
};

/**
 * Campo de texto (fieldVariants do web, tamanho md): contorno ink, rounded-xl,
 * h-11, texto sm em Space Grotesk.
 */
export function Input({
  icon,
  prefix,
  onClear,
  invalid = false,
  value,
  editable = true,
  className,
  ...props
}: InputProps) {
  // placeholderTextColor é prop, não classe: lida do token
  const placeholder: unknown = useUnstableNativeVariable('--muted-foreground');
  const showClear = !!onClear && !!value;
  // O recuo à esquerda sai daqui, numa classe só: um pl-* vindo da className
  // disputaria com este, e no NativeWind não vence o último da className
  const hasLeft = !!icon || !!prefix;

  return (
    <View className='justify-center'>
      <TextInput
        value={value}
        editable={editable}
        placeholderTextColor={
          typeof placeholder === 'string' ? placeholder : undefined
        }
        // py-0: o Android põe padding vertical próprio, que desalinha o texto no h-11
        className={`h-11 rounded-xl border-2 ${invalid ? 'border-expense' : 'border-ink'} py-0 font-sans text-sm font-medium text-foreground ${hasLeft ? 'pl-11' : 'pl-4'} ${showClear ? 'pr-11' : 'pr-4'} ${editable ? 'bg-surface' : 'bg-surface-muted'} ${className ?? ''}`}
        {...props}
      />
      {(icon || prefix) && (
        // Depois do TextInput: o que vem antes fica sob o fundo opaco dele.
        // pointerEvents none: o toque passa para o campo
        <View pointerEvents='none' className='absolute left-4'>
          {prefix ? (
            <Text tone='muted' className='text-sm font-bold'>
              {prefix}
            </Text>
          ) : (
            icon && <Icon icon={icon} tone='muted' />
          )}
        </View>
      )}
      {showClear && (
        <Pressable
          accessibilityRole='button'
          accessibilityLabel='apagar texto'
          hitSlop={8}
          onPress={onClear}
          className='absolute right-2 size-8 items-center justify-center rounded-lg'
        >
          <Icon icon={X} tone='muted' />
        </Pressable>
      )}
    </View>
  );
}
