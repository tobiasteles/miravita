import SafeImg from "@/components/game/SafeImg"; import { bg } from "@/lib/img";
import { CLASS_NAME } from "@/lib/game/classes";
import { redirect } from "next/navigation"; import { asc } from "drizzle-orm"; import { db } from "@/db"; import { maps } from "@/db/schema";
import { getActiveCharacter } from "@/lib/session"; import { xpToNext, estimatedDays } from "@/lib/game/xp"; import { travel } from "@/actions/character"; import { startBattle, rest } from "@/actions/battle"; import Link from "next/link"; import { HotkeyBar } from "@/components/game/Hotkeys"; import { Logo, ClassSeal } from "@/components/brand/Brand";
export default async function Play() {
  const a = await getActiveCharacter(); if (!a) redirect("/characters");
  const { c, map } = a; const all = await db.select().from(maps).orderBy(asc(maps.minLevel)); const pct = Math.min(100, (Number(c.xp) / xpToNext(c.level)) * 100);
  return <main className="mx-auto max-w-xl space-y-3 p-4">
    <Logo size={36} />
    <section className="relative overflow-hidden rounded-2xl border border-violet-700/50 bg-[#171433] p-4"><div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-violet-600/30 blur-3xl" /><div className="absolute right-3 top-3"><ClassSeal cls={c.classKey} size={64} /></div>
      <div className="relative flex items-center gap-4"><SafeImg src={`/avatars/${c.avatarId}.png`} alt={c.avatarId} className="h-28 w-28 rounded-2xl bg-violet-950 object-cover ring-2 ring-violet-500/60 shadow-[0_0_30px_#8b5cf6aa]" />
        <div className="flex-1"><div className="text-2xl font-bold">{c.name}</div><div className="text-violet-300">{CLASS_NAME[c.classKey]} · Nv. {c.level}</div><div className="mt-1 text-sm text-amber-300">💰 {Number(c.gold)}</div></div></div></section>
    <HotkeyBar />
    <section className="rounded-lg border border-violet-900 bg-[#171433] p-3"><b>{c.name}</b> <span className="text-violet-300">Nv. {c.level} · {CLASS_NAME[c.classKey]}</span>
      <div className="my-1 h-2 rounded bg-[#0c0a1f]"><div className="h-2 rounded bg-amber-400" style={{ width: `${pct}%` }} /></div>
      <div className="text-sm text-violet-300">XP {Number(c.xp).toLocaleString()} / {xpToNext(c.level).toLocaleString()} · HP {c.hp} · EA {c.mp} · 💰 {Number(c.gold)}</div></section>
    <section style={{ backgroundImage: `linear-gradient(90deg,#171433f0 40%,#17143366),${bg(`/maps/${map?.slug}`)}`, backgroundSize: "cover", backgroundPosition: "center" }} className="rounded-lg border border-violet-900 bg-[#171433] p-3"><div className="text-sm text-violet-300">Você está em</div>
      <h2 className="text-xl font-bold">📍 {map?.name ?? "—"}</h2><div className="text-sm text-violet-300">Bioma: {map?.biome} · Nível mínimo {map?.minLevel}</div></section>
    <section className="flex flex-wrap gap-2">
      <form action={startBattle}><input type="hidden" name="kind" value="hunt" /><button className="rounded bg-violet-600 px-4 py-2 font-semibold">⚔️ Caçar</button></form>
      <form action={startBattle}><input type="hidden" name="kind" value="dungeon" /><button className="rounded bg-violet-600 px-4 py-2 font-semibold">🌀 Portal</button></form>
      <form action={rest}><button className="rounded border border-violet-800 px-4 py-2">🛏 Descansar</button></form>
      <Link href="/inventory" className="rounded border border-violet-800 px-4 py-2">🎒 Mochila & Forja</Link><Link href="/guild" className="rounded border border-violet-800 px-4 py-2">🏰 Guilda</Link></section>
    
    <p className="text-center text-sm text-violet-400">Meta: nível 200 em ~{estimatedDays()} dias de jogo ativo.</p>
  </main>;
}
