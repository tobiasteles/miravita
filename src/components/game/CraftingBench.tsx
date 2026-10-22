"use client";
import { useState, useTransition } from "react";
import { forge } from "@/actions/inventory";
import SafeImg from "@/components/game/SafeImg";
import GameIcon, { type IconName } from "@/components/game/GameIcon";

type Mat = {
  z: number;
  symbol: string;
  name: string;
  qty: number;
  rarity: string;
};
type Slot = { key: string; label: string; icon: IconName };
const RC: Record<string, string> = {
  comum: "border-violet-700",
  raro: "border-cyan-500",
  epico: "border-purple-500",
  lendario: "border-amber-400",
};

// "mesa de crafting": escolhe o material e clica na peça para forjar, igual a uma mesa do Minecraft (ingrediente -> resultado)
export default function CraftingBench({
  mats,
  slots,
}: {
  mats: Mat[];
  slots: Slot[];
}) {
  const [sel, setSel] = useState<number | null>(mats[0]?.z ?? null);
  const [pend, go] = useTransition();
  const selMat = mats.find((m) => m.z === sel);
  const craft = (slot: string) => {
    if (!selMat || selMat.qty < 5 || pend) return;
    const fd = new FormData();
    fd.set("z", String(selMat.z));
    fd.set("slot", slot);
    go(() => forge(fd));
  };
  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1 text-sm text-violet-300">
          1. Escolha o material (gasta 5 unidades por peça)
        </div>
        <div className="flex flex-wrap gap-2">
          {mats.map((m) => (
            <button
              key={m.z}
              onClick={() => setSel(m.z)}
              className={`flex items-center gap-1.5 rounded-lg border-2 bg-[#0c0a1f] px-2 py-1.5 text-xs transition-colors duration-200 ${sel === m.z ? "border-cyan-400 bg-cyan-950/40" : RC[m.rarity] + " opacity-80 hover:opacity-100"}`}
            >
              <SafeImg
                src={`/items/mat-${m.symbol.toLowerCase()}.png`}
                className="h-6 w-6 object-contain"
                fallback={<GameIcon name="ore" />}
              />{" "}
              {m.symbol} ×{m.qty}
            </button>
          ))}
          {!mats.length && (
            <span className="text-xs text-violet-400">
              Nenhum material ainda. Derrote monstros para conseguir.
            </span>
          )}
        </div>
      </div>
      <div>
        <div className="mb-1 text-sm text-violet-300">
          2. Clique na peça para forjar{selMat ? ` com ${selMat.name}` : ""}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {slots.map((s) => (
            <button
              key={s.key}
              disabled={pend || !selMat || selMat.qty < 5}
              onClick={() => craft(s.key)}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-violet-700 bg-[#0c0a1f] text-[11px] text-violet-200 transition-colors duration-200 hover:border-cyan-400 hover:bg-cyan-950/20 disabled:cursor-not-allowed disabled:opacity-30"
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
