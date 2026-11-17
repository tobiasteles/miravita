import { SHELL_NAMES } from "@/lib/game/periodic";

// Fallback 2D (gráficos "baixa", sem WebGL ou escolha do jogador): mesmo átomo, só em SVG estático.
export default function Atom2D({ shells, color, shell, onShell, z }: { shells: number[]; color: string; shell: number | null; onShell: (i: number | null) => void; z: number }) {
  const R = (k: number) => 22 + k * 11.5;
  return (
    <svg viewBox="-100 -100 200 200" role="img" aria-label={`Átomo com ${z} elétrons em ${shells.length} camadas`} className="h-full w-full">
      <circle r={8 + Math.cbrt(z) * 1.6} fill={color} />
      <circle r={(8 + Math.cbrt(z) * 1.6) * 1.8} fill={color} opacity={0.14} />
      {shells.map((n, k) => (
        <g key={k}>
          <circle r={R(k)} fill="none" stroke={shell === k ? "#fbbf24" : "#8b5cf6"} strokeOpacity={shell === k ? 1 : 0.5} strokeWidth={shell === k ? 2.2 : 1} />
          <circle r={R(k)} fill="none" stroke="transparent" strokeWidth={9} onClick={() => onShell(shell === k ? null : k)}>
            <title>{`Camada ${SHELL_NAMES[k]}: ${n} elétrons`}</title>
          </circle>
          {Array.from({ length: n }, (_, j) => {
            const a = (2 * Math.PI * j) / n + k;
            return <circle key={j} cx={R(k) * Math.cos(a)} cy={R(k) * Math.sin(a)} r={2.4} fill={shell === k ? "#fde68a" : "#e8e6ff"} pointerEvents="none" />;
          })}
        </g>
      ))}
    </svg>
  );
}
