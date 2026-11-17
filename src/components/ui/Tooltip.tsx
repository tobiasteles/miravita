import { useId, type ReactNode } from "react";

// Tooltip só com CSS: aparece no hover e no foco do teclado. Em tela de toque, aparece ao focar.
export function Tooltip({ text, children }: { text: string; children: ReactNode }) {
  const id = useId();
  return (
    <span className="group relative inline-flex" aria-describedby={id}>
      {children}
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-1.5 w-max max-w-56 -translate-x-1/2 rounded-chip border border-line bg-surface-2 px-2 py-1 text-xs text-ink opacity-0 shadow-panel transition-opacity duration-(--duration-fast) group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none"
      >
        {text}
      </span>
    </span>
  );
}
