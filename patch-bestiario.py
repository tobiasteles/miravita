#!/usr/bin/env python3
"""Liga o bestiário (120 monstros + sub-chefes e chefes de Portal) às batalhas. Rode na raiz do projeto:  python patch-bestiario.py
Mostra OK, JÁ ESTAVA ou FALHOU para cada edição (se FALHOU, me mande o trecho do arquivo)."""
import re, pathlib
def edit(path, pattern, new, mode="replace"):
    f = pathlib.Path(path)
    if not f.exists(): return print("FALHOU (arquivo não existe):", path)
    s = f.read_text(encoding="utf-8")
    if new.strip() in s: return print("JÁ ESTAVA:", path, "-", new.strip()[:55].replace("\n", " "))
    fn = {"replace": lambda m: new, "before": lambda m: new + m.group(0), "after": lambda m: m.group(0) + new}[mode]
    s2, n = re.subn(pattern, fn, s, count=1, flags=re.S)
    if not n: return print("FALHOU:", path, "-", pattern[:60])
    f.write_text(s2, encoding="utf-8"); print("OK:", path)
A = "src/actions/battle.ts"
edit(A, r'import \{ redirect \} from "next/navigation";', ' import { spawnFor, mkMonster } from "@/lib/game/bestiary";', "after")
edit(A, r"async function spawn\(.*?\n\}\n", '''async function spawn(slug: string, pl: number, kind: "mon" | "sub" | "boss") { // 30% de chance de usar um monstro criado pela IA (só entre os comuns)
  if (kind === "mon") { const rows = await db.select().from(aiMonsters).where(eq(aiMonsters.mapSlug, slug)).limit(30); if (rows.length && Math.random() < .3) { const r = pk(rows); return withArch(mkMonster(r.name, spawnFor(slug, pl, "mon").L, "mon"), r.archetype); } }
  return spawnFor(slug, pl, kind);
}
''')
edit(A, r'const w = WORLD\[a\.map\.slug\].*?: \[await sp\(false\)\];', '''const slug = a.map.slug, lvl = a.c.level, dungeon = fd.get("kind") === "dungeon", sp = (k: "mon" | "sub" | "boss") => spawn(slug, lvl, k);
  const [e, ...q] = dungeon ? [await sp("mon"), await sp("sub"), await sp("mon"), await sp("boss")] : [await sp("mon")]; // Portal: monstro, sub-chefe, monstro, chefe''')
