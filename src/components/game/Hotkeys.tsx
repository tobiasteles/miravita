"use client";
import Link from "next/link"; import { useRouter, usePathname } from "next/navigation"; import { useEffect } from "react";
const KEYS = [["q", "/quests", "Missões", "📜"], ["o", "/inventory", "Inventário", "🎒"], ["t", "/skills", "Técnicas", "⚡"], ["g", "/guild", "Guilda", "🏰"], ["c", "#chat", "Chat", "💬"], ["h", "/attributes", "Habilidades", "📈"], ["m", "/map", "Mapa", "🗺️"]] as const;
const chat = () => { dispatchEvent(new Event("mv-chat-open")); setTimeout(() => document.getElementById("chat-input")?.focus(), 60); };
export function HotkeyListener() {
  const r = useRouter(), p = usePathname();
  useEffect(() => { const h = (e: KeyboardEvent) => { const t = e.target as HTMLElement; if (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || e.ctrlKey || e.metaKey || e.altKey || p.startsWith("/battle")) return;
    const k = KEYS.find((x) => x[0] === e.key.toLowerCase()); if (!k) return; e.preventDefault(); k[1] === "#chat" ? chat() : r.push(k[1]); };
    addEventListener("keydown", h); return () => removeEventListener("keydown", h); }, [r, p]);
  return null;
}
export function HotkeyBar() {
  const c = "group flex flex-col items-center rounded-xl border border-violet-800/60 bg-[#12102c]/80 px-1 py-2 text-xs transition hover:-translate-y-0.5 hover:border-violet-400 hover:shadow-[0_0_18px_#8b5cf655]";
  const inner = (k: string, l: string, i: string) => <><span className="text-lg">{i}</span><span>{l}</span><kbd className="mt-1 rounded bg-violet-900 px-1.5 text-[10px] uppercase">{k}</kbd></>;
  return <nav className="grid grid-cols-4 gap-2 sm:grid-cols-7">{KEYS.map(([k, href, l, i]) => href === "#chat" ? <button key={k} onClick={chat} className={c}>{inner(k, l, i)}</button> : <Link key={k} href={href} className={c}>{inner(k, l, i)}</Link>)}</nav>;
}
