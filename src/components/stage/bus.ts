"use client";
import { useEffect, useRef, useState } from "react";

// Eventos de cena: o servidor já decidiu tudo; isto só descreve o que DESENHAR. Sem three.js aqui (módulo leve).
export type Who = "me" | "foe" | "summon";
export type StageEvent =
  | { k: "hit" | "crit"; from: Who; to: Who; d?: number; el?: string } // el: cor "#rrggbb" ou categoria do elemento
  | { k: "dodge"; from: Who; to: Who }
  | { k: "heal"; to: Who; d?: number }
  | { k: "skill"; from: Who; el?: string }
  | { k: "summon"; el?: string }
  | { k: "win" | "lose" | "flee" };

export type StageBus = { emit: (e: StageEvent) => void; on: (fn: (e: StageEvent) => void) => () => void };

export function createStageBus(): StageBus {
  const subs = new Set<(e: StageEvent) => void>();
  return {
    emit: (e) => subs.forEach((f) => f(e)),
    on: (fn) => {
      subs.add(fn);
      return () => void subs.delete(fn);
    },
  };
}
export const useStageBus = () => useState(createStageBus)[0];

// Dispara os eventos UMA vez quando `seq` muda (ex.: o número do turno que o servidor gravou). A carga inicial não repete animações.
export function useStageEvents(bus: StageBus, events: readonly StageEvent[] | undefined, seq: number | string) {
  const last = useRef<number | string | null>(null);
  useEffect(() => {
    if (last.current === null) {
      last.current = seq;
      return;
    }
    if (last.current === seq) return;
    last.current = seq;
    events?.forEach((e) => bus.emit(e));
  }, [bus, events, seq]);
}
