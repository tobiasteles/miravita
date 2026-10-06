import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { inventory, items } from "@/db/schema";
export const CONS = {
  hp: {
    name: "Poção de HP",
    icon: "potion",
    emoji: "🧪",
    rar: "comum" as const,
    desc: "Restaura 40% do HP durante a batalha.",
  },
  ea: {
    name: "Poção de EA",
    icon: "potion-ea",
    emoji: "🔷",
    rar: "comum" as const,
    desc: "Restaura 40% da Energia Arcana durante a batalha.",
  },
  tp: {
    name: "Pedra de Teletransporte",
    icon: "teleport-stone",
    emoji: "🌀",
    rar: "raro" as const,
    desc: "Teletransporta entre mapas (classes mágicas não precisam).",
  },
};
export type ConsKey = keyof typeof CONS;
export const price = (k: ConsKey, lv: number) =>
  k === "hp" ? 30 + lv * 5 : k === "ea" ? 40 + lv * 6 : 150;
async function itemId(name: string) {
  const [i] = await db
    .select({ id: items.id })
    .from(items)
    .where(and(eq(items.name, name), eq(items.type, "consumivel")))
    .limit(1);
  if (i) return i.id;
  const k = (Object.keys(CONS) as ConsKey[]).find(
    (x) => CONS[x].name === name,
  )!;
  const [n] = await db
    .insert(items)
    .values({
      name,
      type: "consumivel",
      rarity: CONS[k].rar,
      stats: {},
      value: price(k, 1),
    })
    .returning({ id: items.id });
  return n.id;
}
export async function stack(cid: string, name: string) {
  const id = await itemId(name);
  const [row] = await db
    .select()
    .from(inventory)
    .where(and(eq(inventory.characterId, cid), eq(inventory.itemId, id)))
    .limit(1);
  return { id, row };
}
export async function addCons(cid: string, name: string, n: number) {
  const { id, row } = await stack(cid, name);
  if (row)
    await db
      .update(inventory)
      .set({ quantity: row.quantity + n })
      .where(eq(inventory.id, row.id));
  else
    await db
      .insert(inventory)
      .values({ characterId: cid, itemId: id, quantity: n });
}
