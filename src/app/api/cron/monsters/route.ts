import { NextResponse } from "next/server"; import { eq, count } from "drizzle-orm"; import { db } from "@/db"; import { maps, aiMonsters } from "@/db/schema"; import { genJson } from "@/lib/ai/gemini";
export const maxDuration = 60;
type Raw = { name?: unknown; lore?: unknown; archetype?: unknown; skillName?: unknown };
const OK = /^[\p{L}\p{N} '\-]{3,32}$/u, ARCH = ["tank", "glass", "balanced"];
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new NextResponse("unauthorized", { status: 401 });
  let added = 0;
  for (const m of await db.select().from(maps)) {
    const [{ n }] = await db.select({ n: count() }).from(aiMonsters).where(eq(aiMonsters.mapSlug, m.slug)); if (n >= 30) continue;
    const raw = await genJson<Raw[]>(`Você cria monstros para o MMORPG "Miravita" (dark fantasy estilo Solo Leveling: caçadores, portais e calabouços).
Mapa: ${m.name}, bioma ${m.biome}, nível mínimo ${m.minLevel}. Crie 3 monstros originais (não use personagens de obras existentes), em português do Brasil.
Responda SOMENTE um array JSON: [{"name": string (3-32 letras), "lore": string (até 200 caracteres), "archetype": "tank"|"glass"|"balanced", "skillName": string}].`);
    for (const r of Array.isArray(raw) ? raw.slice(0, 3) : []) {   // validação: a IA gera conteúdo, nunca números de balanceamento
      const name = String(r.name ?? "").trim(), lore = String(r.lore ?? "").trim().slice(0, 200), arch = String(r.archetype);
      if (!OK.test(name) || !lore) continue;
      const res = await db.insert(aiMonsters).values({ mapSlug: m.slug, name, lore, archetype: ARCH.includes(arch) ? arch : "balanced", skillName: String(r.skillName ?? "").trim().slice(0, 40) || null }).onConflictDoNothing().returning({ id: aiMonsters.id });
      added += res.length;
    }
  }
  return NextResponse.json({ added });
}
