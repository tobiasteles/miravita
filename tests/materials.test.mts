// npm test  (fabricação: quem pode virar equipamento, fórmulas dos status e ligas)
import test from "node:test";
import assert from "node:assert/strict";
import { ALLOYS, CRAFTABLE_Z, canCraft, craftCheck, craftStats, isRadioactive, material, nearestCraftable, props } from "../src/lib/game/materials";
import { MAT_ROWS } from "../src/lib/game/materials-data";
import { ELEMENT_BY_Z } from "../src/lib/game/elements";

const sym = (z: number) => ELEMENT_BY_Z.get(z)![1];
test("dataset: 118 elementos, sem repetição, valores plausíveis", () => {
  assert.equal(MAT_ROWS.length, 118);
  assert.deepEqual(MAT_ROWS.map((r) => r[0]), Array.from({ length: 118 }, (_, i) => i + 1));
  for (const [z, st, dens, mp, cond, re, tox, hl] of MAT_ROWS) {
    assert.ok(["s", "l", "g"].includes(st) && dens > 0 && cond >= 0 && re >= 0 && re <= 3 && tox >= 0 && tox <= 3 && hl >= 0, `Z=${z}`);
    assert.ok(mp > -300 && mp < 4000, `Z=${z} fusão`);
  }
});
test("só sólidos estáveis e seguros fabricam; os exemplos do enunciado entram e os proibidos saem", () => {
  for (const s of ["Fe", "Ti", "Cr", "Ni", "Cu", "Al", "W", "Co", "Zn"]) assert.ok(canCraft([...ELEMENT_BY_Z.values()].find((e) => e[1] === s)![0]), s);
  const proibidos: Record<string, string> = { O: "gas", H: "gas", Cl: "gas", Br: "liquid", Hg: "liquid", Na: "reactive", K: "reactive", Li: "reactive", F: "gas", U: "radioactive", Ra: "radioactive", Pu: "radioactive", Pb: "toxic", As: "toxic", Cd: "toxic", Si: "brittle", Sn: "soft", C: "soft" };
  for (const [s, why] of Object.entries(proibidos)) { const z = [...ELEMENT_BY_Z.values()].find((e) => e[1] === s)![0], c = craftCheck(z); assert.ok(!c.ok && c.why === why, `${s}: ${JSON.stringify(c)}`); }
  for (const z of CRAFTABLE_Z) { const p = props(z)!; assert.ok(p.state === "s" && p.halfLife === 0 && p.tox < 2 && p.react < 2 && p.meltC >= 400, sym(z)); }
});
test("nenhum radioativo, gás ou líquido jamais fabrica (todos os 118)", () => {
  for (let z = 1; z <= 118; z++) { const p = props(z)!; if (isRadioactive(z) || p.state !== "s") assert.ok(!canCraft(z) && material(`e:${z}`) === null, sym(z)); }
});
test("fórmulas dos status: ferro perto do antigo; mais duro = mais dano e durabilidade; mais denso = mais peso e defesa", () => {
  const fe = material("e:26")!, ti = material("e:22")!, w = material("e:74")!;
  const a = craftStats(fe, "arma"), d = craftStats(fe, "armadura");
  assert.ok(Math.abs((a.atk ?? 0) - 16) <= 2 && Math.abs((a.durability ?? 0) - 138) <= 10, JSON.stringify(a)); // antes: atk 16, dur 138
  assert.ok(craftStats(ti, "arma").atk! > a.atk! && craftStats(ti, "arma").durability! > a.durability!);
  assert.ok(craftStats(w, "arma").weight > a.weight && craftStats(w, "armadura").def! > d.def!);
  assert.equal(a.weight, Math.round(1.2 * 7.87));
  assert.equal(a.fire, Math.round(1538 / 100));
  assert.ok(craftStats(material("e:29")!, "arma").mp! > a.mp!); // cobre conduz mais que ferro → mais afinidade com energia
  assert.equal(craftStats(w, "arma").fire, 30); // limite de 30%
  assert.deepEqual(craftStats(fe, "arma"), craftStats(fe, "arma")); // determinístico
});
test("ligas: 5 unidades, ingredientes reais e propriedades de liga", () => {
  assert.deepEqual(ALLOYS.map((a) => a.id).sort(), ["aco", "bronze", "ceramica", "dural", "inox", "latao"]);
  for (const al of ALLOYS) { assert.equal(al.inp.reduce((s, [, q]) => s + q, 0), 5, al.id); const m = material(`a:${al.id}`)!; assert.ok(m && m.inp.length === al.inp.length); }
  const aco = material("a:aco")!, fe = material("e:26")!;
  assert.deepEqual(ALLOYS.find((a) => a.id === "aco")!.inp, [[26, 4], [6, 1]]); // aço = Fe + C
  assert.deepEqual(ALLOYS.find((a) => a.id === "bronze")!.inp, [[29, 4], [50, 1]]); // bronze = Cu + Sn
  assert.deepEqual(ALLOYS.find((a) => a.id === "latao")!.inp, [[29, 3], [30, 2]]); // latão = Cu + Zn
  assert.ok(craftStats(aco, "arma").atk! > craftStats(fe, "arma").atk!); // aço é mais duro que o ferro
  const cer = material("a:ceramica")!;
  assert.ok(cer.noWeapon && cer.brittle && craftStats(cer, "armadura").durability! < craftStats(fe, "armadura").durability!);
});
test("recompensa de elemento que não fabrica vira o fabricável de raridade mais próxima", () => {
  for (let z = 1; z <= 118; z++) assert.ok(canCraft(nearestCraftable(z)), sym(z));
  assert.equal(nearestCraftable(26), 26);
});
