import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  characters,
  classes,
  traits,
  characterTraits,
  inventory,
  items,
} from "@/db/schema";
import { playerStats, subFx } from "./battle";
// as 3 consultas rodam juntas (uma ida ao banco em vez de três)
export async function loadPlayer(id: string) {
  const [[r], tr, eqp] = await Promise.all([
    db
      .select({ c: characters, k: classes })
      .from(characters)
      .innerJoin(classes, eq(characters.classKey, classes.key))
      .where(eq(characters.id, id)),
    db
      .select({ b: traits.bonus })
      .from(characterTraits)
      .innerJoin(traits, eq(characterTraits.traitId, traits.id))
      .where(eq(characterTraits.characterId, id)),
    db
      .select({ s: items.stats })
      .from(inventory)
      .innerJoin(items, eq(inventory.itemId, items.id))
      .where(and(eq(inventory.characterId, id), eq(inventory.equipped, true))),
  ]);
  // soma os bônus das até 5 peças equipadas (arma, elmo, peitoral, manoplas, botas)
  const gear = eqp.reduce(
    (g, x) => ({
      atk: g.atk + (x.s.atk ?? 0),
      def: g.def + (x.s.def ?? 0),
      hp: g.hp + (x.s.hp ?? 0),
      crit: g.crit + (x.s.crit ?? 0),
    }),
    { atk: 0, def: 0, hp: 0, crit: 0 },
  );
  return {
    c: r.c,
    k: r.k,
    q: playerStats(
      r.k.baseStats,
      r.k.perLevelStats,
      r.c.level,
      tr.map((t) => t.b),
      gear,
      r.c.attrs,
      subFx(r.k.key, r.c.sub),
    ),
  };
}
