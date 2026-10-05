"use client";
import { useEffect, useRef, useState } from "react";
type Msg = { id: string; who: string; to: string | null; text: string }; type Ch = "local" | "privado" | "grito" | "guilda" | "grupo";
const TABS: [Ch, string][] = [["local", "Local"], ["privado", "Privado"], ["grito", "Gritar"], ["guilda", "Guilda"], ["grupo", "Grupo"]];
const HINT: Record<Ch, string> = { local: "só quem está no seu mapa · 1 msg/2s", privado: "só o destinatário · 1 msg/s", grito: "todos os mapas · Nv.5+ · 1 msg/30s · 80 letras", guilda: "só sua guilda", grupo: "só seu grupo" };
export default function ChatDock() {
  const [msgs, setMsgs] = useState<Msg[]>([]); const [t, setT] = useState(""); const [to, setTo] = useState(""); const [err, setErr] = useState(""); const [ch, setCh] = useState<Ch>("local"); const box = useRef<HTMLDivElement>(null);
  async function load() { try { const r = await fetch(`/api/chat?channel=${ch}`, { cache: "no-store" }); if (r.ok) setMsgs(await r.json()); } catch {} }
  useEffect(() => { setMsgs([]); setErr(""); load(); const i = setInterval(load, 3000); return () => clearInterval(i); }, [ch]); // polling; para tempo real puro use Pusher/Ably
  useEffect(() => { box.current?.scrollTo(0, 1e9); }, [msgs]);
  async function send() { const c = t.trim(); if (!c) return; const r = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ content: c, channel: ch, to }) }); const j = await r.json(); if (r.ok) { setT(""); setErr(""); load(); } else setErr(j.error ?? "Erro"); }
  return <div className="fixed inset-x-0 bottom-0 z-30 border-t border-violet-900 bg-[#100d28] p-2">
    <div className="flex gap-1">{TABS.map(([k, l]) => <button key={k} onClick={() => setCh(k)} className={`rounded px-3 py-1 text-sm ${ch === k ? "bg-violet-600" : "border border-violet-800"}`}>{l}</button>)}<span className="ml-1 self-center truncate text-xs text-violet-400">{HINT[ch]}</span></div>
    <div ref={box} className="h-20 overflow-auto text-sm">{msgs.map((m) => <div key={m.id}><b className={ch === "grito" ? "text-amber-300" : "text-cyan-300"}>{m.who}{m.to ? ` → ${m.to}` : ""}</b>: {m.text}</div>)}</div>
    {err && <div className="text-xs text-rose-400">{err}</div>}
    <div className="flex gap-1">{ch === "privado" && <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Para quem?" className="w-28 rounded bg-[#0c0a1f] p-2" />}
      <input id="chat-input" value={t} onChange={(e) => setT(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Mensagem..." maxLength={200} className="w-full rounded bg-[#0c0a1f] p-2" /></div>
  </div>;
}
