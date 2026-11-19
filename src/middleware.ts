import { NextResponse, type NextRequest } from "next/server";
import { readToken, SESSION_COOKIE } from "@/lib/auth-token";
import { LANG_COOKIE } from "@/i18n/core";
// páginas e APIs que exigem login (sem sessão válida → vai para /sign-in)
const PRIV = ["/characters", "/play", "/api/chat", "/admin", "/map", "/gate", "/arena", "/atividades", "/battle", "/skills", "/attributes", "/inventory", "/shop", "/quests", "/guild", "/party", "/codex"];
// primeira visita (sem cookie mv_lang): escolher o idioma antes de entrar. Só navegação (GET); APIs, imagens, robôs e a própria tela ficam de fora.
const LANG_FREE = ["/idioma", "/api", "/_next", "/brand", "/opengraph-image", "/icon.svg"];
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|lighthouse/i;
export async function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;
  if (req.method === "GET" && !req.cookies.get(LANG_COOKIE) && !LANG_FREE.some((x) => p === x || p.startsWith(x + "/")) && !BOT.test(req.headers.get("user-agent") ?? "")) {
    const url = req.nextUrl.clone();
    url.pathname = "/idioma";
    url.search = `?next=${encodeURIComponent(p + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  if (!PRIV.some((x) => p === x || p.startsWith(x + "/"))) return NextResponse.next();
  if (await readToken(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();
  if (p.startsWith("/api/")) return NextResponse.json({ error: "Faça login." }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/sign-in";
  url.search = `?next=${encodeURIComponent(p)}`;
  return NextResponse.redirect(url);
}
export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};
