import { redirect } from "next/navigation";
import Link from "next/link";
import { getActiveCharacter } from "@/lib/session";
import { spendPoints, spendSub } from "@/actions/world";
import { SUB } from "@/lib/game/battle";
const A = [
  ["for", "Força", "+2 ATK, +3 HP"],
  ["int", "Inteligência", "+1 ATK, +4 Energia Arcana"],
  ["des", "Destreza", "+0,15% crítico, +1,5 DEF"],
] as const;
export default async function Attr() {
  const a = await getActiveCharacter();
  if (!a) redirect("/characters");
  const { c } = a,
    at = c.attrs,
    avail = 5 * (c.level - 1) - at.for - at.int - at.des,
    dp = c.level - 1 - c.sub.reduce((x, y) => x + y, 0);
  return (
    <main className="mx-auto max-w-xl space-y-2 p-4">
      <Link href="/play" className="text-violet-300">
        ← Voltar
      </Link>
      <h1 className="text-xl font-bold">📈 Habilidades</h1>
      <p className="text-amber-300">
        Pontos disponíveis: {avail}{" "}
        <span className="text-sm text-violet-400">(5 por nível)</span>
      </p>
      {A.map(([k, n, d]) => (
        <form
          key={k}
          action={spendPoints}
          className="flex items-center gap-2 rounded-lg border border-violet-900 bg-[#171433] p-3"
        >
          <input type="hidden" name="stat" value={k} />
          <div className="flex-1">
            <b>{n}</b> {at[k]}
            <div className="text-xs text-violet-400">por ponto: {d}</div>
          </div>
          {[1, 5].map((n) => (
            <button
              key={n}
              name="n"
              value={n}
              disabled={avail < 1}
              className="rounded bg-violet-600 px-3 py-1 disabled:opacity-30"
            >
              +{n}
            </button>
          ))}
        </form>
      ))}
      <h2 className="pt-3 text-cyan-300">Domínios</h2>
      <p className="text-sm text-amber-300">
        Pontos de domínio: {dp}{" "}
        <span className="text-violet-400">
          (1 por nível, máx. 20 por domínio)
        </span>
      </p>
      {SUB[c.classKey].map((s, i) => (
        <form
          key={s.n}
          action={spendSub}
          className="flex items-center gap-2 rounded-lg border border-violet-900 bg-[#171433] p-3"
        >
          <input type="hidden" name="i" value={i} />
          <div className="flex-1">
            <b>{s.n}</b> {c.sub[i]}/20
            <div className="text-xs text-violet-400">por ponto: {s.d}</div>
          </div>
          <button
            name="n"
            value="1"
            disabled={dp < 1 || c.sub[i] >= 20}
            className="rounded bg-violet-600 px-3 py-1 disabled:opacity-30"
          >
            +1
          </button>
        </form>
      ))}
    </main>
  );
}
