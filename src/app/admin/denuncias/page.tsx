import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages, chatReports, characters } from "@/db/schema";
import { muteCharacter, resolveReport } from "@/actions/admin-content";
import { Card, btn, btnDanger, inp } from "@/components/admin/ui";
export const dynamic = "force-dynamic";
export default async function Page() {
  const rows = await db
    .select({ id: chatReports.id, reason: chatReports.reason, at: chatReports.createdAt, text: chatMessages.content, channel: chatMessages.channel, sender: characters.name, senderId: characters.id, mutedUntil: characters.mutedUntil })
    .from(chatReports)
    .innerJoin(chatMessages, eq(chatReports.messageId, chatMessages.id))
    .innerJoin(characters, eq(chatMessages.characterId, characters.id))
    .where(eq(chatReports.resolved, false))
    .orderBy(desc(chatReports.createdAt))
    .limit(100);
  return (
    <>
      <h1 className="text-xl font-bold">Denúncias do chat</h1>
      {!rows.length && <Card><p className="text-sm text-violet-300">Nenhuma denúncia pendente.</p></Card>}
      {rows.map((r) => (
        <Card key={r.id}>
          <div className="flex flex-wrap items-center gap-2 text-xs text-violet-400">
            <b className="text-cyan-300">{r.sender}</b>
            <span>canal {r.channel}</span>
            <span>{new Date(r.at).toLocaleString("pt-BR")}</span>
            {r.mutedUntil && r.mutedUntil > new Date() && <span className="rounded bg-amber-500/20 px-2 text-amber-300">silenciado até {r.mutedUntil.toLocaleString("pt-BR")}</span>}
          </div>
          <p className="whitespace-pre-wrap rounded bg-[#0c0a1f] p-2 text-sm">{r.text}</p>
          {r.reason && <p className="text-xs text-violet-300">Motivo: {r.reason}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <form action={muteCharacter} className="flex items-center gap-1">
              <input type="hidden" name="cid" value={r.senderId} />
              <input type="hidden" name="id" value={r.id} />
              <input name="hours" type="number" min={1} max={720} defaultValue={24} className={`${inp} w-20`} />
              <button className={btn}>Silenciar (horas)</button>
            </form>
            <form action={resolveReport}>
              <input type="hidden" name="id" value={r.id} />
              <button className={btnDanger}>Dispensar</button>
            </form>
          </div>
        </Card>
      ))}
    </>
  );
}
