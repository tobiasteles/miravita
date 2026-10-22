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
import { subFx } from "./battle";
import { buildStats, type Gear } from "./combat";
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
  // soma TODOS os bônus numéricos das peças equipadas (arma, elmo, peitoral, manoplas, botas, traje)
  const gear: Gear = {};
  for (const x of eqp)
    for (const [k, v] of Object.entries(x.s))
      if (k !== "durability" && typeof v === "number") (gear as Record<string, number>)[k] = ((gear as Record<string, number>)[k] ?? 0) + v;
  return {
    c: r.c,
    k: r.k,
    kit: r.c.kit ?? { learned: [0], loadout: [0] },
    q: buildStats({
      cls: r.k.key,
      base: r.k.baseStats,
      per: r.k.perLevelStats,
      level: r.c.level,
      traits: tr.map((t) => t.b),
      gear,
      at: r.c.attrs,
      fx: subFx(r.k.key, r.c.sub),
    }),
  };
}
