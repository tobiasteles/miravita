// npm test  (dados de exibição do Códex)
import test from "node:test";
import assert from "node:assert/strict";
import { tablePos, shells, subshells, configText } from "../src/lib/game/periodic";

test("camadas: soma = número atômico e casos conhecidos", () => {
  for (let z = 1; z <= 118; z++) assert.equal(shells(z).reduce((a, b) => a + b, 0), z, `Z=${z}`);
  assert.deepEqual(shells(1), [1]);
  assert.deepEqual(shells(10), [2, 8]);
  assert.deepEqual(shells(26), [2, 8, 14, 2]);
  assert.deepEqual(shells(118), [2, 8, 18, 32, 32, 18, 8]);
  assert.equal(subshells(118).reduce((a, s) => a + s.e, 0), 118);
});
test("configuração em texto", () => {
  assert.equal(configText(26), "1s² 2s² 2p⁶ 3s² 3p⁶ 3d⁶ 4s²");
});
test("posição na tabela: 118 células distintas e pontos de referência", () => {
  const seen = new Set<string>();
  for (let z = 1; z <= 118; z++) {
    const [r, c] = tablePos(z);
    assert.ok(r >= 1 && r <= 10 && c >= 1 && c <= 18, `Z=${z}`);
    seen.add(`${r},${c}`);
  }
  assert.equal(seen.size, 118);
  assert.deepEqual(tablePos(2), [1, 18]);
  assert.deepEqual(tablePos(57), [9, 3]);
  assert.deepEqual(tablePos(71), [9, 17]);
  assert.deepEqual(tablePos(72), [6, 4]);
  assert.deepEqual(tablePos(103), [10, 17]);
  assert.deepEqual(tablePos(104), [7, 4]);
  assert.deepEqual(tablePos(118), [7, 18]);
});
