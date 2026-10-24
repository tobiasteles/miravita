import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { characters, users } from "@/db/schema";
import { CLASS_DEFS, CLASS_KEYS, CLASS_NAME } from "@/lib/game/classes";
import { createGm, editCharacter } from "@/actions/admin-content";
import { Card, F, inp, btn } from "@/components/admin/ui";
export default async function Page() {
  const rows = await db.select({ c: characters, email: users.email }).from(characters).innerJoin(users, eq(characters.userId, users.id)).orderBy(desc(characters.level)).limit(60);
  return (
    <>
      <h1 className="text-xl font-bold">Personagens GM</h1>
      <p className="text-sm text-violet-300">Um GM não morre nas lutas (HP sempre cheio) e aparece com <b>[GM]</b> no chat. Criar um GM já entrega o nível, o ouro e todos os poderes aprendidos. O GM criado aqui ignora o limite de 6 personagens da conta.</p>
      <Card title="Criar personagem GM">
        <form action={createGm} className="grid gap-2 sm:grid-cols-3">
          <F label="Email da conta" hint="vazio = a sua"><input name="email" type="email" className={inp} /></F>
          <F label="Nome do personagem"><input name="name" required minLength={3} maxLength={16} className={inp} /></F>
          <F label="Classe"><select name="cls" className={inp}>{CLASS_KEYS.map((k) => <option key={k} value={k}>{CLASS_DEFS[k].name}</option>)}</select></F>
          <F label="Nível"><input name="level" type="number" min={1} max={200} defaultValue={200} className={inp} /></F>
          <F label="Ouro"><input name="gold" type="number" min={0} defaultValue={10000000} className={inp} /></F>
          <div className="flex items-end"><button className={btn}>Criar GM</button></div>
        </form>
      </Card>
      <Card title="Editar personagens (maiores níveis primeiro)">
        <div className="space-y-2">
          {rows.map(({ c, email }) => (
            <form key={c.id} action={editCharacter} className="flex flex-wrap items-center gap-2 rounded border border-violet-900 p-2 text-sm">
              <input type="hidden" name="id" value={c.id} />
              <div className="min-w-40 flex-1"><b>{c.isGm ? "[GM] " : ""}{c.name}</b> <span className="text-xs text-violet-400">{CLASS_NAME[c.classKey]} · {email}</span></div>
              <input name="level" type="number" min={1} max={200} defaultValue={c.level} title="Nível (zera o XP)" className={inp + " !w-20"} />
              <input name="gold" type="number" min={0} defaultValue={Number(c.gold)} title="Ouro" className={inp + " !w-32"} />
              <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="isGm" defaultChecked={c.isGm} /> GM</label>
              <button className={btn}>Salvar</button>
            </form>
          ))}
        </div>
      </Card>
    </>
  );
}
