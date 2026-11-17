// Efeitos sonoros sintetizados (WebAudio): sem arquivos, sem CDN, compatíveis com a CSP.
// Usam o mesmo volume do MusicPlayer (mv_settings.sound, 0–100); volume 0 = mudo.
export type Sfx = "hit" | "crit" | "hurt" | "heal" | "tick";
let ctx: AudioContext | null = null;
const volume = () => {
  try {
    return Number(JSON.parse(localStorage.getItem("mv_settings") ?? "{}").sound ?? 70) / 100;
  } catch {
    return 0.7;
  }
};
function tone(c: AudioContext, at: number, f0: number, f1: number, dur: number, type: OscillatorType, gain: number) {
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, at);
  o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), at + dur);
  g.gain.setValueAtTime(gain, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(c.destination);
  o.start(at);
  o.stop(at + dur + 0.02);
}
export function sfx(n: Sfx) {
  const v = Math.max(0, Math.min(1, volume())) * 0.2;
  if (v <= 0 || typeof window === "undefined") return;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === "suspended") void ctx.resume();
    const t = ctx.currentTime;
    if (n === "hit") tone(ctx, t, 320, 90, 0.12, "square", v);
    else if (n === "crit") { tone(ctx, t, 540, 160, 0.2, "sawtooth", v); tone(ctx, t + 0.03, 900, 450, 0.14, "triangle", v * 0.8); }
    else if (n === "hurt") tone(ctx, t, 170, 55, 0.22, "sawtooth", v);
    else if (n === "heal") { tone(ctx, t, 520, 520, 0.12, "sine", v); tone(ctx, t + 0.1, 780, 780, 0.16, "sine", v); }
    else tone(ctx, t, 700, 700, 0.035, "square", v * 0.4);
  } catch {}
}
