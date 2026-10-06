import Link from "next/link";
import { LogoStack, ClassSeal } from "@/components/brand/Brand";
import { bg } from "@/lib/img";

// vaga-lumes: posição, atraso e duração diferentes para cada um
const FLIES = Array.from({ length: 14 }, (_, i) => ({
  l: (i * 37) % 100,
  d: (i * 1.3) % 9,
  t: 7 + (i % 5) * 2,
}));

export default function Home() {
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
            ["fisica", "Destruidor"],
            ["portugues", "Mago Arcano"],
            ["historia", "Invocador de Eras"],
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
      </main>
    </>
  );
}
