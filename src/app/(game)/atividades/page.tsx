import Link from "next/link";
import { redirect } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { inventory, items, elements } from "@/db/schema";
import { getActiveCharacter } from "@/lib/session";
import { startExpedition, claimExpedition, dig, synthesize, setInfuse } from "@/actions/activities";
import { EXP, DIG_MAX, DIG_EVERY_MS, chargesNow, RECIPES } from "@/lib/game/activities";
import { RX_INFO } from "@/lib/game/battle";
import RealmCountdown from "@/components/game/RealmCountdown";
import GameIcon from "@/components/game/GameIcon";

const sec = "space-y-2 rounded-xl border border-violet-800 bg-[#171433] p-3";
const btn = "rounded bg-violet-600 px-3 py-1 text-sm transition-colors hover:bg-cyan-500 disabled:opacity-30";
// ATIVIDADES: coisas para fazer quando o Reino está fechado (ou quando você quer jogar sem lutar)
export default async function Atividades() {
  const a = await getActiveCharacter();
  if (!a?.map) redirect("/characters");
  const { c, map } = a, act = c.activity ?? {}, ex = act.exp, d = chargesNow(act.dig);
  const mats = await db
    .select({ z: items.elementAtomicNumber, qty: inventory.quantity, name: items.name, sym: elements.symbol, cat: elements.category })
    .from(inventory).innerJoin(items, eq(inventory.itemId, items.id)).leftJoin(elements, eq(items.elementAtomicNumber, elements.atomicNumber))
    .where(and(eq(inventory.characterId, c.id), eq(items.type, "material"), gt(inventory.quantity, 0)));
  const have = (z: number) => mats.find((m) => m.z === z)?.qty ?? 0;
  const nextCharge = d.charges >= DIG_MAX ? null : new Date(d.at + DIG_EVERY_MS).toISOString();
  return (
    <main className="mx-auto max-w-xl space-y-3 p-4">
      <Link href="/play" className="flex items-center gap-1 text-violet-300"><GameIcon name="arrowleft" /> Voltar à cidade</Link>
      <h1 className="flex items-center gap-2 text-xl font-bold"><GameIcon name="compass" className="text-emerald-300" /> Atividades — {map.name}</h1>
      {act.last?.length ? (
        <div className="rounded-lg border border-amber-500/60 bg-amber-950/20 p-2 text-sm text-amber-200">{act.last.map((l, i) => <div key={i}>{l}</div>)}</div>
      ) : null}

      {/* ───── 1. EXPEDIÇÕES ───── */}
      <section className={sec}>
        <h2 className="flex items-center gap-2 font-bold text-cyan-300"><GameIcon name="boots" /> Expedições</h2>
        <p className="text-xs text-violet-300">Mande seu personagem explorar {map.name}. Ele volta com XP, ouro e elementos, mesmo com você offline (cerca de 80% do que lutar daria).</p>
        {ex ? (
          <div className="flex items-center gap-2 rounded-lg border border-violet-700 p-2 text-sm">
            <GameIcon name="flag" className="text-amber-300" />
            <span>{EXP[ex.tier].n} em andamento · <RealmCountdown target={new Date(ex.endsAt).toISOString()} label="termina em" /></span>
            <form action={claimExpedition} className="ml-auto"><button className={btn}>Coletar</button></form>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {EXP.map((e, i) => (
              <form key={e.n} action={startExpedition}>
                <input type="hidden" name="tier" value={i} />
                <button className="w-full rounded-lg border border-violet-700 p-2 text-left text-sm transition hover:border-cyan-400">
                  <b>{e.n}</b><div className="text-xs text-violet-300">{e.min >= 60 ? `${e.min / 60} h` : `${e.min} min`} · ~{e.kills} lutas de recompensa</div>
                </button>
              </form>
            ))}
          </div>
        )}
      </section>

      {/* ───── 2. ESCAVAÇÃO ───── */}
      <section className={sec}>
        <h2 className="flex items-center gap-2 font-bold text-amber-300"><GameIcon name="pick" /> Escavação de Veios</h2>
        <p className="flex items-center gap-2 text-xs text-violet-300">Cargas: <b className="text-amber-200">{d.charges}/{DIG_MAX}</b>{nextCharge && <>· próxima em <RealmCountdown target={nextCharge} label="" /></>}. Escolha um ponto: o veio é sorteado (às vezes é rico!).</p>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }, (_, i) => (
            <form key={i} action={dig}>
              <input type="hidden" name="tile" value={i} />
              <button disabled={d.charges < 1} className="grid aspect-square w-full place-items-center rounded-lg border-2 border-dashed border-amber-700/70 bg-[#0c0a1f] text-amber-300 transition hover:border-amber-300 hover:bg-amber-950/30 disabled:opacity-30"><GameIcon name="pick" size="1.6em" /></button>
            </form>
          ))}
        </div>
      </section>

      {/* ───── 3. LABORATÓRIO ───── */}
      <section className={sec}>
        <h2 className="flex items-center gap-2 font-bold text-emerald-300"><GameIcon name="flask" /> Laboratório de Síntese{c.classKey === "quimica" && <span className="text-xs font-normal text-emerald-200">(Elemental: +50% de rendimento)</span>}</h2>
        {RECIPES.map((r) => {
          const ok = r.inp.every(([z, q]) => have(z) >= q);
          return (
            <form key={r.id} action={synthesize} className="flex items-center gap-2 rounded-lg border border-violet-800 p-2 text-sm">
              <input type="hidden" name="id" value={r.id} />
              <div className="flex-1"><b>{r.n}</b><div className="text-xs text-violet-300">{r.inp.map(([z, q]) => `${q}× ${mats.find((m) => m.z === z)?.sym ?? "Z" + z}`).join(" + ")} → {r.d}</div></div>
              <button disabled={!ok} className={btn}>Sintetizar</button>
            </form>
          );
        })}
        <form action={synthesize} className="flex items-center gap-2 rounded-lg border border-violet-800 p-2 text-sm">
          <input type="hidden" name="id" value="transmuta" />
          <div className="flex-1"><b>Transmutação</b><div className="text-xs text-violet-300">5 unidades de um elemento → 1 elemento mais raro</div></div>
          <select name="z" className="rounded border border-violet-700 bg-[#0c0a1f] px-1 py-1 text-xs">
            {mats.filter((m) => m.qty >= 5 && m.z).map((m) => <option key={m.z} value={m.z!}>{m.sym} ×{m.qty}</option>)}
          </select>
          <button disabled={!mats.some((m) => m.qty >= 5)} className={btn}>Transmutar</button>
        </form>
      </section>

      {/* ───── 4. INFUSÃO ELEMENTAL (só Elemental) ───── */}
      {c.classKey === "quimica" && (
        <section className={sec}>
          <h2 className="flex items-center gap-2 font-bold text-rose-300"><GameIcon name="flame" /> Infusão Elemental</h2>
          <p className="text-xs text-violet-300">Gasta 1 unidade do elemento por monstro e dá um efeito aos seus poderes conforme a categoria do elemento.</p>
          <form action={setInfuse} className="flex items-center gap-2">
            <select name="z" defaultValue={c.kit?.infuse ?? 0} className="flex-1 rounded border border-violet-700 bg-[#0c0a1f] px-1 py-1 text-sm">
              <option value={0}>Nenhum</option>
              {mats.filter((m) => m.z).map((m) => <option key={m.z} value={m.z!}>{m.sym} · {m.name} ×{m.qty} — {RX_INFO[m.cat ?? ""] ?? "sem efeito"}</option>)}
            </select>
            <button className={btn}>Definir</button>
          </form>
        </section>
      )}
    </main>
  );
}
