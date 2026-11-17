"use client";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, Color, SRGBColorSpace } from "three";
import type { Mesh, MeshBasicMaterial } from "three";
import type { Spot } from "@/lib/game/town";
import { useStage } from "./context";

// Camadas da cidade (/play). Tudo é desenho: o que o jogador clica continua sendo o DOM.
function canvasTex(draw: (g: CanvasRenderingContext2D) => void, size = 128) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  if (g) draw(g);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}
let softT: CanvasTexture | null = null, ringT: CanvasTexture | null = null;
const soft = () => (softT ??= canvasTex((g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.5, "rgba(255,255,255,.35)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 128, 128); }));
const ring = () => (ringT ??= canvasTex((g) => { const r = g.createRadialGradient(64, 64, 34, 64, 64, 62); r.addColorStop(0, "rgba(255,255,255,0)"); r.addColorStop(0.65, "rgba(255,255,255,.95)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 128, 128); }));

// brilho do prédio: acende quando o mouse/foco está no ponto clicável do DOM; os de ação (caça, portão, arena) pulsam sempre de leve
export function Glow({ s, hot }: { s: Spot; hot: boolean }) {
  const st = useStage();
  const m = useRef<MeshBasicMaterial>(null);
  const base = s.kind === "hunt" || s.kind === "gate" || s.kind === "arena" ? 0.16 : 0;
  useFrame(({ clock }) => {
    if (!m.current) return;
    const target = hot ? 0.6 : base * (0.6 + 0.4 * Math.sin(clock.elapsedTime * 2.2));
    m.current.opacity += (target - m.current.opacity) * 0.2;
    if (Math.abs(target - m.current.opacity) > 0.01) st.invalidate();
  });
  const [x, y, z] = st.at(s.x, s.y, 0.05), v = st.vis(0.05);
  return (
    <mesh position={[x, y, z]} renderOrder={2}>
      <planeGeometry args={[(s.w / 100) * v.w * 1.5, (s.h / 100) * v.h * 1.5]} />
      <meshBasicMaterial ref={m} map={soft()} color={s.glow} transparent opacity={0} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
    </mesh>
  );
}

// portal do Reino: aberto = dois anéis girando em sentidos opostos; fechado = selo escuro
export function Portal({ s, open }: { s: Spot; open: boolean }) {
  const st = useStage();
  const a = useRef<Mesh>(null), b = useRef<Mesh>(null);
  useFrame(({ clock }, dt) => {
    if (!open || !a.current || !b.current) return;
    a.current.rotation.z += dt * 0.6;
    b.current.rotation.z -= dt * 0.9;
    const k = 1 + 0.05 * Math.sin(clock.elapsedTime * 2);
    a.current.scale.setScalar(k);
    b.current.scale.setScalar(2 - k);
  });
  const [x, y, z] = st.at(s.x, s.y, 0.08), v = st.vis(0.08);
  const d = Math.min((s.w / 100) * v.w, (s.h / 100) * v.h) * 1.35;
  if (!open)
    return (
      <mesh position={[x, y, z]} renderOrder={3}>
        <planeGeometry args={[d * 1.3, d * 1.3]} />
        <meshBasicMaterial map={soft()} color="#05030f" transparent opacity={0.4} depthWrite={false} toneMapped={false} />
      </mesh>
    );
  return (
    <>
      <mesh ref={a} position={[x, y, z]} renderOrder={3}>
        <planeGeometry args={[d, d]} />
        <meshBasicMaterial map={ring()} color="#8b5cf6" transparent opacity={0.8} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
      </mesh>
      <mesh ref={b} position={[x, y, z + 0.01]} renderOrder={3}>
        <planeGeometry args={[d * 0.8, d * 0.8]} />
        <meshBasicMaterial map={ring()} color="#22d3ee" transparent opacity={0.7} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
      </mesh>
    </>
  );
}

// anel pulsante sobre um prédio (expedição em andamento ou pronta)
export function Beacon({ x: px, y: py, color }: { x: number; y: number; color: string }) {
  const st = useStage();
  const m = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (!m.current) return;
    const k = (clock.elapsedTime * 0.8) % 1;
    m.current.scale.setScalar(0.7 + k * 0.7);
    (m.current.material as MeshBasicMaterial).opacity = 0.85 * (1 - k);
  });
  const [x, y, z] = st.at(px, py, 0.1), d = st.vis(0.1).h * 0.16;
  return (
    <mesh ref={m} position={[x, y, z]} renderOrder={4}>
      <planeGeometry args={[d, d]} />
      <meshBasicMaterial map={ring()} color={color} transparent opacity={0.8} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
    </mesh>
  );
}

// bancos de névoa à frente da cidade: camadas em profundidades diferentes dão paralaxe de verdade
export function Mist() {
  const st = useStage();
  const refs = useRef<(Mesh | null)[]>([]);
  const L = [{ z: 1.8, o: 0.09, y: -0.28, s: 1.5 }, { z: 2.6, o: 0.07, y: 0.12, s: 1.8 }, { z: 3.4, o: 0.06, y: -0.05, s: 2.1 }];
  useFrame(({ clock }) => { refs.current.forEach((m, i) => { if (m) m.position.x = Math.sin(clock.elapsedTime * 0.05 + i * 2) * st.vis(L[i].z).w * 0.12; }); });
  return (
    <>
      {L.map((l, i) => {
        const v = st.vis(l.z);
        return (
          <mesh key={i} ref={(m) => { refs.current[i] = m; }} position={[0, l.y * v.h, l.z]} renderOrder={6}>
            <planeGeometry args={[v.w * l.s, v.h * 0.55]} />
            <meshBasicMaterial map={soft()} color="#c4b5fd" transparent opacity={l.o} depthWrite={false} toneMapped={false} />
          </mesh>
        );
      })}
    </>
  );
}

// partículas de ambiente: vaga-lumes à noite, poeira dourada de dia
export function Ambient({ night }: { night: boolean }) {
  const st = useStage();
  const N = 36, v = st.vis(1.5);
  const S = useMemo(() => {
    const base = new Float32Array(N * 3), ph = new Float32Array(N);
    for (let i = 0; i < N; i++) { base[i * 3] = (Math.random() - 0.5) * v.w; base[i * 3 + 1] = (Math.random() - 0.5) * v.h * 0.9; base[i * 3 + 2] = 0.5 + Math.random() * 2.5; ph[i] = Math.random() * 6.28; }
    return { base, ph, pos: new Float32Array(N * 3), col: new Float32Array(N * 4) };
  }, [v.w, v.h]);
  const geo = useMemo(() => { const g = new BufferGeometry(); g.setAttribute("position", new BufferAttribute(S.pos, 3)); g.setAttribute("color", new BufferAttribute(S.col, 4)); return g; }, [S]);
  useEffect(() => () => geo.dispose(), [geo]);
  const c = useMemo(() => new Color(night ? "#d9f99d" : "#fde68a"), [night]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (let i = 0; i < N; i++) {
      const i3 = i * 3, i4 = i * 4;
      S.pos[i3] = S.base[i3] + Math.sin(t * 0.3 + S.ph[i]) * 0.6;
      S.pos[i3 + 1] = S.base[i3 + 1] + Math.cos(t * 0.25 + S.ph[i] * 1.3) * 0.5;
      S.pos[i3 + 2] = S.base[i3 + 2];
      S.col[i4] = c.r; S.col[i4 + 1] = c.g; S.col[i4 + 2] = c.b;
      S.col[i4 + 3] = night ? 0.35 + 0.65 * Math.max(0, Math.sin(t * 1.4 + S.ph[i] * 3)) : 0.28;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
  });
  return (
    <points geometry={geo} frustumCulled={false} renderOrder={8}>
      <pointsMaterial map={soft()} size={night ? 0.3 : 0.2} sizeAttenuation vertexColors transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
    </points>
  );
}
