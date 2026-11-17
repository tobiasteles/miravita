"use client";
import { useEffect, useState } from "react";
import { SPOTS } from "@/lib/game/town";
import type { StageBus } from "./bus";
import GameStage from "./core/GameStage";
import { Actor, Backdrop, Tint } from "./core/layers";
import { useTex } from "./core/textures";
import { Ambient, Beacon, Glow, Mist, Portal } from "./core/town";

// Palco 3D da cidade: a arte da cidade fica no plano z=0 (alinhada com os pontos clicáveis do DOM, que continuam sendo os botões de verdade);
// névoa, vaga-lumes e personagens ficam à frente, em profundidades diferentes, e criam a paralaxe.
const MATE_X = [43, 61, 37], MATE_Y = [70, 71, 74];
const reino = SPOTS.find((s) => s.id === "reino")!, ativ = SPOTS.find((s) => s.id === "atividades")!;

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
        <Actor id="me" urls={meUrls} x={52} y={72} z={1.2} h={26} />
        {mates.map((u, i) => <Actor key={i} id={`mate${i}`} urls={u} x={MATE_X[i]} y={MATE_Y[i]} z={1} h={21} />)}
        <Mist />
        <Ambient night={night} />
        {night && <Tint color="#0b1030" opacity={0.34} />}
      </GameStage>
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 55%, #0007 100%)" }} />
    </div>
  );
}
