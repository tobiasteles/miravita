"use client";
import { useEffect, useState } from "react";

// tela de entrada da luta: ⚔ CAÇADA (vermelha, rápida) ou 🏰 REINO (roxa/dourada, mais longa). Clique para pular.
export default function BattleIntro({
  realm,
  title,
  tagline,
  foe,
}: {
  realm: boolean;
  title: string;
  tagline: string;
  foe: string;
}) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setOn(false), realm ? 2600 : 1700);
    return () => clearTimeout(t);
  }, [realm]);
  if (!on) return null;
  return (
    <div
      className={`battle-intro ${realm ? "battle-intro-realm" : ""}`}
      onClick={() => setOn(false)}
      role="status"
    >
      <div>
        <div className="bi-ico">{realm ? "🏰" : "⚔️"}</div>
        <div className="bi-kicker">
          {realm ? "VOCÊ ENTROU NO REINO" : "CAÇADA"}
        </div>
        <div className="bi-title">{title}</div>
        <div className="bi-sub">{tagline}</div>
        <div className="bi-foe">{foe}</div>
      </div>
    </div>
  );
}
