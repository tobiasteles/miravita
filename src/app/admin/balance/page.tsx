import { notFound } from "next/navigation"; import { desc } from "drizzle-orm"; import { db } from "@/db"; import { balanceSuggestions } from "@/db/schema"; import { isAdmin, setStatus } from "@/actions/admin";
export const dynamic = "force-dynamic";
const C: Record<string, string> = { alta: "text-rose-400", media: "text-amber-300", baixa: "text-cyan-300" };
export default async function Page() {
  if (!(await isAdmin())) notFound();
  const rows = await db.select().from(balanceSuggestions).orderBy(desc(balanceSuggestions.createdAt)).limit(50);
  return <main className="mx-auto max-w-2xl space-y-3 p-4"><h1 className="text-xl font-bold">Sugestões de balanceamento (IA)</h1>
    <p className="text-sm text-violet-300">Nada é aplicado automaticamente: ajuste a fórmula em <code>src/lib/game/battle.ts</code> e marque como aplicada.</p>
    {rows.map((r) => <div key={r.id} className="rounded-lg border border-violet-900 bg-[#171433] p-3"><div><b>{r.target}</b> <span className={C[r.severity]}>{r.severity}</span> <span className="text-sm text-violet-400">· {r.status}</span></div>
      <div className="text-sm">{r.issue}</div><div className="mt-1 text-sm text-emerald-300">→ {r.suggestion}</div>
      {r.status === "pendente" && <form action={setStatus} className="mt-2 flex gap-2"><input type="hidden" name="id" value={r.id} /><button name="status" value="aplicada" className="rounded bg-violet-600 px-3 py-1">Aplicada</button><button name="status" value="rejeitada" className="rounded border border-violet-800 px-3 py-1">Rejeitar</button></form>}</div>)}
    {!rows.length && <p className="text-violet-400">Ainda sem sugestões (precisa de 30+ lutas por grupo em 7 dias).</p>}</main>;
}
