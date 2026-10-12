// ───── REINOS: a versão de batalha dos Portais. Cada mapa tem UM Reino, um ambiente extremo e diferente da caçada normal (inspirado nos Racing Realms de Hot Wheels AcceleRacers, adaptado para combate). ─────
export const REALMS: Record<
  string,
  { name: string; tagline: string; sky: string; ground: string }
> = {
  "planicie-de-aurora": {
    name: "Reino da Tempestade Eterna",
    tagline: "Raios que nunca param de cair.",
    sky: "#2a2550",
    ground: "#4b3a7a",
  },
  "floresta-sussurrante": {
    name: "Reino do Pântano Afogado",
    tagline: "A floresta engolida pela própria água.",
    sky: "#16302c",
    ground: "#0c231f",
  },
  "deserto-cinzento": {
    name: "Reino de Vidro Partido",
    tagline: "Dunas que viraram espelhos cortantes.",
    sky: "#cfe8f2",
    ground: "#9fd3e6",
  },
  "montanha-de-ferro": {
    name: "Reino da Sucata Viva",
    tagline: "Metal retorcido que ainda se move.",
    sky: "#3a2a22",
    ground: "#241812",
  },
  "pantano-radioativo": {
    name: "Reino da Névoa Congelada",
    tagline: "Névoa gelada que apaga toda luz.",
    sky: "#1b2430",
    ground: "#101722",
  },
  "abismo-do-cacador": {
    name: "Reino Cósmico do Vazio",
    tagline: "Gravidade quase nula e buracos negros à espreita.",
    sky: "#0a0820",
    ground: "#000000",
  },
};
