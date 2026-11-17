import type { ButtonHTMLAttributes } from "react";
import { cx } from "./cx";

export type ButtonVariant = "primary" | "ghost" | "danger" | "gold";
export type ButtonSize = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-chip font-semibold " +
  "transition-colors duration-(--duration-base) " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aether " +
  "disabled:cursor-not-allowed disabled:opacity-50";
const variants: Record<ButtonVariant, string> = {
  primary: "bg-arcane-btn text-ink hover:bg-aether hover:text-bg",
  ghost: "border border-line text-ink hover:bg-line/40",
  danger: "border border-blood/70 text-blood hover:bg-blood/15",
  gold: "bg-ember text-bg hover:brightness-110",
};
const sizes: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 py-1.5 text-sm",
  md: "min-h-11 px-4 py-2",
};

// também serve para <Link> e <a>: className={buttonClass("ghost")}
export const buttonClass = (v: ButtonVariant = "primary", s: ButtonSize = "md") => cx(base, variants[v], sizes[s]);

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize };
export function Button({ variant, size, className, type = "button", ...rest }: Props) {
  return <button type={type} className={cx(buttonClass(variant, size), className)} {...rest} />;
}
