"use server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword, startSession, endSession } from "@/lib/auth";
import { allow, blocked, clientIp, fail } from "@/lib/rate-limit";
import { getLang } from "@/i18n/server";
import type { Key } from "@/i18n/pt-BR";

const safeNext = (n: unknown) => (typeof n === "string" && n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/\\") ? n : "/characters");
// msg é uma CHAVE de erro (err.*): a tela traduz; texto livre nunca viaja na URL
const back = (page: string, msg: Key, next?: string) => redirect(`${page}?error=${encodeURIComponent(msg)}${next ? `&next=${encodeURIComponent(next)}` : ""}`);
const clean = (v: unknown, max: number) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max);
const WAIT = 15 * 60; // janela de 15 min para o limite de tentativas de login
const BAD_LOGIN: Key = "err.auth.badLogin";
// hash "de mentira": quando o email não existe, ainda gastamos o mesmo tempo do scrypt (não revela se a conta existe pelo tempo de resposta)
let dummy: Promise<string> | null = null;
const dummyHash = () => (dummy ??= hashPassword(randomUUID()));

export async function register(fd: FormData) {
  const ip = await clientIp(), next = safeNext(fd.get("next"));
  if (!(await allow(`reg:ip:${ip}`, 5, 3600))) return back("/sign-up", "err.auth.tooManyAccounts", next);
  const email = clean(fd.get("email"), 254).toLowerCase(), name = clean(fd.get("name"), 30);
  const pw = String(fd.get("password") ?? ""), pw2 = String(fd.get("password2") ?? "");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return back("/sign-up", "err.auth.email", next);
  if (pw.length < 8) return back("/sign-up", "err.auth.pwShort", next);
  if (pw.length > 128) return back("/sign-up", "err.auth.pwLong", next);
  if (pw.toLowerCase() === email) return back("/sign-up", "err.auth.pwEqualsEmail", next);
  if (pw !== pw2) return back("/sign-up", "err.auth.pwMismatch", next);
  const [ex] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (ex) return back("/sign-up", "err.auth.emailTaken", next);
  const id = randomUUID();
  try {
    await db.insert(users).values({ id, email, displayName: name || null, passwordHash: await hashPassword(pw), language: await getLang() });
  } catch {
    return back("/sign-up", "err.auth.emailTaken", next); // dois cadastros ao mesmo tempo
  }
  await startSession(id);
  redirect(next);
}
export async function login(fd: FormData) {
  const ip = await clientIp(), next = safeNext(fd.get("next"));
  const email = clean(fd.get("email"), 254).toLowerCase(), pw = String(fd.get("password") ?? "").slice(0, 129);
  const kIp = `login:ip:${ip}`, kEm = `login:em:${email}`;
  // só falhas contam: 20 por IP e 8 por email a cada 15 min
  if ((await blocked(kIp, 20)) || (await blocked(kEm, 8))) return back("/sign-in", "err.auth.tooMany", next);
  const [u] = email ? await db.select().from(users).where(eq(users.email, email)) : [];
  const ok = pw.length <= 128 && (await verifyPassword(pw, u?.passwordHash ?? (await dummyHash()))) && !!u?.passwordHash;
  if (!ok || !u) {
    await Promise.all([fail(kIp, WAIT), fail(kEm, WAIT)]);
    return back("/sign-in", BAD_LOGIN, next); // mesma mensagem para email inexistente, senha errada e conta sem senha
  }
  await startSession(u.id);
  // o idioma escolhido neste navegador vale e passa a ser o da conta (a tela de idioma já apareceu antes)
  await db.update(users).set({ language: await getLang() }).where(eq(users.id, u.id));
  redirect(next);
}
export async function logout() {
  await endSession();
  redirect("/");
}
