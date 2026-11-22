import { DatePickerDialog, Host } from '@expo/ui/jetpack-compose';
import { useUnstableNativeVariable } from 'nativewind';
import { useColorScheme } from 'react-native';

import type { DatePickerDialogProps } from './date-picker-dialog';

/** Cor de um token do tema como "#rrggbb" (ou undefined, se não achar). */
function useToken(name: `--${string}`) {
  const value: unknown = useUnstableNativeVariable(name);
  return typeof value === 'string' ? (value as `#${string}`) : undefined;
}

/**
 * Calendário Material 3 do Android (Jetpack Compose, do @expo/ui) com as cores
 * do app. Sem isso, o Host usa a paleta do papel de parede (Material You) e o
 * diálogo fica com a cor do aparelho, não a do app.
 */
export function DatePickerDialogView({
  value,
  onSelect,
  onDismiss,
}: DatePickerDialogProps) {
  const colorScheme = useColorScheme();
  const surface = useToken('--surface');
  const surfaceMuted = useToken('--surface-muted');
  const foreground = useToken('--foreground');
  const muted = useToken('--muted-foreground');
  const border = useToken('--border-custom');

  return (
    <Host
      colorScheme={colorScheme === 'dark' ? 'dark' : 'light'}
      // Papéis do Material 3 que o diálogo usa (fundo, textos, campo do modo
      // digitar, seletor de ano): todos nos tokens, nada da paleta do aparelho
      colorOverrides={{
        primary: foreground,
        onPrimary: surface,
        primaryContainer: surfaceMuted,
        onPrimaryContainer: foreground,
        secondaryContainer: surfaceMuted,
        onSecondaryContainer: foreground,
        surface,
        onSurface: foreground,
        onSurfaceVariant: muted,
        surfaceContainerHigh: surface,
        surfaceContainerHighest: surfaceMuted,
        outline: muted,
        outlineVariant: border,
      }}
    >
      <DatePickerDialog
        // O Material 3 trabalha com dias em UTC: meia-noite UTC do dia escolhido
        initialDate={`${value}T00:00:00.000Z`}
        // Botões OK/Cancelar (é a única cor deles); o resto vai explícito abaixo
        color={foreground}
        // Todas as cores do calendário, sem depender dos padrões do Material 3
        elementColors={{
          containerColor: surface,
          // Lápis/calendário da troca de modo (lê a cor do cabeçalho)
          headlineContentColor: foreground,
          titleContentColor: foreground,
          weekdayContentColor: muted,
          subheadContentColor: muted,
          // "novembro de 2026", a seta do ano e as setas de mês (padrão: muted)
          navigationContentColor: foreground,
          dayContentColor: foreground,
          disabledDayContentColor: muted,
          selectedDayContainerColor: foreground,
          selectedDayContentColor: surface,
          todayContentColor: foreground,
          todayDateBorderColor: foreground,
          yearContentColor: foreground,
          currentYearContentColor: foreground,
          selectedYearContainerColor: foreground,
          selectedYearContentColor: surface,
          dividerColor: border,
        }}
        // Com título, o cabeçalho tem altura mínima fixa (120dp, feita para o
        // título + a data por extenso). Sem os dois, fica só a linha do lápis.
        // A data por extenso também não cabia: saía "22 de nov. de", sem o ano
        showTitle={false}
        showHeadline={false}
        confirmButtonLabel='OK'
        dismissButtonLabel='Cancelar'
        onDateSelected={(date) => onSelect(date.toISOString().slice(0, 10))}
        onDismissRequest={onDismiss}
      />
    </Host>
  );
}
