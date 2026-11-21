"use client";
import { useState, useTransition } from "react";
import { forge } from "@/actions/inventory";
import SafeImg from "@/components/game/SafeImg";
import GameIcon, { type IconName } from "@/components/game/GameIcon";
import { useT } from "@/i18n/client";

// materiais já traduzidos e com a conta feita no servidor: can = tem os ingredientes; noWeapon = não serve para arma (cerâmica)
type Mat = { id: string; symbol: string; label: string; sub: string; can: boolean; rarity: string; noWeapon?: boolean };
type Blocked = { symbol: string; name: string; why: string };
type Slot = { key: string; label: string; icon: IconName };
const RC: Record<string, string> = { comum: "border-violet-700", raro: "border-cyan-500", epico: "border-purple-500", lendario: "border-amber-400" };

// "mesa de crafting": escolhe o material (elemento ou liga) e clica na peça para forjar (ingrediente -> resultado)
export default function CraftingBench({ mats, blocked, slots }: { mats: Mat[]; blocked: Blocked[]; slots: Slot[] }) {
  const { t } = useT();
  const [sel, setSel] = useState<string | null>(mats.find((m) => m.can)?.id ?? mats[0]?.id ?? null);
  const [pend, go] = useTransition();
  const selMat = mats.find((m) => m.id === sel);
  const ok = (slot: string) => !!selMat?.can && !pend && !(slot === "arma" && selMat.noWeapon);
  const craft = (slot: string) => {
    if (!selMat || !ok(slot)) return;
    const fd = new FormData();
    fd.set("mat", selMat.id);
    fd.set("slot", slot);
    go(() => forge(fd));
  };
  const chip = (m: Mat) => (
    <button
      key={m.id}
      onClick={() => setSel(m.id)}
      aria-pressed={sel === m.id}
      title={m.noWeapon ? t("forge.noWeaponShort") : undefined}
      className={`flex items-center gap-1.5 rounded-lg border-2 bg-[#0c0a1f] px-2 py-1.5 text-xs transition-colors duration-200 ${sel === m.id ? "border-cyan-400 bg-cyan-950/40" : RC[m.rarity] ?? "border-violet-700"} ${m.can ? "" : "opacity-60"}`}
    >
      <SafeImg src={`/items/mat-${m.symbol.toLowerCase()}.png`} className="h-6 w-6 object-contain" fallback={<GameIcon name="ore" />} />
      <span className="text-left"><b className="block">{m.label}</b><span className="text-violet-300">{m.sub}</span></span>
    </button>
  );
  const pure = mats.filter((m) => m.id.startsWith("e:")), alloys = mats.filter((m) => m.id.startsWith("a:"));
  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1 text-sm text-violet-300">{t("forge.step1")} · {t("forge.cost")}</div>
        {!!pure.length && <div className="mb-1 flex flex-wrap gap-2" aria-label={t("forge.pure")}>{pure.map(chip)}</div>}
        <div className="mb-1 mt-2 text-xs text-violet-400">{t("forge.alloys")}</div>
        <div className="flex flex-wrap gap-2" aria-label={t("forge.alloys")}>{alloys.map(chip)}</div>
        {!pure.length && <p className="mt-1 text-xs text-violet-400">{t("forge.empty")}</p>}
        {!!blocked.length && (
          <p className="mt-2 text-[11px] text-violet-400">
            {t("forge.blocked")}:{" "}
            {blocked.map((b, i) => <span key={b.symbol} title={b.why} className="cursor-help underline decoration-dotted">{b.symbol}{i < blocked.length - 1 ? ", " : ""}</span>)}
          </p>
        )}
      </div>
      <div>
        <div className="mb-1 text-sm text-violet-300">{selMat ? t("forge.step2With", { name: selMat.label }) : t("forge.step2")}</div>
        <div className="grid grid-cols-5 gap-2">
          {slots.map((s) => (
            <button
              key={s.key}
              disabled={!ok(s.key)}
              onClick={() => craft(s.key)}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-violet-700 bg-[#0c0a1f] text-[11px] text-violet-300 transition-colors duration-200 hover:border-cyan-400 hover:bg-cyan-950/30 disabled:opacity-30"
            >
              <span className="text-2xl"><GameIcon name={s.icon} /></span>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
