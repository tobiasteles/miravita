"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { StageBus } from "../bus";
import { StageCtx, useStage, type ActorRef, type Stage } from "./context";
import { Director } from "./director";
import { Particles } from "./particles";

// Núcleo 3D compartilhado por /battle e /play. Câmera em perspectiva (altura visível = 10 unidades em z=0);
// filhos são camadas (Backdrop, Actor, Tint...). Tudo aqui é VISUAL: nenhuma regra do jogo passa por este componente.
const FOV = 30, TAN = Math.tan((FOV * Math.PI) / 360), D = 5 / TAN;

export type GameStageProps = {
  bus: StageBus;
  animate?: boolean; // leve movimento de câmera/respiração (a cena pede quadros a ~30 fps); false = só redesenha quando algo acontece
  sky?: string;
  interactive?: boolean; // false (padrão): o canvas não captura o mouse, então botões do DOM por cima continuam clicáveis
  onSlow?: () => void; // fps baixo por alguns segundos ou contexto WebGL perdido → o chamador volta ao 2D
  children: React.ReactNode;
};

function Rig({ animate, onSlow }: { animate: boolean; onSlow?: () => void }) {
  const st = useStage();
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const ptr = useRef({ x: 0, y: 0 }), cur = useRef({ x: 0, y: 0 }), clock = useRef(0), timer = useRef(0);
  const g = useRef({ n: 0, sum: 0, bad: 0, fired: false });
  const slow = useRef(onSlow);
  useEffect(() => { slow.current = onSlow; });

  useEffect(() => {
    const mv = (e: PointerEvent) => { ptr.current.x = (e.clientX / innerWidth - 0.5) * 2; ptr.current.y = (e.clientY / innerHeight - 0.5) * 2; };
    const vis = () => { if (!document.hidden) st.invalidate(); };
    const lost = (e: Event) => { e.preventDefault(); slow.current?.(); };
    addEventListener("pointermove", mv, { passive: true });
    document.addEventListener("visibilitychange", vis);
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => {
      removeEventListener("pointermove", mv);
      document.removeEventListener("visibilitychange", vis);
      gl.domElement.removeEventListener("webglcontextlost", lost);
      clearTimeout(timer.current);
    };
  }, [st, gl]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.1);
    clock.current += dt;
    const tx = animate ? Math.sin(clock.current * 0.35) * 0.18 + ptr.current.x * 0.35 : 0;
    const ty = animate ? Math.sin(clock.current * 0.27 + 1) * 0.08 - ptr.current.y * 0.18 : 0;
    const k = Math.min(1, dt * 3);
    cur.current.x += (tx - cur.current.x) * k;
    cur.current.y += (ty - cur.current.y) * k;
    let sx = 0, sy = 0;
    if (st.shake.amp > 0.002) {
      sx = (Math.random() - 0.5) * 2 * st.shake.amp;
      sy = (Math.random() - 0.5) * 2 * st.shake.amp;
      st.shake.amp *= Math.exp(-dt * 9);
    } else st.shake.amp = 0;
    camera.position.x = cur.current.x + sx;
    camera.position.y = cur.current.y + sy;

    // vigia de desempenho: ignora pausas (quadros sem animação) e só julga depois de 3 s de cena
    const f = g.current;
    if (dtRaw > 0 && dtRaw < 0.2) {
      f.n++; f.sum += dtRaw;
      if (f.n >= 45) {
        const fps = f.n / f.sum;
        if (clock.current > 3) f.bad = fps < 20 ? f.bad + 1 : 0;
        if (f.bad >= 3 && !f.fired) { f.fired = true; slow.current?.(); }
        f.n = 0; f.sum = 0;
      }
    } else { f.n = 0; f.sum = 0; }

    // modo "demand": quadro cheio só enquanto algo anima; parado, no máximo ~30 fps (e nada com a aba escondida ou fora da tela)
    if (st.busy.n > 0 || st.shake.amp > 0) st.invalidate();
    else if (animate && st.visible.v && !document.hidden && !timer.current) {
      timer.current = window.setTimeout(() => { timer.current = 0; st.invalidate(); }, 33);
    }
  });
  return null;
}

function Scene({ bus, animate, onSlow, visible, children }: { bus: StageBus; animate: boolean; onSlow?: () => void; visible: { v: boolean }; children: React.ReactNode }) {
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const [actors] = useState(() => new Map<string, ActorRef>());
  const [shake] = useState(() => ({ amp: 0 }));
  const [busy] = useState(() => ({ n: 0 }));
  const [fx] = useState<Stage["fx"]>(() => ({ burst: () => {} }));
  const stage = useMemo<Stage>(() => {
    const aspect = size.width / Math.max(1, size.height);
    const vis = (z = 0) => { const h = 2 * (D - z) * TAN; return { w: h * aspect, h }; };
    const at = (x: number, y: number, z = 0): [number, number, number] => { const v = vis(z); return [(x / 100 - 0.5) * v.w, (0.5 - y / 100) * v.h, z]; };
    return { at, vis, actors, shake, busy, visible, fx, invalidate };
  }, [size.width, size.height, actors, shake, busy, visible, fx, invalidate]);
  return (
    <StageCtx.Provider value={stage}>
      <Rig animate={animate} onSlow={onSlow} />
      <Director bus={bus} />
      {children}
      <Particles />
    </StageCtx.Provider>
  );
}

export default function GameStage({ bus, animate = true, sky = "#0c0a1f", interactive = false, onSlow, children }: GameStageProps) {
  const box = useRef<HTMLDivElement>(null);
  const [visible] = useState(() => ({ v: true }));
  useEffect(() => { // fora da tela: para de pedir quadros
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([x]) => { visible.v = x.isIntersecting; });
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);
  return (
    <div ref={box} aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: interactive ? "auto" : "none" }}>
      <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ fov: FOV, position: [0, 0, D], near: 1, far: 80 }} gl={{ antialias: false, powerPreference: "low-power", alpha: false }}>
        <color attach="background" args={[sky]} />
        <Scene bus={bus} animate={animate} onSlow={onSlow} visible={visible}>{children}</Scene>
      </Canvas>
    </div>
  );
}
