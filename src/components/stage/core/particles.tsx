"use client";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, Color, SRGBColorSpace } from "three";
import { useStage, type BurstOpts } from "./context";

// Um único Points com 320 partículas reaproveitadas (anel circular). Cada golpe/cura/habilidade chama st.fx.burst().
const N = 320;
export function Particles() {
  const st = useStage();
  const S = useMemo(() => ({
    pos: new Float32Array(N * 3), vel: new Float32Array(N * 3), col: new Float32Array(N * 4),
    life: new Float32Array(N), max: new Float32Array(N), grav: new Float32Array(N), head: 0, alive: false,
  }), []);
  const geo = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(S.pos, 3));
    g.setAttribute("color", new BufferAttribute(S.col, 4));
    return g;
  }, [S]);
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const g = c.getContext("2d");
    if (g) {
      const r = g.createRadialGradient(16, 16, 0, 16, 16, 16);
      r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.4, "rgba(255,255,255,.5)"); r.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = r; g.fillRect(0, 0, 32, 32);
    }
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => { geo.dispose(); tex.dispose(); }, [geo, tex]);

  useEffect(() => {
    const c = new Color();
    st.fx.burst = (o: BurstOpts) => {
      c.set(o.color);
      const mode = o.mode ?? "burst", n = Math.min(o.n, N), spread = o.spread ?? 0.15;
      for (let k = 0; k < n; k++) {
        const i = S.head, i3 = i * 3, i4 = i * 4;
        S.head = (S.head + 1) % N;
        const sp = (o.speed ?? 2) * (0.5 + Math.random() * 0.5), a = mode === "ring" ? (k / n) * Math.PI * 2 : Math.random() * Math.PI * 2;
        S.pos[i3] = o.x + (mode === "rise" ? (Math.random() - 0.5) * 2 * spread : (Math.random() - 0.5) * 0.2);
        S.pos[i3 + 1] = o.y + (Math.random() - 0.5) * 0.2;
        S.pos[i3 + 2] = o.z;
        if (mode === "rise") { S.vel[i3] = (Math.random() - 0.5) * 0.4; S.vel[i3 + 1] = sp; }
        else if (mode === "ring") { S.vel[i3] = Math.cos(a) * sp; S.vel[i3 + 1] = Math.sin(a) * sp * 0.55; }
        else { S.vel[i3] = Math.cos(a) * sp * Math.random(); S.vel[i3 + 1] = Math.sin(a) * sp + 0.6; }
        S.vel[i3 + 2] = (Math.random() - 0.5) * 0.5;
        S.life[i] = S.max[i] = (o.life ?? 0.6) * (0.7 + Math.random() * 0.5);
        S.grav[i] = o.gravity ?? 2;
        S.col[i4] = c.r; S.col[i4 + 1] = c.g; S.col[i4 + 2] = c.b; S.col[i4 + 3] = 1;
      }
      S.alive = true;
      st.invalidate();
    };
    return () => { st.fx.burst = () => {}; };
  }, [st, S]);

  useFrame((_, dtRaw) => {
    if (!S.alive) return;
    const dt = Math.min(dtRaw, 0.05);
    let alive = false;
    for (let i = 0; i < N; i++) {
      if (S.life[i] <= 0) continue;
      S.life[i] -= dt;
      const i3 = i * 3, i4 = i * 4;
      if (S.life[i] <= 0) { S.col[i4 + 3] = 0; continue; }
      alive = true;
      S.vel[i3 + 1] -= S.grav[i] * dt;
      S.pos[i3] += S.vel[i3] * dt; S.pos[i3 + 1] += S.vel[i3 + 1] * dt; S.pos[i3 + 2] += S.vel[i3 + 2] * dt;
      S.col[i4 + 3] = Math.min(1, (S.life[i] / S.max[i]) * 1.6);
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
    S.alive = alive;
    if (alive) st.invalidate();
  });

  return (
    <points geometry={geo} frustumCulled={false} renderOrder={20}>
      <pointsMaterial map={tex} size={0.55} sizeAttenuation vertexColors transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
    </points>
  );
}
