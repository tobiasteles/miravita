// Conteúdo do jogo em inglês, por slug/chave (sem duplicar linhas no banco). Sem entrada = cai no pt-BR.
export const classesEn: Record<string, { name: string; desc: string }> = {
  matematica: { name: "Constant", desc: "A swordsman of absolute precision: angles, trajectories and calculated strikes that never miss their mark." },
  fisica: { name: "Stellar Monitor", desc: "A cosmic knight: stellar energy, lightning, flight and atomic blasts." },
  quimica: { name: "Elemental", desc: "An alchemist swordsman: a blade bathed in fire, acid and poison. Infuses elements of the periodic table into every technique." },
  portugues: { name: "Orator", desc: "A mage of words: runes, syntax barriers and volleys of verbs." },
  ingles: { name: "Oracle", desc: "A seer of ancient tongues: prophecies, seals and runes that shatter barriers." },
  artes: { name: "Illusionist", desc: "A mage of light and color: mirages, prisms and illusions that blind and confuse." },
  historia: { name: "Summoner", desc: "Calls the spirits of warriors and kings from ages past to fight at your side." },
  geografia: { name: "Geomancer", desc: "Commands terrain and weather: stone golems, storms and volcanic colossi." },
  filosofia: { name: "Thinker", desc: "A master of ideas: conceptual projections, paradoxes and the power of reason." },
  biologia: { name: "Hunter", desc: "An evolutionary predator: beasts, swarms and venomous roots fight beside you and bring down bosses." },
};
export const blocksEn: Record<string, string> = { melee: "Swordsmen (melee)", mage: "Mages (casters)", summoner: "Summoners" };
export const traitsEn: Record<string, { name: string; desc: string }> = {
  analitico: { name: "Analytical", desc: "+5% Rupture chance" },
  empatico: { name: "Empathic", desc: "+15% HP" },
  criativo: { name: "Creative", desc: "+20% AE" },
  resiliente: { name: "Resilient", desc: "+12% defense" },
};
