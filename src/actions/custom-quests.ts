"use server";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { characters, customQuests, questClaims, questProgress } from "@/db/schema";
import { getActiveCharacter } from "@/lib/session";
import { applyXp, monsterXp } from "@/lib/game/xp";
import { takeElement } from "@/lib/equip";

// entrega a recompensa de uma missão criada no /admin
export async function claimCustomQuest(fd: FormData) {
  const a = await getActiveCharacter();
  if (!a) return;
  const id = String(fd.get("id")), [q] = await db.select().from(customQuests).where(and(eq(customQuests.id, id), eq(customQuests.active, true)));
  if (!q || a.c.level < q.minLevel) return;
  if (q.kind === "kill") {
    const [pg] = await db.select().from(questProgress).where(and(eq(questProgress.characterId, a.c.id), eq(questProgress.questId, id)));
    if (!pg || pg.progress < q.amount) return;
  }
  const [old] = await db.select().from(questClaims).where(and(eq(questClaims.characterId, a.c.id), eq(questClaims.questId, id)));
  if (old) return; // já recebida
  if (q.kind === "deliver" && (!q.elementZ || !(await takeElement(a.c.id, q.elementZ, q.amount)))) return;
  const ins = await db.insert(questClaims).values({ characterId: a.c.id, questId: id }).onConflictDoNothing().returning({ q: questClaims.questId });
  if (!ins.length) return;
  const gain = Math.round(monsterXp(Math.min(200, q.minLevel + 4)) * q.xpB * Number(process.env.XP_MULTIPLIER ?? 1)), r = applyXp(a.c.level, Number(a.c.xp), gain);
  await db.update(characters).set({ gold: Number(a.c.gold) + q.gold, level: r.level, xp: r.xp }).where(eq(characters.id, a.c.id));
  revalidatePath("/quests");
}
