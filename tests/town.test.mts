// npm test  (cidade: dados de exibição usados pela cena 3D)
import test from "node:test";
import assert from "node:assert/strict";
import { SPOTS, expPhase, isNight } from "../src/lib/game/town";

test("expedição: nenhuma, em andamento ou pronta", () => {
  assert.equal(expPhase(null, 1000), "idle");
  assert.equal(expPhase(undefined, 1000), "idle");
  assert.equal(expPhase(2000, 1000), "running");
  assert.equal(expPhase(1000, 1000), "ready");
  assert.equal(expPhase(500, 1000), "ready");
});
test("noite visual: 19h às 6h", () => {
  assert.equal(isNight(18), false);
  assert.equal(isNight(19), true);
  assert.equal(isNight(2), true);
  assert.equal(isNight(6), false);
  assert.equal(isNight(12), false);
});
test("pontos clicáveis: ids únicos, dentro do quadro e com o portal do Reino", () => {
  assert.equal(new Set(SPOTS.map((s) => s.id)).size, SPOTS.length);
  for (const s of SPOTS) {
    assert.ok(s.x - s.w / 2 >= 0 && s.x + s.w / 2 <= 100, `${s.id} x`);
    assert.ok(s.y - s.h / 2 >= 0 && s.y + s.h / 2 <= 100, `${s.id} y`);
  }
  assert.ok(SPOTS.find((s) => s.id === "reino" && s.kind === "realm"));
  assert.ok(SPOTS.find((s) => s.id === "atividades"));
});
