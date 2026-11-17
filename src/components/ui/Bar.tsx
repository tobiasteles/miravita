import { cx } from "./cx";

type Tone = "vital" | "aether" | "ember" | "blood";
const fill: Record<Tone, string> = { vital: "bg-vital", aether: "bg-aether", ember: "bg-ember", blood: "bg-blood" };
const clamp = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0);

// Barra genérica. Só exibe valores que o servidor já mandou; não calcula regra nenhuma.
// A camada "perda" fica mais clara e encolhe devagar, mostrando quanto acabou de cair.
export function Bar({ value, max, tone = "vital", label, showValue = false, className }: {
  value: number; max: number; tone?: Tone; label: string; showValue?: boolean; className?: string;
}) {
  const pct = max > 0 ? clamp((value / max) * 100) : 0;
  return (
    <div className={cx("flex items-center gap-2 text-xs", className)}>
      <span className="w-6 shrink-0 font-semibold text-ink-dim" aria-hidden>{label}</span>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.max(0, value)}
        className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-bg ring-1 ring-line"
      >
        <div
          className="absolute inset-y-0 left-0 bg-white/60 transition-[width] delay-300 duration-1000 ease-out motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
        <div
          className={cx("absolute inset-y-0 left-0 transition-[width] duration-500 ease-out motion-reduce:transition-none", fill[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showValue && <span className="w-16 shrink-0 text-right tabular-nums text-ink-dim">{Math.max(0, value)}/{max}</span>}
    </div>
  );
}

// HP muda de cor conforme esvazia
export function HpBar(p: { value: number; max: number; showValue?: boolean; className?: string }) {
  const r = p.max > 0 ? p.value / p.max : 0;
  return <Bar {...p} label="HP" tone={r > 0.5 ? "vital" : r > 0.25 ? "ember" : "blood"} />;
}
export const EaBar = (p: { value: number; max: number; showValue?: boolean; className?: string }) => <Bar {...p} label="EA" tone="aether" />;
