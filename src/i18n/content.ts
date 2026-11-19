import { CLASS_NAME, CLASS_DEFS } from "@/lib/game/classes";
import type { Lang } from "./core";
import { blocksEn, classesEn, traitsEn } from "./content/en";

// Conteúdo do jogo por idioma. pt-BR vem do próprio código/banco; en vem de content/en.ts (fallback: pt-BR).
export const className = (lang: Lang, key: string) => (lang === "en" ? classesEn[key]?.name : undefined) ?? CLASS_NAME[key] ?? key;
export const classDesc = (lang: Lang, key: string) => (lang === "en" ? classesEn[key]?.desc : undefined) ?? CLASS_DEFS[key]?.desc ?? "";
export const blockLabel = (lang: Lang, block: string, pt: string) => (lang === "en" ? blocksEn[block] : undefined) ?? pt;
export const traitName = (lang: Lang, id: string, pt: string) => (lang === "en" ? traitsEn[id]?.name : undefined) ?? pt;
export const traitDesc = (lang: Lang, id: string, pt: string) => (lang === "en" ? traitsEn[id]?.desc : undefined) ?? pt;
