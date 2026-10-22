import Link from "next/link";
import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { maps } from "@/db/schema";
import { getActiveCharacter } from "@/lib/session";
import { travel } from "@/actions/character";
import { buyStone } from "@/actions/world";
import { MAGIC, stoneStack } from "@/lib/stone";
import { bg } from "@/lib/img";
import { WORLD_PINS } from "@/lib/game/town";
import { ENCOUNTER_P, escortCost } from "@/lib/game/travel";
import { realmStatus } from "@/lib/game/realm-schedule";
import SafeImg from "@/components/game/SafeImg";
import GameIcon from "@/components/game/GameIcon";

const fmt = (n: number) => n.toLocaleString("pt-BR");
// MAPA-MÚNDI: clique num mapa e escolha COMO viajar (estrada com risco · escolta paga · pedra · teleporte mágico)
export default async function MapPage({ searchParams }: { searchParams: Promise<{ to?: string }> }) {
  const a = await getActiveCharacter();
  if (!a) redirect("/characters");
  const { c } = a, mage = MAGIC.includes(c.classKey), st = (await stoneStack(c.id)).row?.quantity ?? 0, gold = Number(c.gold);
  const all = await db.select().from(maps).orderBy(asc(maps.minLevel));
  const to = (await searchParams).to, dest = all.find((m) => m.id === to);
  const path = all.map((m) => WORLD_PINS[m.slug]).filter(Boolean).map((p) => `${p.x},${p.y}`).join(" ");
  const opt = "flex items-center gap-2 rounded-lg border border-violet-800 bg-[#171433] p-3";
  const go = "ml-auto rounded bg-violet-600 px-3 py-1 text-sm transition-colors hover:bg-cyan-500 disabled:opacity-30";
  return (
    <main className="mx-auto max-w-5xl space-y-3 p-3 lg:p-5">
      <Link href="/play" className="flex items-center gap-1 text-violet-300"><GameIcon name="arrowleft" /> Voltar à cidade</Link>
      <h1 className="flex items-center gap-2 text-xl font-bold"><GameIcon name="compass" className="text-amber-300" /> Mapa-múndi</h1>
      <p className="text-sm text-violet-300">Clique num mapa para escolher como viajar. <GameIcon name="portal" /> = Reino aberto agora.</p>
      <div className="town" style={{ background: "linear-gradient(160deg,#1d2a5a,#10213a 60%,#0b2a3a)" }}>
        <div className="town-bg" style={{ background: bg("/world/mapa-mundi", "center/cover no-repeat") }} />
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <polyline points={path} fill="none" stroke="#fde68a" strokeOpacity=".75" strokeWidth="2.5" strokeDasharray="1 3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {all.map((m) => {
          const p = WORLD_PINS[m.slug];
          if (!p) return null;
          const here = m.id === c.currentMapId, locked = c.level < m.minLevel;
          const inner = (
            <>
              <span className="pin-dot">
                <GameIcon name={here ? "pin" : locked ? "lock" : "compass"} />
                {realmStatus(m.slug).open && <span className="pin-realm"><GameIcon name="portal" /></span>}
              </span>
              <span className="town-label">{m.name}</span>
              <span className="town-label" style={{ fontSize: "clamp(8px,1vw,12px)", color: "#c4b5fd" }}>Nv. {m.minLevel}+</span>
            </>
          );
          return (
            <div key={m.id} className="pin" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
              {locked || here ? (
                <div className={`pin-btn ${locked ? "pin-lock" : ""} ${here ? "pin-here" : ""}`} title={here ? "Você está aqui" : `Nível ${m.minLevel} necessário`}>{inner}</div>
              ) : (
                <Link href={`/map?to=${m.id}`} className={`pin-btn ${dest?.id === m.id ? "pin-here" : ""}`}>{inner}</Link>
              )}
            </div>
          );
        })}
      </div>

      {dest && (
        <section className="space-y-2 rounded-xl border-2 border-cyan-700/60 bg-[#12102c] p-3">
          <div className="flex items-center gap-2 font-bold text-cyan-300"><GameIcon name="pin" /> Viajar para {dest.name}</div>
          {mage && (
            <form action={travel} className={opt}>
              <input type="hidden" name="mapId" value={dest.id} /><input type="hidden" name="mode" value="teleporte" />
              <GameIcon name="vortex" className="text-violet-300" size="1.6em" />
              <div className="text-sm"><b>Teleporte</b><div className="text-xs text-violet-300">Sua classe viaja de graça, instantâneo e sem risco.</div></div>
              <button className={go}>Teleportar</button>
            </form>
          )}
          <form action={travel} className={opt}>
            <input type="hidden" name="mapId" value={dest.id} /><input type="hidden" name="mode" value="estrada" />
            <GameIcon name="boots" className="text-amber-300" size="1.6em" />
            <div className="text-sm"><b>Pela estrada</b><div className="text-xs text-violet-300">Grátis, mas {Math.round(ENCOUNTER_P * 100)}% de chance de uma emboscada (você cai direto numa luta).</div></div>
            <button className={go}>Ir a pé</button>
          </form>
          <form action={travel} className={opt}>
            <input type="hidden" name="mapId" value={dest.id} /><input type="hidden" name="mode" value="escolta" />
            <GameIcon name="shield" className="text-emerald-300" size="1.6em" />
            <div className="text-sm"><b>Escolta dos guardas</b><div className="text-xs text-violet-300">Viagem segura, sem encontros. Taxa: {fmt(escortCost(dest.minLevel, c.level))}g.</div></div>
            <button disabled={gold < escortCost(dest.minLevel, c.level)} className={go}>Pagar escolta</button>
          </form>
          {!mage && (
            <form action={travel} className={opt}>
              <input type="hidden" name="mapId" value={dest.id} /><input type="hidden" name="mode" value="pedra" />
              <SafeImg src="/items/teleport-stone.png" className="h-8 w-8" fallback={<GameIcon name="vortex" size="1.6em" />} />
              <div className="text-sm"><b>Pedra de Teletransporte</b><div className="text-xs text-violet-300">Instantâneo e sem risco. Você tem {st}.</div></div>
              <button disabled={st < 1} className={go}>Usar pedra</button>
            </form>
          )}
        </section>
      )}
      {!mage && (
        <form action={buyStone}>
          <button disabled={gold < 150} className="rounded border border-violet-800 px-4 py-2 disabled:opacity-30">
            <SafeImg src="/items/teleport-stone.png" className="mr-1 inline h-5 w-5" />
            Comprar pedra (150g) · <GameIcon name="coin" className="text-amber-300" /> {fmt(gold)}
          </button>
        </form>
      )}
    </main>
  );
}
