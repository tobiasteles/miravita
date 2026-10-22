import { redirect } from "next/navigation";
import Link from "next/link";
import { getActiveCharacter } from "@/lib/session";
import { loadPlayer } from "@/lib/game/player";
import { spendPoints, spendSub } from "@/actions/world";
import { SUB } from "@/lib/game/battle";
import { STAT_LABEL, PA_MAX, PA_REGEN, type CStats } from "@/lib/game/combat";
import GameIcon from "@/components/game/GameIcon";

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
        <form key={k} action={spendPoints} className="flex items-center gap-2 rounded-lg border border-violet-900 bg-[#171433] p-3">
          <input type="hidden" name="stat" value={k} />
          <div className="flex-1">
            <b>{n}</b> {at[k]}
            <div className="text-xs text-violet-400">por ponto: {d}</div>
          </div>
          {[1, 5].map((n) => (
            <button key={n} name="n" value={n} disabled={avail < 1} className="rounded bg-violet-600 px-3 py-1 disabled:opacity-30">+{n}</button>
          ))}
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
        <form key={s.n} action={spendSub} className="flex items-center gap-2 rounded-lg border border-violet-900 bg-[#171433] p-3">
          <input type="hidden" name="i" value={i} />
          <div className="flex-1">
            <b>{s.n}</b> {c.sub[i]}/20
            <div className="text-xs text-violet-400">por ponto: {s.d}</div>
          </div>
          <button name="n" value="1" disabled={dp < 1 || c.sub[i] >= 20} className="rounded bg-violet-600 px-3 py-1 disabled:opacity-30">+1</button>
        </form>
      ))}
    </main>
  );
}
