"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
type Msg = { id: string; who: string; to: string | null; text: string };
type Ch = "local" | "privado" | "grito" | "guilda" | "grupo";
const TABS: [Ch, string][] = [
  ["local", "Local"],
  ["privado", "Privado"],
  ["grito", "Gritar"],
  ["guilda", "Guilda"],
  ["grupo", "Grupo"],
];
const HINT: Record<Ch, string> = {
  local: "só quem está no seu mapa · 1 msg/2s",
  privado: "só o destinatário · 1 msg/s",
  grito: "todos os mapas · Nv.5+ · 1 msg/30s",
  guilda: "só sua guilda",
  grupo: "só seu grupo",
};
// caixa pequena no canto esquerdo; pode ser minimizada. Só aparece depois de entrar no jogo.
export default function ChatDock() {
  const hidden = usePathname().startsWith("/characters");
  const [open, setOpen] = useState(true);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [t, setT] = useState("");
  const [to, setTo] = useState("");
  const [err, setErr] = useState("");
  const [ch, setCh] = useState<Ch>("local");
  const box = useRef<HTMLDivElement>(null);
  const toggle = (v: boolean) => {
    setOpen(v);
    try {
      localStorage.setItem("mv_chat_open", v ? "1" : "0");
    } catch {}
  };
  useEffect(() => {
    try {
      setOpen(localStorage.getItem("mv_chat_open") !== "0");
    } catch {}
    const h = () => setOpen(true);
    addEventListener("mv-chat-open", h);
    return () => removeEventListener("mv-chat-open", h);
  }, []);
  async function load() {
    try {
      const r = await fetch(`/api/chat?channel=${ch}`, { cache: "no-store" });
      if (r.ok) setMsgs(await r.json());
    } catch {}
  }
  // só consulta o servidor com o chat aberto e a aba visível, a cada 4s
  useEffect(() => {
    if (hidden || !open) return;
    setMsgs([]);
    setErr("");
    load();
    const i = setInterval(() => {
      if (!document.hidden) load();
    }, 4000);
    return () => clearInterval(i);
  }, [ch, hidden, open]);
  useEffect(() => {
    box.current?.scrollTo(0, 1e9);
  }, [msgs]);
  async function send() {
    const c = t.trim();
    if (!c) return;
    const r = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ content: c, channel: ch, to }),
    });
    const j = await r.json();
    if (r.ok) {
      setT("");
      setErr("");
      load();
    } else setErr(j.error ?? "Erro");
  }
  if (hidden) return null;
  if (!open)
    return (
      <button
        onClick={() => toggle(true)}
        className="fixed bottom-3 left-3 z-30 rounded-full border border-violet-700 bg-[#100d28]/95 px-4 py-2 text-sm shadow-lg transition-colors duration-300 hover:border-violet-400"
      >
        💬 Chat
      </button>
    );
  return (
    <div className="fixed bottom-3 left-3 z-30 w-[min(19rem,calc(100vw-1.5rem))] rounded-xl border border-violet-800 bg-[#100d28]/95 p-2 shadow-xl backdrop-blur">
      <div className="flex items-start gap-1">
        <div className="flex flex-1 flex-wrap gap-1">
          {TABS.map(([k, l]) => (
            <button
              key={k}
              onClick={() => setCh(k)}
              className={`rounded px-2 py-0.5 text-xs transition-colors duration-300 ${ch === k ? "bg-violet-600" : "border border-violet-800 hover:bg-violet-900/50"}`}
            >
              {l}
            </button>
          ))}
        </div>
        <button
          aria-label="Minimizar chat"
          title="Minimizar"
          onClick={() => toggle(false)}
          className="rounded px-2 text-violet-300 hover:text-white"
        >
          –
        </button>
      </div>
      <div className="mt-1 truncate text-[10px] text-violet-400">
        {HINT[ch]}
      </div>
      <div ref={box} className="h-36 overflow-auto text-xs">
        {msgs.map((m) => (
          <div key={m.id}>
            <b className={ch === "grito" ? "text-amber-300" : "text-cyan-300"}>
              {m.who}
              {m.to ? ` → ${m.to}` : ""}
            </b>
            : {m.text}
          </div>
        ))}
      </div>
      {err && <div className="text-xs text-rose-400">{err}</div>}
      <div className="mt-1 flex gap-1">
        {ch === "privado" && (
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Para quem?"
            className="w-20 rounded bg-[#0c0a1f] p-1.5 text-xs"
          />
        )}
        <input
          id="chat-input"
          value={t}
          onChange={(e) => setT(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Mensagem..."
          maxLength={200}
          className="w-full rounded bg-[#0c0a1f] p-1.5 text-xs"
        />
      </div>
    </div>
  );
}
