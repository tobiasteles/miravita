// npm test  (paridade pt-BR/en, interpolação, Accept-Language e conteúdo do jogo traduzido)
import test from "node:test";
import assert from "node:assert/strict";
import { ptBR } from "../src/i18n/pt-BR";
import { en } from "../src/i18n/en";
import { errKey, pickLang, tFor, subset, makeFmt } from "../src/i18n";
import { classesEn, blocksEn, traitsEn } from "../src/i18n/content/en";
import { CLASS_KEYS, BLOCKS } from "../src/lib/game/classes";

const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
test("toda chave existe nos dois idiomas, sem texto vazio", () => {
  assert.deepEqual(Object.keys(en).sort(), Object.keys(ptBR).sort());
  for (const [k, v] of Object.entries(en)) assert.ok(v.trim().length > 0, `en vazio: ${k}`);
});
test("as variáveis {x} são as mesmas nos dois idiomas", () => {
  for (const k of Object.keys(ptBR) as (keyof typeof ptBR)[]) assert.equal(vars(en[k]), vars(ptBR[k]), k);
});
test("t(): interpolação e fallback para a chave", () => {
  assert.equal(tFor("en")("char.title", { n: 3 }), "Your characters (3/6)");
  assert.equal(tFor("pt-BR")("char.level", { n: 12 }), "Nv. 12");
  assert.equal(tFor("en")("nao.existe" as never), "nao.existe");
});
test("?error= só aceita chaves err.* que existem", () => {
  assert.equal(errKey("err.auth.badLogin"), "err.auth.badLogin");
  assert.equal(errKey("err.nao.existe"), null);
  assert.equal(errKey("auth.signIn"), null);
  assert.equal(errKey("<script>alert(1)</script>"), null);
  assert.equal(errKey(undefined), null);
});
test("Accept-Language só pré-seleciona", () => {
  assert.equal(pickLang("pt-BR,pt;q=0.9,en;q=0.8"), "pt-BR");
  assert.equal(pickLang("en-US,en;q=0.9"), "en");
  assert.equal(pickLang("en;q=0.5, pt;q=0.9"), "pt-BR");
  assert.equal(pickLang("fr-FR,fr;q=0.9"), "pt-BR");
  assert.equal(pickLang(null), "pt-BR");
});
test("subset devolve só os prefixos pedidos, no idioma certo", () => {
  const s = subset("en", "char.", "err.char.");
  assert.ok(Object.keys(s).length > 5 && Object.keys(s).every((k) => k.startsWith("char.") || k.startsWith("err.char.")));
  assert.equal(s["char.play"], "Play");
});
test("números e datas pelo Intl", () => {
  assert.equal(makeFmt("pt-BR").n(1234.5), "1.234,5");
  assert.equal(makeFmt("en").n(1234.5), "1,234.5");
});
test("conteúdo do jogo: toda classe, bloco e traço tem versão em inglês", () => {
  for (const k of CLASS_KEYS) assert.ok(classesEn[k]?.name && classesEn[k]?.desc, `classe ${k}`);
  for (const [b] of BLOCKS) assert.ok(blocksEn[b], `bloco ${b}`);
  for (const id of ["analitico", "empatico", "criativo", "resiliente"]) assert.ok(traitsEn[id]?.name && traitsEn[id]?.desc, `traço ${id}`);
});

import { elementsEn, mapsEn, realmsEn, spotsEn } from "../src/i18n/content/en";
import { REALMS } from "../src/lib/game/realms";
import { SPOTS } from "../src/lib/game/town";
import { ELEMENTS } from "../src/lib/game/elements";
test("conteúdo do mundo: prédios, reinos e elementos têm versão em inglês", () => {
  for (const s of SPOTS) assert.ok(spotsEn[s.id]?.label && spotsEn[s.id]?.merchant && spotsEn[s.id]?.line, `prédio ${s.id}`);
  for (const r of Object.values(REALMS)) assert.ok(realmsEn[r.name]?.name && realmsEn[r.name]?.tagline, `reino ${r.name}`);
  for (const slug of ["planicie-de-aurora", "floresta-sussurrante", "deserto-cinzento", "montanha-de-ferro", "pantano-radioativo", "abismo-do-cacador"]) assert.ok(mapsEn[slug], slug);
  assert.equal(elementsEn.length, 118);
  assert.equal(ELEMENTS.length, 118);
  assert.equal(new Set(elementsEn).size, 118);
});

import { skillsEn, tiersEn, monstersEn } from "../src/i18n/content/en";
import { BESTIARY } from "../src/lib/game/bestiary";
import { SKILLS, TIERS } from "../src/lib/game/classdata";
import { skillDesc } from "../src/i18n/skills";
import { step, mkMon, TX_PT, type BState, type Stats, type Tx } from "../src/lib/game/battle";
test("poderes: 12 nomes em inglês por classe, 12 camadas e descrições em inglês", () => {
  for (const cls of CLASS_KEYS) {
    assert.equal(skillsEn[cls]?.length, 12, cls);
    for (const n of skillsEn[cls]) assert.ok(n.trim());
    assert.equal(new Set(skillsEn[cls]).size, 12, `${cls}: nomes repetidos`);
  }
  assert.equal(tiersEn.length, TIERS.length);
  for (const s of SKILLS.fisica) assert.ok(skillDesc("en", s).length > 5 && !/[áàâãéêíóôõúç]/i.test(skillDesc("en", s).replace(/Ruptur/g, "")), s.n);
  assert.equal(skillDesc("pt-BR", SKILLS.fisica[0]), SKILLS.fisica[0].d); // o texto em português gerado bate com o de classdata.ts
  assert.equal(skillDesc("pt-BR", SKILLS.fisica[11]), SKILLS.fisica[11].d);
});
test("bestiário: os 150 monstros têm nome em inglês", () => {
  for (const m of Object.values(BESTIARY)) for (const n of [...m.mons, ...m.sub, ...m.boss]) assert.ok(monstersEn[n], n);
});
test("motor de combate: as mensagens saem no idioma pedido (sem português solto em inglês)", () => {
  const p = { hp: 200, mp: 100, gold: 0, lv: 150 };
  const q = new Proxy({ main: "fis", hp: 200, mp: 100, pam: 100, atk: 50, pof: 50, poa: 50, dfF: 5, dfM: 5, foco: 50, refl: 10, rupD: 60, estab: 12 } as Record<string, number | string>, { get: (t, k: string) => (k in t ? t[k] : 0) }) as unknown as Stats;
  const en: Tx = { t: tFor("en"), sk: (cls, i, pt) => skillsEn[cls]?.[i] ?? pt, skPt: (pt) => pt, mon: (n) => monstersEn[n] ?? n };
  const r = Math.random; Math.random = () => 0.5;
  try {
    const mk = (): BState => ({ e: { ...mkMon(["Slime de Cinza"], 1, false), hp: 5000, mx: 5000, atk: 1 }, q: [], wave: 1, dungeon: false, mapSlug: "planicie-de-aurora", buf: 0, cu: 0, sv: null, log: [], over: null, res: [], pa: 100, used: {} });
    const b = mk(), b2 = mk();
    step(b, { ...p }, q, "matematica", { a: "skill", i: 0, m: 2 }, null, en);
    step(b2, { ...p }, q, "matematica", { a: "skill", i: 0, m: 2 }, null, TX_PT);
    assert.ok(b.log.some((l) => l.includes("Linear Cut") && l.includes("damage") && l.includes("PERFECT")), b.log.join(" | "));
    assert.ok(b.log.every((l) => !/de dano|PERFEITO/.test(l)));
    assert.ok(b2.log.some((l) => l.includes("Corte Linear") && l.includes("de dano") && l.includes("PERFEITO")), b2.log.join(" | "));
  } finally { Math.random = r; }
});

import { monsterName, skillNameByPt } from "../src/i18n/content";
test("nome do monstro: prefixos de chefe/sub-chefe, nome da IA e idioma português intacto", () => {
  assert.equal(monsterName("en", "Slime de Cinza"), "Ash Slime");
  assert.equal(monsterName("en", "👑 Quimera de Aurora"), "👑 Aurora Chimera");
  assert.equal(monsterName("en", "⭐ Javali Matriarca"), "⭐ Matriarch Boar");
  assert.equal(monsterName("en", "Sombra Ímpar", "Peerless Shade"), "Peerless Shade"); // monstro da IA: nome em inglês vem do banco
  assert.equal(monsterName("en", "Monstro Novo"), "Monstro Novo"); // sem versão: cai no português, nunca quebra
  assert.equal(monsterName("pt-BR", "👑 Quimera de Aurora", "Aurora Chimera"), "👑 Quimera de Aurora");
});
test("nome de poder pelo nome em português (invocados e poderes do fantasma)", () => {
  assert.equal(skillNameByPt("en", "Golem de Pedra"), "Stone Golem");
  assert.equal(skillNameByPt("pt-BR", "Golem de Pedra"), "Golem de Pedra");
  assert.equal(skillNameByPt("en", "Poder Desconhecido"), "Poder Desconhecido");
});
