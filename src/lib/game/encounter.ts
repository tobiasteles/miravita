// ───── criação de encontros (usado pelo Portão, Reino, Reino e emboscadas na estrada) — só roda no servidor ─────
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { aiMonsters, battles, elements } from "@/db/schema";
import { spawnFor, mkMonster, temper, heatUp } from "./bestiary";
import { withArch, mkRx, type BState, type Mon } from "./battle";
import { computeItem } from "./item-stats";
import { PA_MAX } from "./combat";
import { takeElement } from "@/lib/equip";

const rn = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
const pk = <T,>(a: T[]) => a[rn(0, a.length - 1)];
export type SpawnKind = "mon" | "sub" | "boss";

// Monstros comuns: 30% vêm do bestiário (IA + os que você criou no /admin); se existir monstro SEU no mapa, ele entra mais (40%).
// Sub-chefes e chefes: se você criou algum para o mapa, ele é usado em 70% das vezes.
export async function spawn(slug: string, pl: number, kind: SpawnKind, realm: boolean, heat = 0): Promise<Mon> {
  let rows: { name: string; archetype: string; kind: string; source: string }[] = [];
  try {
    rows = await db.select().from(aiMonsters).where(eq(aiMonsters.mapSlug, slug)).limit(80);
  } catch {
    /* sem tabela/colunas novas ainda */
  }
  const own = rows.filter((r) => r.kind === kind && r.source === "admin");
  let m: Mon;
  if (own.length && (kind === "mon" ? Math.random() < 0.4 : Math.random() < 0.7)) {
    const r = pk(own), base = spawnFor(slug, pl, kind);
    m = mkMonster(r.name, base.L, kind);
    if (kind === "mon") m = withArch(m, r.archetype);
  } else if (kind === "mon" && Math.random() < 0.3 && rows.some((r) => r.kind === "mon")) {
    const r = pk(rows.filter((r) => r.kind === "mon"));
    m = withArch(mkMonster(r.name, spawnFor(slug, pl, "mon").L, "mon"), r.archetype);
  } else m = spawnFor(slug, pl, kind);
  if (realm) m = temper(m, 1.3, 1.2);
  return heat ? heatUp(m, heat) : m;
}
export const blankState = (e: Mon, q: Mon[], slug: string, extra: Partial<BState> = {}): BState => ({
  e, q, wave: 1, dungeon: false, mapSlug: slug, buf: 0, cu: 0, sv: null, log: [], over: null, res: [],
  pa: PA_MAX, used: {}, aegis: 0, aegisT: 0, eDef: 0, sifT: 0, charge: 0, et: 0, ...extra,
});
export async function saveBattle(cid: string, state: BState) {
  await db.insert(battles).values({ characterId: cid, state }).onConflictDoUpdate({ target: battles.characterId, set: { state } });
}
// Infusão Elemental (só Elemental): gasta 1 unidade do elemento escolhido e liga o efeito na batalha
export async function infuse(cid: string, cls: string, z: number | null | undefined, b: BState, maxHp: number) {
  b.rx = null;
  if (cls !== "quimica" || !z) return;
  if (!(await takeElement(cid, z, 1))) return;
  const [el] = await db.select().from(elements).where(eq(elements.atomicNumber, z));
  if (!el) return;
  b.rx = mkRx(el.category, computeItem(el).score);
  if (el.category === "gás nobre") { b.aegis = Math.round(maxHp * 0.1); b.aegisT = 4; }
  b.log.push(`Infusão: ${el.name} (${el.category}).`);
}
