import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { characters, inventory, items } from "@/db/schema";
import { CONT_LIMIT, DAUGHTER, GEAR, HAZ_Z, OUT_LIMIT, doseNow, gameHalfLifeHours, isRadioactive, loadOf, protOf, type Hz } from "@/lib/game/hazard";

// Servidor: guarda a exposição no JSON `activity` (hz = estado, cont = Contenção) e aplica decaimento e dose de forma PREGUIÇOSA:
// só quando algo mexe nos elementos perigosos (ou numa ação do laboratório). Sem cron por jogador. Este arquivo não importa lib/equip.ts (que importa este).
type Act = NonNullable<(typeof characters.$inferSelect)["activity"]>;
const matRow = async (cid: string, z: number) => (await db.select({ id: inventory.id, itemId: items.id, qty: inventory.quantity }).from(items).leftJoin(inventory, and(eq(inventory.itemId, items.id), eq(inventory.characterId, cid))).where(and(eq(items.elementAtomicNumber, z), eq(items.type, "material"))).limit(1))[0];
export async function adjustInv(cid: string, z: number, delta: number) {
  const r = await matRow(cid, z);
  if (!r) return false;
  if (r.id) await db.update(inventory).set({ quantity: Math.max(0, (r.qty ?? 0) + delta) }).where(eq(inventory.id, r.id));
  else if (delta > 0) await db.insert(inventory).values({ characterId: cid, itemId: r.itemId, quantity: delta });
  return true;
}
export const invQty = async (cid: string, z: number) => (await matRow(cid, z))?.qty ?? 0;
// elementos perigosos que o jogador carrega: [{z, qty}]
export async function held(cid: string) {
  const rows = await db.select({ z: items.elementAtomicNumber, qty: inventory.quantity }).from(inventory).innerJoin(items, eq(inventory.itemId, items.id))
    .where(and(eq(inventory.characterId, cid), eq(items.type, "material"), inArray(items.elementAtomicNumber, HAZ_Z)));
  return rows.flatMap((r) => (r.z && r.qty > 0 ? [{ z: r.z, qty: r.qty }] : []));
}
const ownsItem = async (cid: string, name: string) => (await db.select({ q: inventory.quantity }).from(inventory).innerJoin(items, eq(inventory.itemId, items.id)).where(and(eq(inventory.characterId, cid), eq(items.name, name))).limit(1))[0]?.q ?? 0;
export const gearQty = (cid: string, key: keyof typeof GEAR) => ownsItem(cid, GEAR[key].name);
export async function gearId(key: keyof typeof GEAR) {
  const name = GEAR[key].name, [i] = await db.select({ id: items.id }).from(items).where(and(eq(items.name, name), eq(items.type, "consumivel"))).limit(1);
  if (i) return i.id;
  const [n] = await db.insert(items).values({ name, type: "consumivel", rarity: "raro", stats: {}, value: key === "antidote" ? 40 : 150 }).returning({ id: items.id });
  return n.id;
}
const load = async (cid: string): Promise<Act> => ((await db.select({ a: characters.activity }).from(characters).where(eq(characters.id, cid)))[0]?.a ?? {}) as Act;
const store = (cid: string, a: Act) => db.update(characters).set({ activity: a as never }).where(eq(characters.id, cid));

// QUALQUER gravação de `activity` fora deste módulo deve preservar hz/cont atuais: as ações leem `activity` no começo e gravam no fim,
// e o settle() grava hz/cont no meio. Sem isto, a Contenção seria sobrescrita por uma cópia velha.
export async function keep(cid: string, a: Act): Promise<Act> { const f = await load(cid); return { ...a, hz: f.hz, cont: f.cont }; }
export const saveActivity = async (cid: string, a: Act) => store(cid, await keep(cid, a));

// Atualiza decaimento (a cada ≥ 10 min), dose, carga e proteção. Chamar ANTES e DEPOIS de mudar elementos perigosos.
export async function settle(cid: string, now = Date.now()): Promise<Hz> {
  const act = await load(cid), cont: Record<string, number> = { ...(act.cont ?? {}) };
  let hz: Hz = act.hz ?? { at: now, da: now, dose: 0, load: { rad: 0, tox: 0 }, prot: { rad: 0, tox: 0 } };
  const dH = (now - hz.da) / 3.6e6;
  if (dH >= 1 / 6) { // decaimento: cada radioativo vira o filho real, na mesma "gaveta" (comigo ou na Contenção); a Contenção NÃO para o decaimento
    const mine = await held(cid);
    for (const z of HAZ_Z.filter(isRadioactive)) {
      const frac = 1 - 0.5 ** (dH / gameHalfLifeHours(z)), d = DAUGHTER[z];
      const take = (q: number) => { const e = q * frac, n = Math.floor(e) + (Math.random() < e - Math.floor(e) ? 1 : 0); return Math.min(q, n); };
      const a = take(mine.find((h) => h.z === z)?.qty ?? 0), b = take(cont[z] ?? 0);
      if (a > 0) { await adjustInv(cid, z, -a); await adjustInv(cid, d, a); }
      if (b > 0) { cont[z] = (cont[z] ?? 0) - b; cont[d] = (cont[d] ?? 0) + b; if (!cont[z]) delete cont[z]; }
    }
    hz = { ...hz, da: now };
  }
  const [lead, epi] = await Promise.all([gearQty(cid, "lead"), gearQty(cid, "epi")]);
  hz = { at: now, da: hz.da, dose: doseNow(hz, now), load: loadOf(await held(cid)), prot: protOf(lead > 0, epi > 0) };
  await store(cid, { ...act, hz, cont });
  return hz;
}

// chega elemento perigoso (drop, recompensa, expedição): cabe até OUT_LIMIT comigo; o resto vai para a Contenção (e sobra é descartado)
export async function addHazardous(cid: string, z: number, n: number) {
  await settle(cid);
  const out = (await held(cid)).reduce((s, h) => s + h.qty, 0), toMe = Math.min(n, Math.max(0, OUT_LIMIT - out)), rest = n - toMe;
  if (toMe) await adjustInv(cid, z, toMe);
  if (rest) {
    const act = await load(cid), cont = { ...(act.cont ?? {}) }, used = Object.values(cont).reduce((s, v) => s + v, 0), put = Math.min(rest, Math.max(0, CONT_LIMIT - used));
    if (put) { cont[z] = (cont[z] ?? 0) + put; await store(cid, { ...act, cont }); }
  }
  await settle(cid);
  return true;
}
export async function takeHazardous(cid: string, z: number, n: number) {
  await settle(cid);
  const ok = (await invQty(cid, z)) >= n && (await adjustInv(cid, z, -n));
  await settle(cid);
  return ok;
}
// elemento "em qualquer lugar" (comigo + Contenção): o laboratório usa o que estiver guardado, sem precisar retirar
export const contQty = async (cid: string, z: number) => (await load(cid)).cont?.[z] ?? 0;
export const elemQty = async (cid: string, z: number) => (await invQty(cid, z)) + (await contQty(cid, z));
export async function elemTake(cid: string, z: number, n: number) {
  if ((await elemQty(cid, z)) < n) return false;
  const mine = Math.min(n, await invQty(cid, z));
  if (mine && !(await takeHazardousOrNormal(cid, z, mine))) return false;
  const rest = n - mine;
  if (rest) { const act = await load(cid), cont = { ...(act.cont ?? {}) }; cont[z] = (cont[z] ?? 0) - rest; if (!cont[z]) delete cont[z]; await store(cid, { ...act, cont }); }
  return true;
}
const takeHazardousOrNormal = async (cid: string, z: number, n: number) => (HAZ_Z.includes(z) ? takeHazardous(cid, z, n) : adjustInv(cid, z, -n));

// Contenção: guardar e retirar (retirar respeita o limite de carga)
export async function contain(cid: string, z: number, n: number) {
  if (!HAZ_Z.includes(z) || n < 1 || (await invQty(cid, z)) < n) return 0;
  await settle(cid);
  const act = await load(cid), cont = { ...(act.cont ?? {}) }, used = Object.values(cont).reduce((s, v) => s + v, 0), put = Math.min(n, CONT_LIMIT - used);
  if (put < 1) return 0;
  await adjustInv(cid, z, -put);
  cont[z] = (cont[z] ?? 0) + put;
  await store(cid, { ...act, cont });
  await settle(cid);
  return put;
}
export async function release(cid: string, z: number, n: number) {
  await settle(cid);
  const act = await load(cid), cont = { ...(act.cont ?? {}) }, out = (await held(cid)).reduce((s, h) => s + h.qty, 0), take = Math.min(n, cont[z] ?? 0, Math.max(0, OUT_LIMIT - out));
  if (take < 1) return 0;
  cont[z] -= take;
  if (!cont[z]) delete cont[z];
  await adjustInv(cid, z, take);
  await store(cid, { ...act, cont });
  await settle(cid);
  return take;
}
export async function addDose(cid: string, delta: number) {
  const hz = await settle(cid), act = await load(cid);
  await store(cid, { ...act, hz: { ...hz, dose: Math.min(100, Math.max(0, hz.dose + delta)) } });
}

// itens de proteção e antídoto (consumíveis): guardar e gastar
export async function addGear(cid: string, key: keyof typeof GEAR, n: number) {
  const id = await gearId(key), [row] = await db.select().from(inventory).where(and(eq(inventory.characterId, cid), eq(inventory.itemId, id))).limit(1);
  if (row) await db.update(inventory).set({ quantity: row.quantity + n }).where(eq(inventory.id, row.id));
  else await db.insert(inventory).values({ characterId: cid, itemId: id, quantity: n });
  await settle(cid); // a proteção muda
}
export async function takeGear(cid: string, key: keyof typeof GEAR, n: number) {
  const [row] = await db.select({ id: inventory.id, q: inventory.quantity }).from(inventory).innerJoin(items, eq(inventory.itemId, items.id)).where(and(eq(inventory.characterId, cid), eq(items.name, GEAR[key].name))).limit(1);
  if (!row || row.q < n) return false;
  if (row.q === n) await db.delete(inventory).where(eq(inventory.id, row.id)); else await db.update(inventory).set({ quantity: row.q - n }).where(eq(inventory.id, row.id));
  await settle(cid);
  return true;
}
