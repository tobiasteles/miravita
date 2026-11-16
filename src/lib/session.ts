import { getSessionId } from "@/lib/auth"; import { cookies } from "next/headers"; import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db"; import { characters, maps, sessions } from "@/db/schema";
// personagem ativo: precisa ser do dono de uma sessão válida (uma só consulta: personagem + sessão + mapa)
export async function getActiveCharacter() {
  const sid = await getSessionId(); const id = (await cookies()).get("mv_char")?.value;
  if (!sid || !id) return null;
  const [r] = await db.select({ c: characters, map: maps }).from(characters)
    .innerJoin(sessions, and(eq(sessions.userId, characters.userId), eq(sessions.id, sid), gt(sessions.expiresAt, sql`now()`)))
    .leftJoin(maps, eq(characters.currentMapId, maps.id))
    .where(eq(characters.id, id)).limit(1);
  return r ?? null;
}
