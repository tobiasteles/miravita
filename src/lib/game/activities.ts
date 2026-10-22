// ───── ATIVIDADES OPCIONAIS (funcionam mesmo com o Reino fechado) ─────
// 1. EXPEDIÇÕES: mande o personagem explorar o mapa atual e volte depois (rende ~80% do que as mesmas lutas dariam, sem você jogar).
// 2. ESCAVAÇÃO: sonde veios de minério (12 cargas, +1 a cada 5 min). Cada sonda é sorteada no servidor.
// 3. LABORATÓRIO: transmutação (5 elementos → 1 mais raro) e compostos que viram poções/pedras. O Elemental rende +50%.
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
// compostos: entradas [Z, quantidade] → saída
export type Recipe = { id: string; n: string; inp: [number, number][]; out: { cons: "hp" | "ea" | "tp"; n: number }; d: string };
export const RECIPES: Recipe[] = [
  { id: "agua", n: "Água Purificada (H₂O)", inp: [[1, 2], [8, 1]], out: { cons: "hp", n: 3 }, d: "3× Poção de HP" },
  { id: "sal", n: "Sal Revigorante (NaCl)", inp: [[11, 1], [17, 1]], out: { cons: "ea", n: 3 }, d: "3× Poção de EA" },
  { id: "quartzo", n: "Cristal de Quartzo (SiO₂)", inp: [[14, 1], [8, 2]], out: { cons: "tp", n: 1 }, d: "1× Pedra de Teletransporte" },
];
