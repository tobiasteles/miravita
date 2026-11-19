// Parte LEVE do i18n (sem dicionários): pode ir para o cliente. Os dicionários ficam em index.ts (servidor e testes).
export const LANGS = ["pt-BR", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "pt-BR";
export const LANG_COOKIE = "mv_lang";
export type Vars = Record<string, string | number>;
export const isLang = (v: unknown): v is Lang => typeof v === "string" && (LANGS as readonly string[]).includes(v);
const INTL: Record<Lang, string> = { "pt-BR": "pt-BR", en: "en-US" };

// pré-seleção a partir do Accept-Language ("en-US,en;q=0.9,pt;q=0.8"); vence a tag de maior q que seja pt* ou en*
export function pickLang(header: string | null | undefined): Lang {
  const tags = String(header ?? "")
    .split(",")
    .map((p) => { const [tag, ...r] = p.trim().split(";"); const q = Number(r.find((x) => x.trim().startsWith("q="))?.split("=")[1] ?? 1); return { tag: tag.toLowerCase(), q: Number.isFinite(q) ? q : 0 }; })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of tags) {
    if (tag.startsWith("pt")) return "pt-BR";
    if (tag.startsWith("en")) return "en";
  }
  return DEFAULT_LANG;
}
export const interpolate = (s: string, vars?: Vars) => (vars ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : s);

// t(chave, vars). `fallback` = dicionário completo do idioma-base (só o servidor tem); sem ele, chave ausente devolve a própria chave
export function makeT<K extends string>(d: Partial<Record<K, string>>, fallback?: Partial<Record<K, string>>) {
  return (key: K, vars?: Vars) => interpolate(d[key] ?? fallback?.[key] ?? key, vars);
}
// números e datas sempre por Intl (nunca formatados à mão)
export function makeFmt(lang: Lang) {
  const loc = INTL[lang];
  return {
    n: (v: number, o?: Intl.NumberFormatOptions) => new Intl.NumberFormat(loc, o).format(v),
    date: (d: Date | number | string, o?: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(loc, o).format(new Date(d)),
  };
}
