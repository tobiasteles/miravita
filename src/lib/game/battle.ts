import { SKILLS, SUMMONS, type Sk } from "./classdata";
import { CLASS_DEFS, CLASS_KEYS, LEGACY, type Block } from "./classes";
import { buildStats, monBase, KIND_MUL, PA_MAX, PA_REGEN, defF, type CStats, type Fx as StatFx, type MonKind } from "./combat";
export { SKILLS, SUMMONS };
import { monsterXp } from "./xp";
export type Stats = CStats;
export type Mon = {
  n: string;
  L: number;
  hp: number;
  mx: number;
  atk: number;
  def: number;
  xp: number;
  boss: boolean;
  kind?: MonKind;
  refl?: number; // Reflexos do monstro (esquiva dos seus golpes: Foco do jogador compensa)
  acc?: number; // precisão do monstro (contra os Reflexos do jogador)
  dt?: "fis" | "arc"; // tipo de dano: usa Defesa Física ou Defesa Mágica do jogador
  rs?: number; // resistência a status (atordoar etc.): Penetração de Status reduz
  pat?: ("carga" | "couraca" | "furia")[]; // padrões de chefe (ver step)
};
export type BState = {
  e: Mon;
  q: Mon[];
  wave: number;
  dungeon: boolean;
  mapSlug: string;
  buf: number;
  cu: number;
  sv: { n: string; p: number; t: number } | null;
  log: string[];
  over: null | "wave" | "win" | "lose" | "flee";
  res: string[];
  t?: number;
  dom?: {
    t: number;
    n: string;
    p: number;
    foe: number;
    heal: number;
    ea: number;
    stun: number;
    self: number;
    k?: string;
  } | null;
  domUsed?: boolean;
  burn?: number; // Sobrecarga (pós-Despertar)
  dot?: { t: number; p: number } | null;
  ev?: number; // turnos de Véu Intangível
  skip?: boolean; // inimigo atordoado
  // ─── novos ───
  pa?: number; // Pontos de Ação atuais
  used?: Record<string, number>; // vezes que cada poder (índice da árvore) foi usado nesta batalha
  aegis?: number; // Barreira Aegis: HP do escudo
  aegisT?: number;
  eDef?: number; // turnos de Quebra de Guarda aplicada ao inimigo
  sifT?: number; // turnos de Sifão Vital extra (poder Autoridade)
  charge?: number; // 1 = o chefe está carregando um golpe devastador
  et?: number; // turnos do inimigo
  pStun?: boolean; // jogador atordoado
  rx?: { cat: string; pw: number } | null; // Infusão Elemental (classe Elemental)
  endless?: boolean; // Portão da Cidade: caçada contínua
  run?: { kills: number; xp: number; gold: number; heat: number };
  ambush?: boolean; // encontro aleatório na estrada
};
export type Act =
  | { a: "domain" }
  | { a: "skill"; i: number; m: number }
  | { a: "summon"; i: number }
  | { a: "potion"; k: "hp" | "ea" }
  | { a: "flee" };
export const tierOf = (lv: number) =>
  lv < 50 ? "Fundamental" : lv < 120 ? "Médio" : "Superior";
export const DOMAIN_TERM = "Despertar"; // nome genérico da técnica suprema: troque aqui
export const DOMAINS: Record<
  string,
  { n: string; lv: number; p: number; foe: number; heal?: number; d: string }
> = {
  exatas: {
    n: "Horizonte de Eventos",
    lv: 150,
    p: 3,
    foe: 0.5,
    d: "O espaço-tempo colapsa: dano garantido por 3 turnos e o inimigo causa só 50% do dano (gravidade).",
  },
  humanas: {
    n: "Panteão das Eras",
    lv: 150,
    p: 2.4,
    foe: 0.8,
    heal: 0.08,
    d: "Todas as eras respondem ao chamado: dano garantido por 3 turnos, cura 8% do HP por turno e o inimigo causa 20% menos dano.",
  },
  linguagens: {
    n: "Grimório Absoluto",
    lv: 150,
    p: 2.6,
    foe: 0.4,
    d: "A realidade é reescrita: dano garantido por 3 turnos e o inimigo, silenciado, causa só 40% do dano.",
  },
};
export type DomainCfg = {
  name: string;
  aspect: string;
  shout: string;
  uses: number;
};
type Asp = {
  k: string;
  n: string;
  d: string;
  c: string;
  pm: number;
  foe: number;
  heal?: number;
  ea?: number;
  stun?: number;
  self?: number;
};
// aspectos: o jogador escolhe um ao forjar a técnica suprema (risco x recompensa)
export const ASPECTS: Record<string, Asp[]> = {
  exatas: [
    {
      k: "gravidade",
      n: "Gravidade",
      d: "o inimigo causa só 50% do dano",
      c: "#0891b2",
      pm: 1,
      foe: 0.5,
    },
    {
      k: "plasma",
      n: "Plasma",
      d: "+35% de dano",
      c: "#f97316",
      pm: 1.35,
      foe: 0.8,
    },
    {
      k: "vacuo",
      n: "Vácuo",
      d: "35% de chance de paralisar o inimigo por turno",
      c: "#94a3b8",
      pm: 1.1,
      foe: 0.8,
      stun: 0.35,
    },
    {
      k: "antimateria",
      n: "Antimatéria",
      d: "+70% de dano, mas você perde 8% do HP por turno",
      c: "#e11d48",
      pm: 1.7,
      foe: 0.8,
      self: 0.08,
    },
  ],
  humanas: [
    {
      k: "legiao",
      n: "Legião",
      d: "cura 8% do HP por turno",
      c: "#d97706",
      pm: 1.1,
      foe: 0.8,
      heal: 0.08,
    },
    {
      k: "eclipse",
      n: "Eclipse",
      d: "30% de chance de paralisar o inimigo por turno",
      c: "#7c3aed",
      pm: 1,
      foe: 0.7,
      stun: 0.3,
    },
    {
      k: "sangue",
      n: "Sangue Ancestral",
      d: "+60% de dano, mas você perde 8% do HP por turno",
      c: "#be123c",
      pm: 1.6,
      foe: 0.8,
      self: 0.08,
    },
    {
      k: "ouro",
      n: "Ouro Imperial",
      d: "recupera 15% da EA e cura 4% do HP por turno",
      c: "#eab308",
      pm: 1,
      foe: 0.8,
      ea: 0.15,
      heal: 0.04,
    },
  ],
  linguagens: [
    {
      k: "silencio",
      n: "Silêncio",
      d: "o inimigo causa só 35% do dano",
      c: "#6366f1",
      pm: 1,
      foe: 0.35,
    },
    {
      k: "profecia",
      n: "Profecia",
      d: "+40% de dano e 20% de paralisar o inimigo",
      c: "#14b8a6",
      pm: 1.4,
      foe: 0.8,
      stun: 0.2,
    },
    {
      k: "eco",
      n: "Eco Infinito",
      d: "recupera 12% da EA por turno, +15% de dano",
      c: "#a855f7",
      pm: 1.15,
      foe: 0.8,
      ea: 0.12,
    },
    {
      k: "proibida",
      n: "Runa Proibida",
      d: "+75% de dano, mas você perde 10% do HP por turno",
      c: "#dc2626",
      pm: 1.75,
      foe: 0.8,
      self: 0.1,
    },
  ],
};
export function domFx(cls: string, dm: DomainCfg) {
  // maestria: +1 nível a cada 5 usos (máx. 10) => +5% poder, -2% custo por nível
  const a = ASPECTS[cls].find((x) => x.k === dm.aspect) ?? ASPECTS[cls][0],
    m = Math.min(10, Math.floor(dm.uses / 5));
  return {
    n: dm.name,
    aspect: a.n,
    color: a.c,
    shout: dm.shout,
    p: DOMAINS[cls].p * a.pm * (1 + 0.05 * m),
    foe: a.foe,
    heal: a.heal ?? 0,
    ea: a.ea ?? 0,
    stun: a.stun ?? 0,
    self: a.self ?? 0,
    cost: 0.6 - 0.02 * m,
    mastery: m,
  };
}
export function domBtn(
  cls: string,
  dm: DomainCfg | null,
  lv: number,
  mp: number,
  mmp: number,
  b: BState,
) {
  if (!dm || lv < DOMAINS[cls].lv) return undefined;
  const f = domFx(cls, dm),
    need = Math.round(mmp * f.cost);
  return {
    n: f.n,
    c: f.color,
    need,
    ok: !b.domUsed && !b.dom && !(b.burn ?? 0) && !b.over && mp >= need,
  };
}
const rf = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
// (legado) usado só se algum arquivo antigo ainda chamar mkMon; o jogo usa mkMonster (bestiary.ts)
export function mkMon(names: string[], min: number, boss: boolean): Mon {
  const L = Math.min(200, min + Math.floor(Math.random() * 10) + (boss ? 5 : 0)), m = monBase(L), k = KIND_MUL[boss ? "boss" : "mon"];
  const hp = Math.round(m.hp * k.hp);
  return { n: (boss ? "👑 " : "") + names[Math.floor(Math.random() * names.length)], L, hp, mx: hp, atk: Math.round(m.atk * k.atk), def: Math.round(m.def), xp: monsterXp(L) * k.xp, boss, kind: boss ? "boss" : "mon", refl: m.refl, acc: m.acc, dt: "fis", rs: boss ? 0.5 : 0.25 };
}
// ───── SUBHABILIDADES ("domínios" de pontos): 3 por bloco, +1 ponto por nível, até 20 cada ─────
export const SUB: Record<string, { n: string; d: string; e: StatFx }[]> = {
  melee: [
    { n: "Maestria Marcial", d: "+1,5% Poderio Físico", e: { atk: 0.015 } },
    { n: "Ruptura Afiada", d: "+0,5% Chance de Ruptura", e: { crit: 0.5 } },
    { n: "Couraça Viva", d: "+1% HP e +0,25% Mitigação", e: { hp: 0.01, mit: 0.25 } },
  ],
  mage: [
    { n: "Domínio Arcano", d: "+1,5% Poderio Arcano", e: { atk: 0.015 } },
    { n: "Ressonância Arcana", d: "+0,4% Ressonância Arcana", e: { res: 0.4 } },
    { n: "Fluxo Arcano", d: "+2% de MP (Energia Arcana)", e: { mp: 0.02 } },
  ],
  summoner: [
    { n: "Domínio de Relíquias", d: "+1,5% Poderio Arcano", e: { atk: 0.015 } },
    { n: "Vínculo de Invocação", d: "+3% de dano dos aliados invocados", e: { sv: 0.03 } },
    { n: "Memória Ancestral", d: "+2% de MP (Energia Arcana)", e: { mp: 0.02 } },
  ],
};
export function subFx(cls: string, r: number[]): StatFx {
  const f: Record<string, number> = {};
  (SUB[cls] ?? []).forEach((s, i) => Object.entries(s.e).forEach(([k, v]) => (f[k] = (f[k] ?? 0) + v! * (r[i] ?? 0))));
  return f as StatFx;
}
export { buildStats };
const L = (b: BState, t: string) => {
  b.log.push(t);
  if (b.log.length > 6) b.log.shift();
};
// estados antigos (salvos antes da atualização) ganham os campos novos
export function norm(b: BState, q: Stats) {
  b.pa ??= PA_MAX; b.used ??= {}; b.aegis ??= 0; b.aegisT ??= 0; b.eDef ??= 0; b.sifT ??= 0; b.charge ??= 0; b.et ??= 0;
  b.buf ??= 0; b.cu ??= 0; b.ev ??= 0; b.burn ??= 0;
  const e = b.e; e.refl ??= 3 + 1.2 * e.L; e.acc ??= 40 + 1.5 * e.L; e.dt ??= "fis"; e.rs ??= e.boss ? 0.5 : 0.25;
  void q;
}
const dec = (b: BState, k: "buf" | "cu" | "ev" | "eDef" | "sifT" | "aegisT" | "burn") => { if ((b[k] ?? 0) > 0) b[k] = (b[k] ?? 0) - 1; };
// defesa efetiva do inimigo: Quebra de Guarda (poder) ×0,35 · Quebra de Guarda (status) -%
const eDefOf = (b: BState, q: Stats) => b.e.def * ((b.eDef ?? 0) > 0 ? 0.35 : 1) * (1 - q.qg / 100);
// Couraça (padrão de chefe): corta pela metade TODO o dano recebido enquanto a guarda não for quebrada
const armor = (b: BState) => (b.e.pat?.includes("couraca") && !((b.eDef ?? 0) > 0) ? 0.5 : 1);
const powerOf = (b: BState, q: Stats) => q.atk * (b.buf > 0 ? 1.5 : 1) * (1 + (q.main === "fis" ? q.resF : q.resA) / 100);
// ───── Infusão Elemental (Elemental): efeito por categoria do elemento ─────
export const RX_INFO: Record<string, string> = {
  "metal alcalino": "+20% de dano e queimadura", "metal alcalino-terroso": "+20% de dano e queimadura", "metal de transição": "+15% de dano",
  "metal pós-transição": "corrói: -65% de defesa por 2 turnos", metaloide: "+10% de Chance de Ruptura", "não-metal": "Sifão Vital +6%",
  "halogênio": "+20% de chance de atordoar", "gás nobre": "começa a luta com Barreira Aegis de 10% do HP", lantanídeo: "+12% de dano",
  actinídeo: "+35% de dano, mas você perde 2% do HP por golpe", transactinídeo: "+35% de dano, mas você perde 2% do HP por golpe",
};
export const mkRx = (cat: string, score: number) => ({ cat, pw: 1 + clamp(score, 0, 22) / 15 });
export function step(
  b: BState,
  p: { hp: number; mp: number; gold: number; lv: number },
  q: Stats,
  cls: string,
  act: Act,
  dm?: DomainCfg | null,
) {
  if (b.over) return;
  norm(b, q);
  const e = b.e;
  const fin = () => {
    if (e.hp <= 0) {
      b.over = b.endless ? "wave" : b.q.length ? "wave" : "win"; // grind infinito nunca "vence": sempre vem o próximo monstro
      return true;
    }
    return false;
  };
  const endTurn = () => {
    b.pa = Math.min(q.pam, (b.pa ?? 0) + PA_REGEN);
    if (p.hp > 0) {
      p.hp = Math.min(q.hp, p.hp + Math.round((q.hp * q.reg) / 100)); // Regeneração Inerente
      p.mp = Math.min(q.mp, p.mp + Math.round((q.mp * q.regE) / 100));
    }
    (["buf", "cu", "ev", "eDef", "sifT", "burn"] as const).forEach((k) => dec(b, k));
    dec(b, "aegisT");
    if (!b.aegisT) b.aegis = 0;
  };
  // ───────── AÇÃO DO JOGADOR ─────────
  if (act.a === "skill") {
    const s: Sk | undefined = SKILLS[cls]?.[act.i];
    if (!s) return L(b, "Poder inválido.");
    if (p.lv < s.lv) return L(b, `${s.n} só no nível ${s.lv}.`);
    if ((b.burn ?? 0) > 0 && act.i > 1) return L(b, "Sobrecarga: só os poderes Novato e Aprendiz funcionam.");
    if (s.req && (b.used![s.req.i] ?? 0) < s.req.n)
      return L(b, `${s.n} exige usar ${SKILLS[cls][s.req.i].n} ${s.req.n}× nesta batalha (${b.used![s.req.i] ?? 0}/${s.req.n}).`);
    const cost = s.c > 0 ? Math.max(1, Math.round((q.mp * s.c) / 100)) : 0; // custo de EA = % da EA máxima
    if (s.allMp ? p.mp < q.mp * 0.25 : p.mp < cost) return L(b, `EA insuficiente para ${s.n}${s.allMp ? " (precisa de 25% da EA máxima)" : ""}.`);
    if ((b.pa ?? 0) < s.pa) return L(b, `PA insuficiente (${s.pa} necessários). Use um poder mais leve para recuperar.`);
    if (b.pStun) {
      b.pStun = false;
      b.t = (b.t ?? 0) + 1;
      L(b, "Você está atordoado e perde o turno!");
      return afterPlayer();
    }
    b.t = (b.t ?? 0) + 1;
    const spent = s.allMp ? p.mp : cost;
    p.mp -= spent;
    b.pa = (b.pa ?? 0) - s.pa;
    if (s.hp) p.hp = Math.max(1, p.hp - Math.round(q.hp * s.hp));
    if (s.hpCur) p.hp = Math.max(1, p.hp - Math.floor(p.hp * s.hpCur));
    b.used![act.i] = (b.used![act.i] ?? 0) + 1;
    if (s.t === "b") {
      b.buf = 3;
      L(b, `${s.n}! Poderio ×1,5 por 3 turnos.`);
    } else if (s.t === "e") {
      b.ev = s.x ?? 3;
      if ((s.x ?? 3) > 3) b.sifT = s.x ?? 4;
      L(b, `${s.n}: Véu Intangível por ${b.ev} turnos${b.sifT ? " e Sifão Vital" : ""}.`);
    } else if (s.t === "ag") {
      b.aegis = Math.round(q.hp * 0.3);
      b.aegisT = 4;
      L(b, `${s.n}: Barreira Aegis de ${b.aegis} por 4 turnos.`);
    } else if (s.t === "sv") {
      b.sv = { n: s.n, p: s.p, t: 3 };
      L(b, `Você invocou ${s.n}!`);
    } else {
      const m = clamp(act.m, 1, 2), perfect = m >= 1.99;
      const hitP = clamp((0.95 * q.foco) / (q.foco + 0.35 * (e.refl ?? 0)), 0.55, 0.98);
      if (!perfect && Math.random() > hitP) {
        L(b, `${s.n}: ${e.n} esquivou! (Foco ${Math.round(hitP * 100)}%)`);
      } else {
        const pw = s.t === "nuke" ? s.p * (1 + 0.6 * (spent / q.mp)) : s.p;
        const cr = perfect || Math.random() * 100 < q.rup + (s.cr ?? 0) + (b.rx?.cat === "metaloide" ? 10 * b.rx.pw : 0);
        const power = powerOf(b, q);
        let d = power * pw * m * rf(0.92, 1.08) * defF(eDefOf(b, q), e.L) * armor(b);
        d = Math.max(d, power * (q.estab / 100) * (1 + s.p * 0.25)); // Estabilidade de Dano
        if (cr) d *= 1 + q.rupD / 100;
        if (e.boss) d *= 1 + q.imp / 100; // Ímpeto de Caçador
        if (cls === "quimica" || b.rx) d *= 1 + rxDmg(b);
        d = Math.max(1, Math.round(d));
        e.hp -= d;
        const sv = q.sifV + ((b.sifT ?? 0) > 0 ? 12 : 0) + (b.rx?.cat === "não-metal" ? 6 * b.rx.pw : 0);
        if (sv) p.hp = Math.min(q.hp, p.hp + Math.round((d * sv) / 100)); // Sifão Vital
        if (q.sifE) p.mp = Math.min(q.mp, p.mp + Math.min(Math.round(q.mp * 0.08), Math.round((d * q.sifE) / 100))); // Sifão de Essência
        if (s.t === "bq") b.eDef = 3;
        if (s.t === "dot") b.dot = { t: 3, p: s.p * 0.3 };
        const pen = Math.max(0, (e.rs ?? 0) - q.pen / 100);
        if (s.t === "st" && Math.random() < 0.4 * (1 - pen)) { b.skip = true; b.charge = 0; }
        rxHit(b, p, q, e);
        L(b, `${s.n}: ${d} de dano${perfect ? " ⚡PERFEITO" : m > 1 ? " ✔ bom timing" : ""}${cr ? " 💥RUPTURA" : ""}${b.skip && s.t === "st" ? " · inimigo atordoado!" : ""}`);
      }
    }
  } else if (act.a === "summon") {
    return L(b, "As invocações agora são poderes: equipe-as na Academia."); // compatibilidade
  } else if (act.a === "potion") {
    b.t = (b.t ?? 0) + 1;
    if (act.k === "ea") {
      p.mp = Math.min(q.mp, p.mp + Math.round(q.mp * 0.4));
      L(b, "Poção de EA: +40% EA.");
    } else {
      p.hp = Math.min(q.hp, p.hp + Math.round(q.hp * 0.4));
      L(b, "Poção de HP: +40% HP.");
    }
  } else if (act.a === "domain") {
    const D = DOMAINS[cls],
      f = dm ? domFx(cls, dm) : null,
      need = f ? Math.round(q.mp * f.cost) : 0;
    if (!D || !f || p.lv < D.lv || b.domUsed || b.dom || (b.burn ?? 0) > 0)
      return L(b, "Despertar indisponível (não forjado, já usado, ativo ou em Sobrecarga).");
    if (p.mp < need) return L(b, `Energia Arcana insuficiente (${need} EA).`);
    b.t = (b.t ?? 0) + 1;
    p.mp -= need;
    b.dom = { t: 3, n: f.n, p: f.p, foe: f.foe, heal: f.heal, ea: f.ea, stun: f.stun, self: f.self, k: dm?.aspect };
    b.domUsed = true;
    L(b, `🌀 ${f.shout || DOMAIN_TERM + "!"}`);
    L(b, `${DOMAIN_TERM}: ${f.n} [${f.aspect}]`);
  } else if (act.a === "flee") {
    b.t = (b.t ?? 0) + 1;
    if (Math.random() < (e.boss ? 0.25 : 0.6)) {
      b.over = "flee";
      return L(b, "Você fugiu!");
    }
    L(b, "Falha ao fugir!");
  }
  return afterPlayer();

  // ───────── RESTO DO TURNO: aliados, dano contínuo, Despertar, inimigo ─────────
  function afterPlayer() {
    if (fin()) return;
    if (b.sv && b.sv.t > 0) {
      const d = Math.max(1, Math.round(q.atk * b.sv.p * (1 + q.sv) * rf(0.9, 1.1) * defF(eDefOf(b, q), e.L) * armor(b)));
      e.hp -= d;
      b.sv.t--;
      L(b, `${b.sv.n} ataca: ${d}`);
      if (b.sv.t <= 0) b.sv = null;
      if (fin()) return;
    }
    if (b.dot) {
      const dd = Math.max(1, Math.round(q.atk * b.dot.p * rf(0.9, 1.1) * defF(eDefOf(b, q), e.L) * armor(b)));
      e.hp -= dd;
      b.dot.t--;
      L(b, `🔥 Dano contínuo: ${dd}`);
      if (b.dot.t <= 0) b.dot = null;
      if (fin()) return;
    }
    const dmn = b.dom,
      foe = dmn ? dmn.foe : 1;
    if (dmn) {
      // barreira: acerto garantido (ignora DEF) + efeitos do aspecto; ao fim, Sobrecarga
      const dd = Math.round(q.atk * dmn.p * (e.boss ? 0.75 : 1) * rf(0.95, 1.05));
      e.hp -= dd;
      dmn.t--;
      L(b, `🌀 ${dmn.n}: acerto garantido, ${dd} de dano`);
      if (dmn.heal) p.hp = Math.min(q.hp, p.hp + Math.round(q.hp * dmn.heal));
      if (dmn.ea) p.mp = Math.min(q.mp, p.mp + Math.round(q.mp * dmn.ea));
      if (dmn.self) p.hp = Math.max(1, p.hp - Math.round(q.hp * dmn.self));
      if (fin()) return;
      if (dmn.t <= 0) {
        b.dom = null;
        b.burn = 3;
        L(b, "O Despertar termina. Sobrecarga (2 turnos).");
      }
      if (dmn.stun && Math.random() < dmn.stun * (1 - Math.max(0, (e.rs ?? 0) - q.pen / 100))) {
        L(b, `${e.n} está paralisado pelo Despertar!`);
        b.charge = 0;
        return endTurn();
      }
    }
    // ─── turno do inimigo ───
    if (b.skip) {
      b.skip = false;
      b.charge = 0;
      L(b, `${e.n} está atordoado!`);
      return endTurn();
    }
    const pats = e.pat ?? [],
      enraged = pats.includes("furia") && e.hp < e.mx * 0.3;
    b.et = (b.et ?? 0) + 1;
    if (pats.includes("carga") && !b.charge && b.et % (enraged ? 3 : 4) === 0) {
      b.charge = 1;
      L(b, `⚠ ${e.n} concentra energia para um golpe DEVASTADOR! (atordoe, use Véu ou Barreira)`);
      return endTurn();
    }
    const charged = b.charge === 1;
    b.charge = 0;
    const acc = e.acc ?? 40,
      dodge = clamp((0.45 * q.refl) / (q.refl + acc), 0, 0.4) + 0.03;
    if (((b.ev ?? 0) > 0 && Math.random() < 0.6) || (!charged && Math.random() < dodge)) {
      L(b, "Você esquivou do ataque!");
      return endTurn();
    }
    if (e.dt === "arc" && Math.random() * 100 < q.evM * 0.5) {
      L(b, "Sua Evasão Mágica dissipou o feitiço!");
      return endTurn();
    }
    const raw = e.atk * ((b.cu ?? 0) > 0 ? 0.6 : 1) * foe * (enraged ? 1.35 : 1) * (charged ? 3 : 1) * rf(0.88, 1.12);
    let d = raw * defF(e.dt === "arc" ? q.dfM : q.dfF, e.L);
    d = Math.max(1, Math.round(d * (1 - clamp(q.mit, 0, 60) / 100))); // Mitigação
    const full = d;
    if ((b.aegis ?? 0) > 0) {
      const ab = Math.min(b.aegis!, d);
      b.aegis! -= ab;
      d -= ab;
      L(b, `Barreira Aegis absorveu ${ab}.`);
    }
    p.hp -= d;
    L(b, `${charged ? "💢 GOLPE DEVASTADOR! " : ""}${e.n} causa ${d} de dano.`);
    const ret = q.ret + ((b.aegisT ?? 0) > 0 ? 15 : 0);
    if (ret > 0) {
      const r = Math.round((full * ret) / 100);
      e.hp -= r;
      L(b, `Retaliação: ${r} de dano refletido.`);
      if (fin()) return;
    }
    if (p.hp > 0 && e.boss && d > 0 && Math.random() < 0.2) {
      if (Math.random() * 100 < q.ten) L(b, "Sua Tenacidade resistiu ao atordoamento!");
      else {
        b.pStun = true;
        L(b, "Você foi atordoado! Perderá o próximo turno.");
      }
    }
    if (p.hp <= 0) {
      p.hp = 0;
      b.over = "lose";
    }
    endTurn();
  }
}
function rxDmg(b: BState) {
  const r = b.rx;
  if (!r) return 0;
  if (r.cat.startsWith("metal alcalino")) return 0.2 * r.pw;
  if (r.cat === "metal de transição") return 0.15 * r.pw;
  if (r.cat === "lantanídeo") return 0.12 * r.pw;
  if (r.cat === "actinídeo" || r.cat === "transactinídeo") return 0.35 * r.pw;
  return 0;
}
function rxHit(b: BState, p: { hp: number }, q: Stats, e: Mon) {
  const r = b.rx;
  if (!r) return;
  if (r.cat.startsWith("metal alcalino") && !b.dot) b.dot = { t: 3, p: 0.25 * r.pw };
  if (r.cat === "metal pós-transição") b.eDef = Math.max(b.eDef ?? 0, 2);
  if (r.cat === "halogênio" && Math.random() < 0.2 * r.pw * (1 - Math.max(0, (e.rs ?? 0) - q.pen / 100))) { b.skip = true; b.charge = 0; }
  if (r.cat === "actinídeo" || r.cat === "transactinídeo") p.hp = Math.max(1, p.hp - Math.round(q.hp * 0.02));
}
export function withArch(m: Mon, a?: string): Mon {
  // arquétipos vindos da IA só multiplicam dentro de limites fixos
  const k = a === "tank" ? [1.4, 0.8] : a === "glass" ? [0.7, 1.4] : [1, 1];
  m.hp = m.mx = Math.round(m.hp * k[0]);
  m.atk = Math.round(m.atk * k[1]);
  return m;
}

const LB: Record<Block, string> = {
  melee: "exatas",
  mage: "linguagens",
  summoner: "humanas",
};
const DN: Record<string, string> = {
  matematica: "Geometria Absoluta",
  fisica: "Horizonte de Eventos",
  quimica: "Câmara Elemental",
  portugues: "Grimório Absoluto",
  ingles: "Babel Rúnica",
  artes: "Galeria Cromática",
  historia: "Panteão das Eras",
  geografia: "Mundo em Colapso",
  filosofia: "Caverna Absoluta",
  biologia: "Ecossistema Mortal",
};
for (const k of CLASS_KEYS) {
  const o = LB[CLASS_DEFS[k].block];
  ASPECTS[k] = ASPECTS[o];
  DOMAINS[k] = { ...DOMAINS[o], n: DN[k] };
} // aspectos por bloco; nome do Despertar por classe
const BLK_SUB: Record<Block, string> = { melee: "melee", mage: "mage", summoner: "summoner" };
for (const k of CLASS_KEYS) SUB[k] = SUB[BLK_SUB[CLASS_DEFS[k].block]];
for (const [old, nw] of Object.entries(LEGACY)) {
  SKILLS[old] = SKILLS[nw];
  SUB[old] = SUB[nw];
  ASPECTS[old] = ASPECTS[nw];
  DOMAINS[old] = DOMAINS[nw];
} // compatibilidade
