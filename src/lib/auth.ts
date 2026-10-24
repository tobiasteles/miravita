import { cookies } from "next/headers";
import { makeToken, readToken, SESSION_COOKIE, SESSION_DAYS } from "@/lib/auth-token";
export { hashPassword, verifyPassword } from "@/lib/auth-hash";
// id do usuário logado (ou null). Use em páginas, ações e rotas de API.
export async function getUserId() {
  return readToken((await cookies()).get(SESSION_COOKIE)?.value);
}
export async function startSession(userId: string) {
  (await cookies()).set(SESSION_COOKIE, await makeToken(userId), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_DAYS * 86_400,
  });
}
export async function endSession() {
  const c = await cookies();
  c.delete(SESSION_COOKIE);
  c.delete("mv_char");
}
