"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import SafeImg from "@/components/game/SafeImg";
import GameIcon, { type IconName } from "@/components/game/GameIcon";
import Emo from "@/components/game/Emo";
import { variants, bg } from "@/lib/img";
import { REALMS } from "@/lib/game/realms";
import { battleAct } from "@/actions/battle";
import type { BState } from "@/lib/game/battle";
type It = { n: string; c: number; lv: number };
type TLock = { label: string; txt: string; pos: number; m: number };
// ───── barra de acerto: ajuste aqui ─────
const SPEED = 1.9; // varreduras por segundo (maior = mais rápido)
const PERFECT = 0.08; // meia-largura da faixa dourada (acerto perfeito = crítico garantido, x2)
const GOOD = 0.2; // meia-largura da faixa verde (bom acerto, x1,4)
const HOLD = 650; // ms que a barra fica TRAVADA mostrando o resultado, antes de atacar
// ───── fundo da batalha (caçada e Reino): deixa a arte mais apagada para os monstros e a interface ficarem em destaque ─────
const BG_FILTER = "saturate(.6) brightness(.62) blur(1px)"; // menos saturação/brilho = chama menos atenção (ex.: .8 e .8 para um fundo mais vivo)
const BG_VIGNETTE =
  "radial-gradient(ellipse at 50% 58%, rgba(8,6,24,.10) 0%, rgba(8,6,24,.55) 100%)"; // escurece as bordas
type P = {
  av: string;
  cls: string;
  lv: number;
  name: string;
  hp: number;
  mhp: number;
  mp: number;
  mmp: number;
  skills: It[];
  summons: It[];
  cost: number;
  pots: { hp: number; ea: number };
  dom?: { n: string; c: string; ok: boolean; need: number };
};
const BG: Record<string, [string, string]> = {
  "planicie-de-aurora": ["#a5d8ff", "#7bc96f"],
  "floresta-sussurrante": ["#8fbf9f", "#3f7d4a"],
  "deserto-cinzento": ["#f7d79a", "#e0b36a"],
  "montanha-de-ferro": ["#b9c4d4", "#7b8794"],
  "pantano-radioativo": ["#9aa97d", "#5b6b45"],
  "abismo-do-cacador": ["#2b1a5c", "#120a2e"],
};
const slug = (n: string) =>
  n
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-");
const DC: Record<string, string> = {
  exatas: "#0891b2cc",
  humanas: "#d97706cc",
  linguagens: "#7c3aedcc",
};

// ícone de reserva (quando falta a imagem): classe antiga → ícone
const PLI: Record<string, IconName> = {
  exatas: "sword",
  humanas: "scroll",
  linguagens: "quill",
};
function Sprite({
  srcs,
  fb,
  cls,
}: {
  srcs: string[];
  fb: React.ReactNode;
  cls: string;
}) {
  const [i, setI] = useState(0);
  return i < srcs.length ? (
    <img
      src={srcs[i]}
      alt=""
      onError={() => setI(i + 1)}
      className={`${cls} object-contain [image-rendering:pixelated]`}
    />
  ) : (
    <div
      className={`${cls} grid place-items-center text-[min(12vh,6rem)] text-violet-200/80`}
    >
      {fb}
    </div>
  );
}

const Bar = ({ v, m }: { v: number; m: number }) => {
  const p = Math.max(0, Math.min(100, (v / m) * 100));
  return (
    <div className="h-2 flex-1 rounded bg-slate-300">
      <div
        className={`h-2 rounded transition-all duration-700 ${p > 50 ? "bg-emerald-500" : p > 20 ? "bg-yellow-400" : "bg-red-500"}`}
        style={{ width: `${p}%` }}
      />
    </div>
  );
};
const Box = ({ cls, children }: { cls: string; children: React.ReactNode }) => (
  <div
    className={`absolute w-44 rounded-lg border-2 border-slate-700 bg-amber-50 px-2 py-1 font-mono text-xs text-slate-800 shadow-lg ${cls}`}
  >
    {children}
  </div>
);
export default function BattleScreen({ b, p }: { b: BState; p: P }) {
  const r = useRouter();
  const [pend, go] = useTransition();
  const [menu, setMenu] = useState<"main" | "sk" | "sm" | "tm" | "it">("main");
  const [sk, setSk] = useState(0);
  const mk = useRef<HTMLDivElement>(null),
    pos = useRef(0),
    timer = useRef(0);
  const [tl, setTl] = useState<TLock | null>(null);
  const act = (a: Parameters<typeof battleAct>[0]) =>
    go(async () => {
      await battleAct(a);
      setMenu("main");
      setTl(null);
      if (a.a === "end") r.push("/play");
      else r.refresh();
    });
  useEffect(() => {
    if (menu !== "tm" || tl) return; // a barra vai e volta suavemente; ao travar, este efeito para e o marcador fica onde você clicou
    (document.activeElement as HTMLElement | null)?.blur();
    let id = 0;
    const t0 = performance.now() - Math.random() * (2000 / SPEED);
    const f = (t: number) => {
      const ph = (((t - t0) / 1000) * SPEED) % 2,
        x = ph < 1 ? ph : 2 - ph;
      pos.current = x;
      if (mk.current) mk.current.style.left = `calc(${x * 100}% - 3px)`;
      id = requestAnimationFrame(f);
    };
    id = requestAnimationFrame(f);
    return () => cancelAnimationFrame(id);
  }, [menu, tl]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const hit = () => {
    if (tl || pend) return;
    const d = Math.abs(pos.current - 0.5),
      mult = d < PERFECT ? 2 : d < GOOD ? 1.4 : 1,
      x = pos.current;
    setTl(
      mult === 2
        ? {
            label: "text-amber-300",
            txt: "PERFEITO! Crítico garantido (x2)",
            pos: x,
            m: mult,
          }
        : mult === 1.4
          ? { label: "text-emerald-300", txt: "BOM! (x1,4)", pos: x, m: mult }
          : { label: "text-rose-300", txt: "ERROU (x1)", pos: x, m: mult },
    );
    timer.current = window.setTimeout(
      () => act({ a: "skill", i: sk, m: mult }),
      HOLD,
    );
  };
  useEffect(() => {
    if (menu !== "tm") return;
    const dn = (e: KeyboardEvent) => {
        if (e.code === "Space" || e.key === "Enter") {
          e.preventDefault();
          hit();
        }
      },
      up = (e: KeyboardEvent) => {
        if (e.code === "Space") e.preventDefault();
      };
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", dn);
      window.removeEventListener("keyup", up);
    };
  }, [menu, tl, pend, sk]);
  const RM = REALMS[b.mapSlug];
  const [sky, ground] = b.dungeon
    ? [RM?.sky ?? "#241a4a", RM?.ground ?? "#140f2e"]
    : (BG[b.mapSlug] ?? BG["planicie-de-aurora"]);
  const es = slug(b.e.n),
    lock = (s: It) => (p.lv < s.lv ? ` · Nv.${s.lv}` : "");
  const m =
    "flex items-center gap-1.5 rounded border-2 border-slate-500 bg-slate-100 px-2 py-1.5 text-left font-mono text-sm font-bold text-slate-800 transition hover:bg-amber-200 disabled:opacity-40";
  const top = b.dungeon ? "top-12" : "top-3"; // no Reino o banner ocupa o topo
  return (
    // TELA FIXA: a cena ocupa o que sobra e o painel de comandos fica sempre visível embaixo (nada de rolar a página)
    <main className="mx-auto flex h-dvh max-w-5xl flex-col gap-2 overflow-hidden p-2">
      <div
        className="relative min-h-0 flex-1 overflow-hidden rounded-xl border-4 border-slate-700"
        style={{
          background: `linear-gradient(${sky} 0 52%, ${ground} 52% 100%)`,
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: bg(
              b.dungeon ? `/realms/${b.mapSlug}` : `/maps/${b.mapSlug}`,
              "center/cover",
            ),
            filter: BG_FILTER,
            transform: "scale(1.03)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: BG_VIGNETTE }}
        />
        {b.dungeon && RM && (
          <div className="absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/70 to-transparent px-3 py-1.5 text-center">
            <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold tracking-widest text-amber-300">
              <GameIcon name="portal" /> {RM.name.toUpperCase()}
            </span>
            <span className="block text-[10px] text-violet-200">
              {RM.tagline} · <GameIcon name="warn" /> mais difícil que a caçada
              normal
            </span>
          </div>
        )}
        {b.dom?.k && (
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-80 mix-blend-screen"
            style={{ backgroundImage: bg(`/domains/${b.dom.k}`) }}
          />
        )}
        {b.dom && (
          <div
            className="pointer-events-none absolute inset-0 animate-pulse"
            style={{
              background: `radial-gradient(circle at 50% 50%, transparent 15%, ${p.dom ? p.dom.c + "cc" : "#7c3aedcc"} 100%)`,
            }}
          />
        )}
        {/* inimigo (canto direito) */}
        <div className="absolute right-[5%] top-[52%] h-[6%] w-[24%] rounded-[50%] bg-black/25" />
        <Sprite
          key={es}
          srcs={variants(`/monsters/${es}`)}
          fb={<GameIcon name="skull" />}
          cls="absolute right-[7%] top-[12%] aspect-square h-[44%]"
        />
        <Box cls={`left-2 ${top}`}>
          <div className="flex justify-between font-bold">
            <span className="truncate">{b.e.n}</span>
            <span>Nv{b.e.L}</span>
          </div>
          <div className="flex items-center gap-1">
            HP
            <Bar v={b.e.hp} m={b.e.mx} />
          </div>
          {b.sv && (
            <div className="flex items-center gap-1">
              <GameIcon name="ghost" /> {b.sv.n} ({b.sv.t})
            </div>
          )}
          {b.dom && (
            <div className="flex items-center gap-1">
              <GameIcon name="vortex" /> Domínio ({b.dom.t})
            </div>
          )}
          {(b.burn ?? 0) > 0 && (
            <div className="flex items-center gap-1">
              <GameIcon name="moon" /> Esgotamento ({b.burn})
            </div>
          )}
        </Box>
        {/* jogador (canto esquerdo) */}
        <div className="absolute bottom-[5%] left-[3%] h-[7%] w-[26%] rounded-[50%] bg-black/25" />
        <Sprite
          key={p.av}
          srcs={[
            ...variants(`/battle/player/${p.av}`),
            ...variants(`/avatars/${p.av}`),
          ]}
          fb={<GameIcon name={PLI[p.cls] ?? "spark"} />}
          cls="absolute bottom-[8%] left-[6%] aspect-square h-[42%]"
        />
        {b.sv && (
          <Sprite
            key={b.sv.n}
            srcs={variants(`/summons/${slug(b.sv.n)}`)}
            fb={<GameIcon name="ghost" />}
            cls="absolute bottom-[30%] left-[24%] aspect-square h-[28%] opacity-90"
          />
        )}
        <Box cls="bottom-3 right-2">
          <div className="flex justify-between font-bold">
            <span className="truncate">{p.name}</span>
            <span>Nv{p.lv}</span>
          </div>
          <div className="flex items-center gap-1">
            HP
            <Bar v={p.hp} m={p.mhp} />
          </div>
          <div className="text-right">
            {p.hp}/{p.mhp}
          </div>
          <div className="flex items-center gap-1">
            EA
            <div className="h-2 flex-1 rounded bg-slate-300">
              <div
                className="h-2 rounded bg-sky-500 transition-all duration-700"
                style={{
                  width: `${Math.max(0, Math.min(100, (p.mp / p.mmp) * 100))}%`,
                }}
              />
            </div>
          </div>
        </Box>
      </div>

      {/* painel de comandos: registro à esquerda, botões à direita (sempre na tela) */}
      <div className="grid shrink-0 gap-3 rounded-xl border-4 border-slate-700 bg-slate-800 p-3 font-mono text-sm text-white md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div className="max-h-32 min-h-16 overflow-y-auto text-xs md:text-sm">
          {b.log.slice(-3).map((l, i) => (
            <div key={i}>
              <Emo>{l}</Emo>
            </div>
          ))}
          {b.res.some((l) => l.includes("⬆️")) && (
            <div
              className="relative my-1 grid h-10 place-items-center overflow-hidden rounded bg-violet-700/60 bg-cover bg-center"
              style={{ backgroundImage: bg("/brand/levelup-banner") }}
            >
              <span className="font-bold tracking-[.4em] text-amber-200 drop-shadow">
                NÍVEL UP!
              </span>
            </div>
          )}
          {b.res.map((l, i) => (
            <div key={"r" + i} className="text-amber-300">
              <Emo>{l}</Emo>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 content-start gap-2 sm:grid-cols-3">
          {b.over === "wave" ? (
            <button
              disabled={pend}
              className={m}
              onClick={() => act({ a: "next" })}
            >
              <GameIcon name="play" /> PRÓXIMA ONDA
            </button>
          ) : b.over ? (
            <button
              disabled={pend}
              className={m}
              onClick={() => act({ a: "end" })}
            >
              <GameIcon name="play" /> CONTINUAR
            </button>
          ) : menu === "main" ? (
            <>
              <button className={m} onClick={() => setMenu("sk")}>
                <GameIcon name="swords" /> LUTAR
              </button>
              <button
                disabled={pend}
                className={m}
                onClick={() => setMenu("it")}
              >
                <GameIcon name="flask" /> ITEM
              </button>
              <button
                disabled={!p.summons.length}
                className={m}
                onClick={() => setMenu("sm")}
              >
                <GameIcon name="ghost" /> INVOCAR
              </button>
              <button
                disabled={pend}
                className={m}
                onClick={() => act({ a: "flee" })}
              >
                <GameIcon name="boots" /> FUGIR
              </button>
              {p.dom && (
                <button
                  disabled={pend || !p.dom.ok}
                  className={m + " col-span-full !bg-amber-200"}
                  onClick={() => act({ a: "domain" })}
                >
                  <GameIcon name="vortex" /> {p.dom.n} ({p.dom.need} EA)
                </button>
              )}
            </>
          ) : menu === "sk" ? (
            <>
              {p.skills.map((s, i) => (
                <button
                  key={i}
                  disabled={p.mp < s.c || p.lv < s.lv}
                  className={m}
                  onClick={() => {
                    setSk(i);
                    setMenu("tm");
                  }}
                >
                  <SafeImg
                    src={`/skills/${p.cls}-${i + 1}.png`}
                    className="inline h-5 w-5"
                  />
                  <span className="min-w-0 truncate">
                    {s.n} ({s.c}EA{lock(s)})
                  </span>
                </button>
              ))}
              <button className={m} onClick={() => setMenu("main")}>
                <GameIcon name="arrowleft" /> VOLTAR
              </button>
            </>
          ) : menu === "it" ? (
            <>
              {(
                [
                  ["hp", "Poção de HP"],
                  ["ea", "Poção de EA"],
                ] as const
              ).map(([k, n]) => (
                <button
                  key={k}
                  disabled={pend || !p.pots[k]}
                  className={m}
                  onClick={() => act({ a: "potion", k })}
                >
                  <GameIcon name="flask" /> {n} ×{p.pots[k]}
                </button>
              ))}
              <button className={m} onClick={() => setMenu("main")}>
                <GameIcon name="arrowleft" /> VOLTAR
              </button>
            </>
          ) : menu === "sm" ? (
            <>
              {p.summons.map((s, i) => (
                <button
                  key={i}
                  disabled={pend || p.mp < s.c || p.lv < s.lv}
                  className={m}
                  onClick={() => act({ a: "summon", i })}
                >
                  <span className="min-w-0 truncate">
                    {s.n} ({s.c}EA{lock(s)})
                  </span>
                </button>
              ))}
              <button className={m} onClick={() => setMenu("main")}>
                <GameIcon name="arrowleft" /> VOLTAR
              </button>
            </>
          ) : (
            <div className="col-span-full">
              <div className="text-xs text-slate-300">
                {tl
                  ? "Resultado:"
                  : "Aperte ESPAÇO (ou o botão) quando o marcador estiver na faixa dourada!"}
              </div>
              <div
                className={`relative my-3 h-8 rounded border-2 bg-slate-900 transition-colors ${tl ? (tl.m === 2 ? "border-amber-300 shadow-[0_0_18px_#fbbf24aa]" : tl.m === 1.4 ? "border-emerald-300" : "border-rose-400") : "border-slate-500"}`}
              >
                <div
                  className="absolute inset-y-0 bg-emerald-400/25"
                  style={{
                    left: `${(0.5 - GOOD) * 100}%`,
                    width: `${GOOD * 200}%`,
                  }}
                />
                <div
                  className="absolute inset-y-0 bg-amber-400"
                  style={{
                    left: `${(0.5 - PERFECT) * 100}%`,
                    width: `${PERFECT * 200}%`,
                  }}
                />
                <div
                  ref={mk}
                  className={`absolute -top-1.5 h-11 w-2 rounded ${tl ? (tl.m === 2 ? "bg-amber-200" : tl.m === 1.4 ? "bg-emerald-200" : "bg-rose-300") : "bg-white"}`}
                  style={
                    tl ? { left: `calc(${tl.pos * 100}% - 4px)` } : undefined
                  }
                />
              </div>
              {tl ? (
                <div
                  className={`flex items-center justify-center gap-2 py-1 text-center text-lg font-bold ${tl.label}`}
                >
                  <GameIcon
                    name={
                      tl.m === 2 ? "bolt" : tl.m === 1.4 ? "check" : "cross"
                    }
                  />{" "}
                  {tl.txt}
                </div>
              ) : (
                <button
                  disabled={pend}
                  className={m + " w-full justify-center text-center"}
                  onClick={hit}
                >
                  <GameIcon name="bolt" /> AGORA!
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
