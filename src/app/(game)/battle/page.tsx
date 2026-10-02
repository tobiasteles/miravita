import { redirect } from "next/navigation"; import { eq } from "drizzle-orm"; import { db } from "@/db"; import { battles } from "@/db/schema";
import { getActiveCharacter } from "@/lib/session"; import { loadPlayer } from "@/lib/game/player"; import { SKILLS, SUMMONS, type BState } from "@/lib/game/battle"; import BattleScreen from "@/components/game/BattleScreen";
export const dynamic = "force-dynamic";
export default async function Battle() {
  const a = await getActiveCharacter(); if (!a) redirect("/characters");
  const [row] = await db.select().from(battles).where(eq(battles.characterId, a.c.id)); if (!row) redirect("/play");
  const P = await loadPlayer(a.c.id), cls = P.k.key;
  return <BattleScreen b={row.state as BState} p={{ name: P.c.name, hp: P.c.hp, mhp: P.q.hp, mp: P.c.mp, mmp: P.q.mp, skills: SKILLS[cls].map(({ n, c }) => ({ n, c })), summons: cls === "humanas" ? SUMMONS.map(({ n, c }) => ({ n, c })) : [], cost: 30 + P.c.level * 5 }} />;
}
