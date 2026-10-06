// lista as imagens de public/ em src/lib/image-manifest.json (roda sozinho em "npm run dev" e "npm run build"; depois de adicionar imagens: npm run imagens)
import { readdirSync, statSync, writeFileSync, existsSync } from "node:fs";
import { join, extname, relative } from "node:path";
const PUB = "public", OK = new Set([".png", ".jpg", ".jpeg", ".webp"]), out = [];
(function walk(d) {
  if (!existsSync(d)) return;
  for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (OK.has(extname(f).toLowerCase())) out.push("/" + relative(PUB, p).split("\\").join("/")); }
})(PUB);
writeFileSync("src/lib/image-manifest.json", JSON.stringify(out.sort(), null, 1) + "\n");
console.log(out.length, "imagens no manifesto");
