"use client";
import { useEffect, useRef, useState, useTransition } from "react"; import { useRouter } from "next/navigation"; import SafeImg from "@/components/game/SafeImg"; import { variants, bg } from "@/lib/img"; import { battleAct } from "@/actions/battle"; import type { BState } from "@/lib/game/battle";
type It = { n: string; c: number; lv: number };
type P = { av: string; cls: string; lv: number; name: string; hp: number; mhp: number; mp: number; mmp: number; skills: It[]; summons: It[]; cost: number; pots: { hp: number; ea: number }; dom?: { n: string; c: string; ok: boolean; need: number } };
const BG: Record<string, [string, string]> = { "planicie-de-aurora": ["#a5d8ff", "#7bc96f"], "floresta-sussurrante": ["#8fbf9f", "#3f7d4a"], "deserto-cinzento": ["#f7d79a", "#e0b36a"], "montanha-de-ferro": ["#b9c4d4", "#7b8794"], "pantano-radioativo": ["#9aa97d", "#5b6b45"], "abismo-do-cacador": ["#2b1a5c", "#120a2e"] };
const slug = (n: string) => n.replace(/[^\p{L}\p{N} ]/gu, "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "-");
const DC: Record<string, string> = { exatas: "#0891b2cc", humanas: "#d97706cc", linguagens: "#7c3aedcc" };
const MON = ["👹", "🐺", "🐍", "🦂", "👻", "🐉", "🦇", "🗿"], PL: Record<string, string> = { exatas: "⚔️", humanas: "📜", linguagens: "✒️" };
function Sprite({ srcs, fb, cls }: { srcs: string[]; fb: string; cls: string }) {
  const [i, setI] = useState(0);
  return i < srcs.length ? <img src={srcs[i]} alt="" onError={() => setI(i + 1)} className={`${cls} object-contain [image-rendering:pixelated]`} /> : <div className={`${cls} grid place-items-center text-6xl`}>{fb}</div>;
}
const Bar = ({ v, m }: { v: number; m: number }) => { const p = Math.max(0, Math.min(100, (v / m) * 100)); return <div className="h-2 flex-1 rounded bg-slate-300"><div className={`h-2 rounded transition-all duration-700 ${p > 50 ? "bg-emerald-500" : p > 20 ? "bg-yellow-400" : "bg-red-500"}`} style={{ width: `${p}%` }} /></div>; };
const Box = ({ cls, children }: { cls: string; children: React.ReactNode }) => <div className={`absolute w-44 rounded-lg border-2 border-slate-700 bg-amber-50 px-2 py-1 font-mono text-xs text-slate-800 shadow-lg ${cls}`}>{children}</div>;
export default function BattleScreen({ b, p }: { b: BState; p: P }) {
  const r = useRouter(); const [pend, go] = useTransition(); const [menu, setMenu] = useState<"main" | "sk" | "sm" | "tm" | "it">("main"); const [sk, setSk] = useState(0);
  const mk = useRef<HTMLDivElement>(null), pos = useRef(0);
  const act = (a: Parameters<typeof battleAct>[0]) => go(async () => { await battleAct(a); setMenu("main"); if (a.a === "end") r.push("/play"); else r.refresh(); });
  useEffect(() => { if (menu !== "tm") return; let x = 0, d = 1, id = 0;
    const f = () => { x += d * 0.017; if (x >= 1) { x = 1; d = -1 } if (x <= 0) { x = 0; d = 1 } pos.current = x; if (mk.current) mk.current.style.left = `calc(${x * 100}% - 3px)`; id = requestAnimationFrame(f); };
    f(); return () => cancelAnimationFrame(id); }, [menu]);
  const hit = () => { const d = Math.abs(pos.current - .5); act({ a: "skill", i: sk, m: d < .07 ? 2 : d < .2 ? 1.4 : 1 }); };
  const [sky, ground] = BG[b.mapSlug] ?? BG["planicie-de-aurora"], es = slug(b.e.n), lock = (s: It) => (p.lv < s.lv ? ` · Nv.${s.lv}` : "");
  const m = "rounded border-2 border-slate-500 bg-slate-100 px-2 py-2 text-left font-mono text-sm font-bold text-slate-800 transition hover:bg-amber-200 disabled:opacity-40";
  const fb = MON[[...es].reduce((a, ch) => a + ch.charCodeAt(0), 0) % MON.length];
  return <main className="mx-auto max-w-md space-y-2 p-2">
    <div className="relative h-80 overflow-hidden rounded-xl border-4 border-slate-700" style={{ background: `${bg(`/maps/${b.mapSlug}`, "center/cover")}, linear-gradient(${sky} 0 52%, ${ground} 52% 100%)` }}>
      {b.dom?.k && <div className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-80 mix-blend-screen" style={{ backgroundImage: bg(`/domains/${b.dom.k}`) }} />}{b.dom && <div className="pointer-events-none absolute inset-0 animate-pulse" style={{ background: `radial-gradient(circle at 50% 50%, transparent 15%, ${p.dom ? p.dom.c + "cc" : "#7c3aedcc"} 100%)` }} />}
      <div className="absolute right-2 top-[26%] h-8 w-44 rounded-[50%] bg-black/20" />
      <Sprite key={es} srcs={variants(`/monsters/${es}`)} fb={fb} cls="absolute right-6 top-8 h-32 w-32" />
      <Box cls="left-2 top-3"><div className="flex justify-between font-bold"><span className="truncate">{b.e.n}</span><span>Nv{b.e.L}</span></div><div className="flex items-center gap-1">HP<Bar v={b.e.hp} m={b.e.mx} /></div>{b.sv && <div>👻 {b.sv.n} ({b.sv.t})</div>}{b.dom && <div>🌀 Domínio ({b.dom.t})</div>}{(b.burn ?? 0) > 0 && <div>💤 Esgotamento ({b.burn})</div>}</Box>
      <div className="absolute bottom-2 left-3 h-9 w-52 rounded-[50%] bg-black/25" />
      <Sprite key={p.av} srcs={[...variants(`/battle/player/${p.av}`), ...variants(`/avatars/${p.av}`)]} fb={PL[p.cls] ?? "🧙"} cls="absolute bottom-6 left-8 h-32 w-32" />
      {b.sv && <Sprite key={b.sv.n} srcs={variants(`/summons/${slug(b.sv.n)}`)} fb="👻" cls="absolute bottom-24 left-28 h-24 w-24 opacity-90" />}
      <Box cls="bottom-3 right-2"><div className="flex justify-between font-bold"><span className="truncate">{p.name}</span><span>Nv{p.lv}</span></div><div className="flex items-center gap-1">HP<Bar v={p.hp} m={p.mhp} /></div><div className="text-right">{p.hp}/{p.mhp}</div><div className="flex items-center gap-1">EA<div className="h-2 flex-1 rounded bg-slate-300"><div className="h-2 rounded bg-sky-500 transition-all duration-700" style={{ width: `${Math.max(0, Math.min(100, (p.mp / p.mmp) * 100))}%` }} /></div></div></Box>
    </div>
    <div className="rounded-xl border-4 border-slate-700 bg-slate-800 p-3 font-mono text-sm text-white">
      <div className="min-h-20">{b.log.slice(-3).map((l, i) => <div key={i}>{l}</div>)}{b.res.some((l) => l.includes("⬆️")) && <div className="relative my-1 grid h-14 place-items-center overflow-hidden rounded bg-violet-700/60 bg-cover bg-center" style={{ backgroundImage: bg("/brand/levelup-banner") }}><span className="font-bold tracking-[.4em] text-amber-200 drop-shadow">NÍVEL UP!</span></div>}{b.res.map((l, i) => <div key={"r" + i} className="text-amber-300">{l}</div>)}</div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {b.over === "wave" ? <button disabled={pend} className={m} onClick={() => act({ a: "next" })}>▶ PRÓXIMA ONDA</button>
        : b.over ? <button disabled={pend} className={m} onClick={() => act({ a: "end" })}>▶ CONTINUAR</button>
        : menu === "main" ? <><button className={m} onClick={() => setMenu("sk")}>LUTAR</button><button disabled={pend} className={m} onClick={() => setMenu("it")}>ITEM</button>
            <button disabled={!p.summons.length} className={m} onClick={() => setMenu("sm")}>INVOCAR</button><button disabled={pend} className={m} onClick={() => act({ a: "flee" })}>FUGIR</button>{p.dom && <button disabled={pend || !p.dom.ok} className={m + " col-span-2 !bg-amber-200"} onClick={() => act({ a: "domain" })}>🌀 {p.dom.n} ({p.dom.need} EA)</button>}</>
        : menu === "sk" ? <>{p.skills.map((s, i) => <button key={i} disabled={p.mp < s.c || p.lv < s.lv} className={m} onClick={() => { setSk(i); setMenu("tm"); }}><SafeImg src={`/skills/${p.cls}-${i + 1}.png`} className="mr-1 inline h-5 w-5" />{s.n} ({s.c}EA{lock(s)})</button>)}<button className={m} onClick={() => setMenu("main")}>← VOLTAR</button></>
        : menu === "it" ? <>{([["hp", "Poção de HP"], ["ea", "Poção de EA"]] as const).map(([k, n]) => <button key={k} disabled={pend || !p.pots[k]} className={m} onClick={() => act({ a: "potion", k })}>{n} ×{p.pots[k]}</button>)}<button className={m} onClick={() => setMenu("main")}>← VOLTAR</button></>
        : menu === "sm" ? <>{p.summons.map((s, i) => <button key={i} disabled={pend || p.mp < s.c || p.lv < s.lv} className={m} onClick={() => act({ a: "summon", i })}>{s.n} ({s.c}EA{lock(s)})</button>)}<button className={m} onClick={() => setMenu("main")}>← VOLTAR</button></>
        : <div className="col-span-2"><div className="text-xs text-slate-300">Acerte a faixa dourada!</div><div className="relative my-3 h-6 rounded border border-slate-500 bg-slate-900"><div className="absolute inset-y-0 left-[30%] w-[40%] bg-emerald-400/25" /><div className="absolute inset-y-0 left-[43%] w-[14%] bg-amber-400" /><div ref={mk} className="absolute -top-1 h-8 w-1.5 rounded bg-white" /></div><button disabled={pend} className={m + " w-full text-center"} onClick={hit}>⚡ AGORA!</button></div>}
      </div></div></main>;
}
