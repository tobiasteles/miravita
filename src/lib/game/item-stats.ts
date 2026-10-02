export type Rarity = "comum" | "raro" | "epico" | "lendario";
export interface ElementProps { atomicNumber: number; atomicMass: number; mohsHardness: number | null; crustalAbundancePpm: number }
// escassez = 6 - log10(abundância ppm); radioativos (Z>=84 ou U) ganham bônus
export function computeItem(e: ElementProps) {
  const scarcity = 6 - Math.log10(e.crustalAbundancePpm), mohs = e.mohsHardness ?? 0;
  const radio = e.atomicNumber >= 84 || e.atomicNumber === 92 ? 6 : 0;
  const score = 0.7 * scarcity + 0.4 * mohs + e.atomicMass / 50 + radio;
  const rarity: Rarity = score < 4.5 ? "comum" : score < 10.6 ? "raro" : score < 15 ? "epico" : "lendario";
  return {
    score, rarity,
    atk: Math.round(score * 3 + e.atomicMass / 10),
    def: Math.round(score * 2 + mohs * 3),
    durability: Math.round(50 + mohs * 15 + e.atomicMass / 2),
    value: Math.round(score * score * 10),
  };
}
