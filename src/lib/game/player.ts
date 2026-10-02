import { and, eq } from "drizzle-orm"; import { db } from "@/db";
import { characters, classes, traits, characterTraits, inventory, items } from "@/db/schema"; import { playerStats } from "./battle";
export async function loadPlayer(id: string) {
  const [r] = await db.select({ c: characters, k: classes }).from(characters).innerJoin(classes, eq(characters.classKey, classes.key)).where(eq(characters.id, id));
  const tr = await db.select({ b: traits.bonus }).from(characterTraits).innerJoin(traits, eq(characterTraits.traitId, traits.id)).where(eq(characterTraits.characterId, id));
  const eqp = await db.select({ type: items.type, s: items.stats }).from(inventory).innerJoin(items, eq(inventory.itemId, items.id)).where(and(eq(inventory.characterId, id), eq(inventory.equipped, true)));
  const wep = eqp.find((x) => x.type === "arma")?.s.atk ?? 0, arm = eqp.find((x) => x.type === "armadura")?.s.def ?? 0;
  return { c: r.c, k: r.k, q: playerStats(r.k.baseStats, r.k.perLevelStats, r.c.level, tr.map((t) => t.b), wep, arm) };
}
