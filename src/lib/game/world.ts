// monstros e drops por mapa (números = número atômico dos elementos). Agora com os 118 elementos:
// os elementos são ordenados pela raridade/poder (item-stats) e cada mapa solta uma "faixa" — mapas mais fundos soltam elementos mais raros.
import { ELEMENTS } from "./elements";
import { computeItem } from "./item-stats";
const byPower = ELEMENTS.map((e) => ({ z: e[0], s: computeItem({ atomicNumber: e[0], atomicMass: e[3], mohsHardness: e[4], crustalAbundancePpm: e[5] }).score }))
  .sort((a, b) => a.s - b.s)
  .map((x) => x.z);
const slice = (a: number, n: number) => byPower.slice(Math.min(a, byPower.length - n), Math.min(a, byPower.length - n) + n);
const MAPS = ["planicie-de-aurora", "floresta-sussurrante", "deserto-cinzento", "montanha-de-ferro", "pantano-radioativo", "abismo-do-cacador"];
const MONS: Record<string, string[]> = {
  "planicie-de-aurora": ["Slime de Cinza", "Coelho Rúnico", "Goblin Remendado"],
  "floresta-sussurrante": ["Lobo das Raízes", "Dríade Sombria", "Javali Fóssil"],
  "deserto-cinzento": ["Escorpião de Vidro", "Múmia Rúnica", "Golem de Areia"],
  "montanha-de-ferro": ["Troll Basáltico", "Harpia de Aço", "Gárgula de Cristal"],
  "pantano-radioativo": ["Hidra Tóxica", "Sapo Radiante", "Espectro da Névoa"],
  "abismo-do-cacador": ["Sombra Soberana", "Cavaleiro do Vazio", "Ceifador de Portais"],
};
// dr = drops de monstros comuns · dg = drops do Reino (faixa um pouco mais rara)
export const WORLD: Record<string, { mons: string[]; dr: number[]; dg: number[] }> = Object.fromEntries(
  MAPS.map((m, i) => [m, { mons: MONS[m], dr: slice(i * 17, 14), dg: slice(i * 17 + 12, 12) }]),
);
// raridade comum = barata na Conveniência (reagentes)
export const COMMON_Z = byPower.slice(0, 24);
export const ZBYPOWER = byPower;
