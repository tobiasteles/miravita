import { ASPECTS, DOMAINS, DOMAIN_TERM, domFx, type DomainCfg } from "@/lib/game/battle"; import { forgeDomain } from "@/actions/world"; import SafeImg from "@/components/game/SafeImg";
export default function DomainCard({ c }: { c: { level: number; classKey: string; gold: number | string; domain: DomainCfg | null } }) {
  const D = DOMAINS[c.classKey], A = ASPECTS[c.classKey], dm = c.domain, f = dm ? domFx(c.classKey, dm) : null, locked = c.level < D.lv;
  return <div className="rounded-lg border-2 border-amber-400/70 bg-[#171433] p-3 shadow-[0_0_24px_#fbbf2433]"><div className="text-xs uppercase tracking-widest text-amber-300">{DOMAIN_TERM} · técnica suprema</div>
    {locked ? <div className="opacity-60"><b className="text-lg">🌀 ???</b> <span className="text-sm text-violet-400">🔒 Nv. {D.lv}: você mesmo escolhe o nome e o aspecto.</span></div> : <>
      {f && dm ? <div className="mb-2"><b className="text-lg">🌀 {f.n}</b> <span className="text-sm" style={{ color: f.color }}>● {f.aspect}</span>
        <div className="text-sm text-violet-200">Maestria {f.mastery}/10 · poder ×{f.p.toFixed(2)} do ATK por turno · custo {Math.round(f.cost * 100)}% de EA</div>
        <div className="my-1 h-2 rounded bg-[#0c0a1f]"><div className="h-2 rounded bg-amber-400" style={{ width: f.mastery >= 10 ? "100%" : `${(dm.uses % 5) * 20}%` }} /></div><div className="text-xs text-violet-400">Cada uso em batalha aproxima a próxima maestria (+5% de poder, -2% de custo).</div></div>
        : <p className="text-sm text-violet-200">Você alcançou o auge. Dê nome à sua técnica suprema e escolha o aspecto que define como ela funciona.</p>}
      <details open={!dm}><summary className="cursor-pointer text-sm text-amber-300">{dm ? "Reforjar (10.000g, mantém a maestria)" : "Forjar minha técnica suprema"}</summary>
        <form action={forgeDomain} className="mt-2 space-y-2"><input name="name" defaultValue={dm?.name} required minLength={3} maxLength={30} placeholder="Nome da técnica (ex.: Eclipse do Desertor)" className="w-full rounded bg-[#0c0a1f] p-2" />
          <input name="shout" defaultValue={dm?.shout} maxLength={60} placeholder="Grito de ativação (opcional)" className="w-full rounded bg-[#0c0a1f] p-2" />
          {A.map((x) => <label key={x.k} className="flex items-start gap-2 rounded border border-violet-900 p-2 text-sm"><input type="radio" name="aspect" value={x.k} defaultChecked={dm ? dm.aspect === x.k : x === A[0]} className="mt-1" /><SafeImg src={`/domains/${x.k}.png`} className="h-10 w-16 shrink-0 rounded object-cover" /><span><b style={{ color: x.c }}>● {x.n}</b> <span className="text-violet-300">{x.d}</span></span></label>)}
          <button className="rounded bg-amber-400 px-4 py-2 font-bold text-slate-900">{dm ? "Reforjar" : "Forjar"}</button></form></details></>}</div>;
}
