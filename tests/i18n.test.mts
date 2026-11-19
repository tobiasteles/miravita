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
