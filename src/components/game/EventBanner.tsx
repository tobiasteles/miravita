import { activeEvents } from "@/lib/game/live";
import GameIcon from "@/components/game/GameIcon";
const KIND: Record<string, string> = { xp: "XP", gold: "Ouro", drop: "Drops" };
// faixa com os eventos ativos (XP em dobro, etc.), criada no /admin/eventos
export default async function EventBanner() {
  const evs = await activeEvents();
  if (!evs.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {evs.map((e) => (
        <div key={e.id} className="flex items-center gap-2 rounded-lg border border-amber-400/70 bg-amber-950/30 px-3 py-1 text-xs text-amber-200 shadow-[0_0_14px_#fbbf2433]" title={e.description}>
          <GameIcon name="star" className="text-amber-300" />
          <b>{e.title}</b>
          <span>
            {KIND[e.kind]} ×{e.mult} · até {new Date(e.endsAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}
          </span>
        </div>
      ))}
    </div>
  );
}
