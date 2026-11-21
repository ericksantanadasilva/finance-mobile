// O Intl põe um espaço inquebrável entre "R$" e o número.
const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

/** Valor em reais: 1234.5 → "R$ 1.234,50". */
export function formatCurrency(value: number): string {
  return currency.format(value);
}
