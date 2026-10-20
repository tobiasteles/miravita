import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { bg, variants } from "@/lib/img";
import { SPOTS, type Spot } from "@/lib/game/town";
import { startBattle, rest } from "@/actions/battle";
import SafeImg from "@/components/game/SafeImg";
import GameIcon from "@/components/game/GameIcon";
import RealmCountdown from "@/components/game/RealmCountdown";

export type TownRealm = {
  name: string;
  tagline: string;
  open: boolean;
  at: string;
};

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
    <span
      className={`town-bubble ${s.y < 35 ? "town-bubble-down" : ""}`}
      style={st}
    >
      <SafeImg
        src={`/npcs/${s.npc}.png`}
        alt={s.merchant}
        className="h-11 w-11 shrink-0 rounded-full border-2 border-violet-400 bg-violet-950 object-cover"
        fallback={
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-violet-100 text-2xl text-violet-700">
            <GameIcon name={s.icon} />
          </span>
        }
      />
      <span>
        <b className="block text-violet-700">{s.merchant}</b>
        {sub ?? s.line}
      </span>
    </span>
  );
}
// nome do prédio, com contorno (igual ao DDTank)
const Cap = ({
  big,
  chip,
  children,
}: {
  big?: boolean;
  chip?: ReactNode;
  children: ReactNode;
}) => (
  <span className="town-cap">
    <span className={`town-label ${big ? "town-label-big" : ""}`}>
      {children}
    </span>
    {chip}
  </span>
);

function SpotView({
  s,
  ready,
  mapName,
  realm,
}: {
  s: Spot;
  ready: boolean;
  mapName: string;
  realm: TownRealm;
}) {
  const base = `town-spot ${ready ? "" : "town-ph"}`;
  const ico = !ready && (
    <span className="town-ico">
      <GameIcon name={s.icon} />
    </span>
  );
  const label = `${s.label} — ${s.merchant}`;

  if (s.kind === "link")
    return (
      <Link
        href={s.href!}
        aria-label={label}
        className={`town-wrap ${base}`}
        style={pos(s)}
      >
        {ico}
        <Bubble s={s} />
        <Cap>
          <GameIcon name={s.icon} /> {s.label}
        </Cap>
      </Link>
    );

  if (s.kind === "soon")
    return (
      <div
        className={`town-wrap ${base} town-soon`}
        style={pos(s)}
        title="Em breve"
      >
        {ico}
        <Bubble s={s} />
        <Cap>
          <GameIcon name={s.icon} /> {s.label} · em breve
        </Cap>
      </div>
    );

  if (s.kind === "rest")
    return (
      <form action={rest} className="town-wrap" style={pos(s)}>
        <button className={base} aria-label={label}>
          {ico}
          <Bubble s={s} />
          <Cap>
            <GameIcon name={s.icon} /> {s.label}
          </Cap>
        </button>
      </form>
    );

  // CAÇADA: destaque vermelho pulsante
  if (s.kind === "hunt")
    return (
      <form action={startBattle} className="town-wrap" style={pos(s)}>
        <input type="hidden" name="kind" value="hunt" />
        <button
          className={`${base} town-hunt`}
          aria-label={`Caçar monstros em ${mapName}`}
        >
          {ico}
          <span className="town-badge">
            <GameIcon name="swords" />
          </span>
          <Bubble
            s={s}
            sub={`Enfrentar monstros em ${mapName}. Clique para lutar!`}
          />
          <Cap
            big
            chip={
              <span className="town-chip town-chip-red">Clique para lutar</span>
            }
          >
            <GameIcon name="swords" /> CAÇAR MONSTROS
          </Cap>
        </button>
      </form>
    );

  // REINO: portal gigante com aura giratória (aberto) ou selado (fechado)
  const chip = (
    <span className={`town-chip ${realm.open ? "town-chip-live" : ""}`}>
      {realm.open ? (
        <>
          <i className="town-live" />
          ABERTO · <RealmCountdown target={realm.at} label="fecha em" />
        </>
      ) : (
        <>
          <GameIcon name="lock" />{" "}
          <RealmCountdown target={realm.at} label="abre em" />
        </>
      )}
    </span>
  );
  const inner = (
    <>
      {ico}
      {realm.open && <span className="town-realm-fx" />}
      <Bubble
        s={s}
        sub={
          realm.open
            ? `${realm.tagline} 4 etapas, mais difícil que a caçada.`
            : "O portal está selado. Volte quando o Reino abrir."
        }
      />
      <Cap big chip={chip}>
        <GameIcon name="portal" /> {realm.name}
      </Cap>
    </>
  );
  return realm.open ? (
    <form action={startBattle} className="town-wrap" style={pos(s)}>
      <input type="hidden" name="kind" value="dungeon" />
      <button
        className={`${base} town-realm town-realm-open`}
        aria-label={`Entrar no ${realm.name}`}
      >
        {inner}
      </button>
    </form>
  ) : (
    <div
      className={`town-wrap ${base} town-realm town-realm-closed`}
      style={pos(s)}
    >
      {inner}
    </div>
  );
}

export default function TownMap({
  slug,
  mapName,
  realm,
}: {
  slug: string;
  mapName: string;
  realm: TownRealm;
}) {
  const ready = variants(`/town/${slug}`).length > 0; // sem imagem ainda: mostra os prédios como placeholders clicáveis
  return (
    <div
      className="town town-fit"
      style={{
        background: "linear-gradient(160deg,#241a5a,#10102e 60%,#0b2a3a)",
      }}
    >
      <div
        className="town-bg"
        style={{ background: bg(`/town/${slug}`, "center/cover no-repeat") }}
      />
      <div className="town-title">
        <GameIcon name="pin" className="text-amber-300" /> {mapName}
      </div>
      {SPOTS.map((s) => (
        <SpotView
          key={s.id}
          s={s}
          ready={ready}
          mapName={mapName}
          realm={realm}
        />
      ))}
    </div>
  );
}
