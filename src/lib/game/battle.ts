import { monsterXp } from "./xp";
export type Stats = { hp: number; mp: number; atk: number; def: number; crit: number };
export type Mon = { n: string; L: number; hp: number; mx: number; atk: number; def: number; xp: number; boss: boolean };
export type BState = { e: Mon; q: Mon[]; wave: number; dungeon: boolean; mapSlug: string; buf: number; cu: number; sv: { n: string; p: number; t: number } | null; log: string[]; over: null | "wave" | "win" | "lose" | "flee"; res: string[] };
export type Act = { a: "skill"; i: number; m: number } | { a: "summon"; i: number } | { a: "potion" } | { a: "flee" };
type Sk = { n: string; p: number; c: number; t: "d" | "b" | "c"; cr?: number };
export const SKILLS: Record<string, Sk[]> = {
  exatas: [{ n: "Corte Cinético", p: 1, c: 0, t: "d" }, { n: "Vetor Afiado", p: 1.6, c: 10, t: "d" }, { n: "Colapso Quântico", p: 2.6, c: 25, t: "d", cr: 1 }],
  humanas: [{ n: "Golpe de Tomo", p: 1, c: 0, t: "d" }, { n: "Relíquia Ancestral", p: 1.7, c: 12, t: "d" }],
  linguagens: [{ n: "Verso Cortante", p: 1, c: 0, t: "d" }, { n: "Oratória (+ATK)", p: 0, c: 15, t: "b" }, { n: "Maldição Semântica", p: .8, c: 18, t: "c" }, { n: "Tempestade de Palavras", p: 2.2, c: 28, t: "d" }],
};
export const SUMMONS = [{ n: "Sócrates", p: .7, c: 20 }, { n: "Cleópatra", p: 1, c: 35 }, { n: "Napoleão", p: 1.5, c: 55 }];
const rf = (a: number, b: number) => a + Math.random() * (b - a);
export function mkMon(names: string[], min: number, boss: boolean): Mon {
  const L = Math.min(200, min + Math.floor(Math.random() * 10) + (boss ? 5 : 0)), hp = Math.round((40 + 10 * L ** 1.3) * (boss ? 4 : 1));
  return { n: (boss ? "👑 " : "") + names[Math.floor(Math.random() * names.length)], L, hp, mx: hp, atk: Math.round((5 + 3.5 * L) * (boss ? 1.5 : 1)), def: Math.round(2 + .5 * L), xp: monsterXp(L) * (boss ? 6 : 1), boss };
}
type Base = Record<"hp" | "mp" | "atk" | "def" | "crit", number>;
export function playerStats(base: Base, per: Base, level: number, bonuses: Partial<Base>[], wepAtk: number, armDef: number): Stats {
  const s: Base = { hp: 0, mp: 0, atk: 0, def: 0, crit: base.crit };
  (["hp", "mp", "atk", "def"] as const).forEach((k) => (s[k] = base[k] + per[k] * (level - 1)));
  bonuses.forEach((b) => (Object.keys(b) as (keyof Base)[]).forEach((k) => (s[k] = k === "crit" ? s[k] + b[k]! : s[k] * (1 + b[k]!))));
  s.atk += wepAtk; s.def += armDef;
  return { hp: Math.round(s.hp), mp: Math.round(s.mp), atk: Math.round(s.atk), def: Math.round(s.def), crit: Math.round(s.crit) };
}
const L = (b: BState, t: string) => { b.log.push(t); if (b.log.length > 6) b.log.shift(); };
export function step(b: BState, p: { hp: number; mp: number; gold: number; lv: number }, q: Stats, cls: string, act: Act) {
  if (b.over) return; const e = b.e;
  const fin = () => { if (e.hp <= 0) { b.over = b.q.length ? "wave" : "win"; return true; } return false; };
  if (act.a === "skill") {
    const s = SKILLS[cls]?.[act.i]; if (!s || p.mp < s.c) return L(b, "MP insuficiente.");
    const m = Math.min(2, Math.max(1, act.m)); p.mp -= s.c;
    if (s.t === "b") { b.buf = 3; L(b, "Oratória! ATK ×1.5 por 3 turnos."); }
    else {
      const cr = m >= 1.99 || Math.random() * 100 < q.crit + (s.cr ? 25 : 0);
      const d = Math.round(q.atk * (b.buf > 0 ? 1.5 : 1) * s.p * m * (cr ? 1.6 : 1) * rf(.9, 1.1) * 100 / (100 + e.def)); e.hp -= d;
      if (s.t === "c") b.cu = 3;
      L(b, `${s.n}: ${d} de dano${m >= 1.99 ? " ⚡PERFEITO" : m > 1 ? " ✔ bom timing" : ""}${cr ? " 💥CRÍTICO" : ""}`);
    }
  } else if (act.a === "summon") {
    const s = SUMMONS[act.i]; if (cls !== "humanas" || !s || p.mp < s.c) return L(b, "Não foi possível invocar.");
    p.mp -= s.c; b.sv = { n: s.n, p: s.p, t: 3 }; L(b, `Você invocou ${s.n}!`);
  } else if (act.a === "potion") {
    const cost = 30 + p.lv * 5; if (p.gold < cost) return L(b, `Ouro insuficiente (${cost}g).`);
    p.gold -= cost; p.hp = Math.min(q.hp, p.hp + Math.round(q.hp * .4)); L(b, `Poção (-${cost}g): +40% HP.`);
  } else if (act.a === "flee" && Math.random() < .6) { b.over = "flee"; return L(b, "Você fugiu!"); }
  else L(b, "Falha ao fugir!");
  if (fin()) return;
  if (b.sv && b.sv.t > 0) { const d = Math.round(q.atk * b.sv.p * rf(.9, 1.1) * 100 / (100 + e.def)); e.hp -= d; b.sv.t--; L(b, `${b.sv.n} ataca: ${d}`); if (b.sv.t <= 0) b.sv = null; if (fin()) return; }
  const d = Math.round(e.atk * (b.cu > 0 ? .6 : 1) * rf(.85, 1.15) * 100 / (100 + q.def)); p.hp -= d; b.buf--; b.cu--; L(b, `${e.n} causa ${d} de dano.`);
  if (p.hp <= 0) { p.hp = 0; b.over = "lose"; }
}
