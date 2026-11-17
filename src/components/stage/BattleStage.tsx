"use client";
import { useEffect, useMemo, useState } from "react";
import type { StageBus } from "./bus";
import GameStage from "./core/GameStage";
import { Actor, Backdrop, Tint } from "./core/layers";
import { useTex } from "./core/textures";

// Palco 3D da batalha: só DESENHA o que o servidor já decidiu (BState). Posições espelham o layout 2D da BattleScreen.
type Props = {
  bus: StageBus;
  bgUrls: string[]; foeUrls: string[]; meUrls: string[]; svUrls: string[] | null;
  foeKey: string; // muda a cada monstro novo (o ator é recriado)
  over: "wave" | "win" | "lose" | "flee" | null;
  sky: string; danger: boolean; domColor: string | null;
  onReady: () => void; onSlow: () => void;
};
export default function BattleStage({ bus, bgUrls, foeUrls, meUrls, svUrls, foeKey, over, sky, danger, domColor, onReady, onSlow }: Props) {
  const [firstOver] = useState(over); // como a luta estava quando a cena abriu
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const foeOver = useMemo(() => over, [foeKey]);
  // o 2D só some quando as imagens principais já chegaram (ou depois de 4 s), para nunca haver tela vazia
  const bgT = useTex(bgUrls), foeT = useTex(foeUrls), meT = useTex(meUrls);
  const loaded = (bgUrls.length === 0 || !!bgT) && (foeUrls.length === 0 || !!foeT) && (meUrls.length === 0 || !!meT);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (ready) return;
    if (loaded) { setReady(true); onReady(); return; }
    const t = setTimeout(() => { setReady(true); onReady(); }, 4000);
    return () => clearTimeout(t);
  }, [loaded, ready, onReady]);
  return (
    <div aria-hidden className="absolute inset-0 transition-opacity duration-300" style={{ opacity: ready ? 1 : 0 }}>
      <GameStage bus={bus} sky={sky} onSlow={onSlow}>
        <Backdrop urls={bgUrls} z={-8} dim={0.62} />
        <Actor key={foeKey} id="foe" urls={foeUrls} x={80} y={56} h={44} end={foeOver === "wave" || foeOver === "win" ? "gone" : undefined} />
        <Actor id="me" urls={meUrls} x={18} y={92} z={1} h={42} end={firstOver === "lose" ? "down" : firstOver === "flee" ? "gone" : undefined} />
        {svUrls && <Actor id="summon" urls={svUrls} x={32} y={70} z={0.6} h={28} />}
        {danger && <Tint color="#7f1d1d" opacity={0.14} />}
        {domColor && <Tint color={domColor} opacity={0.12} />}
      </GameStage>
    </div>
  );
}
