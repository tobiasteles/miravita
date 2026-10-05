import { bg } from "@/lib/img";
import Link from "next/link"; import { LogoStack, ClassSeal } from "@/components/brand/Brand";
export default function Home() {
  return <main className="relative mx-auto max-w-md px-6 py-14 text-center"><div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center opacity-40" style={{ backgroundImage: bg("/brand/key-art") }} /><LogoStack />
    <p className="mx-auto mt-6 max-w-xs text-violet-200">Seja um Desperto: reúna o poder despedaçado, enfrente portais e forje a sua técnica suprema.</p>
    <div className="my-8 flex justify-center gap-5">{[["fisica", "Destruidor"], ["portugues", "Mago Arcano"], ["historia", "Invocador de Eras"]].map(([k, l]) => <div key={k} className="flex flex-col items-center gap-1"><ClassSeal cls={k} size={72} /><span className="text-xs text-violet-300">{l}</span></div>)}</div>
    <Link href="/characters" className="inline-block rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-8 py-3 text-lg font-bold shadow-[0_0_30px_#8b5cf688] transition hover:scale-105">Despertar</Link>
    <div className="mt-6"><Link href="/brand" className="text-sm text-violet-400 underline">Identidade visual</Link></div></main>;
}
