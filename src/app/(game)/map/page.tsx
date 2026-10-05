import { bg } from "@/lib/img";
import { redirect } from "next/navigation"; import Link from "next/link"; import { asc } from "drizzle-orm"; import { db } from "@/db"; import { maps } from "@/db/schema";
import { getActiveCharacter } from "@/lib/session"; import { travel } from "@/actions/character"; import { buyStone } from "@/actions/world"; import { MAGIC, stoneStack } from "@/lib/stone"; import SafeImg from "@/components/game/SafeImg";
export default async function MapPage() {
  const a = await getActiveCharacter(); if (!a) redirect("/characters"); const { c } = a, mage = MAGIC.includes(c.classKey), st = (await stoneStack(c.id)).row?.quantity ?? 0;
  const all = await db.select().from(maps).orderBy(asc(maps.minLevel));
  return <main className="mx-auto max-w-xl space-y-2 p-4"><Link href="/play" className="text-violet-300">← Voltar</Link><h1 className="text-xl font-bold">🗺️ Mapa</h1>
    <p className="text-sm text-violet-300">{mage ? "Sua classe mágica teleporta sem gastar pedras." : `Teleportar gasta 1 Pedra de Teletransporte (você tem ${st}).`}</p>
    {all.map((m) => <form key={m.id} action={travel} style={{ backgroundImage: `linear-gradient(90deg,#171433f2 35%,#17143388),${bg(`/maps/${m.slug}`)}`, backgroundSize: "cover", backgroundPosition: "center" }} className="flex items-center justify-between rounded-lg border border-violet-900 bg-[#171433] p-3"><input type="hidden" name="mapId" value={m.id} />
      <span>{m.id === c.currentMapId ? "📍 " : ""}{m.name} <span className="text-sm text-violet-400">Nv. {m.minLevel}+ · {m.biome}</span></span>
      <button disabled={c.level < m.minLevel || m.id === c.currentMapId || (!mage && st < 1)} className="rounded bg-violet-600 px-3 py-1 disabled:opacity-30">{c.level < m.minLevel ? "🔒" : "Teleportar"}</button></form>)}
    {!mage && <form action={buyStone}><button disabled={Number(c.gold) < 150} className="rounded border border-violet-800 px-4 py-2 disabled:opacity-30"><SafeImg src="/items/teleport-stone.png" className="mr-1 inline h-5 w-5" />Comprar pedra (150g) · 💰 {Number(c.gold)}</button></form>}</main>;
}
