// ───── AGENDA DO REINO: cada mapa abre VÁRIAS janelas por dia, em horários aleatórios (mas fixos para aquele dia). ─────
// Sem cron: os horários "sorteados" saem de uma fórmula com a data + o mapa (a mesma data sempre dá os mesmos horários).
export const WINDOW_MIN = 60; // duração de cada janela, em minutos
export const OPENINGS_PER_DAY = 6; // quantas vezes por dia o Reino abre. O dia é dividido em faixas iguais e cada janela cai numa faixa, então nunca se sobrepõem

function todayBR(d = new Date()): string {
  return d.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}
function hash(s: string): number {
  // FNV-1a + "avalanche" final (sem ela, textos parecidos davam horários parecidos)
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

export function realmWindows(
  slug: string,
  dateStr: string,
): { start: Date; end: Date }[] {
  const slot = Math.floor((24 * 60) / OPENINGS_PER_DAY),
    room = Math.max(0, slot - WINDOW_MIN); // folga para sortear o início dentro de cada faixa
  const midnightUTC = Date.parse(`${dateStr}T00:00:00-03:00`); // meia-noite em Brasília, como instante UTC
  return Array.from({ length: OPENINGS_PER_DAY }, (_, i) => {
    const start = new Date(
      midnightUTC +
        (i * slot + (hash(`${dateStr}:${slug}:${i}`) % (room + 1))) * 60000,
    );
    return { start, end: new Date(start.getTime() + WINDOW_MIN * 60000) };
  });
}
export type RealmStatus =
  | { open: true; closesAt: Date }
  | { open: false; opensAt: Date };
export function realmStatus(slug: string, now = new Date()): RealmStatus {
  const ws = realmWindows(slug, todayBR(now));
  const cur = ws.find((w) => now >= w.start && now < w.end);
  if (cur) return { open: true, closesAt: cur.end };
  const next = ws.find((w) => w.start > now);
  if (next) return { open: false, opensAt: next.start };
  return {
    open: false,
    opensAt: realmWindows(slug, todayBR(new Date(now.getTime() + 86400000)))[0]
      .start,
  }; // já passaram todas de hoje: primeira de amanhã
}
