"use server";
import { redirect } from "next/navigation";
import { track } from "@/lib/rewards";
import { CONS, stack } from "@/lib/consumables";
import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { battles, characters, battleLogs, questProgress, partyMembers, inventory, customQuests } from "@/db/schema";
import { activeEvents, evMult } from "@/lib/game/live";
import { withChar } from "@/lib/lock";
import { loadPlayer } from "@/lib/game/player";
import { advanceWave, step, type Act, type BState } from "@/lib/game/battle";
import { WORLD } from "@/lib/game/world";
import { REALMS } from "@/lib/game/realms";
import { realmStatus } from "@/lib/game/realm-schedule";
import { KILL } from "@/lib/game/quests";
import { applyXp } from "@/lib/game/xp";
import { ELEMENT_BY_Z } from "@/lib/game/elements";
import { spawn, blankState, saveBattle, infuse, hasActiveBattle } from "@/lib/game/encounter";
import { addElement } from "@/lib/equip";
import { loadout4 } from "@/lib/game/loadout";
import { pvpNorm } from "@/lib/game/pvp";
import { settleDuel } from "@/lib/arena-db";
import { getT } from "@/i18n/server";
import { elementName, realmName as realmLabel } from "@/i18n/content";
const XPM = Number(process.env.XP_MULTIPLIER ?? 1),
  rn = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1)),
  pk = <T,>(a: T[]) => a[rn(0, a.length - 1)];
const elName = (z: number) => ELEMENT_BY_Z.get(z)?.[2] ?? `Z=${z}`;

// kind: "endless" (Portão da Cidade: caçada contínua) · "dungeon" (Reino) · "hunt" = alias antigo de endless
export async function startBattle(fd: FormData) {
  return withChar(async (a) => {
    if (!a?.map) redirect("/characters");
    if (await hasActiveBattle(a.c.id)) redirect("/battle"); // já está lutando: continue a luta em vez de sortear outro monstro
    const slug = a.map.slug, lvl = a.c.level, k = String(fd.get("kind"));
    const dungeon = k === "dungeon", endless = !dungeon;
    if (dungeon && !realmStatus(slug).open) redirect("/play"); // o Reino só abre na janela de 1h do dia
    const P = await loadPlayer(a.c.id);
    const sp = (kind: "mon" | "sub" | "boss") => spawn(slug, lvl, kind, dungeon);
    const [e, ...q] = dungeon ? [await sp("mon"), await sp("sub"), await sp("mon"), await sp("boss")] : [await sp("mon")]; // Reino: monstro, sub-chefe, monstro, chefe
    const { lang, t } = await getT();
    const realmName = REALMS[slug]?.name ?? "Reino";
    const state = blankState(e, q, slug, {
      dungeon,
      endless,
      run: endless ? { kills: 0, xp: 0, gold: 0, heat: 0 } : undefined,
      log: dungeon ? [t("bt.enterRealm", { realm: realmLabel(lang, realmName) }), t("bt.stage", { w: 1, name: e.n, n: e.L })] : [t("bt.appeared", { name: e.n, n: e.L })],
    });
    await infuse(a.c.id, P.k.key, P.kit.infuse, state, P.q.hp);
    await saveBattle(a.c.id, state);
    redirect("/battle");
  });
}
export async function rest() {
  return withChar(async (a) => {
    if (!a) return;
    if (await hasActiveBattle(a.c.id)) return; // descansar só na cidade, nunca no meio da luta (cura grátis e, na Arena, passava do HP normalizado)
    const P = await loadPlayer(a.c.id);
    await db.update(characters).set({ hp: P.q.hp, mp: P.q.mp }).where(eq(characters.id, a.c.id));
    revalidatePath("/play");
  });
}
// o cliente pode mandar qualquer coisa para uma Server Action: confere o formato antes de usar
const isAct = (x: unknown): x is Act | { a: "next" } | { a: "end" } => {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>, int = (v: unknown) => typeof v === "number" && Number.isInteger(v) && v >= 0 && v < 64;
  switch (o.a) {
    case "next": case "end": case "flee": case "domain": return true;
    case "skill": return int(o.i) && typeof o.m === "number" && Number.isFinite(o.m);
    case "summon": return int(o.i);
    case "potion": return o.k === "hp" || o.k === "ea";
    default: return false;
  }
};
export async function battleAct(act: Act | { a: "next" } | { a: "end" }) {
  return withChar(async (a) => {
    if (!a || !isAct(act)) return;
    const cid = a.c.id;
    const [row] = await db.select().from(battles).where(eq(battles.characterId, cid));
    if (!row) return;
    if (act.a === "end") {
      const b0 = row.state as BState;
      if (b0.pvp && !b0.pvp.npc && !b0.over) {
        // sair de um duelo valendo rating no meio = derrota (antes dava para fugir sem perder pontos)
        const P0 = await loadPlayer(cid);
        b0.over = "lose";
        const r0 = await settleDuel(cid, b0, P0.c.name, P0.c.level, Number(P0.c.gold));
        await db.update(characters).set({ gold: r0.gold, hp: P0.q.hp, mp: P0.q.mp }).where(eq(characters.id, cid));
      }
      await db.delete(battles).where(eq(battles.characterId, cid)); // "Voltar para a Cidade" (o progresso do grind já foi pago a cada monstro)
      return;
    }
    const b = row.state as BState;
    const { lang, t, f } = await getT(); // mensagens da luta são gravadas no idioma de quem joga
    let P = await loadPlayer(cid);
    const p = { hp: P.c.hp, mp: P.c.mp, gold: Number(P.c.gold), lv: P.c.level };
    let lvl = P.c.level, xp = Number(P.c.xp), lvUp = 0;
    if (act.a === "next") {
      if (b.over === "wave") {
        advanceWave(b, t); // zera log, recompensas e aviso de nível do monstro anterior
        if (b.endless) await infuse(cid, P.k.key, P.kit.infuse, b, P.q.hp);
      }
    } else {
      if (act.a === "skill") {
        // só vale poder APRENDIDO e EQUIPADO no loadout (as 4 posições da Academia)
        if (!loadout4(P.kit.loadout).includes(act.i) || !P.kit.learned.includes(act.i)) return;
      }
      if (act.a === "potion" && b.e.pvp) {
        b.log.push(t("bt.noPotionsArena"));
        await db.update(battles).set({ state: b }).where(eq(battles.characterId, cid));
        return;
      }
      if (act.a === "potion") {
        // gasta 1 poção do estoque; sem estoque, avisa e não perde o turno
        const nm = act.k === "ea" ? CONS.ea.name : CONS.hp.name, { row } = await stack(cid, nm);
        if (!row || row.quantity < 1) {
          b.log.push(t("bt.noPotion", { name: nm }));
          await db.update(battles).set({ state: b }).where(eq(battles.characterId, cid));
          return;
        }
        await db.update(inventory).set({ quantity: row.quantity - 1 }).where(eq(inventory.id, row.id));
      }
      const before = b.over, used0 = b.domUsed;
      const Q = b.e.pvp ? pvpNorm(P.q, P.c.level) : P.q; // na Arena os status são normalizados (ver pvp.ts)
      step(b, p, Q, P.k.key, act, P.c.domain);
      if (P.c.isGm) {
        // personagem GM: nunca morre (HP sempre cheio)
        p.hp = P.q.hp;
        if (b.over === "lose") b.over = null;
      }
      if (!used0 && b.domUsed && P.c.domain)
        await db.update(characters).set({ domain: { ...P.c.domain, uses: P.c.domain.uses + 1 } }).where(eq(characters.id, cid));
      if (!before && b.over && b.e.pvp) {
        // duelo da Arena acabou: rating, ouro e histórico; o duelo não deixa sequelas (vida e EA voltam ao máximo)
        const r = await settleDuel(cid, b, P.c.name, P.c.level, p.gold);
        p.gold = r.gold;
        b.res = r.lines;
        p.hp = P.q.hp;
        p.mp = P.q.mp;
      }
      if (!before && b.over && !b.e.pvp)
        await db.insert(battleLogs).values({
          characterId: cid, mapSlug: b.mapSlug, classKey: P.k.key, charLevel: P.c.level, monsterLevel: b.e.L, dungeon: b.dungeon,
          outcome: b.over === "lose" ? "lose" : b.over === "flee" ? "flee" : "win", turns: b.t ?? 0, hpLeftPct: Math.round((100 * p.hp) / P.q.hp),
        });
      if (!before && !b.e.pvp && (b.over === "wave" || b.over === "win")) {
        const [pm] = await db.select({ pid: partyMembers.partyId }).from(partyMembers).where(eq(partyMembers.characterId, cid));
        let pb = 0;
        if (pm && P.c.currentMapId) {
          // bônus por aliado conta só CONTAS diferentes (personagens extras da mesma conta não somam)
          const allies = await db.select({ u: characters.userId }).from(partyMembers).innerJoin(characters, eq(partyMembers.characterId, characters.id)).where(and(eq(partyMembers.partyId, pm.pid), eq(characters.currentMapId, P.c.currentMapId)));
          pb = new Set(allies.map((x) => x.u).filter((u) => u !== P.c.userId)).size;
        }
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
        b.res = [t("bt.defeated", { name: b.e.n, xp: f.n(gain), g })];
        if (Math.random() < Math.min(1, (kind === "mon" ? 0.5 : 1) * md)) {
          const z = pk(kind === "mon" ? w.dr : w.dg), n = Math.max(1, Math.round((kind === "boss" ? rn(2, 4) : rn(1, 2)) * md));
          await addElement(cid, z, n);
          await track(cid, "gather", "", n);
          b.res.push(t("bt.dropEl", { n, el: elementName(lang, z, elName(z)) }));
        }
        if (b.over === "win" && b.dungeon) {
          b.res.push(t("bt.realmDone", { realm: REALMS[b.mapSlug] ? realmLabel(lang, REALMS[b.mapSlug].name) : t("play.realmDefault") }));
          await track(cid, "portal", b.mapSlug);
          for (let i = 0; i < 2; i++) {
            const z = pk(w.dg), n = rn(1, 3);
            await addElement(cid, z, n);
            await track(cid, "gather", "", n);
            b.res.push(t("bt.bonusEl", { n, el: elementName(lang, z, elName(z)) }));
          }
        }
        if (lvUp) b.lv = lvl; // aviso temporário na tela, não fica no registro
        if (b.endless && b.run) {
          // grind infinito: soma na corrida, sobe a intensidade e já prepara o próximo monstro (a cada 10º sub-chefe, a cada 25º chefe)
          b.run.kills++; b.run.xp += gain; b.run.gold += g;
          b.run.heat = Math.min(0.6, 0.04 * Math.floor(b.run.kills / 5));
          const n = b.run.kills + 1, nk = n % 25 === 0 ? "boss" : n % 10 === 0 ? "sub" : "mon";
          b.q = [await spawn(b.mapSlug, lvl, nk, false, b.run.heat)];
          if (nk !== "mon") b.res.push(nk === "boss" ? t("bt.nextBoss") : t("bt.nextSub"));
        }
      }
      if (b.over === "lose" && !b.e.pvp) {
        p.hp = Math.ceil(P.q.hp / 2);
        p.gold = Math.floor(p.gold * 0.9);
        b.res = [t("bt.fell")];
      }
    }
    await db.update(characters).set({ hp: p.hp, mp: p.mp, gold: p.gold, level: lvl, xp }).where(eq(characters.id, cid));
    if (lvUp) {
      P = await loadPlayer(cid);
      await db.update(characters).set({ hp: P.q.hp, mp: P.q.mp }).where(eq(characters.id, cid));
    }
    await db.update(battles).set({ state: b, updatedAt: new Date() }).where(eq(battles.characterId, cid));
  });
}
