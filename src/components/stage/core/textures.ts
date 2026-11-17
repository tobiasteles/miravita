"use client";
import { useEffect, useState } from "react";
import { LinearFilter, SRGBColorSpace, TextureLoader } from "three";
import type { Texture } from "three";

// Texturas só do próprio domínio (public/). Recebe a lista de `variants()` e usa a primeira que carregar.
// Cache por lista, com contagem de uso; descarta da GPU 3 s depois que ninguém usa.
type Ent = { tex: Texture | null; p: Promise<Texture | null>; n: number };
const cache = new Map<string, Ent>();
let loader: TextureLoader | null = null;

function load(urls: readonly string[]): Promise<Texture | null> {
  loader ??= new TextureLoader();
  const l = loader;
  const one = (i: number): Promise<Texture | null> =>
    i >= urls.length ? Promise.resolve(null) : new Promise<Texture | null>((res) => l.load(urls[i], (t) => res(t), undefined, () => res(null))).then((t) => t ?? one(i + 1));
  return one(0);
}
export function useTex(urls: readonly string[]): Texture | null {
  const key = urls.join("|");
  const [tex, setTex] = useState<Texture | null>(() => cache.get(key)?.tex ?? null);
  useEffect(() => {
    if (!key) { setTex(null); return; }
    let ent = cache.get(key);
    if (!ent) {
      const e: Ent = { tex: null, n: 0, p: load(urls) };
      e.p = e.p.then((t) => {
        if (t) { t.colorSpace = SRGBColorSpace; t.generateMipmaps = false; t.minFilter = LinearFilter; t.magFilter = LinearFilter; }
        e.tex = t;
        return t;
      });
      cache.set(key, e);
      ent = e;
    }
    const cur = ent;
    cur.n++;
    let alive = true;
    void cur.p.then((t) => { if (alive) setTex(t); });
    return () => {
      alive = false;
      cur.n--;
      setTimeout(() => { if (cur.n <= 0 && cache.get(key) === cur) { cur.tex?.dispose(); cache.delete(key); } }, 3000);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return tex;
}
