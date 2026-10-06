import { redirect } from "next/navigation";
import { getActiveCharacter } from "@/lib/session";
import { xpToNext } from "@/lib/game/xp";
import { CLASS_NAME } from "@/lib/game/classes";
import { startBattle, rest } from "@/actions/battle";
import { bg } from "@/lib/img";
import SafeImg from "@/components/game/SafeImg";
import Tile from "@/components/game/Tile";
import { HotkeyBar } from "@/components/game/Hotkeys";
import { Logo, ClassSeal } from "@/components/brand/Brand";

const fmt = (n: number) => n.toLocaleString("pt-BR");

export default async function Play() {
  const a = await getActiveCharacter();
  if (!a) redirect("/characters");
  const { c, map } = a;
  const pct = Math.min(100, (Number(c.xp) / xpToNext(c.level)) * 100);
  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4 lg:p-6">
      <Logo size={36} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,1fr)]">
        {/* ----- comércio ----- */}
        <div className="grid grid-cols-1 content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <Tile
            icon="⚔️"
            title="Vendedor de Armas"
            sub="Lâminas forjadas de cada elemento"
            href="/shop/armas"
            accent="red"
          />
          <Tile
            icon="🛡️"
            title="Vendedor de Armaduras"
            sub="Peitorais e proteções"
            href="/shop/armaduras"
            accent="sky"
          />
          <Tile
            icon="👘"
            title="Trajes de Batalha"
            sub="Visuais para o seu personagem"
            accent="pink"
            disabled
          />
          <Tile
            icon="🏪"
            title="Loja de Conveniência"
            sub="Poções de HP, EA e teletransporte"
            href="/shop/conveniencia"
            accent="green"
          />
          <Tile
            icon="🎒"
            title="Mochila e Forja"
            sub="Equipamentos e materiais"
            href="/inventory"
            accent="gold"
          />
          <Tile
            icon="🏰"
            title="Guilda"
            sub="Membros, grupos e chat"
            href="/guild"
            accent="violet"
          />
        </div>

        {/* ----- centro: personagem ----- */}
        <div className="order-first space-y-3 lg:order-none">
          <section className="relative overflow-hidden rounded-2xl border border-violet-700/50 bg-[#171433] p-4">
            <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-violet-600/30 blur-3xl" />
            <div className="absolute right-3 top-3">
              <ClassSeal cls={c.classKey} size={56} />
            </div>
            <div className="relative flex items-center gap-4">
              <SafeImg
                src={`/avatars/${c.avatarId}.png`}
                alt={c.avatarId}
                className="h-28 w-28 rounded-2xl bg-violet-950 object-cover ring-2 ring-violet-500/60 shadow-[0_0_30px_#8b5cf6aa]"
              />
              <div className="min-w-0 flex-1 pr-14">
                <div className="truncate text-2xl font-bold">{c.name}</div>
                <div className="text-violet-300">
                  {CLASS_NAME[c.classKey]} · Nv. {c.level}
                </div>
                <div className="mt-1 text-sm text-amber-300">
                  💰 {fmt(Number(c.gold))}
                </div>
              </div>
            </div>
            <div className="relative mt-3">
              <div className="h-2 rounded bg-[#0c0a1f]">
                <div
                  className="h-2 rounded bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-xs text-violet-300">
                <span>
                  XP {fmt(Number(c.xp))} / {fmt(xpToNext(c.level))}
                </span>
                <span>
                  ❤ {c.hp} · 🔷 {c.mp}
                </span>
              </div>
            </div>
          </section>
          <HotkeyBar />
          <section
            style={{
              backgroundImage: `linear-gradient(90deg,#171433f0 40%,#17143366), ${bg(`/maps/${map?.slug}`)}`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            className="rounded-xl border border-violet-900 bg-[#171433] p-4"
          >
            <div className="text-sm text-violet-300">Você está em</div>
            <h2 className="text-xl font-bold">📍 {map?.name ?? "—"}</h2>
            <div className="text-sm text-violet-300">
              Bioma: {map?.biome} · Nível mínimo {map?.minLevel}
            </div>
          </section>
        </div>

        {/* ----- serviços e ação ----- */}
        <div className="grid grid-cols-1 content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <Tile
            icon="📜"
            title="Oficial da Cidade"
            sub="Receba e entregue missões"
            href="/quests"
            accent="gold"
          />
          <Tile
            icon="🎓"
            title="Instrutor"
            sub="Técnicas de todas as classes"
            href="/skills"
            accent="cyan"
          />
          <Tile
            icon="🍺"
            title="Taverna"
            sub="Descansar: recupera HP e EA"
            action={rest}
            accent="pink"
          />
          <Tile
            icon="💂"
            title="Guardas"
            sub="Portões: viajar entre mapas"
            href="/map"
            accent="slate"
          />
          <Tile
            icon="🗡️"
            title="Caçar"
            sub={`Enfrentar monstros em ${map?.name ?? "—"}`}
            action={startBattle}
            fields={{ kind: "hunt" }}
            accent="red"
          />
          <Tile
            icon="🌀"
            title="Portal"
            sub="Calabouço de 4 ondas com chefe"
            action={startBattle}
            fields={{ kind: "dungeon" }}
            accent="violet"
          />
        </div>
      </div>
    </main>
  );
}
