// Efeitos são só visuais. Nível lido do menu Esc (Gráficos: baixa/alta) e do sistema (movimento reduzido).
export type FxLevel = "off" | "low" | "high"; // off: sem movimento · low: só números · high: tudo
export function fxLevel(): FxLevel {
  if (typeof window === "undefined") return "off";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "off";
  try {
    return JSON.parse(localStorage.getItem("mv_settings") ?? "{}").graphics === "baixa" ? "low" : "high";
  } catch {
    return "high";
  }
}
