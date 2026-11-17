import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { inventory, items } from "@/db/schema";
import { getActiveCharacter } from "@/lib/session";
import CodexClient from "@/components/codex/CodexClient";

export const metadata = { title: "Códex dos Elementos — Miravita" };

// Página só de leitura: mostra a raridade de cada elemento e quanto o personagem tem. Não cria nenhuma ação nova.
export default async function CodexPage() {
  const a = await getActiveCharacter();
  if (!a) redirect("/characters");
  const rows = await db
    .select({ z: items.elementAtomicNumber, rarity: items.rarity, qty: inventory.quantity })
    .from(items)
    .leftJoin(inventory, and(eq(inventory.itemId, items.id), eq(inventory.characterId, a.c.id)))
    .where(eq(items.type, "material"));
  const info: Record<number, { r: string; q: number }> = {};
  for (const r of rows) {
    if (r.z == null) continue;
    const cur = info[r.z];
    info[r.z] = { r: cur?.r ?? r.rarity, q: (cur?.q ?? 0) + Math.max(0, r.qty ?? 0) };
  }
  return <CodexClient info={info} />;
}
