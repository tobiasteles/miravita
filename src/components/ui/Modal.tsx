"use client";
import { useEffect, useRef, type ReactNode } from "react";

// Usa o <dialog> nativo: Esc fecha, o foco fica preso e o fundo fica inerte, sem biblioteca.
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="anim-pop m-auto w-[min(92vw,28rem)] rounded-modal border border-line bg-surface p-0 text-ink shadow-glow-arcane backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <div className="space-y-3 p-5">
        <h2 className="font-display text-lg font-extrabold text-aether">{title}</h2>
        {children}
      </div>
    </dialog>
  );
}
