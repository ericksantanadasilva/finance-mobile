// O Intl põe um espaço inquebrável entre "R$" e o número.
const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

/** Valor em reais: 1234.5 → "R$ 1.234,50". */
export function formatCurrency(value: number): string {
  return currency.format(value);
}

/** Valor com sinal na despesa, como no web ("- R$ 50,00"). */
export function signedAmount(tx: {
  amount: number;
  type: 'income' | 'expense';
}): string {
  const value = formatCurrency(tx.amount);
  return tx.type === 'expense' ? `- ${value}` : value;
}

/**
 * Data sem horário ("dd/mm/aaaa"), lida em UTC como o formatDateOnly do web:
 * gravada ao meio-dia UTC (ou meia-noite nos registros antigos), o dia não
 * muda em nenhum fuso do Brasil.
 */
export function formatDateOnly(iso: string): string {
  const date = new Date(iso);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getUTCFullYear()}`;
}
