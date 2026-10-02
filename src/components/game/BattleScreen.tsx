"use client";
import { useEffect, useRef, useState, useTransition } from "react"; import { useRouter } from "next/navigation"; import { battleAct } from "@/actions/battle"; import type { BState } from "@/lib/game/battle";
type P = { name: string; hp: number; mhp: number; mp: number; mmp: number; skills: { n: string; c: number }[]; summons: { n: string; c: number }[]; cost: number };
const Bar = ({ v, m, c }: { v: number; m: number; c: string }) => <div className="my-1 h-2 rounded bg-[#0c0a1f]"><div className={`h-2 rounded ${c}`} style={{ width: `${Math.max(0, Math.min(100, (v / m) * 100))}%` }} /></div>;
export default function BattleScreen({ b, p }: { b: BState; p: P }) {
  const r = useRouter(); const [pend, go] = useTransition(); const [menu, setMenu] = useState<"main" | "sk" | "sm" | "tm">("main"); const [sk, setSk] = useState(0);
  const mk = useRef<HTMLDivElement>(null), pos = useRef(0);
  const act = (a: Parameters<typeof battleAct>[0]) => go(async () => { await battleAct(a); setMenu("main"); if (a.a === "end") r.push("/play"); else r.refresh(); });
  useEffect(() => { if (menu !== "tm") return; let x = 0, d = 1, id = 0;
    const f = () => { x += d * 0.017; if (x >= 1) { x = 1; d = -1 } if (x <= 0) { x = 0; d = 1 } pos.current = x; if (mk.current) mk.current.style.left = `calc(${x * 100}% - 3px)`; id = requestAnimationFrame(f); };
    f(); return () => cancelAnimationFrame(id); }, [menu]);
  const hit = () => { const d = Math.abs(pos.current - .5); act({ a: "skill", i: sk, m: d < .07 ? 2 : d < .2 ? 1.4 : 1 }); };
  const btn = "rounded bg-violet-600 px-3 py-2 font-semibold disabled:opacity-30", g = "rounded border border-violet-800 px-3 py-2 disabled:opacity-30";
  return <main className="mx-auto max-w-md space-y-3 p-4">
    <section className="rounded-lg border border-violet-900 bg-[#171433] p-3"><b>{b.e.n}</b> <span className="text-violet-300">Nv. {b.e.L}{b.dungeon ? ` · Onda ${b.wave}/${b.wave + b.q.length}` : ""}</span>
      <Bar v={b.e.hp} m={b.e.mx} c="bg-rose-500" />{b.sv && <div className="text-sm text-violet-300">👻 {b.sv.n} ({b.sv.t} turnos)</div>}</section>
    <section className="rounded-lg border border-violet-900 bg-[#171433] p-3"><b>{p.name}</b> HP {p.hp}/{p.mhp}<Bar v={p.hp} m={p.mhp} c="bg-emerald-400" />MP {p.mp}/{p.mmp}<Bar v={p.mp} m={p.mmp} c="bg-cyan-400" /></section>
    <section className="min-h-28 rounded-lg border border-violet-900 bg-[#171433] p-3 text-sm">{b.log.map((l, i) => <div key={i}>{l}</div>)}{b.res.map((l, i) => <div key={"r" + i} className="text-amber-300">{l}</div>)}</section>
    <section className="flex flex-wrap gap-2">
      {b.over === "wave" ? <button disabled={pend} className={btn} onClick={() => act({ a: "next" })}>Próxima onda</button>
      : b.over ? <button disabled={pend} className={btn} onClick={() => act({ a: "end" })}>Continuar</button>
      : menu === "main" ? <><button className={btn} onClick={() => setMenu("sk")}>⚔️ Atacar</button><button disabled={pend} className={g} onClick={() => act({ a: "potion" })}>🧪 Item ({p.cost}g)</button>
          <button disabled={!p.summons.length} className={g} onClick={() => setMenu("sm")}>👻 Invocar</button><button disabled={pend} className={g} onClick={() => act({ a: "flee" })}>🏃 Fugir</button></>
      : menu === "sk" ? <>{p.skills.map((s, i) => <button key={i} disabled={p.mp < s.c} className={btn} onClick={() => { setSk(i); setMenu("tm"); }}>{s.n} ({s.c} MP)</button>)}<button className={g} onClick={() => setMenu("main")}>Voltar</button></>
      : menu === "sm" ? <>{p.summons.map((s, i) => <button key={i} disabled={pend || p.mp < s.c} className={btn} onClick={() => act({ a: "summon", i })}>{s.n} ({s.c} MP)</button>)}<button className={g} onClick={() => setMenu("main")}>Voltar</button></>
      : <div className="w-full"><div className="text-sm text-violet-300">Acerte a faixa dourada!</div>
          <div className="relative my-3 h-6 rounded border border-violet-900 bg-[#0c0a1f]"><div className="absolute inset-y-0 left-[30%] w-[40%] bg-emerald-400/25" /><div className="absolute inset-y-0 left-[43%] w-[14%] bg-amber-400" /><div ref={mk} className="absolute -top-1 h-8 w-1.5 rounded bg-white" /></div>
          <button disabled={pend} className={btn + " w-full"} onClick={hit}>⚡ AGORA!</button></div>}
    </section></main>;
}
