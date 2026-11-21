import type { Sk } from "@/lib/game/classdata";
import type { Lang } from "./core";
import { tFor } from "./index";

// descrição do poder no idioma (a de classdata.ts é o texto em português). Só servidor: usa os dicionários completos.
export function skillDesc(lang: Lang, s: Sk): string {
  const t = tFor(lang), p = s.p;
  switch (s.t) {
    case "d": return t("sk.d.d", { p }) + (s.cr ? t("sk.d.cr", { cr: s.cr }) : "");
    case "dot": return t("sk.d.dot", { p });
    case "bq": return t("sk.d.bq", { p });
    case "st": return t("sk.d.st", { p });
    case "b": return t("sk.d.b");
    case "e": return t("sk.d.e", { x: s.x ?? 3 }) + ((s.x ?? 3) > 3 ? t("sk.d.eSif") : "");
    case "ag": return t("sk.d.ag");
    case "sv": return t("sk.d.sv", { p });
    case "nuke": return t("sk.d.nuke", { p });
  }
}
