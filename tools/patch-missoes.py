#!/usr/bin/env python3
"""Liga o progresso das missões (história e diárias) às batalhas. Rode na raiz do projeto:  python patch-missoes.py
Cada edição mostra OK, JÁ ESTAVA ou FALHOU (se FALHOU, me mande o trecho do arquivo)."""
import re, pathlib
def edit(path, pattern, new, mode="replace"):
    f = pathlib.Path(path)
    if not f.exists(): return print("FALHOU (arquivo não existe):", path)
    s = f.read_text(encoding="utf-8")
    if new.strip() in s: return print("JÁ ESTAVA:", path, "-", new.strip()[:55].replace("\n", " "))
    fn = {"replace": lambda m: new, "before": lambda m: new + m.group(0), "after": lambda m: m.group(0) + new}[mode]
    s2, n = re.subn(pattern, fn, s, count=1, flags=re.S)
    if not n: return print("FALHOU:", path, "-", pattern[:55])
    f.write_text(s2, encoding="utf-8"); print("OK:", path)
A = "src/actions/battle.ts"
edit(A, r'import \{ redirect \} from "next/navigation";', ' import { track } from "@/lib/rewards";', "after")
edit(A, r"async function addMat\(cid: string, z: number, n: number\) \{", '\n  await track(cid, "gather", "", n); // diária: coleta', "after")
edit(A, r"for \(const k of KILL\.filter\(\(k\) => k\.slug === b\.mapSlug\)\)", 'await track(cid, "kill", b.mapSlug); // capítulos e diária: caçada\n      ', "before")
edit(A, r'if \(b\.over === "win" && b\.dungeon\) \{', ' await track(cid, "portal", b.mapSlug);', "after")
