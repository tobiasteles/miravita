// Capturas do /play em 3 tamanhos (antes/depois). Requer Playwright (não é dependência do projeto):
//   npm i -D playwright && npx playwright install chromium
//   npx playwright codegen --save-storage=state.json http://localhost:3000      (faça login e feche)
//   STATE=state.json node scripts/shots-play.mjs antes     → shots/antes-play-1920x1080.png ...
//   (aplique o patch)  STATE=state.json node scripts/shots-play.mjs depois
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const tag = process.argv[2] ?? "depois", base = process.env.BASE ?? "http://localhost:3000";
const sizes = [[1920, 1080], [1366, 768], [390, 844]];
mkdirSync("shots", { recursive: true });
const browser = await chromium.launch();
for (const [width, height] of sizes) {
  const ctx = await browser.newContext({ viewport: { width, height }, storageState: process.env.STATE || undefined });
  const page = await ctx.newPage();
  await page.goto(`${base}/play`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3500); // cena 3D carregar e a névoa assentar
  await page.screenshot({ path: `shots/${tag}-play-${width}x${height}.png` });
  await ctx.close();
}
await browser.close();
console.log("capturas em ./shots");
