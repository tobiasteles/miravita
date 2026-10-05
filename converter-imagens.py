#!/usr/bin/env python3
"""Converte JPG/WEBP em PNG. Nos sprites (monstros, personagem de batalha, invocações, itens) também remove o fundo.
Uso (na raiz do projeto):  python tools/converter-imagens.py [--tudo] [--sem-ia]
  --tudo    converte também avatares, mapas, história etc. (o jogo já aceita JPG nessas pastas; é opcional)
  --sem-ia  não usa o rembg (usa só a remoção simples de fundo liso: ideal se você gerou com fundo BRANCO liso)
Instalação:  pip install pillow rembg onnxruntime      (rembg é opcional e dá o melhor recorte)
Os originais são mantidos. Imagens que já têm PNG são puladas."""
import sys, pathlib
from PIL import Image, ImageDraw
PUB = pathlib.Path(__file__).resolve().parent.parent / "public"
SPRITES = ["monsters", "battle/player", "summons", "items"]
OUTROS = ["avatars", "npcs", "skills", "maps", "story", "domains", "brand"]
EXTS = {".jpg", ".jpeg", ".webp"}
rembg = None
if "--sem-ia" not in sys.argv:
    try:
        from rembg import remove as rembg
    except ImportError:
        print("rembg não instalado: usando a remoção simples de fundo liso (pip install rembg onnxruntime para melhorar)")
def tirar_fundo(img):
    if rembg: return rembg(img)
    img = img.convert("RGBA"); w, h = img.size
    for xy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        ImageDraw.floodfill(img, xy, (0, 0, 0, 0), thresh=40)
    return img
n = 0
for pasta in SPRITES + (OUTROS if "--tudo" in sys.argv else []):
    for f in sorted((PUB / pasta).glob("*")):
        destino = f.with_suffix(".png")
        if f.suffix.lower() not in EXTS or destino.exists(): continue
        img = Image.open(f).convert("RGBA")
        if pasta in SPRITES: img = tirar_fundo(img)
        img.save(destino); n += 1; print("ok", destino.relative_to(PUB))
print(n, "imagens convertidas")
