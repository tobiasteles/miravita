// npm test  (eventos de cena que o servidor grava em BState.fx; só desenho, nenhuma regra muda)
import test from "node:test";
import assert from "node:assert/strict";
import { step, mkMon, type BState, type Stats } from "../src/lib/game/battle";
import { SKILLS } from "../src/lib/game/classdata";

const stats = (o: Record<string, number | string> = {}) =>
  new Proxy({ main: "fis", hp: 200, mp: 100, pam: 100, atk: 50, pof: 50, poa: 50, dfF: 5, dfM: 5, foco: 50, refl: 10, rupD: 60, estab: 12, ...o } as Record<string, number | string>, {
    get: (t, k: string) => (k in t ? t[k] : 0),
  }) as unknown as Stats;
const state = (hp: number, atk = 1): BState => {
  const e = { ...mkMon(["Slime"], 1, false), hp, mx: Math.max(hp, 1000), atk };
  return { e, q: [], wave: 1, dungeon: false, mapSlug: "planicie-de-aurora", buf: 0, cu: 0, sv: null, log: [], over: null, res: [], pa: 100, used: {}, aegis: 0, aegisT: 0, eDef: 0, sifT: 0, charge: 0, et: 0 };
};
const dmgSkill = () => SKILLS.matematica.findIndex((s) => ["d", "nuke", "st", "bq", "dot"].includes(s.t) && s.lv <= 1);
const withRandom = (v: number, fn: () => void) => { const r = Math.random; Math.random = () => v; try { fn(); } finally { Math.random = r; } };

test("poder com acerto perfeito grava crítico do jogador no inimigo", () => {
  const i = dmgSkill(), b = state(5000), p = { hp: 200, mp: 100, gold: 0, lv: 150 };
  assert.ok(i >= 0);
  withRandom(0.5, () => step(b, p, stats(), "matematica", { a: "skill", i, m: 2 }));
  assert.equal(b.fxSeq, 1);
  const hit = b.fx!.find((x) => x.k === "crit");
  assert.ok(hit && hit.k === "crit" && hit.from === "me" && hit.to === "foe" && (hit.d ?? 0) > 0);
});
test("golpe que mata: dano e depois vitória (uma vez só)", () => {
  const i = dmgSkill(), b = state(1), p = { hp: 200, mp: 100, gold: 0, lv: 150 };
  withRandom(0.5, () => step(b, p, stats(), "matematica", { a: "skill", i, m: 2 }));
  assert.equal(b.over, "win");
  assert.deepEqual(b.fx!.map((x) => x.k), ["crit", "win"]);
});
test("cada ação zera o fx anterior e sobe a sequência", () => {
  const b = state(5000), p = { hp: 50, mp: 100, gold: 0, lv: 1 };
  withRandom(0.99, () => step(b, p, stats(), "matematica", { a: "potion", k: "hp" }));
  const first = b.fxSeq;
  assert.ok(b.fx!.some((x) => x.k === "heal"));
  withRandom(0.99, () => step(b, p, stats(), "matematica", { a: "potion", k: "hp" }));
  assert.equal(b.fxSeq, (first ?? 0) + 1);
});
test("fuga bem-sucedida grava flee", () => {
  const b = state(5000), p = { hp: 200, mp: 100, gold: 0, lv: 1 };
  withRandom(0, () => step(b, p, stats(), "matematica", { a: "flee" }));
  assert.equal(b.over, "flee");
  assert.deepEqual(b.fx!.map((x) => x.k), ["flee"]);
});
test("ataque do inimigo que derruba o jogador grava golpe e derrota", () => {
  const b = state(5000, 99999), p = { hp: 1, mp: 100, gold: 0, lv: 1 };
  withRandom(0.99, () => step(b, p, stats({ hp: 1 }), "matematica", { a: "potion", k: "ea" }));
  assert.equal(b.over, "lose");
  const k = b.fx!.map((x) => `${x.k}`);
  assert.ok(k.includes("lose") && k.some((x) => x === "hit" || x === "crit"));
});
