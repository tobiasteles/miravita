// ───── CIDADE INTERATIVA (estilo DDTank) ─────
// Coordenadas em % de um quadro 16:10 (1600×1000). TODOS os mapas usam o mesmo layout: só muda o background (public/town/<slug>.png).
// x,y = centro do prédio · w,h = tamanho da área clicável. Se quiser ajustar um prédio, mexa só aqui.
import type { IconName } from "@/components/game/GameIcon";
export type SpotKind = "link" | "rest" | "hunt" | "gate" | "realm" | "soon";
export type Spot = {
  id: string;
  label: string; // texto que aparece sobre o prédio
  icon: IconName;
  merchant: string; // nome do mercador (aparece no balão)
  npc: string; // retrato em public/npcs/<npc>.png (opcional)
  line: string; // fala do mercador
  x: number;
  y: number;
  w: number;
  h: number;
  kind: SpotKind;
  href?: string;
  glow: string; // cor do brilho no hover
};

export const SPOTS: Spot[] = [
  // ── fileira de cima ──
  { id: "ferreiro", label: "Ferreiro", icon: "anvil", merchant: "Tobias, o Ferreiro", npc: "tobias-ferreiro", line: "Armas e armaduras forjadas com os 5 elementos!", x: 15, y: 25, w: 16, h: 24, kind: "link", href: "/shop/equipamentos", glow: "#f43f5e" },
  { id: "instrutor", label: "Academia", icon: "book", merchant: "Mestre Instrutor", npc: "mestre-instrutor", line: "Aprenda técnicas de todas as classes.", x: 31, y: 21, w: 15, h: 22, kind: "link", href: "/skills", glow: "#22d3ee" },
  { id: "reino", label: "Portal do Reino", icon: "portal", merchant: "Guardião do Portal", npc: "guardiao-do-portal", line: "Só os mais corajosos cruzam o Reino.", x: 50, y: 21, w: 22, h: 34, kind: "realm", glow: "#a78bfa" },
  { id: "oficial", label: "Oficial da Cidade", icon: "scroll", merchant: "Oficial da Cidade", npc: "oficial-da-cidade", line: "Missões novas todos os dias!", x: 69, y: 23, w: 16, h: 24, kind: "link", href: "/quests", glow: "#fbbf24" },
  { id: "guilda", label: "Guilda", icon: "shield", merchant: "Mestre da Guilda", npc: "mestre-da-guilda", line: "Junte-se a aliados e crie grupos.", x: 87, y: 27, w: 17, h: 26, kind: "link", href: "/guild", glow: "#8b5cf6" },
  // ── fileira do meio (o centro é a praça, sem prédio) ──
  { id: "conveniencia", label: "Conveniência", icon: "flask", merchant: "Doutor Vex", npc: "doutor-vex", line: "Poções, armas mágicas, trajes de batalha e reagentes.", x: 13, y: 54, w: 16, h: 22, kind: "link", href: "/shop/conveniencia", glow: "#34d399" },
  { id: "atividades", label: "Atividades", icon: "pick", merchant: "Guia Aventureiro", npc: "guia-aventureiro", line: "Expedições, escavação e laboratório: tudo para fazer com o Reino fechado.", x: 31, y: 58, w: 15, h: 20, kind: "link", href: "/atividades", glow: "#34d399" },
  { id: "arena", label: "Combate PvP", icon: "swords", merchant: "Mestre da Arena", npc: "mestre-da-arena", line: "Em breve: duelos entre jogadores!", x: 78, y: 56, w: 26, h: 30, kind: "soon", glow: "#ef4444" },
  // ── fileira de baixo ──
  { id: "forja", label: "Mochila e Forja", icon: "backpack", merchant: "Hakim das Relíquias", npc: "hakim-reliquias", line: "Guarde seus itens e forje equipamentos.", x: 15, y: 81, w: 16, h: 20, kind: "link", href: "/inventory", glow: "#fbbf24" },
  { id: "taverna", label: "Taverna", icon: "mug", merchant: "Dona Brasa", npc: "dona-brasa", line: "Descanse! Recupera todo o seu HP e EA.", x: 35, y: 81, w: 16, h: 20, kind: "rest", glow: "#f472b6" },
  { id: "portoes", label: "Portão da Cidade", icon: "castle", merchant: "Capitão dos Guardas", npc: "capitao-dos-guardas", line: "Saia para caçar sem parar, ou viaje para outro mapa. Fale comigo!", x: 55, y: 85, w: 22, h: 20, kind: "gate", href: "/gate", glow: "#ef4444" },
];

// posição de cada mapa no MAPA-MÚNDI (% de um quadro 16:10) — public/world/mapa-mundi.png
export const WORLD_PINS: Record<string, { x: number; y: number }> = {
  "planicie-de-aurora": { x: 14, y: 78 },
  "floresta-sussurrante": { x: 30, y: 54 },
  "deserto-cinzento": { x: 52, y: 76 },
  "montanha-de-ferro": { x: 68, y: 50 },
  "pantano-radioativo": { x: 46, y: 26 },
  "abismo-do-cacador": { x: 82, y: 20 },
};
