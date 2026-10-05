import { ImageResponse } from "next/og"; import { EMBLEM } from "@/lib/brand";
export const size = { width: 1200, height: 630 }; export const contentType = "image/png"; export const alt = "Miravita — Desperte o seu poder";
export default function Og() {
  const src = `data:image/svg+xml;utf8,${encodeURIComponent(EMBLEM.replace("<svg ", '<svg width="280" height="280" '))}`;
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 48, background: "linear-gradient(135deg,#0c0a1f,#2a1a6b)", color: "#fff" }}><img src={src} width={280} height={280} /><div style={{ display: "flex", flexDirection: "column" }}><div style={{ fontSize: 110, fontWeight: 800, letterSpacing: 18 }}>MIRAVITA</div><div style={{ fontSize: 32, color: "#a5b4fc", letterSpacing: 8 }}>DESPERTE O SEU PODER</div></div></div>, size);
}
