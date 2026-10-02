import Link from "next/link";
export default function Home() {
  return <main className="mx-auto max-w-md p-8 text-center"><h1 className="mt-16 text-5xl font-bold tracking-widest [text-shadow:0_0_24px_#8b5cf6]">MIRAVITA</h1>
    <p className="my-4 text-violet-300">Desperte o poder do conhecimento.</p>
    <Link href="/characters" className="inline-block rounded-lg bg-violet-600 px-6 py-3 font-semibold">Jogar</Link></main>;
}
