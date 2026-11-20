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
import BattleFx from "@/components/game/BattleFx";
import { useBattleKeys } from "@/components/game/useBattleKeys";
import dynamic from "next/dynamic";
import { useStageBus, useStageEvents } from "@/components/stage/bus";
import { markSlow, useStageMode } from "@/components/stage/support";
import { useToast } from "@/components/ui";
import { useT } from "@/i18n/client";
import { realmName, realmTagline } from "@/i18n/content";
// cena 3D: chunk separado, carregado só aqui (e só se o aparelho aguentar); o 2D abaixo continua sendo o padrão
const BattleStage = dynamic(() => import("@/components/stage/BattleStage"), { ssr: false });
type It = { i: number; n: string; c: number; pa: number; lv: number; t: string; d: string; req?: { i: number; n: number; name: string } | null };
type TLock = { label: string; txt: string; pos: number; m: number };
// ───── barra de acerto: ajuste aqui ─────
const SPEED = 1.9; // varreduras por segundo (maior = mais rápido)
const PERFECT = 0.08; // meia-largura da faixa dourada (acerto perfeito = Ruptura garantida, x2)
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
  skills: It[]; // os poderes EQUIPADOS (loadout de até 4); i = índice na árvore da classe
  pam: number;
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
const PLI: Record<string, IconName> = { exatas: "sword", humanas: "scroll", linguagens: "quill" };
function Sprite({ srcs, fb, cls }: { srcs: string[]; fb: React.ReactNode; cls: string }) {
  const [i, setI] = useState(0);
  return i < srcs.length ? (
    <img src={srcs[i]} alt="" onError={() => setI(i + 1)} className={`${cls} object-contain [image-rendering:pixelated]`} />
  ) : (
    <div className={`${cls} grid place-items-center text-[min(12vh,6rem)] text-violet-200/80`}>{fb}</div>
  );
}
const INSTANT = ["b", "e", "ag", "sv"]; // poderes de apoio não usam a barra de acerto
const PAT: Record<string, string> = { carga: "battle.pat.carga", couraca: "battle.pat.couraca", furia: "battle.pat.furia" };
const Bar = ({ v, m }: { v: number; m: number }) => {
  const p = m > 0 ? Math.max(0, Math.min(100, (v / m) * 100)) : 0;
  // camada clara atrás: encolhe devagar e mostra quanto acabou de cair
  return (
    <div className="relative h-2 flex-1 overflow-hidden rounded bg-slate-300">
      <div className="absolute inset-y-0 left-0 bg-white/80 transition-[width] delay-300 duration-1000 motion-reduce:transition-none" style={{ width: `${p}%` }} />
      <div
        className={`absolute inset-y-0 left-0 transition-[width] duration-500 motion-reduce:transition-none ${p > 50 ? "bg-emerald-500" : p > 20 ? "bg-yellow-400" : "bg-red-500"}`}
        style={{ width: `${p}%` }}
      />
    </div>
  );
};
const Kbd = ({ k }: { k: string }) => (
  <kbd className="ml-auto hidden rounded bg-slate-300 px-1 text-[10px] font-normal text-slate-600 md:inline">{k}</kbd>
);
const Box = ({ cls, children }: { cls: string; children: React.ReactNode }) => (
  <div
    className={`absolute w-44 rounded-lg border-2 border-slate-700 bg-amber-50 px-2 py-1 font-mono text-xs text-slate-800 shadow-lg ${cls}`}
  >
    {children}
  </div>
);
export default function BattleScreen({ b, p }: { b: BState; p: P }) {
  const r = useRouter();
  const { lang, t, f } = useT();
  const [pend, go] = useTransition();
  useBattleKeys();
  const mode = useStageMode(), bus = useStageBus(), toast = useToast();
  const [slow, setSlow] = useState(false), [ready3d, setReady3d] = useState(false);
  const is3d = mode === "3d" && !slow, scene3d = is3d && ready3d;
  // aviso de nível: destaque temporário (some em 4 s ou ao tocar); não faz parte do registro da luta
  const [lvOff, setLvOff] = useState<number | null>(null);
  const showLv = !!b.lv && lvOff !== (b.fxSeq ?? 0);
  useEffect(() => {
    if (!b.lv) return;
    const tm = setTimeout(() => setLvOff(b.fxSeq ?? 0), 4000);
    return () => clearTimeout(tm);
  }, [b.lv, b.fxSeq]);
  useStageEvents(bus, b.fx, b.fxSeq ?? 0); // anima o que o servidor gravou no último turno
  const [menu, setMenu] = useState<"main" | "sk" | "tm" | "it">("main");
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
      if (a.a === "end") r.push(b.pvp ? "/arena" : "/play");
      else r.refresh();
    });
  useEffect(() => {
    if (menu !== "tm" || tl) return; // a barra vai e volta suavemente; ao travar, este efeito para e o marcador fica onde você clicou
    (document.activeElement as HTMLElement | null)?.blur();
    let id = 0;
    const t0 = performance.now() - Math.random() * (2000 / SPEED);
    const tick = (now: number) => {
      const ph = (((now - t0) / 1000) * SPEED) % 2,
        x = ph < 1 ? ph : 2 - ph;
      pos.current = x;
      if (mk.current) mk.current.style.left = `calc(${x * 100}% - 3px)`;
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
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
            txt: t("battle.perfect"),
            pos: x,
            m: mult,
          }
        : mult === 1.4
          ? { label: "text-emerald-300", txt: t("battle.good", { m: f.n(1.4) }), pos: x, m: mult }
          : { label: "text-rose-300", txt: t("battle.miss"), pos: x, m: mult },
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
        style={{ background: `linear-gradient(${sky} 0 52%, ${ground} 52% 100%)` }}
      >
        {!scene3d && (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: bg(b.dungeon ? `/realms/${b.mapSlug}` : `/maps/${b.mapSlug}`, "center/cover"),
              filter: BG_FILTER,
              transform: "scale(1.03)",
            }}
          />
        )}
        {is3d && (
          <BattleStage
            bus={bus}
            bgUrls={variants(b.dungeon ? `/realms/${b.mapSlug}` : `/maps/${b.mapSlug}`)}
            foeUrls={variants(`/monsters/${es}`)}
            meUrls={[...variants(`/battle/player/${p.av}`), ...variants(`/avatars/${p.av}`)]}
            svUrls={b.sv ? variants(`/summons/${slug(b.sv.n)}`) : null}
            foeKey={`${b.e.n}|${b.wave}|${b.run?.kills ?? 0}`}
            over={b.over}
            sky={sky}
            danger={p.hp > 0 && p.hp / p.mhp < 0.25}
            domColor={b.dom ? (p.dom ? p.dom.c : "#7c3aed") : null}
            onReady={() => setReady3d(true)}
            onSlow={() => { markSlow(); setSlow(true); setReady3d(false); toast(t("stage.slow"), "warn"); }}
          />
        )}
        <div aria-hidden className="absolute inset-0" style={{ background: BG_VIGNETTE }} />
        <BattleFx enemyKey={`${b.e.n}|${b.wave}|${b.run?.kills ?? 0}`} enemyHp={b.e.hp} playerHp={p.hp} log={b.log} fx={b.fx} minimal={scene3d} />
        {b.charge ? (
          <div className="absolute inset-x-0 top-14 z-20 mx-auto w-fit animate-pulse rounded-full border-2 border-rose-400 bg-rose-950/90 px-4 py-1 text-center font-mono text-xs font-bold text-rose-200">
            <GameIcon name="warn" /> GOLPE DEVASTADOR a caminho! Atordoe, use Véu Intangível ou Barreira Aegis
          </div>
        ) : null}
        {b.ambush && <div className="absolute right-2 top-2 z-10 rounded bg-rose-900/90 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-200">{t("battle.ambush")}</div>}
        {b.pvp && (
          <div className="absolute right-2 top-2 z-10 rounded bg-black/70 px-2 py-1 text-right font-mono text-[10px] text-amber-200">
            <div className="font-bold text-rose-300">{t("battle.arenaTag")}{b.pvp.npc ? t("battle.training") : ""}</div>
            <div>{b.pvp.name} · {t("char.level", { n: b.pvp.lv })}</div>
            {(b.t ?? 0) > 0 && <div>{t("battle.turn", { a: b.t ?? 0, b: 30 })}</div>}
          </div>
        )}
        {b.endless && b.run && (
          <div className="absolute right-2 top-2 z-10 rounded bg-black/70 px-2 py-1 text-right font-mono text-[10px] text-amber-200">
            <div>{t("battle.runKills", { n: b.run.kills })}</div>
            <div>{t("battle.runGain", { xp: f.n(b.run.xp), g: f.n(b.run.gold) })}</div>
            <div>{t("battle.heat", { n: Math.round(b.run.heat * 100) })}</div>
          </div>
        )}
        {b.dungeon && RM && (
          <div className="absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/70 to-transparent px-3 py-1.5 text-center">
            <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold tracking-widest text-amber-300">
              <GameIcon name="portal" /> {realmName(lang, RM.name).toUpperCase()}
            </span>
            <span className="block text-[10px] text-violet-200">
              {realmTagline(lang, RM.name, RM.tagline)} · <GameIcon name="warn" /> {t("battle.harder")}
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
        {!scene3d && (
          <>
            <div className="absolute right-[5%] top-[52%] h-[6%] w-[24%] rounded-[50%] bg-black/25" />
            <Sprite
              key={es}
              srcs={variants(`/monsters/${es}`)}
              fb={<GameIcon name="skull" />}
              cls="absolute right-[7%] top-[12%] aspect-square h-[44%]"
            />
          </>
        )}
        <Box cls={`left-2 ${top}`}>
          <div className="flex justify-between font-bold">
            <span className="truncate">{b.e.n}</span>
            <span>{t("battle.lvShort", { n: b.e.L })}</span>
          </div>
          <div className="flex items-center gap-1">
            {t("battle.hp")}
            <Bar v={b.e.hp} m={b.e.mx} />
          </div>
          {!!b.e.pat?.length && (
            <div className="flex flex-wrap gap-1 text-[10px]">
              {b.e.pat.map((x) => (
                <span key={x} className="rounded bg-rose-200 px-1 text-rose-800">{t(PAT[x])}</span>
              ))}
            </div>
          )}
          {(b.eDef ?? 0) > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-emerald-700">
              <GameIcon name="gauntlet" /> {t("battle.guardBroken", { n: b.eDef ?? 0 })}
            </div>
          )}
          {b.skip && (
            <div className="flex items-center gap-1 text-[10px] text-amber-700">
              <GameIcon name="bolt" /> {t("battle.stunned")}
            </div>
          )}
          {b.sv && (
            <div className="flex items-center gap-1">
              <GameIcon name="ghost" /> {b.sv.n} ({b.sv.t})
            </div>
          )}
          {b.dom && (
            <div className="flex items-center gap-1">
              <GameIcon name="vortex" /> {t("battle.domain", { n: b.dom.t })}
            </div>
          )}
          {(b.burn ?? 0) > 0 && (
            <div className="flex items-center gap-1">
              <GameIcon name="moon" /> {t("battle.burnout", { n: b.burn ?? 0 })}
            </div>
          )}
        </Box>
        {/* jogador (canto esquerdo) */}
        {!scene3d && (
          <>
            <div className="absolute bottom-[5%] left-[3%] h-[7%] w-[26%] rounded-[50%] bg-black/25" />
            <Sprite
              key={p.av}
              srcs={[...variants(`/battle/player/${p.av}`), ...variants(`/avatars/${p.av}`)]}
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
          </>
        )}
        <Box cls="bottom-3 right-2">
          <div className="flex justify-between font-bold">
            <span className="truncate">{p.name}</span>
            <span>{t("battle.lvShort", { n: p.lv })}</span>
          </div>
          <div className="flex items-center gap-1">
            {t("battle.hp")}
            <Bar v={p.hp} m={p.mhp} />
          </div>
          <div className="text-right">
            {p.hp}/{p.mhp}
          </div>
          <div className="flex items-center gap-1">
            {t("battle.ea")}
            <div className="h-2 flex-1 rounded bg-slate-300">
              <div
                className="h-2 rounded bg-sky-500 transition-all duration-700"
                style={{ width: `${Math.max(0, Math.min(100, (p.mp / p.mmp) * 100))}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1">
            {t("battle.pa")}
            <div className="h-2 flex-1 rounded bg-slate-300">
              <div
                className="h-2 rounded bg-amber-500 transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(100, ((b.pa ?? p.pam) / p.pam) * 100))}%` }}
              />
            </div>
          </div>
          {(b.aegis ?? 0) > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-cyan-700">
              <GameIcon name="shield" /> {t("battle.aegis", { n: b.aegis ?? 0 })}
            </div>
          )}
          {b.pStun && (
            <div className="flex items-center gap-1 text-[10px] text-rose-700">
              <GameIcon name="bolt" /> {t("battle.stunnedBang")}
            </div>
          )}
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
          {showLv && (
            <button
              type="button"
              onClick={() => setLvOff(b.fxSeq ?? 0)}
              aria-label={t("battle.levelUpAria", { n: b.lv ?? 0 })}
              className="relative my-1 grid h-10 w-full place-items-center overflow-hidden rounded bg-violet-700/60 bg-cover bg-center"
              style={{ backgroundImage: bg("/brand/levelup-banner") }}
            >
              <span className="font-bold tracking-[.4em] text-amber-200 drop-shadow">{t("battle.levelUp", { n: b.lv ?? 0 })}</span>
            </button>
          )}
          {b.res.map((l, i) => (
            <div key={"r" + i} className="text-amber-300">
              <Emo>{l}</Emo>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 content-start gap-2 sm:grid-cols-3">
          {b.over === "wave" ? (
            <>
              <button data-key="n" disabled={pend} className={m} onClick={() => act({ a: "next" })}>
                <GameIcon name="play" /> {b.endless ? t("battle.nextMonster") : t("battle.nextWave")}
              </button>
              {b.endless && (
                <button disabled={pend} className={m + " !bg-slate-300"} onClick={() => act({ a: "end" })}>
                  <GameIcon name="castle" /> {t("battle.toTown")}
                </button>
              )}
            </>
          ) : b.over ? (
            <button data-key="n" disabled={pend} className={m} onClick={() => act({ a: "end" })}>
              <GameIcon name="play" /> {t("battle.continue")}
            </button>
          ) : menu === "main" ? (
            <>
              <button data-key="l" className={m} onClick={() => setMenu("sk")}>
                <GameIcon name="swords" /> {t("battle.fight")} <Kbd k="L" />
              </button>
              <button disabled={pend || !!b.pvp} title={b.pvp ? t("battle.noPotionsArena") : ""} data-key="i" className={m} onClick={() => setMenu("it")}>
                <GameIcon name="flask" /> {t("battle.item")} <Kbd k="I" />
              </button>
              <button data-key="f" disabled={pend} className={m} onClick={() => act({ a: "flee" })}>
                <GameIcon name="boots" /> {t("battle.flee")} <Kbd k="F" />
              </button>
              {b.endless && (
                <button disabled={pend} className={m + " col-span-full !bg-slate-300"} onClick={() => act({ a: "end" })}>
                  <GameIcon name="castle" /> {t("battle.toTown")}
                </button>
              )}
              {p.dom && (
                <button
                  disabled={pend || !p.dom.ok}
                  className={m + " col-span-full !bg-amber-200"}
                  onClick={() => act({ a: "domain" })}
                >
                  <GameIcon name="vortex" /> {p.dom.n} {t("battle.domainCost", { n: p.dom.need })}
                </button>
              )}
            </>
          ) : menu === "sk" ? (
            <>
              {p.skills.length === 0 && <div className="col-span-full text-xs text-amber-300">{t("battle.noPowers")}</div>}
              {p.skills.map((s, idx) => {
                const reqOk = !s.req || (b.used?.[s.req.i] ?? 0) >= s.req.n, pa = b.pa ?? p.pam;
                const why = !reqOk ? t("battle.requires", { name: s.req!.name, n: s.req!.n, a: b.used?.[s.req!.i] ?? 0 }) : "";
                return (
                  <button
                    key={s.i}
                    data-key={String(idx + 1)}
                    title={s.d}
                    disabled={pend || p.mp < s.c || pa < s.pa || p.lv < s.lv || !reqOk}
                    className={m + " flex-col !items-start"}
                    onClick={() => {
                      if (INSTANT.includes(s.t)) act({ a: "skill", i: s.i, m: 1 });
                      else {
                        setSk(s.i);
                        setMenu("tm");
                      }
                    }}
                  >
                    <span className="flex w-full items-center gap-1.5">
                      <SafeImg src={`/skills/${p.cls}-${s.i + 1}.png`} className="inline h-5 w-5" />
                      <span className="min-w-0 truncate">{s.n}</span>
                      <Kbd k={String(idx + 1)} />
                    </span>
                    <span className="text-[10px] font-normal text-slate-500">{why || t("battle.cost", { c: s.c, pa: s.pa })}</span>
                  </button>
                );
              })}
              <button data-key="b" className={m} onClick={() => setMenu("main")}>
                <GameIcon name="arrowleft" /> {t("battle.back")}
              </button>
            </>
          ) : menu === "it" ? (
            <>
              {(
                [
                  ["hp", t("battle.potionHp")],
                  ["ea", t("battle.potionEa")],
                ] as const
              ).map(([k, n]) => (
                <button key={k} disabled={pend || !p.pots[k]} className={m} onClick={() => act({ a: "potion", k })}>
                  <GameIcon name="flask" /> {n} ×{p.pots[k]}
                </button>
              ))}
              <button data-key="b" className={m} onClick={() => setMenu("main")}>
                <GameIcon name="arrowleft" /> {t("battle.back")}
              </button>
            </>
          ) : (
            <div className="col-span-full">
              <div className="text-xs text-slate-300">
                {tl ? t("battle.result") : t("battle.pressSpace")}
              </div>
              <div
                className={`relative my-3 h-8 rounded border-2 bg-slate-900 transition-colors ${tl ? (tl.m === 2 ? "border-amber-300 shadow-[0_0_18px_#fbbf24aa]" : tl.m === 1.4 ? "border-emerald-300" : "border-rose-400") : "border-slate-500"}`}
              >
                <div
                  className="absolute inset-y-0 bg-emerald-400/25"
                  style={{ left: `${(0.5 - GOOD) * 100}%`, width: `${GOOD * 200}%` }}
                />
                <div
                  className="absolute inset-y-0 bg-amber-400"
                  style={{ left: `${(0.5 - PERFECT) * 100}%`, width: `${PERFECT * 200}%` }}
                />
                <div
                  ref={mk}
                  className={`absolute -top-1.5 h-11 w-2 rounded ${tl ? (tl.m === 2 ? "bg-amber-200" : tl.m === 1.4 ? "bg-emerald-200" : "bg-rose-300") : "bg-white"}`}
                  style={tl ? { left: `calc(${tl.pos * 100}% - 4px)` } : undefined}
                />
              </div>
              {tl ? (
                <div className={`flex items-center justify-center gap-2 py-1 text-center text-lg font-bold ${tl.label}`}>
                  <GameIcon name={tl.m === 2 ? "bolt" : tl.m === 1.4 ? "check" : "cross"} /> {tl.txt}
                </div>
              ) : (
                <button disabled={pend} className={m + " w-full justify-center text-center"} onClick={hit}>
                  <GameIcon name="bolt" /> {t("battle.now")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
