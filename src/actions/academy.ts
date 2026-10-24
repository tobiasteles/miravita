"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { getActiveCharacter } from "@/lib/session";
import { SKILLS, learnCost, LOADOUT_SIZE } from "@/lib/game/classdata";
import { loadout4 } from "@/lib/game/loadout";

export async function learnSkill(fd: FormData) {
  const a = await getActiveCharacter();
  if (!a) return;
  const i = Number(fd.get("i")), s = SKILLS[a.c.classKey]?.[i], kit = a.c.kit ?? { learned: [0], loadout: [0] };
  if (!s || a.c.level < s.lv || kit.learned.includes(i)) return;
  const cost = learnCost(i);
  if (Number(a.c.gold) < cost) return;
  await db
    .update(characters)
    .set({ gold: Number(a.c.gold) - cost, kit: { ...kit, learned: [...kit.learned, i].sort((x, y) => x - y) } })
    .where(eq(characters.id, a.c.id));
  revalidatePath("/skills");
}
// coloca o poder i na posição "slot" (0–3) do loadout; se já estava em outra posição, sai de lá
export async function equipSkill(fd: FormData) {
  const a = await getActiveCharacter();
  if (!a) return;
  const i = Number(fd.get("i")), slot = Number(fd.get("slot")), kit = a.c.kit ?? { learned: [0], loadout: [0] };
  if (!kit.learned.includes(i) || !(slot >= 0 && slot < LOADOUT_SIZE) || (SKILLS[a.c.classKey]?.[i]?.lv ?? 999) > a.c.level) return;
  const lo = loadout4(kit.loadout).map((x) => (x === i ? -1 : x));
  lo[slot] = i;
  await db.update(characters).set({ kit: { ...kit, loadout: lo } }).where(eq(characters.id, a.c.id));
  revalidatePath("/skills");
}
export async function unequipSkill(fd: FormData) {
  const a = await getActiveCharacter();
  if (!a) return;
  const i = Number(fd.get("i")), kit = a.c.kit ?? { learned: [0], loadout: [0] };
  const lo = loadout4(kit.loadout).map((x) => (x === i ? -1 : x));
  await db.update(characters).set({ kit: { ...kit, loadout: lo } }).where(eq(characters.id, a.c.id));
  revalidatePath("/skills");
}
