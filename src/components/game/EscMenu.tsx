"use client";
import { useEffect, useState } from "react"; import { useRouter } from "next/navigation"; import { useClerk } from "@clerk/nextjs";
type View = null | "menu" | "settings";
export default function EscMenu() {
  const [v, setV] = useState<View>(null); const r = useRouter(); const { signOut } = useClerk();
  const [s, setS] = useState({ sound: 70, graphics: "alta", notifications: true });
  useEffect(() => { try { const x = localStorage.getItem("mv_settings"); if (x) setS(JSON.parse(x)); } catch {} }, []);
  useEffect(() => { try { localStorage.setItem("mv_settings", JSON.stringify(s)); } catch {} }, [s]);
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === "Escape") setV((x) => (x ? null : "menu")); }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, []);
  const btn = "block w-full rounded bg-violet-600 p-2 font-semibold";
  return <>
    <button onClick={() => setV("menu")} aria-label="Menu" className="fixed right-3 top-3 z-40 rounded border border-violet-800 bg-[#171433] px-3 py-1">☰ ESC</button>
    {v && <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={(e) => e.target === e.currentTarget && setV(null)}>
      <div role="dialog" aria-modal className="w-full max-w-sm space-y-2 rounded-xl border border-violet-600 bg-[#171433] p-4">
        {v === "menu" ? <><h2 className="text-lg font-bold">Pausa</h2>
          <button className={btn} onClick={() => setV("settings")}>⚙️ Configurações</button>
          <button className={btn} onClick={() => { setV(null); r.push("/characters"); }}>👥 Seleção de personagem</button>
          <button className={btn + " !bg-rose-600"} onClick={() => signOut({ redirectUrl: "/" })}>🚪 Desconectar</button>
          <button className="w-full rounded border border-violet-800 p-2" onClick={() => setV(null)}>Voltar (ESC)</button></>
        : <><h2 className="text-lg font-bold">Configurações</h2>
          <label className="block">Som {s.sound}<input type="range" className="w-full" value={s.sound} onChange={(e) => setS({ ...s, sound: +e.target.value })} /></label>
          <label className="block">Gráficos<select className="w-full rounded bg-[#0c0a1f] p-2" value={s.graphics} onChange={(e) => setS({ ...s, graphics: e.target.value })}><option>baixa</option><option>alta</option></select></label>
          <label className="block"><input type="checkbox" checked={s.notifications} onChange={(e) => setS({ ...s, notifications: e.target.checked })} /> Notificações</label>
          <button className={btn} onClick={() => setV("menu")}>Voltar</button></>}
      </div></div>}
  </>;
}
