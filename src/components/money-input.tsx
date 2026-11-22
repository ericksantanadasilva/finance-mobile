import { Input, type InputProps } from '@/components/input';
import { formatMoneyInput, parseMoney } from '@/lib/forms';

export type MoneyInputProps = Omit<
  InputProps,
  'icon' | 'prefix' | 'onClear'
> & {
  value: string;
  onChangeText: (text: string) => void;
};

/**
 * Valor em reais: texto livre com "R$" fixo à esquerda e teclado numérico. Ao
 * sair do campo, um valor válido é reescrito como "1.234,50". A conversão para
 * número fica no formulário (checkMoney).
 */
export function MoneyInput({
  value,
  onChangeText,
  onBlur,
  ...props
}: MoneyInputProps) {
  return (
    <Input
      prefix='R$'
      keyboardType='decimal-pad'
      inputMode='decimal'
      placeholder='0,00'
      value={value}
      onChangeText={onChangeText}
      onBlur={(e) => {
        const parsed = parseMoney(value);
        if (parsed !== null) onChangeText(formatMoneyInput(parsed));
        onBlur?.(e);
      }}
      {...props}
    />
  );
}
