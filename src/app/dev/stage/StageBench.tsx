"use client";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import manifest from "@/lib/image-manifest.json";
import { useStageBus, type StageEvent } from "@/components/stage/bus";
import { clearSlow, markSlow, useStageMode } from "@/components/stage/support";
import { Button, Card } from "@/components/ui";

const BenchScene = dynamic(() => import("@/components/stage/BenchScene"), { ssr: false, loading: () => <div className="grid h-full place-items-center text-sm text-ink-dim">Carregando a cena…</div> });
const first = (pre: string) => ((manifest as string[]).find((u) => u.startsWith(pre)) ?? "");

export default function StageBench() {
  const mode = useStageMode();
  const bus = useStageBus();
  const [summon, setSummon] = useState(false);
  const [slow, setSlow] = useState(false);
  const bg = useMemo(() => [first("/maps/")].filter(Boolean), []);
  const me = useMemo(() => [first("/battle/player/"), first("/avatars/")].filter(Boolean), []);
  const foe = useMemo(() => [first("/monsters/")].filter(Boolean), []);
  const send = (e: StageEvent) => bus.emit(e);
  const btn = (label: string, e: StageEvent) => <Button key={label} size="sm" variant="ghost" onClick={() => send(e)}>{label}</Button>;
  return (
    <main className="mx-auto max-w-5xl space-y-3 p-3">
      <h1 className="font-display text-xl font-extrabold">Bancada do núcleo 3D (só dev)</h1>
      <p className="text-sm text-ink-dim">Modo: {slow ? "voltou ao 2D (aparelho lento)" : mode}. Use o medidor de FPS do Chrome (DevTools → ⋮ → More tools → Rendering) e CPU 6x slowdown.</p>
      <div className="relative aspect-[16/10] overflow-hidden rounded-panel bg-bg ring-1 ring-line">
        {mode === "3d" && !slow ? <BenchScene bus={bus} bg={bg} me={me} foe={foe} summon={summon} onSlow={() => { markSlow(); setSlow(true); }} /> : <div className="grid h-full place-items-center text-ink-dim">Tela 2D atual (fallback)</div>}
      </div>
      <Card className="flex flex-wrap gap-2 !p-3">
        {btn("Golpe", { k: "hit", from: "me", to: "foe", el: "#e8e6ff" })}
        {btn("Crítico ígneo", { k: "crit", from: "me", to: "foe", el: "metal alcalino" })}
        {btn("Crítico arcano", { k: "crit", from: "me", to: "foe", el: "#a78bfa" })}
        {btn("Esquiva", { k: "dodge", from: "me", to: "foe" })}
        {btn("Inimigo ataca", { k: "hit", from: "foe", to: "me" })}
        {btn("Inimigo crítico", { k: "crit", from: "foe", to: "me", el: "#f43f5e" })}
        {btn("Cura", { k: "heal", to: "me" })}
        {btn("Habilidade", { k: "skill", from: "me", el: "gás nobre" })}
        <Button size="sm" variant="ghost" onClick={() => { setSummon(true); setTimeout(() => send({ k: "summon", el: "#67e8f9" }), 30); }}>Invocar</Button>
        {btn("Vitória", { k: "win" })}
        {btn("Derrota", { k: "lose" })}
        {btn("Fugir", { k: "flee" })}
        <Button size="sm" variant="gold" onClick={() => { clearSlow(); location.reload(); }}>Limpar marca de lentidão</Button>
      </Card>
    </main>
  );
}
