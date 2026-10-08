#!/usr/bin/env python3
"""Aplica as pequenas edições em arquivos que já existem no seu projeto. Rode na raiz do projeto:  python patch-edicoes.py
Cada edição mostra OK, JÁ ESTAVA ou FALHOU (se FALHOU, o arquivo difere do esperado: me mande o trecho)."""
import json, re, pathlib
def edit(path, old, new, regex=False, before=False):
    f = pathlib.Path(path)
    if not f.exists(): return print("FALHOU (arquivo não existe):", path)
    s = f.read_text(encoding="utf-8")
    if new in s: return print("JÁ ESTAVA:", path, "-", new[:50].replace("\n", " "))
    if regex:
        s2, n = re.subn(old, (lambda m: new + m.group(0)) if before else (lambda m: new), s, count=1, flags=re.S)
        if not n: return print("FALHOU:", path, "-", old[:50])
    else:
        if old not in s: return print("FALHOU:", path, "-", old[:50])
        s2 = s.replace(old, new, 1)
    f.write_text(s2, encoding="utf-8"); print("OK:", path)

# 1) batalha: poções passam a sair do estoque (Loja de Conveniência)
B = "src/lib/game/battle.ts"
edit(B, '{ a: "potion" }', '{ a: "potion"; k: "hp" | "ea" }')
edit(B, r'\} else if \(act\.a === "potion"\) \{.*?\n  \} else if \(act\.a === "domain"\)',
     '} else if (act.a === "potion") {\n    if (act.k === "ea") { p.mp = Math.min(q.mp, p.mp + Math.round(q.mp * .4)); L(b, "Poção de EA: +40% EA."); }\n    else { p.hp = Math.min(q.hp, p.hp + Math.round(q.hp * .4)); L(b, "Poção de HP: +40% HP."); }\n  } else if (act.a === "domain")', regex=True)
A = "src/actions/battle.ts"
edit(A, 'import { redirect } from "next/navigation";', 'import { redirect } from "next/navigation"; import { CONS, stack } from "@/lib/consumables";')
edit(A, r"const before = b\.over", """if (act.a === "potion") { // gasta 1 poção do estoque; sem estoque, avisa e não perde o turno
      const nm = act.k === "ea" ? CONS.ea.name : CONS.hp.name, { row } = await stack(cid, nm);
      if (!row || row.quantity < 1) { b.log.push(`Você não tem ${nm}. Compre na Loja de Conveniência.`); await db.update(battles).set({ state: b }).where(eq(battles.characterId, cid)); return; }
      await db.update(inventory).set({ quantity: row.quantity - 1 }).where(eq(inventory.id, row.id));
    }
    """, regex=True, before=True)
S = "src/components/game/BattleScreen.tsx"
edit(S, "cost: number; dom?:", "cost: number; pots: { hp: number; ea: number }; dom?:")
edit(S, 'useState<"main" | "sk" | "sm" | "tm">("main")', 'useState<"main" | "sk" | "sm" | "tm" | "it">("main")')
edit(S, 'onClick={() => act({ a: "potion" })}>ITEM ({p.cost}g)</button>', 'onClick={() => setMenu("it")}>ITEM</button>')
edit(S, ': menu === "sm" ? <>', ': menu === "it" ? <>{([["hp", "Poção de HP"], ["ea", "Poção de EA"]] as const).map(([k, n]) => <button key={k} disabled={pend || !p.pots[k]} className={m} onClick={() => act({ a: "potion", k })}>{n} ×{p.pots[k]}</button>)}<button className={m} onClick={() => setMenu("main")}>← VOLTAR</button></>\n        : menu === "sm" ? <>')
G = "src/app/(game)/battle/page.tsx"
edit(G, r"return <BattleScreen", "const [ph, pe] = await Promise.all([stack(a.c.id, CONS.hp.name), stack(a.c.id, CONS.ea.name)]);\n  ", regex=True, before=True)
edit(G, "cost: 30 + P.c.level * 5,", "cost: 0, pots: { hp: ph.row?.quantity ?? 0, ea: pe.row?.quantity ?? 0 },")
edit(G, 'import { redirect } from "next/navigation";', 'import { redirect } from "next/navigation"; import { CONS, stack } from "@/lib/consumables";')
# 2) tecla C abre o chat se estiver minimizado
edit("src/components/game/Hotkeys.tsx", 'const chat = () => document.getElementById("chat-input")?.focus();',
     'const chat = () => { dispatchEvent(new Event("mv-chat-open")); setTimeout(() => document.getElementById("chat-input")?.focus(), 60); };')
# 3) menos espaço em branco no fim das páginas (o chat agora é uma caixa pequena)
edit("src/app/layout.tsx", 'className="min-h-screen pb-52"', 'className="min-h-screen pb-6"')
# 4) scripts do package.json (manifesto de imagens roda sozinho no dev e no build)
p = pathlib.Path("package.json"); d = json.loads(p.read_text(encoding="utf-8")); sc = d.setdefault("scripts", {})
if sc.get("predev") == "node scripts/image-manifest.mjs": print("JÁ ESTAVA: package.json")
else:
    sc.update({"predev": "node scripts/image-manifest.mjs", "prebuild": "node scripts/image-manifest.mjs", "imagens": "node scripts/image-manifest.mjs"})
    p.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"); print("OK: package.json")
