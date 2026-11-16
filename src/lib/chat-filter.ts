// Filtro simples do chat: palavrões, links e telefones/contatos (importante se houver menores jogando).
// Não é perfeito; a denúncia (/admin/denuncias) cobre o que passar.
const BAD = ["porra", "caralho", "puta", "putaria", "merda", "foda", "fodase", "foder", "fdp", "viado", "buceta", "arrombado", "cuzao", "punheta", "otario", "retardado", "vagabunda", "vagabundo", "desgraca", "nazista"];
const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s" };
const norm = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[013457@$]/g, (c) => LEET[c] ?? c);
export function chatProblem(text: string): string | null {
  if (/https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|br|io|gg|me|ly)\b/i.test(text)) return "Links não são permitidos no chat.";
  if (/(\d[\s.\-()]*){8,}/.test(text) || /\b(zap|whats|whatsapp|insta|instagram|discord|telegram)\b/i.test(norm(text).replace(/[^a-z ]/g, " "))) return "Não compartilhe contatos pessoais no chat.";
  const words = norm(text).split(/[^a-z]+/).filter(Boolean);
  for (const w of words) {
    const c = w.replace(/(.)\1{2,}/g, "$1"); // "putaaa" → "puta"
    for (const b of BAD) if (w === b || c === b || (b.length >= 5 && (w.startsWith(b) || c.startsWith(b)))) return "Mensagem bloqueada pelo filtro do chat.";
  }
  return null;
}
