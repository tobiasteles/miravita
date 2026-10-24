import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { aiMonsters } from "@/db/schema";
import { addMonster, delMonster } from "@/actions/admin-content";
import { Card, F, Opts, MAPS, inp, btn, btnDanger, monSlug } from "@/components/admin/ui";
const K: Record<string, string> = { mon: "comum", sub: "sub-chefe", boss: "chefe" };
export default async function Page() {
  const rows = await db.select().from(aiMonsters).where(eq(aiMonsters.source, "admin")).orderBy(desc(aiMonsters.createdAt)).limit(100);
  return (
    <>
      <h1 className="text-xl font-bold">Monstros</h1>
      <p className="text-sm text-violet-300">Os números (vida, ataque, defesa) vêm da curva do jogo pelo nível do jogador. Aqui você cria o <b>nome e a identidade</b>: <b>comum</b> entra no sorteio dos monstros do mapa, <b>sub-chefe</b> aparece a cada 10 mortes no Portão e no 2º degrau do Reino, <b>chefe</b> a cada 25 mortes e no final do Reino. Arquétipo: tanque (+vida), frágil (+ataque) ou equilibrado.</p>
      <Card title="Novo monstro">
        <form action={addMonster} className="grid gap-2 sm:grid-cols-2">
          <F label="Nome"><input name="name" required minLength={3} maxLength={40} className={inp} /></F>
          <F label="Mapa"><select name="mapSlug" className={inp}><Opts list={MAPS} /></select></F>
          <F label="Tipo"><select name="kind" className={inp}><Opts list={[["mon", "Comum"], ["sub", "Sub-chefe"], ["boss", "Chefe"]]} /></select></F>
          <F label="Arquétipo"><select name="archetype" className={inp}><Opts list={[["balanced", "Equilibrado"], ["tank", "Tanque"], ["glass", "Frágil e forte"]]} /></select></F>
          <F label="Habilidade (opcional)"><input name="skillName" maxLength={40} className={inp} /></F>
          <F label="História curta"><input name="lore" maxLength={400} className={inp} /></F>
          <div className="sm:col-span-2"><button className={btn}>Criar monstro</button></div>
        </form>
      </Card>
      {rows.map((m) => (
        <Card key={m.id}>
          <div className="flex flex-wrap items-center gap-2">
            <b className="flex-1">{m.name}</b>
            <span className="rounded bg-violet-900/60 px-2 text-xs">{K[m.kind]}</span>
            <span className="text-xs text-violet-400">{MAPS.find((x) => x[0] === m.mapSlug)?.[1]}</span>
          </div>
          <p className="text-xs text-violet-300">{m.lore}</p>
          <p className="text-xs text-violet-500">Imagem: coloque o arquivo em <code>public/monsters/{monSlug(m.name)}.png</code> e rode <code>npm run imagens</code>.</p>
          <form action={delMonster}><input type="hidden" name="id" value={m.id} /><button className={btnDanger}>Excluir</button></form>
        </Card>
      ))}
      {!rows.length && <p className="text-violet-400">Nenhum monstro seu ainda.</p>}
    </>
  );
}
