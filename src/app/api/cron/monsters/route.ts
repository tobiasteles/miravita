import { NextResponse } from "next/server"; import { eq, count } from "drizzle-orm"; import { db } from "@/db"; import { maps, aiMonsters } from "@/db/schema"; import { genJson } from "@/lib/ai/gemini"; import { cronAuthorized } from "@/lib/cron-auth";
export const maxDuration = 60;
type Raw = { name?: unknown; nameEn?: unknown; lore?: unknown; loreEn?: unknown; archetype?: unknown; skillName?: unknown; skillNameEn?: unknown };
const OK = /^[\p{L}\p{N} '\-]{3,32}$/u, ARCH = ["tank", "glass", "balanced"];
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return new NextResponse("unauthorized", { status: 401 });
  let added = 0;
  for (const m of await db.select().from(maps)) {
    const [{ n }] = await db.select({ n: count() }).from(aiMonsters).where(eq(aiMonsters.mapSlug, m.slug)); if (n >= 30) continue;
    const raw = await genJson<Raw[]>(`Você cria monstros para o MMORPG "Miravita" (dark fantasy estilo Solo Leveling: caçadores, portais e calabouços).
Mapa: ${m.name}, bioma ${m.biome}, nível mínimo ${m.minLevel}. Crie 3 monstros originais (não use personagens de obras existentes). Escreva nome, lore e nome do poder em português do Brasil E em inglês natural (não tradução palavra por palavra).
Responda SOMENTE um array JSON: [{"name": string (3-32 letras, português), "nameEn": string (3-32 letras, inglês), "lore": string (até 200 caracteres, português), "loreEn": string (até 200 caracteres, inglês), "archetype": "tank"|"glass"|"balanced", "skillName": string (português), "skillNameEn": string (inglês)}].`);
    for (const r of Array.isArray(raw) ? raw.slice(0, 3) : []) {   // validação: a IA gera conteúdo, nunca números de balanceamento
      const name = String(r.name ?? "").trim(), lore = String(r.lore ?? "").trim().slice(0, 200), arch = String(r.archetype);
      if (!OK.test(name) || !lore) continue;
      // inglês: mesma validação; se vier inválido, fica null e o jogo usa o português
      const nameEn = String(r.nameEn ?? "").trim(), nEn = OK.test(nameEn) ? nameEn : null, loreEn = String(r.loreEn ?? "").trim().slice(0, 200), skEn = String(r.skillNameEn ?? "").trim().slice(0, 40);
      const res = await db.insert(aiMonsters).values({ mapSlug: m.slug, name, lore, archetype: ARCH.includes(arch) ? arch : "balanced", skillName: String(r.skillName ?? "").trim().slice(0, 40) || null, nameEn: nEn, loreEn: nEn && loreEn ? loreEn : null, skillNameEn: skEn || null }).onConflictDoNothing().returning({ id: aiMonsters.id });
      added += res.length;
    }
  }
  return NextResponse.json({ added });
}
