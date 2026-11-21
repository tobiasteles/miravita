import type { Tx } from "@/lib/game/battle";
import { monsterName, skillName, skillNameByPt } from "./content";
import type { Lang } from "./core";
import { tFor } from "./index";

// tradutor que o motor de combate recebe: mensagens do log e nomes de poderes/monstros no idioma de quem joga
export const makeTx = (lang: Lang): Tx => ({ t: tFor(lang), sk: (cls, i, pt) => skillName(lang, cls, i, pt), skPt: (pt) => skillNameByPt(lang, pt), mon: (pt, ne) => monsterName(lang, pt, ne) });
