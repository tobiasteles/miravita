// ───── ÁRVORE DE PODERES: 12 degraus iguais para as 10 classes (balanceamento) ─────
// No Academia o jogador APRENDE vários poderes, mas na luta só usa 4 (o "loadout"). Os 12 degraus seguem o Monitor Estelar:
//  1 Novato d · 2 Aprendiz e · 3 Aspirante b · 4 Médio dot · 5 Especialista bq · 6 Expert d · 7 Expert Avançado st
//  8 Autoridade e+ · 9 Superior ag · 10 Mestre d · 11 Mestre Avançado d · 12 Grande Mestre nuke
// Tipos: d dano · dot dano + dano contínuo · bq dano + Quebra de Guarda (inimigo perde 65% da defesa por 3 turnos)
//        st dano + 40% de atordoar · b buff de Poderio ×1,5 por 3 turnos · e Véu Intangível (60% de esquiva)
//        ag Barreira Aegis (escudo) · sv invocação (ataca 3 turnos; só Invocador, Dominador, Humano e Caçador) · nuke Grande Mestre (condicional)
export type SkT = "d" | "dot" | "bq" | "st" | "b" | "e" | "ag" | "sv" | "nuke";
export type Sk = {
  n: string; lv: number; p: number; c: number; /* custo de EA em % da EA MÁXIMA (escala sozinho com a INT) */ pa: number; t: SkT; tier: string; d: string;
  cr?: number; // +% de Chance de Ruptura neste golpe
  hp?: number; // custa % do HP MÁXIMO
  hpCur?: number; // custa % do HP ATUAL (Grande Mestre)
  allMp?: boolean; // consome toda a EA
  req?: { i: number; n: number }; // só pode ser usado se o poder de índice i já foi usado n vezes NESTA batalha
  x?: number; // parâmetro extra (turnos do Véu, etc.)
};
export const TIERS = ["Novato", "Aprendiz", "Aspirante", "Médio", "Especialista", "Expert", "Expert Avançado", "Autoridade", "Superior", "Mestre", "Mestre Avançado", "Grande Mestre"] as const;
export const SK_LV = [1, 8, 20, 35, 50, 70, 90, 110, 130, 150, 170, 190];
export const learnCost = (i: number) => (i === 0 ? 0 : Math.round(120 * 1.9 ** i)); // ouro para aprender no Academia
export const LOADOUT_SIZE = 4;

// modelo por degrau: [tipo, poder, EA, PA, extras]
type Row = [SkT, number, number, number, Partial<Sk>?];
const STD: Row[] = [
  ["d", 1, 0, 15], ["e", 0, 3, 25, { x: 3 }], ["b", 0, 4, 30], ["dot", 1.6, 6, 30],
  ["bq", 2, 8, 35], ["d", 3.4, 10, 40, { cr: 25 }], ["st", 2.6, 12, 45], ["e", 0, 14, 40, { x: 4 }],
  ["ag", 0, 17, 40], ["d", 7.5, 22, 55], ["d", 10.5, 28, 65], ["nuke", 28, 0, 90, { allMp: true, hpCur: 0.5, req: { i: 10, n: 2 } }],
];
const SUM: Row[] = STD.map((r, i) => (i === 3 ? ["sv", 0.95, 6, 30] : i === 6 ? ["sv", 1.1, 12, 45] : i === 9 ? ["sv", 2.6, 22, 55] : i === 10 ? ["sv", 3.7, 28, 65] : r) as Row);

const NAMES: Record<string, string[]> = {
  // ─── Combatentes ───
  fisica: ["Ataque Flash", "Passo Ilusório", "Revolta", "Chama Solar", "Rasgo de Antimatéria", "Espada Relâmpago", "Grito da Espada", "Voar", "Égide Estelar", "Disparo Atômico", "Brilho Atômico", "Cataclismo Cósmico"],
  matematica: ["Corte Linear", "Passo Tangente", "Postura Áurea", "Série Divergente", "Quebra Axiomática", "Arco de Pi", "Limite Impossível", "Assíntota Eterna", "Égide Euclidiana", "Singularidade Fractal", "Infinito Cortante", "Constante Universal"],
  quimica: ["Lâmina Ácida", "Névoa Catalítica", "Banho Catalisador", "Veneno Molecular", "Corrosão Total", "Reação Exotérmica", "Precipitado Paralisante", "Vapor Volátil", "Barreira de Sal", "Explosão Elemental", "Fusão Nuclear", "Reação em Cadeia"],
  // ─── Conjuradores ───
  portugues: ["Rajada de Runa", "Silêncio Fugaz", "Canto de Poder", "Maldição Rúnica", "Palavra Quebra-Escudo", "Tempestade Arcana", "Voz Paralisante", "Eco Etéreo", "Muralha Sintática", "Cataclismo Rúnico", "Gênese Arcana", "Verbo Final"],
  ingles: ["Runa Estrangeira", "Passo Profético", "Aura Global", "Presságio Sombrio", "Selo Quebra-Barreira", "Tradução Letal", "Sentença Imutável", "Visão do Amanhã", "Égide da Profecia", "Runa Universal", "Palavra Primordial", "Apocalipse Revelado"],
  artes: ["Pincelada de Luz", "Camuflagem Perfeita", "Paleta Ardente", "Tinta Corrosiva", "Contraste Cortante", "Espectro Cromático", "Flash Ofuscante", "Miragem Total", "Moldura de Prisma", "Aquarela Devastadora", "Galeria Infinita", "Obra-Prima Final"],
  // ─── Invocadores (sv nos degraus 4, 7, 10 e 11) ───
  historia: ["Golpe do Grimório", "Passo Espectral", "Pacto das Eras", "Sábio Espectral", "Relíquia Ancestral", "Eco Ancestral", "Rainha Dourada", "Véu dos Séculos", "Escudo dos Legados", "Marechal Espectral", "Rei Conquistador", "Fim das Eras"],
  geografia: ["Estilhaço de Rocha", "Passo Sísmico", "Muralha de Relevo", "Golem de Pedra", "Tremor Tectônico", "Avalanche", "Elemental da Tempestade", "Neblina da Serra", "Fortaleza Continental", "Titã Tectônico", "Colosso Vulcânico", "Cataclismo Tectônico"],
  filosofia: ["Questionamento", "Ceticismo", "Aura da Razão", "Sombra do Sábio", "Dialética", "Colapso Ideológico", "Espectro Estrategista", "Ataraxia", "Imperativo Categórico", "Avatar da Razão", "Entidade Utópica", "Paradoxo Final"],
  biologia: ["Mordida Feral", "Passo Felino", "Instinto Predador", "Enxame Infeccioso", "Garra Perfurante", "Surto Evolutivo", "Predador Alfa", "Camuflagem Selvagem", "Casulo de Quitina", "Raízes Venenosas", "Fera Ancestral", "Extinção em Massa"],
};
const SUMMONER = ["historia", "geografia", "filosofia", "biologia"];
const DESC: Record<SkT, (s: Sk) => string> = {
  d: (s) => `dano ×${s.p}${s.cr ? ` · +${s.cr}% Ruptura` : ""}`,
  dot: (s) => `dano ×${s.p} + dano contínuo por 3 turnos`,
  bq: (s) => `dano ×${s.p} + Quebra de Guarda (inimigo perde 65% da defesa, 3 turnos)`,
  st: (s) => `dano ×${s.p} + 40% de atordoar (cancela golpes carregados)`,
  b: () => "Poderio ×1,5 por 3 turnos",
  e: (s) => `Véu Intangível: 60% de esquiva por ${s.x ?? 3} turnos${(s.x ?? 3) > 3 ? " + Sifão Vital 12%" : ""}`,
  ag: () => "Barreira Aegis: escudo de 30% do HP máx. por 4 turnos + 15% de Retaliação",
  sv: (s) => `invoca um aliado que ataca 3 turnos (×${s.p} por ataque)`,
  nuke: (s) => `×${s.p} + EA gasta · consome TODA a EA e 50% do HP atual · só após usar o poder #11 duas vezes na batalha`,
};
export const SKILLS: Record<string, Sk[]> = Object.fromEntries(
  Object.entries(NAMES).map(([cls, names]) => {
    const tpl = SUMMONER.includes(cls) ? SUM : STD;
    const list: Sk[] = names.map((n, i) => {
      const [t, p, c, pa, ex] = tpl[i];
      const s: Sk = { n, t, p, c, pa, lv: SK_LV[i], tier: TIERS[i], d: "", ...(ex ?? {}) };
      s.d = DESC[t](s);
      return s;
    });
    return [cls, list];
  }),
);
export const SUMMONS: Record<string, never[]> = {}; // compatibilidade: as invocações agora são poderes (tipo "sv") da árvore
