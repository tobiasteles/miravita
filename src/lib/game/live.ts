// ───── conteúdo "ao vivo" criado no /admin: eventos ativos, notícias ─────
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { gameEvents, newsPosts } from "@/db/schema";

export async function activeEvents() {
  try {
    const now = new Date();
    return await db.select().from(gameEvents).where(and(eq(gameEvents.active, true), lte(gameEvents.startsAt, now), gte(gameEvents.endsAt, now)));
  } catch {
    return []; // tabela ainda não criada (db:push pendente)
  }
}
// multiplicador total de um tipo de evento (máx. ×5 para ninguém quebrar a economia sem querer)
export const evMult = (evs: { kind: string; mult: number }[], kind: "xp" | "gold" | "drop") =>
  Math.min(5, evs.filter((e) => e.kind === kind).reduce((m, e) => m * e.mult, 1));
export async function latestNews(n = 5) {
  try {
    return await db.select().from(newsPosts).where(eq(newsPosts.published, true)).orderBy(desc(newsPosts.pinned), desc(newsPosts.createdAt)).limit(n);
  } catch {
    return [];
  }
}
