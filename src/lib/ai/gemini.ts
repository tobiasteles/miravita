import { GoogleGenAI } from "@google/genai";
// Chave SOMENTE no servidor (nunca em componente "use client" nem em NEXT_PUBLIC_*). Cliente criado sob demanda.
let ai: GoogleGenAI | null = null;
export const MODEL = process.env.GEMINI_MODEL ?? "gemini-3-flash-preview";
export async function genJson<T>(prompt: string): Promise<T> {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY não configurada");
  ai ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const r = await ai.models.generateContent({ model: MODEL, contents: prompt, config: { responseMimeType: "application/json", temperature: 0.9 } });
  return JSON.parse(r.text ?? "[]") as T;
}
