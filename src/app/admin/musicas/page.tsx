import { desc } from "drizzle-orm";
import { db } from "@/db";
import { musicTracks } from "@/db/schema";
import { addTrack, toggleTrack, delTrack } from "@/actions/admin-content";
import { Card, F, Opts, MAPS, inp, btn, btnDanger } from "@/components/admin/ui";
const CTX: [string, string][] = [["home", "Página inicial e login"], ["cidade", "Cidade e menus"], ["batalha", "Batalha comum"], ["reino", "Batalha no Reino"]];
export default async function Page() {
  const rows = await db.select().from(musicTracks).orderBy(desc(musicTracks.createdAt)).limit(100);
  return (
    <>
      <h1 className="text-xl font-bold">Músicas de fundo</h1>
      <p className="text-sm text-violet-300">Coloque o arquivo (.mp3 ou .ogg) na pasta <code>public/music/</code> do projeto e cadastre como <code>/music/nome.mp3</code>, ou use um link <code>https://…</code> direto para o arquivo. Se houver mais de uma faixa no mesmo lugar, o jogo sorteia. Uma faixa com mapa específico vence a geral. O volume do jogador é controlado no menu Esc.</p>
      <Card title="Nova faixa">
        <form action={addTrack} className="grid gap-2 sm:grid-cols-2">
          <F label="Título"><input name="title" required maxLength={60} className={inp} /></F>
          <F label="Endereço do arquivo"><input name="url" required placeholder="/music/cidade-aurora.mp3" className={inp} /></F>
          <F label="Onde toca"><select name="context" className={inp}><Opts list={CTX} /></select></F>
          <F label="Só neste mapa (opcional)"><select name="mapSlug" className={inp}><option value="">Todos os mapas</option><Opts list={MAPS} /></select></F>
          <F label="Volume da faixa (5–100)"><input name="volume" type="number" min={5} max={100} defaultValue={70} className={inp} /></F>
          <div className="flex items-end"><button className={btn}>Cadastrar</button></div>
        </form>
      </Card>
      {rows.map((t) => (
        <Card key={t.id}>
          <div className="flex flex-wrap items-center gap-2">
            <b className="flex-1">{t.title}</b>
            <span className={`rounded px-2 text-xs ${t.active ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-500/30"}`}>{t.active ? "ativa" : "pausada"}</span>
          </div>
          <div className="text-xs text-violet-300">{CTX.find((c) => c[0] === t.context)?.[1]} · {MAPS.find((m) => m[0] === t.mapSlug)?.[1] ?? "todos os mapas"} · volume {t.volume}</div>
          <audio controls preload="none" src={t.url} className="h-8 w-full" />
          <div className="flex gap-2">
            <form action={toggleTrack}><input type="hidden" name="id" value={t.id} /><button className={btnDanger}>{t.active ? "Pausar" : "Ativar"}</button></form>
            <form action={delTrack}><input type="hidden" name="id" value={t.id} /><button className={btnDanger}>Excluir</button></form>
          </div>
        </Card>
      ))}
    </>
  );
}
