import Link from "next/link";
import { LogoStack, ClassSeal } from "@/components/brand/Brand";
import { bg } from "@/lib/img";
import { latestNews } from "@/lib/game/live";
import EventBanner from "@/components/game/EventBanner";
import GameIcon from "@/components/game/GameIcon";
export const dynamic = "force-dynamic";

// vaga-lumes: posição, atraso e duração diferentes para cada um
const FLIES = Array.from({ length: 14 }, (_, i) => ({
  l: (i * 37) % 100,
  d: (i * 1.3) % 9,
  t: 7 + (i % 5) * 2,
}));

export default async function Home() {
  const news = await latestNews(5); // notícias criadas em /admin/noticias
  return (
    <>
      {/* fundo: planície (usa /brand/login-bg se existir; senão o cenário do 1º mapa; senão o degradê) */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        style={{
          background:
            "linear-gradient(#1b1650 0%, #3b2a8f 30%, #0e7490 52%, #166534 53%, #052e16 100%)",
        }}
      >
        <div
          className="bg-pan absolute -inset-[3%]"
          style={{
            backgroundImage: `${bg("/brand/login-bg")}, ${bg("/maps/planicie-de-aurora")}`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(12,10,31,.7) 0%, rgba(12,10,31,.3) 40%, rgba(12,10,31,.85) 100%)",
          }}
        />
        {FLIES.map((f, i) => (
          <span
            key={i}
            className="fly"
            style={{
              left: `${f.l}%`,
              animationDelay: `${f.d}s`,
              animationDuration: `${f.t}s`,
            }}
          />
        ))}
      </div>

      <main className="relative mx-auto max-w-md px-6 py-14 text-center">
        <LogoStack />
        <p className="mx-auto mt-6 max-w-xs text-violet-100 [text-shadow:0_2px_12px_#000]">
          Seja um Desperto: reúna o poder despedaçado, enfrente portais e forje
          a sua técnica suprema.
        </p>
        <div className="my-8 flex justify-center gap-5">
          {[
            ["fisica", "Monitor Estelar"],
            ["portugues", "Orador"],
            ["historia", "Invocador"],
          ].map(([k, l]) => (
            <div key={k} className="flex flex-col items-center gap-1">
              <ClassSeal cls={k} size={72} />
              <span className="text-xs text-violet-200">{l}</span>
            </div>
          ))}
        </div>
        <Link
          href="/characters"
          className="inline-block rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-8 py-3 text-lg font-bold shadow-[0_0_30px_#8b5cf688] transition hover:scale-105"
        >
          Despertar
        </Link>

        <div className="mt-6 flex justify-center"><EventBanner /></div>
        {news.length > 0 && (
          <section className="mt-8 space-y-3 text-left">
            <h2 className="flex items-center justify-center gap-2 text-center text-sm font-bold uppercase tracking-widest text-cyan-300">
              <GameIcon name="scroll" /> Notícias
            </h2>
            {news.map((n) => (
              <article key={n.id} className="rounded-xl border border-violet-700/60 bg-[#12102c]/85 p-4 backdrop-blur">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-bold text-violet-100">
                    {n.pinned && <GameIcon name="pin" className="mr-1 text-amber-300" />}
                    {n.title}
                  </h3>
                  <time className="shrink-0 text-xs text-violet-400">{new Date(n.createdAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</time>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-violet-200">{n.body}</p>
              </article>
            ))}
          </section>
        )}
      </main>
    </>
  );
}
