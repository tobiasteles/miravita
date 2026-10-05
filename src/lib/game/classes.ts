// 11 classes em 3 blocos. As chaves (matematica, fisica...) são internas: o jogador vê só o nome fantasia. Chaves antigas (exatas/humanas/linguagens) são migradas via SQL (README).
type S = { hp: number; mp: number; atk: number; def: number; crit: number; spd: number };
export type Block = "melee" | "mage" | "summoner";
const B: Record<Block, { b: S; g: S }> = {
  melee: { b: { hp: 120, mp: 30, atk: 14, def: 8, crit: 10, spd: 10 }, g: { hp: 14, mp: 2, atk: 5, def: 1.4, crit: .05, spd: 0 } },
  mage: { b: { hp: 80, mp: 80, atk: 10, def: 4, crit: 5, spd: 10 }, g: { hp: 9, mp: 4, atk: 4.8, def: .8, crit: .05, spd: 0 } },
  summoner: { b: { hp: 90, mp: 60, atk: 8, def: 5, crit: 5, spd: 10 }, g: { hp: 10, mp: 3, atk: 4.4, def: .9, crit: .05, spd: 0 } },
};
export const ARCH: Record<Block, string> = { melee: "Combatente", mage: "Conjurador", summoner: "Invocador" };
export const BLOCKS: [Block, string][] = [["melee", "Espadachins (corpo a corpo)"], ["mage", "Magos (conjuradores)"], ["summoner", "Invocadores"]];
export const CLASS_DEFS: Record<string, { name: string; block: Block; color: string; desc: string; d?: Partial<S> }> = {
  matematica: { name: "Mestre da Precisão", block: "melee", color: "#38bdf8", desc: "Espadachim de elite: ângulos mortos, trajetórias perfeitas e golpes calculados.", d: { crit: 8, def: -1 } },
  fisica: { name: "Destruidor", block: "melee", color: "#22d3ee", desc: "Cavaleiro de impacto: energia cinética, fogo, eletricidade, teletransporte e explosões atômicas.", d: { atk: 2 } },
  quimica: { name: "Lâmina Elemental", block: "melee", color: "#34d399", desc: "Espadachim alquimista: lâmina banhada em fogo, ácido e veneno, com dano contínuo.", d: { hp: 10, def: 1 } },
  portugues: { name: "Mago Arcano", block: "mage", color: "#a78bfa", desc: "Grão-mestre das runas: barreiras de sintaxe e rajadas de energia precisas.", d: { mp: 10 } },
  literatura: { name: "Ilusionista", block: "mage", color: "#f472b6", desc: "Mago mental: projeções do passado, metáforas e correntes que prendem a mente.", d: { crit: 3 } },
  ingles: { name: "Mago das Runas", block: "mage", color: "#60a5fa", desc: "Feitiços em línguas estrangeiras que quebram barreiras e desarmam armadilhas.", d: { def: 1, hp: 5 } },
  artes: { name: "Mago da Luz", block: "mage", color: "#fbbf24", desc: "Tecnomago: manipula cores, luz e formas para cegar inimigos e camuflar aliados.", d: { crit: 5 } },
  historia: { name: "Invocador de Eras", block: "summoner", color: "#f59e0b", desc: "Necromante histórico: espíritos de guerreiros e generais lutam ao seu lado.", d: {} },
  geografia: { name: "Invocador da Terra", block: "summoner", color: "#a3e635", desc: "Mestre geopolítico: golens de pedra, elementais do clima e o relevo a seu favor.", d: { hp: 15, def: 2 } },
  filosofia: { name: "Invocador de Ideias", block: "summoner", color: "#e5e7eb", desc: "Projeções conceituais cujas auras causam confusão, crises e paz forçada.", d: { mp: 10 } },
  biologia: { name: "Mestre de Feras", block: "summoner", color: "#4ade80", desc: "Invocador evolutivo: feras, enxames infecciosos e raízes venenosas.", d: { hp: 10, atk: 1 } },
};
export const CLASS_KEYS = Object.keys(CLASS_DEFS);
export const LEGACY: Record<string, string> = { exatas: "fisica", humanas: "historia", linguagens: "portugues" };
export const CLASS_NAME: Record<string, string> = { ...Object.fromEntries(CLASS_KEYS.map((k) => [k, CLASS_DEFS[k].name])), ...Object.fromEntries(Object.entries(LEGACY).map(([o, n]) => [o, CLASS_DEFS[n].name])) };
export function classStats(k: string) { const c = CLASS_DEFS[k], base = { ...B[c.block].b }; (Object.keys(c.d ?? {}) as (keyof S)[]).forEach((x) => (base[x] += c.d![x]!)); return { base, per: B[c.block].g }; }
