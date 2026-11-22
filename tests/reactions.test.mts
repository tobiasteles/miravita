// npm test  (laboratório: toda reação conserva átomos; misturas sem ambiguidade; acidentes; nomes e usos dos compostos)
import test from "node:test";
import assert from "node:assert/strict";
import { atoms, BY_ID, COMPOUND_PT, COMPOUNDS, compoundValue, DANGERS, elementOf, equation, findDanger, findReaction, mixKey, needs, norm, PARSED, pretty, REACTIONS, reactionKey, STARTERS, USES, yields, balanced } from "../src/lib/game/reactions";

test("parser de fórmulas", () => {
  assert.deepEqual(atoms("H2SO4"), { H: 2, S: 1, O: 4 });
  assert.deepEqual(atoms("Ca(OH)2"), { Ca: 1, O: 2, H: 2 });
  assert.deepEqual(atoms("C2H5OH"), { C: 2, H: 6, O: 1 });
  assert.deepEqual(atoms("C6H12O6"), { C: 6, H: 12, O: 6 });
  assert.throws(() => atoms("h2o"));
});
test("há pelo menos 25 reações, ids únicos, e os 4 compostos iniciais estão no Caderno", () => {
  assert.ok(REACTIONS.length >= 25);
  assert.equal(new Set(REACTIONS.map((r) => r.id)).size, REACTIONS.length);
  assert.deepEqual(STARTERS.sort(), ["agua", "co2", "quartzo", "sal"]);
});
test("TODA reação conserva os átomos (equação balanceada)", () => {
  for (const p of PARSED) assert.ok(balanced(p), `${p.id}: ${equation(p)}`);
});
test("toda espécie é um elemento (ou diatômico) ou um composto com nome em português", () => {
  for (const p of PARSED) for (const t of [...p.left, ...p.right]) assert.ok(elementOf(t.sp) || COMPOUND_PT[t.sp], `${p.id}: ${t.sp}`);
  for (const c of COMPOUNDS) assert.ok(COMPOUND_PT[c], c);
  for (const u of Object.keys(USES)) assert.ok(COMPOUND_PT[u], u);
});
test("cada mistura leva a UMA reação (sem ambiguidade) e nenhum acidente coincide com uma reação", () => {
  const keys = PARSED.map(reactionKey);
  assert.equal(new Set(keys).size, keys.length, "duas reações com os mesmos reagentes");
  for (const d of DANGERS) { assert.equal(findReaction(d.mix), null, d.mix.join("+")); assert.ok(d.hp > 0 && d.hp < 0.2); assert.ok(findDanger(d.mix)); }
  assert.equal(findReaction(["H", "O"])?.id, "agua");
  assert.equal(findReaction(["O2", "H2"])?.id, "agua"); // "O2" e "O" são o mesmo reagente
  assert.equal(findReaction(["C6H12O6", "H2SO4"])?.id, "carbono"); // o catalisador entra na mistura
  assert.equal(findReaction(["C6H12O6"])?.id, "etanol");
  assert.equal(findReaction(["He", "Ne"]), null);
  assert.equal(mixKey(["H2", "O"]), mixKey(["O", "H"]));
});
test("custo em elementos: água gasta 4 H + 2 O e rende 2 H₂O (a economia das receitas antigas)", () => {
  const w = BY_ID.get("agua")!, n = needs(w);
  assert.deepEqual(n.map((x) => [x.sym, x.q]), [["H", 4], ["O", 2]]);
  assert.deepEqual(yields(w).map((x) => [x.sp, x.q]), [["H2O", 2]]);
  const s = needs(BY_ID.get("sal")!);
  assert.deepEqual(s.map((x) => [x.sym, x.q]), [["Na", 2], ["Cl", 2]]); // 1 Na + 1 Cl por NaCl, como antes
  assert.deepEqual(needs(BY_ID.get("quartzo")!).map((x) => [x.sym, x.q]), [["Si", 1], ["O", 2]]);
});
test("gases liberados não vão para o inventário; carbono volta como elemento (insumo de forja)", () => {
  assert.ok(yields(BY_ID.get("naoh")!).find((x) => x.sp === "H2")!.gas);
  const c = yields(BY_ID.get("carbono")!).find((x) => x.sp === "C")!;
  assert.ok(c.el === 6 && c.q === 6 && !c.gas);
});
test("exibição e valores", () => {
  assert.equal(pretty("H2SO4"), "H₂SO₄");
  assert.equal(equation(BY_ID.get("agua")!), "2 H₂ + O₂ → 2 H₂O");
  assert.equal(equation(BY_ID.get("naoh")!), "2 Na + 2 H₂O → 2 NaOH + H₂↑");
  assert.equal(norm("Cl2"), "Cl");
  assert.ok(compoundValue("C6H12O6") > compoundValue("H2O") && compoundValue("H2O") > 0);
});

import { STORY } from "../src/lib/game/story";
test("missões que ensinam receitas apontam para reações que existem", () => {
  const ids = STORY.flatMap((q) => q.rw.learn ?? []);
  assert.ok(ids.length >= 6);
  for (const id of ids) assert.ok(BY_ID.has(id), id);
  assert.equal(new Set(ids).size, ids.length, "receita ensinada por duas missões");
});
