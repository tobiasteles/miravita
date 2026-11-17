"use client";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Color } from "three";
import type { StageBus, StageEvent, Who } from "../bus";
import { fxColor } from "../colors";
import { useStage, type ActorRef } from "./context";

// Recebe eventos do servidor (via bus) e vira animações curtas (tweens) sobre os atores. Só desenha: nunca decide nada.
type Tw = { t: number; dur: number; step: (p: number) => void; done?: () => void };
const ease = (p: number) => 1 - (1 - p) ** 3;
const bell = (p: number) => Math.sin(Math.PI * p);
const back = (p: number) => 1 + 2.70158 * (p - 1) ** 3 + 1.70158 * (p - 1) ** 2;

export function Director({ bus }: { bus: StageBus }) {
  const st = useStage();
  const tws = useRef<Tw[]>([]);
  const dirty = useRef(false);

  useEffect(() => {
    const list = tws.current;
    const add = (delay: number, dur: number, step: (p: number) => void, done?: () => void) =>
      list.push({ t: -delay, dur: Math.max(dur, 0.001), step, done });
    const at = (delay: number, fn: () => void) => add(delay, 0.001, () => {}, fn);
    const act = (w: Who) => st.actors.get(w);
    // o ator pode montar um pouco depois do evento (a cena 3D renderiza em outro ciclo): tenta de novo por ~0,5 s
    const later = (w: Who, fn: (a: ActorRef) => void, tries = 10) => {
      const a = act(w);
      if (a) fn(a);
      else if (tries > 0) setTimeout(() => later(w, fn, tries - 1), 50);
    };
    const mid = (a: ActorRef) => ({ x: a.g.position.x, y: a.home.y + a.h * 0.5, z: a.home.z + 0.3 });
    const flash = (a: ActorRef, c: Color, delay: number, dur: number) =>
      add(delay, dur, (p) => { const f = 1 - p; a.off.fr += (c.r * 0.8 + 0.4) * f; a.off.fg += (c.g * 0.8 + 0.4) * f; a.off.fb += (c.b * 0.8 + 0.4) * f; });

    const strike = (e: Extract<StageEvent, { k: "hit" | "crit" | "dodge" }>) => {
      const A = act(e.from), T = act(e.to), crit = e.k === "crit", miss = e.k === "dodge";
      const hex = fxColor("el" in e ? e.el : undefined), col = new Color(hex);
      if (A && T) {
        const reach = (T.home.x - A.home.x) * 0.45; // avanço do atacante em direção ao alvo e volta
        add(0, 0.4, (p) => { const f = p < 0.35 ? ease(p / 0.35) : 1 - ease((p - 0.35) / 0.65); A.off.x += reach * f; A.off.sx *= 1 + 0.06 * f; });
      }
      if (!T) return;
      const dir = A ? Math.sign(T.home.x - A.home.x) || 1 : 1, lag = 0.14;
      if (miss) {
        add(lag, 0.5, (p) => { const f = bell(p); T.off.x += dir * 0.9 * f; T.off.y += 0.12 * f; T.off.op *= 1 - 0.5 * f; });
        return;
      }
      add(lag, crit ? 0.55 : 0.38, (p) => { const f = (1 - p) ** 2; T.off.x += dir * (crit ? 0.9 : 0.45) * f; T.off.sy *= 1 - (crit ? 0.16 : 0.08) * f; T.off.sx *= 1 + (crit ? 0.1 : 0.05) * f; });
      flash(T, crit ? col : new Color("#ffffff"), lag, crit ? 0.3 : 0.18);
      at(lag, () => {
        const m = mid(T);
        st.fx.burst({ ...m, color: hex, n: crit ? 36 : 14, speed: crit ? 3.2 : 2.2, life: 0.6, gravity: 3 });
        if (crit) st.fx.burst({ ...m, color: "#ffffff", n: 10, speed: 4, life: 0.35, gravity: 0 });
        st.shake.amp = Math.max(st.shake.amp, crit ? 0.35 : 0.12);
      });
    };

    const handle = (e: StageEvent) => {
      switch (e.k) {
        case "hit": case "crit": case "dodge": strike(e); break;
        case "heal": {
          const T = act(e.to);
          if (!T) break;
          add(0, 0.6, (p) => { const f = bell(p); T.off.sx *= 1 + 0.04 * f; T.off.sy *= 1 + 0.04 * f; T.off.fg += 0.5 * f; T.off.fr += 0.15 * f; T.off.fb += 0.2 * f; });
          at(0, () => st.fx.burst({ x: T.g.position.x, y: T.home.y + T.h * 0.2, z: T.home.z + 0.3, color: "#34d399", n: 22, mode: "rise", speed: 1.6, life: 0.9, gravity: -0.5, spread: T.w * 0.35 }));
          break;
        }
        case "skill": {
          const A = act(e.from);
          if (!A) break;
          const hex = fxColor(e.el, "#a78bfa"), c = new Color(hex);
          add(0, 0.5, (p) => { const f = bell(p); A.off.sx *= 1 + 0.1 * f; A.off.sy *= 1 + 0.1 * f; A.off.fr += c.r * 0.6 * f; A.off.fg += c.g * 0.6 * f; A.off.fb += c.b * 0.6 * f; });
          at(0.1, () => st.fx.burst({ ...mid(A), color: hex, n: 28, mode: "ring", speed: 2.6, life: 0.6, gravity: 0 }));
          break;
        }
        case "summon":
          later("summon", (S) => {
            add(0, 0.5, (p) => { const s = back(p); S.off.sx *= s; S.off.sy *= s; S.off.op *= Math.min(1, p * 3); });
            at(0, () => st.fx.burst({ ...mid(S), color: fxColor(e.el, "#67e8f9"), n: 26, mode: "ring", speed: 2.2, life: 0.6, gravity: 0 }));
          });
          break;
        case "win": {
          const F = act("foe"), M = act("me");
          if (F) {
            add(0.1, 0.9, (p) => { const f = ease(p); F.off.op *= 1 - f; F.off.y += 0.5 * f; F.off.sx *= 1 - 0.2 * f; F.off.sy *= 1 - 0.2 * f; }, () => { F.hold.op = 0; });
            at(0.1, () => st.fx.burst({ ...mid(F), color: "#fbbf24", n: 44, speed: 3, life: 0.9, gravity: 2.5 }));
          }
          if (M) add(0.2, 0.7, (p) => { M.off.y += Math.abs(Math.sin(p * Math.PI * 2)) * 0.5 * (1 - p); });
          break;
        }
        case "lose": {
          const M = act("me");
          if (!M) break;
          add(0, 0.8, (p) => { const f = ease(p); M.off.y -= 0.35 * f; M.off.rot += 0.5 * f; M.off.op *= 1 - 0.65 * f; M.off.fr += 0.5 * (1 - p); }, () => { M.hold = { op: 0.35, y: -0.35, rot: 0.5 }; });
          at(0, () => { st.shake.amp = Math.max(st.shake.amp, 0.3); st.fx.burst({ ...mid(M), color: "#f43f5e", n: 24, speed: 2, life: 0.8, gravity: 2 }); });
          break;
        }
        case "pulse": {
          const [px, py, pz] = st.at(e.x, e.y, 0.4);
          st.fx.burst({ x: px, y: py, z: pz, color: fxColor(e.el, "#a78bfa"), n: 24, mode: "ring", speed: 2.6, life: 0.6, gravity: 0 });
          break;
        }
        case "flee": {
          const M = act("me");
          if (!M) break;
          const dx = st.vis(M.home.z).w * 0.3;
          add(0, 0.7, (p) => { const f = ease(p); M.off.x -= dx * f; M.off.op *= 1 - f; }, () => { M.hold.op = 0; });
          break;
        }
      }
      dirty.current = true;
      st.invalidate();
    };
    const off = bus.on(handle);
    return () => { off(); list.length = 0; };
  }, [bus, st]);

  useFrame((_, dtRaw) => {
    const list = tws.current;
    if (!list.length && !dirty.current) { st.busy.n = 0; return; }
    const dt = Math.min(dtRaw, 0.05);
    st.actors.forEach((a) => { const o = a.off; o.x = o.y = o.rot = o.fr = o.fg = o.fb = 0; o.sx = o.sy = o.op = 1; });
    for (let i = list.length - 1; i >= 0; i--) {
      const w = list[i];
      w.t += dt;
      if (w.t < 0) continue;
      const p = Math.min(1, w.t / w.dur);
      w.step(p);
      if (p >= 1) { w.done?.(); list.splice(i, 1); }
    }
    st.actors.forEach((a) => {
      const o = a.off;
      a.g.position.set(a.home.x + o.x, a.home.y + o.y + a.hold.y, a.home.z);
      a.g.scale.set(o.sx, o.sy, 1);
      a.g.rotation.z = o.rot + a.hold.rot;
      a.m.opacity = o.op * a.hold.op;
      a.m.color.setRGB(1 + o.fr, 1 + o.fg, 1 + o.fb);
    });
    dirty.current = list.length > 0;
    st.busy.n = list.length;
    if (list.length) st.invalidate();
  });
  return null;
}
