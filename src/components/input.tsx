import { X, type LucideIcon } from 'lucide-react-native';
import { useUnstableNativeVariable } from 'nativewind';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';

import { Icon } from '@/components/icon';

export type InputProps = TextInputProps & {
  /** Ícone à esquerda (ex.: Search). Decorativo: use accessibilityLabel. */
  icon?: LucideIcon;
  /** Mostra um X para apagar o texto quando houver valor. */
  onClear?: () => void;
};

/**
 * Campo de texto (fieldVariants do web, tamanho md): contorno ink, rounded-xl,
 * h-11, texto sm em Space Grotesk.
 */
export function Input({
  icon,
  onClear,
  value,
  editable = true,
  className,
  ...props
}: InputProps) {
  // placeholderTextColor é prop, não classe: lida do token
  const placeholder: unknown = useUnstableNativeVariable('--muted-foreground');
  const showClear = !!onClear && !!value;

  return (
    <View className='justify-center'>
      {icon && (
        <View className='absolute left-4'>
          <Icon icon={icon} tone='muted' />
        </View>
      )}
      <TextInput
        value={value}
        editable={editable}
        placeholderTextColor={
          typeof placeholder === 'string' ? placeholder : undefined
        }
        // py-0: o Android põe padding vertical próprio, que desalinha o texto no h-11
        className={`h-11 rounded-xl border-2 border-ink py-0 font-sans text-sm font-medium text-foreground ${icon ? 'pl-11' : 'pl-4'} ${showClear ? 'pr-11' : 'pr-4'} ${editable ? 'bg-surface' : 'bg-surface-muted'} ${className ?? ''}`}
        {...props}
      />
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
