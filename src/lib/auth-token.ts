// Sessão assinada (HMAC-SHA256). Usa só Web Crypto, então roda no middleware (Edge) e no servidor.
// Formato do cookie:  <userId>.<expira em ms>.<assinatura>
export const SESSION_COOKIE = "mv_session";
export const SESSION_DAYS = 30;
const enc = new TextEncoder();
function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("Defina AUTH_SECRET no .env.local (mínimo 32 caracteres). Gere com: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
  return s;
}
const b64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
async function sign(data: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}
export async function makeToken(userId: string) {
  const exp = Date.now() + SESSION_DAYS * 86_400_000, body = `${userId}.${exp}`;
  return `${body}.${await sign(body)}`;
}
// devolve o id do usuário se o cookie for válido e não tiver expirado; senão null
export async function readToken(token: string | undefined | null): Promise<string | null> {
  if (!token) return null;
  const i = token.lastIndexOf("."), j = token.lastIndexOf(".", i - 1);
  if (i < 0 || j < 0) return null;
  const body = token.slice(0, i), sig = token.slice(i + 1), exp = Number(token.slice(j + 1, i)), userId = token.slice(0, j);
  if (!userId || !(exp > Date.now())) return null;
  const good = await sign(body);
  if (good.length !== sig.length) return null;
  let diff = 0;
  for (let k = 0; k < good.length; k++) diff |= good.charCodeAt(k) ^ sig.charCodeAt(k); // comparação em tempo constante
  return diff === 0 ? userId : null;
}
