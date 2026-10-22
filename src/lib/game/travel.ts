// ───── VIAGEM entre mapas ─────
// estrada  = grátis, mas 35% de chance de EMBOSCADA (cai direto numa luta)
// escolta  = paga ouro aos guardas e viaja em segurança
// pedra    = gasta 1 Pedra de Teletransporte (instantâneo, sem risco)
// teleporte= classes mágicas (conjuradores e invocadores): instantâneo, sem custo e sem risco
export const ENCOUNTER_P = 0.35;
export const escortCost = (destMinLevel: number, playerLevel: number) => Math.round(60 + 10 * destMinLevel + 4 * playerLevel);
export type TravelMode = "estrada" | "escolta" | "pedra" | "teleporte";
