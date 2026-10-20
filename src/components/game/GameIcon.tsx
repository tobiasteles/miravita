import type { ReactNode } from "react";

// Ícones do jogo (SVG próprio, sem biblioteca): herdam a cor do texto (currentColor) e o tamanho da fonte (1em).
// Uso: <GameIcon name="swords" />  ·  <GameIcon name="coin" className="text-amber-300" size="1.4em" />
const sword = (
  <>
    <path strokeWidth="2.8" d="M19.5 4.5 11 13" />
    <path d="M7 11.5l5.5 5.5M9.5 14.5 5 19" />
    <circle cx="4.2" cy="19.8" r="1.1" fill="currentColor" />
  </>
);
const P = {
  sword,
  swords: (
    <>
      {sword}
      <g transform="translate(24 0) scale(-1 1)">{sword}</g>
    </>
  ),
  anvil: (
    <>
      <path d="M4 7h13c0 2.6-1.8 4-4 4h-1.5l.6 3H15v3H8v-3h2.1l.6-3H9C6.2 11 4 9.6 4 7z" />
      <path d="M17 7h3.5c0 1.5-1.3 2.5-3 2.7" />
    </>
  ),
  book: (
    <>
      <path d="M12 6.5C9.8 5 7 4.6 4 5v13c3-.4 5.8 0 8 1.5 2.2-1.5 5-1.9 8-1.5V5c-3-.4-5.8 0-8 1.5z" />
      <path d="M12 6.5v13" />
    </>
  ),
  portal: (
    <>
      <ellipse cx="12" cy="12" rx="6.5" ry="9.5" />
      <ellipse cx="12" cy="12" rx="3.4" ry="6" />
      <path d="M3 5l1.5 1.5M21 5l-1.5 1.5M3 19l1.5-1.5M21 19l-1.5-1.5" />
    </>
  ),
  scroll: (
    <>
      <path d="M6 4h11a2 2 0 0 1 2 2v11a3 3 0 0 1-3 3H8a2 2 0 0 1-2-2z" />
      <path d="M6 17.5a2 2 0 0 1 2-2h11M10 8h6M10 11.5h6" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 3v5.5c0 4.7-3 8-7 9.5-4-1.5-7-4.8-7-9.5V6z" />
      <path d="M12 8v7M9 11h6" />
    </>
  ),
  flask: (
    <>
      <path d="M9.5 3h5M10.5 3v5.2L5.7 16.4A3 3 0 0 0 8.3 21h7.4a3 3 0 0 0 2.6-4.6L13.5 8.2V3" />
      <path d="M7.5 14.5h9" />
    </>
  ),
  tunic: (
    <path d="M8.5 3.5 4 6.5l2 3.5 2-1v11.5h8V9l2 1 2-3.5-4.5-3c-.6 1.6-2 2.5-3.5 2.5S9.1 5.1 8.5 3.5z" />
  ),
  backpack: (
    <>
      <path d="M9 7V5.5a3 3 0 0 1 6 0V7" />
      <path d="M6.5 9a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v10.5a1.5 1.5 0 0 1-1.5 1.5H8a1.5 1.5 0 0 1-1.5-1.5z" />
      <path d="M9.5 14h5v4h-5z" />
    </>
  ),
  mug: (
    <>
      <path d="M5 8.5h10V17a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z" />
      <path d="M15 10.5h1.8a2.4 2.4 0 0 1 0 4.8H15M8 3.5c0 1 1 1.3 1 2.3M12 3.5c0 1 1 1.3 1 2.3" />
    </>
  ),
  castle: (
    <>
      <path d="M4 21V8.5h3v-3h2v3h6v-3h2v3h3V21z" />
      <path d="M9.5 21v-5a2.5 2.5 0 0 1 5 0v5" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5" opacity=".55" />
      <path d="M12 9.5v5" />
    </>
  ),
  heart: (
    <path d="M12 20.5S4.5 16 4.5 10A4 4 0 0 1 12 8a4 4 0 0 1 7.5 2c0 6-7.5 10.5-7.5 10.5z" />
  ),
  crystal: (
    <>
      <path d="M12 2.5 19 12l-7 9.5L5 12z" />
      <path d="M5 12h14M8.5 12 12 2.5 15.5 12 12 21.5z" opacity=".7" />
    </>
  ),
  spark: (
    <path d="M12 2.5l2.4 7.1 7.1 2.4-7.1 2.4L12 21.5l-2.4-7.1L2.5 12l7.1-2.4z" />
  ),
  chat: (
    <>
      <path d="M4 5.5h16v10.5h-8.5L7 20v-4H4z" />
      <path d="M8 10.7h.01M12 10.7h.01M16 10.7h.01" strokeWidth="2.6" />
    </>
  ),
  stats: <path d="M5 20v-6M12 20V9M19 20V4M3 20.5h18" />,
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2.2 4.8-4.8 2.2 2.2-4.8z" />
    </>
  ),
  lock: (
    <>
      <path d="M7.5 11V8a4.5 4.5 0 0 1 9 0v3" />
      <path d="M5.5 11h13v9.5h-13zM12 15v2.5" />
    </>
  ),
  crown: <path d="M4 18.5 3 8l5 4 4-6.5L16 12l5-4-1 10.5z" />,
  check: <path d="M4.5 12.5l5 5 10-11" />,
  cross: <path d="M6 6l12 12M18 6 6 18" />,
  bolt: <path d="M13.5 2.5 5 13.5h6l-1 8 8.5-11h-6z" />,
  ghost: (
    <>
      <path d="M5.5 20.5V11a6.5 6.5 0 0 1 13 0v9.5l-2.2-2-2.1 2-2.2-2-2.2 2-2.1-2z" />
      <circle cx="9.5" cy="11" r="1" fill="currentColor" />
      <circle cx="14.5" cy="11" r="1" fill="currentColor" />
    </>
  ),
  skull: (
    <>
      <path d="M12 3a8 8 0 0 0-8 8c0 2.7 1.3 4.5 3 5.6V20h10v-3.4c1.7-1.1 3-2.9 3-5.6a8 8 0 0 0-8-8z" />
      <circle cx="9" cy="11.5" r="1.6" fill="currentColor" />
      <circle cx="15" cy="11.5" r="1.6" fill="currentColor" />
      <path d="M10.5 20v-2.5M13.5 20v-2.5" />
    </>
  ),
  flag: <path d="M5 21V3.5M5 4.5h13l-2.5 4 2.5 4H5" />,
  trophy: (
    <>
      <path d="M7.5 3.5h9v6a4.5 4.5 0 0 1-9 0z" />
      <path d="M7.5 5.5h-3c0 3 1 4.5 3.2 5M16.5 5.5h3c0 3-1 4.5-3.2 5M12 14v4M8.5 20.5h7" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21.5s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" />
      <circle cx="12" cy="10.5" r="2.4" />
    </>
  ),
  flame: (
    <path d="M12 21.5c-3.9 0-6.5-2.6-6.5-6 0-3.5 2.6-5 3.5-8 1.5 1 2.5 2.5 2.8 4 1.3-1.2 2-3 2-5.5 3 2 5.2 5.5 5.2 9.5 0 3.5-2.9 6-7 6z" />
  ),
  star: (
    <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
  ),
  moon: <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z" />,
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="6.5" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" />
    </>
  ),
  party: (
    <>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0z" />
      <circle cx="17" cy="9.5" r="2.4" />
      <path d="M16 14.2a4.6 4.6 0 0 1 5 5.3h-4" />
    </>
  ),
  door: (
    <>
      <path d="M6 21V4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21zM4 21h16" />
      <circle cx="15" cy="12.5" r=".9" fill="currentColor" />
    </>
  ),
  calendar: <path d="M4.5 6h15v14.5h-15zM4.5 10.5h15M8.5 3.5v4M15.5 3.5v4" />,
  chest: (
    <>
      <path d="M4 10V8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2zM4 10h16v10H4z" />
      <path d="M12 10v4" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </>
  ),
  helm: <path d="M5 19v-6a7 7 0 0 1 14 0v6h-4.5v-4h-5v4z" />,
  gauntlet: (
    <path d="M6 12V9h12v3l-1.5 3.5V20h-9v-4.5zM9 9V6.5M12 9V5.5M15 9V6.5" />
  ),
  boots: <path d="M8 3h6v9l5.5 3.5V20H5.5v-3.5L8 14.5z" />,
  arrowup: <path d="M12 20V5M6 11l6-6 6 6" />,
  arrowleft: <path d="M20 12H5M11 6l-6 6 6 6" />,
  play: <path d="M7 4.5l12 7.5-12 7.5z" fill="currentColor" />,
  pick: <path d="M3.5 9c3-5 14-5 17 0M12 5.5V21" />,
  quill: (
    <path d="M20 4c-8 0-13 5-13 12l-2.5 4.5M20 4c0 7-5 12-12 12M10 14l5-5" />
  ),
  warn: <path d="M12 3.5l9.5 17h-19zM12 10v4.5M12 17.6v.01" />,
  vortex: (
    <path d="M12 12a1.5 1.5 0 0 1 3 0 4.5 4.5 0 0 1-9 0 7.5 7.5 0 0 1 15 0" />
  ),
  ore: (
    <>
      <path d="M4 17.5l3-8 5-3.5 6 3 2.5 7-3 3.5H8z" />
      <path d="M7 9.5l5 3 6-3.5M12 12.5v8" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof P;

export default function GameIcon({
  name,
  size = "1em",
  className = "",
  title,
}: {
  name: IconName;
  size?: string | number;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block shrink-0 align-[-0.15em] ${className}`}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title && <title>{title}</title>}
      {P[name]}
    </svg>
  );
}
