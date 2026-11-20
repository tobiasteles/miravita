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

// prédios da cidade (por id do ponto clicável)
export const spotsEn: Record<string, { label: string; merchant: string; line: string }> = {
  ferreiro: { label: "Blacksmith", merchant: "Tobias the Blacksmith", line: "Weapons and armor forged from the 5 elements!" },
  instrutor: { label: "Academy", merchant: "Master Instructor", line: "Learn techniques from every class." },
  reino: { label: "Realm Portal", merchant: "Portal Keeper", line: "Only the bravest cross the Realm." },
  oficial: { label: "Town Official", merchant: "Town Official", line: "New quests every day!" },
  guilda: { label: "Guild", merchant: "Guildmaster", line: "Join allies and form parties." },
  conveniencia: { label: "Convenience Store", merchant: "Doctor Vex", line: "Potions, magic weapons, battle suits and reagents." },
  atividades: { label: "Activities", merchant: "Adventurer Guide", line: "Expeditions, digging and the laboratory: everything to do while the Realm is closed." },
  arena: { label: "PvP Arena", merchant: "Arena Master", line: "Duel other players' ghosts and climb the ranking!" },
  forja: { label: "Backpack & Forge", merchant: "Hakim of Relics", line: "Store your items and forge equipment." },
  taverna: { label: "Tavern", merchant: "Dame Ember", line: "Rest up! Fully restores your HP and AE." },
  portoes: { label: "City Gate", merchant: "Captain of the Guard", line: "Hunt non-stop, or travel to another map. Talk to me!" },
};
export const mapsEn: Record<string, string> = {
  "planicie-de-aurora": "Aurora Plains", "floresta-sussurrante": "Whispering Forest", "deserto-cinzento": "Gray Desert",
  "montanha-de-ferro": "Iron Mountain", "pantano-radioativo": "Gloomy Swamp", "abismo-do-cacador": "Hunter's Abyss",
};
export const biomesEn: Record<string, string> = { planicie: "plains", floresta: "forest", deserto: "desert", montanha: "mountain", pantano: "swamp", abismo: "abyss" };
// reinos, pelo nome em português (chave estável do jogo)
export const realmsEn: Record<string, { name: string; tagline: string }> = {
  "Reino da Tempestade Eterna": { name: "Realm of the Eternal Storm", tagline: "Lightning that never stops falling." },
  "Reino do Pântano Afogado": { name: "Realm of the Drowned Swamp", tagline: "The forest swallowed by its own water." },
  "Reino de Vidro Partido": { name: "Realm of Shattered Glass", tagline: "Dunes that turned into cutting mirrors." },
  "Reino da Sucata Viva": { name: "Realm of Living Scrap", tagline: "Twisted metal that still moves." },
  "Reino da Névoa Congelada": { name: "Realm of the Frozen Mist", tagline: "Freezing fog that snuffs out all light." },
  "Reino Cósmico do Vazio": { name: "Cosmic Realm of the Void", tagline: "Near-zero gravity and black holes lurking." },
};
// elementos químicos: índice = número atômico − 1
export const elementsEn = ["Hydrogen","Helium","Lithium","Beryllium","Boron","Carbon","Nitrogen","Oxygen","Fluorine","Neon","Sodium","Magnesium","Aluminum","Silicon","Phosphorus","Sulfur","Chlorine","Argon","Potassium","Calcium","Scandium","Titanium","Vanadium","Chromium","Manganese","Iron","Cobalt","Nickel","Copper","Zinc","Gallium","Germanium","Arsenic","Selenium","Bromine","Krypton","Rubidium","Strontium","Yttrium","Zirconium","Niobium","Molybdenum","Technetium","Ruthenium","Rhodium","Palladium","Silver","Cadmium","Indium","Tin","Antimony","Tellurium","Iodine","Xenon","Cesium","Barium","Lanthanum","Cerium","Praseodymium","Neodymium","Promethium","Samarium","Europium","Gadolinium","Terbium","Dysprosium","Holmium","Erbium","Thulium","Ytterbium","Lutetium","Hafnium","Tantalum","Tungsten","Rhenium","Osmium","Iridium","Platinum","Gold","Mercury","Thallium","Lead","Bismuth","Polonium","Astatine","Radon","Francium","Radium","Actinium","Thorium","Protactinium","Uranium","Neptunium","Plutonium","Americium","Curium","Berkelium","Californium","Einsteinium","Fermium","Mendelevium","Nobelium","Lawrencium","Rutherfordium","Dubnium","Seaborgium","Bohrium","Hassium","Meitnerium","Darmstadtium","Roentgenium","Copernicium","Nihonium","Flerovium","Moscovium","Livermorium","Tennessine","Oganesson"];
