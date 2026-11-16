// Cookie de sessão assinado (HMAC-SHA256). Usa só Web Crypto, então roda no middleware (Edge) e no servidor.
// Formato:  <id da sessão>.<expira em ms>.<assinatura>
// O cookie NÃO diz quem é o usuário: o id da sessão é procurado na tabela `sessions` (src/lib/auth.ts).
// Assim, sair da conta ou trocar a senha apaga a sessão e o cookie deixa de valer na hora.
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
export async function makeToken(sessionId: string, exp: number) {
  const body = `${sessionId}.${exp}`;
  return `${body}.${await sign(body)}`;
}
// devolve o id da sessão se a assinatura for válida e o cookie não tiver expirado; senão null
export async function readToken(token: string | undefined | null): Promise<string | null> {
  if (!token || token.length > 200) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [sid, expStr, sig] = parts, exp = Number(expStr);
  if (!sid || !(exp > Date.now())) return null;
  const good = await sign(`${sid}.${expStr}`);
  if (good.length !== sig.length) return null;
  let diff = 0;
  for (let k = 0; k < good.length; k++) diff |= good.charCodeAt(k) ^ sig.charCodeAt(k); // comparação em tempo constante
  return diff === 0 ? sid : null;
}
