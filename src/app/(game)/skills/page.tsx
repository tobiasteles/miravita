import { redirect } from "next/navigation";
import Link from "next/link";
import { getActiveCharacter } from "@/lib/session";
import DomainCard from "@/components/game/DomainCard";
import SafeImg from "@/components/game/SafeImg";
import GameIcon, { type IconName } from "@/components/game/GameIcon";
import { SKILLS, learnCost, LOADOUT_SIZE, type SkT } from "@/lib/game/classdata";
import { DOMAINS } from "@/lib/game/battle";
import { CLASS_NAME } from "@/lib/game/classes";
import { learnSkill, equipSkill, unequipSkill, loadout4 } from "@/actions/academy";

const ICON: Record<SkT, IconName> = { d: "sword", dot: "flame", bq: "gauntlet", st: "bolt", b: "star", e: "ghost", ag: "shield", sv: "spark", nuke: "vortex" };
const fmt = (n: number) => n.toLocaleString("pt-BR");
const tierColor = (i: number) => (i >= 9 ? "text-amber-300" : i >= 5 ? "text-cyan-300" : "text-violet-300");

// ACADEMIA: aprenda vários poderes, mas só 4 ficam equipados para a luta
export default async function Skills() {
  const a = await getActiveCharacter();
  if (!a) redirect("/characters");
  const { c } = a, S = SKILLS[c.classKey], D = DOMAINS[c.classKey];
  const kit = c.kit ?? { learned: [0], loadout: [0] }, lo = loadout4(kit.loadout), gold = Number(c.gold);
  return (
    <main className="mx-auto max-w-xl space-y-3 p-4">
      <Link href="/play" className="flex items-center gap-1 text-violet-300"><GameIcon name="arrowleft" /> Voltar</Link>
      <h1 className="flex items-center gap-2 text-xl font-bold"><GameIcon name="book" className="text-cyan-300" /> Academia — {CLASS_NAME[c.classKey]}</h1>
      <p className="flex items-center gap-1 text-sm text-violet-300">Aprenda poderes com ouro; na luta só os <b>{LOADOUT_SIZE} equipados</b> ficam disponíveis. <GameIcon name="coin" className="ml-1 text-amber-300" /> <span className="text-amber-300">{fmt(gold)}</span></p>

      {/* ----- loadout: os 4 poderes da luta ----- */}
      <section className="rounded-xl border-2 border-cyan-700/60 bg-[#12102c] p-3">
        <div className="mb-2 text-sm font-bold text-cyan-300">Poderes equipados (usados na batalha)</div>
        <div className="grid grid-cols-2 gap-2">
          {lo.map((i, slot) => (
            <div key={slot} className="rounded-lg border border-violet-800 bg-[#171433] p-2 text-sm">
              <div className="text-[10px] uppercase text-violet-400">Slot {slot + 1}</div>
              {i >= 0 && S[i] ? (
                <div className="flex items-center justify-between gap-1">
                  <span className="flex min-w-0 items-center gap-1"><GameIcon name={ICON[S[i].t]} className="text-amber-300" /> <span className="truncate">{S[i].n}</span></span>
                  <form action={unequipSkill}><input type="hidden" name="i" value={i} /><button className="rounded border border-rose-700 px-1.5 text-xs text-rose-300">tirar</button></form>
                </div>
              ) : (
                <span className="text-violet-500">vazio</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ----- árvore de poderes ----- */}
      {S.map((s, i) => {
        const learned = kit.learned.includes(i), locked = c.level < s.lv, eq = lo.includes(i), cost = learnCost(i);
        return (
          <div key={s.n} className={`rounded-lg border bg-[#171433] p-3 ${eq ? "border-cyan-500" : "border-violet-900"} ${locked ? "opacity-40" : ""}`}>
            <div className="flex items-start gap-3">
              <SafeImg src={`/skills/${c.classKey}-${i + 1}.png`} className="h-11 w-11 shrink-0 rounded bg-violet-950 object-contain" fallback={<span className="grid h-11 w-11 shrink-0 place-items-center rounded bg-violet-950 text-2xl text-amber-300"><GameIcon name={ICON[s.t]} /></span>} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <b>{s.n}</b>
                  <span className={`text-xs ${tierColor(i)}`}>{s.tier}</span>
                  <span className="text-xs text-violet-400">Nv. {s.lv}</span>
                </div>
                <div className="text-xs text-violet-300">{s.d}</div>
                <div className="mt-0.5 text-[11px] text-violet-400">{s.allMp ? "consome toda a EA" : s.c ? `EA ${s.c}% da máx.` : "sem custo de EA"} · PA {s.pa}{s.hp ? ` · custa ${s.hp * 100}% do HP` : ""}</div>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
              {locked ? (
                <span className="flex items-center gap-1 text-xs text-violet-400"><GameIcon name="lock" /> Nível {s.lv}</span>
              ) : !learned ? (
                <form action={learnSkill}>
                  <input type="hidden" name="i" value={i} />
                  <button disabled={gold < cost} className="flex items-center gap-1 rounded bg-violet-600 px-3 py-1 text-sm disabled:opacity-30"><GameIcon name="coin" /> Aprender · {fmt(cost)}g</button>
                </form>
              ) : eq ? (
                <span className="flex items-center gap-1 text-xs text-cyan-300"><GameIcon name="check" /> equipado</span>
              ) : (
                <form action={equipSkill} className="flex items-center gap-1">
                  <input type="hidden" name="i" value={i} />
                  <select name="slot" className="rounded border border-violet-700 bg-[#0c0a1f] px-1 py-1 text-xs">
                    {lo.map((x, slot) => (
                      <option key={slot} value={slot}>{x >= 0 && S[x] ? `Slot ${slot + 1} (trocar ${S[x].n})` : `Slot ${slot + 1} (vazio)`}</option>
                    ))}
                  </select>
                  <button className="rounded bg-cyan-700 px-3 py-1 text-sm">Equipar</button>
                </form>
              )}
            </div>
          </div>
        );
      })}
      <DomainCard c={{ level: c.level, classKey: c.classKey, gold, domain: c.domain }} />
      <p className="text-center text-xs text-violet-500">Despertar a partir do nível {D?.lv ?? 150}.</p>
    </main>
  );
}
