import { desc } from "drizzle-orm";
import { db } from "@/db";
import { newsPosts } from "@/db/schema";
import { addNews, toggleNews, delNews } from "@/actions/admin-content";
import { Card, F, inp, btn, btnDanger } from "@/components/admin/ui";
export default async function Page() {
  const rows = await db.select().from(newsPosts).orderBy(desc(newsPosts.createdAt)).limit(50);
  return (
    <>
      <h1 className="text-xl font-bold">Notícias da página inicial</h1>
      <Card title="Nova notícia">
        <form action={addNews} className="space-y-2">
          <F label="Título"><input name="title" required maxLength={80} className={inp} /></F>
          <F label="Texto" hint="Até 1500 caracteres. Quebras de linha são mantidas."><textarea name="body" required rows={4} maxLength={1500} className={inp} /></F>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="pinned" /> Fixar no topo</label>
          <button className={btn}>Publicar</button>
        </form>
      </Card>
      {rows.map((r) => (
        <Card key={r.id}>
          <div className="flex flex-wrap items-center gap-2">
            <b className="flex-1">{r.title}</b>
            <span className="text-xs text-violet-400">{new Date(r.createdAt).toLocaleDateString("pt-BR")}</span>
            {r.pinned && <span className="rounded bg-amber-500/20 px-2 text-xs text-amber-300">fixada</span>}
            {!r.published && <span className="rounded bg-slate-500/30 px-2 text-xs">oculta</span>}
          </div>
          <p className="whitespace-pre-wrap text-sm text-violet-200">{r.body}</p>
          <div className="flex gap-2">
            <form action={toggleNews}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="field" value="published" /><button className={btnDanger}>{r.published ? "Ocultar" : "Publicar"}</button></form>
            <form action={toggleNews}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="field" value="pinned" /><button className={btnDanger}>{r.pinned ? "Desafixar" : "Fixar"}</button></form>
            <form action={delNews}><input type="hidden" name="id" value={r.id} /><button className={btnDanger}>Excluir</button></form>
          </div>
        </Card>
      ))}
    </>
  );
}
