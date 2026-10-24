"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { getActiveCharacter } from "@/lib/session";
import { WORLD, ZBYPOWER } from "@/lib/game/world";
import { ELEMENT_BY_Z } from "@/lib/game/elements";
import { applyXp, monsterXp } from "@/lib/game/xp";
import { track } from "@/lib/rewards";
import { CONS, addCons } from "@/lib/consumables";
import { addElement, takeElement, elementQty } from "@/lib/equip";
import { addStone } from "@/lib/stone";
import { EXP, chargesNow, RECIPES } from "@/lib/game/activities";
import { activeEvents, evMult } from "@/lib/game/live";

const XPM = Number(process.env.XP_MULTIPLIER ?? 1), rn = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1)), pk = <T,>(a: readonly T[]) => a[rn(0, a.length - 1)];
const nm = (z: number) => ELEMENT_BY_Z.get(z)?.[2] ?? `Z=${z}`;
const save = (id: string, activity: Record<string, unknown>) => db.update(characters).set({ activity: activity as never }).where(eq(characters.id, id));

// ───── EXPEDIÇÕES ─────
export async function startExpedition(fd: FormData) {
  const a = await getActiveCharacter();
  if (!a?.map) return;
  const tier = Number(fd.get("tier")), act = a.c.activity ?? {};
  if (!EXP[tier] || (act.exp && act.exp.endsAt)) return;
  await save(a.c.id, { ...act, exp: { tier, slug: a.map.slug, endsAt: Date.now() + EXP[tier].min * 60_000 } });
  revalidatePath("/atividades");
}
export async function claimExpedition() {
  const a = await getActiveCharacter();
  if (!a) return;
  const act = a.c.activity ?? {}, ex = act.exp;
  if (!ex || Date.now() < ex.endsAt) return;
  const T = EXP[ex.tier], lvl = a.c.level, w = WORLD[ex.slug];
  const evs = await activeEvents();
  const gain = Math.round(monsterXp(lvl) * T.kills * 0.8 * XPM * evMult(evs, "xp")), gold = Math.round((5.5 + lvl) * T.kills * 0.8 * evMult(evs, "gold"));
  const r = applyXp(lvl, Number(a.c.xp), gain), rep = [`${T.n} concluída: +${gain.toLocaleString("pt-BR")} XP, +${gold.toLocaleString("pt-BR")}g`];
  const drops = Math.floor(T.kills / 6) + (Math.random() < 0.5 ? 1 : 0);
  for (let i = 0; i < drops; i++) {
    const z = pk(Math.random() < 0.2 ? w.dg : w.dr), n = rn(1, 2);
    await addElement(a.c.id, z, n);
    rep.push(`+${n}× ${nm(z)}`);
  }
  await track(a.c.id, "gather", "", drops);
  await db.update(characters).set({ level: r.level, xp: r.xp, gold: Number(a.c.gold) + gold, activity: { ...act, exp: null, last: rep } as never }).where(eq(characters.id, a.c.id));
  revalidatePath("/atividades");
}

// ───── ESCAVAÇÃO DE VEIOS ─────
export async function dig(fd: FormData) {
  const a = await getActiveCharacter();
  if (!a?.map) return;
  const act = a.c.activity ?? {}, d = chargesNow(act.dig);
  if (d.charges < 1) return;
  const rich = Math.random() < 0.22; // cada sonda é sorteada no servidor (o ponto clicado não muda a sorte)
  const w = WORLD[a.map.slug], rep: string[] = [];
  if (Math.random() < 0.18) rep.push("Só pedras e poeira desta vez.");
  else {
    const z = pk(Math.random() < (rich ? 0.35 : 0.1) ? w.dg : w.dr), n = rich ? rn(2, 4) : rn(1, 2);
    await addElement(a.c.id, z, n);
    rep.push(`${rich ? "VEIO RICO! " : ""}+${n}× ${nm(z)}`);
    await track(a.c.id, "gather", "", n);
  }
  const g = rn(2, 6) + Math.floor(a.c.level / 2);
  await db.update(characters).set({ gold: Number(a.c.gold) + g, activity: { ...act, dig: { charges: d.charges - 1, at: d.at }, last: rep } as never }).where(eq(characters.id, a.c.id));
  revalidatePath("/atividades");
}

// ───── LABORATÓRIO ─────
export async function synthesize(fd: FormData) {
  const a = await getActiveCharacter();
  if (!a) return;
  const act = a.c.activity ?? {}, bonus = a.c.classKey === "quimica" ? 1.5 : 1; // Elemental: +50% de rendimento
  const id = String(fd.get("id"));
  const rep: string[] = [];
  if (id === "transmuta") {
    const z = Number(fd.get("z")), i = ZBYPOWER.indexOf(z);
    if (i < 0 || i >= ZBYPOWER.length - 4 || !(await takeElement(a.c.id, z, 5))) return;
    const out = ZBYPOWER[Math.min(ZBYPOWER.length - 1, i + rn(3, 14))], n = Math.random() < bonus - 1 ? 2 : 1; // Elemental: 50% de chance de render 2
    await addElement(a.c.id, out, n);
    rep.push(`Transmutação: 5× ${nm(z)} → ${n}× ${nm(out)}`);
  } else {
    const rc = RECIPES.find((r) => r.id === id);
    if (!rc) return;
    for (const [z, q] of rc.inp) { const have = await elementQty(a.c.id, z); if (!have || have.quantity < q) return; }
    for (const [z, q] of rc.inp) await takeElement(a.c.id, z, q);
    const n = Math.round(rc.out.n * bonus);
    if (rc.out.cons === "tp") await addStone(a.c.id, n);
    else await addCons(a.c.id, CONS[rc.out.cons].name, n);
    rep.push(`${rc.n}: ${rc.d.replace(/^\d+/, String(n))}`);
  }
  await save(a.c.id, { ...act, last: rep });
  revalidatePath("/atividades");
}
// Infusão Elemental: escolha o elemento (0 = nenhum). É gasto 1 por monstro enfrentado.
export async function setInfuse(fd: FormData) {
  const a = await getActiveCharacter();
  if (!a || a.c.classKey !== "quimica") return;
  const z = Number(fd.get("z")) || null, kit = a.c.kit ?? { learned: [0], loadout: [0] };
  await db.update(characters).set({ kit: { ...kit, infuse: z } }).where(eq(characters.id, a.c.id));
  revalidatePath("/atividades");
}
