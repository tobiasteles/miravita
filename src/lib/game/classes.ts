// 10 classes em 3 blocos. As chaves (matematica, fisica...) são internas: o jogador vê só o nome fantasia.
// Chaves antigas (exatas/humanas/linguagens) continuam mapeadas em LEGACY. "literatura" foi removida (migre com o SQL do passo a passo).
type S = { hp: number; mp: number; atk: number; def: number; crit: number; spd: number };
export type Block = "melee" | "mage" | "summoner";
const B: Record<Block, { b: S; g: S }> = {
  melee: { b: { hp: 120, mp: 30, atk: 14, def: 8, crit: 10, spd: 10 }, g: { hp: 14, mp: 2, atk: 5, def: 1.4, crit: .05, spd: 0 } },
  mage: { b: { hp: 100, mp: 80, atk: 10, def: 5, crit: 5, spd: 10 }, g: { hp: 11, mp: 4, atk: 4.8, def: 1.1, crit: .05, spd: 0 } },
  summoner: { b: { hp: 105, mp: 60, atk: 8, def: 6, crit: 5, spd: 10 }, g: { hp: 12, mp: 3, atk: 4.4, def: 1.2, crit: .05, spd: 0 } },
};
export const ARCH: Record<Block, string> = { melee: "Combatente", mage: "Conjurador", summoner: "Invocador" };
export const BLOCKS: [Block, string][] = [["melee", "Espadachins (corpo a corpo)"], ["mage", "Magos (conjuradores)"], ["summoner", "Invocadores"]];
export const CLASS_DEFS: Record<string, { name: string; block: Block; color: string; desc: string; d?: Partial<S> }> = {
  matematica: { name: "Constante", block: "melee", color: "#38bdf8", desc: "Espadachim de precisão absoluta: ângulos, trajetórias e golpes calculados que não erram o alvo.", d: { crit: 8, def: -1 } },
  fisica: { name: "Monitor Estelar", block: "melee", color: "#22d3ee", desc: "Cavaleiro cósmico: energia estelar, relâmpagos, voo e explosões atômicas.", d: { atk: 2 } },
  quimica: { name: "Elemental", block: "melee", color: "#34d399", desc: "Espadachim alquimista: lâmina banhada em fogo, ácido e veneno. Infunde elementos da tabela periódica nas técnicas.", d: { hp: 10, def: 1 } },
  portugues: { name: "Orador", block: "mage", color: "#a78bfa", desc: "Mago das palavras: runas, barreiras de sintaxe e rajadas de verbo.", d: { mp: 10 } },
  ingles: { name: "Oráculo", block: "mage", color: "#60a5fa", desc: "Vidente de línguas antigas: profecias, selos e runas que quebram barreiras.", d: { def: 1, hp: 5 } },
  artes: { name: "Ilusionista", block: "mage", color: "#f472b6", desc: "Mago da luz e da cor: miragens, prismas e ilusões que cegam e confundem.", d: { crit: 5 } },
  historia: { name: "Invocador", block: "summoner", color: "#f59e0b", desc: "Chama espíritos de guerreiros e reis de eras passadas para lutar a seu lado.", d: {} },
  geografia: { name: "Dominador", block: "summoner", color: "#a3e635", desc: "Comanda o relevo e o clima: golens de pedra, tempestades e colossos vulcânicos.", d: { hp: 15, def: 2 } },
  filosofia: { name: "Humano", block: "summoner", color: "#e5e7eb", desc: "Mestre das ideias: projeções conceituais, paradoxos e o poder da razão.", d: { mp: 10 } },
  biologia: { name: "Caçador", block: "summoner", color: "#4ade80", desc: "Predador evolutivo: feras, enxames e raízes venenosas lutam ao seu lado e derrubam chefes.", d: { hp: 10, atk: 1 } },
};
export const CLASS_KEYS = Object.keys(CLASS_DEFS);
export const LEGACY: Record<string, string> = { exatas: "fisica", humanas: "historia", linguagens: "portugues", literatura: "artes" };
export const CLASS_NAME: Record<string, string> = { ...Object.fromEntries(CLASS_KEYS.map((k) => [k, CLASS_DEFS[k].name])), ...Object.fromEntries(Object.entries(LEGACY).map(([o, n]) => [o, CLASS_DEFS[n].name])) };
export function classStats(k: string) { const c = CLASS_DEFS[k], base = { ...B[c.block].b }; (Object.keys(c.d ?? {}) as (keyof S)[]).forEach((x) => (base[x] += c.d![x]!)); return { base, per: B[c.block].g }; }
// só Constante, Monitor Estelar e Elemental usam espada; as outras 7 usam armas mágicas (Grimório, Orbe, Cajado) e Trajes de Batalha
export const usesSword = (k: string) => CLASS_DEFS[LEGACY[k] ?? k]?.block === "melee";
export const blockOf = (k: string): Block => CLASS_DEFS[LEGACY[k] ?? k]?.block ?? "melee";
// classes que teleportam de graça (conjuradores e invocadores)
export const canTeleport = (k: string) => blockOf(k) !== "melee";
