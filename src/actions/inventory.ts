"use server";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { inventory, items } from "@/db/schema";
import { withChar } from "@/lib/lock";
import { ALLOY_PT, craftStats, material } from "@/lib/game/materials";
import { ELEMENT_BY_Z } from "@/lib/game/elements";
import { elementQty, takeElement } from "@/lib/equip";
import { redirect } from "next/navigation";
import type { Key } from "@/i18n/pt-BR";
import { usesSword } from "@/lib/game/classes";
import {
  EQUIP_NAMES,
  SLOT_KEYS,
  type SlotKey,
} from "@/lib/game/equipment";

const bad = (k: Key): never => redirect(`/inventory?error=${k}`); // erro por chave (a tela traduz)
export async function forge(fd: FormData) {
  return withChar(async (a) => {
    // bancada de forja: 5 unidades de um elemento sólido e seguro, ou os ingredientes de uma liga, viram 1 peça (já sai equipada)
    if (!a) return;
    const cid = a.c.id, slot = String(fd.get("slot")) as SlotKey;
    if (!SLOT_KEYS.includes(slot)) return bad("err.forge.slot");
    const id = String(fd.get("mat") ?? `e:${Number(fd.get("z"))}`), m = material(id);
    if (!m) return bad("err.forge.material"); // gás, líquido, radioativo, tóxico, reativo, mole demais… (validado aqui, no servidor)
    if (slot === "arma" && m.noWeapon) return bad("err.forge.noWeapon");
    for (const [z, q] of m.inp) { const have = await elementQty(cid, z); if (!have || have.quantity < q) return bad("err.forge.missing"); }
    const magic = slot === "arma" && !usesSword(a.c.classKey), // magos forjam Cajados (Grimório e Orbe só na Conveniência)
      stats = craftStats(m, slot, magic ? "cajado" : undefined),
      matName = m.alloy ? ALLOY_PT[m.alloy.id] : ELEMENT_BY_Z.get(m.z)![2],
      name = `${magic ? "Cajado" : EQUIP_NAMES[a.c.classKey][slot]} de ${matName}`;
    for (const [z, q] of m.inp) if (!(await takeElement(cid, z, q))) return bad("err.forge.missing");
    const [ni] = await db
      .insert(items)
      .values({ elementAtomicNumber: m.z, name, type: slot, rarity: m.rarity, stats, value: m.value * 3 })
      .returning({ id: items.id });
    const old = await db
      .select({ id: inventory.id })
      .from(inventory)
      .innerJoin(items, eq(inventory.itemId, items.id))
      .where(
        and(
          eq(inventory.characterId, cid),
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
        characterId: cid,
        itemId: ni.id,
        equipped: true,
        currentDurability: stats.durability,
      });
    revalidatePath("/inventory");
  });
}
export async function toggleEquip(fd: FormData) {
  return withChar(async (a) => {
    // equipar troca a peça do mesmo tipo; desequipar só tira
  
    if (!a) return;
    const id = String(fd.get("id"));
    const [row] = await db
      .select({ inv: inventory, type: items.type })
      .from(inventory)
      .innerJoin(items, eq(inventory.itemId, items.id))
      .where(and(eq(inventory.id, id), eq(inventory.characterId, a.c.id)));
    if (!row) return;
    if (!row.inv.equipped) {
      const old = await db
        .select({ id: inventory.id })
        .from(inventory)
        .innerJoin(items, eq(inventory.itemId, items.id))
        .where(
          and(
            eq(inventory.characterId, a.c.id),
            eq(inventory.equipped, true),
            eq(items.type, row.type),
          ),
        );
      for (const o of old)
        await db
          .update(inventory)
          .set({ equipped: false })
          .where(eq(inventory.id, o.id));
    }
    await db
      .update(inventory)
      .set({ equipped: !row.inv.equipped })
      .where(eq(inventory.id, id));
    revalidatePath("/inventory");
  });
}
