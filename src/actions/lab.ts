"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { characters } from "@/db/schema";
import { withChar } from "@/lib/lock";
import { addCons, CONS } from "@/lib/consumables";
import { addStone } from "@/lib/stone";
import { takeElement } from "@/lib/equip";
import { hasAll, isSpecies, known, perform, speciesQty, takeCompound } from "@/lib/lab";
import { BY_ID, COMPOUND_PT, compoundValue, elementOf, equation, findDanger, findReaction, pretty, USES } from "@/lib/game/reactions";
import { ELEMENT_BY_Z } from "@/lib/game/elements";
import { compoundName, elementName } from "@/i18n/content";
import { getT } from "@/i18n/server";

type Act = NonNullable<(typeof characters.$inferSelect)["activity"]>;
const save = (id: string, activity: Act) => db.update(characters).set({ activity: activity as never }).where(eq(characters.id, id));
const done = () => revalidatePath("/atividades");

// Os relatórios são gravados no idioma de quem joga (como o log da batalha). Tudo roda sob withChar: o servidor decide, o cliente só pede.
export async function runRecipe(fd: FormData) {
  return withChar(async (a) => {
    if (!a) return;
    const { lang, t } = await getT(), act: Act = a.c.activity ?? {}, id = String(fd.get("id")), p = BY_ID.get(id);
    const say = (m: string) => save(a.c.id, { ...act, last: [m] });
    if (!p || !known(act).has(id)) { await say(t("lab.r.unknown")); return done(); }
    const made = await perform(a.c.id, p, a.c.classKey === "quimica" ? 1.5 : 1);
    await say(made ? t("lab.r.made", { eq: equation(p), items: list(lang, made) }) : t("lab.r.missing", { eq: equation(p) }));
    done();
  });
}

// Bancada: o jogador escolhe 1 a 3 reagentes; o servidor acha a reação (ou o acidente) pela mistura. Descobrir uma reação a coloca no Caderno.
export async function experiment(fd: FormData) {
  return withChar(async (a) => {
    if (!a) return;
    const { lang, t } = await getT(), act: Act = a.c.activity ?? {};
    const sp = [...new Set(["s1", "s2", "s3"].map((k) => String(fd.get(k) ?? "").trim()).filter(Boolean))];
    const say = async (m: string, notebook = act.notebook) => { await save(a.c.id, { ...act, notebook, last: [m] }); done(); };
    if (!sp.length || sp.length > 3 || !sp.every(isSpecies)) return say(t("lab.r.pick"));
    const cx = (s: string) => { const e = elementOf(s); return { el: e ? Z_OF.get(e.sym) ?? null : null, sp: s }; };
    for (const s of sp) if ((await speciesQty(a.c.id, cx(s))) < 1) return say(t("lab.r.pick")); // só mistura o que tem
    const p = findReaction(sp);
    if (p) {
      if (!(await hasAll(a.c.id, p))) return say(t("lab.r.missing", { eq: equation(p) }));
      const made = await perform(a.c.id, p, a.c.classKey === "quimica" ? 1.5 : 1);
      if (!made) return say(t("lab.r.missing", { eq: equation(p) }));
      const first = !known(act).has(p.id);
      return say(t(first ? "lab.r.discovered" : "lab.r.made", { eq: equation(p), items: list(lang, made) }), first ? [...(act.notebook ?? []), p.id] : act.notebook);
    }
    const d = findDanger(sp);
    if (d) { // acidente leve: perde 1 unidade de cada reagente e uma fração do HP atual (nunca abaixo de 1)
      for (const s of sp) { const c = cx(s); if (c.el != null) await takeElement(a.c.id, c.el, 1); else await takeCompound(a.c.id, s, 1); }
      const loss = Math.min(Math.max(a.c.hp - 1, 0), Math.max(1, Math.round(a.c.hp * d.hp)));
      await db.update(characters).set({ hp: a.c.hp - loss }).where(eq(characters.id, a.c.id));
      return say(t("lab.r.accident", { why: t(d.why as "chem.d.alkaliAcid"), hp: loss }));
    }
    return say(t("lab.r.nothing"));
  });
}

// "Preparar": composto → consumível (poção, pedra de teletransporte)
export async function prepare(fd: FormData) {
  return withChar(async (a) => {
    if (!a) return;
    const { lang, t } = await getT(), act: Act = a.c.activity ?? {}, f = String(fd.get("f")), use = USES[f], n = Math.max(1, Math.min(99, Math.floor(Number(fd.get("n")) || 1)));
    if (!use || !(await takeCompound(a.c.id, f, n))) return done();
    const out = Math.round(use.n * n * (a.c.classKey === "quimica" ? 1.5 : 1));
    if (use.cons === "tp") await addStone(a.c.id, out); else await addCons(a.c.id, CONS[use.cons].name, out);
    await save(a.c.id, { ...act, last: [t("lab.r.prepared", { n: out, item: CONS[use.cons].name, name: compoundName(lang, f, COMPOUND_PT[f]) })] });
    done();
  });
}

export async function sellCompound(fd: FormData) {
  return withChar(async (a) => {
    if (!a) return;
    const { lang, t } = await getT(), act: Act = a.c.activity ?? {}, f = String(fd.get("f")), n = Math.max(1, Math.min(999, Math.floor(Number(fd.get("n")) || 1)));
    if (!(f in COMPOUND_PT) || !(await takeCompound(a.c.id, f, n))) return done();
    const g = compoundValue(f) * n;
    await db.update(characters).set({ gold: Number(a.c.gold) + g }).where(eq(characters.id, a.c.id));
    await save(a.c.id, { ...act, last: [t("lab.r.sold", { n, name: compoundName(lang, f, COMPOUND_PT[f]), g })] });
    done();
  });
}

const Z_OF = new Map([...ELEMENT_BY_Z.values()].map((e) => [e[1], e[0]]));
const list = (lang: "pt-BR" | "en", made: { sp: string; q: number }[]) =>
  made
    .map((m) => {
      const e = elementOf(m.sp), z = e ? Z_OF.get(e.sym) : undefined;
      return `${m.q}× ${z ? elementName(lang, z, ELEMENT_BY_Z.get(z)![2]) : `${compoundName(lang, m.sp, COMPOUND_PT[m.sp])} (${pretty(m.sp)})`}`;
    })
    .join(", ");
