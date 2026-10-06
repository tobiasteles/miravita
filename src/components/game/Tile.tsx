import Link from "next/link";
// cada atalho/comerciante muda de cor de forma suave ao passar o mouse (transition 300ms)
const ACC = {
  red: "hover:border-rose-400 hover:bg-rose-500/15 hover:shadow-[0_0_24px_#f43f5e44]",
  sky: "hover:border-sky-400 hover:bg-sky-500/15 hover:shadow-[0_0_24px_#38bdf844]",
  green:
    "hover:border-emerald-400 hover:bg-emerald-500/15 hover:shadow-[0_0_24px_#34d39944]",
  gold: "hover:border-amber-400 hover:bg-amber-500/15 hover:shadow-[0_0_24px_#fbbf2444]",
  violet:
    "hover:border-violet-400 hover:bg-violet-500/20 hover:shadow-[0_0_24px_#8b5cf655]",
  cyan: "hover:border-cyan-400 hover:bg-cyan-500/15 hover:shadow-[0_0_24px_#22d3ee44]",
  pink: "hover:border-pink-400 hover:bg-pink-500/15 hover:shadow-[0_0_24px_#f472b644]",
  slate:
    "hover:border-slate-300 hover:bg-slate-400/15 hover:shadow-[0_0_24px_#cbd5e144]",
} as const;
export type Accent = keyof typeof ACC;
type P = {
  icon: string;
  title: string;
  sub: string;
  accent: Accent;
  href?: string;
  action?: (fd: FormData) => void | Promise<void>;
  fields?: Record<string, string>;
  disabled?: boolean;
};
const base =
  "group flex w-full items-center gap-3 rounded-xl border border-violet-800/60 bg-[#12102c]/80 p-3 text-left backdrop-blur transition-all duration-300 ease-out";
export default function Tile({
  icon,
  title,
  sub,
  accent,
  href,
  action,
  fields,
  disabled,
}: P) {
  const inner = (
    <>
      <span className="text-3xl transition-transform duration-300 group-hover:scale-110">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="block truncate text-xs text-violet-300 transition-colors duration-300 group-hover:text-white/80">
          {sub}
        </span>
      </span>
    </>
  );
  if (disabled)
    return (
      <div className={`${base} cursor-not-allowed opacity-50`}>
        {inner}
        <span className="rounded bg-violet-900 px-2 text-[10px] uppercase">
          em breve
        </span>
      </div>
    );
  const cls = `${base} hover:-translate-y-0.5 ${ACC[accent]}`;
  if (href)
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  return (
    <form action={action}>
      {Object.entries(fields ?? {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button className={cls}>{inner}</button>
    </form>
  );
}
