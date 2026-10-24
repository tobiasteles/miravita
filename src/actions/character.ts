"use server";
import { getUserId } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { characters, characterTraits, classes, maps } from "@/db/schema";
import { getActiveCharacter } from "@/lib/session";
import { CLASS_KEYS } from "@/lib/game/classes";
import { MAGIC, stoneStack } from "@/lib/stone";
import { ENCOUNTER_P, escortCost, type TravelMode } from "@/lib/game/travel";
import { spawn, blankState, saveBattle } from "@/lib/game/encounter";
import { inventory } from "@/db/schema";

async function uid() {
  const userId = await getUserId();
  if (!userId) redirect("/sign-in");
  return userId;
}
const bad = (m: string) =>
  redirect("/characters?error=" + encodeURIComponent(m));

export async function createCharacter(fd: FormData) {
  const userId = await uid();
  const name = String(fd.get("name") ?? "").trim(),
    cls = String(fd.get("cls")),
    av = String(fd.get("avatar"));
  const tr = fd.getAll("traits").map(String).slice(0, 2);
  if (!/^[\p{L}\p{N}_ -]{3,16}$/u.test(name))
    return bad("Nome inválido (3–16 caracteres).");
  if (!CLASS_KEYS.includes(cls)) return bad("Classe inválida.");
  if (!av.startsWith(`class_${cls}_`))
    return bad("Avatar não pertence à classe.");
  const [k] = await db
    .select()
    .from(classes)
    .where(eq(classes.key, cls as "exatas"));
  const [m] = await db
    .select()
    .from(maps)
    .where(eq(maps.slug, "planicie-de-aurora"));
  if (!k || !m) return bad("Rode o seed: npm run db:seed");
  // INSERT condicional: garante o limite de 6 em uma única instrução (atômico, sem transação)
  const r =
    await db.execute(sql`insert into characters (user_id,name,class_key,avatar_id,hp,mp,current_map_id)
    select ${userId},${name},${cls}::class_key,${av},${k.baseStats.hp},${k.baseStats.mp},${m.id}
    where (select count(*) from characters where user_id=${userId}) < 6 on conflict do nothing returning id`);
  const id = r.rows[0]?.id as string | undefined;
  if (!id) return bad("Limite de 6 personagens ou nome já em uso.");
  if (tr.length)
    await db
      .insert(characterTraits)
      .values(tr.map((t) => ({ characterId: id, traitId: t })));
  revalidatePath("/characters");
  redirect("/characters");
}
export async function deleteCharacter(fd: FormData) {
  const userId = await uid();
  await db
    .delete(characters)
    .where(
      and(
        eq(characters.id, String(fd.get("id"))),
        eq(characters.userId, userId),
      ),
    );
  revalidatePath("/characters");
}
export async function selectCharacter(fd: FormData) {
  const userId = await uid();
  const id = String(fd.get("id"));
  const [c] = await db
    .select({ id: characters.id })
    .from(characters)
    .where(and(eq(characters.id, id), eq(characters.userId, userId)));
  if (!c) return bad("Personagem não encontrado.");
  (await cookies()).set("mv_char", id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  redirect("/play");
}
export async function travel(fd: FormData) {
  const a = await getActiveCharacter();
  if (!a) redirect("/characters");
  const [m] = await db.select().from(maps).where(eq(maps.id, String(fd.get("mapId"))));
  if (!m || a.c.level < m.minLevel || m.id === a.c.currentMapId) return;
  const mode = String(fd.get("mode")) as TravelMode, mage = MAGIC.includes(a.c.classKey);
  let gold = Number(a.c.gold);
  if (mode === "teleporte") {
    if (!mage) return;
  } else if (mode === "pedra") {
    if (!mage) {
      const { row } = await stoneStack(a.c.id);
      if (!row || row.quantity < 1) return;
      await db.update(inventory).set({ quantity: row.quantity - 1 }).where(eq(inventory.id, row.id));
    }
  } else if (mode === "escolta") {
    const cost = escortCost(m.minLevel, a.c.level);
    if (gold < cost) return;
    gold -= cost; // os guardas levam você em segurança
  } else if (mode !== "estrada") return;
  await db.update(characters).set({ currentMapId: m.id, gold }).where(eq(characters.id, a.c.id));
  revalidatePath("/play");
  revalidatePath("/map");
  // ENCONTRO ALEATÓRIO: só no caminho a pé (estrada)
  if (mode === "estrada" && Math.random() < ENCOUNTER_P) {
    const kind = Math.random() < 0.15 ? "sub" : "mon";
    const e = await spawn(m.slug, a.c.level, kind, false);
    await saveBattle(a.c.id, blankState(e, [], m.slug, { ambush: true, log: [`⚠ EMBOSCADA na estrada! ${e.n} (Nv. ${e.L}) bloqueia o caminho!`] }));
    redirect("/battle");
  }
}
