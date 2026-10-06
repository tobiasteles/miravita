import manifest from "./image-manifest.json";
// o jogo aceita PNG, JPG, JPEG e WEBP. Só devolve arquivos que EXISTEM em public/ (lista gerada por scripts/image-manifest.mjs):
// nada de tentativas nem de 404 no navegador. Passe o caminho SEM extensão.
export const EXTS = ["png", "jpg", "jpeg", "webp"];
const HAVE = new Set<string>(manifest as string[]);
export const variants = (base: string) =>
  EXTS.map((e) => `${base}.${e}`).filter((u) => HAVE.has(u));
// camadas de fundo (uma por arquivo existente); sem arquivo, devolve uma camada transparente para o CSS continuar válido
export const bg = (base: string, extra = "") => {
  const v = variants(base);
  return v.length
    ? v.map((u) => `url(${u})${extra ? " " + extra : ""}`).join(", ")
    : "linear-gradient(transparent, transparent)";
};
