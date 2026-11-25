import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { inventory, items } from "@/db/schema";
import { experiment, prepare, runRecipe, sellCompound } from "@/actions/lab";
import { ELEMENT_BY_Z } from "@/lib/game/elements";
import { COMPOUND_PT, compoundValue, equation, needs, pretty, PARSED, USES } from "@/lib/game/reactions";
import { known, ownedCompounds } from "@/lib/lab";
import { compoundName, elementName } from "@/i18n/content";
import { getT } from "@/i18n/server";
import { CONS } from "@/lib/consumables";
import Containment from "@/components/game/Containment";

const btn = "rounded bg-violet-600 px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40";
const card = "rounded-lg border border-violet-800 p-2 text-sm";

// Caderno de Descobertas + Bancada de Experimentos + Compostos. Tudo renderizado no servidor; as ações validam de novo.
export default async function Lab({ cid, activity }: { cid: string; activity: Parameters<typeof Containment>[0]["activity"] & { notebook?: string[] } }) {
  const { lang, t } = await getT();
  const mats = await db.select({ z: items.elementAtomicNumber, qty: inventory.quantity }).from(inventory).innerJoin(items, eq(inventory.itemId, items.id))
    .where(and(eq(inventory.characterId, cid), eq(items.type, "material"), gt(inventory.quantity, 0)));
  const have = new Map(mats.map((m) => [m.z, m.qty])), comps = await ownedCompounds(cid), kn = known(activity);
  const owned = (n: { el: number | null; sp: string }) => (n.el != null ? have.get(n.el) ?? 0 : comps.find((c) => c.f === n.sp)?.qty ?? 0);
  const species = [
    ...mats.filter((m) => m.z).map((m) => ({ v: ELEMENT_BY_Z.get(m.z!)![1], label: `${ELEMENT_BY_Z.get(m.z!)![1]} — ${elementName(lang, m.z!, ELEMENT_BY_Z.get(m.z!)![2])} ×${m.qty}` })),
    ...comps.map((c) => ({ v: c.f, label: `${pretty(c.f)} — ${compoundName(lang, c.f, COMPOUND_PT[c.f])} ×${c.qty}` })),
  ];
  const sel = (n: number) => (
    <select name={`s${n}`} aria-label={t("lab.reagent", { n })} className="min-h-9 flex-1 rounded border border-violet-700 bg-[#0c0a1f] px-1 text-xs">
      <option value="">{t("lab.none")}</option>
      {species.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
    </select>
  );
  return (
    <div className="space-y-3">
      <Containment cid={cid} activity={activity} />
      <div>
        <h3 className="mb-1 text-sm font-semibold text-emerald-200">{t("lab.notebook", { n: kn.size, total: PARSED.length })}</h3>
        <div className="space-y-1">
          {PARSED.map((p) => {
            if (!kn.has(p.id)) return <div key={p.id} className={`${card} text-violet-400`}>🔒 {t("lab.locked")}</div>;
            const ok = needs(p).every((n) => owned(n) >= n.q) && (!p.cat || owned({ el: null, sp: p.cat }) >= 1);
            return (
              <form key={p.id} action={runRecipe} className={`${card} flex items-center gap-2`}>
                <input type="hidden" name="id" value={p.id} />
                <div className="flex-1">
                  <b className="font-mono">{equation(p)}</b>
                  <div className="text-xs text-violet-300">{t(`lab.cond.${p.cond}` as "lab.cond.none")}{p.cat ? ` · ${t("lab.cat", { sp: pretty(p.cat) })}` : ""}</div>
                </div>
                <button disabled={!ok} className={btn}>{t("lab.run")}</button>
              </form>
            );
          })}
        </div>
      </div>

      <form action={experiment} className={`${card} space-y-2`}>
        <h3 className="text-sm font-semibold text-emerald-200">{t("lab.bench")}</h3>
        <p className="text-xs text-violet-300">{t("lab.benchHelp")}</p>
        <div className="flex flex-wrap gap-2">{sel(1)}{sel(2)}{sel(3)}</div>
        <button disabled={!species.length} className={btn}>{t("lab.mix")}</button>
      </form>

      <div>
        <h3 className="mb-1 text-sm font-semibold text-emerald-200">{t("lab.compounds")}</h3>
        {!comps.length && <p className="text-xs text-violet-400">{t("lab.noCompounds")}</p>}
        <div className="space-y-1">
          {comps.map((c) => {
            const use = USES[c.f];
            return (
              <div key={c.f} className={`${card} flex flex-wrap items-center gap-2`}>
                <div className="min-w-0 flex-1"><b>{compoundName(lang, c.f, COMPOUND_PT[c.f])}</b> <span className="font-mono text-xs text-violet-300">{pretty(c.f)} ×{c.qty}</span>
                  <div className="text-xs text-amber-200">{compoundValue(c.f)}g{use ? ` · ${use.n}× ${CONS[use.cons].name}` : ""}</div></div>
                {[...(use ? [["prepare", prepare, t("lab.prepare")] as const] : []), ["sell", sellCompound, t("lab.sell")] as const].map(([k, action, label]) => (
                  <form key={k} action={action} className="flex items-center gap-1">
                    <input type="hidden" name="f" value={c.f} />
                    <input type="number" name="n" min={1} max={c.qty} defaultValue={1} aria-label={t("lab.qty")} className="w-14 rounded border border-violet-700 bg-[#0c0a1f] px-1 py-1 text-xs" />
                    <button className={btn}>{label}</button>
                  </form>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
