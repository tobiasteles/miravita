// ───── ARENA PvP: duelos assíncronos contra o "fantasma" de outro jogador ─────
// O fantasma tem os status reais do personagem (com equipamento) e usa os poderes que ele deixou equipados.
// O oponente não precisa estar online: o servidor joga por ele. Vencer sobe o seu rating (Elo); perder desce.
import { SKILLS } from "./classdata";
import { buildStats, type CStats } from "./combat";
import { CLASS_DEFS, blockOf, classStats } from "./classes";
import { subFx, type Mon } from "./battle";

export const DAILY_FIGHTS = 10; // duelos valendo rating por dia
export const BRACKET = 15; // só enfrenta quem está até 15 níveis acima/abaixo
export const K = 24; // quanto o rating mexe por duelo
export const START_RATING = 1000;
export const expected = (ra: number, rb: number) => 1 / (1 + 10 ** ((rb - ra) / 400));
export const eloDelta = (ra: number, rb: number, won: boolean) => Math.round(K * ((won ? 1 : 0) - expected(ra, rb)));
export const arenaGold = (lvl: number, won: boolean) => (won ? Math.round(30 + lvl * 6) : Math.round(5 + lvl));
export const league = (r: number) => (r >= 1800 ? "Lenda" : r >= 1500 ? "Diamante" : r >= 1300 ? "Ouro" : r >= 1100 ? "Prata" : "Bronze");

// NORMALIZAÇÃO DE STATUS NA ARENA: metade dos números (vida, EA, poder, defesas, Foco e Reflexos) vem do seu personagem e metade de uma
// build de referência do nível. Assim equipamento e atributos ainda contam, mas as classes não ficam desiguais só pelos números
// (a diferença que sobra vem dos poderes e das passivas). Mude ARENA_BLEND: 0 = todo mundo igual · 1 = status 100% reais.
export const ARENA_BLEND = 0.5;
export function refStats(level: number): CStats {
  const st = classStats("fisica"), pts = 5 * (level - 1), atk = Math.min(90, 10 + 0.4 * level);
  return buildStats({ cls: "fisica", base: st.base, per: st.per, level, traits: [], gear: { atk, def: Math.min(70, 8 + 0.3 * level), hp: Math.round(atk * 2.4), crit: Math.min(8, level / 25) },
    at: { for: Math.floor(pts * 0.5), int: Math.floor(pts * 0.15), des: Math.floor(pts * 0.35) }, fx: subFx("fisica", [0, 0, 0].map(() => Math.min(20, Math.floor((level - 1) / 3)))) });
}
export function pvpNorm(q: CStats, level: number): CStats {
  const r = refStats(level), w = ARENA_BLEND, m = (a: number, b: number) => Math.round(a * w + b * (1 - w));
  const n = { ...q, hp: m(q.hp, r.hp), mp: m(q.mp, r.mp), pof: m(q.pof, r.pof), poa: m(q.poa, r.pof), dfF: m(q.dfF, r.dfF), dfM: m(q.dfM, r.dfM), foco: m(q.foco, r.foco), refl: m(q.refl, r.refl) };
  n.atk = q.main === "fis" ? n.pof : n.poa;
  n.def = n.dfF;
  return n;
}

export function ghostFrom(name: string, cls: string, level: number, q: CStats, loadout: number[]): Mon {
  const S = SKILLS[cls] ?? [];
  const sk = loadout
    .filter((i) => i >= 0 && S[i] && S[i].lv <= level && S[i].t !== "nuke")
    .map((i) => ({ n: S[i].n, t: S[i].t as string, p: S[i].p, pa: S[i].pa, c: S[i].c > 0 ? Math.max(1, Math.round((q.mp * S[i].c) / 100)) : 0, cr: S[i].cr ?? 0 }));
  return {
    n: name, L: level, hp: q.hp, mx: q.hp, atk: q.atk, def: q.dfF, xp: 0, boss: false, kind: "mon", refl: q.refl, acc: q.foco, dt: q.main,
    rs: Math.min(0.6, 0.15 + q.ten / 200),
    pvp: { cls, dfF: q.dfF, dfM: q.dfM, mit: q.mit, rup: q.rup, rupD: q.rupD, mp: q.mp, reg: q.reg, sifV: q.sifV, evM: q.evM, sk },
  };
}
// Gladiador (NPC de treino): uma build "típica" da classe no nível do jogador
export function npcLoadout(cls: string, level: number) {
  const S = SKILLS[cls], ok = (i: number) => S[i].lv <= level, idx = [...Array(12).keys()].filter(ok);
  const best = (t: string[]) => idx.filter((i) => t.includes(S[i].t)).sort((a, b) => S[b].p - S[a].p)[0];
  const heavy = idx.filter((i) => ["d", "sv"].includes(S[i].t) && S[i].p > 0).sort((a, b) => S[b].p - S[a].p);
  return [...new Set([heavy[0], heavy[1], best(["ag"]), best(["st", "bq"]), 0].filter((x) => x !== undefined))].slice(0, 4) as number[];
}
export function npcGhost(cls: string, level: number): Mon {
  const st = classStats(cls), pts = 5 * (level - 1), sp = blockOf(cls) === "melee" ? [0.5, 0.15, 0.35] : [0.35, 0.45, 0.2];
  const atk = Math.min(90, 10 + 0.4 * level), gear = { atk, def: Math.min(70, 8 + 0.3 * level), hp: Math.round(atk * 2.4), crit: Math.min(8, level / 25) };
  const q = buildStats({ cls, base: st.base, per: st.per, level, traits: [], gear, at: { for: Math.floor(pts * sp[0]), int: Math.floor(pts * sp[1]), des: Math.floor(pts * sp[2]) }, fx: subFx(cls, [0, 0, 0].map(() => Math.min(20, Math.floor((level - 1) / 3)))) });
  return ghostFrom(`Gladiador ${CLASS_DEFS[cls].name}`, cls, level, pvpNorm(q, level), npcLoadout(cls, level));
}
