import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { characters, inventory, items } from "@/db/schema";
import { addElement, elementQty, takeElement } from "@/lib/equip";
import { BY_ID, COMPOUND_PT, compoundValue, needs, pretty, SYMBOLS, yields, STARTERS, type Parsed } from "@/lib/game/reactions";

// compostos do laboratório são itens "consumivel" com o nome "Nome (Fórmula)"; o item é criado na primeira vez que alguém produz o composto
export const compoundItemName = (f: string) => `${COMPOUND_PT[f]} (${pretty(f)})`;
const findId = async (f: string) => (await db.select({ id: items.id }).from(items).where(and(eq(items.name, compoundItemName(f)), eq(items.type, "consumivel"))).limit(1))[0]?.id;
async function makeId(f: string) {
  const id = await findId(f);
  if (id) return id;
  const [n] = await db.insert(items).values({ name: compoundItemName(f), type: "consumivel", rarity: "comum", stats: {}, value: compoundValue(f) }).returning({ id: items.id });
  return n.id;
}
const rowOf = async (cid: string, id: string) => (await db.select().from(inventory).where(and(eq(inventory.characterId, cid), eq(inventory.itemId, id))).limit(1))[0];
export async function compoundQty(cid: string, f: string) {
  const id = await findId(f);
  return id ? (await rowOf(cid, id))?.quantity ?? 0 : 0;
}
export async function addCompound(cid: string, f: string, n: number) {
  const id = await makeId(f), row = await rowOf(cid, id);
  if (row) await db.update(inventory).set({ quantity: row.quantity + n }).where(eq(inventory.id, row.id));
  else await db.insert(inventory).values({ characterId: cid, itemId: id, quantity: n });
}
export async function takeCompound(cid: string, f: string, n: number) {
  const id = await findId(f), row = id ? await rowOf(cid, id) : undefined;
  if (!row || row.quantity < n) return false;
  if (row.quantity === n) await db.delete(inventory).where(eq(inventory.id, row.id));
  else await db.update(inventory).set({ quantity: row.quantity - n }).where(eq(inventory.id, row.id));
  return true;
}
// quantidade de uma espécie (elemento ou composto) no inventário
export async function speciesQty(cid: string, sp: { el: number | null; sp: string }) {
  return sp.el != null ? (await elementQty(cid, sp.el))?.quantity ?? 0 : compoundQty(cid, sp.sp);
}
export const hasAll = async (cid: string, p: Parsed) => {
  for (const n of needs(p)) if ((await speciesQty(cid, n)) < n.q) return false;
  return !p.cat || (await speciesQty(cid, { el: null, sp: p.cat })) >= 1;
};
// executa a reação: gasta os reagentes (o catalisador só precisa existir) e guarda os produtos (gás liberado se perde)
export async function perform(cid: string, p: Parsed, bonus = 1): Promise<{ sp: string; q: number }[] | null> {
  if (!(await hasAll(cid, p))) return null;
  for (const n of needs(p)) if (!(n.el != null ? await takeElement(cid, n.el, n.q) : await takeCompound(cid, n.sp, n.q))) return null;
  const made: { sp: string; q: number }[] = [];
  for (const g of yields(p)) {
    if (g.gas) continue;
    const q = Math.max(g.q, Math.round(g.q * bonus)); // Elemental: +50% de rendimento
    if (g.el != null) await addElement(cid, g.el, q); else await addCompound(cid, g.sp, q);
    made.push({ sp: g.sp, q });
  }
  return made;
}
// compostos que o personagem tem: [fórmula, quantidade]
export async function ownedCompounds(cid: string) {
  const rows = await db.select({ name: items.name, qty: inventory.quantity }).from(inventory).innerJoin(items, eq(items.id, inventory.itemId)).where(and(eq(inventory.characterId, cid), eq(items.type, "consumivel")));
  const byName = new Map(Object.keys(COMPOUND_PT).map((f) => [compoundItemName(f), f]));
  return rows.flatMap((r) => { const f = byName.get(r.name); return f && r.qty > 0 ? [{ f, qty: r.qty }] : []; });
}
export const known = (act: { notebook?: string[] } | null | undefined) => new Set([...STARTERS, ...(act?.notebook ?? [])].filter((id) => BY_ID.has(id)));
export const isSpecies = (sp: string) => SYMBOLS.has(sp) || sp in COMPOUND_PT;
// missões e recompensas ensinam receitas
export async function learnRecipes(cid: string, ids: string[]) {
  const [c] = await db.select({ activity: characters.activity }).from(characters).where(eq(characters.id, cid));
  const act = c?.activity ?? {}, nb = new Set(act.notebook ?? []);
  const add = ids.filter((id) => BY_ID.has(id) && !nb.has(id));
  if (add.length) await db.update(characters).set({ activity: { ...act, notebook: [...nb, ...add] } as never }).where(eq(characters.id, cid));
  return add;
}
