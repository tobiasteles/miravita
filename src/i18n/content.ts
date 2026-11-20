import { CLASS_NAME, CLASS_DEFS } from "@/lib/game/classes";
import type { Lang } from "./core";
import { biomesEn, blocksEn, classesEn, elementsEn, mapsEn, realmsEn, spotsEn, traitsEn } from "./content/en";

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
