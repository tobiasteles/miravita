"use server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword, startSession, endSession } from "@/lib/auth";

const safeNext = (n: unknown) => (typeof n === "string" && n.startsWith("/") && !n.startsWith("//") ? n : "/characters");
const back = (page: string, msg: string, next?: string) => redirect(`${page}?error=${encodeURIComponent(msg)}${next ? `&next=${encodeURIComponent(next)}` : ""}`);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function register(fd: FormData) {
  const email = String(fd.get("email") ?? "").trim().toLowerCase(), name = String(fd.get("name") ?? "").trim().slice(0, 30);
  const pw = String(fd.get("password") ?? ""), pw2 = String(fd.get("password2") ?? ""), next = safeNext(fd.get("next"));
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return back("/sign-up", "Email inválido.", next);
  if (pw.length < 8) return back("/sign-up", "A senha precisa ter pelo menos 8 caracteres.", next);
  if (pw !== pw2) return back("/sign-up", "As senhas não são iguais.", next);
  const [ex] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (ex) return back("/sign-up", "Este email já tem conta. Entre ou peça a redefinição.", next);
  const id = randomUUID();
  await db.insert(users).values({ id, email, displayName: name || null, passwordHash: await hashPassword(pw) });
  await startSession(id);
  redirect(next);
}
export async function login(fd: FormData) {
  const email = String(fd.get("email") ?? "").trim().toLowerCase(), pw = String(fd.get("password") ?? ""), next = safeNext(fd.get("next"));
  const [u] = await db.select().from(users).where(eq(users.email, email));
  if (!u?.passwordHash) {
    await wait(500);
    return back("/sign-in", u ? "Esta conta ainda não tem senha. Peça ao administrador para definir uma." : "Email ou senha incorretos.", next);
  }
  if (!(await verifyPassword(pw, u.passwordHash))) {
    await wait(500); // freia tentativas em massa
    return back("/sign-in", "Email ou senha incorretos.", next);
  }
  await startSession(u.id);
  redirect(next);
}
export async function logout() {
  await endSession();
  redirect("/");
}
