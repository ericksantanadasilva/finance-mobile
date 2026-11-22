// Situação de uma meta pelo ritmo, não pela porcentagem pura: uma meta no
// começo com pouco juntado não é problema, se o prazo também mal começou.
import type { Goal } from './api';
import { todayISO } from './dates';

export type GoalPace =
  | { status: 'done' }
  /** Sem prazo, não há ritmo a cobrar. */
  | { status: 'noDeadline' }
  | { status: 'onTrack' }
  /** `expected`: porcentagem inteira do prazo já passada (1 a 100). */
  | { status: 'behind'; expected: number }
  | { status: 'overdue' }
  /** Sem data de criação válida: não dá para medir o ritmo (fica em income). */
  | { status: 'noPace' };

/** Tira o resíduo de ponto flutuante (ex.: 28.999999999999996 → 29). */
function round2(value: number) {
  return Math.round(value * 100) / 100;
}

/** Porcentagem juntada, exata (sem floor), para comparar com o ritmo. */
export function savedPercent(goal: Goal) {
  if (goal.targetAmount <= 0) return 0;
  return round2((goal.currentAmount / goal.targetAmount) * 100);
}

/**
 * Progresso exibido: inteiro para baixo (99,9% mostra 99%, nunca 100% antes da
 * hora), limitado a 100.
 */
export function goalProgress(goal: Goal) {
  return Math.min(Math.floor(savedPercent(goal)), 100);
}

/**
 * Concluída pelos valores; vencida quando hoje já passou do dia do prazo; no
 * ritmo quando a porcentagem juntada alcança a porcentagem do tempo passado
 * entre a criação e o prazo.
 */
export function goalPace(goal: Goal, now = new Date()): GoalPace {
  if (goal.currentAmount >= goal.targetAmount) return { status: 'done' };
  if (!goal.deadline) return { status: 'noDeadline' };
  // O dia do prazo ainda conta: vence a partir do dia seguinte
  if (todayISO(now) > goal.deadline) return { status: 'overdue' };

  // Backend sem a migration add_goal_created_at: sem createdAt, sem ritmo
  // (senão o prazo inteiro contaria como passado e toda meta sairia "abaixo")
  const start = goal.createdAt ? new Date(goal.createdAt).getTime() : NaN;
  if (Number.isNaN(start)) return { status: 'noPace' };

  // Prazos são gravados ao meio-dia UTC do dia (parseDateOnly do web)
  const [year, month, day] = goal.deadline.split('-').map(Number);
  const end = Date.UTC(year, month - 1, day, 12);
  const total = end - start;
  // Prazo anterior à criação: o tempo todo já passou
  const elapsed = total > 0 ? ((now.getTime() - start) / total) * 100 : 100;
  // Em pontos inteiros, os mesmos do texto: uma meta recém-criada (esperado
  // 0,07%) não aparece "abaixo do ritmo · esperado 0%"
  const expected = Math.floor(Math.min(Math.max(elapsed, 0), 100));

  return savedPercent(goal) >= expected
    ? { status: 'onTrack' }
    : { status: 'behind', expected };
}
