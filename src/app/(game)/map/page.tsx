import Link from "next/link";
import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { maps } from "@/db/schema";
import { getActiveCharacter } from "@/lib/session";
import { travel } from "@/actions/character";
import { buyStone } from "@/actions/world";
import { MAGIC, stoneStack } from "@/lib/stone";
import { bg } from "@/lib/img";
import { WORLD_PINS } from "@/lib/game/town";
import { realmStatus } from "@/lib/game/realm-schedule";
import SafeImg from "@/components/game/SafeImg";

// MAPA-MÚNDI: cada mapa é um marcador clicável (fundo: public/world/mapa-mundi.png)
export default async function MapPage() {
  const a = await getActiveCharacter();
  if (!a) redirect("/characters");
  const { c } = a,
    mage = MAGIC.includes(c.classKey),
    st = (await stoneStack(c.id)).row?.quantity ?? 0;
  const all = await db.select().from(maps).orderBy(asc(maps.minLevel));
  const path = all
    .map((m) => WORLD_PINS[m.slug])
    .filter(Boolean)
    .map((p) => `${p.x},${p.y}`)
    .join(" ");
  return (
    <main className="mx-auto max-w-5xl space-y-3 p-3 lg:p-5">
      <Link href="/play" className="text-violet-300">
        ← Voltar à cidade
      </Link>
      <h1 className="text-xl font-bold">🗺️ Mapa-múndi</h1>
      <p className="text-sm text-violet-300">
        {mage
          ? "Sua classe mágica teleporta sem gastar pedras."
          : `Teleportar gasta 1 Pedra de Teletransporte (você tem ${st}).`}{" "}
        🏰 = Reino aberto agora.
      </p>
      <div
        className="town"
        style={{
          background: "linear-gradient(160deg,#1d2a5a,#10213a 60%,#0b2a3a)",
        }}
      >
        <div
          className="town-bg"
          style={{
            background: bg("/world/mapa-mundi", "center/cover no-repeat"),
          }}
        />
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          <polyline
            points={path}
            fill="none"
            stroke="#fde68a"
            strokeOpacity=".75"
            strokeWidth="2.5"
            strokeDasharray="1 3"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {all.map((m) => {
          const p = WORLD_PINS[m.slug];
          if (!p) return null;
          const here = m.id === c.currentMapId,
            locked = c.level < m.minLevel,
            off = locked || here || (!mage && st < 1);
          return (
            <form
              key={m.id}
              action={travel}
              className="pin"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <input type="hidden" name="mapId" value={m.id} />
              <button
                disabled={off}
                title={`${m.name} · Nv. ${m.minLevel}+`}
                className={`pin-btn ${locked ? "pin-lock" : ""} ${here ? "pin-here" : ""}`}
              >
                <span className="pin-dot">
                  {here ? "📍" : locked ? "🔒" : "🗺️"}
                  {realmStatus(m.slug).open && (
                    <span className="pin-realm">🏰</span>
                  )}
                </span>
                <span className="town-label">{m.name}</span>
                <span
                  className="town-label"
                  style={{ fontSize: "clamp(8px,1vw,12px)", color: "#c4b5fd" }}
                >
                  Nv. {m.minLevel}+
                </span>
              </button>
            </form>
          );
        })}
      </div>
      {!mage && (
        <form action={buyStone}>
          <button
            disabled={Number(c.gold) < 150}
            className="rounded border border-violet-800 px-4 py-2 disabled:opacity-30"
          >
            <SafeImg
              src="/items/teleport-stone.png"
              className="mr-1 inline h-5 w-5"
            />
            Comprar pedra (150g) · 💰 {Number(c.gold)}
          </button>
        </form>
      )}
    </main>
  );
}
