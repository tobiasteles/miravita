// Dados só para EXIBIÇÃO do Códex (posição na tabela e camadas eletrônicas). Nenhuma regra do jogo depende disto.

// [linha, coluna] na tabela de 18 colunas; lantanídeos ficam na linha 9 e actinídeos na 10 (linha 8 é só um respiro)
export function tablePos(z: number): [number, number] {
  if (z === 1) return [1, 1];
  if (z === 2) return [1, 18];
  if (z <= 4) return [2, z - 2];
  if (z <= 10) return [2, z + 8];
  if (z <= 12) return [3, z - 10];
  if (z <= 18) return [3, z];
  if (z <= 36) return [4, z - 18];
  if (z <= 54) return [5, z - 36];
  if (z <= 56) return [6, z - 54];
  if (z <= 71) return [9, z - 54];
  if (z <= 86) return [6, z - 68];
  if (z <= 88) return [7, z - 86];
  if (z <= 103) return [10, z - 86];
  return [7, z - 100];
}

// Ordem de preenchimento de Madelung (n, l). Capacidade da subcamada = 2·(2l+1).
const ORDER: ReadonlyArray<readonly [number, number]> = [
  [1, 0], [2, 0], [2, 1], [3, 0], [3, 1], [4, 0], [3, 2], [4, 1], [5, 0], [4, 2],
  [5, 1], [6, 0], [4, 3], [5, 2], [6, 1], [7, 0], [5, 3], [6, 2], [7, 1],
];
export type Sub = { n: number; l: number; e: number };

// Aproximação didática: segue a regra de Madelung e ignora exceções reais (Cr, Cu, etc.)
export function subshells(z: number): Sub[] {
  let left = Math.max(0, Math.min(118, Math.floor(z)));
  const out: Sub[] = [];
  for (const [n, l] of ORDER) {
    if (left <= 0) break;
    const e = Math.min(2 * (2 * l + 1), left);
    out.push({ n, l, e });
    left -= e;
  }
  return out;
}
// elétrons por camada principal (K, L, M, ...)
export function shells(z: number): number[] {
  const s = [0, 0, 0, 0, 0, 0, 0];
  for (const x of subshells(z)) s[x.n - 1] += x.e;
  while (s.length && s[s.length - 1] === 0) s.pop();
  return s;
}
const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
export function configText(z: number): string {
  return [...subshells(z)]
    .sort((a, b) => a.n - b.n || a.l - b.l)
    .map((x) => `${x.n}${"spdf"[x.l]}${String(x.e).replace(/\d/g, (d) => SUP[+d])}`)
    .join(" ");
}
export const SHELL_NAMES = ["K", "L", "M", "N", "O", "P", "Q"] as const;
