import { NextResponse } from "next/server"; import { sql } from "drizzle-orm"; import { db } from "@/db"; import { cronAuthorized } from "@/lib/cron-auth";
export const maxDuration = 60;
// limpeza diária: mensagens antigas do chat, telemetria velha, sessões/limites/travas vencidos
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return new NextResponse("unauthorized", { status: 401 });
  const run = async (q: ReturnType<typeof sql>) => (await db.execute(q)).rowCount ?? 0;
  return NextResponse.json({
    chat: await run(sql`delete from chat_messages where created_at < now() - interval '7 days'`),
    battleLogs: await run(sql`delete from battle_logs where created_at < now() - interval '45 days'`),
    pvpFights: await run(sql`delete from pvp_fights where created_at < now() - interval '60 days'`),
    reports: await run(sql`delete from chat_reports where resolved and created_at < now() - interval '30 days'`),
    sessions: await run(sql`delete from sessions where expires_at < now()`),
    rateLimits: await run(sql`delete from rate_limits where reset_at < now()`),
    locks: await run(sql`delete from action_locks where until < now()`),
  });
}
