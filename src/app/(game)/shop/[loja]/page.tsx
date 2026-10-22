import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { elements } from "@/db/schema";
import { getActiveCharacter } from "@/lib/session";
import { computeItem } from "@/lib/game/item-stats";
import { GATE, gearPrice } from "@/lib/game/shop";
import { CONS, price, stack, type ConsKey } from "@/lib/consumables";
import {
  computeEquip,
  computeWeapon,
  EQUIP_NAMES,
  slotsFor,
  statLine,
  WEAPONS,
  TRAJE_TIERS,
  TRAJE_THEME,
  trajeName,
  trajeStats,
  type WeaponKind,
} from "@/lib/game/equipment";
import { usesSword, CLASS_NAME } from "@/lib/game/classes";
import { COMMON_Z } from "@/lib/game/world";
import {
  buyConsumable,
  buyGear,
  buyWeapon,
  buyTraje,
  buyReagent,
} from "@/actions/shop";
import { reagentPrice } from "@/lib/game/classdata"; // NOVO
import SafeImg from "@/components/game/SafeImg";
import GameIcon from "@/components/game/GameIcon";

const RC: Record<string, string> = {
  comum: "text-violet-300",
  raro: "text-cyan-300",
  epico: "text-purple-400",
  lendario: "text-amber-300",
};
const card =
  "flex items-center gap-3 rounded-lg border border-violet-900 bg-[#171433] p-3 transition-colors duration-300 hover:border-violet-500";
const btn =
  "rounded bg-violet-600 px-3 py-1 transition-colors duration-300 hover:bg-cyan-500 disabled:opacity-30";
const fmt = (n: number) => n.toLocaleString("pt-BR");

export default async function Shop({
  params,
  searchParams,
}: {
  params: Promise<{ loja: string }>;
  searchParams: Promise<{ peca?: string; aba?: string; arma?: string }>;
}) {
  const { loja } = await params;
  const sp = await searchParams;
  const a = await getActiveCharacter();
  if (!a) redirect("/characters");
  const { c } = a,
    gold = Number(c.gold),
    sword = usesSword(c.classKey);
  const head = (t: React.ReactNode, s: string) => (
    <>
      <Link href="/play" className="flex items-center gap-1 text-violet-300">
        <GameIcon name="arrowleft" /> Voltar à cidade
      </Link>
      <h1 className="flex items-center gap-2 text-xl font-bold">{t}</h1>
      <p className="flex items-center gap-1 text-sm text-violet-300">
        {s} · <GameIcon name="coin" className="text-amber-300" />{" "}
        <span className="text-amber-300">{fmt(gold)}</span>
      </p>
    </>
  );
  const tab = (href: string, on: boolean, l: React.ReactNode) => (
    <Link
      key={href}
      href={href}
      className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors duration-200 ${on ? "border-cyan-400 bg-cyan-950/40" : "border-violet-800 hover:bg-violet-900/40"}`}
    >
      {l}
    </Link>
  );

  // ═════════ CONVENIÊNCIA ═════════
  if (loja === "conveniencia") {
    const aba = sp.aba ?? "itens";
    const tabs = (
      <div className="flex flex-wrap gap-1">
        {tab(
          "/shop/conveniencia?aba=itens",
          aba === "itens",
          <>
            <GameIcon name="flask" /> Itens
          </>,
        )}
        {tab(
          "/shop/conveniencia?aba=armas",
          aba === "armas",
          <>
            <GameIcon name="book" /> Armas mágicas
          </>,
        )}
        {tab(
          "/shop/conveniencia?aba=trajes",
          aba === "trajes",
          <>
            <GameIcon name="tunic" /> Trajes de Batalha
          </>,
        )}
        {tab(
          "/shop/conveniencia?aba=reagentes",
          aba === "reagentes",
          <>
            <GameIcon name="ore" /> Reagentes
          </>,
        )}
      </div>
    );
    const only = (
      <div className="rounded-lg border border-violet-900 bg-[#171433] p-4 text-sm text-violet-300">
        Armas mágicas e Trajes de Batalha são exclusivos de{" "}
        <b>
          Orador, Oráculo, Ilusionista, Invocador, Dominador, Humano e Caçador
        </b>
        . Como <b>{CLASS_NAME[c.classKey]}</b>, você usa Lâminas e armaduras do
        Ferreiro.
      </div>
    );
    let body: React.ReactNode = null;
    if (aba === "itens") {
      const keys = Object.keys(CONS) as ConsKey[];
      const stock = await Promise.all(
        keys.map((k) => stack(c.id, CONS[k].name)),
      );
      body = keys.map((k, i) => {
        const p = price(k, c.level),
          have = stock[i].row?.quantity ?? 0;
        return (
          <div key={k} className={card}>
            <SafeImg
              src={`/items/${CONS[k].icon}.png`}
              className="h-12 w-12 rounded bg-violet-950 object-contain"
              fallback={
                <span className="grid h-12 w-12 place-items-center text-3xl text-violet-300">
                  <GameIcon
                    name={
                      k === "tp" ? "vortex" : k === "ea" ? "crystal" : "flask"
                    }
                  />
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
                  className={btn}
                >
                  +{n}
                </button>
              ))}
            </form>
          </div>
        );
      });
    } else if (aba === "armas") {
      if (sword) body = only;
      else {
        const kind =
          (sp.arma as WeaponKind) in WEAPONS
            ? (sp.arma as WeaponKind)
            : "cajado";
        const els = await db.select().from(elements);
        const list = els
          .map((e) => ({ e, s: computeItem(e) }))
          .sort((x, y) => x.s.score - y.s.score);
        body = (
          <>
            <div className="flex flex-wrap gap-1">
              {(Object.keys(WEAPONS) as WeaponKind[]).map((k) =>
                tab(
                  `/shop/conveniencia?aba=armas&arma=${k}`,
                  kind === k,
                  <>
                    <GameIcon name={WEAPONS[k].icon} /> {WEAPONS[k].label}
                  </>,
                ),
              )}
            </div>
            <p className="text-xs text-violet-300">
              {WEAPONS[kind].desc} Ao comprar, a arma é equipada.
            </p>
            {list.map(({ e, s }) => {
              const st = computeWeapon(kind, s),
                p = Math.round(gearPrice(s.value) * 1.2),
                gate = GATE[s.rarity],
                ok = c.level >= gate;
              return (
                <form
                  key={e.atomicNumber}
                  action={buyWeapon}
                  className={`${card} ${ok ? "" : "opacity-50"}`}
                >
                  <input type="hidden" name="kind" value={kind} />
                  <input type="hidden" name="z" value={e.atomicNumber} />
                  <SafeImg
                    src={`/items/${kind}-${e.symbol.toLowerCase()}.png`}
                    className="h-12 w-12 rounded bg-violet-950 object-contain"
                    fallback={
                      <span className="grid h-12 w-12 place-items-center text-3xl text-violet-300">
                        <GameIcon name={WEAPONS[kind].icon} />
                      </span>
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <b className={RC[s.rarity]}>
                      {WEAPONS[kind].label} de {e.name}
                    </b>
                    <div className="text-xs text-violet-300">
                      {statLine(st as Record<string, number>)} · {s.rarity} ·
                      Nv. {gate}+
                    </div>
                  </div>
                  <span className="text-amber-300">{fmt(p)}g</span>
                  <button disabled={!ok || gold < p} className={btn}>
                    {ok ? (
                      "Comprar"
                    ) : (
                      <>
                        <GameIcon name="lock" /> Nv. {gate}
                      </>
                    )}
                  </button>
                </form>
              );
            })}
          </>
        );
      }
    } else if (aba === "trajes") {
      if (sword) body = only;
      else {
        const th = TRAJE_THEME[c.classKey];
        body = (
          <>
            <p className="text-xs text-violet-300">
              Trajes exclusivos do seu estilo. Bônus especial desta classe:{" "}
              <b>{th?.label}</b>. Ao comprar, o traje é equipado.
            </p>
            {TRAJE_TIERS.map((T, i) => {
              const ok = c.level >= T.lv;
              return (
                <form
                  key={T.n}
                  action={buyTraje}
                  className={`${card} ${ok ? "" : "opacity-50"}`}
                >
                  <input type="hidden" name="tier" value={i} />
                  <SafeImg
                    src={`/items/traje-${c.classKey}-${i + 1}.png`}
                    className="h-12 w-12 rounded bg-violet-950 object-contain"
                    fallback={
                      <span className="grid h-12 w-12 place-items-center text-3xl text-violet-300">
                        <GameIcon name="tunic" />
                      </span>
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <b
                      className={
                        RC[
                          (
                            [
                              "comum",
                              "raro",
                              "raro",
                              "epico",
                              "epico",
                              "lendario",
                            ] as const
                          )[i]
                        ]
                      }
                    >
                      {trajeName(c.classKey, i)}
                    </b>
                    <div className="text-xs text-violet-300">
                      {statLine(
                        trajeStats(c.classKey, i) as Record<string, number>,
                      )}{" "}
                      · Nv. {T.lv}+
                    </div>
                  </div>
                  <span className="text-amber-300">{fmt(T.price)}g</span>
                  <button disabled={!ok || gold < T.price} className={btn}>
                    {ok ? (
                      "Comprar"
                    ) : (
                      <>
                        <GameIcon name="lock" /> Nv. {T.lv}
                      </>
                    )}
                  </button>
                </form>
              );
            })}
          </>
        );
      }
    } else {
      const els = (await db.select().from(elements))
        .filter((e) => COMMON_Z.includes(e.atomicNumber))
        .sort((x, y) => x.atomicNumber - y.atomicNumber);
      body = (
        <>
          <p className="text-xs text-violet-300">
            Reagentes: elementos comuns, baratos. Servem para o Laboratório
            (Atividades), para a forja e para a <b>Infusão Elemental</b> do
            Elemental.
          </p>
          {els.map((e) => {
            const p = reagentPrice(computeItem(e).value);
            return (
              <div key={e.atomicNumber} className={card}>
                <SafeImg
                  src={`/items/mat-${e.symbol.toLowerCase()}.png`}
                  className="h-10 w-10 rounded bg-violet-950 object-contain"
                  fallback={
                    <span className="grid h-10 w-10 place-items-center text-2xl text-violet-300">
                      <GameIcon name="ore" />
                    </span>
                  }
                />
                <div className="min-w-0 flex-1">
                  <b>{e.symbol}</b> · {e.name}{" "}
                  <span className="text-xs text-violet-400">{e.category}</span>
                </div>
                <form action={buyReagent} className="flex items-center gap-1">
                  <input type="hidden" name="z" value={e.atomicNumber} />
                  <span className="mr-1 text-amber-300">{fmt(p)}g</span>
                  {[1, 10].map((n) => (
                    <button
                      key={n}
                      name="n"
                      value={n}
                      disabled={gold < p * n}
                      className={btn}
                    >
                      +{n}
                    </button>
                  ))}
                </form>
              </div>
            );
          })}
        </>
      );
    }
    return (
      <main className="mx-auto max-w-2xl space-y-2 p-4">
        {head(
          <>
            <GameIcon name="flask" className="text-emerald-300" /> Loja de
            Conveniência
          </>,
          "Poções, armas mágicas, trajes e reagentes",
        )}
        {tabs}
        {body}
      </main>
    );
  }

  // ═════════ FERREIRO ═════════
  if (loja === "equipamentos") {
    const slots = slotsFor(c.classKey);
    const slot = slots.find((s) => s.key === sp.peca) ?? slots[0];
    const els = await db.select().from(elements);
    const list = els
      .map((e) => {
        const s = computeItem(e);
        return {
          e,
          s,
          stats: computeEquip(slot.key, s),
          p: gearPrice(s.value),
          gate: GATE[s.rarity],
        };
      })
      .sort((x, y) => x.s.score - y.s.score);
    return (
      <main className="mx-auto max-w-2xl space-y-2 p-4">
        {head(
          <>
            <GameIcon name="anvil" className="text-rose-300" /> Ferreiro —
            Equipamentos
          </>,
          "Ao comprar, a peça é equipada e substitui a atual",
        )}
        {!sword && (
          <p className="text-xs text-violet-300">
            Armas mágicas (Grimório, Orbe, Cajado) e Trajes de Batalha ficam na{" "}
            <Link
              href="/shop/conveniencia?aba=armas"
              className="text-cyan-300 underline"
            >
              Loja de Conveniência
            </Link>
            .
          </p>
        )}
        <div className="flex flex-wrap gap-1">
          {slots.map((s) =>
            tab(
              `/shop/equipamentos?peca=${s.key}`,
              slot.key === s.key,
              <>
                <GameIcon name={s.icon} /> {EQUIP_NAMES[c.classKey][s.key]}
              </>,
            ),
          )}
        </div>
        {list.map(({ e, s, stats, p, gate }) => {
          const ok = c.level >= gate;
          return (
            <form
              key={e.atomicNumber}
              action={buyGear}
              className={`${card} ${ok ? "" : "opacity-50"}`}
            >
              <input type="hidden" name="z" value={e.atomicNumber} />
              <input type="hidden" name="slot" value={slot.key} />
              <SafeImg
                src={`/items/${slot.prefix}-${e.symbol.toLowerCase()}.png`}
                className="h-12 w-12 rounded bg-violet-950 object-contain"
                fallback={
                  <span className="grid h-12 w-12 place-items-center text-3xl text-violet-300">
                    <GameIcon name={slot.icon} />
                  </span>
                }
              />
              <div className="min-w-0 flex-1">
                <b className={RC[s.rarity]}>
                  {EQUIP_NAMES[c.classKey][slot.key]} de {e.name}
                </b>
                <div className="text-xs text-violet-300">
                  {statLine(stats as Record<string, number>)} · {s.rarity} · a
                  partir do Nv. {gate}
                </div>
              </div>
              <span className="text-amber-300">{fmt(p)}g</span>
              <button disabled={!ok || gold < p} className={btn}>
                {ok ? (
                  "Comprar"
                ) : (
                  <>
                    <GameIcon name="lock" /> Nv. {gate}
                  </>
                )}
              </button>
            </form>
          );
        })}
      </main>
    );
  }
  notFound();
}
