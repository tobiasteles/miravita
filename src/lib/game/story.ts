import { monsterXp } from "./xp";
// ───── tipos ─────
export type Item =
  | { g: "gear"; z: number; k: "arma" | "armadura" }
  | { g: "cons"; k: "hp" | "ea" | "tp"; n: number }
  | { g: "mat"; z: number; n: number };
export type Reward = { xpB: number; gold: number; items?: Item[] };
export const ZN: Record<number, string> = {
  26: "Ferro",
  29: "Cobre",
  22: "Titânio",
  47: "Prata",
  79: "Ouro",
  78: "Platina",
  76: "Ósmio",
  77: "Irídio",
  92: "Urânio",
  94: "Plutônio",
};
const ZR: Record<number, string> = {
  26: "comum",
  29: "raro",
  22: "raro",
  47: "raro",
  79: "raro",
  78: "épico",
  76: "épico",
  77: "épico",
  92: "lendário",
  94: "lendário",
};
export const CN = {
  hp: "Poção de HP",
  ea: "Poção de EA",
  tp: "Pedra de Teletransporte",
};
export const MAPN: Record<string, string> = {
  "planicie-de-aurora": "Planície de Aurora",
  "floresta-sussurrante": "Floresta Sussurrante",
  "deserto-cinzento": "Deserto Cinzento",
  "montanha-de-ferro": "Montanha de Ferro",
  "pantano-radioativo": "Pântano Sombrio",
  "abismo-do-cacador": "Abismo do Caçador",
};
const W = (z: number, k: "arma" | "armadura"): Item => ({ g: "gear", z, k });

// ───── HISTÓRIA: 12 episódios, como uma temporada de anime (3 arcos = os 3 graus das técnicas) ─────
// Cada capítulo exige NÍVEL para começar e um OBJETIVO de jogo (caçar ou fechar Portais) para concluir. Recompensas: itens, inclusive raros.
export const STORY = [
  {
    id: "f1",
    tier: "Fundamental",
    lv: 1,
    t: "O Mais Fraco da Turma",
    s: "Você é o último da turma da Academia Miravita: despertou tarde, a sua Aura mal acende e as aulas de campo servem para carregar a mochila dos colegas. Hoje, na Planície de Aurora, até um monstro fraco é um desafio. Mostre à Mestra Lúmen que você consegue ficar de pé.",
    h: "Uma Fenda dupla se abre onde não deveria existir nenhuma.",
    obj: { t: "kill", slug: "planicie-de-aurora", n: 5 },
    rw: { xpB: 10, gold: 60, items: [{ g: "cons", k: "hp", n: 3 }] },
  },
  {
    id: "f2",
    tier: "Fundamental",
    lv: 5,
    t: "A Fenda Dupla",
    s: "A Fenda esconde uma segunda câmara cheia de estátuas que se movem. A equipe de Lúmen cai uma a uma e você fica de pé por último, ferido, ao lado de Mira. No limite, uma voz oferece uma segunda chance.",
    h: "Ao acordar, uma janela de luz paira sobre a sua cama: “Missão Diária disponível”.",
    obj: { t: "portal", slug: "planicie-de-aurora", n: 1 },
    rw: {
      xpB: 16,
      gold: 100,
      items: [{ g: "cons", k: "tp", n: 2 }, W(26, "armadura")],
    },
  },
  {
    id: "f3",
    tier: "Fundamental",
    lv: 10,
    t: "Parece um Jogo",
    s: "Uma janela de luz que só você enxerga passa a lhe dar missões diárias (as da aba Missões), e quem as ignora paga caro. Antes do amanhecer, enquanto a turma dorme, você treina na Floresta Sussurrante e sobe de nível a cada semana. Kael, o prodígio da turma, percebe que algo mudou.",
    h: "Os examinadores encontram uma marca estranha no seu braço.",
    obj: { t: "kill", slug: "floresta-sussurrante", n: 20 },
    rw: {
      xpB: 22,
      gold: 160,
      items: [W(29, "arma"), { g: "cons", k: "ea", n: 3 }],
    },
  },
  {
    id: "f4",
    tier: "Fundamental",
    lv: 30,
    t: "O Fragmento",
    s: "A marca é um fragmento do poder do Soberano Ignotus, selado há séculos, e agora vive em você. O Conselho quer lacrá-lo; Lúmen negocia um prazo: passe no Exame de Grau no Deserto Cinzento e prove que controla o fragmento. Falhar significa ser selado.",
    h: "Quem passa no exame ganha o Grau Médio, e um rival que não aceita perder.",
    obj: { t: "portal", slug: "deserto-cinzento", n: 1 },
    rw: {
      xpB: 35,
      gold: 400,
      items: [W(22, "arma"), { g: "cons", k: "hp", n: 5 }],
    },
  },
  {
    id: "m1",
    tier: "Médio",
    lv: 50,
    t: "Aula de Campo",
    s: "No Grau Médio, você forma um trio com Kael e Mira e recebe a primeira missão oficial: limpar as dunas onde sumiram três equipes. Entre as técnicas da Academia e o fragmento que sussurra, aprender a escolher quem comanda a sua Aura é a lição mais difícil.",
    h: "O Torneio das Escolas começa, e Kael quer derrotar você diante de todos.",
    obj: { t: "kill", slug: "deserto-cinzento", n: 40 },
    rw: {
      xpB: 40,
      gold: 700,
      items: [W(47, "armadura"), { g: "cons", k: "tp", n: 2 }],
    },
  },
  {
    id: "m2",
    tier: "Médio",
    lv: 60,
    t: "Torneio das Escolas",
    s: "As escolas rivais se enfrentam na Montanha de Ferro, e o duelo com Kael divide a plateia. No meio do combate, uma Fenda invade o torneio e solta monstros nas arquibancadas. Rivais viram aliados para proteger quem não sabe lutar.",
    h: "Entre os escombros, alguém vê Lúmen conversando com um vulto encapuzado.",
    obj: { t: "kill", slug: "montanha-de-ferro", n: 30 },
    rw: { xpB: 45, gold: 900, items: [W(79, "arma")] },
  },
  {
    id: "m3",
    tier: "Médio",
    lv: 90,
    t: "A Prova Oculta",
    s: "Duas Fendas se abrem e, na mais profunda, você enfrenta uma prova que só aparece para quem carrega um fragmento: ela revela a sua classe oculta. Ao sair, Lúmen confessa que foi aprendiz de Ignotus e que abriu a primeira Fenda. Mira, ferida, desaparece na névoa.",
    h: "Todas as pistas apontam para o Pântano Sombrio.",
    obj: { t: "portal", slug: "montanha-de-ferro", n: 2 },
    rw: {
      xpB: 60,
      gold: 1500,
      items: [W(78, "arma"), { g: "mat", z: 79, n: 5 }],
    },
  },
  {
    id: "m4",
    tier: "Médio",
    lv: 100,
    t: "Levante-se",
    s: "Procurando Mira no Pântano Sombrio, você nota que os monstros derrotados deixam sombras que se curvam diante de você. A primeira delas ergue a cabeça, ajoelha e se junta a você: nasce o seu exército de Sombras. O fragmento ri baixinho dentro de você.",
    h: "A Academia promete uma promoção histórica, mas esconde um diário.",
    obj: { t: "kill", slug: "pantano-radioativo", n: 50 },
    rw: {
      xpB: 70,
      gold: 2000,
      items: [W(78, "armadura"), { g: "cons", k: "ea", n: 5 }],
    },
  },
  {
    id: "s1",
    tier: "Superior",
    lv: 120,
    t: "Grau Especial",
    s: "Você é promovido a Grau Especial, o mais jovem da história, mas uma Fenda se fecha por dentro com você lá dentro. Para sair, é preciso fechar três Portais seguidos. Nos destroços você acha o diário do Soberano: ele foi o primeiro Desperto e queria apagar o poder do mundo para que ninguém sofresse como ele.",
    h: "O Abismo do Caçador se abre sob a Academia.",
    obj: { t: "portal", slug: "pantano-radioativo", n: 3 },
    rw: {
      xpB: 90,
      gold: 4000,
      items: [W(76, "arma"), { g: "cons", k: "tp", n: 5 }],
    },
  },
  {
    id: "s2",
    tier: "Superior",
    lv: 150,
    t: "A Descida",
    s: "No Abismo, Ceifadores de Portais surgem com o rosto de quem você não conseguiu salvar. No limite, a sua Aura transborda e cria uma barreira onde só as suas regras valem: a Expansão Arcana desperta pela primeira vez.",
    h: "Kael e Mira chegam, mas algo maior ouviu o seu chamado.",
    obj: { t: "kill", slug: "abismo-do-cacador", n: 50 },
    rw: {
      xpB: 110,
      gold: 7000,
      items: [W(76, "armadura"), { g: "mat", z: 77, n: 3 }],
    },
  },
  {
    id: "s3",
    tier: "Superior",
    lv: 170,
    t: "O Exército de Sombras",
    s: "Com Kael e Mira ao lado, você comanda as suas Sombras e fecha os Portais do Abismo um a um. Mas cada Fenda fechada revela uma maior, e do fundo vem uma voz paciente: “Eu estava esperando por você.”",
    h: "Em um trono vazio, o Soberano abre os olhos.",
    obj: { t: "portal", slug: "abismo-do-cacador", n: 3 },
    rw: { xpB: 130, gold: 10000, items: [W(77, "arma"), W(92, "armadura")] },
  },
  {
    id: "s4",
    tier: "Superior",
    lv: 200,
    t: "O Trono Vazio",
    s: "Ignotus espera sentado num trono de cristais apagados. “Escreva o fim, Desperto, ou reescreva o começo.” Cinco Portais finais separam você dele, e a sua Aura chega ao máximo: a escolha é destruir o Soberano ou herdar o trono.",
    h: "Fim da Temporada 1. A Temporada 2 depende do que você escolher.",
    obj: { t: "portal", slug: "abismo-do-cacador", n: 5 },
    rw: {
      xpB: 200,
      gold: 30000,
      items: [W(94, "arma"), W(94, "armadura"), { g: "cons", k: "tp", n: 10 }],
    },
  },
] as {
  id: string;
  tier: "Fundamental" | "Médio" | "Superior";
  lv: number;
  t: string;
  s: string;
  h: string;
  obj: { t: "kill" | "portal"; slug: string; n: number };
  rw: Reward;
}[];
export const SEASON = "Temporada 1: O Despertar Tardio";
export const ARC = {
  Fundamental: "Arco 1 · O Mais Fraco da Turma",
  Médio: "Arco 2 · A Academia de Fendas",
  Superior: "Arco 3 · O Trono Vazio",
} as const;

// ───── DIÁRIAS: reiniciam à meia-noite de Brasília; a sequência de dias aumenta os ganhos ─────
export const DAILY = [
  {
    k: "kill",
    t: "Caçada do Dia",
    s: "Derrote monstros em qualquer mapa.",
    n: 15,
    xpB: 5,
    gold: 40,
  },
  {
    k: "portal",
    t: "Fenda do Dia",
    s: "Conclua um Reino (a arena de 4 etapas) em qualquer mapa.",
    n: 1,
    xpB: 12,
    gold: 80,
  },
  {
    k: "gather",
    t: "Coleta do Dia",
    s: "Obtenha materiais com os drops das batalhas.",
    n: 6,
    xpB: 4,
    gold: 30,
  },
];
export const today = () =>
  new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
export const addDays = (d: string, n: number) =>
  new Date(Date.parse(d + "T12:00:00Z") + n * 864e5).toISOString().slice(0, 10);
export const dailyId = (d: string, k: string) => `daily:${d}:${k}`;
export const dailyList = (d: string) => {
  const w = new Date(d + "T12:00:00Z").getUTCDay(); // a meta varia com o dia da semana
  return DAILY.map((q) => ({
    ...q,
    id: dailyId(d, q.k),
    n:
      q.k === "kill"
        ? [15, 20, 25, 15, 20, 25, 30][w]
        : q.k === "gather"
          ? [6, 8, 10, 6, 8, 10, 12][w]
          : q.n,
  }));
};
export function streakOf(claimIds: string[], d: string) {
  // dias seguidos com o Baú do Dia aberto
  const days = new Set(
    claimIds.filter((x) => x.endsWith(":bonus")).map((x) => x.split(":")[1]),
  );
  let cur = days.has(d) ? d : addDays(d, -1),
    n = 0;
  while (days.has(cur)) {
    n++;
    cur = addDays(cur, -1);
  }
  return n;
}
export const mult = (streak: number) => 1 + 0.1 * Math.min(streak, 10);

// ───── texto das recompensas (para a tela) ─────
export function rwLines(rw: Reward, level: number, m = 1) {
  const xp = Math.round(
      monsterXp(Math.min(200, level + 4)) *
        rw.xpB *
        Number(process.env.XP_MULTIPLIER ?? 1) *
        m,
    ),
    gold = Math.round((rw.gold + level * 10) * m);
  return [
    `✨ ${xp.toLocaleString("pt-BR")} XP`,
    `💰 ${gold.toLocaleString("pt-BR")}`,
    ...(rw.items ?? []).map((i) =>
      i.g === "gear"
        ? `${i.k === "arma" ? "🗡️ Lâmina" : "🛡️ Armadura"} de ${ZN[i.z]} (${ZR[i.z]})`
        : i.g === "cons"
          ? `🧪 ${i.n}× ${CN[i.k]}`
          : `⛏️ ${i.n}× ${ZN[i.z]}`,
    ),
  ];
}
