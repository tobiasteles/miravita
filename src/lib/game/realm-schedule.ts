// ───── AGENDA DO REINO: cada mapa abre uma janela de 1h por dia, em um horário aleatório (mas fixo para aquele dia). ─────
// Sem cron: o horário "sorteado" é calculado a partir da data + do mapa (mesma fórmula sempre dá o mesmo resultado no mesmo dia).
export const WINDOW_MIN = 60; // duração da janela, em minutos

function todayBR(d = new Date()): string {
  return d.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function realmWindow(
  slug: string,
  dateStr: string,
): { start: Date; end: Date } {
  const offsetMin = hash(`${dateStr}:${slug}`) % (24 * 60); // minuto do dia (horário de Brasília) em que o Reino abre
  const midnightUTC = Date.parse(`${dateStr}T00:00:00-03:00`); // meia-noite em Brasília, como instante UTC
  const start = new Date(midnightUTC + offsetMin * 60000);
  return { start, end: new Date(start.getTime() + WINDOW_MIN * 60000) };
}
export type RealmStatus =
  | { open: true; closesAt: Date }
  | { open: false; opensAt: Date };
export function realmStatus(slug: string, now = new Date()): RealmStatus {
  const d0 = todayBR(now),
    w0 = realmWindow(slug, d0);
  if (now >= w0.start && now < w0.end) return { open: true, closesAt: w0.end };
  if (now < w0.start) return { open: false, opensAt: w0.start };
  const d1 = todayBR(new Date(now.getTime() + 86400000)),
    w1 = realmWindow(slug, d1); // já passou hoje: calcula o horário de amanhã
  return { open: false, opensAt: w1.start };
}
