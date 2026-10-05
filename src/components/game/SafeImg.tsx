"use client";
import { useEffect, useRef, useState } from "react";
import { variants } from "@/lib/img";
// imagem com fallback: tenta .png, .jpg, .jpeg e .webp; se nenhuma existir, mostra o `fallback`
export default function SafeImg({ src, alt = "", className = "", fallback = null }: { src: string; alt?: string; className?: string; fallback?: React.ReactNode }) {
  const list = variants(src.replace(/\.(png|jpe?g|webp)$/i, "")); const [i, setI] = useState(0); const ref = useRef<HTMLImageElement>(null);
  useEffect(() => { setI(0); }, [src]);
  useEffect(() => { const el = ref.current; if (el && el.complete && el.naturalWidth === 0) setI((x) => x + 1); }, [i, src]);
  return i >= list.length ? <>{fallback}</> : <img key={list[i]} ref={ref} src={list[i]} alt={alt} onError={() => setI((x) => x + 1)} className={className} />;
}
