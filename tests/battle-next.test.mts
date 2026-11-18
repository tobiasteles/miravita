// npm test  (ao entrar o próximo monstro, o painel de mensagens começa limpo)
import test from "node:test";
import assert from "node:assert/strict";
import { advanceWave, mkMon, type BState } from "../src/lib/game/battle";

const killed = (): BState => ({
  e: { ...mkMon(["Slime"], 1, false), hp: 0 }, q: [mkMon(["Fada Sombria"], 18, false)], wave: 2, dungeon: true, mapSlug: "pantano-radioativo", buf: 0, cu: 0, sv: null,
  log: ["✓ golpe final"], over: "wave", res: ["✅ Slime derrotado! +87 XP, +87g", "+2× Zircônio"], lv: 25, fx: [{ k: "win" }], fxSeq: 7,
});
test("próximo monstro: zera recompensas, aviso de nível e eventos; reinicia o log", () => {
  const b = killed();
  advanceWave(b);
  assert.deepEqual(b.res, []);
  assert.equal(b.lv, undefined);
  assert.deepEqual(b.fx, []);
  assert.equal(b.over, null);
  assert.equal(b.wave, 3);
  assert.equal(b.log.length, 1);
  assert.ok(b.log[0].includes("Fada Sombria"));
});
test("modo infinito usa a mensagem de aparição", () => {
  const b = killed();
  b.endless = true;
  advanceWave(b);
  assert.ok(b.log[0].startsWith("⚔ "));
});
