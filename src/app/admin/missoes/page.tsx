import { desc } from "drizzle-orm";
import { db } from "@/db";
import { customQuests } from "@/db/schema";
import { ELEMENTS } from "@/lib/game/elements";
import { addQuest, toggleQuest, delQuest } from "@/actions/admin-content";
import { Card, F, Opts, MAPS, inp, btn, btnDanger } from "@/components/admin/ui";
export default async function Page() {
  const rows = await db.select().from(customQuests).orderBy(desc(customQuests.createdAt)).limit(100);
  return (
    <>
      <h1 className="text-xl font-bold">Missões especiais</h1>
      <p className="text-sm text-violet-300">Aparecem na tela de Missões, na seção “Missões especiais”. <b>Derrotar</b>: conta cada monstro morto (no mapa escolhido, ou em qualquer mapa se deixar “Qualquer”). <b>Entregar</b>: gasta N unidades de um elemento. XP = XP de uma batalha do nível × “valor em batalhas”.</p>
      <Card title="Nova missão">
        <form action={addQuest} className="grid gap-2 sm:grid-cols-2">
          <F label="Título"><input name="title" required maxLength={60} className={inp} /></F>
          <F label="Tipo"><select name="kind" className={inp}><Opts list={[["kill", "Derrotar monstros"], ["deliver", "Entregar elemento"]]} /></select></F>
          <div className="sm:col-span-2"><F label="História"><textarea name="story" rows={2} maxLength={400} className={inp} /></F></div>
          <F label="Mapa (só para “Derrotar”)"><select name="mapSlug" className={inp}><option value="">Qualquer</option><Opts list={MAPS} /></select></F>
          <F label="Elemento (só para “Entregar”)"><select name="elementZ" defaultValue="26" className={inp}>{ELEMENTS.map((e) => <option key={e[0]} value={e[0]}>{e[1]} · {e[2]}</option>)}</select></F>
          <F label="Quantidade"><input name="amount" type="number" min={1} max={999} defaultValue={10} className={inp} /></F>
          <F label="Nível mínimo"><input name="minLevel" type="number" min={1} max={200} defaultValue={1} className={inp} /></F>
          <F label="XP (valor em batalhas)"><input name="xpB" type="number" min={1} max={200} defaultValue={10} className={inp} /></F>
          <F label="Ouro"><input name="gold" type="number" min={0} defaultValue={100} className={inp} /></F>
          <div className="sm:col-span-2"><button className={btn}>Criar missão</button></div>
        </form>
      </Card>
      {rows.map((q) => (
        <Card key={q.id}>
          <div className="flex flex-wrap items-center gap-2">
            <b className="flex-1">{q.title}</b>
            <span className={`rounded px-2 text-xs ${q.active ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-500/30"}`}>{q.active ? "ativa" : "pausada"}</span>
          </div>
          <p className="text-xs text-violet-300">{q.story}</p>
          <div className="text-xs text-violet-400">{q.kind === "kill" ? `Derrotar ${q.amount} (${MAPS.find((x) => x[0] === q.mapSlug)?.[1] ?? "qualquer mapa"})` : `Entregar ${q.amount}× ${ELEMENTS.find((e) => e[0] === q.elementZ)?.[2]}`} · Nv. {q.minLevel}+ · XP ×{q.xpB} · {q.gold}g</div>
          <div className="flex gap-2">
            <form action={toggleQuest}><input type="hidden" name="id" value={q.id} /><button className={btnDanger}>{q.active ? "Pausar" : "Ativar"}</button></form>
            <form action={delQuest}><input type="hidden" name="id" value={q.id} /><button className={btnDanger}>Excluir</button></form>
          </div>
        </Card>
      ))}
    </>
  );
}
