import { View } from 'react-native';

export type ProgressBarProps = {
  /** 0 a 100; acima de 100 enche a barra (o texto ao lado diz o resto). */
  value: number;
  /** Nome lido pelo leitor de tela (ex.: "orçamento de Lazer"). */
  label: string;
  /**
   * Cor do preenchimento, por token (ex.: 'bg-income'). A cor só reforça: quem
   * usa a barra mostra a situação também em texto ou ícone.
   */
  barClassName?: string;
};

/**
 * Barra de progresso no estilo adesivo (ProgressBar do web): trilho com
 * contorno ink e preenchimento na cor da situação.
 */
export function ProgressBar({
  value,
  label,
  barClassName = 'bg-income',
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), 100);

  return (
    <View
      accessible
      accessibilityRole='progressbar'
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
      className='h-3 w-full overflow-hidden rounded-full border-2 border-ink bg-surface-muted'
    >
      <View
        className={`h-full ${barClassName}`}
        style={{ width: `${clamped}%` }}
      />
    </View>
  );
}
