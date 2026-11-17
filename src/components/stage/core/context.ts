import { createContext, useContext } from "react";
import type { Group, MeshBasicMaterial, Vector3 } from "three";

export type Off = { x: number; y: number; sx: number; sy: number; rot: number; op: number; fr: number; fg: number; fb: number };
export const newOff = (): Off => ({ x: 0, y: 0, sx: 1, sy: 1, rot: 0, op: 1, fr: 0, fg: 0, fb: 0 });
export type ActorRef = {
  g: Group; m: MeshBasicMaterial; home: Vector3; h: number; w: number;
  off: Off; // deslocamentos do quadro atual (o Director zera e soma a cada frame)
  hold: { op: number; y: number; rot: number }; // estado que fica depois de vitória/derrota
};
export type BurstOpts = { x: number; y: number; z: number; color: string; n: number; mode?: "burst" | "ring" | "rise"; speed?: number; life?: number; gravity?: number; spread?: number };
export type Stage = {
  // posição em % do quadro (como o resto do jogo: SPOTS, CSS) → unidades do mundo, em qualquer profundidade z
  at: (xPct: number, yPct: number, z?: number) => [number, number, number];
  vis: (z?: number) => { w: number; h: number };
  actors: Map<string, ActorRef>;
  shake: { amp: number };
  busy: { n: number };
  visible: { v: boolean };
  fx: { burst: (o: BurstOpts) => void };
  invalidate: () => void;
};
export const StageCtx = createContext<Stage | null>(null);
export function useStage(): Stage {
  const s = useContext(StageCtx);
  if (!s) throw new Error("useStage: use dentro de <GameStage>");
  return s;
}
