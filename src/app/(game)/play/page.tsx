import Link from "next/link";
import { redirect } from "next/navigation";
import { getActiveCharacter } from "@/lib/session";
import { xpToNext } from "@/lib/game/xp";
import { doseNow } from "@/lib/game/hazard";
import { biomeLabel, className, mapLabel, realmName, realmTagline } from "@/i18n/content";
import { subset } from "@/i18n";
import { I18nProvider } from "@/i18n/client";
import { getT } from "@/i18n/server";
import { startBattle } from "@/actions/battle";
import SafeImg from "@/components/game/SafeImg";
import Tile from "@/components/game/Tile";
import TownMap from "@/components/game/TownMap";
import EventBanner from "@/components/game/EventBanner";
import GameIcon from "@/components/game/GameIcon";
import { HotkeyBar } from "@/components/game/Hotkeys";
import { Logo, ClassSeal } from "@/components/brand/Brand";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { characters, partyMembers } from "@/db/schema";
import { REALMS } from "@/lib/game/realms";
import { realmStatus } from "@/lib/game/realm-schedule";


// Tela FIXA (sem rolagem) no computador: topo (personagem) + [atalhos | CIDADE | ações]. No celular vira uma coluna normal.
export default async function Play() {
  const { lang, t, f } = await getT();
  const a = await getActiveCharacter();
  if (!a) redirect("/characters");
  const { c, map } = a;
  const pct = Math.min(100, (Number(c.xp) / xpToNext(c.level)) * 100);
  const slug = map?.slug ?? "planicie-de-aurora",
    mapName = mapLabel(lang, slug, map?.name ?? "Planície de Aurora"),
    R = REALMS[slug],
    rs = realmStatus(slug);
  const realm = {
    name: R ? realmName(lang, R.name) : t("play.realmDefault"),
    tagline: R ? realmTagline(lang, R.name, R.tagline) : "",
    open: rs.open,
    at: (rs.open ? rs.closesAt : rs.opensAt).toISOString(),
  };
  // só leitura, para desenhar a cena: expedição em andamento e colegas do grupo que estão neste mesmo mapa
  const expAt = c.activity?.exp?.endsAt ?? null;
  let mates: string[] = [];
  if (c.currentMapId) {
    const [mine] = await db.select({ pid: partyMembers.partyId }).from(partyMembers).where(eq(partyMembers.characterId, c.id));
    if (mine) {
      const rows = await db
        .select({ av: characters.avatarId })
        .from(partyMembers)
        .innerJoin(characters, eq(characters.id, partyMembers.characterId))
        .where(and(eq(partyMembers.partyId, mine.pid), eq(characters.currentMapId, c.currentMapId), ne(characters.id, c.id)))
        .limit(3);
      mates = rows.map((r) => r.av);
    }
  }
  const rail = "flex shrink-0 flex-col gap-2 lg:w-[clamp(170px,16vw,260px)] lg:overflow-y-auto";
  return (
    <main className="mx-auto flex max-w-[1900px] flex-col gap-2 p-2 lg:h-dvh lg:overflow-hidden lg:p-3">
      {/* ----- topo: logo + personagem ----- */}
      <header className="flex shrink-0 flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
        <div className="pr-12 lg:pr-0"><Logo size={26} /></div>
        <section className="relative flex w-full min-w-0 flex-1 items-center gap-3 overflow-hidden rounded-2xl border border-violet-700/50 bg-[#171433] p-2">
          <SafeImg
            src={`/avatars/${c.avatarId}.png`}
            alt={c.avatarId}
            className="h-14 w-14 shrink-0 rounded-xl bg-violet-950 object-cover ring-2 ring-violet-500/60 shadow-[0_0_20px_#8b5cf6aa]"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <span className="truncate text-lg font-bold">{c.name}</span>
              <span className="text-sm text-violet-300">
                {className(lang, c.classKey)} · {t("char.level", { n: c.level })}
              </span>
              <span className="flex items-center gap-1 text-sm text-amber-300">
                <GameIcon name="coin" /> {f.n(Number(c.gold))}
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
                XP {f.n(Number(c.xp))} / {f.n(xpToNext(c.level))}
              </span>
              <span className="flex items-center gap-3">
                {doseNow(c.activity?.hz) >= 1 && (
                  <Link href="/atividades" title={t("hz.warn")} className="rounded border border-amber-500/60 bg-amber-500/10 px-1.5 text-amber-200">
                    {t("hz.chip", { dose: Math.round(doseNow(c.activity?.hz)) })}
                  </Link>
                )}
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

      <EventBanner />

      {/* ----- corpo: atalhos | cidade | ações ----- */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
        {/* esquerda: Missões, Inventário, Técnicas... */}
        <aside className={`${rail} order-2 lg:order-1`}>
          <I18nProvider lang={lang} dict={subset(lang, "hk.")}>
            <HotkeyBar />
          </I18nProvider>
        </aside>

        {/* centro: a cidade (encaixa na altura da tela, nunca rola) */}
        <div className="town-box order-1 min-w-0 lg:order-2 lg:flex-1">
          <TownMap slug={slug} mapName={mapName} realm={realm} expAt={expAt} meAv={c.avatarId} mates={mates} />
        </div>

        {/* direita: luta, Reino e informações do mapa */}
        <aside className={`${rail} order-3`}>
          <Link href="/gate" className="town-hunt relative flex items-center gap-3 rounded-xl border-2 border-rose-500 bg-rose-950/40 p-3 transition hover:bg-rose-900/40">
            <GameIcon name="swords" size="1.9rem" className="text-rose-300" />
            <div className="min-w-0 flex-1"><div className="font-bold">{t("play.gate")}</div><div className="truncate text-xs text-rose-200">{t("play.gateSub", { map: mapName })}</div></div>
          </Link>
          <Link href="/arena" className="relative flex items-center gap-3 rounded-xl border-2 border-amber-500/70 bg-amber-950/20 p-3 transition hover:bg-amber-900/30">
            <GameIcon name="trophy" size="1.9rem" className="text-amber-300" />
            <div className="min-w-0 flex-1"><div className="font-bold">{t("play.arena")}</div><div className="truncate text-xs text-amber-200">{t("play.arenaSub")}</div></div>
          </Link>
          <Tile
            icon={<GameIcon name="portal" className="text-violet-300" />}
            title={realm.name}
            sub={realm.open ? t("play.realmOpen") : t("play.realmClosed")}
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
              {t("play.biome", { biome: map?.biome ? biomeLabel(lang, map.biome) : "—", n: map?.minLevel ?? 1 })}
            </div>
            <div className="mt-2 text-xs text-violet-300">{realm.tagline}</div>
          </section>
        </aside>
      </div>
    </main>
  );
}
