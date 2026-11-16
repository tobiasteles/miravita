"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, count, eq, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db } from "@/db";
import { guilds, guildMembers, characters, partyMembers } from "@/db/schema";
import { getActiveCharacter } from "@/lib/session";
const MAX_MEMBERS = 30;
const err = (m: string) => redirect("/guild?error=" + encodeURIComponent(m));
// tira o personagem do grupo (os grupos pertencem à guilda) e apaga grupos que ficaram vazios
async function dropFromParty(cid: string) {
  await db.delete(partyMembers).where(eq(partyMembers.characterId, cid));
  await db.execute(sql`delete from parties where not exists (select 1 from party_members pm where pm.party_id = parties.id)`);
}
async function me() {
  const a = await getActiveCharacter();
  if (!a?.c.guildId) return null;
  const [m] = await db.select().from(guildMembers).where(eq(guildMembers.characterId, a.c.id));
  return m ? { a, m, gid: a.c.guildId } : null;
}
export async function createGuild(fd: FormData) {
  const a = await getActiveCharacter();
  if (!a || a.c.guildId) redirect("/guild");
  const name = String(fd.get("name") ?? "").trim(),
    tag = String(fd.get("tag") ?? "").trim().toUpperCase();
  if (!/^[\p{L}\p{N} _'-]{3,16}$/u.test(name) || !/^[A-Z0-9]{2,4}$/.test(tag)) err("Nome de 3 a 16 caracteres (letras, números, espaço) e tag de 2–4 letras/números.");
  let id: string | undefined;
  try {
    [{ id }] = await db.insert(guilds).values({ name, tag }).returning({ id: guilds.id });
  } catch {
    err("Nome ou tag já em uso.");
  }
  await db.insert(guildMembers).values({ guildId: id!, characterId: a.c.id, rank: "lider" });
  await db.update(characters).set({ guildId: id }).where(eq(characters.id, a.c.id));
  revalidatePath("/guild");
  redirect("/guild");
}
export async function joinGuild(fd: FormData) {
  const a = await getActiveCharacter();
  if (!a || a.c.guildId) return;
  const id = String(fd.get("id") ?? ""), code = String(fd.get("code") ?? "").trim().toLowerCase();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const [g] = await db.select().from(guilds).where(eq(guilds.id, id));
  if (!g) err("Guilda não encontrada.");
  if (g!.inviteCode && g!.inviteCode !== code) err("Esta guilda é só por convite: o código está incorreto.");
  const [{ n }] = await db.select({ n: count() }).from(guildMembers).where(eq(guildMembers.guildId, id));
  if (n >= MAX_MEMBERS) err(`A guilda está cheia (${MAX_MEMBERS} membros).`);
  try {
    await db.insert(guildMembers).values({ guildId: id, characterId: a.c.id });
  } catch {
    return; // já está em uma guilda (clique duplo)
  }
  await db.update(characters).set({ guildId: id }).where(eq(characters.id, a.c.id));
  revalidatePath("/guild");
}
export async function leaveGuild() {
  const a = await getActiveCharacter();
  if (!a?.c.guildId) return;
  const gid = a.c.guildId;
  await db.delete(guildMembers).where(eq(guildMembers.characterId, a.c.id));
  await db.update(characters).set({ guildId: null }).where(eq(characters.id, a.c.id));
  await dropFromParty(a.c.id);
  const left = await db.select().from(guildMembers).where(eq(guildMembers.guildId, gid)).orderBy(guildMembers.joinedAt);
  if (!left.length) await db.delete(guilds).where(eq(guilds.id, gid));
  else if (!left.some((m) => m.rank === "lider"))
    await db.update(guildMembers).set({ rank: "lider" }).where(eq(guildMembers.characterId, left[0].characterId));
  revalidatePath("/guild");
}
// só o líder muda patentes; não mexe em si mesmo nem em outro líder (a guilda nunca fica sem líder)
export async function setRank(fd: FormData) {
  const s = await me();
  if (!s || s.m.rank !== "lider") return;
  const cid = String(fd.get("cid") ?? ""), rank = fd.get("rank") === "oficial" ? "oficial" : "membro";
  if (cid === s.a.c.id) return;
  await db.update(guildMembers).set({ rank }).where(and(eq(guildMembers.guildId, s.gid), eq(guildMembers.characterId, cid), sql`${guildMembers.rank} <> 'lider'`));
  revalidatePath("/guild");
}
// líder expulsa qualquer um; oficial expulsa só membros
export async function kickMember(fd: FormData) {
  const s = await me();
  if (!s || s.m.rank === "membro") return;
  const cid = String(fd.get("cid") ?? "");
  if (cid === s.a.c.id) return;
  const [t] = await db.select().from(guildMembers).where(and(eq(guildMembers.guildId, s.gid), eq(guildMembers.characterId, cid)));
  if (!t || t.rank === "lider" || (s.m.rank === "oficial" && t.rank !== "membro")) return;
  await db.delete(guildMembers).where(eq(guildMembers.characterId, cid));
  await db.update(characters).set({ guildId: null }).where(eq(characters.id, cid));
  await dropFromParty(cid);
  revalidatePath("/guild");
}
export async function transferLeader(fd: FormData) {
  const s = await me();
  if (!s || s.m.rank !== "lider") return;
  const cid = String(fd.get("cid") ?? "");
  if (cid === s.a.c.id) return;
  const [t] = await db.select().from(guildMembers).where(and(eq(guildMembers.guildId, s.gid), eq(guildMembers.characterId, cid)));
  if (!t) return;
  await db.update(guildMembers).set({ rank: "lider" }).where(eq(guildMembers.characterId, cid));
  await db.update(guildMembers).set({ rank: "oficial" }).where(eq(guildMembers.characterId, s.a.c.id));
  revalidatePath("/guild");
}
// líder gera/troca o código de convite (guilda fechada) ou remove (guilda aberta)
export async function setInvite(fd: FormData) {
  const s = await me();
  if (!s || s.m.rank !== "lider") return;
  const code = fd.get("open") ? null : randomBytes(4).toString("hex");
  await db.update(guilds).set({ inviteCode: code }).where(eq(guilds.id, s.gid));
  revalidatePath("/guild");
}
