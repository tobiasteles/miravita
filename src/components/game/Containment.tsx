import { containAction, craftGear, drinkAntidote, releaseAction, useRadio } from "@/actions/hazard";
import { ELEMENT_BY_Z } from "@/lib/game/elements";
import { CONT_LIMIT, GEAR, OUT_LIMIT, RADIO, doseNow, gameHalfLifeHours, isRadioactive, penalty } from "@/lib/game/hazard";
import { pretty } from "@/lib/game/reactions";
import { elemQty, gearQty, held } from "@/lib/hazard";
import { compoundQty } from "@/lib/lab";
import { elementName } from "@/i18n/content";
import { getT } from "@/i18n/server";

const btn = "rounded bg-violet-600 px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40";
const card = "rounded-lg border border-violet-800 p-2 text-sm";
type Act = { hz?: Parameters<typeof doseNow>[0]; cont?: Record<string, number> } | null;

// Contenção e Segurança: exposição atual, estoque (comigo × Contenção), proteção e usos da radioatividade
export default async function Containment({ cid, activity }: { cid: string; activity: Act }) {
  const { lang, t } = await getT();
  const dose = doseNow(activity?.hz), pen = penalty(dose), mine = await held(cid), cont = activity?.cont ?? {};
  const out = mine.reduce((s, h) => s + h.qty, 0), inCont = Object.values(cont).reduce((s, v) => s + v, 0);
  const zs = [...new Set([...mine.map((h) => h.z), ...Object.keys(cont).map(Number)])].sort((a, b) => a - b);
  const form = (action: (fd: FormData) => Promise<void>, z: number, max: number, label: string) => (
    <form action={action} className="flex items-center gap-1">
      <input type="hidden" name="z" value={z} />
      <input type="number" name="n" min={1} max={max} defaultValue={1} disabled={max < 1} aria-label={label} className="w-14 rounded border border-violet-700 bg-[#0c0a1f] px-1 py-1 text-xs" />
      <button disabled={max < 1} className={btn}>{label}</button>
    </form>
  );
  const keys = Object.keys(GEAR) as (keyof typeof GEAR)[];
  const owned = Object.fromEntries(await Promise.all(keys.map(async (k) => [k, await gearQty(cid, k)])));
  const cost = (k: keyof typeof GEAR) => [...GEAR[k].inp.map(([z, q]) => `${q}× ${ELEMENT_BY_Z.get(z)![1]}`), ...GEAR[k].cmp.map(([f, q]) => `${q}× ${pretty(f)}`)].join(" + ");
  const radios = await Promise.all(Object.entries(RADIO).map(async ([id, r]) => ({ id, r, ok: (await Promise.all(r.inp.map(async ([z, q]) => (await elemQty(cid, z)) >= q))).every(Boolean) })));
  const can = Object.fromEntries(await Promise.all(keys.map(async (k) => [k, (await Promise.all(GEAR[k].inp.map(async ([z, q]) => (await elemQty(cid, z)) >= q))).every(Boolean) && (await Promise.all(GEAR[k].cmp.map(async ([f, q]) => (await compoundQty(cid, f)) >= q))).every(Boolean)])));
  return (
    <section className="space-y-3 rounded-xl border border-amber-700/50 bg-[#171433] p-3" aria-label={t("hz.title")}>
      <h3 className="text-sm font-semibold text-amber-200">☢ {t("hz.title")}</h3>
      <div className={`${card} space-y-1`}>
        {dose >= 1 ? <b className="text-amber-200">{t("hz.status", { dose: Math.round(dose), pen: Math.round(pen * 100) })}</b> : <p className="text-xs text-violet-300">{t("hz.safe")}</p>}
        <div className="h-2 overflow-hidden rounded bg-slate-800" role="progressbar" aria-valuenow={Math.round(dose)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-amber-400 transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${dose}%` }} />
        </div>
        {out > 0 && <p className="text-xs text-amber-300">{t("hz.warn")}</p>}
        <p className="text-xs text-violet-300">{t("hz.outside", { n: out, max: OUT_LIMIT })} · {t("hz.contTotal", { n: inCont, max: CONT_LIMIT })}</p>
      </div>

      {!zs.length && <p className="text-xs text-violet-400">{t("hz.none")}</p>}
      <div className="space-y-1">
        {zs.map((z) => {
          const e = ELEMENT_BY_Z.get(z)!, m = mine.find((h) => h.z === z)?.qty ?? 0, c = cont[z] ?? 0, rad = isRadioactive(z);
          return (
            <div key={z} className={`${card} flex flex-wrap items-center gap-2`}>
              <div className="min-w-0 flex-1">
                <b>{e[1]}</b> {elementName(lang, z, e[2])} <span className={rad ? "text-lime-300" : "text-fuchsia-300"}>{rad ? `☢ ${t("hz.rad")}` : `☠ ${t("hz.tox")}`}</span>
                <div className="text-xs text-violet-300">{t("hz.colMine")}: {m} · {t("hz.colCont")}: {c}{rad ? ` · ${t("hz.halfLife", { h: Math.round(gameHalfLifeHours(z)) })}` : ""}</div>
              </div>
              {form(containAction, z, m, t("hz.store"))}
              {form(releaseAction, z, c, t("hz.takeOut"))}
            </div>
          );
        })}
      </div>

      <div>
        <h4 className="mb-1 text-xs font-semibold text-emerald-200">{t("hz.protect")}</h4>
        <div className="space-y-1">
          {keys.map((k) => (
            <div key={k} className={`${card} flex flex-wrap items-center gap-2`}>
              <div className="min-w-0 flex-1"><b>{t(`hz.item.${k}` as "hz.item.lead")}</b> <span className="text-xs text-violet-300">({t("hz.owned")} {owned[k]})</span>
                <div className="text-xs text-violet-300">{t(`hz.desc.${k}` as "hz.desc.lead")} · {t("hz.cost", { cost: cost(k) })}</div></div>
              <form action={craftGear}><input type="hidden" name="id" value={k} /><button disabled={!can[k] || (GEAR[k].once && owned[k] > 0)} className={btn}>{t("hz.craft")}</button></form>
              {k === "antidote" && <form action={drinkAntidote}><button disabled={owned.antidote < 1 || dose < 1} className={btn}>{t("hz.drink")}</button></form>}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-1 text-xs font-semibold text-emerald-200">{t("hz.radio")}</h4>
        <div className="space-y-1">
          {radios.map(({ id, ok }) => (
            <form key={id} action={useRadio} className={`${card} flex items-center gap-2`}>
              <input type="hidden" name="id" value={id} />
              <span className="flex-1">{t(`hz.use.${id}` as "hz.use.cell")}</span>
              <button disabled={!ok} className={btn}>{t("hz.use")}</button>
            </form>
          ))}
        </div>
      </div>
    </section>
  );
}
