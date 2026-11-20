import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { bg, variants } from "@/lib/img";
import { SPOTS, type Spot } from "@/lib/game/town";
import TownScene from "@/components/stage/TownScene";
import { getT } from "@/i18n/server";
import { spotText } from "@/i18n/content";
import type { Key } from "@/i18n/pt-BR";
import type { Vars } from "@/i18n/core";
type T = (k: Key, v?: Vars) => string;
import { startBattle, rest } from "@/actions/battle";
import SafeImg from "@/components/game/SafeImg";
import GameIcon from "@/components/game/GameIcon";
import RealmCountdown from "@/components/game/RealmCountdown";

export type TownRealm = { name: string; tagline: string; open: boolean; at: string };

const pos = (s: Spot) =>
  ({
    left: `${s.x - s.w / 2}%`,
    top: `${s.y - s.h / 2}%`,
    width: `${s.w}%`,
    height: `${s.h}%`,
    "--glow": s.glow,
  }) as CSSProperties;

// balão de fala do mercador (aparece ao passar o mouse)
function Bubble({ s, sub }: { s: Spot; sub?: string }) {
  const edge = s.x < 22 ? "l" : s.x > 78 ? "r" : "c";
  const st = {
    left: edge === "l" ? 0 : edge === "c" ? "50%" : "auto",
    right: edge === "r" ? 0 : "auto",
    "--bx": edge === "c" ? "-50%" : "0%",
  } as CSSProperties;
  return (
    <span className={`town-bubble ${s.y < 35 ? "town-bubble-down" : ""}`} style={st}>
      <SafeImg
        src={`/npcs/${s.npc}.png`}
        alt={s.merchant}
        className="h-11 w-11 shrink-0 rounded-full border-2 border-violet-400 bg-violet-950 object-cover"
        fallback={<span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-violet-100 text-2xl text-violet-700"><GameIcon name={s.icon} /></span>}
      />
      <span>
        <b className="block text-violet-700">{s.merchant}</b>
        {sub ?? s.line}
      </span>
    </span>
  );
}
// nome do prédio, com contorno (igual ao DDTank)
const Cap = ({ big, chip, children }: { big?: boolean; chip?: ReactNode; children: ReactNode }) => (
  <span className="town-cap">
    <span className={`town-label ${big ? "town-label-big" : ""}`}>{children}</span>
    {chip}
  </span>
);

function SpotView({ s, ready, mapName, realm, expAt, t }: { s: Spot; ready: boolean; mapName: string; realm: TownRealm; expAt: number | null; t: T }) {
  const base = `town-spot ${ready ? "" : "town-ph"}`;
  const ico = !ready && (
    <span className="town-ico">
      <GameIcon name={s.icon} />
    </span>
  );
  const label = `${s.label} — ${s.merchant}`;
  // expedição ociosa: aviso no próprio prédio (também no modo 2D)
  const expChip =
    s.id === "atividades" && expAt ? (
      <span className="town-chip town-chip-live">
        <i className="town-live" />
        {Date.now() >= expAt ? t("town.expReady") : <RealmCountdown target={new Date(expAt).toISOString()} label={t("town.expEnds")} />}
      </span>
    ) : undefined;

  if (s.kind === "link")
    return (
      <Link href={s.href!} aria-label={label} className={`town-wrap ${base}`} style={pos(s)} data-spot={s.id}>
        {ico}
        <Bubble s={s} />
        <Cap chip={expChip}>
          <GameIcon name={s.icon} /> {s.label}
        </Cap>
      </Link>
    );

  if (s.kind === "soon")
    return (
      <div className={`town-wrap ${base} town-soon`} style={pos(s)} data-spot={s.id} title={t("town.soon")}>
        {ico}
        <Bubble s={s} />
        <Cap chip={<span className="town-chip">{t("town.soonChip")}</span>}>
          <GameIcon name={s.icon} /> {s.label}
        </Cap>
      </div>
    );

  // PORTÃO DA CIDADE (caça infinita): destaque vermelho pulsante
  if (s.kind === "gate" || s.kind === "arena")
    return (
      <Link href={s.href!} aria-label={label} className={`town-wrap ${base} town-hunt`} style={pos(s)} data-spot={s.id}>
        {ico}
        <span className="town-badge">
          <GameIcon name="swords" />
        </span>
        <Bubble s={s} />
        <Cap big chip={<span className="town-chip town-chip-red">{s.kind === "arena" ? t("town.duels") : t("town.endless")}</span>}>
          <GameIcon name={s.kind === "arena" ? "swords" : "castle"} /> {s.label}
        </Cap>
      </Link>
    );

  if (s.kind === "rest")
    return (
      <form action={rest} className="town-wrap" style={pos(s)} data-spot={s.id}>
        <button className={base} aria-label={label}>
          {ico}
          <Bubble s={s} />
          <Cap>
          <GameIcon name={s.icon} /> {s.label}
        </Cap>
        </button>
      </form>
    );

  // ⚔ CAÇADA: destaque vermelho pulsante
  if (s.kind === "hunt")
    return (
      <form action={startBattle} className="town-wrap" style={pos(s)} data-spot={s.id}>
        <input type="hidden" name="kind" value="hunt" />
        <button className={`${base} town-hunt`} aria-label={t("town.huntLabel", { map: mapName })}>
          {ico}
          <span className="town-badge">
            <GameIcon name="swords" />
          </span>
          <Bubble s={s} sub={t("town.huntSub", { map: mapName })} />
          <Cap big chip={<span className="town-chip town-chip-red">{t("town.clickFight")}</span>}>
            <GameIcon name="swords" /> {t("town.huntCap")}
          </Cap>
        </button>
      </form>
    );

  // 🏰 REINO: portal gigante com aura giratória (aberto) ou selado (fechado)
  const chip = (
    <span className={`town-chip ${realm.open ? "town-chip-live" : ""}`}>
      {realm.open ? (
        <>
          <i className="town-live" />
          {t("town.open")} · <RealmCountdown target={realm.at} label={t("town.closesIn")} />
        </>
      ) : (
        <>
          <GameIcon name="lock" /> <RealmCountdown target={realm.at} label={t("town.opensIn")} />
        </>
      )}
    </span>
  );
  const inner = (
    <>
      {ico}
      {realm.open && <span className="town-realm-fx" />}
      <Bubble s={s} sub={realm.open ? t("town.realmOpenSub", { tagline: realm.tagline }) : t("town.realmSealed")} />
      <Cap big chip={chip}>
        <GameIcon name="portal" /> {realm.name}
      </Cap>
    </>
  );
  return realm.open ? (
    <form action={startBattle} className="town-wrap" style={pos(s)} data-spot={s.id}>
      <input type="hidden" name="kind" value="dungeon" />
      <button className={`${base} town-realm town-realm-open`} aria-label={t("town.enter", { realm: realm.name })}>{inner}</button>
    </form>
  ) : (
    <div className={`town-wrap ${base} town-realm town-realm-closed`} style={pos(s)} data-spot={s.id}>{inner}</div>
  );
}

export default async function TownMap({ slug, mapName, realm, expAt = null, meAv, mates = [] }: { slug: string; mapName: string; realm: TownRealm; expAt?: number | null; meAv?: string; mates?: string[] }) {
  const { lang, t } = await getT();
  const ready = variants(`/town/${slug}`).length > 0; // sem imagem ainda: mostra os prédios como placeholders clicáveis
  return (
    <div className="town town-fit" style={{ background: "linear-gradient(160deg,#241a5a,#10102e 60%,#0b2a3a)" }}>
      <div className="town-bg" style={{ background: bg(`/town/${slug}`, "center/cover no-repeat") }} />
      {meAv && <TownScene slug={slug} realmOpen={realm.open} expEndsAt={expAt} meAv={meAv} mates={mates} />}
      <div className="town-title">
        <GameIcon name="pin" className="text-amber-300" /> {mapName}
      </div>
      {SPOTS.map((s) => (
        <SpotView key={s.id} s={spotText(lang, s)} ready={ready} mapName={mapName} realm={realm} expAt={expAt} t={t} />
      ))}
    </div>
  );
}
