// Validação dos formulários, com as mesmas regras das rotas de escrita
// (financeiro/lib/api-validation.ts): o app avisa no campo antes de enviar, e
// o servidor continua validando.
import { ApiError } from './api';
import { currentMonthISO } from './dashboard';
import { addMonths } from './dates';

/** Decimal(10, 2) do banco. */
export const MAX_MONEY = 99999999.99;

/** Resultado de um campo: o valor pronto para a API, ou a mensagem do erro. */
export type Check<T> = { ok: true; value: T } | { ok: false; error: string };

// "1.234,56", "1234,5" ou "1234" (pt-BR), e "152.9" (ponto decimal, como o
// teclado numérico de alguns aparelhos digita)
const PT_BR_MONEY = /^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/;
const DOT_DECIMAL_MONEY = /^\d+(\.\d{1,2})?$/;

/** Texto do campo de valor → número, ou null se não for um valor válido. */
export function parseMoney(text: string): number | null {
  const clean = text.replace(/R\$|\s/g, '');
  if (PT_BR_MONEY.test(clean)) {
    return Number(clean.replace(/\./g, '').replace(',', '.'));
  }
  if (DOT_DECIMAL_MONEY.test(clean)) return Number(clean);
  return null;
}

const moneyInput = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Número → texto do campo de valor ("1.234,50", sem o "R$"). */
export function formatMoneyInput(value: number) {
  return moneyInput.format(value);
}

/** Valor em reais: > 0 (ou >= 0 com `allowZero`), até 2 casas, até o máximo do banco. */
export function checkMoney(
  text: string,
  { allowZero = false } = {},
): Check<number> {
  if (!text.trim()) return { ok: false, error: 'Informe o valor.' };

  const value = parseMoney(text);
  if (value === null) {
    return { ok: false, error: 'Valor inválido. Use o formato 1.234,56.' };
  }
  if (allowZero ? value < 0 : value <= 0) {
    return { ok: false, error: 'O valor precisa ser maior que zero.' };
  }
  if (value > MAX_MONEY) {
    return { ok: false, error: 'Valor acima do máximo (R$ 99.999.999,99).' };
  }
  return { ok: true, value };
}

/** Texto obrigatório, sem espaços nas pontas, com até `max` caracteres. */
export function checkText(
  text: string,
  { max, empty }: { max: number; empty: string },
): Check<string> {
  const value = text.trim();
  if (!value) return { ok: false, error: empty };
  if (value.length > max) {
    return { ok: false, error: `Use no máximo ${max} caracteres.` };
  }
  return { ok: true, value };
}

/**
 * Meses de competência oferecidos no formulário: 3 antes e 6 depois do atual,
 * como no web. `include` garante o mês de uma transação editada fora da faixa.
 */
export function referenceMonthOptions(include?: string) {
  const current = currentMonthISO();
  const months = Array.from({ length: 10 }, (_, i) =>
    addMonths(current, i - 3),
  );
  if (include && !months.includes(include)) months.push(include);
  return months.sort();
}

/** Mensagem para o usuário quando uma gravação falha. */
export function writeErrorMessage(error: Error) {
  if (!(error instanceof ApiError)) return 'Não foi possível salvar.';

  switch (error.status) {
    case 0:
      // Sem resposta (rede, tempo esgotado): a mensagem já é para o usuário
      return error.message;
    case 400:
      return 'O servidor recusou os dados. Confira os campos e tente de novo.';
    case 401:
      return 'Sua sessão expirou. Entre de novo.';
    case 404:
      return 'Este item não existe mais. Atualize a tela.';
    case 409:
      return 'Já existe um item com esse nome.';
    default:
      return 'Não foi possível salvar. Tente de novo.';
  }
}
