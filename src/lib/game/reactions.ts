// ───── LABORATÓRIO DE VERDADE: reações balanceadas, experimentos e acidentes (dados + regras puras; sem banco) ─────
// Convenção: 1 unidade de elemento no inventário = 1 átomo do jogo. Gás diatômico (H₂, O₂, N₂, Cl₂) gasta 2 unidades do elemento.
// Equação em texto: "2 H2 + O2 -> 2 H2O". Sufixo "^" no produto = gás liberado (não vai para o inventário). `cat` = catalisador: precisa estar
// presente, mas não é consumido. O teste confere que TODA reação conserva átomos.
import { ELEMENTS } from "./elements";

export type Cond = "none" | "heat" | "spark" | "catalyst" | "light";
export type Term = { coef: number; sp: string; gas: boolean }; // sp = espécie como escrita ("H2", "NaCl", "Na")
export type Reaction = { id: string; eq: string; cond: Cond; start?: boolean; cat?: string };
export type Parsed = Reaction & { left: Term[]; right: Term[] };

export const SYMBOLS: Set<string> = new Set(ELEMENTS.map((e) => e[1]));
const DIATOMIC = new Set(["H", "N", "O", "F", "Cl", "Br", "I"]);
// "H2" → elemento "H" (2 átomos); "Na" → elemento "Na" (1); "NaCl" → composto
export function elementOf(sp: string): { sym: string; atoms: number } | null {
  const m = /^([A-Z][a-z]?)(2?)$/.exec(sp);
  if (!m || !SYMBOLS.has(m[1])) return null;
  if (m[2] && !DIATOMIC.has(m[1])) return null;
  return { sym: m[1], atoms: m[2] ? 2 : 1 };
}
// espécie normalizada para comparar misturas ("O2" e "O" são o mesmo reagente: o elemento oxigênio)
export const norm = (sp: string) => elementOf(sp)?.sym ?? sp;

export function atoms(f: string): Record<string, number> {
  const st: Record<string, number>[] = [{}];
  let i = 0;
  const num = () => { let s = ""; while (i < f.length && /\d/.test(f[i])) s += f[i++]; return s ? Number(s) : 1; };
  while (i < f.length) {
    const ch = f[i];
    if (ch === "(") { st.push({}); i++; }
    else if (ch === ")") { i++; const m = num(), top = st.pop()!, up = st[st.length - 1]; for (const [k, v] of Object.entries(top)) up[k] = (up[k] ?? 0) + v * m; }
    else if (/[A-Z]/.test(ch)) { let s = ch; i++; while (i < f.length && /[a-z]/.test(f[i])) s += f[i++]; const n = num(), t = st[st.length - 1]; t[s] = (t[s] ?? 0) + n; }
    else throw new Error(`fórmula inválida: ${f}`);
  }
  return st[0];
}
const term = (t: string): Term => { const m = /^(\d+)?\s*(\S+?)(\^?)$/.exec(t.trim()); if (!m) throw new Error(`termo inválido: ${t}`); return { coef: m[1] ? Number(m[1]) : 1, sp: m[2], gas: m[3] === "^" }; };
export const parse = (r: Reaction): Parsed => { const [l, rr] = r.eq.split("->"); return { ...r, left: l.split(" + ").map(term), right: rr.split(" + ").map(term) }; };
export function totals(side: Term[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of side) for (const [k, v] of Object.entries(atoms(t.sp))) out[k] = (out[k] ?? 0) + v * t.coef;
  return out;
}
export const balanced = (p: Parsed) => { const a = totals(p.left), b = totals(p.right), ks = new Set([...Object.keys(a), ...Object.keys(b)]); return [...ks].every((k) => (a[k] ?? 0) === (b[k] ?? 0)); };

// 26 reações reais. start = já está no Caderno; o resto se descobre por experimento (ou missão)
export const REACTIONS: Reaction[] = [
  { id: "agua", eq: "2 H2 + O2 -> 2 H2O", cond: "spark", start: true },
  { id: "sal", eq: "2 Na + Cl2 -> 2 NaCl", cond: "heat", start: true },
  { id: "quartzo", eq: "Si + O2 -> SiO2", cond: "heat", start: true },
  { id: "co2", eq: "C + O2 -> CO2", cond: "heat", start: true },
  { id: "hcl", eq: "H2 + Cl2 -> 2 HCl", cond: "light" },
  { id: "naoh", eq: "2 Na + 2 H2O -> 2 NaOH + H2^", cond: "none" },
  { id: "koh", eq: "2 K + 2 H2O -> 2 KOH + H2^", cond: "none" },
  { id: "amonia", eq: "N2 + 3 H2 -> 2 NH3", cond: "catalyst" },
  { id: "so2", eq: "S + O2 -> SO2", cond: "heat" },
  { id: "h2so4", eq: "2 SO2 + O2 + 2 H2O -> 2 H2SO4", cond: "catalyst" },
  { id: "bao2", eq: "Ba + O2 -> BaO2", cond: "heat" },
  { id: "h2o2", eq: "BaO2 + H2SO4 -> BaSO4 + H2O2", cond: "none" },
  { id: "hno3", eq: "NH3 + 2 O2 -> HNO3 + H2O", cond: "catalyst" },
  { id: "kno3", eq: "KOH + HNO3 -> KNO3 + H2O", cond: "none" },
  { id: "neutral", eq: "NaOH + HCl -> NaCl + H2O", cond: "none" },
  { id: "glicose", eq: "6 CO2 + 6 H2O -> C6H12O6 + 6 O2^", cond: "light" },
  { id: "etanol", eq: "C6H12O6 -> 2 C2H5OH + 2 CO2^", cond: "none" },
  { id: "carbono", eq: "C6H12O6 -> 6 C + 6 H2O", cond: "none", cat: "H2SO4" }, // o ácido desidrata o açúcar (insumo de forja: carbono)
  { id: "metano", eq: "C + 2 H2 -> CH4", cond: "catalyst" },
  { id: "cao", eq: "2 Ca + O2 -> 2 CaO", cond: "heat" },
  { id: "caoh2", eq: "CaO + H2O -> Ca(OH)2", cond: "none" },
  { id: "caco3", eq: "CaO + CO2 -> CaCO3", cond: "none" },
  { id: "na2co3", eq: "2 NaOH + CO2 -> Na2CO3 + H2O", cond: "none" },
  { id: "vidro", eq: "SiO2 + Na2CO3 -> Na2SiO3 + CO2^", cond: "heat" }, // vidro (silicato de sódio): insumo de forja e de venda
  { id: "ferrugem", eq: "4 Fe + 3 O2 -> 2 Fe2O3", cond: "none" },
  { id: "termita", eq: "Fe2O3 + 2 Al -> 2 Fe + Al2O3", cond: "spark" },
  // usos dos tóxicos: pigmento (cádmio), fertilizante (nitrogenado) e pesticida (calda bordalesa, de cobre)
  { id: "cds", eq: "Cd + S -> CdS", cond: "heat" },
  { id: "sulfamon", eq: "2 NH3 + H2SO4 -> (NH4)2SO4", cond: "none" },
  { id: "cuso4", eq: "Cu + 2 H2SO4 -> CuSO4 + SO2^ + 2 H2O", cond: "heat" },
];
export const PARSED: Parsed[] = REACTIONS.map(parse);
export const BY_ID = new Map(PARSED.map((r) => [r.id, r]));
export const STARTERS = REACTIONS.filter((r) => r.start).map((r) => r.id);

// espécies de entrada da mistura (reagentes + catalisador), normalizadas
export const mixKey = (species: string[]) => [...new Set(species.map(norm))].sort().join("|");
export const reactionKey = (p: Parsed) => mixKey([...p.left.map((t) => t.sp), ...(p.cat ? [p.cat] : [])]);
const BY_MIX = new Map(PARSED.map((p) => [reactionKey(p), p]));
export const findReaction = (species: string[]) => BY_MIX.get(mixKey(species)) ?? null;

// o que a reação gasta: elementos (em átomos) e compostos (em unidades); o catalisador só precisa existir
export type Need = { el: number | null; sym: string; sp: string; q: number };
const Z_OF = new Map(ELEMENTS.map((e) => [e[1], e[0]]));
export function needs(p: Parsed): Need[] {
  return p.left.map((t) => { const e = elementOf(t.sp); return e ? { el: Z_OF.get(e.sym)!, sym: e.sym, sp: t.sp, q: t.coef * e.atoms } : { el: null, sym: t.sp, sp: t.sp, q: t.coef }; });
}
export type Gain = Need & { gas: boolean };
export function yields(p: Parsed): Gain[] {
  return p.right.map((t) => { const e = elementOf(t.sp); return e ? { el: Z_OF.get(e.sym)!, sym: e.sym, sp: t.sp, q: t.coef * e.atoms, gas: t.gas } : { el: null, sym: t.sp, sp: t.sp, q: t.coef, gas: t.gas }; });
}

// acidentes: misturas perigosas SEM produto útil. Perde 1 unidade de cada reagente e um pouco de HP; a tela explica a química.
export type Danger = { mix: string[]; why: string; hp: number }; // hp = fração do HP atual
export const DANGERS: Danger[] = [
  ...["Na", "K"].flatMap((m) => ["HCl", "H2SO4"].map((a) => ({ mix: [m, a], why: "chem.d.alkaliAcid", hp: 0.1 }))),
  { mix: ["NH3", "HNO3"], why: "chem.d.ammoniumNitrate", hp: 0.1 },
  { mix: ["C2H5OH", "HNO3"], why: "chem.d.nitration", hp: 0.12 },
  { mix: ["H2O2", "C2H5OH"], why: "chem.d.peroxideAlcohol", hp: 0.1 },
  { mix: ["Al", "NaOH"], why: "chem.d.alAlkali", hp: 0.08 },
  { mix: ["H2SO4", "H2O"], why: "chem.d.dilution", hp: 0.05 },
  { mix: ["Cl", "NH3"], why: "chem.d.chloramine", hp: 0.1 },
  { mix: ["KNO3", "S"], why: "chem.d.gunpowder", hp: 0.08 },
  { mix: ["KNO3", "C"], why: "chem.d.gunpowder", hp: 0.08 },
];
const BY_DANGER = new Map(DANGERS.map((d) => [mixKey(d.mix), d]));
export const findDanger = (species: string[]) => BY_DANGER.get(mixKey(species)) ?? null;

// ───── nomes e usos dos compostos ─────
export const COMPOUND_PT: Record<string, string> = {
  H2O: "Água", NaCl: "Cloreto de Sódio", SiO2: "Dióxido de Silício (Quartzo)", CO2: "Dióxido de Carbono", HCl: "Ácido Clorídrico", NaOH: "Hidróxido de Sódio",
  KOH: "Hidróxido de Potássio", NH3: "Amônia", SO2: "Dióxido de Enxofre", H2SO4: "Ácido Sulfúrico", BaO2: "Peróxido de Bário", H2O2: "Peróxido de Hidrogênio",
  BaSO4: "Sulfato de Bário", HNO3: "Ácido Nítrico", KNO3: "Nitrato de Potássio (Salitre)", C6H12O6: "Glicose", C2H5OH: "Etanol", CH4: "Metano",
  CaO: "Óxido de Cálcio (Cal Virgem)", "Ca(OH)2": "Hidróxido de Cálcio", CaCO3: "Carbonato de Cálcio", Na2CO3: "Carbonato de Sódio", Na2SiO3: "Vidro (Silicato de Sódio)",
  Fe2O3: "Óxido de Ferro (Ferrugem)", Al2O3: "Alumina",
  CdS: "Sulfeto de Cádmio (Pigmento Amarelo)", "(NH4)2SO4": "Sulfato de Amônio (Fertilizante)", CuSO4: "Sulfato de Cobre (Calda Bordalesa)",
};
// compostos que viram consumíveis (preparar): [consumível, quantidade por unidade]. Os 3 primeiros mantêm a economia das receitas antigas.
export const USES: Record<string, { cons: "hp" | "ea" | "tp"; n: number }> = { H2O: { cons: "hp", n: 3 }, NaCl: { cons: "ea", n: 3 }, SiO2: { cons: "tp", n: 1 }, H2O2: { cons: "hp", n: 2 }, NH3: { cons: "ea", n: 2 } };
// valor de venda por unidade: cresce com o número de átomos e de elementos diferentes
export const compoundValue = (f: string) => { const a = atoms(f), n = Object.values(a).reduce((s, v) => s + v, 0); return Math.round((n * 8 + Object.keys(a).length * 6) / 2); };

const SUB = "₀₁₂₃₄₅₆₇₈₉";
export const pretty = (f: string) => f.replace(/([A-Za-z)])(\d+)/g, (_, a: string, d: string) => a + d.replace(/\d/g, (x) => SUB[+x]));
// equação para a tela: "2 H₂ + O₂ → 2 H₂O"
export function equation(p: Parsed) {
  const s = (ts: Term[]) => ts.map((t) => `${t.coef > 1 ? t.coef + " " : ""}${pretty(t.sp)}${t.gas ? "↑" : ""}`).join(" + ");
  return `${s(p.left)} → ${s(p.right)}`;
}
// todo composto citado nas reações (para checar nomes e usos)
export const COMPOUNDS = [...new Set(PARSED.flatMap((p) => [...p.left, ...p.right].map((t) => t.sp)).filter((sp) => !elementOf(sp)))];
