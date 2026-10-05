import { NextResponse } from "next/server"; import { sql } from "drizzle-orm"; import { db } from "@/db"; import { balanceSuggestions } from "@/db/schema"; import { genJson } from "@/lib/ai/gemini";
export const maxDuration = 60;
type Raw = { target?: unknown; issue?: unknown; suggestion?: unknown; severity?: unknown };
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new NextResponse("unauthorized", { status: 401 });
  const r = await db.execute(sql`select map_slug, class_key, dungeon, count(*)::int as lutas,
      round(avg((outcome='win')::int)*100)::int as vitoria_pct, round(avg(turns)::numeric,1)::float as turnos_medios,
      round(avg(hp_left_pct))::int as hp_final_medio_pct, round(avg(monster_level - char_level)::numeric,1)::float as dif_nivel_monstro
    from battle_logs where created_at > now() - interval '7 days' group by 1,2,3 having count(*) >= 30 order by 1,2,3`);
  if (!r.rows.length) return NextResponse.json({ skipped: "amostra insuficiente (<30 lutas por grupo)" });
  const out = await genJson<Raw[]>(`Você é designer de balanceamento do MMORPG por turnos "Miravita" (3 classes: Duelista = "exatas", Invocador = "humanas", Mago = "linguagens").
Metas: luta comum contra monstro do mesmo nível = 85–95% de vitória; calabouço (dungeon=true) = 55–75%; 3 a 8 turnos por luta; HP final médio 25–70%.
Dados dos últimos 7 dias (um objeto por mapa/classe/tipo): ${JSON.stringify(r.rows)}
Aponte somente desvios reais das metas, no máximo 6, em português do Brasil, com ajuste concreto e pequeno (ex.: "reduzir ATK base de exatas em 5%").
Responda SOMENTE um array JSON: [{"target": string, "issue": string, "suggestion": string, "severity": "baixa"|"media"|"alta"}].`);
  const rows = (Array.isArray(out) ? out : []).slice(0, 6).map((o) => ({ target: String(o.target ?? "").slice(0, 80), issue: String(o.issue ?? "").slice(0, 300), suggestion: String(o.suggestion ?? "").slice(0, 300), severity: ["baixa", "media", "alta"].includes(String(o.severity)) ? String(o.severity) : "media" })).filter((o) => o.target && o.suggestion);
  if (rows.length) await db.insert(balanceSuggestions).values(rows);
  return NextResponse.json({ groups: r.rows.length, suggestions: rows.length });
}
