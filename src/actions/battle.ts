"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  battles,
  characters,
  inventory,
  items,
  aiMonsters,
  battleLogs,
  questProgress,
  partyMembers,
} from "@/db/schema";
import { getActiveCharacter } from "@/lib/session";
import { loadPlayer } from "@/lib/game/player";
import {
  mkMon,
  withArch,
  step,
  type Act,
  type BState,
} from "@/lib/game/battle";
import { WORLD } from "@/lib/game/world";
import { KILL } from "@/lib/game/quests";
import { applyXp } from "@/lib/game/xp";
const XPM = Number(process.env.XP_MULTIPLIER ?? 1),
  rn = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1)),
  pk = <T>(a: T[]) => a[rn(0, a.length - 1)];

async function spawn(
  slug: string,
  names: string[],
  min: number,
  boss: boolean,
) {
  // 60% de chance de usar monstro gerado pela IA (se existir)
  if (!boss) {
    const rows = await db
      .select()
      .from(aiMonsters)
      .where(eq(aiMonsters.mapSlug, slug))
      .limit(30);
    if (rows.length && Math.random() < 0.6) {
      const r = pk(rows);
      return withArch(mkMon([r.name], min, false), r.archetype);
    }
  }
  return mkMon(names, min, boss);
}

export async function startBattle(fd: FormData) {
  const a = await getActiveCharacter();
  if (!a?.map) redirect("/characters");
  const w = WORLD[a.map.slug],
    min = a.map.minLevel,
    dungeon = fd.get("kind") === "dungeon";
  const sp = (boss: boolean) => spawn(a.map!.slug, w.mons, min, boss);
  const [e, ...q] = dungeon
    ? [await sp(false), await sp(false), await sp(false), await sp(true)]
    : [await sp(false)];
  const state: BState = {
    e,
    q,
    wave: 1,
    dungeon,
    mapSlug: a.map.slug,
    buf: 0,
    cu: 0,
    sv: null,
    log: [`${dungeon ? "🌀 Onda 1: " : ""}${e.n} (Nv. ${e.L}) apareceu!`],
    over: null,
    res: [],
  };
  await db
    .insert(battles)
    .values({ characterId: a.c.id, state })
    .onConflictDoUpdate({ target: battles.characterId, set: { state } });
  redirect("/battle");
}
export async function rest() {
  const a = await getActiveCharacter();
  if (!a) return;
  const P = await loadPlayer(a.c.id);
  await db
    .update(characters)
    .set({ hp: P.q.hp, mp: P.q.mp })
    .where(eq(characters.id, a.c.id));
  revalidatePath("/play");
}
async function addMat(cid: string, z: number, n: number) {
  const [it] = await db
    .select({ id: items.id })
    .from(items)
    .where(and(eq(items.elementAtomicNumber, z), eq(items.type, "material")))
    .limit(1);
  if (!it) return;
  const [ex] = await db
    .select()
    .from(inventory)
    .where(and(eq(inventory.characterId, cid), eq(inventory.itemId, it.id)))
    .limit(1);
  if (ex)
    await db
      .update(inventory)
      .set({ quantity: ex.quantity + n })
      .where(eq(inventory.id, ex.id));
  else
    await db
      .insert(inventory)
      .values({ characterId: cid, itemId: it.id, quantity: n });
}
export async function battleAct(act: Act | { a: "next" } | { a: "end" }) {
  const a = await getActiveCharacter();
  if (!a) return;
  const cid = a.c.id;
  const [row] = await db
    .select()
    .from(battles)
    .where(eq(battles.characterId, cid));
  if (!row) return;
  if (act.a === "end") {
    await db.delete(battles).where(eq(battles.characterId, cid));
    return;
  }
  const b = row.state as BState;
  let P = await loadPlayer(cid);
  const p = { hp: P.c.hp, mp: P.c.mp, gold: Number(P.c.gold), lv: P.c.level };
  let lvl = P.c.level,
    xp = Number(P.c.xp),
    lvUp = 0;
  if (act.a === "next") {
    if (b.over === "wave") {
      b.e = b.q.shift()!;
      b.wave++;
      b.over = null;
      b.t = 0;
      b.log = [`🌀 Onda ${b.wave}: ${b.e.n} (Nv. ${b.e.L})`];
    }
  } else {
    const before = b.over,
      used0 = b.domUsed;
    step(b, p, P.q, P.k.key, act, P.c.domain);
    if (!used0 && b.domUsed && P.c.domain)
      await db
        .update(characters)
        .set({ domain: { ...P.c.domain, uses: P.c.domain.uses + 1 } })
        .where(eq(characters.id, cid));
    if (!before && b.over)
      await db
        .insert(battleLogs)
        .values({
          characterId: cid,
          mapSlug: b.mapSlug,
          classKey: P.k.key,
          charLevel: P.c.level,
          monsterLevel: b.e.L,
          dungeon: b.dungeon,
          outcome:
            b.over === "lose" ? "lose" : b.over === "flee" ? "flee" : "win",
          turns: b.t ?? 0,
          hpLeftPct: Math.round((100 * p.hp) / P.q.hp),
        });
    if (!before && (b.over === "wave" || b.over === "win")) {
      const [pm] = await db
        .select({ pid: partyMembers.partyId })
        .from(partyMembers)
        .where(eq(partyMembers.characterId, cid));
      let pb = 0;
      if (pm && P.c.currentMapId)
        pb =
          (
            await db
              .select({ id: partyMembers.characterId })
              .from(partyMembers)
              .innerJoin(
                characters,
                eq(partyMembers.characterId, characters.id),
              )
              .where(
                and(
                  eq(partyMembers.partyId, pm.pid),
                  eq(characters.currentMapId, P.c.currentMapId),
                ),
              )
          ).length - 1;
      const w = WORLD[b.mapSlug],
        g = rn(3, 8) + b.e.L,
        gain = Math.round(b.e.xp * XPM * (1 + 0.1 * Math.max(0, pb)));
      p.gold += g;
      for (const k of KILL.filter((k) => k.slug === b.mapSlug))
        await db
          .insert(questProgress)
          .values({ characterId: cid, questId: k.id, progress: 1 })
          .onConflictDoUpdate({
            target: [questProgress.characterId, questProgress.questId],
            set: { progress: sql`${questProgress.progress} + 1` },
          });
      const r = applyXp(lvl, xp, gain);
      lvl = r.level;
      xp = r.xp;
      lvUp = r.levelsGained;
      b.res = [`✅ ${b.e.n} derrotado! +${gain.toLocaleString()} XP, +${g}g`];
      if (Math.random() < 0.5) {
        const z = pk(w.dr),
          n = rn(1, 2);
        await addMat(cid, z, n);
        b.res.push(`+${n}× elemento Z=${z}`);
      }
      if (b.over === "win" && b.dungeon) {
        for (let i = 0; i < 2; i++) {
          const z = pk(w.dg),
            n = rn(1, 3);
          await addMat(cid, z, n);
          b.res.push(`🏆 +${n}× elemento Z=${z}`);
        }
      }
      if (lvUp) b.res.push(`⬆️ Nível ${lvl}!`);
    }
    if (b.over === "lose") {
      p.hp = Math.ceil(P.q.hp / 2);
      p.gold = Math.floor(p.gold * 0.9);
      b.res = ["💀 Você caiu. Perdeu 10% do ouro."];
    }
  }
  await db
    .update(characters)
    .set({ hp: p.hp, mp: p.mp, gold: p.gold, level: lvl, xp })
    .where(eq(characters.id, cid));
  if (lvUp) {
    P = await loadPlayer(cid);
    await db
      .update(characters)
      .set({ hp: P.q.hp, mp: P.q.mp })
      .where(eq(characters.id, cid));
  }
  await db
    .update(battles)
    .set({ state: b, updatedAt: new Date() })
    .where(eq(battles.characterId, cid));
}
