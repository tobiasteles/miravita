import { NextResponse } from "next/server";
import { db } from "@/db";
import { chatReports } from "@/db/schema";
import { getActiveCharacter } from "@/lib/session";
import { allow } from "@/lib/rate-limit";
// denuncia uma mensagem do chat (vai para /admin/denuncias)
export async function POST(req: Request) {
  const a = await getActiveCharacter();
  if (!a) return NextResponse.json({ error: "Selecione um personagem." }, { status: 401 });
  let body: { id?: unknown; reason?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Requisição inválida." }, { status: 400 }); }
  const id = String(body?.id ?? ""), reason = String(body?.reason ?? "").trim().slice(0, 200) || null;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Mensagem inválida." }, { status: 400 });
  if (!(await allow(`report:u:${a.c.userId}`, 10, 3600))) return NextResponse.json({ error: "Muitas denúncias. Tente mais tarde." }, { status: 429 });
  try {
    await db.insert(chatReports).values({ reporterId: a.c.id, messageId: id, reason }).onConflictDoNothing();
  } catch {
    return NextResponse.json({ error: "Mensagem não encontrada." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
