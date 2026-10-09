// ───── CURVA DE XP: começa muito fácil e fica exponencialmente mais difícil ─────
// Ajuste aqui: B0 = batalhas para sair do nível 1 · TARGET_DAYS = dias de jogo ativo (150 batalhas/dia) até o nível 200.
export const MAX_LEVEL = 200,
  BATTLES_PER_DAY = 150;
const B0 = 3,
  TARGET_DAYS = 120,
  G = 1.045; // G: o XP de cada monstro cresce 4,5% por nível
const TOTAL_BATTLES = BATTLES_PER_DAY * TARGET_DAYS;

// R = o quanto cada nível fica mais difícil que o anterior (calculado para a soma bater com TARGET_DAYS)
const R = (() => {
  let lo = 1.0001,
    hi = 1.2;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    (B0 * (m ** (MAX_LEVEL - 1) - 1)) / (m - 1) > TOTAL_BATTLES
      ? (hi = m)
      : (lo = m);
  }
  return (lo + hi) / 2;
})();

// batalhas (contra monstros do mesmo nível) para subir do nível `lv` para o seguinte
export const battlesFor = (lv: number) => B0 * R ** (lv - 1);
export const monsterXp = (lv: number) => Math.round(10 * G ** (lv - 1));
export const xpToNext = (lv: number) =>
  Math.max(10, Math.round(battlesFor(lv) * monsterXp(lv)));
export const totalXpToMax = () =>
  Array.from({ length: MAX_LEVEL - 1 }, (_, i) => xpToNext(i + 1)).reduce(
    (a, b) => a + b,
    0,
  );
export const estimatedDays = () =>
  Array.from({ length: MAX_LEVEL - 1 }, (_, i) => battlesFor(i + 1)).reduce(
    (a, b) => a + b,
    0,
  ) / BATTLES_PER_DAY;
export function applyXp(level: number, xp: number, gain: number) {
  xp += gain;
  let up = 0;
  while (level < MAX_LEVEL && xp >= xpToNext(level)) {
    xp -= xpToNext(level);
    level++;
    up++;
  }
  return { level, xp: level >= MAX_LEVEL ? 0 : xp, levelsGained: up };
}
