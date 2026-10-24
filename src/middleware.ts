import { NextResponse, type NextRequest } from "next/server";
import { readToken, SESSION_COOKIE } from "@/lib/auth-token";
// páginas e APIs que exigem login (sem sessão válida → vai para /sign-in)
const PRIV = ["/characters", "/play", "/api/chat", "/admin", "/map", "/gate", "/atividades", "/battle", "/skills", "/attributes", "/inventory", "/shop", "/quests", "/guild", "/party"];
export async function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;
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
