import { desc } from "drizzle-orm";
import { db } from "@/db";
import { gameEvents } from "@/db/schema";
import { addEvent, toggleEvent, delEvent } from "@/actions/admin-content";
import { Card, F, Opts, inp, btn, btnDanger } from "@/components/admin/ui";
const fmt = (d: Date) => new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
export default async function Page() {
  const rows = await db.select().from(gameEvents).orderBy(desc(gameEvents.startsAt)).limit(40), now = Date.now();
  return (
    <>
      <h1 className="text-xl font-bold">Eventos</h1>
      <p className="text-sm text-violet-300">Multiplicadores temporários de XP, ouro ou drops. Aparecem numa faixa dourada na cidade e valem em lutas (e XP/ouro das expedições). Horários em Brasília.</p>
      <Card title="Novo evento">
        <form action={addEvent} className="grid gap-2 sm:grid-cols-2">
          <F label="Título"><input name="title" required maxLength={60} placeholder="Fim de semana em dobro" className={inp} /></F>
          <F label="Descrição (opcional)"><input name="description" maxLength={200} className={inp} /></F>
          <F label="Tipo"><select name="kind" className={inp}><Opts list={[["xp", "XP"], ["gold", "Ouro"], ["drop", "Drops de elementos"]]} /></select></F>
          <F label="Multiplicador" hint="1,1 a 5"><input name="mult" type="number" step="0.1" min="1.1" max="5" defaultValue="2" className={inp} /></F>
          <F label="Começa em"><input name="startsAt" type="datetime-local" required className={inp} /></F>
          <F label="Termina em"><input name="endsAt" type="datetime-local" required className={inp} /></F>
          <div className="sm:col-span-2"><button className={btn}>Criar evento</button></div>
        </form>
      </Card>
      {rows.map((e) => {
        const live = e.active && +e.startsAt <= now && +e.endsAt >= now;
        return (
          <Card key={e.id}>
            <div className="flex flex-wrap items-center gap-2">
              <b className="flex-1">{e.title}</b>
              <span className={`rounded px-2 text-xs ${live ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-500/30 text-slate-300"}`}>{live ? "no ar" : e.active ? (+e.endsAt < now ? "encerrado" : "agendado") : "pausado"}</span>
            </div>
            <div className="text-sm text-violet-300">{e.kind.toUpperCase()} ×{e.mult} · {fmt(e.startsAt)} → {fmt(e.endsAt)}</div>
            <div className="flex gap-2">
              <form action={toggleEvent}><input type="hidden" name="id" value={e.id} /><button className={btnDanger}>{e.active ? "Pausar" : "Ativar"}</button></form>
              <form action={delEvent}><input type="hidden" name="id" value={e.id} /><button className={btnDanger}>Excluir</button></form>
            </div>
          </Card>
        );
      })}
    </>
  );
}
