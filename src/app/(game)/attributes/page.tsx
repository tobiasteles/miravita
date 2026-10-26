import { redirect } from "next/navigation";
import Link from "next/link";
import { getActiveCharacter } from "@/lib/session";
import { loadPlayer } from "@/lib/game/player";
import { spendPoints, spendSub } from "@/actions/world";
import { SUB } from "@/lib/game/battle";
import { STAT_LABEL, PA_MAX, PA_REGEN, type CStats } from "@/lib/game/combat";
import GameIcon from "@/components/game/GameIcon";

// campo para DIGITAR a quantidade + atalhos (+1, +5, +10, Tudo)
function Spend({ avail, quick = [1, 5, 10] }: { avail: number; quick?: number[] }) {
  const b = "rounded bg-violet-600 px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-cyan-500 disabled:opacity-30";
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <input name="amount" type="number" inputMode="numeric" min={1} max={Math.max(1, avail)} placeholder="quantos?" disabled={avail < 1} className="w-24 rounded border border-violet-700 bg-[#0c0a1f] px-2 py-1.5 text-sm outline-none focus:border-cyan-400 disabled:opacity-30" />
      <button disabled={avail < 1} className={b}>Aplicar</button>
      {quick.map((n) => (
        <button key={n} name="n" value={n} formNoValidate disabled={avail < n} className={b + " !bg-violet-900"}>+{n}</button>
      ))}
      <button name="n" value="max" formNoValidate disabled={avail < 1} className={b + " !bg-amber-600"}>Tudo ({avail})</button>
    </div>
  );
}

// valores por ponto (arredondados PARA BAIXO): ver PER em combat.ts
const A = [
  ["for", "Força", "+2,5 Poderio Físico · +1,5 Defesa Física · +10 HP Máximo · +0,2% Tenacidade"],
  ["int", "Inteligência", "+3,0 Poderio Arcano · +1,0 Defesa Mágica · +8 MP · +0,5 Evasão Mágica/Res. Status"],
  ["des", "Destreza", "+1,5 Foco · +1,5 Reflexos · +1,0 Poderio Físico · +0,1% Chance de Ruptura"],
] as const;
const PCT = new Set<keyof CStats>(["rup", "rupD", "qg", "resF", "resA", "mit", "sifV", "sifE", "reg", "regE", "imp", "ten", "ret", "pen", "estab", "evM"]);
const SHOW: (keyof typeof STAT_LABEL)[] = ["hp", "mp", "pof", "poa", "dfF", "dfM", "foco", "refl", "rup", "rupD", "qg", "resF", "resA", "mit", "sifV", "sifE", "reg", "regE", "imp", "ten", "ret", "pen", "estab", "evM"];
export default async function Attr() {
  const a = await getActiveCharacter();
  if (!a) redirect("/characters");
  const { c } = a, at = c.attrs;
  const avail = 5 * (c.level - 1) - at.for - at.int - at.des, dp = c.level - 1 - c.sub.reduce((x, y) => x + y, 0);
  const P = await loadPlayer(c.id), q = P.q;
  return (
    <main className="mx-auto max-w-xl space-y-2 p-4">
      <Link href="/play" className="flex items-center gap-1 text-violet-300"><GameIcon name="arrowleft" /> Voltar</Link>
      <h1 className="flex items-center gap-2 text-xl font-bold"><GameIcon name="stats" className="text-amber-300" /> Atributos</h1>
      <p className="text-amber-300">Pontos disponíveis: {avail} <span className="text-sm text-violet-400">(5 por nível)</span></p>
      {A.map(([k, n, d]) => (
        <form key={k} action={spendPoints} className="space-y-2 rounded-lg border border-violet-900 bg-[#171433] p-3">
          <input type="hidden" name="stat" value={k} />
          <div>
            <b>{n}</b> <span className="text-amber-300">{at[k]}</span>
            <div className="text-xs text-violet-400">por ponto: {d}</div>
          </div>
          <Spend avail={avail} />
        </form>
      ))}

      <section className="rounded-lg border border-violet-900 bg-[#171433] p-3">
        <div className="mb-2 flex items-center justify-between text-sm font-bold text-cyan-300">
          <span>Seus status</span>
          <span className="text-xs font-normal text-violet-400">Poder principal: {q.main === "fis" ? "Físico" : "Arcano"} · PA {PA_MAX} (+{PA_REGEN}/turno)</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {SHOW.map((k) => (
            <div key={k} className="flex justify-between border-b border-violet-900/60 py-0.5">
              <span className="text-violet-300">{STAT_LABEL[k]}</span>
              <b>{Math.round((q as unknown as Record<string, number>)[k] * 10) / 10}{PCT.has(k as keyof CStats) ? "%" : ""}</b>
            </div>
          ))}
        </div>
      </section>

      <h2 className="pt-3 text-cyan-300">Maestrias</h2>
      <p className="text-sm text-amber-300">Pontos de maestria: {dp} <span className="text-violet-400">(1 por nível, máx. 20 por maestria)</span></p>
      {SUB[c.classKey].map((s, i) => (
        <form key={s.n} action={spendSub} className="space-y-2 rounded-lg border border-violet-900 bg-[#171433] p-3">
          <input type="hidden" name="i" value={i} />
          <div>
            <b>{s.n}</b> {c.sub[i]}/20
            <div className="text-xs text-violet-400">por ponto: {s.d}</div>
          </div>
          <Spend avail={Math.min(dp, 20 - c.sub[i])} quick={[1, 5]} />
        </form>
      ))}
    </main>
  );
}
