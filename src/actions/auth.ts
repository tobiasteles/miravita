"use server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword, startSession, endSession } from "@/lib/auth";
import { allow, blocked, clientIp, fail } from "@/lib/rate-limit";

const safeNext = (n: unknown) => (typeof n === "string" && n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/\\") ? n : "/characters");
const back = (page: string, msg: string, next?: string) => redirect(`${page}?error=${encodeURIComponent(msg)}${next ? `&next=${encodeURIComponent(next)}` : ""}`);
const clean = (v: unknown, max: number) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max);
const WAIT = 15 * 60; // janela de 15 min para o limite de tentativas de login
const BAD_LOGIN = "Email ou senha incorretos.";
// hash "de mentira": quando o email não existe, ainda gastamos o mesmo tempo do scrypt (não revela se a conta existe pelo tempo de resposta)
let dummy: Promise<string> | null = null;
const dummyHash = () => (dummy ??= hashPassword(randomUUID()));

export async function register(fd: FormData) {
  const ip = await clientIp(), next = safeNext(fd.get("next"));
  if (!(await allow(`reg:ip:${ip}`, 5, 3600))) return back("/sign-up", "Muitas contas criadas deste lugar. Tente de novo mais tarde.", next);
  const email = clean(fd.get("email"), 254).toLowerCase(), name = clean(fd.get("name"), 30);
  const pw = String(fd.get("password") ?? ""), pw2 = String(fd.get("password2") ?? "");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return back("/sign-up", "Email inválido.", next);
  if (pw.length < 8) return back("/sign-up", "A senha precisa ter pelo menos 8 caracteres.", next);
  if (pw.length > 128) return back("/sign-up", "A senha pode ter no máximo 128 caracteres.", next);
  if (pw.toLowerCase() === email) return back("/sign-up", "A senha não pode ser igual ao email.", next);
  if (pw !== pw2) return back("/sign-up", "As senhas não são iguais.", next);
  const [ex] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (ex) return back("/sign-up", "Este email já tem conta. Entre ou peça a redefinição.", next);
  const id = randomUUID();
  try {
    await db.insert(users).values({ id, email, displayName: name || null, passwordHash: await hashPassword(pw) });
  } catch {
    return back("/sign-up", "Este email já tem conta. Entre ou peça a redefinição.", next); // dois cadastros ao mesmo tempo
  }
  await startSession(id);
  redirect(next);
}
export async function login(fd: FormData) {
  const ip = await clientIp(), next = safeNext(fd.get("next"));
  const email = clean(fd.get("email"), 254).toLowerCase(), pw = String(fd.get("password") ?? "").slice(0, 129);
  const kIp = `login:ip:${ip}`, kEm = `login:em:${email}`;
  // só falhas contam: 20 por IP e 8 por email a cada 15 min
  if ((await blocked(kIp, 20)) || (await blocked(kEm, 8))) return back("/sign-in", "Muitas tentativas. Aguarde alguns minutos e tente de novo.", next);
  const [u] = email ? await db.select().from(users).where(eq(users.email, email)) : [];
  const ok = pw.length <= 128 && (await verifyPassword(pw, u?.passwordHash ?? (await dummyHash()))) && !!u?.passwordHash;
  if (!ok || !u) {
    await Promise.all([fail(kIp, WAIT), fail(kEm, WAIT)]);
    return back("/sign-in", BAD_LOGIN, next); // mesma mensagem para email inexistente, senha errada e conta sem senha
  }
  await startSession(u.id);
  redirect(next);
}
export async function logout() {
  await endSession();
  redirect("/");
}
