"use server";
import { redirect } from "next/navigation";
import { track } from "@/lib/rewards";
import { CONS, stack } from "@/lib/consumables";
import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { battles, characters, battleLogs, questProgress, partyMembers, inventory, customQuests } from "@/db/schema";
import { activeEvents, evMult } from "@/lib/game/live";
import { getActiveCharacter } from "@/lib/session";
import { loadPlayer } from "@/lib/game/player";
import { step, type Act, type BState } from "@/lib/game/battle";
import { WORLD } from "@/lib/game/world";
import { REALMS } from "@/lib/game/realms";
import { realmStatus } from "@/lib/game/realm-schedule";
import { KILL } from "@/lib/game/quests";
import { applyXp } from "@/lib/game/xp";
import { ELEMENT_BY_Z } from "@/lib/game/elements";
import { spawn, blankState, saveBattle, infuse } from "@/lib/game/encounter";
import { addElement } from "@/lib/equip";
import { loadout4 } from "@/lib/game/loadout";
const XPM = Number(process.env.XP_MULTIPLIER ?? 1),
  rn = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1)),
  pk = <T,>(a: T[]) => a[rn(0, a.length - 1)];
const elName = (z: number) => ELEMENT_BY_Z.get(z)?.[2] ?? `Z=${z}`;

// kind: "endless" (Portão da Cidade: caçada contínua) · "dungeon" (Reino) · "hunt" = alias antigo de endless
export async function startBattle(fd: FormData) {
  const a = await getActiveCharacter();
  if (!a?.map) redirect("/characters");
  const slug = a.map.slug, lvl = a.c.level, k = String(fd.get("kind"));
  const dungeon = k === "dungeon", endless = !dungeon;
  if (dungeon && !realmStatus(slug).open) redirect("/play"); // o Reino só abre na janela de 1h do dia
  const P = await loadPlayer(a.c.id);
  const sp = (kind: "mon" | "sub" | "boss") => spawn(slug, lvl, kind, dungeon);
  const [e, ...q] = dungeon ? [await sp("mon"), await sp("sub"), await sp("mon"), await sp("boss")] : [await sp("mon")]; // Reino: monstro, sub-chefe, monstro, chefe
  const realmName = REALMS[slug]?.name ?? "Reino";
  const state = blankState(e, q, slug, {
    dungeon,
    endless,
    run: endless ? { kills: 0, xp: 0, gold: 0, heat: 0 } : undefined,
    log: dungeon ? [`🏰 Você entra no ${realmName}!`, `🏁 Etapa 1: ${e.n} (Nv. ${e.L})`] : [`${e.n} (Nv. ${e.L}) apareceu!`],
  });
  await infuse(a.c.id, P.k.key, P.kit.infuse, state, P.q.hp);
  await saveBattle(a.c.id, state);
  redirect("/battle");
}
export async function rest() {
  const a = await getActiveCharacter();
  if (!a) return;
  const P = await loadPlayer(a.c.id);
  await db.update(characters).set({ hp: P.q.hp, mp: P.q.mp }).where(eq(characters.id, a.c.id));
  revalidatePath("/play");
}
export async function battleAct(act: Act | { a: "next" } | { a: "end" }) {
  const a = await getActiveCharacter();
  if (!a) return;
  const cid = a.c.id;
  const [row] = await db.select().from(battles).where(eq(battles.characterId, cid));
  if (!row) return;
  if (act.a === "end") {
    await db.delete(battles).where(eq(battles.characterId, cid)); // "Voltar para a Cidade" (o progresso do grind já foi pago a cada monstro)
    return;
  }
  const b = row.state as BState;
  let P = await loadPlayer(cid);
  const p = { hp: P.c.hp, mp: P.c.mp, gold: Number(P.c.gold), lv: P.c.level };
  let lvl = P.c.level, xp = Number(P.c.xp), lvUp = 0;
  if (act.a === "next") {
    if (b.over === "wave") {
      b.e = b.q.shift()!;
      b.wave++;
      b.over = null;
      b.t = 0;
      b.charge = 0; b.et = 0; b.eDef = 0; b.skip = false; b.dot = null; b.pStun = false;
      b.log = [b.endless ? `⚔ ${b.e.n} (Nv. ${b.e.L}) apareceu!` : `🏁 Etapa ${b.wave}: ${b.e.n} (Nv. ${b.e.L})`];
      if (b.endless) await infuse(cid, P.k.key, P.kit.infuse, b, P.q.hp);
    }
  } else {
    if (act.a === "skill") {
      // só vale poder APRENDIDO e EQUIPADO no loadout (as 4 posições da Academia)
      if (!loadout4(P.kit.loadout).includes(act.i) || !P.kit.learned.includes(act.i)) return;
    }
    if (act.a === "potion") {
      // gasta 1 poção do estoque; sem estoque, avisa e não perde o turno
      const nm = act.k === "ea" ? CONS.ea.name : CONS.hp.name, { row } = await stack(cid, nm);
      if (!row || row.quantity < 1) {
        b.log.push(`Você não tem ${nm}. Compre na Loja de Conveniência.`);
        await db.update(battles).set({ state: b }).where(eq(battles.characterId, cid));
        return;
      }
      await db.update(inventory).set({ quantity: row.quantity - 1 }).where(eq(inventory.id, row.id));
    }
    const before = b.over, used0 = b.domUsed;
    step(b, p, P.q, P.k.key, act, P.c.domain);
    if (P.c.isGm) {
      // personagem GM: nunca morre (HP sempre cheio)
      p.hp = P.q.hp;
      if (b.over === "lose") b.over = null;
    }
    if (!used0 && b.domUsed && P.c.domain)
      await db.update(characters).set({ domain: { ...P.c.domain, uses: P.c.domain.uses + 1 } }).where(eq(characters.id, cid));
    if (!before && b.over)
      await db.insert(battleLogs).values({
        characterId: cid, mapSlug: b.mapSlug, classKey: P.k.key, charLevel: P.c.level, monsterLevel: b.e.L, dungeon: b.dungeon,
        outcome: b.over === "lose" ? "lose" : b.over === "flee" ? "flee" : "win", turns: b.t ?? 0, hpLeftPct: Math.round((100 * p.hp) / P.q.hp),
      });
    if (!before && (b.over === "wave" || b.over === "win")) {
      const [pm] = await db.select({ pid: partyMembers.partyId }).from(partyMembers).where(eq(partyMembers.characterId, cid));
      let pb = 0;
      if (pm && P.c.currentMapId)
        pb = (await db.select({ id: partyMembers.characterId }).from(partyMembers).innerJoin(characters, eq(partyMembers.characterId, characters.id)).where(and(eq(partyMembers.partyId, pm.pid), eq(characters.currentMapId, P.c.currentMapId)))).length - 1;
      const w = WORLD[b.mapSlug], kind = b.e.kind ?? (b.e.boss ? "boss" : "mon");
      const evs = await activeEvents(), mx = evMult(evs, "xp"), mg = evMult(evs, "gold"), md = evMult(evs, "drop"); // eventos criados no /admin
      const g = Math.round((rn(3, 8) + b.e.L) * (kind === "boss" ? 10 : kind === "sub" ? 3 : 1) * mg);
      const gain = Math.round(b.e.xp * XPM * (1 + 0.1 * Math.max(0, pb)) * mx);
      p.gold += g;
      await track(cid, "kill", b.mapSlug);
      for (const k of KILL.filter((k) => k.slug === b.mapSlug))
        await db.insert(questProgress).values({ characterId: cid, questId: k.id, progress: 1 }).onConflictDoUpdate({ target: [questProgress.characterId, questProgress.questId], set: { progress: sql`${questProgress.progress} + 1` } });
      // missões especiais de "derrotar" criadas no /admin
      for (const cq of await db.select().from(customQuests).where(and(eq(customQuests.active, true), eq(customQuests.kind, "kill"))).catch(() => []))
        if (!cq.mapSlug || cq.mapSlug === b.mapSlug)
          await db.insert(questProgress).values({ characterId: cid, questId: cq.id, progress: 1 }).onConflictDoUpdate({ target: [questProgress.characterId, questProgress.questId], set: { progress: sql`${questProgress.progress} + 1` } });
      const r = applyXp(lvl, xp, gain);
      lvl = r.level; xp = r.xp; lvUp = r.levelsGained;
      b.res = [`✅ ${b.e.n} derrotado! +${gain.toLocaleString()} XP, +${g}g`];
      if (Math.random() < Math.min(1, (kind === "mon" ? 0.5 : 1) * md)) {
        const z = pk(kind === "mon" ? w.dr : w.dg), n = Math.max(1, Math.round((kind === "boss" ? rn(2, 4) : rn(1, 2)) * md));
        await addElement(cid, z, n);
        await track(cid, "gather", "", n);
        b.res.push(`+${n}× ${elName(z)}`);
      }
      if (b.over === "win" && b.dungeon) {
        b.res.push(`🏰 ${REALMS[b.mapSlug]?.name ?? "Reino"} concluído!`);
        await track(cid, "portal", b.mapSlug);
        for (let i = 0; i < 2; i++) {
          const z = pk(w.dg), n = rn(1, 3);
          await addElement(cid, z, n);
          await track(cid, "gather", "", n);
          b.res.push(`🏆 +${n}× ${elName(z)}`);
        }
      }
      if (lvUp) b.res.push(`⬆️ Nível ${lvl}!`);
      if (b.endless && b.run) {
        // grind infinito: soma na corrida, sobe a intensidade e já prepara o próximo monstro (a cada 10º sub-chefe, a cada 25º chefe)
        b.run.kills++; b.run.xp += gain; b.run.gold += g;
        b.run.heat = Math.min(0.6, 0.04 * Math.floor(b.run.kills / 5));
        const n = b.run.kills + 1, nk = n % 25 === 0 ? "boss" : n % 10 === 0 ? "sub" : "mon";
        b.q = [await spawn(b.mapSlug, lvl, nk, false, b.run.heat)];
        if (nk !== "mon") b.res.push(`⚠ Próximo: ${nk === "boss" ? "CHEFE" : "sub-chefe"}!`);
      }
    }
    if (b.over === "lose") {
      p.hp = Math.ceil(P.q.hp / 2);
      p.gold = Math.floor(p.gold * 0.9);
      b.res = ["💀 Você caiu. Perdeu 10% do ouro."];
    }
  }
  await db.update(characters).set({ hp: p.hp, mp: p.mp, gold: p.gold, level: lvl, xp }).where(eq(characters.id, cid));
  if (lvUp) {
    P = await loadPlayer(cid);
    await db.update(characters).set({ hp: P.q.hp, mp: P.q.mp }).where(eq(characters.id, cid));
  }
  await db.update(battles).set({ state: b, updatedAt: new Date() }).where(eq(battles.characterId, cid));
}
