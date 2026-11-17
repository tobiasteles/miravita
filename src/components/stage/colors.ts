import { CAT_COLOR } from "../codex/palette";
// "#rrggbb" passa direto; nome de categoria química vira a cor da categoria; senão, o padrão
export function fxColor(el?: string, fallback = "#e8e6ff"): string {
  if (!el) return fallback;
  if (el.startsWith("#")) return el;
  return CAT_COLOR[el] ?? fallback;
}
