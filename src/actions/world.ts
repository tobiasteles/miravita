"use server";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  characters,
  inventory,
  items,
  questClaims,
  questProgress,
} from "@/db/schema";
import { getActiveCharacter } from "@/lib/session";
import { addStone, stoneStack } from "@/lib/stone";
import { MAIN, SIDE, KILL } from "@/lib/game/quests";
import { applyXp, monsterXp } from "@/lib/game/xp";
import { ASPECTS, DOMAINS } from "@/lib/game/battle";
export async function spendPoints(fd: FormData) {
  const a = await getActiveCharacter();
  if (!a) return;
  const k = String(fd.get("stat"));
  if (!["for", "int", "des"].includes(k)) return;
  const at = a.c.attrs,
    avail = 5 * (a.c.level - 1) - at.for - at.int - at.des,
    n = Math.min(Math.max(1, Number(fd.get("n")) || 1), avail);
  if (n <= 0) return;
  await db
    .update(characters)
    .set({ attrs: { ...at, [k]: at[k as "for"] + n } })
    .where(eq(characters.id, a.c.id));
  revalidatePath("/attributes");
}
export async function buyStone() {
  const a = await getActiveCharacter();
  if (!a || Number(a.c.gold) < 150) return;
  await db
    .update(characters)
    .set({ gold: Number(a.c.gold) - 150 })
    .where(eq(characters.id, a.c.id));
  await addStone(a.c.id, 1);
  revalidatePath("/map");
}
export async function claimQuest(fd: FormData) {
  const a = await getActiveCharacter();
  if (!a) return;
  const id = String(fd.get("id")),
    main = MAIN.find((q) => q.id === id),
    side = SIDE.find((q) => q.id === id),
    kill = KILL.find((q) => q.id === id),
    def = main ?? side ?? kill;
  if (!def || a.c.level < def.lv) return;
  const c = a.c;
  if (kill) {
    const [pg] = await db
      .select()
      .from(questProgress)
      .where(
        and(eq(questProgress.characterId, c.id), eq(questProgress.questId, id)),
      );
    if (!pg || pg.progress < kill.n) return;
  }
  let mat: { id: string; quantity: number } | undefined;
  if (side) {
    const [m] = await db
      .select({ id: inventory.id, quantity: inventory.quantity })
      .from(inventory)
      .innerJoin(items, eq(inventory.itemId, items.id))
      .where(
        and(
          eq(inventory.characterId, c.id),
          eq(items.elementAtomicNumber, side.z),
          eq(items.type, "material"),
        ),
      );
    if (!m || m.quantity < side.n) return;
    mat = m;
  }
  const ins = await db
    .insert(questClaims)
    .values({ characterId: c.id, questId: id })
    .onConflictDoNothing()
    .returning({ q: questClaims.questId });
  if (!ins.length) return;
  if (side && mat) {
    await db
      .update(inventory)
      .set({ quantity: mat.quantity - side.n })
      .where(eq(inventory.id, mat.id));
    await addStone(c.id, 2);
  }
  const gain = Math.round(
      monsterXp(Math.min(200, def.lv + 4)) *
        def.xpB *
        Number(process.env.XP_MULTIPLIER ?? 1),
    ),
    r = applyXp(c.level, Number(c.xp), gain);
  await db
    .update(characters)
    .set({
      gold: Number(c.gold) + def.lv * 10 + (main ? 150 : 50),
      level: r.level,
      xp: r.xp,
    })
    .where(eq(characters.id, c.id));
  revalidatePath("/quests");
}
export async function spendSub(fd: FormData) {
  const a = await getActiveCharacter();
  if (!a) return;
  const i = Number(fd.get("i")),
    s = a.c.sub;
  if (
    !(i >= 0 && i < 3) ||
    s[i] >= 20 ||
    a.c.level - 1 - s.reduce((x, y) => x + y, 0) < 1
  )
    return;
  const n = [...s];
  n[i]++;
  await db.update(characters).set({ sub: n }).where(eq(characters.id, a.c.id));
  revalidatePath("/attributes");
}
export async function forgeDomain(fd: FormData) {
  // nome livre (validado), aspecto da classe; reforjar custa ouro e mantém a maestria
  const a = await getActiveCharacter();
  if (!a || a.c.level < DOMAINS[a.c.classKey].lv) return;
  const name = String(fd.get("name") ?? "").trim(),
    shout = String(fd.get("shout") ?? "").trim(),
    k = String(fd.get("aspect"));
  if (
    !/^[\p{L}\p{N} '’:!.\-]{3,30}$/u.test(name) ||
    (shout && !/^[\p{L}\p{N} '’:!?.,\-]{1,60}$/u.test(shout)) ||
    !ASPECTS[a.c.classKey].some((x) => x.k === k)
  )
    return;
  const old = a.c.domain,
    fee = old ? 10000 : 0;
  if (Number(a.c.gold) < fee) return;
  await db
    .update(characters)
    .set({
      gold: Number(a.c.gold) - fee,
      domain: { name, aspect: k, shout, uses: old?.uses ?? 0 },
    })
    .where(eq(characters.id, a.c.id));
  revalidatePath("/skills");
}
