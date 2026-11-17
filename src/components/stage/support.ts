"use client";
import { useEffect, useState } from "react";
import { fxLevel } from "@/lib/fx";

// Decide entre cena 3D e telas 2D atuais. 2D quando: Gráficos "baixa", movimento reduzido, sem WebGL ou aparelho marcado como lento.
const KEY = "mv_no3d";
export function webglOk() {
  try {
    const c = document.createElement("canvas");
    const g = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    g?.getExtension("WEBGL_lose_context")?.loseContext();
    return !!g;
  } catch {
    return false;
  }
}
export const markSlow = () => { try { localStorage.setItem(KEY, "1"); } catch {} };
export const clearSlow = () => { try { localStorage.removeItem(KEY); } catch {} };
export function stageMode(): "3d" | "2d" {
  if (fxLevel() !== "high") return "2d";
  try { if (localStorage.getItem(KEY) === "1") return "2d"; } catch {}
  return webglOk() ? "3d" : "2d";
}
// "pending" no servidor e no primeiro render: mostre o 2D até decidir (nunca fica sem tela)
export function useStageMode(): "pending" | "3d" | "2d" {
  const [m, setM] = useState<"pending" | "3d" | "2d">("pending");
  useEffect(() => setM(stageMode()), []);
  return m;
}
