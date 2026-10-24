"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Música de fundo: escolhe a faixa pelo lugar onde o jogador está (cadastrada em /admin/musicas).
// O volume vem do menu Esc (Configurações → som). Navegadores só deixam tocar depois do primeiro clique.
const soundSetting = () => {
  try {
    return Number(JSON.parse(localStorage.getItem("mv_settings") ?? "{}").sound ?? 70) / 100;
  } catch {
    return 0.7;
  }
};
export default function MusicPlayer() {
  const path = usePathname(), el = useRef<HTMLAudioElement | null>(null), cur = useRef<{ url: string | null; vol: number; ctx: string; pinned: boolean }>({ url: null, vol: 0.7, ctx: "", pinned: false });
  const apply = () => {
    const a = el.current;
    if (!a) return;
    const v = Math.max(0, Math.min(1, (cur.current.vol / 100) * soundSetting()));
    a.volume = v;
    if (v === 0 || !cur.current.url) a.pause();
    else if (a.paused && a.src) a.play().catch(() => {});
  };
  useEffect(() => {
    if (!el.current) {
      el.current = new Audio();
      el.current.loop = true;
    }
    const unlock = () => apply();
    addEventListener("pointerdown", unlock);
    addEventListener("keydown", unlock);
    const t = setInterval(apply, 1000); // acompanha o controle de som do menu Esc
    return () => {
      removeEventListener("pointerdown", unlock);
      removeEventListener("keydown", unlock);
      clearInterval(t);
      el.current?.pause();
    };
  }, []);
  useEffect(() => {
    let dead = false;
    fetch(`/api/music?path=${encodeURIComponent(path)}`)
      .then((r) => r.json())
      .then((m: { url: string | null; volume?: number; ctx: string; pinned?: boolean }) => {
        if (dead || !el.current) return;
        // só troca de faixa quando muda o tipo de lugar (cidade → batalha...) ou quando entra/sai de um mapa com música própria
        const c = cur.current, keep = m.ctx === c.ctx && !!c.url && m.url === c.url ? true : m.ctx === c.ctx && !!c.url && !!m.url && !m.pinned && !c.pinned;
        if (keep) return;
        cur.current = { url: m.url, vol: m.volume ?? 70, ctx: m.ctx, pinned: !!m.pinned };
        if (!m.url) return apply();
        el.current.src = m.url;
        apply();
      })
      .catch(() => {});
    return () => {
      dead = true;
    };
  }, [path]);
  return null;
}
