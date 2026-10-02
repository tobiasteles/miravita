// monstros e drops por mapa (números = número atômico dos elementos)
export const WORLD: Record<string, { mons: string[]; dr: number[]; dg: number[] }> = {
  "planicie-de-aurora": { mons: ["Slime de Giz", "Coelho Algébrico", "Goblin de Rascunho"], dr: [1, 6, 26], dg: [29, 22] },
  "floresta-sussurrante": { mons: ["Lobo das Raízes", "Dríade Sombria", "Javali Fóssil"], dr: [13, 26, 29], dg: [22, 47] },
  "deserto-cinzento": { mons: ["Escorpião de Sílica", "Múmia Gramatical", "Golem de Areia"], dr: [29, 22, 82], dg: [47, 79] },
  "montanha-de-ferro": { mons: ["Troll Basáltico", "Harpia de Aço", "Gárgula Mohs"], dr: [22, 47, 79], dg: [79, 78] },
  "pantano-radioativo": { mons: ["Hidra Tóxica", "Sapo Isótopo", "Espectro de Rádon"], dr: [79, 78, 92], dg: [78, 76, 92] },
  "abismo-do-cacador": { mons: ["Sombra Soberana", "Cavaleiro do Vazio", "Ceifador de Portais"], dr: [78, 76, 77], dg: [76, 77, 92, 94] },
};
