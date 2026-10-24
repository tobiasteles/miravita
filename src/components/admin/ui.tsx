import type { ReactNode } from "react";
// peças de formulário do painel /admin
export const inp = "w-full rounded border border-violet-700 bg-[#0c0a1f] px-2 py-1.5 text-sm outline-none focus:border-cyan-400";
export const btn = "rounded bg-violet-600 px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-cyan-500";
export const btnDanger = "rounded border border-rose-700 px-2 py-1 text-xs text-rose-300 hover:bg-rose-950";
export const Card = ({ title, children }: { title?: string; children: ReactNode }) => (
  <section className="space-y-2 rounded-xl border border-violet-800 bg-[#171433] p-4">
    {title && <h2 className="font-bold text-cyan-300">{title}</h2>}
    {children}
  </section>
);
export const F = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
  <label className="block text-xs text-violet-300">
    {label}
    {children}
    {hint && <span className="text-violet-500">{hint}</span>}
  </label>
);
export const Opts = ({ list }: { list: [string, string][] }) => (
  <>
    {list.map(([v, l]) => (
      <option key={v} value={v}>{l}</option>
    ))}
  </>
);
export const MAPS: [string, string][] = [
  ["planicie-de-aurora", "Planície de Aurora"], ["floresta-sussurrante", "Floresta Sussurrante"], ["deserto-cinzento", "Deserto Cinzento"],
  ["montanha-de-ferro", "Montanha de Ferro"], ["pantano-radioativo", "Pântano Sombrio"], ["abismo-do-cacador", "Abismo do Caçador"],
];
export const monSlug = (n: string) => n.replace(/[^\p{L}\p{N} ]/gu, "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "-");
