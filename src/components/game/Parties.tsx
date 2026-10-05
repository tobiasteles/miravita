import { eq, inArray } from "drizzle-orm"; import { db } from "@/db"; import { parties, partyMembers, characters } from "@/db/schema"; import { createParty, joinParty, leaveParty } from "@/actions/party";
export default async function Parties({ gid, me }: { gid: string; me: string }) {
  const ps = await db.select().from(parties).where(eq(parties.guildId, gid));
  const mem = ps.length ? await db.select({ pid: partyMembers.partyId, id: characters.id, n: characters.name, lv: characters.level, hp: characters.hp }).from(partyMembers).innerJoin(characters, eq(partyMembers.characterId, characters.id)).where(inArray(partyMembers.partyId, ps.map((p) => p.id))) : [];
  const mine = mem.find((m) => m.id === me)?.pid;
  return <section className="rounded-lg border border-violet-900 bg-[#171433] p-3"><h2 className="font-semibold">⚔️ Grupos (até 4)</h2><div className="text-xs text-violet-400">+10% de XP por aliado do grupo no mesmo mapa · chat na aba “Grupo”</div>
    {ps.map((p) => { const ms = mem.filter((m) => m.pid === p.id); return <div key={p.id} className="mt-2 border-t border-violet-900 pt-2"><div className="flex items-center gap-2"><b className="flex-1">{p.name} <span className="text-xs text-violet-400">{ms.length}/4</span></b>
      {mine === p.id ? <form action={leaveParty}><button className="text-sm text-rose-400">Sair</button></form> : !mine && ms.length < 4 && <form action={joinParty}><input type="hidden" name="id" value={p.id} /><button className="rounded border border-violet-800 px-2 text-sm">Entrar</button></form>}</div>
      {ms.map((m) => <div key={m.id} className="text-sm text-violet-200">{m.id === p.leaderId ? "👑 " : "• "}{m.n} <span className="text-violet-400">Nv. {m.lv} · HP {m.hp}</span></div>)}</div>; })}
    {!mine && <form action={createParty} className="mt-3 flex gap-2"><input name="name" placeholder="Nome do grupo" maxLength={20} className="flex-1 rounded bg-[#0c0a1f] p-2" /><button className="rounded bg-violet-600 px-3 py-1 font-semibold">Criar</button></form>}</section>;
}
