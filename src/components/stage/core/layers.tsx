"use client";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { CanvasTexture, Color, DoubleSide, SRGBColorSpace, Vector3 } from "three";
import type { Group, MeshBasicMaterial } from "three";
import { newOff, useStage, type ActorRef } from "./context";
import { useTex } from "./textures";

// Camadas da cena. Posições em % do quadro (iguais às do layout 2D) + profundidade z (negativo = mais longe).

// fundo: cobre a tela inteira com a textura (como background-size: cover) e sobra um pouco para o movimento de câmera
export function Backdrop({ urls, z = -8, dim = 1, tint = "#ffffff", overscan = 1.1 }: { urls: readonly string[]; z?: number; dim?: number; tint?: string; overscan?: number }) {
  const st = useStage();
  const tex = useTex(urls);
  const color = useMemo(() => new Color(tint).multiplyScalar(dim), [tint, dim]);
  if (!tex) return null;
  const img = tex.image as { width: number; height: number };
  const ia = img.width / img.height, v = st.vis(z);
  let h = v.h * overscan, w = h * ia;
  if (w < v.w * overscan) { w = v.w * overscan; h = w / ia; }
  return (
    <mesh position={[0, 0, z]} renderOrder={0}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={tex} color={color} toneMapped={false} />
    </mesh>
  );
}

// película de cor por cima da cena (noite, perigo, derrota). Fica perto da câmera e cobre tudo.
export function Tint({ color, opacity, z = 6 }: { color: string; opacity: number; z?: number }) {
  const st = useStage();
  if (opacity <= 0) return null;
  const v = st.vis(z);
  return (
    <mesh position={[0, 0, z]} renderOrder={30}>
      <planeGeometry args={[v.w * 1.3, v.h * 1.3]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

let shadowTex: CanvasTexture | null = null;
function getShadowTex() {
  if (!shadowTex) {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    if (g) {
      const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      r.addColorStop(0, "rgba(0,0,0,.85)"); r.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = r; g.fillRect(0, 0, 64, 64);
    }
    shadowTex = new CanvasTexture(c);
    shadowTex.colorSpace = SRGBColorSpace;
  }
  return shadowTex;
}
// sombra "blob": uma elipse escura sob os pés (sem shadow map, quase de graça)
export function Shadow({ x, y, z, w, opacity = 0.55 }: { x: number; y: number; z: number; w: number; opacity?: number }) {
  const t = getShadowTex();
  return (
    <mesh position={[x, y + w * 0.04, z - 0.02]} renderOrder={3}>
      <planeGeometry args={[w, w * 0.28]} />
      <meshBasicMaterial map={t} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

// personagem/monstro: arte 2D existente num plano, com os pés ancorados em (x%, y%)
export function Actor({ id, urls, x, y, z = 0, h, flip = false, shadow = true, bob = true }: { id: string; urls: readonly string[]; x: number; y: number; z?: number; h: number; flip?: boolean; shadow?: boolean; bob?: boolean }) {
  const st = useStage();
  const tex = useTex(urls);
  const g = useRef<Group>(null), breath = useRef<Group>(null), mat = useRef<MeshBasicMaterial>(null);
  const hh = (h / 100) * st.vis(z).h;
  const img = tex?.image as { width: number; height: number } | undefined;
  const ww = img ? hh * (img.width / img.height) : hh * 0.8;
  const [X, Y] = st.at(x, y, z);
  const phase = useMemo(() => Math.random() * 6, []);

  useEffect(() => {
    if (!g.current || !mat.current) return;
    const ref: ActorRef = { g: g.current, m: mat.current, home: new Vector3(X, Y, z), h: hh, w: ww, off: newOff(), hold: { op: 1, y: 0, rot: 0 } };
    st.actors.set(id, ref);
    return () => { if (st.actors.get(id) === ref) st.actors.delete(id); };
  }, [st, id, X, Y, z, hh, ww]);

  useFrame(({ clock }) => { // respiração leve (só roda enquanto a cena anima)
    if (bob && breath.current) breath.current.scale.y = 1 + 0.012 * Math.sin(clock.elapsedTime * 2 + phase);
  });

  return (
    <>
      {shadow && <Shadow x={X} y={Y} z={z} w={ww * 0.8} />}
      <group ref={g} position={[X, Y, z]}>
        <group ref={breath}>
          <mesh position={[0, hh / 2, 0]} scale={[flip ? -1 : 1, 1, 1]} renderOrder={5} visible={!!tex}>
            <planeGeometry args={[ww, hh]} />
            <meshBasicMaterial ref={mat} map={tex} transparent depthWrite={false} toneMapped={false} side={DoubleSide} />
          </mesh>
          {urls.length === 0 && ( // sem arte: silhueta simples, para a cena continuar funcionando
            <mesh position={[0, hh / 2, 0]} renderOrder={5}>
              <circleGeometry args={[hh * 0.3, 24]} />
              <meshBasicMaterial color="#6d28d9" transparent opacity={0.4} depthWrite={false} toneMapped={false} />
            </mesh>
          )}
        </group>
      </group>
    </>
  );
}
