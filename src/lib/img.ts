// o jogo aceita PNG, JPG, JPEG e WEBP: passe o caminho SEM extensão e ele tenta todas
export const EXTS = ["png", "jpg", "jpeg", "webp"];
export const variants = (base: string) => EXTS.map((e) => `${base}.${e}`);
// várias camadas de fundo (uma por extensão): as que não existirem simplesmente não aparecem
export const bg = (base: string, extra = "") => variants(base).map((u) => `url(${u})${extra ? " " + extra : ""}`).join(", ");
