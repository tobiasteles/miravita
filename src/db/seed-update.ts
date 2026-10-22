// Rode UMA vez depois de atualizar o código:  npx tsx src/db/seed-update.ts
// Atualiza as 10 classes (nomes e status novos), cadastra os 118 elementos e cria os "materiais" que faltam.
import { config } from "dotenv"; config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless"; import { drizzle } from "drizzle-orm/neon-http"; import { sql, eq } from "drizzle-orm";
import { CLASS_DEFS, CLASS_KEYS, ARCH, classStats } from "../lib/game/classes"; import * as s from "./schema"; import { computeItem } from "../lib/game/item-stats";
import { ELEMENTS } from "../lib/game/elements";
const db = drizzle(neon(process.env.DATABASE_URL!));
async function main() {
  // 1) classes: atualiza nome, descrição e status (o onConflictDoNothing do seed antigo não atualizava)
  for (const k of CLASS_KEYS) {
    const v = { key: k as "exatas", name: CLASS_DEFS[k].name, archetype: ARCH[CLASS_DEFS[k].block], description: CLASS_DEFS[k].desc, baseStats: classStats(k).base, perLevelStats: classStats(k).per };
    await db.insert(s.classes).values(v).onConflictDoUpdate({ target: s.classes.key, set: { name: v.name, archetype: v.archetype, description: v.description, baseStats: v.baseStats, perLevelStats: v.perLevelStats } });
  }
  // 2) elementos: os 118 (atualiza categoria/nome dos que já existiam)
  const rows = ELEMENTS.map(([z, sym, name, m, h, ab, cat]) => ({ atomicNumber: z, symbol: sym, name, atomicMass: m, mohsHardness: h, crustalAbundancePpm: ab, category: cat }));
  for (let i = 0; i < rows.length; i += 30)
    await db.insert(s.elements).values(rows.slice(i, i + 30)).onConflictDoUpdate({ target: s.elements.atomicNumber, set: { symbol: sql`excluded.symbol`, name: sql`excluded.name`, atomicMass: sql`excluded.atomic_mass`, mohsHardness: sql`excluded.mohs_hardness`, crustalAbundancePpm: sql`excluded.crustal_abundance_ppm`, category: sql`excluded.category` } });
  // 3) itens "material" só para os que ainda não existem
  const have = new Set((await db.select({ z: s.items.elementAtomicNumber }).from(s.items).where(eq(s.items.type, "material"))).map((r) => r.z));
  const novos = ELEMENTS.filter((e) => !have.has(e[0])).map(([z, , name, m, h, ab]) => {
    const i = computeItem({ atomicNumber: z, atomicMass: m, mohsHardness: h, crustalAbundancePpm: ab });
    return { elementAtomicNumber: z, name, type: "material" as const, rarity: i.rarity, stats: { atk: i.atk, def: i.def, durability: i.durability }, value: i.value };
  });
  for (let i = 0; i < novos.length; i += 30) await db.insert(s.items).values(novos.slice(i, i + 30));
  // 4) traços (termo novo: Ruptura)
  await db.update(s.traits).set({ description: "+5% Chance de Ruptura" }).where(eq(s.traits.id, "analitico"));
  console.log(`Pronto: ${CLASS_KEYS.length} classes, ${rows.length} elementos, ${novos.length} materiais novos.`);
}
main();
