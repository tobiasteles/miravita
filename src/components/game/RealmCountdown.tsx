"use client";
import { useEffect, useState } from "react";

function fmt(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000)),
    h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    r = s % 60;
  return h > 0 ? `${h}h ${m}min` : m > 0 ? `${m}min ${r}s` : `${r}s`;
}
// `target` é um instante ISO (quando abre, ou quando fecha); `label` é o texto antes do relógio
export default function RealmCountdown({
  target,
  label,
}: {
  target: string;
  label: string;
}) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (now === null) return <span className="text-violet-400">{label}…</span>; // evita diferença entre servidor e cliente no 1º render
  return (
    <span className="text-violet-200">
      {label} {fmt(Date.parse(target) - now)}
    </span>
  );
}
