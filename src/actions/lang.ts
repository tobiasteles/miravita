"use server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getUserId } from "@/lib/auth";
import { allow, clientIp } from "@/lib/rate-limit";
import { isLang } from "@/i18n/core";
import { setLangCookie } from "@/i18n/server";

const safeNext = (n: unknown) => (typeof n === "string" && n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/\\") ? n : "/");

// escolha de idioma (tela inicial /idioma e seletor do menu): cookie mv_lang por 1 ano + users.language se houver login
export async function setLanguage(fd: FormData) {
  const lang = fd.get("lang"), next = safeNext(fd.get("next"));
  if (!isLang(lang) || !(await allow(`lang:ip:${await clientIp()}`, 30, 60))) redirect(next);
  await setLangCookie(lang);
  const userId = await getUserId();
  if (userId) await db.update(users).set({ language: lang }).where(eq(users.id, userId));
  redirect(next);
}
