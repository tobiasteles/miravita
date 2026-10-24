import { LOADOUT_SIZE } from "./classdata";
// loadout sempre tem 4 posições; -1 = vazio  (fica fora de src/actions porque arquivos "use server" só exportam funções async)
export const loadout4 = (lo: number[] | undefined) => Array.from({ length: LOADOUT_SIZE }, (_, i) => lo?.[i] ?? -1);
