import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { battles, musicTracks } from "@/db/schema";
import { getActiveCharacter } from "@/lib/session";
import type { BState } from "@/lib/game/battle";
export const dynamic = "force-dynamic";
// Qual música tocar agora? Depende de onde o jogador está: página inicial, cidade, batalha ou Reino (e do mapa atual).
export async function GET(req: Request) {
  const path = new URL(req.url).searchParams.get("path") ?? "/";
  const a = await getActiveCharacter().catch(() => null);
  let ctx: "home" | "cidade" | "batalha" | "reino" = "cidade";
  if (path === "/" || path.startsWith("/sign") || path.startsWith("/characters") || !a) ctx = "home";
  else if (path.startsWith("/battle")) {
    const [row] = await db.select().from(battles).where(eq(battles.characterId, a.c.id));
    ctx = (row?.state as BState | undefined)?.dungeon ? "reino" : "batalha";
  }
  const slug = a?.map?.slug ?? null;
  let rows: (typeof musicTracks.$inferSelect)[] = [];
  try {
    rows = await db.select().from(musicTracks).where(and(eq(musicTracks.active, true), eq(musicTracks.context, ctx)));
  } catch {
    /* tabela ainda não criada */
  }
  const mine = rows.filter((r) => r.mapSlug && r.mapSlug === slug), pool = mine.length ? mine : rows.filter((r) => !r.mapSlug);
  const t = pool[Math.floor(Math.random() * pool.length)];
  return NextResponse.json(t ? { url: t.url, title: t.title, volume: t.volume, ctx, pinned: mine.length > 0 } : { url: null, ctx });
}
