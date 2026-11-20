"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import GameIcon, { type IconName } from "@/components/game/GameIcon";
import { useT } from "@/i18n/client";

const KEYS: readonly (readonly [string, string, string, IconName])[] = [
  ["q", "/quests", "hk.quests", "scroll"],
  ["o", "/inventory", "hk.inventory", "backpack"],
  ["t", "/skills", "hk.academy", "book"],
  ["g", "/guild", "hk.guild", "shield"],
  ["c", "#chat", "hk.chat", "chat"],
  ["h", "/attributes", "hk.attributes", "stats"],
  ["m", "/map", "hk.map", "compass"],
  ["a", "/atividades", "hk.activities", "pick"],
  ["e", "/codex", "hk.codex", "flask"],
];
const chat = () => {
  dispatchEvent(new Event("mv-chat-open"));
  setTimeout(() => document.getElementById("chat-input")?.focus(), 60);
};
export function HotkeyListener() {
  const r = useRouter(),
    p = usePathname();
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || e.ctrlKey || e.metaKey || e.altKey || p.startsWith("/battle")) return;
      const k = KEYS.find((x) => x[0] === e.key.toLowerCase());
      if (!k) return;
      e.preventDefault();
      k[1] === "#chat" ? chat() : r.push(k[1]);
    };
    addEventListener("keydown", h);
    return () => removeEventListener("keydown", h);
  }, [r, p]);
  return null;
}
// celular: grade de botões · computador (lg): coluna vertical ao lado do mapa
export function HotkeyBar() {
  const { t } = useT();
  const c =
    "group flex flex-col items-center rounded-xl border border-violet-800/60 bg-[#12102c]/80 px-1 py-2 text-xs transition hover:-translate-y-0.5 hover:border-violet-400 hover:shadow-[0_0_18px_#8b5cf655] lg:flex-row lg:gap-3 lg:px-3 lg:py-2.5 lg:text-sm lg:hover:translate-y-0 lg:hover:translate-x-0.5";
  const inner = (k: string, l: string, i: IconName) => (
    <>
      <GameIcon name={i} size="1.6em" className="text-amber-300 transition-transform group-hover:scale-110 lg:text-[1.35rem]" />
      <span className="lg:flex-1 lg:font-semibold">{t(l)}</span>
      <kbd className="mt-1 rounded bg-violet-900 px-1.5 text-[10px] uppercase lg:mt-0">{k}</kbd>
    </>
  );
  return (
    <nav className="grid grid-cols-4 gap-2 sm:grid-cols-9 lg:flex lg:flex-col">
      {KEYS.map(([k, href, l, i]) =>
        href === "#chat" ? (
          <button key={k} onClick={chat} className={c}>
            {inner(k, l, i)}
          </button>
        ) : (
          <Link key={k} href={href} className={c}>
            {inner(k, l, i)}
          </Link>
        ),
      )}
    </nav>
  );
}
