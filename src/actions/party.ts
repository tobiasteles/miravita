"use server";
import { revalidatePath } from "next/cache";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { parties, partyMembers } from "@/db/schema";
import { getActiveCharacter } from "@/lib/session";
export async function createParty(fd: FormData) {
  const a = await getActiveCharacter();
  if (!a?.c.guildId) return;
  const [m] = await db
    .select()
    .from(partyMembers)
    .where(eq(partyMembers.characterId, a.c.id));
  if (m) return;
  const [p] = await db
    .insert(parties)
    .values({
      guildId: a.c.guildId,
      leaderId: a.c.id,
      name:
        String(fd.get("name") ?? "")
          .trim()
          .slice(0, 20) || "Grupo",
    })
    .returning({ id: parties.id });
  await db.insert(partyMembers).values({ partyId: p.id, characterId: a.c.id });
  revalidatePath("/guild");
}
export async function joinParty(fd: FormData) {
  const a = await getActiveCharacter();
  if (!a?.c.guildId) return;
  const id = String(fd.get("id"));
  const [p] = await db
    .select()
    .from(parties)
    .where(and(eq(parties.id, id), eq(parties.guildId, a.c.guildId)));
  if (!p) return;
  const [{ n }] = await db
    .select({ n: count() })
    .from(partyMembers)
    .where(eq(partyMembers.partyId, id));
  if (n >= 4) return;
  await db
    .insert(partyMembers)
    .values({ partyId: id, characterId: a.c.id })
    .onConflictDoNothing();
  revalidatePath("/guild");
}
export async function leaveParty() {
  const a = await getActiveCharacter();
  if (!a) return;
  const [m] = await db
    .select()
    .from(partyMembers)
    .where(eq(partyMembers.characterId, a.c.id));
  if (!m) return;
  await db.delete(partyMembers).where(eq(partyMembers.characterId, a.c.id));
  const left = await db
    .select()
    .from(partyMembers)
    .where(eq(partyMembers.partyId, m.partyId));
  if (!left.length) await db.delete(parties).where(eq(parties.id, m.partyId));
  else
    await db
      .update(parties)
      .set({ leaderId: left[0].characterId })
      .where(and(eq(parties.id, m.partyId), eq(parties.leaderId, a.c.id)));
  revalidatePath("/guild");
}
