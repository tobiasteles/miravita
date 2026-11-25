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
import { doseNow, penalty } from "./hazard";
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
  const q = buildStats({
      cls: r.k.key,
      base: r.k.baseStats,
      per: r.k.perLevelStats,
      level: r.c.level,
      traits: tr.map((t) => t.b),
      gear,
      at: r.c.attrs,
      fx: subFx(r.k.key, r.c.sub),
    });
  // exposição a radioativos/tóxicos reduz o HP e a EA máximos (temporário, no máximo −30%); o HP/EA atual nunca passa do novo máximo
  const pen = penalty(doseNow(r.c.activity?.hz));
  if (pen > 0) { q.hp = Math.max(1, Math.round(q.hp * (1 - pen))); q.mp = Math.max(0, Math.round(q.mp * (1 - pen))); }
  const c = pen > 0 ? { ...r.c, hp: Math.min(r.c.hp, q.hp), mp: Math.min(r.c.mp, q.mp) } : r.c;
  return { c, k: r.k, kit: r.c.kit ?? { learned: [0], loadout: [0] }, q };
}
