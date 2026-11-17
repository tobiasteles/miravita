"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { variants } from "@/lib/img";
import { SPOTS, expPhase, isNight } from "@/lib/game/town";
import { useToast } from "@/components/ui";
import { useStageBus } from "./bus";
import { markSlow, useStageMode } from "./support";

// cena 3D da cidade: chunk separado, só carrega se o aparelho aguentar. Os prédios clicáveis continuam sendo o DOM do TownMap.
const TownStage = dynamic(() => import("./TownStage"), { ssr: false });
const avUrls = (av: string) => [...variants(`/battle/player/${av}`), ...variants(`/avatars/${av}`)];

export default function TownScene({ slug, realmOpen, expEndsAt, meAv, mates }: { slug: string; realmOpen: boolean; expEndsAt: number | null; meAv: string; mates: string[] }) {
  const mode = useStageMode(), bus = useStageBus(), toast = useToast();
  const root = useRef<HTMLDivElement>(null);
  const [hot, setHot] = useState<string | null>(null);
  const [night, setNight] = useState(false), [now, setNow] = useState(0);
  const [ready, setReady] = useState(false), [slow, setSlow] = useState(false);
  const is3d = mode === "3d" && !slow;

  useEffect(() => { // relógio do navegador: dia/noite e a expedição passando de "em andamento" para "pronta"
    const tick = () => { setNight(isNight(new Date().getHours())); setNow(Date.now()); };
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { // mouse/foco/clique nos pontos do DOM (data-spot) comandam o brilho e o anel de energia da cena
    const town = root.current?.closest(".town");
    if (!town || !is3d) return;
    const id = (e: Event) => (e.target as HTMLElement).closest?.("[data-spot]")?.getAttribute("data-spot") ?? null;
    const over = (e: Event) => setHot(id(e)), out = () => setHot(null);
    const down = (e: Event) => { const s = SPOTS.find((x) => x.id === id(e)); if (s) bus.emit({ k: "pulse", x: s.x, y: s.y, el: s.glow }); };
    town.addEventListener("pointerover", over); town.addEventListener("pointerout", out);
    town.addEventListener("focusin", over); town.addEventListener("focusout", out);
    town.addEventListener("pointerdown", down);
    return () => {
      town.removeEventListener("pointerover", over); town.removeEventListener("pointerout", out);
      town.removeEventListener("focusin", over); town.removeEventListener("focusout", out);
      town.removeEventListener("pointerdown", down);
    };
  }, [bus, is3d]);

  useEffect(() => { // esconde a imagem 2D só quando o 3D já está pronto
    const t = root.current?.closest<HTMLElement>(".town");
    if (!t) return;
    if (is3d && ready) t.dataset.scene3d = "1"; else delete t.dataset.scene3d;
    return () => { delete t.dataset.scene3d; };
  }, [is3d, ready]);

  return (
    <div ref={root} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ borderRadius: "inherit" }}>
      {is3d && (
        <TownStage
          bus={bus}
          bgUrls={variants(`/town/${slug}`)}
          meUrls={avUrls(meAv)}
          mates={mates.map(avUrls)}
          night={night}
          hot={hot}
          realmOpen={realmOpen}
          exp={expPhase(expEndsAt, now || Date.now())}
          onReady={() => setReady(true)}
          onSlow={() => { markSlow(); setSlow(true); setReady(false); toast("O aparelho ficou lento: voltamos ao modo 2D.", "warn"); }}
        />
      )}
    </div>
  );
}
