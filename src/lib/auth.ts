import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { makeToken, readToken, SESSION_COOKIE, SESSION_DAYS } from "@/lib/auth-token";
export { hashPassword, verifyPassword } from "@/lib/auth-hash";
// id da sessão do cookie (assinatura e validade conferidas; ainda não olha o banco)
export async function getSessionId() {
  return readToken((await cookies()).get(SESSION_COOKIE)?.value);
}
// id do usuário logado (ou null). A sessão precisa existir no banco e não ter expirado.
export async function getUserId() {
  const sid = await getSessionId();
  if (!sid) return null;
  const [r] = await db.select({ u: sessions.userId }).from(sessions).where(and(eq(sessions.id, sid), gt(sessions.expiresAt, sql`now()`))).limit(1);
  return r?.u ?? null;
}
export async function startSession(userId: string) {
  const sid = randomUUID(), exp = Date.now() + SESSION_DAYS * 86_400_000;
  await db.insert(sessions).values({ id: sid, userId, expiresAt: new Date(exp) });
  (await cookies()).set(SESSION_COOKIE, await makeToken(sid, exp), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_DAYS * 86_400,
  });
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date())).catch(() => {}); // limpeza oportunista das vencidas
}
export async function endSession() {
  const c = await cookies(), sid = await getSessionId();
  if (sid) await db.delete(sessions).where(eq(sessions.id, sid)).catch(() => {});
  c.delete(SESSION_COOKIE);
  c.delete("mv_char");
}
// encerra TODAS as sessões do usuário (use ao trocar a senha)
export async function endAllSessions(userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}
