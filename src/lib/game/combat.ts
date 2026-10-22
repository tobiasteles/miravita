// ───── MOTOR DE ATRIBUTOS E STATUS (nomenclatura nova) ─────
// FOR: +2,5 Poderio Físico · +1,5 Defesa Física · +10 HP · +0,2% Tenacidade
// INT: +3,0 Poderio Arcano · +1,0 Defesa Mágica · +8 MP · +0,5 Evasão Mágica/Res. Status
// DES: +1,5 Foco · +1,5 Reflexos · +1,0 Poderio Físico · +0,1% Chance de Ruptura   (tudo arredondado PARA BAIXO)
import { CLASS_DEFS, LEGACY, type Block } from "./classes";

export const PER = {
  for: { pof: 2.5, dfF: 1.5, hp: 10, ten: 0.2 },
  int: { poa: 3.0, dfM: 1.0, mp: 8, evM: 0.5 },
  des: { foco: 1.5, refl: 1.5, pof: 1.0, rup: 0.1 },
} as const;
export const PA_MAX = 100; // Pontos de Ação (substitui a SP/Stamina): cada poder gasta PA, e +30 voltam por turno
export const PA_REGEN = 30;
export const STAT_LABEL = {
  pof: "Poderio Físico", poa: "Poderio Arcano", dfF: "Defesa Física", dfM: "Defesa Mágica", hp: "HP Máximo", mp: "MP (Energia Arcana)",
  foco: "Foco", refl: "Reflexos", rup: "Chance de Ruptura", rupD: "Dano de Ruptura", qg: "Quebra de Guarda", resF: "Ressonância Física",
  resA: "Ressonância Arcana", mit: "Mitigação", sifV: "Sifão Vital", sifE: "Sifão de Essência", reg: "Regeneração Inerente (HP)",
  regE: "Regeneração Inerente (MP)", imp: "Ímpeto de Caçador", ten: "Tenacidade", ret: "Retaliação", pen: "Penetração de Status",
  estab: "Estabilidade de Dano", evM: "Evasão Mágica / Res. Status",
} as const;

export type Gear = Partial<Record<"atk" | "def" | "hp" | "mp" | "crit" | "res" | "mit" | "sifV" | "sifE" | "foco" | "refl" | "reg" | "imp" | "ten" | "ret" | "qg" | "rupD" | "pen", number>>;
export type Fx = Partial<Record<"atk" | "crit" | "hp" | "def" | "mp" | "sv" | "res" | "mit" | "qg" | "imp" | "ten", number>>;
type Base = Record<"hp" | "mp" | "atk" | "def" | "crit", number>;
export type CStats = {
  main: "fis" | "arc";
  hp: number; mp: number; pam: number;
  pof: number; poa: number; dfF: number; dfM: number;
  foco: number; refl: number; rup: number; rupD: number; qg: number; resF: number; resA: number; mit: number;
  sifV: number; sifE: number; reg: number; regE: number; imp: number; ten: number; ret: number; pen: number; estab: number; evM: number;
  sv: number;
  // atalhos de compatibilidade (poder principal, defesa física, ruptura)
  atk: number; def: number; crit: number; ev: number;
};
// passivas de classe (somam nos status)
const PASSIVE: Record<string, Partial<CStats>> = {
  matematica: { foco: 30, rupD: 15 }, fisica: { refl: 20, sifV: 3 }, quimica: { pen: 15, mit: 3 },
  portugues: { resA: 12, mit: 6 }, ingles: { qg: 12, evM: 10, mit: 6 }, artes: { rup: 5, refl: 30, mit: 4 },
  historia: { sv: 0.15, mit: 6 }, geografia: { mit: 12, ret: 5 }, filosofia: { regE: 1.5, pen: 10, mit: 6 }, biologia: { imp: 20, sifV: 4, mit: 4 },
};
const f = Math.floor;
export function buildStats(a: {
  cls: string; base: Base; per: Base; level: number; traits: Partial<Base>[]; gear: Gear;
  at: { for: number; int: number; des: number }; fx: Fx;
}): CStats {
  const k = LEGACY[a.cls] ?? a.cls, block: Block = CLASS_DEFS[k]?.block ?? "melee", main = block === "melee" ? "fis" : "arc";
  const L = a.level, g = a.gear, at = a.at, fx = a.fx, ps = PASSIVE[k] ?? {};
  const s: Base = { hp: 0, mp: 0, atk: 0, def: 0, crit: a.base.crit };
  (["hp", "mp", "atk", "def"] as const).forEach((x) => (s[x] = a.base[x] + a.per[x] * (L - 1)));
  a.traits.forEach((b) => (Object.keys(b) as (keyof Base)[]).forEach((x) => (s[x] = x === "crit" ? s[x] + b[x]! : s[x] * (1 + b[x]!))));
  const cp = (main === "fis" ? 1 : 0.25) * s.atk, ca = (main === "arc" ? 1 : 0.25) * s.atk; // poder da classe: o principal vale 100%, o outro 25%
  const pof = (cp + f(at.for * PER.for.pof) + f(at.des * PER.des.pof) + (main === "fis" ? g.atk ?? 0 : 0)) * (main === "fis" ? 1 + (fx.atk ?? 0) : 1);
  const poa = (ca + f(at.int * PER.int.poa) + (main === "arc" ? g.atk ?? 0 : 0)) * (main === "arc" ? (1 + (fx.atk ?? 0)) * (block === "mage" ? 1.45 : 1.3) : 1); // conjuradores: +45% Poderio Arcano (invocadores +30%) para compensar a vida menor
  const hp = (s.hp + f(at.for * PER.for.hp) + (g.hp ?? 0)) * (1 + (fx.hp ?? 0)) * 1.1; // 1,1 = passiva de todos: Condicionamento Físico
  const mp = (s.mp + f(at.int * PER.int.mp) + (g.mp ?? 0)) * (1 + (fx.mp ?? 0));
  const dfF = (s.def + f(at.for * PER.for.dfF) + (g.def ?? 0)) * (1 + (fx.def ?? 0));
  const dfM = (s.def * 0.9 + f(at.int * PER.int.dfM) + (g.def ?? 0) * 0.9) * (1 + (fx.def ?? 0));
  const rup = s.crit + f(at.des * PER.des.rup * 10) / 10 + (g.crit ?? 0) + (fx.crit ?? 0) + (ps.rup ?? 0);
  const out: CStats = {
    main, hp: Math.round(hp), mp: Math.round(mp), pam: PA_MAX,
    pof: Math.round(pof), poa: Math.round(poa), dfF: Math.round(dfF), dfM: Math.round(dfM),
    foco: 20 + L + f(at.des * PER.des.foco) + (g.foco ?? 0) + (ps.foco ?? 0),
    refl: Math.round(10 + 0.8 * L) + f(at.des * PER.des.refl) + (g.refl ?? 0) + (ps.refl ?? 0),
    rup: Math.round(rup * 10) / 10, rupD: 60 + (g.rupD ?? 0) + (ps.rupD ?? 0), qg: Math.min(60, (g.qg ?? 0) + (fx.qg ?? 0) + (ps.qg ?? 0)),
    resF: (main === "fis" ? (g.res ?? 0) + (fx.res ?? 0) : 0) + (ps.resF ?? 0), resA: (main === "arc" ? (g.res ?? 0) + (fx.res ?? 0) : 0) + (ps.resA ?? 0),
    mit: Math.min(60, (g.mit ?? 0) + (fx.mit ?? 0) + (ps.mit ?? 0)),
    sifV: (g.sifV ?? 0) + (ps.sifV ?? 0), sifE: g.sifE ?? 0, reg: 0.5 + (g.reg ?? 0), regE: 1 + (ps.regE ?? 0) + (g.reg ?? 0),
    imp: (g.imp ?? 0) + (fx.imp ?? 0) + (ps.imp ?? 0), ten: Math.min(80, f(at.for * PER.for.ten * 10) / 10 + (g.ten ?? 0) + (fx.ten ?? 0)),
    ret: (g.ret ?? 0) + (ps.ret ?? 0), pen: (g.pen ?? 0) + (ps.pen ?? 0), estab: 12,
    evM: Math.min(60, f(at.int * PER.int.evM * 10) / 10 + (ps.evM ?? 0)),
    sv: (fx.sv ?? 0) + (ps.sv ?? 0),
    atk: 0, def: 0, crit: 0, ev: 3,
  };
  out.atk = main === "fis" ? out.pof : out.poa;
  out.def = out.dfF;
  out.crit = out.rup;
  return out;
}

// ───── MONSTROS: a curva de dificuldade ─────
// Sobe MUITO mais rápido que o jogador nos níveis altos (expoentes > 1). Ajuste os números aqui para mexer na dificuldade global.
export type MonKind = "mon" | "sub" | "boss";
// a defesa vale menos conforme o nível sobe: fator = K/(K+defesa), K = 60 + 14×nível do monstro (assim a defesa nunca "zera" o dano nos níveis altos)
export const defK = (L: number) => 60 + 14 * L;
export const defF = (def: number, L: number) => defK(L) / (defK(L) + Math.max(0, def));
export const monBase = (L: number) => ({
  hp: 50.0 + 9.5 * L ** 1.9,
  atk: 6.0 + 1.7 * L ** 1.24,
  def: 3 + 0.9 * L ** 1.08,
  refl: 3 + 1.2 * L,
  acc: 40 + 1.5 * L,
});
export const KIND_MUL = {
  mon: { hp: 1, atk: 1, xp: 1 },
  sub: { hp: 1.8, atk: 1.25, xp: 3 },
  boss: { hp: 3.0, atk: 1.25, xp: 8 },
} as const;
