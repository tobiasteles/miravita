import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { elements } from "@/db/schema";
import { getActiveCharacter } from "@/lib/session";
import { computeItem } from "@/lib/game/item-stats";
import { GATE, gearPrice } from "@/lib/game/shop";
import { CONS, price, stack, type ConsKey } from "@/lib/consumables";
import { buyConsumable, buyGear } from "@/actions/shop";
import SafeImg from "@/components/game/SafeImg";

const RC: Record<string, string> = {
  comum: "text-violet-300",
  raro: "text-cyan-300",
  epico: "text-purple-400",
  lendario: "text-amber-300",
};
const card =
  "flex items-center gap-3 rounded-lg border border-violet-900 bg-[#171433] p-3 transition-colors duration-300 hover:border-violet-500";
const fmt = (n: number) => n.toLocaleString("pt-BR");

export default async function Shop({
  params,
}: {
  params: Promise<{ loja: string }>;
}) {
  const { loja } = await params;
  const a = await getActiveCharacter();
  if (!a) redirect("/characters");
  const { c } = a,
    gold = Number(c.gold);
  const head = (t: string, s: string) => (
    <>
      <Link href="/play" className="text-violet-300">
        ← Voltar à cidade
      </Link>
      <h1 className="text-xl font-bold">{t}</h1>
      <p className="text-sm text-violet-300">
        {s} · <span className="text-amber-300">💰 {fmt(gold)}</span>
      </p>
    </>
  );

  if (loja === "conveniencia") {
    const keys = Object.keys(CONS) as ConsKey[];
    const stock = await Promise.all(keys.map((k) => stack(c.id, CONS[k].name)));
    return (
      <main className="mx-auto max-w-2xl space-y-2 p-4">
        {head("🏪 Loja de Conveniência", "Poções e pedras de teletransporte")}
        {keys.map((k, i) => {
          const p = price(k, c.level),
            have = stock[i].row?.quantity ?? 0;
          return (
            <div key={k} className={card}>
              <SafeImg
                src={`/items/${CONS[k].icon}.png`}
                className="h-12 w-12 rounded bg-violet-950 object-contain"
                fallback={
                  <span className="grid h-12 w-12 place-items-center text-3xl">
                    {CONS[k].emoji}
                  </span>
                }
              />
              <div className="min-w-0 flex-1">
                <b>{CONS[k].name}</b>{" "}
                <span className="text-xs text-violet-400">você tem {have}</span>
                <div className="text-xs text-violet-300">{CONS[k].desc}</div>
              </div>
              <form action={buyConsumable} className="flex items-center gap-1">
                <input type="hidden" name="k" value={k} />
                <span className="mr-1 text-amber-300">{fmt(p)}g</span>
                {[1, 5].map((n) => (
                  <button
                    key={n}
                    name="n"
                    value={n}
                    disabled={gold < p * n}
                    className="rounded bg-violet-600 px-3 py-1 transition-colors duration-300 hover:bg-cyan-500 disabled:opacity-30"
                  >
                    +{n}
                  </button>
                ))}
              </form>
            </div>
          );
        })}
      </main>
    );
  }

  if (loja === "armas" || loja === "armaduras") {
    const kind = loja === "armas" ? "arma" : "armadura",
      els = await db.select().from(elements);
    const list = els
      .map((e) => {
        const s = computeItem(e);
        return { e, s, p: gearPrice(s.value), gate: GATE[s.rarity] };
      })
      .sort((x, y) => x.s.score - y.s.score);
    return (
      <main className="mx-auto max-w-2xl space-y-2 p-4">
        {head(
          kind === "arma" ? "⚔️ Vendedor de Armas" : "🛡️ Vendedor de Armaduras",
          "Ao comprar, o item é equipado e substitui o atual",
        )}
        {list.map(({ e, s, p, gate }) => {
          const ok = c.level >= gate;
          return (
            <form
              key={e.atomicNumber}
              action={buyGear}
              className={`${card} ${ok ? "" : "opacity-50"}`}
            >
              <input type="hidden" name="z" value={e.atomicNumber} />
              <input type="hidden" name="kind" value={kind} />
              <SafeImg
                src={`/items/${kind === "arma" ? "blade" : "armor"}-${e.symbol.toLowerCase()}.png`}
                className="h-12 w-12 rounded bg-violet-950 object-contain"
                fallback={
                  <span className="grid h-12 w-12 place-items-center text-3xl">
                    {kind === "arma" ? "⚔️" : "🛡️"}
                  </span>
                }
              />
              <div className="min-w-0 flex-1">
                <b className={RC[s.rarity]}>
                  {kind === "arma" ? "Lâmina" : "Armadura"} de {e.name}
                </b>
                <div className="text-xs text-violet-300">
                  {kind === "arma" ? `ATK +${s.atk}` : `DEF +${s.def}`} · Dur{" "}
                  {s.durability} · {s.rarity} · a partir do Nv. {gate}
                </div>
              </div>
              <span className="text-amber-300">{fmt(p)}g</span>
              <button
                disabled={!ok || gold < p}
                className="rounded bg-violet-600 px-3 py-1 transition-colors duration-300 hover:bg-cyan-500 disabled:opacity-30"
              >
                {ok ? "Comprar" : `🔒 Nv. ${gate}`}
              </button>
            </form>
          );
        })}
      </main>
    );
  }
  notFound();
}
