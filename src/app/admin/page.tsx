import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { aiMonsters, characters, customQuests, gameEvents, musicTracks, newsPosts, users } from "@/db/schema";
import { Card } from "@/components/admin/ui";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function n(t: any, w?: any) {
  const q = db.select({ n: count() }).from(t);
  return Number((await (w ? q.where(w) : q))[0]?.n ?? 0);
}
export default async function Admin() {
  const [u, ch, gm, mon, qs, ev, tr, nw] = await Promise.all([
    n(users), n(characters), n(characters, eq(characters.isGm, true)), n(aiMonsters, eq(aiMonsters.source, "admin")), n(customQuests),
    n(gameEvents, eq(gameEvents.active, true)), n(musicTracks), n(newsPosts),
  ]);
  const cards: [string, string, number | string][] = [
    ["/admin/noticias", "Notícias", nw], ["/admin/eventos", "Eventos ativos", ev], ["/admin/monstros", "Monstros seus", mon], ["/admin/missoes", "Missões suas", qs],
    ["/admin/gm", "Personagens GM", gm], ["/admin/musicas", "Músicas", tr],
  ];
  return (
    <>
      <h1 className="text-2xl font-bold">Painel do administrador</h1>
      <Card>
        <p className="text-sm text-violet-200"><b>{u}</b> contas · <b>{ch}</b> personagens</p>
      </Card>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map(([h, l, v]) => (
          <Link key={h} href={h} className="rounded-xl border border-violet-800 bg-[#171433] p-4 transition hover:border-cyan-400">
            <div className="text-3xl font-bold text-amber-300">{v}</div>
            <div className="text-sm text-violet-300">{l}</div>
          </Link>
        ))}
      </div>
    </>
  );
}
