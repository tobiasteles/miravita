// npm test  (barramento de eventos e cores da cena 3D; sem three.js)
import test from "node:test";
import assert from "node:assert/strict";
import { createStageBus, type StageEvent } from "../src/components/stage/bus";
import { fxColor } from "../src/components/stage/colors";

test("bus: entrega aos assinantes e para depois de cancelar", () => {
  const bus = createStageBus(), got: StageEvent[] = [];
  const off = bus.on((e) => got.push(e));
  bus.emit({ k: "crit", from: "me", to: "foe", d: 12 });
  off();
  bus.emit({ k: "win" });
  assert.equal(got.length, 1);
  assert.equal(got[0].k, "crit");
});
test("fxColor: hex passa, categoria vira cor, desconhecido cai no padrão", () => {
  assert.equal(fxColor("#123456"), "#123456");
  assert.equal(fxColor("gás nobre"), "#a78bfa");
  assert.equal(fxColor("xyz", "#000000"), "#000000");
  assert.equal(fxColor(undefined), "#e8e6ff");
});
