import { redirect } from "next/navigation"; import { asc } from "drizzle-orm"; import { db } from "@/db"; import { maps } from "@/db/schema";
import { getActiveCharacter } from "@/lib/session"; import { xpToNext, estimatedDays } from "@/lib/game/xp"; import { travel } from "@/actions/character"; import { startBattle, rest } from "@/actions/battle"; import Link from "next/link";
export default async function Play() {
  const a = await getActiveCharacter(); if (!a) redirect("/characters");
  const { c, map } = a; const all = await db.select().from(maps).orderBy(asc(maps.minLevel)); const pct = Math.min(100, (Number(c.xp) / xpToNext(c.level)) * 100);
  return <main className="mx-auto max-w-xl space-y-3 p-4">
    <section className="rounded-lg border border-violet-900 bg-[#171433] p-3"><b>{c.name}</b> <span className="text-violet-300">Nv. {c.level} · {c.classKey}</span>
      <div className="my-1 h-2 rounded bg-[#0c0a1f]"><div className="h-2 rounded bg-amber-400" style={{ width: `${pct}%` }} /></div>
      <div className="text-sm text-violet-300">XP {Number(c.xp).toLocaleString()} / {xpToNext(c.level).toLocaleString()} · HP {c.hp} · MP {c.mp} · 💰 {Number(c.gold)}</div></section>
    <section className="rounded-lg border border-violet-900 bg-[#171433] p-3"><div className="text-sm text-violet-300">Você está em</div>
      <h2 className="text-xl font-bold">📍 {map?.name ?? "—"}</h2><div className="text-sm text-violet-300">Bioma: {map?.biome} · Nível mínimo {map?.minLevel}</div></section>
    <section className="flex flex-wrap gap-2">
      <form action={startBattle}><input type="hidden" name="kind" value="hunt" /><button className="rounded bg-violet-600 px-4 py-2 font-semibold">⚔️ Caçar</button></form>
      <form action={startBattle}><input type="hidden" name="kind" value="dungeon" /><button className="rounded bg-violet-600 px-4 py-2 font-semibold">🌀 Portal</button></form>
      <form action={rest}><button className="rounded border border-violet-800 px-4 py-2">🛏 Descansar</button></form>
      <Link href="/inventory" className="rounded border border-violet-800 px-4 py-2">🎒 Mochila & Forja</Link><Link href="/guild" className="rounded border border-violet-800 px-4 py-2">🏰 Guilda</Link></section>
    <section className="rounded-lg border border-violet-900 bg-[#171433] p-3"><b>Mapas</b>{all.map((m) => <form key={m.id} action={travel} className="flex items-center justify-between py-1">
      <input type="hidden" name="mapId" value={m.id} /><span>{m.name} <span className="text-sm text-violet-400">Nv. {m.minLevel}+</span></span>
      <button disabled={c.level < m.minLevel || m.id === c.currentMapId} className="rounded border border-violet-800 px-3 py-1 disabled:opacity-30">{c.level < m.minLevel ? "🔒" : "Viajar"}</button></form>)}</section>
    <p className="text-center text-sm text-violet-400">Meta: nível 200 em ~{estimatedDays()} dias de jogo ativo.</p>
  </main>;
}
