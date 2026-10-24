import Link from "next/link";
import { notFound } from "next/navigation";
import { isAdmin } from "@/actions/admin";
export const dynamic = "force-dynamic";
const NAV: [string, string][] = [
  ["/admin", "Painel"], ["/admin/noticias", "Notícias"], ["/admin/eventos", "Eventos"], ["/admin/monstros", "Monstros"], ["/admin/missoes", "Missões"],
  ["/admin/itens", "Itens"], ["/admin/gm", "Personagens GM"], ["/admin/musicas", "Músicas"], ["/admin/balance", "Balanceamento"],
];
// só administradores entram (veja ADMIN_EMAILS no .env.local); para os outros a página "não existe"
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) notFound();
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <nav className="flex flex-wrap items-center gap-1 rounded-xl border border-violet-800 bg-[#12102c] p-2 text-sm">
        <Link href="/play" className="mr-2 text-violet-400">← jogo</Link>
        {NAV.map(([h, l]) => (
          <Link key={h} href={h} className="rounded-full border border-violet-800 px-3 py-1 transition hover:border-cyan-400 hover:bg-violet-900/40">{l}</Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
