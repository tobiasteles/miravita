// ───── ATIVIDADES OPCIONAIS (funcionam mesmo com o Reino fechado) ─────
// 1. EXPEDIÇÕES: mande o personagem explorar o mapa atual e volte depois (rende ~80% do que as mesmas lutas dariam, sem você jogar).
// 2. ESCAVAÇÃO: sonde veios de minério (12 cargas, +1 a cada 5 min). Cada sonda é sorteada no servidor.
// 3. LABORATÓRIO: transmutação (5 elementos → 1 mais raro); as reações reais e os compostos estão em reactions.ts (actions/lab.ts). O Elemental rende +50%.
export const EXP = [
  { n: "Patrulha", min: 15, kills: 4 },
  { n: "Expedição", min: 60, kills: 18 },
  { n: "Jornada longa", min: 240, kills: 80 },
  { n: "Grande expedição", min: 480, kills: 170 },
] as const;
export const DIG_MAX = 12;
export const DIG_EVERY_MS = 5 * 60_000;
export const chargesNow = (d: { charges: number; at: number } | undefined, now = Date.now()) => {
  if (!d) return { charges: DIG_MAX, at: now };
  const gained = Math.floor((now - d.at) / DIG_EVERY_MS), c = Math.min(DIG_MAX, d.charges + gained);
  return { charges: c, at: c >= DIG_MAX ? now : d.at + gained * DIG_EVERY_MS };
};
