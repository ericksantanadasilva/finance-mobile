import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { ChipSelect, type ChipOption } from '@/components/chip-select';
import { Input } from '@/components/input';

// Valor do chip "nova": começa com um caractere que um nome digitado não tem
const NEW_CATEGORY = '\u0000new';

export type CategorySelectProps = {
  /** Nomes das categorias existentes. */
  options: string[];
  /** Nome escolhido ou digitado ("" = nenhum). */
  value: string;
  onChange: (name: string) => void;
  invalid?: boolean;
  /** Oferece "sem categoria" (valor ""), para quando ela é opcional. */
  allowNone?: boolean;
};

/**
 * Categoria por nome, como a API recebe: um chip por categoria existente e
 * "nova", que abre um campo para digitar (o servidor cria se não existir).
 */
export function CategorySelect({
  options,
  value,
  onChange,
  invalid = false,
  allowNone = false,
}: CategorySelectProps) {
  // Um nome que não está na lista (ex.: edição de categoria apagada) abre como "nova"
  const [typing, setTyping] = useState(
    () => !!value && !options.includes(value),
  );

  const chips: ChipOption<string>[] = [
    ...(allowNone ? [{ value: '', label: 'sem categoria' }] : []),
    ...options.map((name) => ({
      value: name,
      label: name,
      preserveCase: true,
    })),
    { value: NEW_CATEGORY, label: 'nova', icon: Plus },
  ];

  return (
    <View className='gap-3'>
      <ChipSelect
        options={chips}
        value={typing ? NEW_CATEGORY : value}
        onChange={(chip) => {
          if (chip === NEW_CATEGORY) {
            setTyping(true);
            onChange('');
          } else {
            setTyping(false);
            onChange(chip);
          }
        }}
        accessibilityLabel='categoria'
      />
      {typing && (
        <Input
          accessibilityLabel='nome da nova categoria'
          placeholder='Nome da categoria'
          autoFocus
          maxLength={50}
          value={value}
          onChangeText={onChange}
          onClear={() => onChange('')}
          invalid={invalid}
        />
      )}
    </View>
  );
}
