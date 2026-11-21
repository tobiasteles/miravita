// ───── FABRICAÇÃO COM SENTIDO: quem pode virar equipamento e quais status saem das propriedades reais ─────
// Regras (valem no SERVIDOR para Forja, loja e recompensas):
//   Elemento só fabrica arma/armadura se for SÓLIDO a 25 °C, ESTÁVEL (sem radioatividade), SEGURO (toxicidade ≤ 1), pouco reativo (≤ 1),
//   duro o bastante (Mohs ≥ 2,5), com fusão ≥ 400 °C e não for metaloide frágil. Gases, líquidos, halogênios, alcalinos, radioativos e tóxicos ficam de fora.
//   Ligas reais (aço, bronze, latão, inox, duralumínio) e a cerâmica de alumina são "materiais" próprios, com propriedades de liga.
// Fórmulas (determinísticas; calibradas para o Ferro dar status parecidos com os de antes):
//   atk        = round(1,5·score + 2,2·mohs + 0,15·densidade)             dureza → dano
//   def        = round(1,4·score + 1,2·mohs + 0,9·densidade)              dureza e densidade → defesa
//   durability = round(40 + 14·mohs + 3·densidade + fusão/100)            dureza → durabilidade (× 0,6 se frágil)
//   weight     = round(1,2·densidade)                                     densidade → peso (informativo: não muda o combate ainda)
//   mp         = round(2·√condutividade)                                  condutividade → afinidade com energia/magia (+ EA)
//   fire       = min(30, round(fusão/100))  (% de resistência ao fogo)    ponto de fusão → resistência ao fogo (informativo por enquanto)
//   score/raridade/valor = computeItem(): escassez (abundância), dureza, massa e radioatividade → tier, nível mínimo da loja e custo
import { ELEMENT_BY_Z, type El } from "./elements";
import { computeWeapon, computeEquip, type EquipStats, type SlotKey, type WeaponKind } from "./equipment";
import { computeItem, type Rarity } from "./item-stats";
import { MAT_ROWS, type MatRow, type State } from "./materials-data";

export type Props = { z: number; state: State; density: number; meltC: number; cond: number; react: number; tox: number; halfLife: number };
const PROPS = new Map<number, Props>(MAT_ROWS.map(([z, state, density, meltC, cond, react, tox, halfLife]) => [z, { z, state, density, meltC, cond, react, tox, halfLife }]));
export const props = (z: number): Props | undefined => PROPS.get(z);
export const isRadioactive = (z: number) => (props(z)?.halfLife ?? 0) > 0;
export const isToxic = (z: number) => (props(z)?.tox ?? 0) >= 2;

export type Why = "unknown" | "gas" | "liquid" | "radioactive" | "toxic" | "reactive" | "soft" | "lowMelt" | "brittle";
export function craftCheck(z: number): { ok: true } | { ok: false; why: Why } {
  const p = props(z), e = ELEMENT_BY_Z.get(z);
  if (!p || !e) return { ok: false, why: "unknown" };
  if (p.halfLife > 0) return { ok: false, why: "radioactive" };
  if (p.state === "g") return { ok: false, why: "gas" };
  if (p.state === "l") return { ok: false, why: "liquid" };
  if (p.tox >= 2) return { ok: false, why: "toxic" };
  if (p.react >= 2) return { ok: false, why: "reactive" };
  if (e[6] === "metaloide") return { ok: false, why: "brittle" };
  if (e[6] === "lantanídeo") return { ok: false, why: "reactive" }; // terras-raras: oxidam depressa e são moles demais para uma peça
  if ((e[4] ?? 0.5) < 2.5) return { ok: false, why: "soft" };
  if (p.meltC < 400) return { ok: false, why: "lowMelt" };
  return { ok: true };
}
export const canCraft = (z: number) => craftCheck(z).ok;
export const CRAFTABLE_Z = [...PROPS.keys()].filter(canCraft).sort((a, b) => a - b);

// ligas e cerâmica: entradas [Z, quantidade] (5 unidades no total, como a Forja de elemento puro)
export type Alloy = { id: string; z: number; inp: [number, number][]; mohs: number; density: number; meltC: number; cond: number; brittle?: boolean; noWeapon?: boolean; bonus: number };
export const ALLOYS: Alloy[] = [
  { id: "aco", z: 26, inp: [[26, 4], [6, 1]], mohs: 5.5, density: 7.85, meltC: 1450, cond: 6, bonus: 1.5 },
  { id: "bronze", z: 29, inp: [[29, 4], [50, 1]], mohs: 3.5, density: 8.8, meltC: 950, cond: 7, bonus: 1.2 },
  { id: "latao", z: 29, inp: [[29, 3], [30, 2]], mohs: 3.2, density: 8.5, meltC: 930, cond: 15, bonus: 1.2 },
  { id: "inox", z: 26, inp: [[26, 3], [24, 1], [28, 1]], mohs: 5.5, density: 8, meltC: 1450, cond: 1.4, bonus: 2 },
  { id: "dural", z: 13, inp: [[13, 4], [29, 1]], mohs: 4, density: 2.8, meltC: 640, cond: 20, bonus: 1.8 },
  { id: "ceramica", z: 13, inp: [[13, 2], [8, 3]], mohs: 9, density: 3.95, meltC: 2072, cond: 0, brittle: true, noWeapon: true, bonus: 2.5 }, // alumina (Al₂O₃)
];
export const ALLOY_PT: Record<string, string> = { aco: "Aço", bronze: "Bronze", latao: "Latão", inox: "Aço Inoxidável", dural: "Duralumínio", ceramica: "Cerâmica de Alumina" }; // nome gravado no item (português)
export const ALLOY_BY_ID = new Map(ALLOYS.map((a) => [a.id, a]));

// material de fabricação: "e:26" (elemento puro) ou "a:aco" (liga)
export type Mat = { id: string; z: number; alloy: Alloy | null; mohs: number; density: number; meltC: number; cond: number; brittle: boolean; noWeapon: boolean; score: number; rarity: Rarity; value: number; inp: [number, number][] };
export function material(id: string): Mat | null {
  if (id.startsWith("a:")) {
    const a = ALLOY_BY_ID.get(id.slice(2));
    if (!a) return null;
    const parts = a.inp.map(([z, q]) => ({ q, c: computeItem(toEl(z)!) })), total = parts.reduce((s, p) => s + p.q, 0);
    const score = parts.reduce((s, p) => s + p.c.score * p.q, 0) / total + a.bonus; // liga = média ponderada dos ingredientes + bônus de liga
    return { id, z: a.z, alloy: a, mohs: a.mohs, density: a.density, meltC: a.meltC, cond: a.cond, brittle: !!a.brittle, noWeapon: !!a.noWeapon, ...rate(score), inp: a.inp };
  }
  const z = Number(id.replace(/^e:/, "")), p = props(z), e = toEl(z);
  if (!p || !e || !canCraft(z)) return null;
  const c = computeItem(e);
  return { id: `e:${z}`, z, alloy: null, mohs: e.mohsHardness ?? 0.5, density: p.density, meltC: p.meltC, cond: p.cond, brittle: false, noWeapon: false, score: c.score, rarity: c.rarity, value: c.value, inp: [[z, 5]] };
}
const toEl = (z: number) => { const e: El | undefined = ELEMENT_BY_Z.get(z); return e ? { atomicNumber: e[0], atomicMass: e[3], mohsHardness: e[4], crustalAbundancePpm: e[5] } : null; };
const rate = (score: number) => ({ score, rarity: (score < 4.5 ? "comum" : score < 10.6 ? "raro" : score < 15 ? "epico" : "lendario") as Rarity, value: Math.round(score * score * 10) });

export type Crafted = EquipStats & { weight: number; fire: number };
// status da peça: parte das propriedades, passa pela conversão por slot que o jogo já usa (computeEquip/computeWeapon) e soma peso, afinidade e fogo
export function craftStats(m: Mat, slot: SlotKey, weapon?: WeaponKind): Crafted {
  const atk = Math.round(1.5 * m.score + 2.2 * m.mohs + 0.15 * m.density), def = Math.round(1.4 * m.score + 1.2 * m.mohs + 0.9 * m.density);
  const durability = Math.round((40 + 14 * m.mohs + 3 * m.density + m.meltC / 100) * (m.brittle ? 0.6 : 1));
  const base = { atk, def, durability, score: m.score };
  const st: EquipStats = weapon ? computeWeapon(weapon, base) : computeEquip(slot, base);
  const aff = Math.round(2 * Math.sqrt(m.cond));
  if (aff) st.mp = (st.mp ?? 0) + aff;
  return { ...st, weight: Math.round(1.2 * m.density), fire: Math.min(30, Math.round(m.meltC / 100)) };
}
// recompensas antigas podem pedir um elemento que não fabrica: usa o fabricável de raridade mais próxima (nunca falha)
export function nearestCraftable(z: number): number {
  if (canCraft(z)) return z;
  const e = toEl(z), want = e ? computeItem(e).score : 0;
  let best = 26, d = Infinity;
  for (const c of CRAFTABLE_Z) { const s = computeItem(toEl(c)!).score, dd = Math.abs(s - want); if (dd < d) { d = dd; best = c; } }
  return best;
}
