"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ELEMENTS } from "@/lib/game/elements";
import { configText, shells as shellsOf, SHELL_NAMES, tablePos } from "@/lib/game/periodic";
import { fxLevel } from "@/lib/fx";
import { sfx } from "@/lib/sfx";
import { Badge, Button, Card } from "@/components/ui";
import Atom2D from "./Atom2D";
import { CAT_COLOR, CATS, RARITY } from "./palette";
import type { Phase } from "./AtomScene";

const AtomScene = dynamic(() => import("./AtomScene"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-ink-dim">Carregando o átomo…</div>,
});

type Info = Record<number, { r: string; q: number }>;
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const CAPTION: Record<Phase, string> = {
  up: "Absorve um fóton (E = h·f) e salta para uma camada mais externa.",
  hold: "Estado excitado: instável, dura só frações de segundo.",
  down: "Volta à camada de origem e emite um fóton com a mesma energia.",
};
function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    const g = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    g?.getExtension("WEBGL_lose_context")?.loseContext();
    return !!g;
  } catch {
    return false;
  }
}
const fmtPpm = (n: number) => (n >= 1 ? n.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : n.toExponential(1).replace(".", ","));

export default function CodexClient({ info }: { info: Info }) {
  const [sel, setSel] = useState(26);
  const [shell, setShell] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [mine, setMine] = useState(false);
  const [mode, setMode] = useState<"pending" | "3d" | "2d">("pending");
  const [webgl, setWebgl] = useState(false);
  const [still, setStill] = useState(false); // movimento reduzido: o átomo não gira sozinho
  const [speed, setSpeed] = useState(1);
  const [exciteKey, setExciteKey] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [phase, setPhase] = useState<Phase | null>(null);
  const panel = useRef<HTMLDivElement>(null), search = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const lvl = fxLevel();
    const ok = hasWebGL();
    setStill(lvl === "off");
    setWebgl(ok);
    setMode(lvl === "low" || !ok ? "2d" : "3d");
  }, []);

  const el = ELEMENTS.find((x) => x[0] === sel) ?? ELEMENTS[0];
  const [z, sym, name, mass, mohs, ppm, ecat] = el;
  const color = CAT_COLOR[ecat] ?? "#94a3b8";
  const sh = useMemo(() => shellsOf(z), [z]);
  const cfg = useMemo(() => configText(z), [z]);
  const own = info[z]?.q ?? 0;
  const rar = RARITY[info[z]?.r ?? ""];

  const pick = useCallback((n: number) => {
    setSel(n); setShell(null); setPhase(null); sfx("tick");
    const p = panel.current?.getBoundingClientRect();
    if (p && (p.top < 0 || p.bottom > innerHeight)) panel.current?.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, []);

  const hit = useMemo(() => {
    const t = norm(q.trim());
    return new Set(ELEMENTS.filter((e) => {
      if (cat && e[6] !== cat) return false;
      if (mine && !(info[e[0]]?.q > 0)) return false;
      return !t || norm(e[2]).includes(t) || norm(e[1]) === t || String(e[0]) === t;
    }).map((e) => e[0]));
  }, [q, cat, mine, info]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); pick(Math.max(1, Math.min(118, sel + (e.key === "ArrowRight" ? 1 : -1)))); }
      else if (e.key === "Home") { e.preventDefault(); pick(1); }
      else if (e.key === "End") { e.preventDefault(); pick(118); }
      else if (e.key === "/") { e.preventDefault(); search.current?.focus(); }
    };
    addEventListener("keydown", h);
    return () => removeEventListener("keydown", h);
  }, [sel, pick]);

  const scene = mode === "3d";
  return (
    <main className="mx-auto max-w-6xl space-y-4 p-3">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Códex dos Elementos</h1>
          <p className="text-sm text-ink-dim">Toque num elemento para ver o átomo. Setas ← → trocam de elemento, / busca.</p>
        </div>
        <label className="flex flex-col text-xs text-ink-dim">
          Buscar por nome, símbolo ou número
          <input
            ref={search} value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { const f = [...hit].sort((a, b) => a - b)[0]; if (f) pick(f); } }}
            placeholder="ex.: ferro, Fe, 26" className="mt-1 min-h-11 w-64 rounded-chip border border-line bg-bg px-3 text-sm text-ink focus-visible:outline-2 focus-visible:outline-aether"
          />
        </label>
      </header>

      <div ref={panel} className="grid gap-4 md:grid-cols-[1.35fr_1fr]">
        <Card className="space-y-2 !p-3">
          <div className="relative aspect-[4/3] min-h-64 overflow-hidden rounded-panel bg-bg ring-1 ring-line">
            {mode === "pending" ? null : scene ? (
              <AtomScene z={z} shells={sh} color={color} shell={shell} onShell={setShell} speed={speed} animate={!still} exciteKey={exciteKey} resetKey={resetKey} onPhase={setPhase} />
            ) : (
              <Atom2D z={z} shells={sh} color={color} shell={shell} onShell={setShell} />
            )}
            <div className="pointer-events-none absolute left-3 top-2 font-display text-5xl font-extrabold" style={{ color }} aria-hidden>{sym}</div>
          </div>
          <p aria-live="polite" className="min-h-10 text-sm text-ink-dim">
            {phase ? CAPTION[phase] : scene ? "Arraste para girar, role ou pince para aproximar, clique numa camada para destacá-la." : "Visão 2D. Clique numa camada para destacá-la."}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {scene && <Button size="sm" onClick={() => setExciteKey((k) => k + 1)} disabled={phase !== null}>Excitar um elétron</Button>}
            {scene && <Button size="sm" variant="ghost" onClick={() => setResetKey((k) => k + 1)}>Resetar vista</Button>}
            {webgl && (
              <Button size="sm" variant="ghost" onClick={() => setMode(scene ? "2d" : "3d")}>{scene ? "Ver em 2D" : "Ver em 3D"}</Button>
            )}
            {scene && !still && (
              <label className="ml-auto flex items-center gap-2 text-xs text-ink-dim">
                Velocidade
                <input type="range" min={0.2} max={3} step={0.1} value={speed} onChange={(e) => setSpeed(+e.target.value)} className="w-28 accent-arcane" />
              </label>
            )}
          </div>
        </Card>

        <Card className="space-y-3">
          <div>
            <div className="text-xs text-ink-dim">Elemento {z}</div>
            <h2 className="font-display text-2xl font-extrabold" style={{ color }}>{name}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="plain" style={{ borderColor: color + "88", color }}>{ecat}</Badge>
            {rar && <Badge tone={rar.tone}>{rar.label}</Badge>}
            <Badge tone={own > 0 ? "ember" : "plain"}>{own > 0 ? `Você tem ${own.toLocaleString("pt-BR")}` : "Você não tem"}</Badge>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-ink-dim">Massa atômica</dt><dd>{mass.toLocaleString("pt-BR")} u</dd>
            <dt className="text-ink-dim">Dureza (Mohs)</dt><dd>{mohs === null ? "—" : mohs.toLocaleString("pt-BR")}</dd>
            <dt className="text-ink-dim">Abundância na crosta</dt><dd>{fmtPpm(ppm)} ppm</dd>
            <dt className="text-ink-dim">Configuração</dt><dd className="break-words">{cfg}</dd>
          </dl>
          <div>
            <h3 className="mb-1 text-sm font-semibold text-ink-dim">Camadas</h3>
            <div className="flex flex-wrap gap-2">
              {sh.map((n, k) => (
                <button
                  key={k} type="button" aria-pressed={shell === k} onClick={() => { setShell(shell === k ? null : k); sfx("tick"); }}
                  className={`min-h-9 rounded-chip border px-2 text-sm focus-visible:outline-2 focus-visible:outline-aether ${shell === k ? "border-ember bg-ember/15 text-ember" : "border-line text-ink hover:bg-line/40"}`}
                >
                  {SHELL_NAMES[k]} · {n} e⁻
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-ink-dim">Valores aproximados (jogo, não livro de química). As camadas seguem a regra de Madelung e não mostram as exceções reais, como Cr e Cu.</p>
        </Card>
      </div>

      <Card className="space-y-3 !p-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por categoria">
          {CATS.map((c) => (
            <button
              key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(cat === c ? null : c)}
              className={`flex min-h-9 items-center gap-1.5 rounded-full border px-2.5 text-xs focus-visible:outline-2 focus-visible:outline-aether ${cat === c ? "bg-line/60 text-ink" : "text-ink-dim hover:bg-line/30"}`}
              style={{ borderColor: CAT_COLOR[c] + (cat === c ? "ff" : "66") }}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: CAT_COLOR[c] }} aria-hidden />{c}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-1.5 text-xs text-ink-dim">
            <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} /> só os que tenho
          </label>
        </div>
        <div className="overflow-x-auto pb-1">
          <div
            className="grid min-w-[46rem] gap-1"
            style={{ gridTemplateColumns: "repeat(18, minmax(0, 1fr))", gridTemplateRows: "repeat(7, auto) 0.6rem repeat(2, auto)" }}
          >
            {ELEMENTS.map((e) => {
              const [row, col] = tablePos(e[0]);
              const c = CAT_COLOR[e[6]] ?? "#94a3b8", on = e[0] === sel, owned = (info[e[0]]?.q ?? 0) > 0;
              return (
                <button
                  key={e[0]} type="button" onClick={() => pick(e[0])} aria-pressed={on}
                  aria-label={`${e[2]}, número ${e[0]}${owned ? ", você tem" : ""}`}
                  className={`relative flex min-h-11 flex-col items-center justify-center rounded-chip border text-ink transition-opacity focus-visible:outline-2 focus-visible:outline-aether ${on ? "ring-2 ring-ember" : ""} ${hit.has(e[0]) ? "" : "opacity-20"}`}
                  style={{ gridRow: row, gridColumn: col, background: c + "22", borderColor: c + (on ? "ff" : "77") }}
                >
                  <span className="absolute left-1 top-0.5 text-[9px] leading-none text-ink-dim">{e[0]}</span>
                  {owned && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-ember" aria-hidden />}
                  <span className="text-sm font-bold leading-none">{e[1]}</span>
                </button>
              );
            })}
            <div className="grid place-items-center text-[10px] text-ink-dim" style={{ gridRow: 6, gridColumn: 3 }} aria-hidden>57–71</div>
            <div className="grid place-items-center text-[10px] text-ink-dim" style={{ gridRow: 7, gridColumn: 3 }} aria-hidden>89–103</div>
          </div>
        </div>
      </Card>
    </main>
  );
}
