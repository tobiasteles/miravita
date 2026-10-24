"use server";
// ───── AÇÕES DO PAINEL /admin (todas conferem se quem chama é administrador) ─────
import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { aiMonsters, characters, classes, customQuests, gameEvents, inventory, items, maps, musicTracks, newsPosts, questClaims, questProgress, users } from "@/db/schema";
import { isAdmin } from "@/actions/admin";
import { getUserId } from "@/lib/auth";
import { WORLD } from "@/lib/game/world";
import { CLASS_KEYS, blockOf } from "@/lib/game/classes";
import { SK_LV } from "@/lib/game/classdata";
import { loadPlayer } from "@/lib/game/player";

const s = (fd: FormData, k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);
const n = (fd: FormData, k: string, lo: number, hi: number, d: number) => {
  const v = Number(fd.get(k));
  return Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : d;
};
const pick = <T extends string>(v: string, list: readonly T[], d: T): T => (list.includes(v as T) ? (v as T) : d);
const done = (...paths: string[]) => paths.forEach((p) => revalidatePath(p));
// "2026-10-25T18:00" (horário de Brasília, sem horário de verão) → Date
const brt = (v: string) => (v.length === 16 ? new Date(`${v}:00-03:00`) : new Date(v));

// ───── MONSTROS ─────
export async function addMonster(fd: FormData) {
  if (!(await isAdmin())) return;
  const name = s(fd, "name", 40), mapSlug = s(fd, "mapSlug");
  if (name.length < 3 || !WORLD[mapSlug]) return;
  await db.insert(aiMonsters).values({
    mapSlug, name, lore: s(fd, "lore", 400) || "Criatura criada pelos administradores.", archetype: pick(s(fd, "archetype"), ["tank", "glass", "balanced"] as const, "balanced"),
    skillName: s(fd, "skillName", 40) || null, kind: pick(s(fd, "kind"), ["mon", "sub", "boss"] as const, "mon"), source: "admin",
  }).onConflictDoNothing();
  done("/admin/monstros");
}
export async function delMonster(fd: FormData) {
  if (!(await isAdmin())) return;
  await db.delete(aiMonsters).where(and(eq(aiMonsters.id, s(fd, "id")), eq(aiMonsters.source, "admin")));
  done("/admin/monstros");
}

// ───── MISSÕES ─────
export async function addQuest(fd: FormData) {
  if (!(await isAdmin())) return;
  const kind = pick(s(fd, "kind"), ["kill", "deliver"] as const, "kill"), title = s(fd, "title", 60), mapSlug = s(fd, "mapSlug");
  if (title.length < 3) return;
  await db.insert(customQuests).values({
    id: `c_${randomUUID().slice(0, 6)}`, kind, title, story: s(fd, "story", 400), mapSlug: WORLD[mapSlug] ? mapSlug : null,
    minLevel: n(fd, "minLevel", 1, 200, 1), amount: n(fd, "amount", 1, 999, 10), elementZ: kind === "deliver" ? n(fd, "elementZ", 1, 118, 26) : null,
    xpB: n(fd, "xpB", 1, 200, 10), gold: n(fd, "gold", 0, 10_000_000, 100),
  });
  done("/admin/missoes", "/quests");
}
export async function toggleQuest(fd: FormData) {
  if (!(await isAdmin())) return;
  const id = s(fd, "id");
  await db.update(customQuests).set({ active: sql`not ${customQuests.active}` }).where(eq(customQuests.id, id));
  done("/admin/missoes", "/quests");
}
export async function delQuest(fd: FormData) {
  if (!(await isAdmin())) return;
  const id = s(fd, "id");
  await db.delete(customQuests).where(eq(customQuests.id, id));
  await db.delete(questProgress).where(eq(questProgress.questId, id));
  await db.delete(questClaims).where(eq(questClaims.questId, id));
  done("/admin/missoes", "/quests");
}

// ───── EVENTOS ─────
export async function addEvent(fd: FormData) {
  if (!(await isAdmin())) return;
  const title = s(fd, "title", 60), a = brt(s(fd, "startsAt")), b = brt(s(fd, "endsAt"));
  if (title.length < 3 || isNaN(+a) || isNaN(+b) || +b <= +a) return;
  await db.insert(gameEvents).values({
    title, description: s(fd, "description", 200), kind: pick(s(fd, "kind"), ["xp", "gold", "drop"] as const, "xp"),
    mult: Math.min(5, Math.max(1.1, Number(fd.get("mult")) || 2)), startsAt: a, endsAt: b,
  });
  done("/admin/eventos", "/play");
}
export async function toggleEvent(fd: FormData) {
  if (!(await isAdmin())) return;
  await db.update(gameEvents).set({ active: sql`not ${gameEvents.active}` }).where(eq(gameEvents.id, s(fd, "id")));
  done("/admin/eventos", "/play");
}
export async function delEvent(fd: FormData) {
  if (!(await isAdmin())) return;
  await db.delete(gameEvents).where(eq(gameEvents.id, s(fd, "id")));
  done("/admin/eventos", "/play");
}

// ───── ITENS ─────
const STAT_KEYS = ["atk", "def", "hp", "mp", "crit", "res", "mit", "sifV", "sifE", "foco", "refl", "reg", "imp", "ten", "ret", "qg", "rupD", "pen"] as const;
export async function addItem(fd: FormData) {
  if (!(await isAdmin())) return;
  const name = s(fd, "name", 60);
  if (name.length < 3) return;
  const stats: Record<string, number> = { durability: n(fd, "durability", 10, 9999, 150) };
  for (const k of STAT_KEYS) {
    const v = Number(fd.get(k));
    if (Number.isFinite(v) && v > 0) stats[k] = Math.min(100000, v);
  }
  const cr = s(fd, "classRestriction");
  await db.insert(items).values({
    name, type: pick(s(fd, "type"), ["arma", "armadura", "elmo", "botas", "manoplas", "acessorio"] as const, "acessorio"), slot: s(fd, "slot", 30) || null,
    rarity: pick(s(fd, "rarity"), ["comum", "raro", "epico", "lendario"] as const, "raro"), minLevel: n(fd, "minLevel", 1, 200, 1),
    classRestriction: CLASS_KEYS.includes(cr) ? (cr as "exatas") : null, stats, value: n(fd, "value", 0, 100_000_000, 1000),
  });
  done("/admin/itens");
}
export async function giveItem(fd: FormData) {
  if (!(await isAdmin())) return;
  const [ch] = await db.select({ id: characters.id }).from(characters).where(sql`lower(${characters.name}) = ${s(fd, "who", 20).toLowerCase()}`);
  const itemId = s(fd, "itemId"), qty = n(fd, "qty", 1, 9999, 1);
  const [it] = await db.select({ id: items.id, stats: items.stats }).from(items).where(eq(items.id, itemId));
  if (!ch || !it) return;
  await db.insert(inventory).values({ characterId: ch.id, itemId: it.id, quantity: qty, currentDurability: it.stats.durability ?? 100 });
  done("/admin/itens");
}

// ───── PERSONAGENS GM ─────
// GM = invulnerável nas lutas e com a etiqueta [GM] no chat. Cria um personagem pronto (nível, ouro, todos os poderes aprendidos).
export async function createGm(fd: FormData) {
  if (!(await isAdmin())) return;
  const email = s(fd, "email", 120).toLowerCase(), name = s(fd, "name", 16), cls = s(fd, "cls");
  if (!/^[\p{L}\p{N}_ -]{3,16}$/u.test(name) || !CLASS_KEYS.includes(cls)) return;
  const uid = email ? (await db.select({ id: users.id }).from(users).where(eq(users.email, email)))[0]?.id : await getUserId();
  const level = n(fd, "level", 1, 200, 200), pts = 5 * (level - 1);
  const [k] = await db.select().from(classes).where(eq(classes.key, cls as "exatas"));
  const [m] = await db.select().from(maps).where(eq(maps.slug, "planicie-de-aurora"));
  if (!uid || !k || !m) return;
  const melee = blockOf(cls) === "melee", sp = melee ? [0.5, 0.15, 0.35] : [0.35, 0.45, 0.2];
  const learned = SK_LV.map((lv, i) => (lv <= level ? i : -1)).filter((i) => i >= 0);
  const [row] = await db.insert(characters).values({
    userId: uid, name, classKey: cls as "exatas", avatarId: `class_${cls}_01`, level, hp: k.baseStats.hp, mp: k.baseStats.mp, currentMapId: m.id,
    gold: n(fd, "gold", 0, 1_000_000_000, 10_000_000), isGm: true, attrs: { for: Math.floor(pts * sp[0]), int: Math.floor(pts * sp[1]), des: Math.floor(pts * sp[2]) },
    kit: { learned, loadout: [...learned].reverse().slice(0, 4) },
  }).onConflictDoNothing().returning({ id: characters.id });
  if (row) {
    const P = await loadPlayer(row.id);
    await db.update(characters).set({ hp: P.q.hp, mp: P.q.mp }).where(eq(characters.id, row.id));
  }
  done("/admin/gm", "/characters");
}
export async function editCharacter(fd: FormData) {
  if (!(await isAdmin())) return;
  const id = s(fd, "id");
  const set: Record<string, unknown> = { isGm: fd.get("isGm") === "on" };
  const lv = Number(fd.get("level")), gold = Number(fd.get("gold"));
  if (lv >= 1 && lv <= 200) { set.level = Math.round(lv); set.xp = 0; }
  if (Number.isFinite(gold) && gold >= 0) set.gold = Math.round(gold);
  await db.update(characters).set(set).where(eq(characters.id, id));
  const P = await loadPlayer(id);
  await db.update(characters).set({ hp: P.q.hp, mp: P.q.mp }).where(eq(characters.id, id));
  done("/admin/gm");
}

// ───── MÚSICAS ─────
export async function addTrack(fd: FormData) {
  if (!(await isAdmin())) return;
  const url = s(fd, "url", 300), title = s(fd, "title", 60), mapSlug = s(fd, "mapSlug");
  if (title.length < 2 || !(url.startsWith("/") || url.startsWith("https://"))) return;
  await db.insert(musicTracks).values({ title, url, context: pick(s(fd, "context"), ["home", "cidade", "batalha", "reino"] as const, "cidade"), mapSlug: WORLD[mapSlug] ? mapSlug : null, volume: n(fd, "volume", 5, 100, 70) });
  done("/admin/musicas");
}
export async function toggleTrack(fd: FormData) {
  if (!(await isAdmin())) return;
  await db.update(musicTracks).set({ active: sql`not ${musicTracks.active}` }).where(eq(musicTracks.id, s(fd, "id")));
  done("/admin/musicas");
}
export async function delTrack(fd: FormData) {
  if (!(await isAdmin())) return;
  await db.delete(musicTracks).where(eq(musicTracks.id, s(fd, "id")));
  done("/admin/musicas");
}

// ───── NOTÍCIAS (aparecem na página inicial) ─────
export async function addNews(fd: FormData) {
  if (!(await isAdmin())) return;
  const title = s(fd, "title", 80), body = s(fd, "body", 1500);
  if (title.length < 3 || body.length < 3) return;
  await db.insert(newsPosts).values({ title, body, pinned: fd.get("pinned") === "on" });
  done("/admin/noticias", "/");
}
export async function toggleNews(fd: FormData) {
  if (!(await isAdmin())) return;
  const f = s(fd, "field") === "pinned" ? newsPosts.pinned : newsPosts.published;
  await db.update(newsPosts).set(s(fd, "field") === "pinned" ? { pinned: sql`not ${f}` } : { published: sql`not ${f}` }).where(eq(newsPosts.id, s(fd, "id")));
  done("/admin/noticias", "/");
}
export async function delNews(fd: FormData) {
  if (!(await isAdmin())) return;
  await db.delete(newsPosts).where(eq(newsPosts.id, s(fd, "id")));
  done("/admin/noticias", "/");
}
