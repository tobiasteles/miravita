import { SKILLS, SUMMONS } from "./classdata"; import { CLASS_DEFS, CLASS_KEYS, LEGACY, type Block } from "./classes";
export { SKILLS, SUMMONS };
import { monsterXp } from "./xp";
export type Stats = { hp: number; mp: number; atk: number; def: number; crit: number; sv?: number; ev?: number };
export type Mon = { n: string; L: number; hp: number; mx: number; atk: number; def: number; xp: number; boss: boolean };
export type BState = { e: Mon; q: Mon[]; wave: number; dungeon: boolean; mapSlug: string; buf: number; cu: number; sv: { n: string; p: number; t: number } | null; log: string[]; over: null | "wave" | "win" | "lose" | "flee"; res: string[]; t?: number; dom?: { t: number; n: string; p: number; foe: number; heal: number; ea: number; stun: number; self: number; k?: string } | null; domUsed?: boolean; burn?: number; dot?: { t: number; p: number } | null; ev?: number; skip?: boolean };
export type Act = { a: "domain" } | { a: "skill"; i: number; m: number } | { a: "summon"; i: number } | { a: "potion"; k: "hp" | "ea" } | { a: "flee" };
export const tierOf = (lv: number) => (lv < 50 ? "Fundamental" : lv < 120 ? "Médio" : "Superior");
export const DOMAIN_TERM = "Expansão Arcana"; // nome genérico da técnica suprema: troque aqui
export const DOMAINS: Record<string, { n: string; lv: number; p: number; foe: number; heal?: number; d: string }> = {
  exatas: { n: "Horizonte de Eventos", lv: 150, p: 3, foe: .5, d: "O espaço-tempo colapsa: dano garantido por 3 turnos e o inimigo causa só 50% do dano (gravidade)." },
  humanas: { n: "Panteão das Eras", lv: 150, p: 2.4, foe: .8, heal: .08, d: "Todas as eras respondem ao chamado: dano garantido por 3 turnos, cura 8% do HP por turno e o inimigo causa 20% menos dano." },
  linguagens: { n: "Grimório Absoluto", lv: 150, p: 2.6, foe: .4, d: "A realidade é reescrita: dano garantido por 3 turnos e o inimigo, silenciado, causa só 40% do dano." },
};
export type DomainCfg = { name: string; aspect: string; shout: string; uses: number };
type Asp = { k: string; n: string; d: string; c: string; pm: number; foe: number; heal?: number; ea?: number; stun?: number; self?: number };
// aspectos: o jogador escolhe um ao forjar a técnica suprema (risco x recompensa)
export const ASPECTS: Record<string, Asp[]> = {
  exatas: [{ k: "gravidade", n: "Gravidade", d: "o inimigo causa só 50% do dano", c: "#0891b2", pm: 1, foe: .5 }, { k: "plasma", n: "Plasma", d: "+35% de dano", c: "#f97316", pm: 1.35, foe: .8 },
    { k: "vacuo", n: "Vácuo", d: "35% de chance de paralisar o inimigo por turno", c: "#94a3b8", pm: 1.1, foe: .8, stun: .35 }, { k: "antimateria", n: "Antimatéria", d: "+70% de dano, mas você perde 8% do HP por turno", c: "#e11d48", pm: 1.7, foe: .8, self: .08 }],
  humanas: [{ k: "legiao", n: "Legião", d: "cura 8% do HP por turno", c: "#d97706", pm: 1.1, foe: .8, heal: .08 }, { k: "eclipse", n: "Eclipse", d: "30% de chance de paralisar o inimigo por turno", c: "#7c3aed", pm: 1, foe: .7, stun: .3 },
    { k: "sangue", n: "Sangue Ancestral", d: "+60% de dano, mas você perde 8% do HP por turno", c: "#be123c", pm: 1.6, foe: .8, self: .08 }, { k: "ouro", n: "Ouro Imperial", d: "recupera 15% da EA e cura 4% do HP por turno", c: "#eab308", pm: 1, foe: .8, ea: .15, heal: .04 }],
  linguagens: [{ k: "silencio", n: "Silêncio", d: "o inimigo causa só 35% do dano", c: "#6366f1", pm: 1, foe: .35 }, { k: "profecia", n: "Profecia", d: "+40% de dano e 20% de paralisar o inimigo", c: "#14b8a6", pm: 1.4, foe: .8, stun: .2 },
    { k: "eco", n: "Eco Infinito", d: "recupera 12% da EA por turno, +15% de dano", c: "#a855f7", pm: 1.15, foe: .8, ea: .12 }, { k: "proibida", n: "Runa Proibida", d: "+75% de dano, mas você perde 10% do HP por turno", c: "#dc2626", pm: 1.75, foe: .8, self: .1 }],
};
export function domFx(cls: string, dm: DomainCfg) { // maestria: +1 nível a cada 5 usos (máx. 10) => +5% poder, -2% custo por nível
  const a = ASPECTS[cls].find((x) => x.k === dm.aspect) ?? ASPECTS[cls][0], m = Math.min(10, Math.floor(dm.uses / 5));
  return { n: dm.name, aspect: a.n, color: a.c, shout: dm.shout, p: DOMAINS[cls].p * a.pm * (1 + .05 * m), foe: a.foe, heal: a.heal ?? 0, ea: a.ea ?? 0, stun: a.stun ?? 0, self: a.self ?? 0, cost: .6 - .02 * m, mastery: m };
}
export function domBtn(cls: string, dm: DomainCfg | null, lv: number, mp: number, mmp: number, b: BState) {
  if (!dm || lv < DOMAINS[cls].lv) return undefined; const f = domFx(cls, dm), need = Math.round(mmp * f.cost);
  return { n: f.n, c: f.color, need, ok: !b.domUsed && !b.dom && !(b.burn ?? 0) && !b.over && mp >= need };
}
const rf = (a: number, b: number) => a + Math.random() * (b - a);
export function mkMon(names: string[], min: number, boss: boolean): Mon {
  const L = Math.min(200, min + Math.floor(Math.random() * 10) + (boss ? 5 : 0)), hp = Math.round((40 + 10 * L ** 1.3) * (boss ? 4 : 1));
  return { n: (boss ? "👑 " : "") + names[Math.floor(Math.random() * names.length)], L, hp, mx: hp, atk: Math.round((5 + 3.5 * L) * (boss ? 1.5 : 1)), def: Math.round(2 + .5 * L), xp: monsterXp(L) * (boss ? 6 : 1), boss };
}
type Fx = { atk: number; crit: number; hp: number; def: number; mp: number; sv: number };
const NOFX: Fx = { atk: 0, crit: 0, hp: 0, def: 0, mp: 0, sv: 0 };
export const SUB: Record<string, { n: string; d: string; e: Partial<Fx> }[]> = { // domínios: +1 ponto por nível, até 20 por domínio
  exatas: [{ n: "Domínio da Espada", d: "+1,5% ATK", e: { atk: .015 } }, { n: "Taxa Crítica", d: "+0,5% crítico", e: { crit: .5 } }, { n: "Resistência Mecânica", d: "+1% HP e DEF", e: { hp: .01, def: .01 } }],
  humanas: [{ n: "Domínio de Relíquias", d: "+1,5% ATK", e: { atk: .015 } }, { n: "Vínculo de Invocação", d: "+3% dano dos servos", e: { sv: .03 } }, { n: "Memória Ancestral", d: "+2% Energia Arcana", e: { mp: .02 } }],
  linguagens: [{ n: "Domínio Arcano", d: "+1,5% ATK", e: { atk: .015 } }, { n: "Runa Cortante", d: "+0,5% crítico", e: { crit: .5 } }, { n: "Fluxo Arcano", d: "+2% Energia Arcana", e: { mp: .02 } }],
};
export function subFx(cls: string, r: number[]): Fx { const f = { ...NOFX }; (SUB[cls] ?? []).forEach((s, i) => (Object.keys(s.e) as (keyof Fx)[]).forEach((k) => (f[k] += s.e[k]! * (r[i] ?? 0)))); return f; }
type Base = Record<"hp" | "mp" | "atk" | "def" | "crit", number>;
export function playerStats(base: Base, per: Base, level: number, bonuses: Partial<Base>[], wepAtk: number, armDef: number, at = { for: 0, int: 0, des: 0 }, fx: Fx = NOFX): Stats {
  const s: Base = { hp: 0, mp: 0, atk: 0, def: 0, crit: base.crit };
  (["hp", "mp", "atk", "def"] as const).forEach((k) => (s[k] = base[k] + per[k] * (level - 1)));
  bonuses.forEach((b) => (Object.keys(b) as (keyof Base)[]).forEach((k) => (s[k] = k === "crit" ? s[k] + b[k]! : s[k] * (1 + b[k]!))));
  s.atk += wepAtk + at.for * 2 + at.int; s.def += armDef + at.des * 1.5; s.hp += at.for * 3; s.mp += at.int * 4; s.crit += at.des * .15;
  s.atk *= 1 + fx.atk; s.hp *= 1 + fx.hp; s.def *= 1 + fx.def; s.mp *= 1 + fx.mp; s.crit += fx.crit;
  s.hp *= 1.1; // passiva de todos: Condicionamento Físico (+10% HP, +3% esquiva)
  return { ev: 3, sv: fx.sv, hp: Math.round(s.hp), mp: Math.round(s.mp), atk: Math.round(s.atk), def: Math.round(s.def), crit: Math.round(s.crit) };
}
const L = (b: BState, t: string) => { b.log.push(t); if (b.log.length > 6) b.log.shift(); };
export function step(b: BState, p: { hp: number; mp: number; gold: number; lv: number }, q: Stats, cls: string, act: Act, dm?: DomainCfg | null) {
  if (b.over) return; b.t = (b.t ?? 0) + 1; const e = b.e;
  const fin = () => { if (e.hp <= 0) { b.over = b.q.length ? "wave" : "win"; return true; } return false; };
  if (act.a === "skill") {
    const s = SKILLS[cls]?.[act.i]; if ((b.burn ?? 0) > 0 && act.i > 0) return L(b, "Esgotamento técnico: só a técnica básica."); if (!s || p.mp < s.c || p.lv < s.lv) return L(b, "EA insuficiente ou técnica bloqueada.");
    const m = Math.min(2, Math.max(1, act.m)); p.mp -= s.c; if (s.hp) p.hp = Math.max(1, p.hp - Math.round(q.hp * s.hp));
    if (s.t === "b" || s.t === "e") { if (s.t === "e") b.ev = 3; b.buf = 3; L(b, `${s.n}! ATK ×1.5 por 3 turnos${s.t === "e" ? " e 60% de esquiva" : ""}.`); }
    else {
      const cr = m >= 1.99 || Math.random() * 100 < q.crit + (s.cr ? 25 : 0);
      const d = Math.round(q.atk * (b.buf > 0 ? 1.5 : 1) * s.p * m * (cr ? 1.6 : 1) * rf(.9, 1.1) * 100 / (100 + e.def)); e.hp -= d;
      if (s.t === "c") b.cu = 3; if (s.t === "dot") b.dot = { t: 3, p: s.p * .3 }; if (s.t === "st" && Math.random() < .4) b.skip = true;
      L(b, `${s.n}: ${d} de dano${m >= 1.99 ? " ⚡PERFEITO" : m > 1 ? " ✔ bom timing" : ""}${cr ? " 💥CRÍTICO" : ""}`);
    }
  } else if (act.a === "summon") {
    const s = SUMMONS[cls]?.[act.i]; if ((b.burn ?? 0) > 0) return L(b, "Esgotamento técnico: sem invocações."); if (!s || p.mp < s.c || p.lv < s.lv) return L(b, "Não foi possível invocar.");
    p.mp -= s.c; b.sv = { n: s.n, p: s.p, t: 3 }; L(b, `Você invocou ${s.n}!`);
  } else if (act.a === "potion") {
    if (act.k === "ea") { p.mp = Math.min(q.mp, p.mp + Math.round(q.mp * .4)); L(b, "Poção de EA: +40% EA."); }
    else { p.hp = Math.min(q.hp, p.hp + Math.round(q.hp * .4)); L(b, "Poção de HP: +40% HP."); }
  } else if (act.a === "domain") {
    const D = DOMAINS[cls], f = dm ? domFx(cls, dm) : null, need = f ? Math.round(q.mp * f.cost) : 0;
    if (!D || !f || p.lv < D.lv || b.domUsed || b.dom || (b.burn ?? 0) > 0) return L(b, "Expansão indisponível (não forjada, já usada, ativa ou em esgotamento).");
    if (p.mp < need) return L(b, `Energia Arcana insuficiente (${need} EA).`);
    p.mp -= need; b.dom = { t: 3, n: f.n, p: f.p, foe: f.foe, heal: f.heal, ea: f.ea, stun: f.stun, self: f.self, k: dm?.aspect }; b.domUsed = true;
    L(b, `🌀 ${f.shout || DOMAIN_TERM + "!"}`); L(b, `${DOMAIN_TERM}: ${f.n} [${f.aspect}]`);
  } else if (act.a === "flee" && Math.random() < .6) { b.over = "flee"; return L(b, "Você fugiu!"); }
  else L(b, "Falha ao fugir!");
  if (fin()) return;
  if (b.sv && b.sv.t > 0) { const d = Math.round(q.atk * b.sv.p * (1 + (q.sv ?? 0)) * rf(.9, 1.1) * 100 / (100 + e.def)); e.hp -= d; b.sv.t--; L(b, `${b.sv.n} ataca: ${d}`); if (b.sv.t <= 0) b.sv = null; if (fin()) return; }
  if (b.dot) { const dd = Math.round(q.atk * b.dot.p * rf(.9, 1.1) * 100 / (100 + e.def)); e.hp -= dd; b.dot.t--; L(b, `🔥 Dano contínuo: ${dd}`); if (b.dot.t <= 0) b.dot = null; if (fin()) return; }
  const dmn = b.dom, foe = dmn ? dmn.foe : 1;
  if (dmn) { // barreira: acerto garantido (ignora DEF) + efeitos do aspecto; ao fim, esgotamento técnico
    const dd = Math.round(q.atk * dmn.p * (e.boss ? .75 : 1) * rf(.95, 1.05)); e.hp -= dd; dmn.t--; L(b, `🌀 ${dmn.n}: acerto garantido, ${dd} de dano`);
    if (dmn.heal) p.hp = Math.min(q.hp, p.hp + Math.round(q.hp * dmn.heal));
    if (dmn.ea) p.mp = Math.min(q.mp, p.mp + Math.round(q.mp * dmn.ea));
    if (dmn.self) p.hp = Math.max(1, p.hp - Math.round(q.hp * dmn.self));
    if (fin()) return;
    if (dmn.t <= 0) { b.dom = null; b.burn = 3; L(b, "A barreira se desfaz. Esgotamento técnico (2 turnos)."); }
    if (dmn.stun && Math.random() < dmn.stun) { L(b, `${e.n} está paralisado pela barreira!`); b.buf--; b.cu--; if (b.burn) b.burn--; return; }
  }
  if (b.skip) { b.skip = false; L(b, `${e.n} está atordoado!`); b.buf--; b.cu--; if (b.ev) b.ev--; if (b.burn) b.burn--; return; }
  if ((b.ev && Math.random() < .6) || Math.random() * 100 < (q.ev ?? 0)) { L(b, "Você esquivou do ataque!"); b.buf--; b.cu--; if (b.ev) b.ev--; if (b.burn) b.burn--; return; }
  const d = Math.round(e.atk * (b.cu > 0 ? .6 : 1) * foe * rf(.85, 1.15) * 100 / (100 + q.def)); p.hp -= d; b.buf--; b.cu--; if (b.burn) b.burn--; if (b.ev) b.ev--; L(b, `${e.n} causa ${d} de dano.`);
  if (p.hp <= 0) { p.hp = 0; b.over = "lose"; }
}
export function withArch(m: Mon, a?: string): Mon { // arquétipos vindos da IA só multiplicam dentro de limites fixos
  const k = a === "tank" ? [1.4, .8] : a === "glass" ? [.7, 1.4] : [1, 1]; m.hp = m.mx = Math.round(m.hp * k[0]); m.atk = Math.round(m.atk * k[1]); return m;
}

const LB: Record<Block, string> = { melee: "exatas", mage: "linguagens", summoner: "humanas" };
const DN: Record<string, string> = { matematica: "Geometria Absoluta", fisica: "Horizonte de Eventos", quimica: "Câmara Elemental", portugues: "Grimório Absoluto", literatura: "Palco das Ilusões", ingles: "Babel Rúnica", artes: "Galeria Cromática", historia: "Panteão das Eras", geografia: "Mundo em Colapso", filosofia: "Caverna Absoluta", biologia: "Ecossistema Mortal" };
for (const k of CLASS_KEYS) { const o = LB[CLASS_DEFS[k].block]; SUB[k] = SUB[o]; ASPECTS[k] = ASPECTS[o]; DOMAINS[k] = { ...DOMAINS[o], n: DN[k] }; } // subhabilidades e aspectos por bloco; nome da técnica suprema por classe
for (const [old, nw] of Object.entries(LEGACY)) { SKILLS[old] = SKILLS[nw]; SUMMONS[old] = SUMMONS[nw]; SUB[old] = SUB[nw]; ASPECTS[old] = ASPECTS[nw]; DOMAINS[old] = DOMAINS[nw]; } // compatibilidade
