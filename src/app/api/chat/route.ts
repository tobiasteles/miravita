import { NextResponse } from "next/server"; import { and, desc, eq, gt, or, sql, count } from "drizzle-orm"; import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db"; import { chatMessages, characters, partyMembers } from "@/db/schema"; import { getActiveCharacter } from "@/lib/session";
// regras por canal: cooldown (s), tamanho máximo, nível mínimo. Limite global: 20 mensagens/min por personagem.
const RULES = { local: { cd: 2, max: 120, lv: 1 }, privado: { cd: 1, max: 200, lv: 1 }, grito: { cd: 30, max: 80, lv: 5 }, guilda: { cd: 1, max: 200, lv: 1 }, grupo: { cd: 1, max: 200, lv: 1 } } as const;
type Ch = keyof typeof RULES; const isCh = (x: unknown): x is Ch => typeof x === "string" && x in RULES;
export async function GET(req: Request) {
  const a = await getActiveCharacter(); const ch = new URL(req.url).searchParams.get("channel"); if (!a || !isCh(ch)) return NextResponse.json([]);
  const me = a.c.id, t = alias(characters, "t"); const [pm] = await db.select({ pid: partyMembers.partyId }).from(partyMembers).where(eq(partyMembers.characterId, me));
  const cond = ch === "grupo" ? (pm ? and(eq(chatMessages.channel, "grupo"), eq(chatMessages.partyId, pm.pid)) : sql`false`) : ch === "guilda" ? (a.c.guildId ? and(eq(chatMessages.channel, "guilda"), eq(chatMessages.guildId, a.c.guildId)) : sql`false`)
    : ch === "local" ? (a.map ? and(eq(chatMessages.channel, "local"), eq(chatMessages.mapSlug, a.map.slug)) : sql`false`)
    : ch === "privado" ? and(eq(chatMessages.channel, "privado"), or(eq(chatMessages.characterId, me), eq(chatMessages.toCharacterId, me)))
    : and(eq(chatMessages.channel, "grito"), gt(chatMessages.createdAt, sql`now() - interval '10 minutes'`));
  const rows = await db.select({ id: chatMessages.id, who: sql<string>`case when ${characters.isGm} then '[GM] ' || ${characters.name} else ${characters.name} end`, to: t.name, text: chatMessages.content }).from(chatMessages)
    .innerJoin(characters, eq(chatMessages.characterId, characters.id)).leftJoin(t, eq(chatMessages.toCharacterId, t.id)).where(cond).orderBy(desc(chatMessages.createdAt)).limit(30);
  return NextResponse.json(rows.reverse());
}
export async function POST(req: Request) {
  const a = await getActiveCharacter(); if (!a) return NextResponse.json({ error: "Selecione um personagem." }, { status: 401 });
  const { content, channel, to } = await req.json(); if (!isCh(channel)) return NextResponse.json({ error: "Canal inválido." }, { status: 400 });
  const R = RULES[channel], text = String(content ?? "").trim().slice(0, R.max); if (!text) return NextResponse.json({ error: "Mensagem vazia." }, { status: 400 });
  if (a.c.level < R.lv) return NextResponse.json({ error: `Canal liberado no nível ${R.lv}.` }, { status: 403 });
  const [{ n }] = await db.select({ n: count() }).from(chatMessages).where(and(eq(chatMessages.characterId, a.c.id), gt(chatMessages.createdAt, sql`now() - interval '60 seconds'`)));
  if (n >= 20) return NextResponse.json({ error: "Muitas mensagens por minuto. Aguarde." }, { status: 429 });
  const [last] = await db.select({ at: sql<number>`extract(epoch from now() - ${chatMessages.createdAt})` }).from(chatMessages).where(and(eq(chatMessages.characterId, a.c.id), eq(chatMessages.channel, channel))).orderBy(desc(chatMessages.createdAt)).limit(1);
  if (last && Number(last.at) < R.cd) return NextResponse.json({ error: `Aguarde ${Math.ceil(R.cd - Number(last.at))}s neste canal.` }, { status: 429 });
  let toId: string | null = null;
  if (channel === "privado") { const [d] = await db.select({ id: characters.id }).from(characters).where(sql`lower(${characters.name}) = ${String(to ?? "").trim().toLowerCase()}`).limit(1); if (!d || d.id === a.c.id) return NextResponse.json({ error: "Destinatário não encontrado." }, { status: 404 }); toId = d.id; }
  const [pm] = await db.select({ pid: partyMembers.partyId }).from(partyMembers).where(eq(partyMembers.characterId, a.c.id)); if (channel === "grupo" && !pm) return NextResponse.json({ error: "Você não está em um grupo." }, { status: 403 });
  if (channel === "guilda" && !a.c.guildId) return NextResponse.json({ error: "Você não está em uma guilda." }, { status: 403 });
  if (channel === "local" && !a.map) return NextResponse.json({ error: "Sem mapa." }, { status: 400 });
  await db.insert(chatMessages).values({ channel, characterId: a.c.id, content: text, guildId: channel === "guilda" ? a.c.guildId : null, mapSlug: channel === "local" ? a.map!.slug : null, toCharacterId: toId, partyId: channel === "grupo" ? pm!.pid : null });
  return NextResponse.json({ ok: true });
}
