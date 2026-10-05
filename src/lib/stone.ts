import { and, eq } from "drizzle-orm"; import { db } from "@/db"; import { inventory, items } from "@/db/schema";
export const MAGIC = ["humanas", "linguagens"]; // classes mágicas teleportam sem pedra
async function stoneId() {
  const [i] = await db.select({ id: items.id }).from(items).where(and(eq(items.name, "Pedra de Teletransporte"), eq(items.type, "consumivel"))).limit(1); if (i) return i.id;
  const [n] = await db.insert(items).values({ name: "Pedra de Teletransporte", type: "consumivel", rarity: "raro", stats: {}, value: 150 }).returning({ id: items.id }); return n.id;
}
export async function stoneStack(cid: string) {
  const id = await stoneId(); const [row] = await db.select().from(inventory).where(and(eq(inventory.characterId, cid), eq(inventory.itemId, id))).limit(1); return { id, row };
}
export async function addStone(cid: string, n: number) {
  const { id, row } = await stoneStack(cid); if (row) await db.update(inventory).set({ quantity: row.quantity + n }).where(eq(inventory.id, row.id)); else await db.insert(inventory).values({ characterId: cid, itemId: id, quantity: n });
}
