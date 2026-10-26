#!/usr/bin/env python3
"""Ícones de itens em pixel art (32x32) para a grande atualização — sem IA, sem gastar créditos.
Gera em public/items/ o que ainda NÃO existe (não sobrescreve nada, a não ser com --tudo):
  • mat-, blade-, armor-, helm-, boots-, gauntlets-  <símbolo>   → os 104 elementos novos (tabela periódica completa)
  • grimorio-, orbe-, cajado-  <símbolo>                         → armas mágicas (Conveniência), para os 118 elementos
  • traje-<classe>-<1..6>                                        → Trajes de Batalha das 7 classes mágicas
Uso (na raiz do projeto):  python tools/gerar-itens-pixel-v2.py [--tudo] [--previa]      (precisa de: pip install pillow)
Lê tools/elementos.json (símbolo, categoria e raridade de cada elemento, exportados do próprio jogo)."""
import colorsys, json, math, sys, pathlib
from PIL import Image, ImageDraw
RAIZ = pathlib.Path(__file__).resolve().parent.parent
OUT = RAIZ / "public" / "items"
OUTLINE = (26, 16, 51, 255)
RAR = {"comum": (154, 150, 200), "raro": (34, 211, 238), "epico": (192, 132, 252), "lendario": (251, 191, 36)}
GOLD = (251, 191, 36, 255); WOOD = (139, 94, 60, 255)
EL = json.loads((pathlib.Path(__file__).resolve().parent / "elementos.json").read_text(encoding="utf-8"))

# cor de cada elemento: as 14 originais ficam como estavam; famosos têm cor própria; o resto vem da categoria (com variação por número atômico)
ORIG = {"h": "#7dd3fc", "c": "#3f3f46", "al": "#d4d4d8", "fe": "#6b7280", "cu": "#c2703d", "ti": "#8aa0b8", "pb": "#64748b", "ag": "#e5e7eb", "au": "#fbbf24", "pt": "#e2e8f0", "os": "#5b7bb5", "ir": "#c4b5fd", "u": "#84cc16", "pu": "#f43f5e"}
FAMOSOS = {"he": "#fde68a", "li": "#d6d3d1", "be": "#a3e635", "b": "#92400e", "n": "#93c5fd", "o": "#60a5fa", "f": "#bef264", "ne": "#fb923c", "na": "#fcd34d", "mg": "#e2e8f0", "si": "#94a3b8",
           "p": "#fca5a5", "s": "#facc15", "cl": "#4ade80", "ar": "#c084fc", "k": "#c4b5fd", "ca": "#f5f5f4", "cr": "#a5b4fc", "mn": "#f9a8d4", "co": "#3b82f6", "ni": "#a8b5a0", "zn": "#9db4c8",
           "ga": "#bae6fd", "ge": "#9ca3af", "as": "#78716c", "se": "#dc2626", "br": "#b91c1c", "kr": "#e9d5ff", "rb": "#f0abfc", "sr": "#fde047", "zr": "#cbd5e1", "mo": "#94a3b8", "sn": "#d1d5db",
           "sb": "#a1a1aa", "te": "#a8a29e", "i": "#6d28d9", "xe": "#818cf8", "cs": "#fcd34d", "ba": "#a3e635", "w": "#4b5563", "re": "#9ca3af", "hg": "#cbd5e1", "tl": "#94a3b8", "bi": "#f0abfc",
           "po": "#fb7185", "rn": "#a5f3fc", "ra": "#4ade80", "th": "#a3a3a3", "am": "#fb7185", "og": "#e879f9", "ts": "#c084fc"}
CATCOR = {"metal alcalino": "#e5e7eb", "metal alcalino-terroso": "#d9f99d", "metal de transição": "#94a3b8", "metal pós-transição": "#a8a29e", "metaloide": "#a5b4fc", "não-metal": "#86efac",
          "halogênio": "#bef264", "gás nobre": "#c4b5fd", "lantanídeo": "#f9a8d4", "actinídeo": "#86efac", "transactinídeo": "#e879f9"}
def rgb(h): h = h.lstrip("#"); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
def cor(e):
    s = e["s"]
    if s in ORIG: return ORIG[s]
    if s in FAMOSOS: return FAMOSOS[s]
    r, g, b = [v / 255 for v in rgb(CATCOR.get(e["c"], "#94a3b8"))]; h, l, sa = colorsys.rgb_to_hls(r, g, b)
    h = (h + ((e["z"] * 37) % 70 - 35) / 360) % 1; l = min(.85, max(.35, l + ((e["z"] * 13) % 20 - 10) / 100))
    return "#%02x%02x%02x" % tuple(int(v * 255) for v in colorsys.hls_to_rgb(h, l, min(1, sa + .15)))
def sh(c, f): return tuple(max(0, min(255, int(v * f if f < 1 else v + (255 - v) * (f - 1)))) for v in c[:3]) + (255,)  # f<1 escurece, f>1 clareia
def novo(): im = Image.new("RGBA", (32, 32), (0, 0, 0, 0)); return im, ImageDraw.Draw(im)
def brilho(im, d, rar):
    c = RAR[rar]; d.ellipse((6, 27, 25, 31), fill=c + (110,))
    for (x, y) in [(27, 4)] + ([(4, 5)] if rar in ("epico", "lendario") else []) + ([(28, 24)] if rar == "lendario" else []):
        for dx, dy in [(0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)]: d.point((x + dx, y + dy), fill=c + (255,))
def grossa(d, a, b, w, fill):
    dx, dy = b[0] - a[0], b[1] - a[1]; n = math.hypot(dx, dy) or 1; px, py = -dy / n * w / 2, dx / n * w / 2
    d.polygon([(a[0] + px, a[1] + py), (b[0] + px, b[1] + py), (b[0] - px, b[1] - py), (a[0] - px, a[1] - py)], fill=fill)
# ─── materiais (formas por categoria) ───
def lingote(d, c):
    d.polygon([(4, 16), (9, 11), (27, 11), (22, 16)], fill=sh(c, 1.35), outline=OUTLINE); d.rectangle((4, 16, 22, 25), fill=sh(c, 1), outline=OUTLINE)
    d.polygon([(22, 16), (27, 11), (27, 20), (22, 25)], fill=sh(c, .65), outline=OUTLINE); d.line((6, 18, 12, 18), fill=sh(c, 1.7)); d.line((11, 13, 20, 13), fill=sh(c, 1.7))
def frasco(d, c):
    d.rectangle((13, 5, 18, 7), fill=WOOD, outline=OUTLINE); d.rectangle((13, 8, 18, 12), fill=(190, 230, 250, 200), outline=OUTLINE)
    d.polygon([(10, 14), (21, 14), (24, 25), (7, 25)], fill=(190, 230, 250, 200), outline=OUTLINE); d.polygon([(11, 18), (20, 18), (22, 24), (9, 24)], fill=sh(c, 1))
    d.line((12, 15, 12, 17), fill=(255, 255, 255, 255))
def cristal(d, c):  # metaloides: aglomerado de cristais
    for (x, y, w, h, k) in [(7, 12, 7, 13, .9), (13, 6, 8, 19, 1.1), (20, 11, 6, 14, .8)]:
        d.polygon([(x, y + h), (x, y + 4), (x + w / 2, y), (x + w, y + 4), (x + w, y + h)], fill=sh(c, k), outline=OUTLINE); d.line((x + 2, y + 5, x + 2, y + h - 2), fill=sh(c, 1.7))
def po(d, c):  # não-metais sólidos: montinho de pó/pedra
    d.polygon([(4, 25), (8, 17), (14, 12), (19, 12), (25, 17), (28, 25)], fill=sh(c, 1), outline=OUTLINE); d.polygon([(9, 17), (14, 13), (17, 14), (12, 19)], fill=sh(c, 1.5))
    for p in [(10, 22), (16, 20), (21, 23), (13, 24), (23, 19)]: d.point(p, fill=sh(c, .6)); d.point((p[0] + 1, p[1]), fill=sh(c, 1.6))
def pedaco(d, c):  # actinídeos (brilham)
    d.polygon([(5, 19), (8, 10), (15, 6), (24, 9), (27, 18), (21, 25), (10, 24)], fill=sh(c, .9), outline=OUTLINE); d.polygon([(9, 11), (15, 7), (17, 12), (11, 15)], fill=sh(c, 1.5))
    for p in [(13, 18), (19, 14), (21, 20), (10, 21)]: d.rectangle((p[0], p[1], p[0] + 1, p[1] + 1), fill=(220, 255, 120, 255))
def nucleo(d, c):  # sintéticos superpesados
    d.ellipse((7, 7, 25, 25), fill=sh(c, .6), outline=OUTLINE); d.ellipse((11, 11, 21, 21), fill=sh(c, 1), outline=OUTLINE); d.ellipse((14, 14, 18, 18), fill=(255, 230, 120, 255))
    d.arc((4, 12, 28, 20), 0, 360, fill=sh(c, 1.5)); d.arc((12, 4, 20, 28), 0, 360, fill=sh(c, 1.5))
FORMA = {"metaloide": cristal, "não-metal": po, "halogênio": frasco, "gás nobre": frasco, "actinídeo": pedaco, "transactinídeo": nucleo}
def material(e, c):
    im, d = novo(); FORMA.get(e["c"], lingote)(d, rgb(c)); return im, d
# ─── equipamentos (idênticos aos do gerador original) ───
def lamina(c):
    im, d = novo(); c = rgb(c)
    grossa(d, (11, 21), (27, 5), 5, OUTLINE); grossa(d, (11, 21), (26, 6), 3, sh(c, 1)); grossa(d, (12, 20), (25, 7), 1, sh(c, 1.6))
    grossa(d, (7, 18), (14, 25), 4, OUTLINE); grossa(d, (7, 18), (14, 25), 2, GOLD)
    grossa(d, (4, 28), (10, 22), 4, OUTLINE); grossa(d, (5, 27), (10, 22), 2, WOOD); d.rectangle((3, 28, 5, 30), fill=GOLD, outline=OUTLINE); return im, d
def armadura(c):
    im, d = novo(); c = rgb(c)
    d.polygon([(5, 9), (12, 6), (20, 6), (27, 9), (28, 15), (24, 16), (23, 27), (9, 27), (8, 16), (4, 15)], fill=sh(c, 1), outline=OUTLINE)
    d.polygon([(12, 6), (16, 11), (20, 6)], fill=OUTLINE); d.line((16, 12, 16, 26), fill=sh(c, 1.5)); d.rectangle((9, 21, 22, 23), fill=sh(c, .6)); d.polygon([(5, 10), (11, 8), (9, 14), (5, 14)], fill=sh(c, 1.3)); d.polygon([(27, 10), (21, 8), (23, 14), (27, 14)], fill=sh(c, 1.3)); return im, d
def elmo(c):
    im, d = novo(); c = rgb(c)
    d.polygon([(9, 15), (10, 9), (16, 5), (22, 9), (23, 15), (23, 19), (9, 19)], fill=sh(c, 1), outline=OUTLINE)
    d.polygon([(10, 9), (16, 6), (16, 14), (10, 15)], fill=sh(c, 1.4))
    d.rectangle((9, 19, 23, 21), fill=sh(c, .7), outline=OUTLINE); d.rectangle((13, 15, 19, 18), fill=(23, 20, 51, 230))
    d.line((16, 5, 16, 3), fill=sh(c, 1.5)); d.polygon([(14, 3), (18, 3), (16, 0)], fill=GOLD, outline=OUTLINE); return im, d
def botas(c):
    im, d = novo(); c = rgb(c)
    for dx in (0, 11):
        d.polygon([(7 + dx, 6), (13 + dx, 6), (13 + dx, 20), (16 + dx, 24), (16 + dx, 27), (5 + dx, 27), (5 + dx, 21), (7 + dx, 20)], fill=sh(c, 1), outline=OUTLINE)
        d.rectangle((5 + dx, 24, 16 + dx, 27), fill=sh(c, .6), outline=OUTLINE); d.line((7 + dx, 9, 13 + dx, 9), fill=sh(c, 1.6)); d.line((7 + dx, 13, 13 + dx, 13), fill=sh(c, 1.6))
    return im, d
def manoplas(c):
    im, d = novo(); c = rgb(c)
    for dx in (0, 15):
        d.polygon([(4 + dx, 14), (12 + dx, 11), (14 + dx, 16), (13 + dx, 26), (5 + dx, 27), (3 + dx, 19)], fill=sh(c, 1), outline=OUTLINE)
        for k in range(3): d.line((5 + dx + k * 3, 16, 5 + dx + k * 3, 24), fill=sh(c, .6))
        d.polygon([(9 + dx, 9), (13 + dx, 11), (10 + dx, 14), (7 + dx, 12)], fill=sh(c, 1.4), outline=OUTLINE)
    return im, d
# ─── ARMAS MÁGICAS ───
def grimorio(c):
    im, d = novo(); c = rgb(c)
    d.rectangle((9, 7, 25, 27), fill=(238, 228, 196, 255), outline=OUTLINE)                       # páginas
    d.rectangle((6, 5, 22, 25), fill=sh(c, .8), outline=OUTLINE); d.rectangle((6, 5, 10, 25), fill=sh(c, .5), outline=OUTLINE)  # capa e lombada
    for y in (9, 13, 17, 21): d.line((6, y, 10, y), fill=GOLD)                                    # costuras
    d.line((12, 8, 20, 8), fill=sh(c, 1.5)); d.line((12, 22, 20, 22), fill=sh(c, 1.5))
    d.ellipse((12, 11, 20, 19), fill=GOLD, outline=OUTLINE); d.ellipse((14, 13, 18, 17), fill=sh(c, 1.5), outline=OUTLINE); d.point((14, 13), fill=(255, 255, 255, 255))
    d.polygon([(20, 5), (22, 5), (22, 9)], fill=GOLD); return im, d
def orbe(c):
    im, d = novo(); c = rgb(c)
    d.polygon([(9, 25), (23, 25), (21, 28), (11, 28)], fill=GOLD, outline=OUTLINE); d.rectangle((11, 23, 21, 25), fill=sh((251, 191, 36), .7), outline=OUTLINE)
    d.ellipse((5, 3, 27, 25), fill=sh(c, .55), outline=OUTLINE); d.ellipse((7, 5, 25, 22), fill=sh(c, 1))
    d.arc((9, 9, 23, 21), 20, 200, fill=sh(c, 1.5)); d.arc((11, 7, 21, 17), 200, 360, fill=sh(c, .7))
    d.ellipse((9, 6, 14, 11), fill=sh(c, 1.9)); d.point((10, 7), fill=(255, 255, 255, 255)); d.point((22, 18), fill=sh(c, 1.7)); return im, d
def cajado(c):
    im, d = novo(); c = rgb(c)
    grossa(d, (5, 29), (20, 12), 4, OUTLINE); grossa(d, (5, 29), (20, 12), 2, WOOD); d.line((7, 26, 9, 28), fill=GOLD); d.line((11, 21, 13, 23), fill=GOLD)   # haste
    grossa(d, (17, 15), (22, 11), 4, OUTLINE); grossa(d, (17, 15), (22, 11), 2, GOLD)                                                                  # engaste
    d.arc((16, 2, 30, 16), 90, 270, fill=OUTLINE); d.arc((20, 6, 30, 14), 0, 360, fill=OUTLINE)
    d.ellipse((20, 3, 29, 12), fill=sh(c, 1), outline=OUTLINE); d.ellipse((22, 5, 25, 8), fill=sh(c, 1.9)); d.point((22, 5), fill=(255, 255, 255, 255)); return im, d
# ─── TRAJES DE BATALHA: 6 níveis por classe (mais enfeites a cada nível) ───
CLASSES = {"portugues": "#a78bfa", "ingles": "#60a5fa", "artes": "#f472b6", "historia": "#f59e0b", "geografia": "#a3e635", "filosofia": "#e5e7eb", "biologia": "#4ade80"}
TRAJE_RAR = ["comum", "raro", "raro", "epico", "epico", "lendario"]
def traje(cc, tier):
    im, d = novo(); c = rgb(cc); t = tier
    base = sh(c, .85 if t < 3 else 1)
    d.polygon([(8, 9), (13, 6), (19, 6), (24, 9), (28, 15), (24, 16), (23, 28), (9, 28), (8, 16), (4, 15)], fill=base, outline=OUTLINE)       # túnica
    d.polygon([(13, 6), (16, 12), (19, 6)], fill=OUTLINE)                                                                                        # gola
    d.polygon([(9, 17), (23, 17), (24, 28), (8, 28)], fill=sh(c, .62))                                                                            # saia
    d.rectangle((9, 18, 23, 20), fill=GOLD if t >= 1 else sh(c, 1.5), outline=OUTLINE)                                                           # cinto
    d.line((16, 12, 16, 27), fill=sh(c, 1.5))
    if t >= 2: d.polygon([(4, 15), (8, 9), (11, 11), (8, 16)], fill=sh(c, 1.35), outline=OUTLINE); d.polygon([(28, 15), (24, 9), (21, 11), (24, 16)], fill=sh(c, 1.35), outline=OUTLINE)  # ombreiras
    if t >= 3: d.line((9, 27, 23, 27), fill=GOLD); d.line((8, 16, 9, 27), fill=GOLD); d.line((24, 16, 23, 27), fill=GOLD)                       # bordados dourados
    if t >= 4: d.ellipse((14, 21, 18, 25), fill=(34, 211, 238, 255), outline=OUTLINE); d.point((14, 21), fill=(255, 255, 255, 255))              # joia
    if t >= 5:
        for p in [(3, 8), (29, 8), (2, 22), (30, 22)]: d.point(p, fill=GOLD); d.point((p[0], p[1] - 1), fill=GOLD); d.point((p[0], p[1] + 1), fill=GOLD); d.point((p[0] - 1, p[1]), fill=GOLD); d.point((p[0] + 1, p[1]), fill=GOLD)
    return im, d
def salvar(im, nome, forcar):
    f = OUT / f"{nome}.png"
    if f.exists() and not forcar: return None
    OUT.mkdir(parents=True, exist_ok=True); im.save(f); return nome
def main():
    forcar = "--tudo" in sys.argv; feitos = []
    for e in EL:
        c, r, s = cor(e), e["r"], e["s"]
        for pre, fn in (("mat", lambda: material(e, c)), ("blade", lambda: lamina(c)), ("armor", lambda: armadura(c)), ("helm", lambda: elmo(c)), ("boots", lambda: botas(c)),
                        ("gauntlets", lambda: manoplas(c)), ("grimorio", lambda: grimorio(c)), ("orbe", lambda: orbe(c)), ("cajado", lambda: cajado(c))):
            if (OUT / f"{pre}-{s}.png").exists() and not forcar: continue
            im, d = fn(); brilho(im, d, r); n = salvar(im, f"{pre}-{s}", forcar); n and feitos.append(n)
    for k, cc in CLASSES.items():
        for t in range(6):
            im, d = traje(cc, t); brilho(im, d, TRAJE_RAR[t]); n = salvar(im, f"traje-{k}-{t + 1}", forcar); n and feitos.append(n)
    print(len(feitos), "ícones novos em", OUT)
    if "--previa" in sys.argv and feitos:
        cols = 16; rows = math.ceil(len(feitos) / cols); folha = Image.new("RGBA", (cols * 72, rows * 72), (23, 20, 51, 255))
        for i, n in enumerate(feitos): im = Image.open(OUT / f"{n}.png").resize((64, 64), Image.NEAREST); folha.paste(im, ((i % cols) * 72 + 4, (i // cols) * 72 + 4), im)
        folha.save(RAIZ / "previa-itens-novos.png"); print("prévia: previa-itens-novos.png")
main()
