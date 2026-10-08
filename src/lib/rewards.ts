import { and, eq, sql } from "drizzle-orm"; import { db } from "@/db";
import { characters, elements, inventory, items, questProgress } from "@/db/schema";
import { computeItem } from "@/lib/game/item-stats"; import { applyXp, monsterXp } from "@/lib/game/xp"; import { addCons, CONS } from "@/lib/consumables";
import { STORY, today, type Reward } from "@/lib/game/story";

// ───── progresso das missões (capítulos e diárias) ─────
export async function bump(cid: string, id: string, n = 1) {
  await db.insert(questProgress).values({ characterId: cid, questId: id, progress: n }).onConflictDoUpdate({ target: [questProgress.characterId, questProgress.questId], set: { progress: sql`${questProgress.progress} + ${n}` } });
}
export async function track(cid: string, kind: "kill" | "portal" | "gather", slug = "", n = 1) {
  const ids = [`daily:${today()}:${kind}`];
  if (kind !== "gather") for (const q of STORY) if (q.obj.t === kind && q.obj.slug === slug) ids.push(q.id);
  await Promise.all(ids.map((id) => bump(cid, id, n)));
}

// ───── entrega de recompensas ─────
async function addMaterial(cid: string, z: number, n: number) {
  const [it] = await db.select({ id: items.id }).from(items).where(and(eq(items.elementAtomicNumber, z), eq(items.type, "material"))).limit(1); if (!it) return;
  const [ex] = await db.select().from(inventory).where(and(eq(inventory.characterId, cid), eq(inventory.itemId, it.id))).limit(1);
  if (ex) await db.update(inventory).set({ quantity: ex.quantity + n }).where(eq(inventory.id, ex.id)); else await db.insert(inventory).values({ characterId: cid, itemId: it.id, quantity: n });
}
async function addGear(cid: string, z: number, kind: "arma" | "armadura") { // equipa sozinho só se for melhor que o atual; senão fica na mochila
  const [el] = await db.select().from(elements).where(eq(elements.atomicNumber, z)); if (!el) return; const s = computeItem(el);
  const [ni] = await db.insert(items).values({ elementAtomicNumber: z, name: `${kind === "arma" ? "Lâmina" : "Armadura"} de ${el.name}`, type: kind, rarity: s.rarity, stats: { atk: kind === "arma" ? s.atk : 0, def: kind === "armadura" ? s.def : 0, durability: s.durability }, value: s.value * 3 }).returning({ id: items.id });
  const cur = await db.select({ id: inventory.id, st: items.stats }).from(inventory).innerJoin(items, eq(inventory.itemId, items.id)).where(and(eq(inventory.characterId, cid), eq(inventory.equipped, true), eq(items.type, kind)));
  const better = kind === "arma" ? s.atk > Math.max(0, ...cur.map((x) => x.st.atk ?? 0)) : s.def > Math.max(0, ...cur.map((x) => x.st.def ?? 0));
  if (better) for (const o of cur) await db.update(inventory).set({ equipped: false }).where(eq(inventory.id, o.id));
  await db.insert(inventory).values({ characterId: cid, itemId: ni.id, equipped: better, currentDurability: s.durability });
}
export async function giveReward(c: { id: string; level: number; xp: number | string; gold: number | string }, rw: Reward, m = 1) {
  const gain = Math.round(monsterXp(Math.min(200, c.level + 4)) * rw.xpB * Number(process.env.XP_MULTIPLIER ?? 1) * m), r = applyXp(c.level, Number(c.xp), gain);
  await db.update(characters).set({ level: r.level, xp: r.xp, gold: Number(c.gold) + Math.round((rw.gold + c.level * 10) * m) }).where(eq(characters.id, c.id));
  for (const it of rw.items ?? []) { if (it.g === "gear") await addGear(c.id, it.z, it.k); else if (it.g === "cons") await addCons(c.id, CONS[it.k].name, it.n); else await addMaterial(c.id, it.z, it.n); }
}
