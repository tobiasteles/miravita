"use server";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { characters, inventory, items, elements } from "@/db/schema";
import { getActiveCharacter } from "@/lib/session";
import { computeItem } from "@/lib/game/item-stats";
import { GATE, gearPrice } from "@/lib/game/shop";
import { giveEquipped, addElement } from "@/lib/equip";
import { usesSword } from "@/lib/game/classes";
import { COMMON_Z } from "@/lib/game/world";
import { CONS, price, addCons, type ConsKey } from "@/lib/consumables";
import {
  computeEquip,
  computeWeapon,
  WEAPONS,
  TRAJE_TIERS,
  trajeName,
  trajeStats,
  EQUIP_NAMES,
  SLOT_KEYS,
  type SlotKey,
  type WeaponKind,
} from "@/lib/game/equipment";

export async function buyConsumable(fd: FormData) {
  const a = await getActiveCharacter();
  if (!a) return;
  const k = String(fd.get("k")) as ConsKey;
  if (!CONS[k]) return;
  const n = Math.min(99, Math.max(1, Number(fd.get("n")) || 1)),
    total = price(k, a.c.level) * n;
  if (Number(a.c.gold) < total) return;
  await db
    .update(characters)
    .set({ gold: Number(a.c.gold) - total })
    .where(eq(characters.id, a.c.id));
  await addCons(a.c.id, CONS[k].name, n);
  revalidatePath("/shop/conveniencia");
}
export async function buyGear(fd: FormData) {
  // compra e já equipa (substitui o item atual da mesma peça)
  const a = await getActiveCharacter();
  if (!a) return;
  const z = Number(fd.get("z")),
    slot = String(fd.get("slot")) as SlotKey;
  if (!SLOT_KEYS.includes(slot)) return;
  if (slot === "arma" && !usesSword(a.c.classKey)) return; // armas mágicas só na Conveniência
  const [el] = await db
    .select()
    .from(elements)
    .where(eq(elements.atomicNumber, z));
  if (!el) return;
  const s = computeItem(el),
    stats = computeEquip(slot, s),
    cost = gearPrice(s.value);
  if (a.c.level < GATE[s.rarity] || Number(a.c.gold) < cost) return;
  const [ni] = await db
    .insert(items)
    .values({
      elementAtomicNumber: z,
      name: `${EQUIP_NAMES[a.c.classKey][slot]} de ${el.name}`,
      type: slot,
      rarity: s.rarity,
      stats,
      value: s.value * 3,
    })
    .returning({ id: items.id });
  const old = await db
    .select({ id: inventory.id })
    .from(inventory)
    .innerJoin(items, eq(inventory.itemId, items.id))
    .where(
      and(
        eq(inventory.characterId, a.c.id),
        eq(inventory.equipped, true),
        eq(items.type, slot),
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
      characterId: a.c.id,
      itemId: ni.id,
      equipped: true,
      currentDurability: stats.durability,
    });
  await db
    .update(characters)
    .set({ gold: Number(a.c.gold) - cost })
    .where(eq(characters.id, a.c.id));
  revalidatePath("/shop/equipamentos");
}

// ───── CONVENIÊNCIA: armas mágicas, trajes e reagentes ─────
export async function buyWeapon(fd: FormData) {
  const a = await getActiveCharacter();
  if (!a || usesSword(a.c.classKey)) return;
  const kind = String(fd.get("kind")) as WeaponKind, z = Number(fd.get("z"));
  if (!WEAPONS[kind]) return;
  const [el] = await db.select().from(elements).where(eq(elements.atomicNumber, z));
  if (!el) return;
  const s = computeItem(el), stats = computeWeapon(kind, s), cost = Math.round(gearPrice(s.value) * 1.2);
  if (a.c.level < GATE[s.rarity] || Number(a.c.gold) < cost) return;
  await giveEquipped(a.c.id, { name: `${WEAPONS[kind].label} de ${el.name}`, type: "arma", slot: kind, rarity: s.rarity, stats, value: s.value * 3, z });
  await db.update(characters).set({ gold: Number(a.c.gold) - cost }).where(eq(characters.id, a.c.id));
  revalidatePath("/shop/conveniencia");
}
export async function buyTraje(fd: FormData) {
  const a = await getActiveCharacter();
  if (!a || usesSword(a.c.classKey)) return;
  const tier = Number(fd.get("tier"));
  if (!(tier >= 0 && tier < TRAJE_TIERS.length)) return;
  const T = TRAJE_TIERS[tier];
  if (a.c.level < T.lv || Number(a.c.gold) < T.price) return;
  await giveEquipped(a.c.id, { name: trajeName(a.c.classKey, tier), type: "acessorio", slot: "traje", rarity: (["comum", "raro", "raro", "epico", "epico", "lendario"] as const)[tier], stats: trajeStats(a.c.classKey, tier), value: T.price });
  await db.update(characters).set({ gold: Number(a.c.gold) - T.price }).where(eq(characters.id, a.c.id));
  revalidatePath("/shop/conveniencia");
}
// reagentes = elementos comuns, baratos (servem para a Infusão Elemental e para o Laboratório)
export const reagentPrice = (value: number) => Math.max(8, Math.round(value * 0.6));
export async function buyReagent(fd: FormData) {
  const a = await getActiveCharacter();
  if (!a) return;
  const z = Number(fd.get("z")), n = Math.min(99, Math.max(1, Number(fd.get("n")) || 1));
  if (!COMMON_Z.includes(z)) return;
  const [el] = await db.select().from(elements).where(eq(elements.atomicNumber, z));
  if (!el) return;
  const total = reagentPrice(computeItem(el).value) * n;
  if (Number(a.c.gold) < total) return;
  if (!(await addElement(a.c.id, z, n))) return;
  await db.update(characters).set({ gold: Number(a.c.gold) - total }).where(eq(characters.id, a.c.id));
  revalidatePath("/shop/conveniencia");
}
