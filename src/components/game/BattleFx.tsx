"use client";
import { useEffect, useRef, useState } from "react";
import { fxLevel } from "@/lib/fx";
import { sfx } from "@/lib/sfx";

// Camada VISUAL do combate. Não decide nada: só compara o que o servidor já mandou (HP antes × depois) e anima a diferença.
type Pop = { id: number; txt: string; cls: string; x: string; y: string };
type Props = { enemyKey: string; enemyHp: number; playerHp: number; log: string[]; minimal?: boolean }; // minimal: a cena 3D cuida de partículas, flash e tremor
const CRIT = /RUPTURA|PERFEITO/;
const FOE_POS = { x: "78%", y: "30%", fx: 0.78, fy: 0.3 }; // ajuste aqui se mudar a posição dos sprites
const ME_POS = { x: "22%", y: "58%" };

export default function BattleFx({ enemyKey, enemyHp, playerHp, log, minimal = false }: Props) {
  const [pops, setPops] = useState<Pop[]>([]);
  const [flash, setFlash] = useState<{ n: number; c: string }>({ n: 0, c: "" });
  const prev = useRef<{ key: string; e: number; p: number; log: string[] } | null>(null);
  const seq = useRef(0), raf = useRef(0), timers = useRef<number[]>([]);
  const root = useRef<HTMLDivElement>(null), cv = useRef<HTMLCanvasElement>(null);

  const burst = (fx: number, fy: number, color: string, n: number) => {
    const c = cv.current, g = c?.getContext("2d");
    if (!c || !g) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5), w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const ps = Array.from({ length: n }, () => ({ x: fx * w, y: fy * h, vx: (Math.random() - 0.5) * 280, vy: -Math.random() * 240 - 40, t: 0, life: 0.45 + Math.random() * 0.3 }));
    cancelAnimationFrame(raf.current);
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      g.clearRect(0, 0, w, h);
      let alive = 0;
      for (const p of ps) {
        p.t += dt;
        if (p.t >= p.life) continue;
        alive++;
        p.vy += 520 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        g.globalAlpha = 1 - p.t / p.life;
        g.fillStyle = color;
        g.fillRect(p.x, p.y, 3, 3);
      }
      if (alive) raf.current = requestAnimationFrame(step);
      else g.clearRect(0, 0, w, h);
    };
    raf.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    const was = prev.current;
    prev.current = { key: enemyKey, e: enemyHp, p: playerHp, log };
    if (!was) return;
    const lvl = fxLevel();
    const seen = new Set(was.log);
    const added = log.filter((l) => !seen.has(l));
    const myCrit = added.some((l) => CRIT.test(l) && !l.includes(" usa "));
    const foeCrit = added.some((l) => CRIT.test(l) && l.includes(" usa "));
    const dE = was.key === enemyKey ? was.e - enemyHp : 0, dP = was.p - playerHp;
    const pop = (txt: string, cls: string, at: { x: string; y: string }) => {
      const id = ++seq.current;
      setPops((l) => [...l.slice(-5), { id, txt, cls, ...at }]);
      timers.current.push(window.setTimeout(() => setPops((l) => l.filter((x) => x.id !== id)), 1100));
    };
    const shake = (big: boolean) => {
      const el = root.current?.parentElement;
      if (!el || lvl !== "high" || minimal) return;
      el.classList.remove("fx-shake", "fx-shake-big");
      void el.offsetWidth; // reinicia a animação
      el.classList.add(big ? "fx-shake-big" : "fx-shake");
      timers.current.push(window.setTimeout(() => el.classList.remove("fx-shake", "fx-shake-big"), 450));
    };
    if (dE > 0) {
      pop(`-${dE}`, myCrit ? "fx-crit" : "fx-dmg", FOE_POS);
      sfx(myCrit ? "crit" : "hit");
      if (lvl === "high" && !minimal) {
        burst(FOE_POS.fx, FOE_POS.fy, myCrit ? "#fbbf24" : "#e8e6ff", myCrit ? 26 : 12);
        if (myCrit) setFlash((f) => ({ n: f.n + 1, c: "bg-ember/50" }));
      }
    }
    if (dP > 0) {
      pop(`-${dP}`, "fx-hurt", ME_POS);
      sfx("hurt");
      shake(foeCrit);
      if (foeCrit && lvl === "high" && !minimal) setFlash((f) => ({ n: f.n + 1, c: "bg-blood/40" }));
    } else if (dP < 0) {
      pop(`+${-dP}`, "fx-heal", ME_POS);
      sfx("heal");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enemyKey, enemyHp, playerHp, log]);

  useEffect(() => () => {
    cancelAnimationFrame(raf.current);
    timers.current.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <div ref={root} aria-hidden className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <canvas ref={cv} className="absolute inset-0 h-full w-full" />
      {flash.n > 0 && <div key={flash.n} className={`fx-flash ${flash.c}`} />}
      {pops.map((p) => (
        <span key={p.id} className={`fx-pop ${p.cls}`} style={{ left: p.x, top: p.y }}>{p.txt}</span>
      ))}
    </div>
  );
}
