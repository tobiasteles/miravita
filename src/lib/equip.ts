import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { inventory, items } from "@/db/schema";
import type { EquipStats } from "@/lib/game/equipment";
type Rarity = "comum" | "raro" | "epico" | "lendario";
type NewItem = { name: string; type: "arma" | "acessorio" | "armadura" | "elmo" | "botas" | "manoplas"; slot?: string; rarity: Rarity; stats: EquipStats; value: number; z?: number };
// cria o item, desequipa o anterior do mesmo tipo e equipa o novo
export async function giveEquipped(cid: string, it: NewItem) {
  const [ni] = await db
    .insert(items)
    .values({ elementAtomicNumber: it.z ?? null, name: it.name, type: it.type, slot: it.slot ?? null, rarity: it.rarity, stats: it.stats, value: it.value })
    .returning({ id: items.id });
  const old = await db
    .select({ id: inventory.id })
    .from(inventory)
    .innerJoin(items, eq(inventory.itemId, items.id))
    .where(and(eq(inventory.characterId, cid), eq(inventory.equipped, true), eq(items.type, it.type)));
  for (const o of old) await db.update(inventory).set({ equipped: false }).where(eq(inventory.id, o.id));
  await db.insert(inventory).values({ characterId: cid, itemId: ni.id, equipped: true, currentDurability: it.stats.durability ?? 100 });
}
// soma elementos ao inventário (cria o item "material" se ainda não existir para esse número atômico)
export async function addElement(cid: string, z: number, n: number) {
  const [it] = await db
    .select({ id: items.id })
    .from(items)
    .where(and(eq(items.elementAtomicNumber, z), eq(items.type, "material")))
    .limit(1);
  if (!it) return false;
  const [ex] = await db.select().from(inventory).where(and(eq(inventory.characterId, cid), eq(inventory.itemId, it.id))).limit(1);
  if (ex) await db.update(inventory).set({ quantity: ex.quantity + n }).where(eq(inventory.id, ex.id));
  else await db.insert(inventory).values({ characterId: cid, itemId: it.id, quantity: n });
  return true;
}
// quantidade de um elemento no inventário
export async function elementQty(cid: string, z: number) {
  const [r] = await db
    .select({ id: inventory.id, quantity: inventory.quantity })
    .from(inventory)
    .innerJoin(items, eq(inventory.itemId, items.id))
    .where(and(eq(inventory.characterId, cid), eq(items.elementAtomicNumber, z), eq(items.type, "material")));
  return r ?? null;
}
export async function takeElement(cid: string, z: number, n: number) {
  const r = await elementQty(cid, z);
  if (!r || r.quantity < n) return false;
  await db.update(inventory).set({ quantity: r.quantity - n }).where(eq(inventory.id, r.id));
  return true;
}
