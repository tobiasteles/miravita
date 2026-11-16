// ───── Arena PvP: ajudantes que falam com o banco (só servidor) ─────
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { characters, pvpFights, pvpRatings } from "@/db/schema";
import { START_RATING, arenaGold, eloDelta } from "@/lib/game/pvp";

// dia de hoje em Brasília (a contagem de duelos reinicia à meia-noite de lá)
export const today = () => new Date(Date.now() - 3 * 3_600_000).toISOString().slice(0, 10);
export async function ensureRating(cid: string) {
  await db.insert(pvpRatings).values({ characterId: cid }).onConflictDoNothing();
  const [r] = await db.select().from(pvpRatings).where(eq(pvpRatings.characterId, cid));
  if (r.day !== today()) {
    await db.update(pvpRatings).set({ day: today(), fightsToday: 0 }).where(eq(pvpRatings.characterId, cid));
    return { ...r, day: today(), fightsToday: 0 };
  }
  return r;
}
// duelo valendo rating terminou: atualiza rating, sequência, ouro e histórico. Devolve as linhas para a tela de resultado.
export async function settleDuel(cid: string, b: { e: { pvp?: unknown }; over: string | null; pvp?: { cid: string | null; name: string; lv: number; npc: boolean; rating: number } }, myName: string, myLevel: number, gold: number) {
  const pv = b.pvp;
  if (!pv) return { gold, lines: [] as string[] };
  const won = b.over === "win";
  if (pv.npc) return { gold, lines: [won ? "Treino concluído: o Gladiador foi derrotado." : "Treino encerrado. Tente de novo!"] };
  const me = await ensureRating(cid), delta = eloDelta(me.rating, pv.rating, won), g = arenaGold(myLevel, won), nr = Math.max(0, me.rating + delta);
  await db.update(pvpRatings).set({
    rating: nr, wins: me.wins + (won ? 1 : 0), losses: me.losses + (won ? 0 : 1),
    streak: won ? Math.max(1, me.streak + 1) : Math.min(-1, me.streak - 1), updatedAt: new Date(),
  }).where(eq(pvpRatings.characterId, cid));
  if (pv.cid) {
    // quem foi desafiado também ganha/perde (metade do que o atacante mexeu, no sentido oposto): sem isso o ranking só inflava
    const dd = -Math.round(delta / 2);
    await db.update(pvpRatings).set({
      rating: sql`greatest(0, ${pvpRatings.rating} + ${dd})`, wins: sql`${pvpRatings.wins} + ${won ? 0 : 1}`, losses: sql`${pvpRatings.losses} + ${won ? 1 : 0}`, updatedAt: new Date(),
    }).where(eq(pvpRatings.characterId, pv.cid));
  }
  if (pv.cid) await db.insert(pvpFights).values({ attackerId: cid, defenderId: pv.cid, attackerName: myName, defenderName: pv.name, attackerWon: won, delta });
  return { gold: gold + g, lines: [won ? `Vitória na Arena! +${delta} de rating (agora ${nr}), +${g}g` : `Derrota na Arena: ${delta} de rating (agora ${nr}), +${g}g de consolo`] };
}
export async function rankOf(rating: number) {
  const [r] = await db.select({ n: sql<number>`count(*)` }).from(pvpRatings).where(sql`${pvpRatings.rating} > ${rating}`);
  return Number(r?.n ?? 0) + 1;
}

