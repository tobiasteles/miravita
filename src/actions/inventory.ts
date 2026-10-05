"use server";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { inventory, items, elements } from "@/db/schema";
import { getActiveCharacter } from "@/lib/session";
import { computeItem } from "@/lib/game/item-stats";
export async function forge(fd: FormData) {
  const a = await getActiveCharacter();
  if (!a) return;
  const cid = a.c.id,
    z = Number(fd.get("z")),
    kind = fd.get("kind") === "arma" ? "arma" : "armadura";
  const [m] = await db
    .select({ inv: inventory })
    .from(inventory)
    .innerJoin(items, eq(inventory.itemId, items.id))
    .where(
      and(
        eq(inventory.characterId, cid),
        eq(items.elementAtomicNumber, z),
        eq(items.type, "material"),
      ),
    );
  if (!m || m.inv.quantity < 5) return;
  const [el] = await db
    .select()
    .from(elements)
    .where(eq(elements.atomicNumber, z));
  const s = computeItem(el);
  await db
    .update(inventory)
    .set({ quantity: m.inv.quantity - 5 })
    .where(eq(inventory.id, m.inv.id));
  const [ni] = await db
    .insert(items)
    .values({
      elementAtomicNumber: z,
      name: `${kind === "arma" ? "Lâmina" : "Armadura"} de ${el.name}`,
      type: kind,
      rarity: s.rarity,
      stats: {
        atk: kind === "arma" ? s.atk : 0,
        def: kind === "armadura" ? s.def : 0,
        durability: s.durability,
      },
      value: s.value * 3,
    })
    .returning({ id: items.id });
  const old = await db
    .select({ id: inventory.id })
    .from(inventory)
    .innerJoin(items, eq(inventory.itemId, items.id))
    .where(
      and(
        eq(inventory.characterId, cid),
        eq(inventory.equipped, true),
        eq(items.type, kind),
      ),
    );
  for (const o of old)
    await db
      .update(inventory)
      .set({ equipped: false })
      .where(eq(inventory.id, o.id));
  await db
    .insert(inventory)
    .values({
      characterId: cid,
      itemId: ni.id,
      equipped: true,
      currentDurability: s.durability,
    });
  revalidatePath("/inventory");
}
