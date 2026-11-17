import type { HTMLAttributes } from "react";
import { cx } from "./cx";

export const cardClass = (tone: "default" | "gold" = "default") =>
  cx(
    "rounded-panel border bg-surface p-4 shadow-panel backdrop-blur-sm",
    tone === "gold" ? "border-ember/70 shadow-glow-ember" : "border-line",
  );

export function Card({ tone, className, ...rest }: HTMLAttributes<HTMLDivElement> & { tone?: "default" | "gold" }) {
  return <div className={cx(cardClass(tone), className)} {...rest} />;
}
