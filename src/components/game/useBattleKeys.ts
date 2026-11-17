"use client";
import { useEffect } from "react";
import { sfx } from "@/lib/sfx";

// Atalhos do combate: clica no botão que tiver data-key igual à tecla (L lutar, I item, F fugir, 1–4 poderes, B voltar, N próximo).
// Só aciona botões habilitados, então não dá para burlar o que a tela já bloqueia (e o servidor valida tudo de novo).
export function useBattleKeys() {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      const btn = document.querySelector<HTMLButtonElement>(`[data-key="${e.key.toLowerCase()}"]`);
      if (!btn || btn.disabled) return;
      e.preventDefault();
      sfx("tick");
      btn.click();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
}
