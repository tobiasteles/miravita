// ───── TABELA PERIÓDICA COMPLETA (118 elementos) ─────
// [Z, símbolo, nome, massa atômica, dureza de Mohs (null = gás/líquido/desconhecido), abundância na crosta (ppm), categoria]
// Valores aproximados (jogo, não livro de química). Elementos sintéticos/instáveis têm abundância ínfima (1e-9) → viram "lendários" pelo cálculo de item-stats.
export type El = [number, string, string, number, number | null, number, string];
const A = "metal alcalino", AT = "metal alcalino-terroso", TR = "metal de transição", PT = "metal pós-transição", MD = "metaloide", NM = "não-metal", HL = "halogênio", GN = "gás nobre", LN = "lantanídeo", AC = "actinídeo", TA = "transactinídeo";
export const ELEMENTS: El[] = [
  [1, "H", "Hidrogênio", 1.008, null, 1400, NM], [2, "He", "Hélio", 4.0026, null, 0.008, GN], [3, "Li", "Lítio", 6.94, 0.6, 20, A], [4, "Be", "Berílio", 9.0122, 5.5, 2.8, AT],
  [5, "B", "Boro", 10.81, 9.3, 10, MD], [6, "C", "Carbono", 12.011, 1.5, 200, NM], [7, "N", "Nitrogênio", 14.007, null, 19, NM], [8, "O", "Oxigênio", 15.999, null, 461000, NM],
  [9, "F", "Flúor", 18.998, null, 585, HL], [10, "Ne", "Neônio", 20.18, null, 0.005, GN], [11, "Na", "Sódio", 22.99, 0.5, 23600, A], [12, "Mg", "Magnésio", 24.305, 2.5, 23300, AT],
  [13, "Al", "Alumínio", 26.98, 2.75, 82300, PT], [14, "Si", "Silício", 28.085, 6.5, 282000, MD], [15, "P", "Fósforo", 30.974, 0.5, 1050, NM], [16, "S", "Enxofre", 32.06, 2, 350, NM],
  [17, "Cl", "Cloro", 35.45, null, 145, HL], [18, "Ar", "Argônio", 39.948, null, 3.5, GN], [19, "K", "Potássio", 39.098, 0.4, 20900, A], [20, "Ca", "Cálcio", 40.078, 1.75, 41500, AT],
  [21, "Sc", "Escândio", 44.956, 2.5, 22, TR], [22, "Ti", "Titânio", 47.87, 6, 5650, TR], [23, "V", "Vanádio", 50.942, 7, 120, TR], [24, "Cr", "Cromo", 51.996, 8.5, 102, TR],
  [25, "Mn", "Manganês", 54.938, 6, 950, TR], [26, "Fe", "Ferro", 55.85, 4, 56300, TR], [27, "Co", "Cobalto", 58.933, 5, 25, TR], [28, "Ni", "Níquel", 58.693, 4, 84, TR],
  [29, "Cu", "Cobre", 63.55, 3, 60, TR], [30, "Zn", "Zinco", 65.38, 2.5, 70, TR], [31, "Ga", "Gálio", 69.723, 1.5, 19, PT], [32, "Ge", "Germânio", 72.63, 6, 1.5, MD],
  [33, "As", "Arsênio", 74.922, 3.5, 1.8, MD], [34, "Se", "Selênio", 78.971, 2, 0.05, NM], [35, "Br", "Bromo", 79.904, null, 2.4, HL], [36, "Kr", "Criptônio", 83.798, null, 0.0001, GN],
  [37, "Rb", "Rubídio", 85.468, 0.3, 90, A], [38, "Sr", "Estrôncio", 87.62, 1.8, 370, AT], [39, "Y", "Ítrio", 88.906, 3, 33, TR], [40, "Zr", "Zircônio", 91.224, 5, 165, TR],
  [41, "Nb", "Nióbio", 92.906, 6, 20, TR], [42, "Mo", "Molibdênio", 95.95, 5.5, 1.2, TR], [43, "Tc", "Tecnécio", 98, 6, 1e-9, TR], [44, "Ru", "Rutênio", 101.07, 6.5, 0.001, TR],
  [45, "Rh", "Ródio", 102.91, 6, 0.001, TR], [46, "Pd", "Paládio", 106.42, 4.75, 0.015, TR], [47, "Ag", "Prata", 107.87, 2.5, 0.075, TR], [48, "Cd", "Cádmio", 112.41, 2, 0.15, TR],
  [49, "In", "Índio", 114.82, 1.2, 0.25, PT], [50, "Sn", "Estanho", 118.71, 1.5, 2.3, PT], [51, "Sb", "Antimônio", 121.76, 3, 0.2, MD], [52, "Te", "Telúrio", 127.6, 2.25, 0.001, MD],
  [53, "I", "Iodo", 126.9, 0.7, 0.45, HL], [54, "Xe", "Xenônio", 131.29, null, 0.00003, GN], [55, "Cs", "Césio", 132.91, 0.2, 3, A], [56, "Ba", "Bário", 137.33, 1.25, 425, AT],
  [57, "La", "Lantânio", 138.91, 2.5, 39, LN], [58, "Ce", "Cério", 140.12, 2.5, 66.5, LN], [59, "Pr", "Praseodímio", 140.91, 2.5, 9.2, LN], [60, "Nd", "Neodímio", 144.24, 2.5, 41.5, LN],
  [61, "Pm", "Promécio", 145, null, 1e-9, LN], [62, "Sm", "Samário", 150.36, 2.5, 7.05, LN], [63, "Eu", "Európio", 151.96, 1.5, 2, LN], [64, "Gd", "Gadolínio", 157.25, 3, 6.2, LN],
  [65, "Tb", "Térbio", 158.93, 2.5, 1.2, LN], [66, "Dy", "Disprósio", 162.5, 2.5, 5.2, LN], [67, "Ho", "Hólmio", 164.93, 2.5, 1.3, LN], [68, "Er", "Érbio", 167.26, 2.5, 3.5, LN],
  [69, "Tm", "Túlio", 168.93, 2.5, 0.52, LN], [70, "Yb", "Itérbio", 173.05, 2.5, 3.2, LN], [71, "Lu", "Lutécio", 174.97, 2.5, 0.8, LN], [72, "Hf", "Háfnio", 178.49, 5.5, 3, TR],
  [73, "Ta", "Tântalo", 180.95, 6.5, 2, TR], [74, "W", "Tungstênio", 183.84, 7.5, 1.25, TR], [75, "Re", "Rênio", 186.21, 7, 0.0007, TR], [76, "Os", "Ósmio", 190.23, 7, 0.0015, TR],
  [77, "Ir", "Irídio", 192.22, 6.5, 0.001, TR], [78, "Pt", "Platina", 195.08, 4, 0.0025, TR], [79, "Au", "Ouro", 196.97, 2.5, 0.01, TR], [80, "Hg", "Mercúrio", 200.59, null, 0.085, TR],
  [81, "Tl", "Tálio", 204.38, 1.2, 0.85, PT], [82, "Pb", "Chumbo", 207.2, 1.5, 14, PT], [83, "Bi", "Bismuto", 208.98, 2.25, 0.0085, PT], [84, "Po", "Polônio", 209, null, 1e-9, PT],
  [85, "At", "Astato", 210, null, 1e-9, HL], [86, "Rn", "Radônio", 222, null, 1e-9, GN], [87, "Fr", "Frâncio", 223, null, 1e-9, A], [88, "Ra", "Rádio", 226, null, 9e-7, AT],
  [89, "Ac", "Actínio", 227, null, 5.5e-10, AC], [90, "Th", "Tório", 232.04, 3, 9.6, AC], [91, "Pa", "Protactínio", 231.04, null, 1.4e-6, AC], [92, "U", "Urânio", 238.03, 6, 1.8, AC],
  [93, "Np", "Netúnio", 237, null, 1e-9, AC], [94, "Pu", "Plutônio", 244, 1, 1e-6, AC], [95, "Am", "Amerício", 243, null, 1e-9, AC], [96, "Cm", "Cúrio", 247, null, 1e-9, AC],
  [97, "Bk", "Berquélio", 247, null, 1e-9, AC], [98, "Cf", "Califórnio", 251, null, 1e-9, AC], [99, "Es", "Einstênio", 252, null, 1e-9, AC], [100, "Fm", "Férmio", 257, null, 1e-9, AC],
  [101, "Md", "Mendelévio", 258, null, 1e-9, AC], [102, "No", "Nobélio", 259, null, 1e-9, AC], [103, "Lr", "Laurêncio", 266, null, 1e-9, AC], [104, "Rf", "Rutherfórdio", 267, null, 1e-9, TA],
  [105, "Db", "Dúbnio", 268, null, 1e-9, TA], [106, "Sg", "Seabórgio", 269, null, 1e-9, TA], [107, "Bh", "Bóhrio", 270, null, 1e-9, TA], [108, "Hs", "Hássio", 277, null, 1e-9, TA],
  [109, "Mt", "Meitnério", 278, null, 1e-9, TA], [110, "Ds", "Darmstádtio", 281, null, 1e-9, TA], [111, "Rg", "Roentgênio", 282, null, 1e-9, TA], [112, "Cn", "Copernício", 285, null, 1e-9, TA],
  [113, "Nh", "Nihônio", 286, null, 1e-9, TA], [114, "Fl", "Fleróvio", 289, null, 1e-9, TA], [115, "Mc", "Moscóvio", 290, null, 1e-9, TA], [116, "Lv", "Livermório", 293, null, 1e-9, TA],
  [117, "Ts", "Tenesso", 294, null, 1e-9, TA], [118, "Og", "Oganessônio", 294, null, 1e-9, TA],
];
export const ELEMENT_BY_Z = new Map(ELEMENTS.map((e) => [e[0], e]));

// ───── COMO OS ELEMENTOS ENTRAM NO JOGO ─────
// 1. DROPS: cada mapa sorteia elementos da sua "faixa de raridade" (ver world.ts). Mapas mais fundos soltam elementos mais raros.
// 2. FORJA / LOJA DO FERREIRO: qualquer elemento vira Lâmina/Elmo/Peitoral/Manoplas/Botas (já era assim, agora com os 118).
// 3. REAGENTES (Conveniência): elementos comuns (comum) à venda, baratos, para sintetizar e para a Infusão Elemental.
// 4. LABORATÓRIO (/atividades): transmutação (5× → 1 de raridade acima) e compostos que viram poções.
// 5. INFUSÃO ELEMENTAL (classe Elemental): a categoria do elemento dá um efeito extra aos poderes (ver RX_INFO em battle.ts).
