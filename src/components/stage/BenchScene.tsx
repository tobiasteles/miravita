"use client";
import type { StageBus } from "./bus";
import GameStage from "./core/GameStage";
import { Actor, Backdrop } from "./core/layers";

// Cena de teste do núcleo (só usada em /dev/stage). As cenas reais são BattleStage (3B) e TownStage (3C).
export default function BenchScene({ bus, bg, me, foe, summon, onSlow }: { bus: StageBus; bg: string[]; me: string[]; foe: string[]; summon: boolean; onSlow: () => void }) {
  return (
    <GameStage bus={bus} onSlow={onSlow}>
      <Backdrop urls={bg} z={-8} dim={0.62} />
      <Actor id="foe" urls={foe} x={78} y={56} h={44} />
      <Actor id="me" urls={me} x={22} y={92} z={1} h={42} />
      {summon && <Actor id="summon" urls={me} x={9} y={94} z={1.5} h={22} />}
    </GameStage>
  );
}
