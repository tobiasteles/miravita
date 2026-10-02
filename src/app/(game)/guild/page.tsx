import { redirect } from "next/navigation"; import Link from "next/link"; import { eq } from "drizzle-orm"; import { db } from "@/db"; import { guilds, guildMembers, characters } from "@/db/schema";
import { getActiveCharacter } from "@/lib/session"; import { createGuild, joinGuild, leaveGuild, setRank } from "@/actions/guild";
export default async function Guild({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const a = await getActiveCharacter(); if (!a) redirect("/characters"); const { error } = await searchParams; const gid = a.c.guildId;
  const box = "rounded-lg border border-violet-900 bg-[#171433] p-3";
  const [g] = gid ? await db.select().from(guilds).where(eq(guilds.id, gid)) : [];
  const mem = gid ? await db.select({ m: guildMembers, n: characters.name, lv: characters.level }).from(guildMembers).innerJoin(characters, eq(guildMembers.characterId, characters.id)).where(eq(guildMembers.guildId, gid)) : [];
  const all = gid ? [] : await db.select().from(guilds).limit(20); const leader = mem.find((m) => m.m.characterId === a.c.id)?.m.rank === "lider";
  return <main className="mx-auto max-w-xl space-y-3 p-4"><Link href="/play" className="text-violet-300">← Voltar</Link>{error && <p className="text-rose-400">{error}</p>}
    {g ? <section className={box}><h1 className="text-xl font-bold">[{g.tag}] {g.name}</h1><div className="text-sm text-violet-300">Chat privado na aba “Guilda” abaixo.</div>
      {mem.map((m) => <div key={m.m.characterId} className="flex items-center gap-2 border-t border-violet-900 py-1"><span className="flex-1">{m.n} <span className="text-sm text-violet-400">Nv. {m.lv} · {m.m.rank}</span></span>
        {leader && m.m.rank !== "lider" && <form action={setRank} className="flex gap-1"><input type="hidden" name="cid" value={m.m.characterId} /><button name="rank" value="oficial" className="rounded border border-violet-800 px-2 text-xs">Oficial</button><button name="rank" value="membro" className="rounded border border-violet-800 px-2 text-xs">Membro</button></form>}</div>)}
      <form action={leaveGuild}><button className="mt-3 text-rose-400">Sair da guilda</button></form></section>
    : <><form action={createGuild} className={`${box} space-y-2`}><h2 className="font-semibold">Criar guilda</h2><input name="name" placeholder="Nome" maxLength={16} className="w-full rounded bg-[#0c0a1f] p-2" /><input name="tag" placeholder="TAG (2–4)" maxLength={4} className="w-full rounded bg-[#0c0a1f] p-2" /><button className="rounded bg-violet-600 px-4 py-2 font-semibold">Criar</button></form>
      <section className={box}><b>Guildas abertas</b>{all.map((x) => <form key={x.id} action={joinGuild} className="flex items-center justify-between py-1"><input type="hidden" name="id" value={x.id} /><span>[{x.tag}] {x.name}</span><button className="rounded border border-violet-800 px-3 py-1">Entrar</button></form>)}</section></>}</main>;
}
