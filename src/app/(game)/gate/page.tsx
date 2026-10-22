import Link from "next/link";
import { redirect } from "next/navigation";
import { getActiveCharacter } from "@/lib/session";
import { startBattle } from "@/actions/battle";
import { loadPlayer } from "@/lib/game/player";
import { BESTIARY } from "@/lib/game/bestiary";
import SafeImg from "@/components/game/SafeImg";
import GameIcon from "@/components/game/GameIcon";

// PORTÃO DA CIDADE: fale com os guardas. Daqui você sai para caçar sem parar (Grind Infinito) ou vai para o Mapa.
export default async function Gate() {
  const a = await getActiveCharacter();
  if (!a?.map) redirect("/characters");
  const { c, map } = a, B = BESTIARY[map.slug], P = await loadPlayer(c.id);
  const lo = P.kit.loadout.filter((i: number) => i >= 0).length;
  return (
    <main className="mx-auto max-w-xl space-y-3 p-4">
      <Link href="/play" className="flex items-center gap-1 text-violet-300"><GameIcon name="arrowleft" /> Voltar à cidade</Link>
      <h1 className="flex items-center gap-2 text-xl font-bold"><GameIcon name="castle" className="text-slate-300" /> Portão da Cidade</h1>
      <div className="flex items-start gap-3 rounded-xl border border-violet-800 bg-[#171433] p-3">
        <SafeImg src="/npcs/capitao-dos-guardas.png" className="h-16 w-16 shrink-0 rounded-full border-2 border-violet-400 object-cover" fallback={<span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-violet-950 text-3xl text-violet-300"><GameIcon name="castle" /></span>} />
        <div className="text-sm">
          <b className="text-violet-200">Capitão dos Guardas</b>
          <p className="mt-1 text-violet-100">“Os arredores de <b>{map.name}</b> estão cheios de monstros (Nv. {B?.lo}–{B?.hi}). Saia, lute e volte quando estiver cansado. Cada monstro derrotado já rende XP, ouro e elementos; mas quanto mais tempo lá fora, mais furiosos eles ficam.”</p>
        </div>
      </div>
      <form action={startBattle}>
        <input type="hidden" name="kind" value="endless" />
        <button className="town-hunt relative flex w-full items-center gap-3 rounded-xl border-2 border-rose-500 bg-rose-950/40 p-4 text-left transition hover:bg-rose-900/40">
          <GameIcon name="swords" size="2.2em" className="text-rose-300" />
          <div className="flex-1"><div className="text-lg font-bold">Sair para caçar</div><div className="text-xs text-rose-200">Grind infinito: monstros do seu nível em sequência. Sub-chefe a cada 10 e CHEFE a cada 25. Você decide quando voltar.</div></div>
        </button>
      </form>
      {lo === 0 && <p className="text-xs text-amber-300">Atenção: você não tem poderes equipados. Equipe até 4 na Academia.</p>}
      <Link href="/map" className="flex items-center gap-3 rounded-xl border border-violet-800 bg-[#171433] p-4 transition hover:border-violet-500">
        <GameIcon name="compass" size="2em" className="text-amber-300" />
        <div className="flex-1"><div className="font-bold">Viajar para outro mapa</div><div className="text-xs text-violet-300">Estrada (risco de emboscada), escolta paga ou pedra/teleporte.</div></div>
      </Link>
      <Link href="/skills" className="flex items-center gap-3 rounded-xl border border-violet-800 bg-[#171433] p-4 transition hover:border-violet-500">
        <GameIcon name="book" size="2em" className="text-cyan-300" />
        <div className="flex-1"><div className="font-bold">Academia: trocar poderes</div><div className="text-xs text-violet-300">{lo}/4 poderes equipados.</div></div>
      </Link>
    </main>
  );
}
