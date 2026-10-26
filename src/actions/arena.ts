"use server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters, pvpRatings } from "@/db/schema";
import { getActiveCharacter } from "@/lib/session";
import { loadPlayer } from "@/lib/game/player";
import { CLASS_KEYS } from "@/lib/game/classes";
import { BRACKET, DAILY_FIGHTS, ghostFrom, npcGhost, pvpNorm } from "@/lib/game/pvp";
import { blankState, saveBattle } from "@/lib/game/encounter";
import { ensureRating } from "@/lib/arena-db";
import { loadout4 } from "@/lib/game/loadout";

const MIN_LV = 20; // a Arena abre no nível 20 (antes disso só há 1–3 poderes)
async function start(cid: string, ghost: ReturnType<typeof npcGhost>, pv: { cid: string | null; name: string; cls: string; lv: number; npc: boolean; rating: number }, slug: string) {
  const P = await loadPlayer(cid), Q = pvpNorm(P.q, P.c.level);
  await db.update(characters).set({ hp: Q.hp, mp: Q.mp }).where(eq(characters.id, cid)); // duelo começa com vida e EA cheias
  await saveBattle(cid, blankState(ghost, [], slug, { pvp: pv, log: [`⚔ ARENA: ${pv.name} (Nv. ${pv.lv}) aceitou o duelo!`] }));
  redirect("/battle");
}
// desafia o fantasma de outro jogador (vale rating)
export async function challenge(fd: FormData) {
  const a = await getActiveCharacter();
  if (!a?.map || a.c.isGm || a.c.level < MIN_LV) redirect("/arena");
  const me = await ensureRating(a.c.id), defId = String(fd.get("id"));
  if (me.fightsToday >= DAILY_FIGHTS || defId === a.c.id) redirect("/arena");
  const [d] = await db.select().from(characters).where(eq(characters.id, defId));
  if (!d || d.isGm || d.userId === a.c.userId || Math.abs(d.level - a.c.level) > BRACKET) redirect("/arena");
  const [dr] = await db.select().from(pvpRatings).where(eq(pvpRatings.characterId, defId));
  if (!dr) redirect("/arena"); // só quem entrou na Arena pode ser desafiado
  const D = await loadPlayer(defId), kit = D.kit;
  const ghost = ghostFrom(D.c.name, D.k.key, D.c.level, pvpNorm(D.q, D.c.level), loadout4(kit.loadout).filter((i) => kit.learned.includes(i)));
  await db.update(pvpRatings).set({ fightsToday: me.fightsToday + 1 }).where(eq(pvpRatings.characterId, a.c.id)); // conta ao começar (sair no meio não devolve)
  await start(a.c.id, ghost, { cid: defId, name: D.c.name, cls: D.k.key, lv: D.c.level, npc: false, rating: dr.rating }, a.map.slug);
}
// treino contra um Gladiador (NPC): sem rating e sem limite diário
export async function practice(fd: FormData) {
  const a = await getActiveCharacter();
  const cls = String(fd.get("cls"));
  if (!a?.map || a.c.isGm || a.c.level < MIN_LV || !CLASS_KEYS.includes(cls)) redirect("/arena");
  const g = npcGhost(cls, a.c.level);
  await start(a.c.id, g, { cid: null, name: g.n, cls, lv: a.c.level, npc: true, rating: 0 }, a.map.slug);
}

