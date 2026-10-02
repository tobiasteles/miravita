import { NextResponse } from "next/server"; import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db"; import { chatMessages, characters } from "@/db/schema"; import { getActiveCharacter } from "@/lib/session";
export async function GET(req: Request) {
  const a = await getActiveCharacter(); const guild = new URL(req.url).searchParams.get("channel") === "guilda";
  if (guild && !a?.c.guildId) return NextResponse.json([]);
  const cond = guild ? and(eq(chatMessages.channel, "guilda"), eq(chatMessages.guildId, a!.c.guildId!)) : eq(chatMessages.channel, "global");
  const rows = await db.select({ id: chatMessages.id, who: characters.name, text: chatMessages.content }).from(chatMessages)
    .innerJoin(characters, eq(chatMessages.characterId, characters.id)).where(cond).orderBy(desc(chatMessages.createdAt)).limit(30);
  return NextResponse.json(rows.reverse());
}
export async function POST(req: Request) {
  const a = await getActiveCharacter(); if (!a) return NextResponse.json({ error: "no-char" }, { status: 401 });
  const { content, channel } = await req.json(); const t = String(content ?? "").trim().slice(0, 200); if (!t) return NextResponse.json({ ok: false });
  const guild = channel === "guilda"; if (guild && !a.c.guildId) return NextResponse.json({ error: "no-guild" }, { status: 403 });
  await db.insert(chatMessages).values({ channel: guild ? "guilda" : "global", guildId: guild ? a.c.guildId : null, characterId: a.c.id, content: t }); return NextResponse.json({ ok: true });
}
