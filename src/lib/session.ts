import { auth } from "@clerk/nextjs/server"; import { cookies } from "next/headers"; import { and, eq } from "drizzle-orm";
import { db } from "@/db"; import { characters, maps } from "@/db/schema";
export async function getActiveCharacter() {
  const { userId } = await auth(); const id = (await cookies()).get("mv_char")?.value;
  if (!userId || !id) return null;
  const [r] = await db.select({ c: characters, map: maps }).from(characters).leftJoin(maps, eq(characters.currentMapId, maps.id))
    .where(and(eq(characters.id, id), eq(characters.userId, userId))).limit(1);
  return r ?? null;
}
