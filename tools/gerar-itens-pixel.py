#!/usr/bin/env python3
"""Desenha os ícones de itens do Miravita em pixel art (32x32), sem gastar créditos de IA.
Gera em public/items/: mat-<símbolo>, blade-<símbolo>, armor-<símbolo> para os 14 elementos, mais potion e teleport-stone.
Uso (na raiz do projeto):  python tools/gerar-itens-pixel.py [--previa]      (precisa de: pip install pillow)
--previa  também salva previa-itens.png (todos os ícones ampliados) para você conferir."""
import math, sys, pathlib
from PIL import Image, ImageDraw
OUT = pathlib.Path(__file__).resolve().parent.parent / "public" / "items"
OUTLINE = (26, 16, 51, 255)
RAR = {"comum": (154, 150, 200), "raro": (34, 211, 238), "epico": (192, 132, 252), "lendario": (251, 191, 36)}
# símbolo: (cor, raridade) - as mesmas raridades calculadas pelo jogo
EL = {"h": ("#7dd3fc", "comum"), "c": ("#3f3f46", "comum"), "al": ("#d4d4d8", "comum"), "fe": ("#6b7280", "comum"), "cu": ("#c2703d", "raro"), "ti": ("#8aa0b8", "raro"),
      "pb": ("#64748b", "raro"), "ag": ("#e5e7eb", "raro"), "au": ("#fbbf24", "raro"), "pt": ("#e2e8f0", "epico"), "os": ("#5b7bb5", "epico"), "ir": ("#c4b5fd", "epico"),
      "u": ("#84cc16", "lendario"), "pu": ("#f43f5e", "lendario")}
def rgb(h): h = h.lstrip("#"); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
def sh(c, f): return tuple(max(0, min(255, int(v * f if f < 1 else v + (255 - v) * (f - 1)))) + 0 for v in c) + (255,)  # f<1 escurece, f>1 clareia
def novo(): im = Image.new("RGBA", (32, 32), (0, 0, 0, 0)); return im, ImageDraw.Draw(im)
def brilho(im, d, rar):  # sombra colorida pela raridade + faíscas
    c = RAR[rar]; d.ellipse((6, 27, 25, 31), fill=c + (110,))
    for (x, y) in [(27, 4)] + ([(4, 5)] if rar in ("epico", "lendario") else []) + ([(28, 24)] if rar == "lendario" else []):
        for dx, dy in [(0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)]: d.point((x + dx, y + dy), fill=c + (255,))
def grossa(d, a, b, w, fill):  # linha com espessura (polígono)
    dx, dy = b[0] - a[0], b[1] - a[1]; n = math.hypot(dx, dy) or 1; px, py = -dy / n * w / 2, dx / n * w / 2
    d.polygon([(a[0] + px, a[1] + py), (b[0] + px, b[1] + py), (b[0] - px, b[1] - py), (a[0] - px, a[1] - py)], fill=fill)
def lingote(d, c):
    d.polygon([(4, 16), (9, 11), (27, 11), (22, 16)], fill=sh(c, 1.35), outline=OUTLINE); d.rectangle((4, 16, 22, 25), fill=sh(c, 1) , outline=OUTLINE)
    d.polygon([(22, 16), (27, 11), (27, 20), (22, 25)], fill=sh(c, .65), outline=OUTLINE); d.line((6, 18, 12, 18), fill=sh(c, 1.7)); d.line((11, 13, 20, 13), fill=sh(c, 1.7))
def frasco(d, c):
    d.rectangle((13, 5, 18, 7), fill=(139, 94, 60, 255), outline=OUTLINE); d.rectangle((13, 8, 18, 12), fill=(190, 230, 250, 200), outline=OUTLINE)
    d.polygon([(10, 14), (21, 14), (24, 25), (7, 25)], fill=(190, 230, 250, 200), outline=OUTLINE); d.polygon([(11, 18), (20, 18), (22, 24), (9, 24)], fill=sh(c, 1))
    d.line((12, 15, 12, 17), fill=(255, 255, 255, 255))
def carvao(d, c):
    d.polygon([(6, 20), (9, 11), (16, 8), (23, 11), (26, 19), (21, 25), (11, 25)], fill=sh(c, 1), outline=OUTLINE); d.polygon([(10, 12), (16, 9), (15, 14), (11, 16)], fill=sh(c, 1.6))
    d.polygon([(16, 15), (20, 19), (16, 23), (12, 19)], fill=(125, 211, 252, 255), outline=OUTLINE); d.point((15, 18), fill=(255, 255, 255, 255))
def pedaco(d, c):  # urânio
    d.polygon([(5, 19), (8, 10), (15, 6), (24, 9), (27, 18), (21, 25), (10, 24)], fill=sh(c, 1), outline=OUTLINE); d.polygon([(9, 11), (15, 7), (17, 12), (11, 15)], fill=sh(c, 1.5))
    for p in [(13, 18), (19, 14), (21, 20), (10, 21)]: d.rectangle((p[0], p[1], p[0] + 1, p[1] + 1), fill=(220, 255, 120, 255))
def nucleo(d, c):  # plutônio
    d.ellipse((7, 7, 25, 25), fill=sh(c, .6), outline=OUTLINE); d.ellipse((11, 11, 21, 21), fill=sh(c, 1), outline=OUTLINE); d.ellipse((14, 14, 18, 18), fill=(255, 230, 120, 255))
    d.arc((4, 12, 28, 20), 0, 360, fill=(132, 204, 22, 255)); d.arc((12, 4, 20, 28), 0, 360, fill=(132, 204, 22, 255))
def material(s, c):
    im, d = novo(); c = rgb(c)
    {"h": frasco, "c": carvao, "u": pedaco, "pu": nucleo}.get(s, lingote)(d, c); return im, d
def lamina(c):
    im, d = novo(); c = rgb(c)
    grossa(d, (11, 21), (27, 5), 5, OUTLINE); grossa(d, (11, 21), (26, 6), 3, sh(c, 1)); grossa(d, (12, 20), (25, 7), 1, sh(c, 1.6))
    grossa(d, (7, 18), (14, 25), 4, OUTLINE); grossa(d, (7, 18), (14, 25), 2, (251, 191, 36, 255))  # guarda
    grossa(d, (4, 28), (10, 22), 4, OUTLINE); grossa(d, (5, 27), (10, 22), 2, (139, 94, 60, 255)); d.rectangle((3, 28, 5, 30), fill=(251, 191, 36, 255), outline=OUTLINE); return im, d
def armadura(c):
    im, d = novo(); c = rgb(c)
    d.polygon([(5, 9), (12, 6), (20, 6), (27, 9), (28, 15), (24, 16), (23, 27), (9, 27), (8, 16), (4, 15)], fill=sh(c, 1), outline=OUTLINE)
    d.polygon([(12, 6), (16, 11), (20, 6)], fill=OUTLINE); d.line((16, 12, 16, 26), fill=sh(c, 1.5)); d.rectangle((9, 21, 22, 23), fill=sh(c, .6)); d.polygon([(5, 10), (11, 8), (9, 14), (5, 14)], fill=sh(c, 1.3)); d.polygon([(27, 10), (21, 8), (23, 14), (27, 14)], fill=sh(c, .75)); return im, d
def pocao():
    im, d = novo(); d.rectangle((13, 4, 18, 7), fill=(139, 94, 60, 255), outline=OUTLINE); d.rectangle((14, 8, 17, 12), fill=(200, 230, 245, 220), outline=OUTLINE)
    d.ellipse((7, 11, 24, 28), fill=(200, 230, 245, 220), outline=OUTLINE); d.chord((9, 16, 22, 27), 0, 180, fill=(239, 68, 68, 255)); d.rectangle((9, 21, 22, 25), fill=(239, 68, 68, 255)); d.line((11, 14, 11, 17), fill=(255, 255, 255, 255)); d.point((13, 22), fill=(252, 165, 165, 255)); return im, d
def pedra():
    im, d = novo(); d.polygon([(16, 3), (26, 11), (24, 26), (8, 26), (6, 11)], fill=(71, 85, 105, 255), outline=OUTLINE); d.polygon([(16, 5), (24, 11), (16, 12), (8, 11)], fill=(100, 116, 139, 255))
    for seg, col in [([(16, 13), (16, 22)], (34, 211, 238, 255)), ([(12, 17), (16, 13), (20, 17)], (167, 139, 250, 255)), ([(12, 22), (20, 22)], (34, 211, 238, 255))]: d.line(seg, fill=col)
    return im, d
def salvar(im, nome): OUT.mkdir(parents=True, exist_ok=True); im.save(OUT / f"{nome}.png"); return nome
feitos = []
for s, (c, r) in EL.items():
    for pre, fn in (("mat", lambda: material(s, c)), ("blade", lambda: lamina(c)), ("armor", lambda: armadura(c))):
        im, d = fn(); brilho(im, d, r); feitos.append(salvar(im, f"{pre}-{s}"))
im, d = pocao(); brilho(im, d, "comum"); feitos.append(salvar(im, "potion")); im, d = pedra(); brilho(im, d, "raro"); feitos.append(salvar(im, "teleport-stone"))
print(len(feitos), "ícones gerados em", OUT)
if "--previa" in sys.argv:
    cols = 8; rows = math.ceil(len(feitos) / cols); folha = Image.new("RGBA", (cols * 36 * 4, rows * 36 * 4), (23, 20, 51, 255))
    for i, n in enumerate(feitos): folha.paste(Image.open(OUT / f"{n}.png").resize((128, 128), Image.NEAREST), ((i % cols) * 144 + 8, (i // cols) * 144 + 8), Image.open(OUT / f"{n}.png").resize((128, 128), Image.NEAREST))
    folha.save("previa-itens.png"); print("prévia: previa-itens.png")
