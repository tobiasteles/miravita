import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq, gte, lte, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { characters, pvpFights, pvpRatings } from "@/db/schema";
import { getActiveCharacter } from "@/lib/session";
import { CLASS_DEFS, CLASS_KEYS, CLASS_NAME } from "@/lib/game/classes";
import { BRACKET, DAILY_FIGHTS, league } from "@/lib/game/pvp";
import { ensureRating, rankOf } from "@/lib/arena-db";
import { challenge, practice } from "@/actions/arena";
import GameIcon from "@/components/game/GameIcon";
export const dynamic = "force-dynamic";

const box = "rounded-xl border border-violet-800 bg-[#171433] p-3";
const LC: Record<string, string> = { Bronze: "text-orange-300", Prata: "text-slate-200", Ouro: "text-amber-300", Diamante: "text-cyan-300", Lenda: "text-fuchsia-300" };
// ARENA PvP (versão 1): duelos assíncronos contra o "fantasma" de outros jogadores, com rating e ranking
export default async function Arena() {
  const a = await getActiveCharacter();
  if (!a) redirect("/characters");
  const { c } = a;
  const head = (
    <>
      <Link href="/play" className="flex items-center gap-1 text-violet-300"><GameIcon name="arrowleft" /> Voltar à cidade</Link>
      <h1 className="flex items-center gap-2 text-xl font-bold"><GameIcon name="swords" className="text-rose-300" /> Arena PvP</h1>
    </>
  );
  if (c.isGm || c.level < 20)
    return (
      <main className="mx-auto max-w-xl space-y-3 p-4">
        {head}
        <p className={box}>{c.isGm ? "Personagens GM não participam da Arena." : "A Arena abre no nível 20 (antes disso você tem poucos poderes para duelar). Continue subindo!"}</p>
      </main>
    );
  const me = await ensureRating(c.id), rank = await rankOf(me.rating), lg = league(me.rating), left = Math.max(0, DAILY_FIGHTS - me.fightsToday);
  const opp = await db
    .select({ id: characters.id, name: characters.name, cls: characters.classKey, lv: characters.level, rating: pvpRatings.rating, w: pvpRatings.wins, l: pvpRatings.losses })
    .from(characters).innerJoin(pvpRatings, eq(pvpRatings.characterId, characters.id))
    .where(and(ne(characters.id, c.id), ne(characters.userId, c.userId), eq(characters.isGm, false), gte(characters.level, c.level - BRACKET), lte(characters.level, c.level + BRACKET)))
    .orderBy(sql`abs(${pvpRatings.rating} - ${me.rating})`).limit(6);
  const top = await db
    .select({ name: characters.name, cls: characters.classKey, lv: characters.level, rating: pvpRatings.rating, w: pvpRatings.wins, l: pvpRatings.losses })
    .from(pvpRatings).innerJoin(characters, eq(pvpRatings.characterId, characters.id)).where(eq(characters.isGm, false)).orderBy(desc(pvpRatings.rating)).limit(15);
  const hist = await db.select().from(pvpFights).where(or(eq(pvpFights.attackerId, c.id), eq(pvpFights.defenderId, c.id))).orderBy(desc(pvpFights.createdAt)).limit(10);
  return (
    <main className="mx-auto max-w-xl space-y-3 p-4">
      {head}
      <section className="rounded-xl border-2 border-rose-600/70 bg-gradient-to-br from-rose-950/50 to-[#171433] p-4">
        <div className="flex items-baseline justify-between">
          <div><div className={`text-2xl font-black ${LC[lg]}`}>{lg}</div><div className="text-sm text-violet-300">Rating <b className="text-amber-200">{me.rating}</b> · #{rank} no ranking</div></div>
          <div className="text-right text-sm text-violet-300"><div>{me.wins}V · {me.losses}D</div><div>{me.streak > 1 ? `${me.streak} vitórias seguidas` : me.streak < -1 ? `${-me.streak} derrotas seguidas` : ""}</div></div>
        </div>
        <div className="mt-2 text-xs text-violet-300">Duelos valendo rating hoje: <b className="text-amber-200">{left}/{DAILY_FIGHTS}</b> · adversários até {BRACKET} níveis de diferença · sem poções · status normalizados</div>
      </section>

      <section className="space-y-2">
        <h2 className="font-bold text-cyan-300">Desafiar um jogador</h2>
        {opp.length === 0 && <p className={`${box} text-sm text-violet-300`}>Ainda não há jogadores no seu nível na Arena. Treine com um Gladiador abaixo enquanto a Arena enche.</p>}
        {opp.map((o) => (
          <form key={o.id} action={challenge} className={`${box} flex items-center gap-3`}>
            <input type="hidden" name="id" value={o.id} />
            <div className="min-w-0 flex-1"><b className="block truncate">{o.name}</b><span className="text-xs text-violet-400">{CLASS_NAME[o.cls]} · Nv. {o.lv} · {o.w}V {o.l}D</span></div>
            <div className="text-right text-sm"><div className={LC[league(o.rating)]}>{o.rating}</div></div>
            <button disabled={left < 1} className="rounded bg-rose-600 px-3 py-1.5 text-sm font-semibold transition hover:bg-rose-500 disabled:opacity-30">Duelar</button>
          </form>
        ))}
      </section>

      <section className={`${box} space-y-2`}>
        <h2 className="font-bold text-emerald-300">Treino com Gladiador (sem rating)</h2>
        <form action={practice} className="flex gap-2">
          <select name="cls" className="min-w-0 flex-1 rounded border border-violet-700 bg-[#0c0a1f] px-2 py-1.5 text-sm">
            {CLASS_KEYS.map((k) => <option key={k} value={k}>{CLASS_DEFS[k].name}</option>)}
          </select>
          <button className="rounded bg-emerald-700 px-3 py-1.5 text-sm font-semibold hover:bg-emerald-600">Treinar</button>
        </form>
        <p className="text-xs text-violet-400">Um Gladiador do seu nível, com a classe que você escolher. Bom para testar poderes sem arriscar o rating.</p>
      </section>

      <section className={`${box} space-y-1`}>
        <h2 className="font-bold text-amber-300">Ranking</h2>
        {top.map((t, i) => (
          <div key={i} className="flex items-center gap-2 text-sm"><span className="w-6 text-violet-400">{i + 1}</span><span className="min-w-0 flex-1 truncate">{t.name} <span className="text-xs text-violet-500">{CLASS_NAME[t.cls]} · Nv. {t.lv}</span></span><span className={LC[league(t.rating)]}>{t.rating}</span><span className="w-16 text-right text-xs text-violet-400">{t.w}V {t.l}D</span></div>
        ))}
      </section>

      {hist.length > 0 && (
        <section className={`${box} space-y-1`}>
          <h2 className="font-bold text-violet-200">Últimos duelos</h2>
          {hist.map((h) => {
            const mine = h.attackerId === c.id, won = mine ? h.attackerWon : !h.attackerWon;
            return (
              <div key={h.id} className="flex items-center gap-2 text-sm">
                <GameIcon name={won ? "check" : "cross"} className={won ? "text-emerald-400" : "text-rose-400"} />
                <span className="min-w-0 flex-1 truncate">{mine ? `Você desafiou ${h.defenderName}` : `${h.attackerName} desafiou você`}</span>
                <span className="text-xs text-violet-400">{mine ? `${h.delta > 0 ? "+" : ""}${h.delta}` : won ? "defendeu" : "perdeu a defesa"}</span>
              </div>
            );
          })}
        </section>
      )}
      <p className="text-center text-xs text-violet-500">Quando alguém te desafia, o servidor joga por você com os poderes que você deixou equipados na Academia. Capriche no seu loadout!</p>
    </main>
  );
}
