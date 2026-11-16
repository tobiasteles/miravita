// Limite de tentativas por chave (IP, e-mail, conta) numa janela de tempo, guardado no banco (funciona na Vercel).
import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
export async function clientIp() {
  const h = await headers();
  return (h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0] ?? "desconhecido").trim().slice(0, 64);
}
// conta +1 e diz se ainda está dentro do limite (true = pode seguir)
export async function allow(key: string, limit: number, windowSec: number) {
  try {
    const r = await db.execute(sql`insert into rate_limits (key, count, reset_at) values (${key}, 1, now() + make_interval(secs => ${windowSec}))
      on conflict (key) do update set
        count = case when rate_limits.reset_at < now() then 1 else rate_limits.count + 1 end,
        reset_at = case when rate_limits.reset_at < now() then now() + make_interval(secs => ${windowSec}) else rate_limits.reset_at end
      returning count`);
    return Number((r.rows[0] as { count: number }).count) <= limit;
  } catch (e) {
    console.error("rate_limits indisponível (rodou migracao-seguranca.sql?)", e);
    return true;
  }
}
// só consulta (sem contar): já estourou o limite?
export async function blocked(key: string, limit: number) {
  try {
    const r = await db.execute(sql`select count from rate_limits where key = ${key} and reset_at > now()`);
    return Number((r.rows[0] as { count: number } | undefined)?.count ?? 0) >= limit;
  } catch {
    return false;
  }
}
// registra uma falha (para login errado)
export async function fail(key: string, windowSec: number) {
  await allow(key, Number.MAX_SAFE_INTEGER, windowSec);
}
