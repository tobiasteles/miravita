import { CLASS_DEFS, CLASS_KEYS, LEGACY, usesSword, type Block } from "./classes";
import type { IconName } from "@/components/game/GameIcon";

// ───── 5 PEÇAS DE EQUIPAMENTO, com nome temático por bloco de classes (ex.: Destruidor usa Lâmina/Elmo/Couraça/Manoplas/Grevas) ─────
export const SLOTS = [
  { key: "arma", label: "Arma", icon: "sword" as IconName, prefix: "blade" },
  { key: "elmo", label: "Elmo", icon: "helm" as IconName, prefix: "helm" },
  { key: "armadura", label: "Peitoral", icon: "shield" as IconName, prefix: "armor" },
  { key: "manoplas", label: "Manoplas", icon: "gauntlet" as IconName, prefix: "gauntlets" },
  { key: "botas", label: "Botas", icon: "boots" as IconName, prefix: "boots" },
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
  mp?: number;
  crit?: number;
  durability?: number;
  res?: number; mit?: number; sifV?: number; sifE?: number; foco?: number; refl?: number; reg?: number;
  imp?: number; ten?: number; ret?: number; qg?: number; rupD?: number; pen?: number;
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
export const slotIcon = (k: string): IconName =>
  k === "acessorio" ? "tunic" : (SLOTS.find((s) => s.key === k)?.icon ?? "spark");
export const slotPrefix = (k: string) =>
  SLOTS.find((s) => s.key === k)?.prefix ?? "mat";

// ───── CLASSES MÁGICAS: Armas (Grimório · Orbe · Cajado) e Trajes de Batalha, vendidos na CONVENIÊNCIA ─────
// Espadachins (Constante, Monitor Estelar, Elemental) usam Lâmina + armaduras do Ferreiro. As outras 7 classes usam armas mágicas.
export const slotsFor = (cls: string) => (usesSword(cls) ? SLOTS : SLOTS.filter((s) => s.key !== "arma")); // magos não compram "arma" no Ferreiro
export type WeaponKind = "grimorio" | "orbe" | "cajado";
export const WEAPONS: Record<WeaponKind, { label: string; icon: IconName; desc: string }> = {
  grimorio: { label: "Grimório", icon: "book", desc: "Ressonância Arcana: seus poderes causam mais dano." },
  orbe: { label: "Orbe", icon: "crystal", desc: "Foco e Sifão de Essência: acerta mais e recupera EA batendo." },
  cajado: { label: "Cajado", icon: "pick", desc: "Poderio e MP: o maior dano base e uma reserva de EA maior." },
};
// score = pontuação do elemento (item-stats): atk = score×3 + massa/10
export function computeWeapon(kind: WeaponKind, s: { atk: number; score: number; durability: number }): EquipStats {
  const d = { durability: s.durability };
  if (kind === "grimorio") return { atk: Math.round(s.atk * 0.95), res: Math.round(s.score * 0.8), ...d };
  if (kind === "orbe") return { atk: Math.round(s.atk * 0.95), foco: Math.round(s.score * 3), sifE: Math.round(s.score * 0.25 * 10) / 10, ...d };
  return { atk: Math.round(s.atk * 1.15), mp: Math.round(s.score * 5), ...d };
}
// Trajes de Batalha: 6 níveis por classe, exclusivos das 7 classes mágicas. Cada classe ganha um bônus próprio.
export const TRAJE_TIERS = [
  { n: "Aprendiz", lv: 1, price: 500, def: 10, hp: 60, mit: 1, reg: 0 },
  { n: "Adepto", lv: 25, price: 4000, def: 40, hp: 300, mit: 2, reg: 0.1 },
  { n: "Veterano", lv: 50, price: 20000, def: 95, hp: 800, mit: 4, reg: 0.2 },
  { n: "Mestre", lv: 80, price: 80000, def: 170, hp: 1700, mit: 6, reg: 0.3 },
  { n: "Arquimestre", lv: 115, price: 250000, def: 270, hp: 3200, mit: 8, reg: 0.4 },
  { n: "Lendário", lv: 150, price: 700000, def: 400, hp: 5500, mit: 10, reg: 0.5 },
] as const;
export const TRAJE_THEME: Record<string, { noun: string; key: keyof EquipStats; label: string; per: number[] }> = {
  portugues: { noun: "Vestes do Verbo", key: "res", label: "Ressonância Arcana", per: [2, 4, 6, 8, 10, 12] },
  ingles: { noun: "Manto das Profecias", key: "qg", label: "Quebra de Guarda", per: [2, 4, 6, 8, 10, 12] },
  artes: { noun: "Traje das Miragens", key: "refl", label: "Reflexos", per: [10, 25, 50, 90, 140, 200] },
  historia: { noun: "Túnica dos Pactos", key: "sifV", label: "Sifão Vital", per: [1, 2, 3, 4, 5, 6] },
  geografia: { noun: "Armadura do Relevo", key: "ret", label: "Retaliação", per: [2, 4, 6, 8, 10, 12] },
  filosofia: { noun: "Hábito da Razão", key: "pen", label: "Penetração de Status", per: [3, 6, 9, 12, 15, 18] },
  biologia: { noun: "Couro do Predador", key: "imp", label: "Ímpeto de Caçador", per: [3, 6, 9, 12, 15, 20] },
};
export const trajeName = (cls: string, tier: number) => `${TRAJE_THEME[LEGACY[cls] ?? cls]?.noun ?? "Traje"} (${TRAJE_TIERS[tier].n})`;
export function trajeStats(cls: string, tier: number): EquipStats {
  const T = TRAJE_TIERS[tier], th = TRAJE_THEME[LEGACY[cls] ?? cls];
  const s: EquipStats = { def: T.def, hp: T.hp, mit: T.mit, durability: 200 + tier * 60 };
  if (T.reg) s.reg = T.reg;
  if (th) (s as Record<string, number>)[th.key as string] = th.per[tier];
  return s;
}
// rótulos dos status nas telas (nomenclatura nova)
export const STAT_TXT: Record<string, string> = {
  atk: "Poderio", def: "Defesa", hp: "HP", mp: "MP", crit: "Chance de Ruptura", res: "Ressonância", mit: "Mitigação", sifV: "Sifão Vital", sifE: "Sifão de Essência",
  foco: "Foco", refl: "Reflexos", reg: "Regeneração Inerente", imp: "Ímpeto de Caçador", ten: "Tenacidade", ret: "Retaliação", qg: "Quebra de Guarda", rupD: "Dano de Ruptura", pen: "Penetração de Status",
};
const PCT = new Set(["crit", "res", "mit", "sifV", "sifE", "reg", "imp", "ten", "ret", "qg", "rupD", "pen"]);
export const statLine = (s: Record<string, number | undefined>) =>
  Object.entries(s).filter(([k, v]) => k !== "durability" && v).map(([k, v]) => `${STAT_TXT[k] ?? k} +${v}${PCT.has(k) ? "%" : ""}`).join(" · ");
