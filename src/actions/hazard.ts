"use server";
import { revalidatePath } from "next/cache";
import { withChar } from "@/lib/lock";
import { addCons, CONS } from "@/lib/consumables";
import { addDose, addGear, contain, elemQty, elemTake, gearQty, release, saveActivity, takeGear } from "@/lib/hazard";
import { compoundQty, takeCompound } from "@/lib/lab";
import { GEAR, HAZ_Z, RADIO } from "@/lib/game/hazard";
import { ELEMENT_BY_Z } from "@/lib/game/elements";
import { elementName } from "@/i18n/content";
import { getT } from "@/i18n/server";

// Contenção e segurança. Tudo sob withChar (servidor decide): o cliente só pede "guardar 5 de U", "fabricar", "usar".
const done = () => { revalidatePath("/atividades"); revalidatePath("/inventory"); };
const num = (v: FormDataEntryValue | null, max = 999) => Math.max(1, Math.min(max, Math.floor(Number(v)) || 1));
const nm = (lang: "pt-BR" | "en", z: number) => elementName(lang, z, ELEMENT_BY_Z.get(z)![2]);

export async function containAction(fd: FormData) {
  return withChar(async (a) => {
    if (!a) return;
    const { lang, t } = await getT(), z = Number(fd.get("z")), n = num(fd.get("n")), put = HAZ_Z.includes(z) ? await contain(a.c.id, z, n) : 0;
    await saveActivity(a.c.id, { ...(a.c.activity ?? {}), last: [put ? t("hz.r.stored", { n: put, name: nm(lang, z) }) : t("hz.r.nothing")] });
    done();
  });
}
export async function releaseAction(fd: FormData) {
  return withChar(async (a) => {
    if (!a) return;
    const { lang, t } = await getT(), z = Number(fd.get("z")), n = num(fd.get("n")), got = HAZ_Z.includes(z) ? await release(a.c.id, z, n) : 0;
    await saveActivity(a.c.id, { ...(a.c.activity ?? {}), last: [got ? t(got < n ? "hz.r.takenLimit" : "hz.r.taken", { n: got, name: nm(lang, z) }) : t("hz.r.limit")] });
    done();
  });
}
// fabrica recipiente de chumbo, EPI ou antídoto (elementos e compostos podem estar na Contenção)
export async function craftGear(fd: FormData) {
  return withChar(async (a) => {
    if (!a) return;
    const { t } = await getT(), key = String(fd.get("id")) as keyof typeof GEAR, g = GEAR[key];
    const say = async (m: string) => { await saveActivity(a.c.id, { ...(a.c.activity ?? {}), last: [m] }); done(); };
    if (!g) return say(t("hz.r.missing"));
    const item = t(`hz.item.${key}` as "hz.item.lead");
    if (g.once && (await gearQty(a.c.id, key)) > 0) return say(t("hz.r.have", { item }));
    for (const [z, q] of g.inp) if ((await elemQty(a.c.id, z)) < q) return say(t("hz.r.missing"));
    for (const [f, q] of g.cmp) if ((await compoundQty(a.c.id, f)) < q) return say(t("hz.r.missing"));
    for (const [z, q] of g.inp) await elemTake(a.c.id, z, q);
    for (const [f, q] of g.cmp) await takeCompound(a.c.id, f, q);
    await addGear(a.c.id, key, 1);
    return say(t("hz.r.crafted", { item }));
  });
}
export async function drinkAntidote() {
  return withChar(async (a) => {
    if (!a) return;
    const { t } = await getT(), ok = await takeGear(a.c.id, "antidote", 1);
    if (ok) await addDose(a.c.id, -50);
    await saveActivity(a.c.id, { ...(a.c.activity ?? {}), last: [ok ? t("hz.r.drank") : t("hz.r.noAntidote")] });
    done();
  });
}
// usos da radioatividade: célula de energia (EA) e isótopos médicos (HP)
export async function useRadio(fd: FormData) {
  return withChar(async (a) => {
    if (!a) return;
    const { lang, t } = await getT(), id = String(fd.get("id")), r = RADIO[id];
    const say = async (m: string) => { await saveActivity(a.c.id, { ...(a.c.activity ?? {}), last: [m] }); done(); };
    if (!r) return say(t("hz.r.missing"));
    for (const [z, q] of r.inp) if ((await elemQty(a.c.id, z)) < q) return say(t("hz.r.missing"));
    for (const [z, q] of r.inp) await elemTake(a.c.id, z, q);
    const n = Math.round(r.n * (a.c.classKey === "quimica" ? 1.5 : 1));
    await addCons(a.c.id, CONS[r.cons].name, n);
    return say(t("hz.r.used", { n, item: CONS[r.cons].name, inp: r.inp.map(([z, q]) => `${q}× ${nm(lang, z)}`).join(", ") }));
  });
}
