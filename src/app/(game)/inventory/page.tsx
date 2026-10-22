import { redirect } from "next/navigation";
import Link from "next/link";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { inventory, items, elements } from "@/db/schema";
import { getActiveCharacter } from "@/lib/session";
import { toggleEquip } from "@/actions/inventory";
import SafeImg from "@/components/game/SafeImg";
import CraftingBench from "@/components/game/CraftingBench";
import { SLOTS, slotsFor, slotIcon, slotPrefix, statLine } from "@/lib/game/equipment";
import { usesSword } from "@/lib/game/classes";
import GameIcon from "@/components/game/GameIcon";

const RC: Record<string, string> = {
  comum: "text-violet-300",
  raro: "text-cyan-300",
  epico: "text-purple-400",
  lendario: "text-amber-300",
};
const st = (s: Record<string, number | undefined>) => statLine(s);

export default async function Inv() {
  const a = await getActiveCharacter();
  if (!a) redirect("/characters");
  const rows = await db
    .select({ inv: inventory, it: items, el: elements })
    .from(inventory)
    .innerJoin(items, eq(inventory.itemId, items.id))
    .leftJoin(elements, eq(items.elementAtomicNumber, elements.atomicNumber))
    .where(eq(inventory.characterId, a.c.id));
  const mats = rows
    .filter((r) => r.it.type === "material" && r.inv.quantity > 0)
    .map((r) => ({
      z: r.it.elementAtomicNumber!,
      symbol: r.el!.symbol,
      name: r.it.name,
      qty: r.inv.quantity,
      rarity: r.it.rarity,
    }));
  const gear = rows
    .filter((r) => r.it.type !== "material")
    .sort((x, y) => (y.inv.equipped ? 1 : 0) - (x.inv.equipped ? 1 : 0));

  return (
    <main className="mx-auto max-w-xl space-y-3 p-4">
      <Link href="/play" className="text-violet-300">
        ← Voltar
      </Link>
      <h1 className="flex items-center gap-2 text-xl font-bold"><GameIcon name="anvil" className="text-rose-300" /> Bancada de Forja</h1>
      <section className="rounded-lg border border-violet-900 bg-[#171433] p-3">
        <CraftingBench
          mats={mats}
          slots={SLOTS.map((s) => ({
            key: s.key,
            label: s.label,
            icon: s.icon,
          }))}
        />
      </section>

      <section className="rounded-lg border border-violet-900 bg-[#171433] p-3">
        <b>Equipamentos</b>
        <div className="mt-2 grid grid-cols-6 gap-1 text-center text-[10px] text-violet-400">
          {[...slotsFor(a.c.classKey), ...(usesSword(a.c.classKey) ? [] : [{ key: "acessorio", icon: "tunic" as const, label: "Traje" }])].map((s) => (
            <div key={s.key} className="flex flex-col items-center">
              <GameIcon name={s.icon} size="1.4em" />
              {gear.some((g) => g.it.type === s.key && g.inv.equipped) ? <GameIcon name="check" className="text-emerald-400" /> : "—"}
            </div>
          ))}
        </div>
        {gear.map((r) => (
          <div
            key={r.inv.id}
            className={`mt-2 flex items-center gap-2 border-t border-violet-900 pt-2 ${RC[r.it.rarity]}`}
          >
            <SafeImg
              src={`/items/${slotPrefix(r.it.type)}-${r.el?.symbol.toLowerCase()}.png`}
              className="h-10 w-10 rounded bg-violet-950 object-contain"
              fallback={<span className="text-2xl text-violet-300"><GameIcon name={slotIcon(r.it.type)} /></span>}
            />
            <div className="min-w-0 flex-1">
              <div>
                {r.inv.equipped ? <GameIcon name="check" className="mr-1 text-emerald-400" /> : null}
                {r.it.name}
              </div>
              <div className="text-xs text-violet-400">
                {r.it.rarity} · {st(r.it.stats as Record<string, number>)} · Dur {r.inv.currentDurability}
              </div>
            </div>
            <form action={toggleEquip}>
              <input type="hidden" name="id" value={r.inv.id} />
              <button
                className={`rounded border px-2 py-1 text-xs transition-colors duration-200 ${r.inv.equipped ? "border-rose-700 text-rose-300 hover:bg-rose-950/40" : "border-violet-700 hover:bg-violet-900/40"}`}
              >
                {r.inv.equipped ? "Tirar" : "Equipar"}
              </button>
            </form>
          </div>
        ))}
        {!gear.length && (
          <div className="mt-2 text-sm text-violet-400">
            Nenhum equipamento ainda. Forje acima.
          </div>
        )}
      </section>

      <section className="rounded-lg border border-violet-900 bg-[#171433] p-3">
        <b>Elementos</b>
        {mats.map((m) => (
          <div
            key={m.z}
            className="flex items-center gap-2 border-t border-violet-900 py-2"
          >
            <SafeImg
              src={`/items/mat-${m.symbol.toLowerCase()}.png`}
              className="h-10 w-10 rounded bg-violet-950 object-contain"
              fallback={<span className="text-2xl text-violet-300"><GameIcon name="ore" /></span>}
            />
            <div className={`flex-1 ${RC[m.rarity]}`}>
              <b>
                {m.symbol} · {m.name}
              </b>{" "}
              ×{m.qty}
              <div className="text-xs text-violet-400">{m.rarity}</div>
            </div>
          </div>
        ))}
        {!mats.length && (
          <div className="mt-2 text-sm text-violet-400">
            Vazio. Derrote monstros para obter elementos.
          </div>
        )}
      </section>
    </main>
  );
}
