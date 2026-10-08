"use server";
import { revalidatePath } from "next/cache"; import { and, eq } from "drizzle-orm"; import { db } from "@/db";
import { questClaims, questProgress } from "@/db/schema"; import { getActiveCharacter } from "@/lib/session";
import { STORY, dailyList, dailyId, streakOf, mult, today, type Item } from "@/lib/game/story"; import { giveReward } from "@/lib/rewards"; import { WORLD } from "@/lib/game/world";

const claims = async (cid: string) => (await db.select({ id: questClaims.questId }).from(questClaims).where(eq(questClaims.characterId, cid))).map((x) => x.id);
const prog = async (cid: string, id: string) => (await db.select().from(questProgress).where(and(eq(questProgress.characterId, cid), eq(questProgress.questId, id))))[0]?.progress ?? 0;
const mark = async (cid: string, id: string) => (await db.insert(questClaims).values({ characterId: cid, questId: id }).onConflictDoNothing().returning({ q: questClaims.questId })).length > 0;

export async function claimStory(fd: FormData) { // capítulos em ordem: nível mínimo + objetivo cumprido
  const a = await getActiveCharacter(); if (!a) return; const id = String(fd.get("id")), i = STORY.findIndex((q) => q.id === id), q = STORY[i]; if (!q || a.c.level < q.lv) return;
  const done = await claims(a.c.id); if (done.includes(id) || (i > 0 && !done.includes(STORY[i - 1].id)) || (await prog(a.c.id, id)) < q.obj.n) return;
  if (!(await mark(a.c.id, id))) return; await giveReward(a.c, q.rw); revalidatePath("/quests");
}
export async function claimDaily(fd: FormData) {
  const a = await getActiveCharacter(); if (!a) return; const d = today(), q = dailyList(d).find((x) => x.k === String(fd.get("k"))); if (!q) return;
  const done = await claims(a.c.id); if (done.includes(q.id) || (await prog(a.c.id, q.id)) < q.n) return;
  if (!(await mark(a.c.id, q.id))) return; await giveReward(a.c, { xpB: q.xpB, gold: q.gold }, mult(streakOf(done, d))); revalidatePath("/quests");
}
export async function claimBonus() { // Baú do Dia: libera quando as 3 diárias estão feitas; aumenta a sequência; a cada 7 dias vem uma peça rara
  const a = await getActiveCharacter(); if (!a) return; const d = today(), done = await claims(a.c.id);
  if (!dailyList(d).every((q) => done.includes(q.id)) || done.includes(dailyId(d, "bonus"))) return; if (!(await mark(a.c.id, dailyId(d, "bonus")))) return;
  const after = streakOf([...done, dailyId(d, "bonus")], d), dg = WORLD[a.map?.slug ?? ""]?.dg ?? [26], pk = () => dg[Math.floor(Math.random() * dg.length)];
  const items: Item[] = [{ g: "cons", k: "hp", n: 3 }, { g: "cons", k: "ea", n: 2 }, { g: "cons", k: "tp", n: 1 }, { g: "mat", z: pk(), n: 2 }, { g: "mat", z: pk(), n: 1 }];
  if (after % 7 === 0) items.push({ g: "gear", z: dg[dg.length - 1], k: Math.random() < .5 ? "arma" : "armadura" });
  await giveReward(a.c, { xpB: 10, gold: 150, items }, mult(after)); revalidatePath("/quests");
}
