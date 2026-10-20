import { redirect } from "next/navigation";
import { getActiveCharacter } from "@/lib/session";
import { xpToNext } from "@/lib/game/xp";
import { CLASS_NAME } from "@/lib/game/classes";
import { startBattle } from "@/actions/battle";
import SafeImg from "@/components/game/SafeImg";
import Tile from "@/components/game/Tile";
import TownMap from "@/components/game/TownMap";
import GameIcon from "@/components/game/GameIcon";
import { HotkeyBar } from "@/components/game/Hotkeys";
import { Logo, ClassSeal } from "@/components/brand/Brand";
import { REALMS } from "@/lib/game/realms";
import { realmStatus } from "@/lib/game/realm-schedule";

const fmt = (n: number) => n.toLocaleString("pt-BR");

// Tela FIXA (sem rolagem) no computador: topo (personagem) + [atalhos | CIDADE | ações]. No celular vira uma coluna normal.
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
  const rail =
    "flex shrink-0 flex-col gap-2 lg:w-[clamp(170px,16vw,260px)] lg:overflow-y-auto";
  return (
    <main className="mx-auto flex max-w-[1900px] flex-col gap-2 p-2 lg:h-dvh lg:overflow-hidden lg:p-3">
      {/* ----- topo: logo + personagem ----- */}
      <header className="flex shrink-0 flex-wrap items-center gap-3 lg:flex-nowrap">
        <Logo size={30} />
        <section className="relative flex min-w-0 flex-1 items-center gap-3 overflow-hidden rounded-2xl border border-violet-700/50 bg-[#171433] p-2">
          <SafeImg
            src={`/avatars/${c.avatarId}.png`}
            alt={c.avatarId}
            className="h-14 w-14 shrink-0 rounded-xl bg-violet-950 object-cover ring-2 ring-violet-500/60 shadow-[0_0_20px_#8b5cf6aa]"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <span className="truncate text-lg font-bold">{c.name}</span>
              <span className="text-sm text-violet-300">
                {CLASS_NAME[c.classKey]} · Nv. {c.level}
              </span>
              <span className="flex items-center gap-1 text-sm text-amber-300">
                <GameIcon name="coin" /> {fmt(Number(c.gold))}
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
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <GameIcon name="heart" className="text-rose-400" /> {c.hp}
                </span>
                <span className="flex items-center gap-1">
                  <GameIcon name="crystal" className="text-cyan-300" /> {c.mp}
                </span>
              </span>
            </div>
          </div>
          <div className="hidden sm:block">
            <ClassSeal cls={c.classKey} size={44} />
          </div>
        </section>
      </header>

      {/* ----- corpo: atalhos | cidade | ações ----- */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
        {/* esquerda: Missões, Inventário, Técnicas... */}
        <aside className={`${rail} order-2 lg:order-1`}>
          <HotkeyBar />
        </aside>

        {/* centro: a cidade (encaixa na altura da tela, nunca rola) */}
        <div className="town-box order-1 min-w-0 lg:order-2 lg:flex-1">
          <TownMap slug={slug} mapName={mapName} realm={realm} />
        </div>

        {/* direita: luta, Reino e informações do mapa */}
        <aside className={`${rail} order-3`}>
          <Tile
            icon={<GameIcon name="swords" className="text-rose-300" />}
            title="Caçar"
            sub={`Monstros de ${mapName}`}
            action={startBattle}
            fields={{ kind: "hunt" }}
            accent="red"
          />
          <Tile
            icon={<GameIcon name="portal" className="text-violet-300" />}
            title={realm.name}
            sub={
              realm.open
                ? "Aberto agora · 4 etapas"
                : "Fechado · abre em horário aleatório"
            }
            action={startBattle}
            fields={{ kind: "dungeon" }}
            accent="violet"
            disabled={!realm.open}
          />
          <section className="rounded-xl border border-violet-800/60 bg-[#171433] p-3 text-sm">
            <div className="flex items-center gap-2 font-bold">
              <GameIcon name="pin" className="text-amber-300" /> {mapName}
            </div>
            <div className="mt-1 text-xs text-violet-300">
              Bioma: {map?.biome ?? "—"} · Nível mínimo {map?.minLevel ?? 1}
            </div>
            <div className="mt-2 text-xs text-violet-300">{realm.tagline}</div>
          </section>
        </aside>
      </div>
    </main>
  );
}
