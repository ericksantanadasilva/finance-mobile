// iOS (e tipos). O Android usa date-picker-dialog.android.tsx.
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useUnstableNativeVariable } from 'nativewind';
import { useColorScheme } from 'react-native';

import { dateOnlyToLocal, localToDateOnly } from '@/lib/dates';

export type DatePickerDialogProps = {
  /** Dia inicial, "YYYY-MM-DD". */
  value: string;
  /** Dia escolhido, "YYYY-MM-DD". */
  onSelect: (value: string) => void;
  /** Fechado sem escolher. */
  onDismiss: () => void;
};

/**
 * Seletor de data aberto ao montar; quem usa desmonta em onSelect/onDismiss.
 * No iOS ele aparece abaixo do campo (ainda não ajustado ao tema: iOS é depois).
 */
export function DatePickerDialogView({
  value,
  onSelect,
  onDismiss,
}: DatePickerDialogProps) {
  const colorScheme = useColorScheme();
  const accent: unknown = useUnstableNativeVariable('--foreground');

  return (
    <DateTimePicker
      mode='date'
      value={dateOnlyToLocal(value)}
      accentColor={typeof accent === 'string' ? accent : undefined}
      themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
      onValueChange={(_, date) => onSelect(localToDateOnly(date))}
      onDismiss={onDismiss}
    />
  );
}
