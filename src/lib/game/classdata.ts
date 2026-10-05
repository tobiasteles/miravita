export type Sk = { n: string; lv: number; p: number; c: number; t: "d" | "b" | "c" | "dot" | "e" | "st"; cr?: number; hp?: number };
// escada igual para todas as classes (balanceamento): 1 básica, 2 média, 3 avançada, 4 utilidade, 5 explosão máxima, 6 último recurso (custa 30% do HP)
const LV = [1, 10, 30, 60, 100, 160], P = [1, 1.6, 2.4, 1.1, 5, 12], C = [0, 10, 20, 35, 60, 80];
// tipos: d dano · dot dano + queimadura/veneno 3 turnos · b buff de ATK · c maldição (inimigo -40% dano) · e esquiva + ATK (teletransporte/ilusão) · st dano + 40% de atordoar
const ladder = (x: [string, Sk["t"]][]): Sk[] => x.map(([n, t], i) => ({ n, t, lv: LV[i], c: C[i], p: t === "b" || t === "e" ? 0 : t === "c" ? .8 : P[i], ...(i === 2 && t === "d" ? { cr: 1 } : {}), ...(i === 5 ? { hp: .3 } : {}) }));
export const SKILLS: Record<string, Sk[]> = {
  matematica: ladder([["Corte Geométrico", "d"], ["Trajetória Calculada", "d"], ["Ângulo Morto", "d"], ["Postura Perfeita", "b"], ["Equação Final", "d"], ["Último Recurso: Teorema Final", "d"]]),
  fisica: ladder([["Impacto Cinético", "d"], ["Golpe Flamejante", "dot"], ["Disparo Atômico", "d"], ["Salto Quântico", "e"], ["Brilho Atômico", "d"], ["Último Recurso: Fusão Atômica", "d"]]),
  quimica: ladder([["Lâmina Ácida", "d"], ["Veneno Molecular", "dot"], ["Reação Exotérmica", "dot"], ["Banho Catalisador", "b"], ["Explosão Elemental", "d"], ["Último Recurso: Reação em Cadeia", "d"]]),
  portugues: ladder([["Rajada de Runa", "d"], ["Maldição Rúnica", "c"], ["Tempestade Arcana", "d"], ["Canto de Poder", "b"], ["Cataclismo Rúnico", "d"], ["Último Recurso: Gênese Arcana", "d"]]),
  literatura: ladder([["Projeção Passada", "d"], ["Corrente de Romantismo", "st"], ["Metáfora Cortante", "d"], ["Véu da Ilusão", "e"], ["Barroco Devastador", "d"], ["Último Recurso: Epílogo Eterno", "d"]]),
  ingles: ladder([["Runa Estrangeira", "d"], ["Selo Quebra-Barreira", "c"], ["Tradução Letal", "d"], ["Aura Global", "b"], ["Runa Universal", "d"], ["Último Recurso: Palavra Primordial", "d"]]),
  artes: ladder([["Pincelada de Luz", "d"], ["Flash Ofuscante", "st"], ["Contraste Cortante", "d"], ["Camuflagem Perfeita", "e"], ["Espectro Cromático", "d"], ["Último Recurso: Obra-Prima Final", "d"]]),
  historia: ladder([["Golpe do Grimório", "d"], ["Relíquia Ancestral", "d"], ["Eco Ancestral", "d"], ["Pacto das Eras", "b"], ["Cataclismo Imperial", "d"], ["Último Recurso: Fim das Eras", "d"]]),
  geografia: ladder([["Estilhaço de Rocha", "d"], ["Tremor Tectônico", "st"], ["Avalanche", "d"], ["Muralha de Relevo", "b"], ["Tempestade Continental", "d"], ["Último Recurso: Cataclismo Tectônico", "d"]]),
  filosofia: ladder([["Questionamento", "d"], ["Dúvida Existencial", "c"], ["Dialética", "d"], ["Aura da Razão", "b"], ["Colapso Ideológico", "d"], ["Último Recurso: Paradoxo Final", "d"]]),
  biologia: ladder([["Mordida Feral", "d"], ["Esporos Infecciosos", "dot"], ["Raiz Venenosa", "dot"], ["Instinto Predador", "b"], ["Surto Evolutivo", "d"], ["Último Recurso: Pandemia", "d"]]),
};
const SM = (n: string[]) => n.map((x, i) => ({ n: x, lv: [1, 30, 60, 120][i], p: [.7, 1, 1.5, 2.4][i], c: [20, 35, 55, 85][i] }));
export const SUMMONS: Record<string, { n: string; lv: number; p: number; c: number }[]> = {
  historia: SM(["Sábio Espectral", "Rainha Dourada", "Marechal Espectral", "Rei Conquistador"]), geografia: SM(["Golem de Pedra", "Elemental da Tempestade", "Titã Tectônico", "Colosso Vulcânico"]),
  filosofia: SM(["Sombra do Sábio", "Espectro Estrategista", "Avatar da Razão", "Entidade Utópica"]), biologia: SM(["Enxame Infeccioso", "Predador Alfa", "Raízes Venenosas", "Fera Ancestral"]),
};
