import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customQuests, questClaims, questProgress } from "@/db/schema";
import { ELEMENTS } from "@/lib/game/elements";
import { claimCustomQuest } from "@/actions/custom-quests";
import { getActiveCharacter } from "@/lib/session";
import {
  STORY,
  SEASON,
  ARC,
  dailyList,
  dailyId,
  streakOf,
  mult,
  today,
  rwLines,
  MAPN,
  type Reward,
} from "@/lib/game/story";
import { SIDE, KILL, NPC } from "@/lib/game/quests";
import { claimStory, claimDaily, claimBonus } from "@/actions/missions";
import { claimQuest } from "@/actions/world";
import SafeImg from "@/components/game/SafeImg";

const box = "rounded-xl border border-violet-900 bg-[#171433] p-4";
const Bar = ({ v, m }: { v: number; m: number }) => (
  <div className="my-1 h-2 rounded bg-[#0c0a1f]">
    <div
      className="h-2 rounded bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-700"
      style={{ width: `${Math.min(100, (v / m) * 100)}%` }}
    />
  </div>
);
const Chips = ({ lines }: { lines: string[] }) => (
  <div className="mt-2 flex flex-wrap gap-1 text-xs">
    {lines.map((l) => (
      <span
        key={l}
        className="rounded-full border border-violet-700 bg-violet-950/60 px-2 py-0.5"
      >
        {l}
      </span>
    ))}
  </div>
);
const btn =
  "mt-2 rounded-lg bg-violet-600 px-4 py-1.5 font-semibold transition-colors duration-300 hover:bg-cyan-500 disabled:opacity-30 disabled:hover:bg-violet-600";

export default async function Quests() {
  const a = await getActiveCharacter();
  if (!a) redirect("/characters");
  const { c } = a,
    d = today();
  const [cl, pg] = await Promise.all([
    db
      .select({ id: questClaims.questId })
      .from(questClaims)
      .where(eq(questClaims.characterId, c.id)),
    db.select().from(questProgress).where(eq(questProgress.characterId, c.id)),
  ]);
  const cq = await db.select().from(customQuests).where(eq(customQuests.active, true)).catch(() => []);
  const done = new Set(cl.map((x) => x.id)),
    pr = new Map(pg.map((x) => [x.questId, x.progress]));
  const streak = streakOf([...done], d),
    m = mult(streak),
    daily = dailyList(d),
    allDaily = daily.every((q) => done.has(q.id)),
    bonusDone = done.has(dailyId(d, "bonus"));
  const cur = STORY.findIndex((q) => !done.has(q.id)),
    finished = STORY.filter((q) => done.has(q.id));
  const Btn = ({
    id,
    ok,
    label,
  }: {
    id: string;
    ok: boolean;
    label: string;
  }) =>
    done.has(id) ? (
      <span className="text-emerald-400">✔ concluída</span>
    ) : (
      <form action={claimQuest}>
        <input type="hidden" name="id" value={id} />
        <button disabled={!ok} className={btn}>
          {label}
        </button>
      </form>
    );
  const dayRw = (q: { xpB: number; gold: number }): Reward => ({
    xpB: q.xpB,
    gold: q.gold,
  });

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <Link href="/play" className="text-violet-300">
        ← Voltar à cidade
      </Link>
      <h1 className="text-2xl font-bold">📜 Missões</h1>

      {/* ───── DIÁRIAS ───── */}
      <section className={box}>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="flex-1 text-lg font-bold">📅 Missões Diárias</h2>
          <span className="rounded-full bg-amber-500/20 px-3 py-1 text-sm text-amber-300">
            🔥 {streak} dia(s) seguidos · bônus +{Math.round((m - 1) * 100)}%
          </span>
        </div>
        <p className="text-xs text-violet-400">
          Reiniciam à meia-noite (Brasília). Abra o Baú do Dia todo dia para
          aumentar a sequência (até +100% em XP e ouro). A cada 7 dias seguidos,
          uma peça rara extra.
        </p>
        <div className="mt-3 space-y-3">
          {daily.map((q) => {
            const v = Math.min(q.n, pr.get(q.id) ?? 0),
              dn = done.has(q.id);
            return (
              <div
                key={q.id}
                className="rounded-lg border border-violet-800/60 p-3"
              >
                <div className="flex items-center">
                  <b className="flex-1">{q.t}</b>
                  <span className="text-sm text-violet-300">
                    {v}/{q.n}
                  </span>
                </div>
                <p className="text-xs text-violet-300">{q.s}</p>
                <Bar v={v} m={q.n} />
                <Chips lines={rwLines(dayRw(q), c.level, m)} />
                {dn ? (
                  <div className="mt-2 text-emerald-400">✔ recebida</div>
                ) : (
                  <form action={claimDaily}>
                    <input type="hidden" name="k" value={q.k} />
                    <button disabled={v < q.n} className={btn}>
                      Receber
                    </button>
                  </form>
                )}
              </div>
            );
          })}
          <div className="rounded-lg border-2 border-amber-400/60 p-3">
            <b>🎁 Baú do Dia</b>
            <p className="text-xs text-violet-300">
              Complete as 3 diárias: poções de HP e EA, pedra de teletransporte,
              materiais pesados do mapa, XP e ouro com o seu bônus de sequência.
            </p>
            {bonusDone ? (
              <div className="mt-2 text-emerald-400">
                ✔ aberto hoje. Volte amanhã para manter a sequência!
              </div>
            ) : (
              <form action={claimBonus}>
                <button disabled={!allDaily} className={btn}>
                  {allDaily ? "Abrir baú" : "🔒 Faça as 3 diárias"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ───── HISTÓRIA ───── */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-amber-300">🎬 {SEASON}</h2>
        <div className="flex gap-2 text-xs">
          {(["Fundamental", "Médio", "Superior"] as const).map((t) => (
            <span
              key={t}
              className="rounded-full border border-violet-700 px-3 py-1"
            >
              {ARC[t]}:{" "}
              {STORY.filter((q) => q.tier === t && done.has(q.id)).length}/
              {STORY.filter((q) => q.tier === t).length}
            </span>
          ))}
        </div>
        {cur < 0 ? (
          <div className={box}>
            🏆 Fim da Temporada 1. A Temporada 2 depende da escolha que você fez
            no Trono Vazio. Os Portais continuam abertos...
          </div>
        ) : (
          (() => {
            const q = STORY[cur],
              v = Math.min(q.obj.n, pr.get(q.id) ?? 0),
              open = c.level >= q.lv,
              can = open && v >= q.obj.n;
            return (
              <div
                className={`${box} border-violet-500/60 shadow-[0_0_24px_#8b5cf633]`}
              >
                <div className="text-xs uppercase tracking-widest text-amber-300">
                  Episódio {cur + 1} de {STORY.length} · {ARC[q.tier]}
                </div>
                <h3 className="text-xl font-bold">{q.t}</h3>
                {open ? (
                  <p className="mt-1 text-sm text-violet-100">{q.s}</p>
                ) : (
                  <p className="mt-1 text-sm text-violet-400">
                    🔒 Este episódio começa no Nível {q.lv}.
                  </p>
                )}
                <div className="mt-3 text-sm">
                  🎯{" "}
                  {q.obj.t === "kill"
                    ? `Derrote ${q.obj.n} monstros`
                    : `Conclua ${q.obj.n} Reino${q.obj.n > 1 ? "s" : ""}`}{" "}
                  em <b>{MAPN[q.obj.slug]}</b>{" "}
                  <span className="text-violet-300">
                    ({v}/{q.obj.n})
                  </span>
                </div>
                <Bar v={v} m={q.obj.n} />
                <Chips lines={rwLines(q.rw, c.level)} />
                <form action={claimStory}>
                  <input type="hidden" name="id" value={q.id} />
                  <button disabled={!can} className={btn}>
                    {can
                      ? "Concluir episódio"
                      : open
                        ? "Objetivo em andamento"
                        : `🔒 Nv. ${q.lv}`}
                  </button>
                </form>
              </div>
            );
          })()
        )}
        {cur >= 0 && cur < STORY.length - 1 && (
          <div className={`${box} opacity-60`}>
            🔒 Episódio {cur + 2}: <b>{STORY[cur + 1].t}</b>{" "}
            <span className="text-xs text-violet-400">
              (Nv. {STORY[cur + 1].lv})
            </span>
            <div className="mt-1 text-xs text-violet-300">
              🎬 No próximo episódio: {STORY[cur].h}
            </div>
          </div>
        )}
        {finished.length > 0 && (
          <details className={box}>
            <summary className="cursor-pointer">
              Episódios concluídos ({finished.length})
            </summary>
            {finished.map((q) => (
              <div key={q.id} className="mt-2 border-t border-violet-900 pt-2">
                <b>✔ {q.t}</b>
                <p className="text-xs text-violet-300">{q.s}</p>
                <p className="text-xs text-amber-300/80">🎬 {q.h}</p>
              </div>
            ))}
          </details>
        )}
      </section>

      {/* ───── FAVORES E CAÇADAS ───── */}
      <section className="space-y-2">
        <h2 className="text-lg font-bold text-cyan-300">
          Favores dos mercadores
        </h2>
        {SIDE.map((q) => (
          <div
            key={q.id}
            className={`${box} ${c.level < q.lv ? "opacity-40" : ""}`}
          >
            <SafeImg
              src={`/npcs/${NPC[q.id]}.png`}
              className="float-left mr-3 h-16 w-16 rounded-lg object-cover"
            />
            <b>{q.who}</b>{" "}
            <span className="text-xs text-violet-400">Nv. {q.lv}+</span>
            <p className="text-sm">{q.s}</p>
            <div className="text-xs text-violet-400">
              Entregar: {q.n}× {q.el} · recompensa: ouro, XP e 2 Pedras de
              Teletransporte
            </div>
            <Btn id={q.id} ok={c.level >= q.lv} label="Entregar" />
          </div>
        ))}
      </section>
      <section className="space-y-2">
        <h2 className="text-lg font-bold text-rose-300">Caçadas</h2>
        {KILL.map((q) => {
          const p = Math.min(q.n, pr.get(q.id) ?? 0);
          return (
            <div
              key={q.id}
              className={`${box} ${c.level < q.lv ? "opacity-40" : ""}`}
            >
              <b>{q.t}</b>{" "}
              <span className="text-xs text-violet-400">Nv. {q.lv}+</span>
              <p className="text-sm">{q.s}</p>
              <div className="text-xs text-violet-400">
                Progresso: {p}/{q.n}
              </div>
              <Btn
                id={q.id}
                ok={c.level >= q.lv && p >= q.n}
                label="Receber recompensa"
              />
            </div>
          );
        })}
      </section>
      {/* ───── MISSÕES ESPECIAIS (criadas no /admin) ───── */}
      {cq.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-amber-300">Missões especiais</h2>
          {cq.map((q) => {
            const p = Math.min(q.amount, pr.get(q.id) ?? 0), dn = done.has(q.id), ok = c.level >= q.minLevel && (q.kind === "kill" ? p >= q.amount : true);
            return (
              <div key={q.id} className={`${box} ${c.level < q.minLevel ? "opacity-40" : ""}`}>
                <b>{q.title}</b> <span className="text-xs text-violet-400">Nv. {q.minLevel}+</span>
                <p className="text-sm">{q.story}</p>
                <div className="text-xs text-violet-400">
                  {q.kind === "kill" ? `Progresso: ${p}/${q.amount}` : `Entregar: ${q.amount}× ${ELEMENTS.find((e) => e[0] === q.elementZ)?.[2] ?? "elemento"}`} · recompensa: {q.gold}g e XP
                </div>
                {dn ? (
                  <span className="text-emerald-400">✔ concluída</span>
                ) : (
                  <form action={claimCustomQuest}>
                    <input type="hidden" name="id" value={q.id} />
                    <button disabled={!ok} className={btn}>{q.kind === "kill" ? "Receber recompensa" : "Entregar"}</button>
                  </form>
                )}
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}
