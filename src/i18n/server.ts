import { cookies, headers } from "next/headers";
import { DEFAULT_LANG, LANG_COOKIE, isLang, makeFmt, pickLang, type Lang } from "./core";
import { tFor } from "./index";

export async function getLang(): Promise<Lang> {
  const c = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(c) ? c : DEFAULT_LANG;
}
export async function getT() {
  const lang = await getLang();
  return { lang, t: tFor(lang), f: makeFmt(lang) };
}
export async function suggestedLang(): Promise<Lang> {
  return pickLang((await headers()).get("accept-language"));
}
// só em Server Actions / route handlers
export async function setLangCookie(lang: Lang) {
  (await cookies()).set(LANG_COOKIE, lang, { maxAge: 365 * 24 * 3600, path: "/", sameSite: "lax", httpOnly: true, secure: process.env.NODE_ENV === "production" });
}
