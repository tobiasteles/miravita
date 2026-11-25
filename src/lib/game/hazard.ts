// ───── RADIOATIVOS E TÓXICOS: exposição, contenção e decaimento (regras puras; o banco fica em lib/hazard.ts) ─────
// Carregar elemento perigoso FORA da Contenção acumula "dose" (0–100) com o tempo; a dose reduz o HP e a EA máximos (no máximo −30%)
// e some sozinha quando a carga acaba. Tudo é calculado de forma preguiçosa a partir de timestamps (sem cron por jogador).
import { props } from "./materials";

export const OUT_LIMIT = 30; // unidades perigosas que cabem comigo; o excesso vai para a Contenção (contra abuso)
export const CONT_LIMIT = 500; // total guardado na Contenção
export const GAIN = 0.5, MAX_GAIN = 40, RECOVER = 10, MAX_PEN = 0.3; // dose por hora (ganho, teto do ganho, recuperação) e teto da penalidade

export const isRadioactive = (z: number) => (props(z)?.halfLife ?? 0) > 0;
export const isHazardous = (z: number) => { const p = props(z); return !!p && (p.halfLife > 0 || p.tox >= 2); };
export const HAZ_Z = Array.from({ length: 118 }, (_, i) => i + 1).filter(isHazardous);

// taxa de exposição por unidade/hora: radioativo = quanto mais curta a meia-vida, pior; tóxico = pela toxicidade
export function rate(z: number): { kind: "rad" | "tox"; r: number } | null {
  const p = props(z);
  if (!p) return null;
  if (p.halfLife > 0) return { kind: "rad", r: p.halfLife > 1e6 ? 0.3 : p.halfLife > 1e3 ? 0.8 : p.halfLife > 1 ? 1.6 : 3 };
  if (p.tox >= 2) return { kind: "tox", r: p.tox >= 3 ? 1 : 0.5 };
  return null;
}
// meia-vida "em escala de jogo" (horas reais): cresce devagar com a meia-vida real, entre 6 h e 14 dias
export const gameHalfLifeHours = (z: number) => { const y = props(z)?.halfLife ?? 0; return y > 0 ? Math.min(336, Math.max(6, 24 * (1 + Math.log10(1 + y)))) : Infinity; };

// filho real do decaimento do isótopo mais estável (α reduz Z em 2; β⁻ aumenta 1; captura eletrônica reduz 1)
export const DAUGHTER: Record<number, number> = {
  43: 44, 61: 62, 84: 82, 85: 83, 86: 84, 87: 88, 88: 86, 89: 90, 90: 88, 91: 89, 92: 90, 93: 91, 94: 92, 95: 93, 96: 94, 97: 95, 98: 96, 99: 97,
  100: 98, 101: 99, 102: 100, 103: 101, 104: 102, 105: 103, 106: 104, 107: 105, 108: 106, 109: 107, 110: 108, 111: 109, 112: 110, 113: 111, 114: 112, 115: 113, 116: 114, 117: 115, 118: 116,
};

export type Hz = { at: number; da: number; dose: number; load: { rad: number; tox: number }; prot: { rad: number; tox: number } };
// carga ponderada do que está comigo (acima do limite, conta só até OUT_LIMIT)
export function loadOf(held: { z: number; qty: number }[]) {
  const total = held.reduce((s, h) => s + (isHazardous(h.z) ? h.qty : 0), 0), k = total > OUT_LIMIT ? OUT_LIMIT / total : 1, out = { rad: 0, tox: 0 };
  for (const h of held) { const r = rate(h.z); if (r) out[r.kind] += h.qty * r.r * k; }
  return out;
}
// proteção: recipiente de chumbo (−60% da radiação), EPI (−60% do tóxico e −20% da radiação)
export const protOf = (lead: boolean, epi: boolean) => ({ rad: 1 - (lead ? 0.4 : 1) * (epi ? 0.8 : 1), tox: epi ? 0.6 : 0 });
export function doseNow(hz: Hz | null | undefined, now = Date.now()) {
  if (!hz) return 0;
  const h = Math.max(0, (now - hz.at) / 3.6e6), gain = Math.min(MAX_GAIN, GAIN * (hz.load.rad * (1 - hz.prot.rad) + hz.load.tox * (1 - hz.prot.tox)));
  return Math.min(100, Math.max(0, hz.dose + (gain > 0 ? gain : -RECOVER) * h));
}
export const penalty = (dose: number) => Math.min(MAX_PEN, dose * 0.003);

// o que se fabrica na Contenção/laboratório: [Z, qtd] de elemento + compostos
export const GEAR: Record<string, { name: string; inp: [number, number][]; cmp: [string, number][]; once: boolean }> = {
  lead: { name: "Recipiente de Chumbo", inp: [[82, 8]], cmp: [], once: true },
  epi: { name: "EPI (máscara e luvas)", inp: [[6, 6]], cmp: [["Na2SiO3", 1]], once: true },
  antidote: { name: "Antídoto", inp: [[6, 3]], cmp: [["H2O", 1]], once: false },
};
// usos da radioatividade: consumível que sai por elemento radioativo gasto
export const RADIO: Record<string, { inp: [number, number][]; cons: "hp" | "ea"; n: number }> = {
  cell: { inp: [[92, 2]], cons: "ea", n: 4 }, // célula de energia de urânio
  cellTh: { inp: [[90, 3]], cons: "ea", n: 4 }, // célula de tório
  isoTc: { inp: [[43, 1]], cons: "hp", n: 3 }, // tecnécio-99m, isótopo médico
  isoRa: { inp: [[88, 1]], cons: "hp", n: 4 }, // rádio
};
