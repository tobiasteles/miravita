"use client";
import { useEffect, useRef, useState } from "react";
type Msg = { id: string; who: string; text: string };
export default function ChatDock() {
  const [msgs, setMsgs] = useState<Msg[]>([]); const [t, setT] = useState(""); const [ch, setCh] = useState<"global" | "guilda">("global"); const box = useRef<HTMLDivElement>(null);
  async function load() { try { const r = await fetch(`/api/chat?channel=${ch}`, { cache: "no-store" }); if (r.ok) setMsgs(await r.json()); } catch {} }
  useEffect(() => { setMsgs([]); load(); const i = setInterval(load, 3000); return () => clearInterval(i); }, [ch]); // polling; troque por Pusher/Ably para tempo real puro
  useEffect(() => { box.current?.scrollTo(0, 1e9); }, [msgs]);
  async function send() { const c = t.trim(); if (!c) return; setT(""); await fetch("/api/chat", { method: "POST", body: JSON.stringify({ content: c, channel: ch }) }); load(); }
  const tab = (k: "global" | "guilda") => `px-3 py-1 text-sm rounded ${ch === k ? "bg-violet-600" : "border border-violet-800"}`;
  return <div className="fixed inset-x-0 bottom-0 z-30 border-t border-violet-900 bg-[#100d28] p-2">
    <div className="flex gap-2"><button className={tab("global")} onClick={() => setCh("global")}>Global</button><button className={tab("guilda")} onClick={() => setCh("guilda")}>Guilda</button></div>
    <div ref={box} className="h-24 overflow-auto text-sm">{msgs.map((m) => <div key={m.id}><b className="text-cyan-300">{m.who}</b>: {m.text}</div>)}{ch === "guilda" && !msgs.length && <div className="text-violet-400">Sem mensagens (ou você não está em uma guilda).</div>}</div>
    <input value={t} onChange={(e) => setT(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Mensagem..." maxLength={200} className="w-full rounded bg-[#0c0a1f] p-2" />
  </div>;
}
