// Datas sem horário ("YYYY-MM-DD"), como a API recebe e devolve.

// Fuso fixo, o mesmo do servidor e do web: o "hoje" não depende do aparelho
const saoPauloDate = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** "YYYY-MM-DD" de hoje em America/Sao_Paulo. */
export function todayISO(now = new Date()) {
  const parts = saoPauloDate.formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

/**
 * "YYYY-MM-DD" → Date local ao meio-dia, para o seletor nativo (que trabalha
 * no dia do calendário local). Meio-dia: nenhuma mudança de fuso troca o dia.
 */
export function dateOnlyToLocal(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

/** Date do seletor nativo → "YYYY-MM-DD" do dia local escolhido. */
export function localToDateOnly(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** "YYYY-MM" somado de `offset` meses (negativo = antes). */
export function addMonths(month: string, offset: number) {
  const [year, m] = month.split('-').map(Number);
  return new Date(Date.UTC(year, m - 1 + offset, 1)).toISOString().slice(0, 7);
}
