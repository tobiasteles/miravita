import Link from "next/link";
import { notFound } from "next/navigation";
import { isAdmin } from "@/actions/admin";
export const dynamic = "force-dynamic";
const NAV: [string, string][] = [
  ["/admin", "Painel"], ["/admin/noticias", "Notícias"], ["/admin/eventos", "Eventos"], ["/admin/monstros", "Monstros"], ["/admin/missoes", "Missões"],
  ["/admin/itens", "Itens"], ["/admin/gm", "Personagens GM"], ["/admin/musicas", "Músicas"], ["/admin/denuncias", "Denúncias"], ["/admin/balance", "Balanceamento"],
];
// só administradores entram (veja ADMIN_EMAILS no .env.local); para os outros a página "não existe"
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) notFound();
  return (
    <div className="mx-auto max-w-4xl space-y-4 overflow-x-hidden p-4 pt-0 sm:pt-4">
      <nav className="sticky top-0 z-30 -mx-4 flex items-center gap-1 overflow-x-auto whitespace-nowrap border-b border-violet-800 bg-[#12102c]/95 px-4 py-2 text-sm backdrop-blur [scrollbar-width:none] sm:static sm:mx-0 sm:flex-wrap sm:rounded-xl sm:border sm:p-2 [&::-webkit-scrollbar]:hidden">
        <Link href="/play" className="mr-1 shrink-0 text-violet-400">← jogo</Link>
        {NAV.map(([h, l]) => (
          <Link key={h} href={h} className="shrink-0 rounded-full border border-violet-800 px-3 py-1 transition hover:border-cyan-400 hover:bg-violet-900/40">{l}</Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
