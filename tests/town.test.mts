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

import { heroPx, heroSpot, MATE_DX } from "../src/lib/game/town";
test("personagem na cidade: altura proporcional com clamp e nunca acima de 35% da cena", () => {
  assert.equal(heroPx(800), 160); // desktop: 20%
  assert.equal(heroPx(560), 112); // notebook
  assert.equal(heroPx(224), 70); // celular: mínimo legível (31%)
  assert.equal(heroPx(3000), 170); // telão: teto
  for (const h of [120, 224, 400, 560, 800, 1200, 3000]) assert.ok(heroPx(h) <= h * 0.35 + 1e-9, `h=${h}`);
});
test("personagem na cidade: posição à esquerda da praça e ajuste para celular", () => {
  const d = heroSpot(1200), m = heroSpot(360);
  assert.ok(d.x < 50 && m.x < d.x && d.y > 55 && d.y < 80);
  assert.equal(MATE_DX.length, 3);
});
