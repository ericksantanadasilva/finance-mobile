// Agregações da Visão Geral, portadas de financeiro/app/_Components/
// DashboardClient.tsx para os números baterem com o web. Mantém as mesmas
// interpretações de mês: cards e fluxo mensal pelo fuso local (getMonth);
// meses das categorias por toISOString (UTC), como lá. A competência é gravada
// no dia 1 ao meio-dia, então os dois critérios dão o mesmo mês no Brasil.
import type { DashboardTotal } from './api';

/** Filtro de categorias: um mês "YYYY-MM" ou todos. */
export const ALL_MONTHS = 'all';

/** "YYYY-MM" de hoje no fuso local (currentMonthISO do web). */
export function currentMonthISO(now = new Date()) {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${month}`;
}

/** Pendentes de um tipo: total até o mês atual e quanto disso é atrasado. */
export type PendingSummary = { total: number; overdue: number };

/**
 * Cards da Visão Geral (os do web). Receitas e despesas do mês contam tudo
 * (competência); o saldo conta só o pago, com competência até o mês atual
 * (a futura não entra). Pendentes: não pagas até o mês atual; as de meses
 * anteriores são as atrasadas. Previsto = saldo + a receber − a pagar.
 * Sem `isPaid` (backend sem a 4i), o total conta como pago.
 */
export function currentMonthSummary(
  totals: DashboardTotal[],
  now = new Date(),
) {
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const untilNow = totals.filter(
    (t) => new Date(t.referenceDate) < startOfNextMonth,
  );
  const isPrevious = (t: DashboardTotal) =>
    new Date(t.referenceDate) < startOfCurrentMonth;
  const isPaid = (t: DashboardTotal) => t.isPaid ?? true;

  const current = untilNow.filter((t) => !isPrevious(t));
  const income = sum(current.filter((t) => t.type === 'income'));
  const expense = sum(current.filter((t) => t.type === 'expense'));

  const paid = untilNow.filter(isPaid);
  const balance = signedSum(paid);
  const previousBalance = signedSum(paid.filter(isPrevious));

  const pending = untilNow.filter((t) => !isPaid(t));
  const pendingOf = (type: DashboardTotal['type']): PendingSummary => {
    const ofType = pending.filter((t) => t.type === type);
    return { total: sum(ofType), overdue: sum(ofType.filter(isPrevious)) };
  };
  const toPay = pendingOf('expense');
  const toReceive = pendingOf('income');

  return {
    income,
    expense,
    balance,
    previousBalance,
    toPay,
    toReceive,
    hasPending: pending.length > 0,
    forecast: balance + toReceive.total - toPay.total,
  };
}

export type MonthFlow = {
  /** "YYYY-MM", para chave e acessibilidade. */
  month: string;
  /** Mês curto em minúsculas ("nov"). */
  label: string;
  income: number;
  expense: number;
};

/** Receitas e despesas dos últimos `range` meses, do mais antigo ao atual. */
export function monthlyFlow(
  totals: DashboardTotal[],
  range: number,
  now = new Date(),
): MonthFlow[] {
  const data: MonthFlow[] = [];
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthTotals = totals.filter((t) => {
      const ref = new Date(t.referenceDate);
      return (
        ref.getMonth() === d.getMonth() && ref.getFullYear() === d.getFullYear()
      );
    });

    data.push({
      month: currentMonthISO(d),
      label: d
        .toLocaleDateString('pt-BR', { month: 'short' })
        .replace('.', '')
        .toLowerCase(),
      income: sum(monthTotals.filter((t) => t.type === 'income')),
      expense: sum(monthTotals.filter((t) => t.type === 'expense')),
    });
  }
  return data;
}

/** Meses com lançamentos ("YYYY-MM", do mais recente ao mais antigo). */
export function availableMonths(totals: DashboardTotal[]) {
  const months = new Set<string>();
  totals.forEach((t) => {
    months.add(new Date(t.referenceDate).toISOString().slice(0, 7));
  });
  return Array.from(months).sort().reverse();
}

export type CategoryExpense = { name: string; color: string; value: number };

/** Despesas por categoria no mês (ou em todos), da maior para a menor. */
export function categoryExpenses(
  totals: DashboardTotal[],
  month: string,
): CategoryExpense[] {
  const byName: Record<string, { value: number; color: string }> = {};

  totals
    .filter((t) => {
      if (t.type !== 'expense') return false;
      if (month === ALL_MONTHS) return true;
      return new Date(t.referenceDate).toISOString().slice(0, 7) === month;
    })
    .forEach((t) => {
      const name = t.category?.name || 'Outros';
      const color = t.category?.color || '#71717a';
      byName[name] ??= { value: 0, color };
      byName[name].value += t.amount;
    });

  return Object.entries(byName)
    .map(([name, data]) => ({ name, value: data.value, color: data.color }))
    .sort((a, b) => b.value - a.value);
}

/** "YYYY-MM" → "nov 2026" (rótulo curto do seletor de mês). */
export function shortMonthLabel(month: string) {
  // Dia 2, como no web: evita cair no mês anterior em fusos negativos
  const date = new Date(`${month}-02T12:00:00`);
  const name = date
    .toLocaleDateString('pt-BR', { month: 'short' })
    .replace('.', '');
  return `${name} ${date.getFullYear()}`;
}

function sum(totals: DashboardTotal[]) {
  return totals.reduce((acc, t) => acc + t.amount, 0);
}

/** Receita soma, despesa subtrai. */
function signedSum(totals: DashboardTotal[]) {
  return totals.reduce(
    (acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount),
    0,
  );
}
