import { en } from "./en";
import { makeT, type Lang, DEFAULT_LANG } from "./core";
import { ptBR, type Key } from "./pt-BR";
export * from "./core";
export type { Key } from "./pt-BR";

export const dicts: Record<Lang, Record<Key, string>> = { "pt-BR": ptBR, en };
export const tFor = (lang: Lang) => makeT<Key>(dicts[lang], dicts[DEFAULT_LANG]);
// só as chaves com esses prefixos (o que um componente de cliente precisa, para não mandar o dicionário inteiro)
export function subset(lang: Lang, ...prefixes: string[]): Partial<Record<Key, string>> {
  return Object.fromEntries((Object.keys(ptBR) as Key[]).filter((k) => prefixes.some((p) => k.startsWith(p))).map((k) => [k, dicts[lang][k]]));
}
// ?error= só aceita chaves "err.*" que existem: texto arbitrário na URL nunca chega à tela
export const errKey = (raw: unknown): Key | null => (typeof raw === "string" && raw.startsWith("err.") && raw in ptBR ? (raw as Key) : null);
