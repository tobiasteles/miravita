// Eventos de CENA gravados pelo servidor em BState.fx a cada ação (só descrição visual: nunca entram em regra, dano ou recompensa).
// O cliente os anima em 3D (components/stage) e ignora se estiver no modo 2D.
export type Who = "me" | "foe" | "summon";
export type StageEvent =
  | { k: "hit" | "crit"; from: Who; to: Who; d?: number; el?: string } // el: cor "#rrggbb" ou categoria química
  | { k: "dodge"; from: Who; to: Who }
  | { k: "heal"; to: Who; d?: number }
  | { k: "skill"; from: Who; el?: string }
  | { k: "summon"; el?: string }
  | { k: "win" | "lose" | "flee" };
