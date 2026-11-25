// npm test  (radioativos e tóxicos: quem é perigoso, taxas, decaimento, dose e proteção)
import test from "node:test";
import assert from "node:assert/strict";
import { CONT_LIMIT, DAUGHTER, GEAR, HAZ_Z, MAX_PEN, OUT_LIMIT, RADIO, doseNow, gameHalfLifeHours, isHazardous, isRadioactive, loadOf, penalty, protOf, rate, type Hz } from "../src/lib/game/hazard";
import { props } from "../src/lib/game/materials";
import { ELEMENT_BY_Z } from "../src/lib/game/elements";
import { BY_ID } from "../src/lib/game/reactions";

const z = (s: string) => [...ELEMENT_BY_Z.values()].find((e) => e[1] === s)![0];
test("quem é perigoso: radioativos e tóxicos; ferro, ouro e cobre não", () => {
  for (const s of ["U", "Pu", "Ra", "Tc", "Po", "Pb", "As", "Cd", "Hg", "Be", "Tl", "Cl", "F"]) assert.ok(isHazardous(z(s)), s);
  for (const s of ["Fe", "Au", "Cu", "Al", "C", "O", "H", "Si", "Zn", "Ti"]) assert.ok(!isHazardous(z(s)) && rate(z(s)) === null, s);
  assert.ok(HAZ_Z.length > 40);
});
test("taxas: meia-vida curta é pior; tox 3 pesa mais que tox 2", () => {
  assert.ok(rate(z("Po"))!.r > rate(z("Ra"))!.r && rate(z("Ra"))!.r > rate(z("U"))!.r);
  assert.equal(rate(z("U"))!.kind, "rad");
  assert.equal(rate(z("Pb"))!.kind, "tox");
  assert.ok(rate(z("Pb"))!.r > rate(z("Sb"))!.r); // Sb tox 2, Pb tox 3
});
test("decaimento: todo radioativo tem filho real, com Z menor, e a cadeia termina num elemento estável", () => {
  for (let n = 1; n <= 118; n++) {
    if (!isRadioactive(n)) { assert.equal(DAUGHTER[n], undefined, `estável ${n} não decai`); continue; }
    let cur = n, steps = 0;
    while (isRadioactive(cur)) { const d = DAUGHTER[cur]; assert.ok(d && d >= 1 && d < cur + 2 && d !== cur, `Z=${cur}`); cur = d; assert.ok(++steps < 60, `cadeia de ${n} não termina`); }
    assert.ok(!isRadioactive(cur));
  }
  assert.equal(DAUGHTER[z("U")], z("Th")); assert.equal(DAUGHTER[z("Ra")], z("Rn")); assert.equal(DAUGHTER[z("Po")], z("Pb"));
});
test("meia-vida no tempo do jogo: limitada entre 6 h e 14 dias e crescente", () => {
  for (const n of HAZ_Z.filter(isRadioactive)) { const h = gameHalfLifeHours(n); assert.ok(h >= 6 && h <= 336, `Z=${n} ${h}`); }
  assert.ok(gameHalfLifeHours(z("U")) > gameHalfLifeHours(z("Ra")) && gameHalfLifeHours(z("Ra")) > gameHalfLifeHours(z("Po")));
  assert.equal(gameHalfLifeHours(z("Fe")), Infinity);
});
test("carga: o excesso acima do limite não aumenta a exposição", () => {
  const a = loadOf([{ z: z("Pb"), qty: OUT_LIMIT }]), b = loadOf([{ z: z("Pb"), qty: OUT_LIMIT * 10 }]);
  assert.ok(Math.abs(a.tox - b.tox) < 1e-9);
  assert.deepEqual(loadOf([{ z: z("Fe"), qty: 99 }]), { rad: 0, tox: 0 });
});
test("dose: sobe com a carga, tem teto, cai sem carga e a penalidade tem teto de 30%", () => {
  const now = 1_000_000_000_000, h = (n: number) => now + n * 3.6e6;
  const exp: Hz = { at: now, da: now, dose: 0, load: loadOf([{ z: z("Pu"), qty: 10 }]), prot: { rad: 0, tox: 0 } };
  assert.ok(doseNow(exp, h(5)) > 0 && doseNow(exp, h(10)) > doseNow(exp, h(5)));
  assert.equal(doseNow(exp, h(100000)), 100);
  assert.equal(doseNow({ ...exp, load: { rad: 0, tox: 0 }, dose: 50 }, h(2)), 30); // −10/h sem carga
  assert.equal(doseNow({ ...exp, load: { rad: 0, tox: 0 }, dose: 5 }, h(5)), 0);
  assert.equal(doseNow(null), 0);
  assert.equal(penalty(100), MAX_PEN); assert.ok(penalty(50) > 0 && penalty(50) < MAX_PEN);
});
test("proteção reduz a exposição; chumbo protege da radiação e EPI do tóxico", () => {
  assert.deepEqual(protOf(false, false), { rad: 0, tox: 0 });
  assert.ok(Math.abs(protOf(true, false).rad - 0.6) < 1e-9 && protOf(true, false).tox === 0);
  assert.ok(Math.abs(protOf(false, true).tox - 0.6) < 1e-9 && protOf(false, true).rad > 0);
  const base: Hz = { at: 0, da: 0, dose: 0, load: loadOf([{ z: z("Pu"), qty: 10 }, { z: z("Pb"), qty: 10 }]), prot: protOf(false, false) };
  assert.ok(doseNow({ ...base, prot: protOf(true, true) }, 3.6e6 * 10) < doseNow(base, 3.6e6 * 10));
});
test("receitas de proteção e usos da radioatividade usam elementos e compostos que existem", () => {
  assert.ok(CONT_LIMIT > OUT_LIMIT);
  for (const g of Object.values(GEAR)) for (const [n] of g.inp) assert.ok(props(n), g.name);
  for (const r of Object.values(RADIO)) { assert.ok(r.n > 0); for (const [n] of r.inp) assert.ok(isRadioactive(n), `${n} deve ser radioativo`); }
  for (const id of ["cds", "sulfamon", "cuso4"]) assert.ok(BY_ID.has(id), id);
});
