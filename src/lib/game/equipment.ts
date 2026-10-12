import { CLASS_DEFS, CLASS_KEYS, LEGACY, type Block } from "./classes";

// ───── 5 PEÇAS DE EQUIPAMENTO, com nome temático por bloco de classes (ex.: Destruidor usa Lâmina/Elmo/Couraça/Manoplas/Grevas) ─────
export const SLOTS = [
  { key: "arma", label: "Arma", icon: "⚔️", prefix: "blade" },
  { key: "elmo", label: "Elmo", icon: "🪖", prefix: "helm" },
  { key: "armadura", label: "Peitoral", icon: "🛡️", prefix: "armor" },
  { key: "manoplas", label: "Manoplas", icon: "🧤", prefix: "gauntlets" },
  { key: "botas", label: "Botas", icon: "🥾", prefix: "boots" },
] as const;
export type SlotKey = (typeof SLOTS)[number]["key"];
export const SLOT_KEYS = SLOTS.map((s) => s.key);

const NAMES: Record<Block, Record<SlotKey, string>> = {
  melee: {
    arma: "Lâmina",
    elmo: "Elmo",
    armadura: "Couraça",
    manoplas: "Manoplas",
    botas: "Grevas",
  },
  mage: {
    arma: "Cajado",
    elmo: "Capuz Arcano",
    armadura: "Manto",
    manoplas: "Luvas Encantadas",
    botas: "Sandálias Rúnicas",
  },
  summoner: {
    arma: "Grimório",
    elmo: "Coroa Espectral",
    armadura: "Vestes Ancestrais",
    manoplas: "Braceletes de Comando",
    botas: "Grevas Ancestrais",
  },
};
export const EQUIP_NAMES: Record<
  string,
  Record<SlotKey, string>
> = Object.fromEntries(CLASS_KEYS.map((k) => [k, NAMES[CLASS_DEFS[k].block]]));
for (const [old, nw] of Object.entries(LEGACY))
  EQUIP_NAMES[old] = EQUIP_NAMES[nw];

export type EquipStats = {
  atk?: number;
  def?: number;
  hp?: number;
  crit?: number;
  durability?: number;
};
type Base = { atk: number; def: number; durability: number; score: number };
// cada peça converte os atributos do elemento (ataque/defesa "brutos") de um jeito diferente:
// arma = todo o ataque · peitoral = toda a defesa + um pouco de HP · elmo = mais HP · manoplas = ataque menor + crítico · botas = defesa menor + crítico
export function computeEquip(slot: SlotKey, s: Base): EquipStats {
  const d = { durability: s.durability };
  switch (slot) {
    case "arma":
      return { atk: s.atk, ...d };
    case "armadura":
      return { def: s.def, hp: Math.round(s.atk), ...d };
    case "elmo":
      return {
        def: Math.round(s.def * 0.6),
        hp: Math.round(s.atk * 1.4),
        ...d,
      };
    case "manoplas":
      return {
        atk: Math.round(s.atk * 0.5),
        crit: Math.round(s.score * 0.25),
        ...d,
      };
    case "botas":
      return {
        def: Math.round(s.def * 0.4),
        crit: Math.round(s.score * 0.15),
        ...d,
      };
  }
}
export const slotIcon = (k: string) =>
  SLOTS.find((s) => s.key === k)?.icon ?? "🌀";
export const slotPrefix = (k: string) =>
  SLOTS.find((s) => s.key === k)?.prefix ?? "mat";
