import { bg } from "@/lib/img";

// fundo sutil para as telas do jogo: céu escuro, brilhos de aurora, estrelas, horizonte com ruínas e um Portal distante.
// Tudo com pouca opacidade para não competir com o conteúdo. Opcional: public/brand/game-bg (PNG/JPG/WEBP) entra como camada extra bem suave.
const rnd = (() => {
  let s = 7;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
})();
const STARS = Array.from({ length: 55 }, () => ({
  x: rnd() * 100,
  y: rnd() * 68,
  big: rnd() < 0.15,
  d: rnd() * 6,
}));
const EMBERS = Array.from({ length: 8 }, (_, i) => ({
  x: 6 + i * 12 + rnd() * 6,
  d: rnd() * 14,
  t: 18 + rnd() * 14,
}));

export default function GameBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #0b0920 0%, #110c30 55%, #160f3c 100%)",
      }}
    >
      {/* aurora: dois brilhos grandes que se movem muito devagar */}
      <div
        className="gb-a absolute -left-1/4 -top-1/4 h-[70vh] w-[70vw] rounded-full opacity-[.16] blur-[90px]"
        style={{ background: "#7c3aed" }}
      />
      <div
        className="gb-b absolute -bottom-1/4 -right-1/4 h-[65vh] w-[65vw] rounded-full opacity-[.12] blur-[90px]"
        style={{ background: "#06b6d4" }}
      />
      {/* estrelas */}
      {STARS.map((s, i) => (
        <span
          key={i}
          className="gb-star absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.big ? 2 : 1,
            height: s.big ? 2 : 1,
            animationDelay: `${s.d}s`,
          }}
        />
      ))}
      {/* imagem opcional em pixel art, apagada e com o topo desvanecendo */}
      <div
        className="absolute inset-0 opacity-[.22]"
        style={{
          backgroundImage: bg("/brand/game-bg"),
          backgroundSize: "cover",
          backgroundPosition: "center bottom",
          backgroundRepeat: "no-repeat",
          maskImage: "linear-gradient(to bottom, transparent 0%, #000 70%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, #000 70%)",
        }}
      />
      {/* horizonte: montanhas, ruínas da cidadela e um Portal distante */}
      <svg
        className="absolute bottom-0 left-0 h-[34vh] w-full"
        viewBox="0 0 1440 320"
        preserveAspectRatio="xMidYMax slice"
      >
        <defs>
          <radialGradient id="gbp" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#8b5cf6" stopOpacity=".55" />
            <stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path
          d="M0 320V215L120 165 220 205 340 125 470 195 600 145 720 210 860 135 990 200 1120 155 1250 205 1360 170 1440 195V320Z"
          fill="#1a1250"
          opacity=".5"
        />
        <circle cx="1120" cy="150" r="46" fill="url(#gbp)" />
        <circle
          cx="1120"
          cy="150"
          r="17"
          fill="none"
          stroke="#a78bfa"
          strokeOpacity=".5"
          strokeWidth="2"
        />
        <path
          d="M0 320V262L150 246 260 272 430 252 640 268 820 250 1000 270 1180 256 1320 272 1440 258V320Z"
          fill="#0b0824"
          opacity=".9"
        />
        <g fill="#0b0824" opacity=".95">
          <rect x="1040" y="205" width="26" height="115" />
          <rect x="1090" y="172" width="34" height="148" />
          <path d="M1090 172l17-26 17 26z" />
          <rect x="1140" y="226" width="9" height="94" />
          <rect x="1162" y="238" width="9" height="82" />
          <rect x="1010" y="248" width="60" height="72" />
          <rect x="190" y="228" width="12" height="92" />
          <rect x="228" y="214" width="12" height="106" />
          <rect x="190" y="214" width="50" height="10" />
        </g>
      </svg>
      {/* brasas bem discretas subindo */}
      {EMBERS.map((e, i) => (
        <span
          key={i}
          className="gb-ember"
          style={{
            left: `${e.x}%`,
            animationDelay: `${e.d}s`,
            animationDuration: `${e.t}s`,
          }}
        />
      ))}
      {/* vinheta: escurece as bordas e deixa o centro (o conteúdo) em destaque */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, transparent 35%, rgba(8,6,24,.75) 100%)",
        }}
      />
    </div>
  );
}
