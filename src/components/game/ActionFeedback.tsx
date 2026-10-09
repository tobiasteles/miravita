"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// Dá retorno imediato aos cliques: barra de progresso no topo, cursor de "carregando" e bloqueio de cliques repetidos
// enquanto uma ação do servidor (comprar, caçar, descansar, concluir missão...) ou uma troca de tela estiver em andamento.
export default function ActionFeedback() {
  const path = usePathname();
  const [busy, setBusy] = useState(false);
  const n = useRef(0),
    nav = useRef(false),
    off = useRef(0),
    guard = useRef(0);

  const refresh = () => {
    window.clearTimeout(off.current);
    if (n.current > 0) {
      setBusy(true);
      window.clearTimeout(guard.current);
      guard.current = window.setTimeout(() => {
        n.current = 0;
        nav.current = false;
        setBusy(false);
      }, 10000); // trava de segurança: nunca fica bloqueado por mais de 10s
    } else
      off.current = window.setTimeout(() => {
        setBusy(false);
        window.clearTimeout(guard.current);
      }, 200);
  };

  useEffect(() => {
    document.documentElement.toggleAttribute("data-busy", busy);
    return () => document.documentElement.removeAttribute("data-busy");
  }, [busy]);

  useEffect(() => {
    // ações do servidor (o Next as envia com o cabeçalho "Next-Action")
    const orig = window.fetch;
    window.fetch = async (input, init) => {
      const act =
        !!init?.headers && new Headers(init.headers).has("next-action");
      if (act) {
        n.current++;
        refresh();
      }
      try {
        return await orig.call(window, input, init);
      } finally {
        if (act) {
          n.current = Math.max(0, n.current - 1);
          refresh();
        }
      }
    };
    return () => {
      window.fetch = orig;
    };
  }, []);

  useEffect(() => {
    // cliques em links para outra tela
    const h = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a");
      if (
        !a ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        (a.target && a.target !== "_self")
      )
        return;
      const u = new URL(a.href, location.href);
      if (
        u.origin !== location.origin ||
        (u.pathname === location.pathname && u.search === location.search)
      )
        return;
      if (!nav.current) {
        nav.current = true;
        n.current++;
      }
      refresh();
    };
    document.addEventListener("click", h, true);
    return () => document.removeEventListener("click", h, true);
  }, []);

  useEffect(() => {
    // a tela nova chegou
    if (nav.current) {
      nav.current = false;
      n.current = Math.max(0, n.current - 1);
      refresh();
    }
  }, [path]);

  if (!busy) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden bg-violet-950/60"
    >
      <div className="mv-bar h-full w-1/3 rounded bg-gradient-to-r from-violet-500 via-cyan-300 to-violet-500" />
    </div>
  );
}
