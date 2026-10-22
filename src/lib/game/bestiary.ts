import { monsterXp } from "./xp";
import type { Mon } from "./battle";
import { monBase, KIND_MUL } from "./combat";

// ───── BESTIÁRIO: 120 monstros comuns (20 por mapa, de nível crescente) + 18 sub-chefes + 12 chefes de Portal ─────
// Os nomes viram o nome do arquivo de imagem em public/monsters/<nome-em-slug>.png (sem acento, minúsculas, hífens).
export type Kind = "mon" | "sub" | "boss";
export const BESTIARY: Record<
  string,
  { lo: number; hi: number; mons: string[]; sub: string[]; boss: string[] }
> = {
  "planicie-de-aurora": {
    lo: 1,
    hi: 9,
    mons: [
      "Slime de Cinza",
      "Coelho Rúnico",
      "Goblin Remendado",
      "Rato das Ruínas",
      "Corvo de Bruma",
      "Besouro de Bronze",
      "Lobo da Campina",
      "Espantalho Vivo",
      "Cobra de Pradaria",
      "Javali de Aurora",
      "Raposa Estelar",
      "Gnomo Saqueador",
      "Abelha Gigante",
      "Urso Musgoso",
      "Bandido da Fenda",
      "Cervo Espectral",
      "Guardião de Palha",
      "Falcão do Alvorecer",
      "Troll da Colina",
      "Lobo Alfa da Planície",
    ],
    sub: ["Rei Goblin Remendado", "Javali Matriarca", "Cavaleiro Espantalho"],
    boss: ["Guardião da Primeira Fenda", "Quimera de Aurora"],
  },
  "floresta-sussurrante": {
    lo: 10,
    hi: 29,
    mons: [
      "Lobo das Raízes",
      "Dríade Sombria",
      "Javali Fóssil",
      "Cogumelo Furioso",
      "Aranha Tecelã",
      "Coruja Silente",
      "Lobisomem Novato",
      "Ent Jovem",
      "Fada Sombria",
      "Cobra de Espinhos",
      "Vespa Esmeralda",
      "Raposa de Duas Caudas",
      "Morcego Sanguessuga",
      "Cervo Corrompido",
      "Urso de Casca",
      "Bruxa da Mata",
      "Centauro Arqueiro",
      "Hidra de Cipó",
      "Gigante Lenhador",
      "Lobo Espectral das Raízes",
    ],
    sub: ["Aranha Rainha", "Ent Ancião", "Alcateia Maldita"],
    boss: ["Guardião da Floresta Sussurrante", "Lobisomem Soberano"],
  },
  "deserto-cinzento": {
    lo: 30,
    hi: 59,
    mons: [
      "Escorpião de Vidro",
      "Múmia Rúnica",
      "Golem de Areia",
      "Cobra do Deserto",
      "Abutre de Cinzas",
      "Chacal Espectral",
      "Lagarto de Pedra",
      "Escaravelho Gigante",
      "Sacerdote Perdido",
      "Naja Dourada",
      "Esfinge Menor",
      "Verme das Dunas",
      "Bandido do Deserto",
      "Elemental de Poeira",
      "Camelo Zumbi",
      "Ghoul das Areias",
      "Cultista das Runas",
      "Gárgula de Arenito",
      "Faraó Menor",
      "Djinn Cinzento",
    ],
    sub: ["Rei Escorpião", "Sacerdote Múmia Real", "Colosso de Areia"],
    boss: ["Esfinge do Enigma Perdido", "Verme Soberano das Dunas"],
  },
  "montanha-de-ferro": {
    lo: 60,
    hi: 99,
    mons: [
      "Troll Basáltico",
      "Harpia de Aço",
      "Gárgula de Cristal",
      "Cabra de Ferro",
      "Kobold Mineiro",
      "Golem de Minério",
      "Lobo de Aço",
      "Águia Trovejante",
      "Anão Corrompido",
      "Wyvern Jovem",
      "Ogro de Rocha",
      "Elemental de Magma",
      "Besouro de Ferro",
      "Yeti das Geadas",
      "Basilisco de Pedra",
      "Cavaleiro Enferrujado",
      "Autômato de Forja",
      "Gigante de Pedra",
      "Quimera de Rocha",
      "Dragonete de Brasa",
    ],
    sub: ["Capataz Ogro", "Golem de Forja Maior", "Wyvern Anciã"],
    boss: ["Dragão de Ferro", "Rei da Montanha"],
  },
  "pantano-radioativo": {
    lo: 100,
    hi: 149,
    mons: [
      "Hidra Tóxica",
      "Sapo Radiante",
      "Espectro da Névoa",
      "Sanguessuga Gigante",
      "Crocodilo Venenoso",
      "Bruxa do Brejo",
      "Zumbi do Lodo",
      "Libélula Venenosa",
      "Planta Carnívora",
      "Lagarto Sombrio",
      "Fogo-Fátuo",
      "Naga Pantaneira",
      "Aranha de Névoa",
      "Troll do Lodo",
      "Corvo Pútrido",
      "Lich Menor",
      "Basilisco do Brejo",
      "Mosquito Gigante",
      "Golem de Lama",
      "Banshee",
    ],
    sub: ["Rainha Naga", "Lich do Pântano", "Hidra Dupla"],
    boss: ["Hidra Ancestral", "Senhor do Lodo"],
  },
  "abismo-do-cacador": {
    lo: 150,
    hi: 200,
    mons: [
      "Sombra Soberana",
      "Cavaleiro do Vazio",
      "Ceifador de Portais",
      "Observador do Vazio",
      "Cão do Abismo",
      "Demônio Menor",
      "Espectro Cristalino",
      "Serpente das Trevas",
      "Guerreiro Caído",
      "Vampiro Antigo",
      "Golem Obsidiana",
      "Mago do Vazio",
      "Sentinela Abissal",
      "Besta Sombria",
      "Anjo Corrompido",
      "Devorador de Portais",
      "Lâmina Fantasma",
      "Colosso do Vazio",
      "Arconte Negro",
      "Titã Caído",
    ],
    sub: ["Ceifador Chefe", "General Demônio", "Arquimago Sombrio"],
    boss: ["Soberano Ignotus", "Dragão do Vazio"],
  },
};
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const levelsOf = (slug: string) => {
  const m = BESTIARY[slug];
  return m.mons.map((n, i) => ({
    n,
    lv: m.lo + Math.round((i * (m.hi - m.lo)) / (m.mons.length - 1)),
  }));
};

// stats por nível (curva em combat.ts → monBase): comum x1 · sub-chefe (⭐) vida x3, ataque x1,3, XP x3, 1 padrão · chefe (👑) vida x9, ataque x1,55, XP x8, 2–3 padrões
// padrões de chefe: carga (golpe devastador telegrafado: atordoe ou use Véu/Barreira) · couraça (defesa ×2,5: quebre a guarda) · fúria (abaixo de 30% do HP bate mais forte e carrega mais rápido)
const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const ARC = /(Mago|Lich|Bruxa|Arquimago|Sacerdote|Banshee|Espectro|Fada|Dríade|Djinn|Cultista|Fogo-Fátuo|Anjo|Demônio|Arconte|Sombra|Fantasma|Esfinge|Faraó|Naga)/;
export function mkMonster(name: string, L: number, kind: Kind): Mon {
  const b = monBase(L),
    k = KIND_MUL[kind],
    pre = kind === "boss" ? "👑 " : kind === "sub" ? "⭐ " : "",
    h = hash(name),
    hp = Math.round(b.hp * k.hp);
  const PATS = ["carga", "couraca", "furia"] as const;
  const pat: Mon["pat"] = kind === "boss" ? [...PATS].filter((_, i) => kind === "boss" && (i === 0 || (h + i) % 3 !== 0)).slice(0, 3) : kind === "sub" ? [PATS[h % 3]] : [];
  if (kind === "boss" && !pat.includes("couraca") && !pat.includes("furia")) pat.push("couraca");
  return {
    n: pre + name,
    L,
    hp,
    mx: hp,
    atk: Math.round(b.atk * k.atk),
    def: Math.round(b.def),
    xp: monsterXp(L) * k.xp,
    boss: kind !== "mon",
    kind,
    refl: b.refl,
    acc: b.acc,
    dt: ARC.test(name) ? "arc" : "fis",
    rs: kind === "boss" ? 0.55 : kind === "sub" ? 0.4 : 0.25,
    pat,
  };
}
// grind infinito: cada 5 monstros derrotados a "intensidade" sobe 4% (máx. +60%) em vida e ataque; zera ao voltar para a cidade
export const heatUp = (m: Mon, heat: number): Mon => {
  const hp = Math.round(m.hp * (1 + heat)), atk = Math.round(m.atk * (1 + heat));
  return { ...m, hp, mx: hp, atk };
};
// escolhe o monstro do mapa cujo nível está perto do jogador (janela de níveis proporcional ao tamanho do mapa); se nenhum, o mais próximo
export function pickMonster(slug: string, pl: number) {
  const m = BESTIARY[slug],
    span = m.hi - m.lo,
    below = Math.max(8, Math.round(span / 4)),
    above = Math.max(3, Math.round(span / 8)); // mapas grandes têm janela maior
  const list = levelsOf(slug),
    near = list.filter((x) => x.lv >= pl - below && x.lv <= pl + above);
  const pool = near.length
    ? near
    : [
        list.reduce((a, b) =>
          Math.abs(b.lv - pl) < Math.abs(a.lv - pl) ? b : a,
        ),
      ];
  return pool[Math.floor(Math.random() * pool.length)];
}
// aplica a dificuldade extra do Reino (além dos multiplicadores de sub-chefe/chefe)
export function temper(m: Mon, hpMul: number, atkMul: number): Mon {
  const hp = Math.round(m.hp * hpMul);
  return { ...m, hp, mx: hp, atk: Math.round(m.atk * atkMul) };
}
export function spawnFor(slug: string, pl: number, kind: Kind): Mon {
  const m = BESTIARY[slug];
  if (kind === "mon") {
    const x = pickMonster(slug, pl);
    return mkMonster(x.n, x.lv, "mon");
  }
  const list = kind === "sub" ? m.sub : m.boss;
  return mkMonster(
    list[Math.floor(Math.random() * list.length)],
    clamp(pl + (kind === "sub" ? 2 : 5), m.lo, 200),
    kind,
  );
}
