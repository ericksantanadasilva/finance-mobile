import { Calendar, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { DatePickerDialogView } from '@/components/date-picker-dialog';
import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { todayISO } from '@/lib/dates';
import { formatDateOnly } from '@/lib/format';

export type DateFieldProps = {
  /** "YYYY-MM-DD", ou null (só com `clearable`). */
  value: string | null;
  onChange: (value: string | null) => void;
  /** Nome do campo para o leitor de tela (o mesmo texto do rótulo). */
  accessibilityLabel: string;
  /** Campo opcional: mostra um X para limpar (ex.: prazo da meta). */
  clearable?: boolean;
  /** Texto quando vazio. */
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
};

/**
 * Data sem horário (DatePicker do web): mostra "dd/mm/aaaa" num campo com o
 * contorno do Input e abre o calendário nativo (ver DatePickerDialogView).
 */
export function DateField({
  value,
  onChange,
  accessibilityLabel,
  clearable = false,
  placeholder = 'Selecionar data',
  invalid = false,
  disabled = false,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const showClear = clearable && !!value && !disabled;

  return (
    <View>
      <Pressable
        accessibilityRole='button'
        accessibilityLabel={`${accessibilityLabel}: ${value ? formatDateOnly(value) : 'sem data'}`}
        accessibilityHint='abre o calendário'
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        className={`h-11 flex-row items-center gap-3 rounded-xl border-2 pl-4 ${showClear ? 'pr-11' : 'pr-4'} ${invalid ? 'border-expense' : 'border-ink'} ${disabled ? 'bg-surface-muted' : 'bg-surface'}`}
      >
        <Icon icon={Calendar} tone='muted' />
        <Text
          variant='value'
          tone={value ? 'default' : 'muted'}
          className='text-sm font-medium'
        >
          {value ? formatDateOnly(value) : placeholder}
        </Text>
      </Pressable>
      {showClear && (
        <Pressable
          accessibilityRole='button'
          accessibilityLabel={`limpar ${accessibilityLabel}`}
          hitSlop={8}
          onPress={() => onChange(null)}
          className='absolute right-2 top-1.5 size-8 items-center justify-center rounded-lg'
        >
          <Icon icon={X} tone='muted' />
        </Pressable>
      )}
      {open && (
        // O diálogo abre ao montar; escolher ou cancelar desmonta
        <DatePickerDialogView
          value={value ?? todayISO()}
          onSelect={(selected) => {
            setOpen(false);
            onChange(selected);
          }}
          onDismiss={() => setOpen(false)}
        />
      )}
    </View>
  );
}
