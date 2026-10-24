import { desc, isNull, and, ne } from "drizzle-orm";
import { db } from "@/db";
import { items } from "@/db/schema";
import { CLASS_DEFS, CLASS_KEYS } from "@/lib/game/classes";
import { statLine } from "@/lib/game/equipment";
import { addItem, giveItem } from "@/actions/admin-content";
import { Card, F, Opts, inp, btn } from "@/components/admin/ui";
const STAT: [string, string][] = [["atk", "Poderio"], ["def", "Defesa"], ["hp", "HP"], ["mp", "MP"], ["crit", "Chance de Ruptura %"], ["rupD", "Dano de Ruptura %"], ["res", "Ressonância %"], ["mit", "Mitigação %"], ["qg", "Quebra de Guarda %"], ["sifV", "Sifão Vital %"], ["sifE", "Sifão de Essência %"], ["foco", "Foco"], ["refl", "Reflexos"], ["reg", "Regeneração Inerente %"], ["imp", "Ímpeto de Caçador %"], ["ten", "Tenacidade %"], ["ret", "Retaliação %"], ["pen", "Penetração de Status %"]];
export default async function Page() {
  const rows = await db.select().from(items).where(and(isNull(items.elementAtomicNumber), ne(items.type, "consumivel"))).orderBy(desc(items.id)).limit(60);
  return (
    <>
      <h1 className="text-xl font-bold">Itens</h1>
      <p className="text-sm text-violet-300">Crie equipamentos únicos (eventos, prêmios, itens de GM) e entregue para um personagem pelo nome. O jogador equipa pelo Inventário. Imagem opcional em <code>public/items/&lt;slot&gt;-&lt;nome&gt;.png</code>.</p>
      <Card title="Novo item">
        <form action={addItem} className="grid gap-2 sm:grid-cols-3">
          <div className="sm:col-span-3"><F label="Nome"><input name="name" required minLength={3} maxLength={60} className={inp} /></F></div>
          <F label="Tipo"><select name="type" className={inp}><Opts list={[["arma", "Arma"], ["armadura", "Peitoral"], ["elmo", "Elmo"], ["botas", "Botas"], ["manoplas", "Manoplas"], ["acessorio", "Acessório / Traje"]]} /></select></F>
          <F label="Raridade"><select name="rarity" defaultValue="raro" className={inp}><Opts list={[["comum", "Comum"], ["raro", "Raro"], ["epico", "Épico"], ["lendario", "Lendário"]]} /></select></F>
          <F label="Nível mínimo"><input name="minLevel" type="number" min={1} max={200} defaultValue={1} className={inp} /></F>
          <F label="Só para a classe (opcional)"><select name="classRestriction" className={inp}><option value="">Todas</option>{CLASS_KEYS.map((k) => <option key={k} value={k}>{CLASS_DEFS[k].name}</option>)}</select></F>
          <F label="Valor (ouro)"><input name="value" type="number" min={0} defaultValue={1000} className={inp} /></F>
          <F label="Durabilidade"><input name="durability" type="number" min={10} defaultValue={200} className={inp} /></F>
          <div className="sm:col-span-3 text-xs text-violet-400">Bônus (deixe em branco o que não quiser):</div>
          {STAT.map(([k, l]) => <F key={k} label={l}><input name={k} type="number" step="any" min={0} className={inp} /></F>)}
          <div className="sm:col-span-3"><button className={btn}>Criar item</button></div>
        </form>
      </Card>
      <Card title="Entregar item a um personagem">
        <form action={giveItem} className="grid gap-2 sm:grid-cols-3">
          <F label="Item"><select name="itemId" className={inp}>{rows.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select></F>
          <F label="Nome do personagem"><input name="who" required className={inp} /></F>
          <F label="Quantidade"><input name="qty" type="number" min={1} defaultValue={1} className={inp} /></F>
          <div className="sm:col-span-3"><button className={btn} disabled={!rows.length}>Entregar</button></div>
        </form>
      </Card>
      {rows.map((i) => (
        <div key={i.id} className="rounded-lg border border-violet-900 bg-[#171433] p-3 text-sm">
          <b>{i.name}</b> <span className="text-xs text-violet-400">{i.type} · {i.rarity} · Nv. {i.minLevel}+</span>
          <div className="text-xs text-violet-300">{statLine(i.stats as Record<string, number>)}</div>
        </div>
      ))}
    </>
  );
}
