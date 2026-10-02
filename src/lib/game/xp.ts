// ~90 batalhas por nível contra monstros do mesmo nível => 199 × 90 ≈ 17.900 batalhas ≈ 120 dias × 150 batalhas/dia
export const MAX_LEVEL = 200, BATTLES_PER_LEVEL = 90, BATTLES_PER_DAY = 150;
const G = 1.045, K = 10 * BATTLES_PER_LEVEL;
export const xpToNext = (lv: number) => Math.round(K * G ** (lv - 1));
export const monsterXp = (lv: number) => Math.round(10 * G ** (lv - 1));
export const totalXpToMax = () => Array.from({ length: MAX_LEVEL - 1 }, (_, i) => xpToNext(i + 1)).reduce((a, b) => a + b, 0);
export const estimatedDays = () => ((MAX_LEVEL - 1) * BATTLES_PER_LEVEL) / BATTLES_PER_DAY;
export function applyXp(level: number, xp: number, gain: number) {
  xp += gain; let up = 0;
  while (level < MAX_LEVEL && xp >= xpToNext(level)) { xp -= xpToNext(level); level++; up++; }
  return { level, xp: level >= MAX_LEVEL ? 0 : xp, levelsGained: up };
}
