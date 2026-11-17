"use client";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { Euler, MathUtils, Object3D, Vector3 } from "three";
import type { Group, InstancedMesh, Mesh } from "three";
import { sfx } from "@/lib/sfx";

// Átomo em 3D (só visual). Sem modelos, sem texturas, sem luzes: esferas e anéis com material básico.
export type Phase = "up" | "hold" | "down";
export type SceneProps = {
  z: number; shells: number[]; color: string; shell: number | null; onShell: (i: number | null) => void;
  speed: number; animate: boolean; exciteKey: number; resetKey: number; onPhase: (p: Phase | null) => void;
};

const R = (k: number) => 1.1 + 0.62 * k;
const TILT: ReadonlyArray<readonly [number, number]> = [[0, 0], [1.1, 0.3], [0.6, 1.2], [1.4, 0.9], [0.3, 1.5], [0.9, 0.5], [1.2, 1.3]];
const OMEGA = (k: number) => 1.6 / (1 + k * 0.5);
const UP = 1, HOLD = 0.9, DOWN = 0.9, PHOTON = 1.4;
const ease = (x: number) => x * x * (3 - 2 * x);

type Ex = { t: number; k: number; phase: Phase | null; start: Vector3 | null; dir: Vector3 | null };

function Atom({ z, shells, color, shell, onShell, speed, animate, exciteKey, onPhase }: Omit<SceneProps, "resetKey">) {
  const invalidate = useThree((s) => s.invalidate);
  const [hover, setHover] = useState<number | null>(null);
  const inst = useRef<(InstancedMesh | null)[]>([]);
  const exMesh = useRef<Mesh>(null), ph = useRef<Mesh>(null);
  const t = useRef(0), ex = useRef<Ex | null>(null);
  const cb = useRef(onPhase);
  const tmp = useMemo(() => ({ o: new Object3D(), v: new Vector3(), e: new Euler() }), []);
  useEffect(() => { cb.current = onPhase; });

  useEffect(() => {
    if (exciteKey === 0) return;
    const k = shell ?? shells.length - 1;
    if (k < 0 || k >= 6) return; // precisa existir uma camada acima para o elétron saltar
    ex.current = { t: 0, k, phase: null, start: null, dir: null };
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exciteKey]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    if (animate) t.current += dt * speed;
    const e = ex.current;
    shells.forEach((n, k) => {
      const m = inst.current[k];
      if (!m) return;
      for (let j = 0; j < n; j++) {
        if (j === 0 && e && e.k === k) tmp.o.scale.setScalar(0);
        else tmp.o.scale.setScalar(1);
        const a = t.current * OMEGA(k) + (2 * Math.PI * j) / n + k;
        tmp.o.position.set(R(k) * Math.cos(a), R(k) * Math.sin(a), 0);
        tmp.o.updateMatrix();
        m.setMatrixAt(j, tmp.o.matrix);
      }
      m.instanceMatrix.needsUpdate = true;
    });
    if (e) {
      e.t += dt;
      const k = e.k, r0 = R(k), r1 = R(k + 1), a = t.current * OMEGA(k) + k;
      let rad = r0, phase: Phase | null = null;
      if (e.t < UP) { phase = "up"; rad = r0 + (r1 - r0) * ease(e.t / UP); }
      else if (e.t < UP + HOLD) { phase = "hold"; rad = r1; }
      else if (e.t < UP + HOLD + DOWN) { phase = "down"; rad = r1 + (r0 - r1) * ease((e.t - UP - HOLD) / DOWN); }
      tmp.e.set(TILT[k][0], TILT[k][1], 0);
      tmp.v.set(rad * Math.cos(a), rad * Math.sin(a), 0).applyEuler(tmp.e);
      if (exMesh.current) { exMesh.current.position.copy(tmp.v); exMesh.current.visible = e.t < UP + HOLD + DOWN; }
      if (phase && phase !== e.phase) {
        e.phase = phase;
        cb.current(phase);
        if (phase === "down") { e.start = tmp.v.clone(); e.dir = tmp.v.clone().normalize(); sfx("heal"); }
      }
      if (ph.current) {
        const pr = (e.t - UP - HOLD) / PHOTON;
        if (e.start && e.dir && pr >= 0 && pr < 1) {
          ph.current.position.copy(e.start).addScaledVector(e.dir, pr * 3.4);
          ph.current.scale.setScalar(1 + 0.4 * Math.sin(pr * 18));
          ph.current.visible = true;
        } else ph.current.visible = false;
      }
      if (e.t > UP + HOLD + PHOTON) {
        ex.current = null;
        if (exMesh.current) exMesh.current.visible = false;
        if (ph.current) ph.current.visible = false;
        cb.current(null);
      }
    }
    if (animate || ex.current) invalidate(); // modo "demand": só pede novo quadro enquanto algo se move
  });

  const nr = 0.16 + Math.cbrt(z) * 0.05;
  return (
    <>
      <mesh><sphereGeometry args={[nr, 24, 24]} /><meshBasicMaterial color={color} /></mesh>
      <mesh><sphereGeometry args={[nr * 1.9, 24, 24]} /><meshBasicMaterial color={color} transparent opacity={0.14} depthWrite={false} /></mesh>
      {shells.map((n, k) => {
        const on = shell === k, hot = on || hover === k;
        return (
          <group key={`${z}-${k}`} rotation={[TILT[k][0], TILT[k][1], 0]}>
            <mesh>
              <torusGeometry args={[R(k), hot ? 0.03 : 0.012, 8, 96]} />
              <meshBasicMaterial color={on ? "#fbbf24" : hover === k ? "#22d3ee" : "#8b5cf6"} transparent opacity={hot ? 0.95 : 0.45} />
            </mesh>
            <mesh
              onClick={(ev: ThreeEvent<MouseEvent>) => { ev.stopPropagation(); if (ev.delta < 6) { onShell(on ? null : k); sfx("tick"); } }}
              onPointerOver={(ev) => { ev.stopPropagation(); setHover(k); }}
              onPointerOut={() => setHover((h) => (h === k ? null : h))}
            >
              <torusGeometry args={[R(k), 0.14, 6, 48]} />
              <meshBasicMaterial visible={false} />
            </mesh>
            <instancedMesh ref={(m) => { inst.current[k] = m; }} args={[undefined, undefined, n]} frustumCulled={false}>
              <sphereGeometry args={[0.075, 12, 12]} />
              <meshBasicMaterial color={on ? "#fde68a" : "#e8e6ff"} />
            </instancedMesh>
          </group>
        );
      })}
      <mesh ref={exMesh} visible={false}><sphereGeometry args={[0.1, 12, 12]} /><meshBasicMaterial color="#fbbf24" /></mesh>
      <mesh ref={ph} visible={false}><sphereGeometry args={[0.09, 12, 12]} /><meshBasicMaterial color="#67e8f9" /></mesh>
    </>
  );
}

// Controle de vista próprio (arrastar, inércia, roda e pinça), no lugar do OrbitControls do drei: menos peso.
function Rig({ children, fitZ, resetKey }: { children: React.ReactNode; fitZ: number; resetKey: number }) {
  const g = useRef<Group>(null);
  const spin = useRef({ x: 0, y: 0, drag: false });
  const { gl, camera, invalidate } = useThree();

  useEffect(() => { camera.position.z = fitZ; invalidate(); }, [fitZ, resetKey, camera, invalidate]);
  useEffect(() => {
    if (resetKey && g.current) { g.current.rotation.set(0.35, 0.5, 0); spin.current.x = spin.current.y = 0; invalidate(); }
  }, [resetKey, invalidate]);

  useEffect(() => {
    const el = gl.domElement, ptrs = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    const zoom = (f: number) => { camera.position.z = MathUtils.clamp(camera.position.z * f, 3.5, 24); invalidate(); };
    const down = (e: PointerEvent) => {
      el.setPointerCapture(e.pointerId);
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      spin.current.drag = true; spin.current.x = spin.current.y = 0; pinch = 0;
    };
    const move = (e: PointerEvent) => {
      const p = ptrs.get(e.pointerId);
      if (!p || !g.current) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (ptrs.size === 1) {
        g.current.rotation.y += dx * 0.008;
        g.current.rotation.x = MathUtils.clamp(g.current.rotation.x + dy * 0.008, -1.4, 1.4);
        spin.current.y = dx * 0.004; spin.current.x = dy * 0.004;
        invalidate();
      } else if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch) zoom(pinch / d);
        pinch = d;
      }
    };
    const up = (e: PointerEvent) => {
      ptrs.delete(e.pointerId);
      pinch = 0;
      if (ptrs.size === 0) { spin.current.drag = false; invalidate(); }
    };
    const wheel = (e: WheelEvent) => { e.preventDefault(); zoom(1 + e.deltaY * 0.001); };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
    };
  }, [gl, camera, invalidate]);

  useFrame(() => {
    const s = spin.current;
    if (s.drag || !g.current || Math.abs(s.x) + Math.abs(s.y) < 1e-4) return;
    g.current.rotation.y += s.y;
    g.current.rotation.x = MathUtils.clamp(g.current.rotation.x + s.x, -1.4, 1.4);
    s.x *= 0.92; s.y *= 0.92;
    invalidate();
  });
  return <group ref={g} rotation={[0.35, 0.5, 0]}>{children}</group>;
}

export default function AtomScene(p: SceneProps) {
  const box = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(true);
  useEffect(() => { // fora da tela, para de animar
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([x]) => setVis(x.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const fitZ = Math.max(6, R(p.shells.length) * 2.1 + 1.5);
  return (
    <div ref={box} className="h-full w-full" style={{ touchAction: "none" }}>
      <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ position: [0, 0, fitZ], fov: 45 }} gl={{ antialias: true, powerPreference: "low-power" }}>
        <Rig fitZ={fitZ} resetKey={p.resetKey}>
          <Atom z={p.z} shells={p.shells} color={p.color} shell={p.shell} onShell={p.onShell} speed={p.speed} animate={p.animate && vis} exciteKey={p.exciteKey} onPhase={p.onPhase} />
        </Rig>
      </Canvas>
    </div>
  );
}
