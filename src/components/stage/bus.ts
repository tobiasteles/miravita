"use client";
import { useEffect, useRef, useState } from "react";
import type { StageEvent } from "@/lib/game/fx-events";

// Eventos de cena: o servidor já decidiu tudo; isto só descreve o que DESENHAR. Sem three.js aqui (módulo leve).
export type { Who, StageEvent } from "@/lib/game/fx-events";

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

// Dispara os eventos do turno UMA vez quando `seq` muda (ex.: BState.fxSeq). Os eventos entram em fila, um a cada `gap` s,
// para o golpe do jogador e a resposta do inimigo não se atropelarem. A carga inicial não repete animações.
export function useStageEvents(bus: StageBus, events: readonly StageEvent[] | undefined, seq: number | string, gap = 0.45) {
  const last = useRef<number | string | null>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);
  useEffect(() => {
    if (last.current === null) {
      last.current = seq;
      return;
    }
    if (last.current === seq) return;
    last.current = seq;
    (events ?? []).forEach((e, i) => timers.current.push(window.setTimeout(() => bus.emit(e), i * gap * 1000)));
  }, [bus, events, seq, gap]);
}
