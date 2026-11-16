// npm test  (usa o test runner do Node via tsx; não precisa de banco)
import test from "node:test";
import assert from "node:assert/strict";
process.env.AUTH_SECRET = "x".repeat(40);
process.env.CRON_SECRET = "segredo-de-teste-bem-longo";
const { makeToken, readToken } = await import("../src/lib/auth-token");
const { hashPassword, verifyPassword } = await import("../src/lib/auth-hash");
const { chatProblem } = await import("../src/lib/chat-filter");
const { cronAuthorized } = await import("../src/lib/cron-auth");

test("token: válido, adulterado, expirado e formato antigo", async () => {
  const exp = Date.now() + 60_000, t = await makeToken("sessao-1", exp);
  assert.equal(await readToken(t), "sessao-1");
  const [sid, e, sig] = t.split(".");
  assert.equal(await readToken(`outra.${e}.${sig}`), null); // trocar o id invalida a assinatura
  assert.equal(await readToken(`${sid}.${exp + 999}.${sig}`), null); // estender a validade também
  assert.equal(await readToken(await makeToken("s", Date.now() - 1)), null); // expirado
  assert.equal(await readToken("a.b.c.d"), null);
  assert.equal(await readToken(""), null);
  assert.equal(await readToken(undefined), null);
});
test("senha: scrypt com sal, certa e errada", async () => {
  const h = await hashPassword("senha-forte-123");
  assert.ok(h.startsWith("scrypt$"));
  assert.equal(await verifyPassword("senha-forte-123", h), true);
  assert.equal(await verifyPassword("senha-forte-124", h), false);
  assert.equal(await verifyPassword("x", null), false);
  assert.notEqual(h, await hashPassword("senha-forte-123")); // sal diferente a cada vez
});
test("chat: bloqueia palavrão, link e contato; deixa conversa normal passar", () => {
  assert.ok(chatProblem("vai tomar no c4ralho"));
  assert.ok(chatProblem("PUTAAAA"));
  assert.ok(chatProblem("entra em www.site.com"));
  assert.ok(chatProblem("https://exemplo.org/x"));
  assert.ok(chatProblem("me chama no zap 61 99999-0000"));
  assert.equal(chatProblem("alguém quer fazer o Reino às 19h?"), null);
  assert.equal(chatProblem("meu computador travou, vou reiniciar"), null); // "computador" não pode virar falso positivo
  assert.equal(chatProblem("Nível 150 chegou!"), null);
});
test("cron: só passa com o segredo certo", () => {
  const req = (h?: string) => new Request("http://x/api/cron", { headers: h ? { authorization: h } : {} });
  assert.equal(cronAuthorized(req(`Bearer ${process.env.CRON_SECRET}`)), true);
  assert.equal(cronAuthorized(req("Bearer undefined")), false);
  assert.equal(cronAuthorized(req()), false);
  process.env.CRON_SECRET = "";
  assert.equal(cronAuthorized(req("Bearer ")), false); // sem segredo configurado, ninguém passa
});
