// loja de armas e armaduras: o item só é vendido a partir de certo nível (pela raridade) e custa o dobro do valor calculado
export const GATE = { comum: 1, raro: 30, epico: 80, lendario: 140 } as const;
export const gearPrice = (value: number) => value * 2;

// reagentes = elementos comuns, baratos (Conveniência)
export const reagentPrice = (value: number) => Math.max(8, Math.round(value * 0.6));
