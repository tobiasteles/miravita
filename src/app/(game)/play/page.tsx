import { redirect } from "next/navigation";
import { getActiveCharacter } from "@/lib/session";
import { xpToNext } from "@/lib/game/xp";
import { CLASS_NAME } from "@/lib/game/classes";
import { startBattle } from "@/actions/battle";
import SafeImg from "@/components/game/SafeImg";
import Tile from "@/components/game/Tile";
import TownMap from "@/components/game/TownMap";
import { HotkeyBar } from "@/components/game/Hotkeys";
import { Logo, ClassSeal } from "@/components/brand/Brand";
import { REALMS } from "@/lib/game/realms";
import { realmStatus } from "@/lib/game/realm-schedule";

const fmt = (n: number) => n.toLocaleString("pt-BR");

export default async function Play() {
  const a = await getActiveCharacter();
  if (!a) redirect("/characters");
  const { c, map } = a;
  const pct = Math.min(100, (Number(c.xp) / xpToNext(c.level)) * 100);
  const slug = map?.slug ?? "planicie-de-aurora",
    mapName = map?.name ?? "Planície de Aurora",
    R = REALMS[slug],
    rs = realmStatus(slug);
  const realm = {
    name: R?.name ?? "Reino",
    tagline: R?.tagline ?? "",
    open: rs.open,
    at: (rs.open ? rs.closesAt : rs.opensAt).toISOString(),
  };
  return (
    <main className="mx-auto max-w-6xl space-y-3 p-3 lg:p-5">
      <Logo size={32} />

      {/* ----- barra do personagem ----- */}
      <section className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-violet-700/50 bg-[#171433] p-3">
        <SafeImg
          src={`/avatars/${c.avatarId}.png`}
          alt={c.avatarId}
          className="h-16 w-16 shrink-0 rounded-xl bg-violet-950 object-cover ring-2 ring-violet-500/60 shadow-[0_0_20px_#8b5cf6aa]"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <span className="truncate text-xl font-bold">{c.name}</span>
            <span className="text-sm text-violet-300">
              {CLASS_NAME[c.classKey]} · Nv. {c.level}
            </span>
            <span className="text-sm text-amber-300">
              💰 {fmt(Number(c.gold))}
            </span>
          </div>
          <div className="mt-1 h-2 rounded bg-[#0c0a1f]">
            <div
              className="h-2 rounded bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-0.5 flex justify-between text-xs text-violet-300">
            <span>
              XP {fmt(Number(c.xp))} / {fmt(xpToNext(c.level))}
            </span>
            <span>
              ❤ {c.hp} · 🔷 {c.mp}
            </span>
          </div>
        </div>
        <div className="hidden sm:block">
          <ClassSeal cls={c.classKey} size={52} />
        </div>
      </section>

      {/* ----- a CIDADE: cada prédio é um mercador/lugar clicável ----- */}
      <TownMap slug={slug} mapName={mapName} realm={realm} />

      <HotkeyBar />

      {/* ----- atalhos grandes (úteis no celular, onde não existe "hover") ----- */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Tile
          icon="⚔️"
          title="Caçar"
          sub={`Enfrentar monstros em ${mapName}`}
          action={startBattle}
          fields={{ kind: "hunt" }}
          accent="red"
        />
        <Tile
          icon="🏰"
          title={realm.name}
          sub={
            realm.open
              ? "Aberto agora: 4 etapas, cenário próprio e mais difícil"
              : "Fechado · abre em um horário aleatório do dia"
          }
          action={startBattle}
          fields={{ kind: "dungeon" }}
          accent="violet"
          disabled={!realm.open}
        />
      </div>
    </main>
  );
}
