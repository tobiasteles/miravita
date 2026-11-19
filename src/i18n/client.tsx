"use client";
import { createContext, useContext, useMemo } from "react";
import { makeFmt, makeT, type Lang } from "./core";

// Provedores se acumulam: o layout manda as chaves comuns, cada página acrescenta as suas (subset(lang, "char.", ...))
const Ctx = createContext<{ lang: Lang; d: Partial<Record<string, string>> }>({ lang: "pt-BR", d: {} });
export function I18nProvider({ lang, dict, children }: { lang: Lang; dict: Partial<Record<string, string>>; children: React.ReactNode }) {
  const parent = useContext(Ctx);
  const value = useMemo(() => ({ lang, d: { ...(parent.lang === lang ? parent.d : {}), ...dict } }), [lang, dict, parent]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useT() {
  const { lang, d } = useContext(Ctx);
  return useMemo(() => ({ lang, t: makeT<string>(d), f: makeFmt(lang) }), [lang, d]);
}
