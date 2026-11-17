import type { HTMLAttributes } from "react";
import { cx } from "./cx";

const tones = {
  plain: "border-line text-ink-dim",
  arcane: "border-arcane/50 bg-arcane/15 text-arcane-soft",
  aether: "border-aether/50 bg-aether/15 text-aether",
  ember: "border-ember/50 bg-ember/15 text-ember",
  blood: "border-blood/50 bg-blood/15 text-blood",
  vital: "border-vital/50 bg-vital/15 text-vital",
} as const;
export type BadgeTone = keyof typeof tones;

export function Badge({ tone = "plain", className, ...rest }: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold", tones[tone], className)} {...rest} />
  );
}
