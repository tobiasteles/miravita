// Medidor de tradução: conta linhas com texto em português ainda "solto" no código (fora dos dicionários).
//   node scripts/i18n-audit.mjs            → resumo por área
//   node scripts/i18n-audit.mjs --files    → arquivos com mais linhas pendentes
// Heurística: linha com letra acentuada que não é comentário. Conteúdo do jogo (lib/game, db) aparece à parte: vai para src/i18n/content.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const SKIP = ["src/i18n", "src/db", "src/app/admin", "src/components/admin", "src/actions/admin"];
const ACC = /[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/;
const files = [];
(function walk(d) {
  for (const n of readdirSync(d)) {
    const p = join(d, n), rel = relative(".", p).split(sep).join("/");
    if (statSync(p).isDirectory()) { if (!SKIP.some((s) => rel === s || rel.startsWith(s + "/"))) walk(p); }
    else if (/\.(tsx?|mts)$/.test(n) && !/\.test\./.test(n) && !SKIP.some((s) => rel.startsWith(s + "/"))) files.push(rel);
  }
})("src");

const rows = files.map((f) => {
  const n = readFileSync(f, "utf8").split("\n").filter((l) => ACC.test(l) && !/^\s*(\/\/|\*|\/\*)/.test(l) && !/^\s*import /.test(l)).length;
  return { f, n };
}).filter((r) => r.n > 0);

const area = (f) => (f.startsWith("src/lib/game") || f.startsWith("src/lib/") ? "conteúdo/regras (lib)" : f.startsWith("src/app/") ? `telas: ${f.split("/").slice(2, 4).join("/")}` : f.startsWith("src/components/") ? `componentes: ${f.split("/")[2]}` : f.startsWith("src/actions/") ? "ações do servidor" : "outros");
const by = new Map();
for (const r of rows) by.set(area(r.f), (by.get(area(r.f)) ?? 0) + r.n);
console.log("Linhas com português solto, por área:");
for (const [k, v] of [...by].sort((a, b) => b[1] - a[1])) console.log(String(v).padStart(6), " ", k);
console.log(String(rows.reduce((s, r) => s + r.n, 0)).padStart(6), "  TOTAL");
if (process.argv.includes("--files")) { console.log("\nArquivos:"); for (const r of rows.sort((a, b) => b.n - a.n).slice(0, 40)) console.log(String(r.n).padStart(6), " ", r.f); }
