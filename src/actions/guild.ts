"use server";
import { redirect } from "next/navigation"; import { revalidatePath } from "next/cache"; import { and, eq } from "drizzle-orm"; import { db } from "@/db";
import { guilds, guildMembers, characters } from "@/db/schema"; import { getActiveCharacter } from "@/lib/session";
export async function createGuild(fd: FormData) {
  const a = await getActiveCharacter(); if (!a || a.c.guildId) redirect("/guild"); const name = String(fd.get("name") ?? "").trim(), tag = String(fd.get("tag") ?? "").trim().toUpperCase();
  if (name.length < 3 || !/^[A-Z0-9]{2,4}$/.test(tag)) redirect("/guild?error=" + encodeURIComponent("Nome 3+ letras e tag de 2–4 letras/números."));
  let id: string | undefined; try { [{ id }] = await db.insert(guilds).values({ name, tag }).returning({ id: guilds.id }); } catch { redirect("/guild?error=" + encodeURIComponent("Nome ou tag já em uso.")); }
  await db.insert(guildMembers).values({ guildId: id!, characterId: a.c.id, rank: "lider" }); await db.update(characters).set({ guildId: id }).where(eq(characters.id, a.c.id)); revalidatePath("/guild"); redirect("/guild");
}
export async function joinGuild(fd: FormData) {
  const a = await getActiveCharacter(); if (!a || a.c.guildId) return; const id = String(fd.get("id"));
  await db.insert(guildMembers).values({ guildId: id, characterId: a.c.id }); await db.update(characters).set({ guildId: id }).where(eq(characters.id, a.c.id)); revalidatePath("/guild");
}
export async function leaveGuild() {
  const a = await getActiveCharacter(); if (!a?.c.guildId) return; const gid = a.c.guildId;
  await db.delete(guildMembers).where(eq(guildMembers.characterId, a.c.id)); await db.update(characters).set({ guildId: null }).where(eq(characters.id, a.c.id));
  const left = await db.select().from(guildMembers).where(eq(guildMembers.guildId, gid)).orderBy(guildMembers.joinedAt);
  if (!left.length) await db.delete(guilds).where(eq(guilds.id, gid)); else if (!left.some((m) => m.rank === "lider")) await db.update(guildMembers).set({ rank: "lider" }).where(eq(guildMembers.characterId, left[0].characterId));
  revalidatePath("/guild");
}
export async function setRank(fd: FormData) {
  const a = await getActiveCharacter(); if (!a?.c.guildId) return; const rank = fd.get("rank") === "oficial" ? "oficial" : "membro";
  const [me] = await db.select().from(guildMembers).where(eq(guildMembers.characterId, a.c.id)); if (me?.rank !== "lider") return;
  await db.update(guildMembers).set({ rank }).where(and(eq(guildMembers.guildId, a.c.guildId), eq(guildMembers.characterId, String(fd.get("cid"))))); revalidatePath("/guild");
}
