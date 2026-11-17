// junta classes ignorando valores falsos
export const cx = (...a: Array<string | false | null | undefined>) => a.filter(Boolean).join(" ");
