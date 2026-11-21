import { CLASS_NAME, CLASS_DEFS } from "@/lib/game/classes";
import { SKILLS } from "@/lib/game/classdata";
import type { Lang } from "./core";
import { biomesEn, blocksEn, classesEn, elementsEn, mapsEn, monstersEn, realmsEn, skillsEn, spotsEn, tiersEn, traitsEn } from "./content/en";

// Conteúdo do jogo por idioma. pt-BR vem do próprio código/banco; en vem de content/en.ts (fallback: pt-BR).
export const className = (lang: Lang, key: string) => (lang === "en" ? classesEn[key]?.name : undefined) ?? CLASS_NAME[key] ?? key;
export const classDesc = (lang: Lang, key: string) => (lang === "en" ? classesEn[key]?.desc : undefined) ?? CLASS_DEFS[key]?.desc ?? "";
export const blockLabel = (lang: Lang, block: string, pt: string) => (lang === "en" ? blocksEn[block] : undefined) ?? pt;
export const traitName = (lang: Lang, id: string, pt: string) => (lang === "en" ? traitsEn[id]?.name : undefined) ?? pt;
export const traitDesc = (lang: Lang, id: string, pt: string) => (lang === "en" ? traitsEn[id]?.desc : undefined) ?? pt;
export const mapLabel = (lang: Lang, slug: string, pt: string) => (lang === "en" ? mapsEn[slug] : undefined) ?? pt;
export const biomeLabel = (lang: Lang, biome: string) => (lang === "en" ? biomesEn[biome] : undefined) ?? biome;
export const realmName = (lang: Lang, pt: string) => (lang === "en" ? realmsEn[pt]?.name : undefined) ?? pt;
export const realmTagline = (lang: Lang, ptName: string, pt: string) => (lang === "en" ? realmsEn[ptName]?.tagline : undefined) ?? pt;
export const elementName = (lang: Lang, z: number, pt: string) => (lang === "en" ? elementsEn[z - 1] : undefined) ?? pt;
// prédio da cidade com texto no idioma pedido
export const spotText = <S extends { id: string; label: string; merchant: string; line: string }>(lang: Lang, s: S): S => (lang === "en" && spotsEn[s.id] ? { ...s, ...spotsEn[s.id] } : s);
// chefes levam "👑 " e sub-chefes "⭐ " no nome; `ne` = nome em inglês dos monstros gerados pela IA (guardado no banco)
export function monsterName(lang: Lang, n: string, ne?: string | null) {
  if (lang !== "en") return n;
  const pre = /^(👑 |⭐ )/.exec(n)?.[1] ?? "", base = n.slice(pre.length);
  return pre + (ne || monstersEn[base] || base);
}
export const tierName = (lang: Lang, i: number, pt: string) => (lang === "en" ? tiersEn[i] : undefined) ?? pt;
export const skillName = (lang: Lang, cls: string, i: number, pt: string) => (lang === "en" ? skillsEn[cls]?.[i] : undefined) ?? pt;
// nome em português → idioma pedido (invocados e poderes do fantasma guardam o nome em português)
const SK_BY_PT: Record<string, [string, number]> = {};
for (const cls of Object.keys(skillsEn)) SKILLS[cls]?.forEach((s, i) => { SK_BY_PT[s.n] = [cls, i]; }); // só as 10 classes reais (SKILLS também guarda apelidos das antigas)
export const skillNameByPt = (lang: Lang, pt: string) => { const r = SK_BY_PT[pt]; return r ? skillName(lang, r[0], r[1], pt) : pt; };
