// xpB = "valor em batalhas" de XP (monsterXp do nível × xpB). Missões principais exigem o nível; secundárias exigem entregar o item ao mercador.
export const MAIN = [
  { id: "m1", lv: 1, xpB: 15, t: "O Despertar", s: "Você acorda entre as ruínas da Grande Cidadela de Miravita, e uma aura violeta percorre seus braços. Mestra Lúmen o encontra: o poder do mundo foi despedaçado em Portais, e você é um Desperto, um dos poucos capazes de reuni-lo." },
  { id: "m2", lv: 10, xpB: 25, t: "Os Portais Famintos", s: "Na Floresta Sussurrante, um Portal engoliu a vila dos Guardiões. Dentro dele você ouve uma voz que repete o seu nome, e Lúmen empalidece. Ela não explica por quê." },
  { id: "m3", lv: 30, xpB: 30, t: "O Deserto das Runas Perdidas", s: "A Múmia Rúnica guardava o primeiro Fragmento do Cristal Primordial. Ao tocá-lo, você ouve uma frase que ninguém pronunciou ainda: 'o Soberano já sabe que você acordou'." },
  { id: "m4", lv: 60, xpB: 35, t: "O Coração de Ferro", s: "Na Montanha de Ferro, a joalheira Brunhilda forja um mapa com os Fragmentos. As marcas formam o Abismo do Caçador, o lugar onde nenhum Desperto voltou." },
  { id: "m5", lv: 90, xpB: 40, t: "A Traição de Lúmen", s: "Lúmen confessa: foi aprendiz do Soberano Ignotus, e foi ela quem abriu o primeiro Portal. Ela implora que você não a despreze. Você ainda não decidiu se vai perdoá-la." },
  { id: "m6", lv: 120, xpB: 45, t: "Cinzas do Pântano", s: "No Pântano Radioativo, o Doutor Vex mostra o diário de Ignotus. Ele foi o primeiro Desperto e apagou o poder do mundo para que ninguém mais sofresse o que ele sofreu." },
  { id: "m7", lv: 150, xpB: 50, t: "A Descida", s: "O Abismo se abre sob seus pés. Ceifadores de Portais cercam você, e cada um tem o rosto de alguém que você não conseguiu salvar. Você avança mesmo assim." },
  { id: "m8", lv: 200, xpB: 100, t: "O Despertar Final", s: "Ignotus espera sentado num trono de cristais apagados. 'Escreva o fim, Desperto, ou reescreva o começo.' Sua aura chega ao máximo, e a escolha agora é sua." },
];
export const SIDE = [
  { id: "s1", slug: "planicie-de-aurora", lv: 1, who: "Tobias, o Ferreiro", z: 26, n: 5, el: "Ferro", s: "Preciso de 5 Ferro para consertar o portão da vila.", xpB: 6 },
  { id: "s2", slug: "floresta-sussurrante", lv: 10, who: "Irmã Selene, herbalista", z: 13, n: 5, el: "Alumínio", s: "Traga 5 Alumínio para os meus caldeirões.", xpB: 8 },
  { id: "s3", slug: "deserto-cinzento", lv: 30, who: "Hakim, mercador de relíquias", z: 82, n: 5, el: "Chumbo", s: "Quero 5 Chumbo para selar caixas de relíquias.", xpB: 10 },
  { id: "s4", slug: "montanha-de-ferro", lv: 60, who: "Brunhilda, joalheira", z: 47, n: 5, el: "Prata", s: "Cinco Prata e eu faço sua próxima runa de graça.", xpB: 12 },
  { id: "s5", slug: "pantano-radioativo", lv: 100, who: "Doutor Vex", z: 79, n: 3, el: "Ouro", s: "3 Ouro para o meu detector de anomalias.", xpB: 14 },
  { id: "s6", slug: "abismo-do-cacador", lv: 150, who: "Mercador Sem-Nome", z: 78, n: 3, el: "Platina", s: "Ninguém me vê aqui. 3 Platina e eu também não vi você.", xpB: 16 },
];
export const KILL = [
  { id: "k1", slug: "planicie-de-aurora", lv: 1, n: 20, t: "Caçada: Pragas da Planície", s: "Os monstros da Planície de Aurora cercam a vila. Derrote 20.", xpB: 8 },
  { id: "k2", slug: "floresta-sussurrante", lv: 10, n: 30, t: "Caçada: O Sussurro das Raízes", s: "A floresta está inquieta. Derrote 30 criaturas dela.", xpB: 10 },
  { id: "k3", slug: "deserto-cinzento", lv: 30, n: 30, t: "Caçada: Areias Inquietas", s: "Hakim paga bem por rotas seguras. Derrote 30 monstros do deserto.", xpB: 12 },
  { id: "k4", slug: "montanha-de-ferro", lv: 60, n: 40, t: "Caçada: Ecos de Aço", s: "Brunhilda precisa das minas livres. Derrote 40 monstros da montanha.", xpB: 14 },
  { id: "k5", slug: "pantano-radioativo", lv: 100, n: 40, t: "Caçada: Névoa Tóxica", s: "O Doutor Vex mede o avanço da radiação. Derrote 40 monstros do pântano.", xpB: 16 },
  { id: "k6", slug: "abismo-do-cacador", lv: 150, n: 50, t: "Caçada: Ceifa do Abismo", s: "Cada Ceifador derrotado é um Portal a menos. Derrote 50.", xpB: 20 },
];
export const NPC: Record<string, string> = { s1: "tobias-ferreiro", s2: "irma-selene", s3: "hakim-reliquias", s4: "brunhilda-joalheira", s5: "doutor-vex", s6: "mercador-sem-nome" };
