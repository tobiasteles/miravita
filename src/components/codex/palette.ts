// cor de cada categoria (a mesma do jogo: vem de ELEMENTS) e rótulos de raridade
export const CAT_COLOR: Record<string, string> = {
  "metal alcalino": "#f87171",
  "metal alcalino-terroso": "#fb923c",
  "metal de transição": "#fbbf24",
  "metal pós-transição": "#a3e635",
  metaloide: "#34d399",
  "não-metal": "#22d3ee",
  halogênio: "#60a5fa",
  "gás nobre": "#a78bfa",
  lantanídeo: "#f472b6",
  actinídeo: "#e879f9",
  transactinídeo: "#94a3b8",
};
export const CATS = Object.keys(CAT_COLOR);
export const RARITY: Record<string, { label: string; tone: "plain" | "aether" | "arcane" | "ember" }> = {
  comum: { label: "Comum", tone: "plain" },
  raro: { label: "Raro", tone: "aether" },
  epico: { label: "Épico", tone: "arcane" },
  lendario: { label: "Lendário", tone: "ember" },
};
