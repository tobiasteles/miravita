import { createHash, timingSafeEqual } from "node:crypto";
// A Vercel chama o cron com "Authorization: Bearer <CRON_SECRET>". Sem o segredo configurado (ou fraco), NINGUÉM passa.
export function cronAuthorized(req: Request) {
  const s = process.env.CRON_SECRET;
  if (!s || s.length < 16) return false;
  const h = (x: string) => createHash("sha256").update(x).digest();
  return timingSafeEqual(h(req.headers.get("authorization") ?? ""), h(`Bearer ${s}`));
}
