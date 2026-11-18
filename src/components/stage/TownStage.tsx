"use client";
import { useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { MATE_DX, SPOTS, heroPx, heroSpot } from "@/lib/game/town";
import type { StageBus } from "./bus";
import GameStage from "./core/GameStage";
import { Actor, Backdrop, Tint } from "./core/layers";
import { useTex } from "./core/textures";
import { Ambient, Beacon, Glow, Mist, Portal } from "./core/town";

// Palco 3D da cidade: a arte da cidade fica no plano z=0 (alinhada com os pontos clicáveis do DOM, que continuam sendo os botões de verdade);
// névoa, vaga-lumes e personagens ficam à frente, em profundidades diferentes, e criam a paralaxe.
const reino = SPOTS.find((s) => s.id === "reino")!, ativ = SPOTS.find((s) => s.id === "atividades")!;

// personagem + colegas: tamanho proporcional (clamp em px), pés na praça com sombra e respiração leve; muda de posição no celular
function Cast({ meUrls, mates }: { meUrls: string[]; mates: string[][] }) {
  const size = useThree((s) => s.size);
  const pos = heroSpot(size.width), h = (heroPx(size.height) / size.height) * 100;
  return (
    <>
      <Actor id="me" urls={meUrls} x={pos.x} y={pos.y} z={0.6} h={h} shadowW={0.95} shadowO={0.7} bobAmp={0.02} />
      {mates.map((u, i) => (
        <Actor key={i} id={`mate${i}`} urls={u} x={pos.x + MATE_DX[i]} y={pos.y + (i === 1 ? 1 : 0)} z={0.5} h={h * 0.85} shadowW={0.9} shadowO={0.6} bobAmp={0.02} />
      ))}
    </>
  );
}

type Props = {
  bus: StageBus; bgUrls: string[]; meUrls: string[]; mates: string[][];
  night: boolean; hot: string | null; realmOpen: boolean; exp: "idle" | "running" | "ready";
  onReady: () => void; onSlow: () => void;
};
export default function TownStage({ bus, bgUrls, meUrls, mates, night, hot, realmOpen, exp, onReady, onSlow }: Props) {
  const bgT = useTex(bgUrls);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (ready) return;
    if (bgT) { setReady(true); onReady(); return; }
    const t = setTimeout(() => { setReady(true); onReady(); }, 4000);
    return () => clearTimeout(t);
  }, [bgT, ready, onReady]);
  return (
    <div aria-hidden className="absolute inset-0 transition-opacity duration-300" style={{ opacity: ready ? 1 : 0 }}>
      <GameStage bus={bus} sky="#0b0a1f" sway={0.4} onSlow={onSlow}>
        <Backdrop urls={bgUrls} z={0} overscan={1.015} dim={night ? 0.72 : 1} tint={night ? "#9fb0ff" : "#ffffff"} />
        {SPOTS.map((s) => <Glow key={s.id} s={s} hot={hot === s.id} />)}
        <Portal s={reino} open={realmOpen} />
        {exp !== "idle" && <Beacon x={ativ.x} y={ativ.y} color={exp === "ready" ? "#34d399" : "#fbbf24"} />}
        <Cast meUrls={meUrls} mates={mates} />
        <Mist />
        <Ambient night={night} />
        {night && <Tint color="#0b1030" opacity={0.34} />}
      </GameStage>
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 55%, #0007 100%)" }} />
    </div>
  );
}
