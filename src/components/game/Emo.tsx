import GameIcon, { type IconName } from "@/components/game/GameIcon";

// Troca emojis por ícones do jogo dentro de qualquer TEXTO (logs de batalha, missões, nomes de itens...).
// Uso: <Emo>{texto}</Emo>   (emoji que não estiver na lista continua aparecendo normalmente)
const MAP: Record<string, IconName> = {
  "🌀": "vortex",
  "🔒": "lock",
  "🏰": "castle",
  "✔": "check",
  "✅": "check",
  "✖": "cross",
  "✕": "cross",
  "⚡": "bolt",
  "📜": "scroll",
  "👑": "crown",
  "💰": "coin",
  "⚔️": "swords",
  "🗡️": "sword",
  "👻": "ghost",
  "🛡️": "shield",
  "🛠️": "anvil",
  "🎬": "book",
  "🎒": "backpack",
  "💬": "chat",
  "📈": "stats",
  "🗺️": "compass",
  "🪨": "ore",
  "⬆️": "arrowup",
  "▶": "play",
  "🏁": "flag",
  "🏆": "trophy",
  "🏪": "flask",
  "🔷": "crystal",
  "📍": "pin",
  "🔥": "flame",
  "🧪": "flask",
  "⭐": "star",
  "💤": "moon",
  "🧙": "spark",
  "⚙️": "gear",
  "👥": "party",
  "🚪": "door",
  "💀": "skull",
  "👘": "tunic",
  "❤": "heart",
  "🎓": "book",
  "🍺": "mug",
  "💂": "castle",
  "📅": "calendar",
  "🎁": "chest",
  "🎯": "target",
  "💥": "spark",
  "🪖": "helm",
  "🧤": "gauntlet",
  "🥾": "boots",
  "✨": "spark",
  "⛏️": "pick",
  "✒️": "quill",
  "⚠": "warn",
  "👹": "skull",
  "🐺": "skull",
  "🐍": "skull",
  "🦂": "skull",
  "🐉": "skull",
  "🦇": "skull",
  "🗿": "skull",
};
const VS = /\uFE0F/g;
const KEYS = Object.keys(MAP).map((k) => k.replace(VS, ""));
const TABLE: Record<string, IconName> = Object.fromEntries(
  Object.entries(MAP).map(([k, v]) => [k.replace(VS, ""), v]),
);
const RE = new RegExp(
  `(${KEYS.sort((a, b) => b.length - a.length).join("|")})\\uFE0F?`,
  "gu",
);

export default function Emo({ children }: { children: React.ReactNode }) {
  if (typeof children !== "string") return <>{children}</>;
  return (
    <>
      {children
        .split(RE)
        .map((p, i) =>
          i % 2 ? (
            <GameIcon key={i} name={TABLE[p]} className="mx-[.1em]" />
          ) : (
            p
          ),
        )}
    </>
  );
}
