"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "./cx";

type Tone = "info" | "success" | "warn" | "error";
type Item = { id: number; tone: Tone; text: string };
type Push = (text: string, tone?: Tone) => void;

const tones: Record<Tone, string> = {
  info: "border-arcane/60",
  success: "border-vital/60",
  warn: "border-ember/60",
  error: "border-blood/70",
};
const Ctx = createContext<Push>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const seq = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setItems((l) => l.filter((x) => x.id !== id));
  }, []);
  const push = useCallback<Push>((text, tone = "info") => {
    const id = ++seq.current;
    setItems((l) => [...l.slice(-3), { id, tone, text }]);
    timers.current.set(id, setTimeout(() => dismiss(id), tone === "error" ? 6000 : 3500));
  }, [dismiss]);
  useEffect(() => {
    const m = timers.current;
    return () => { m.forEach((t) => clearTimeout(t)); m.clear(); };
  }, []);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-3">
        {items.map((t) => (
          <div key={t.id} role="status" className={cx("anim-toast pointer-events-auto flex max-w-md items-start gap-3 rounded-panel border bg-surface-2 px-3 py-2 text-sm shadow-panel", tones[t.tone])}>
            <span className="flex-1">{t.text}</span>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Fechar aviso" className="text-ink-dim hover:text-ink focus-visible:outline-2 focus-visible:outline-aether">✕</button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
