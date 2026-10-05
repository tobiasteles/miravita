#!/usr/bin/env python3
"""Ferramentas de imagem do Miravita (pixel art). Rode na raiz do projeto.

  python tools/converter-imagens.py converter [--pixelar] [--tudo] [--sem-ia]
      Converte JPG/WEBP em PNG. Nos sprites (monsters, battle/player, summons, items) remove o fundo e recorta.
      --pixelar  reduz ao tamanho final e limita a paleta (pixel art de verdade), em todas as pastas, inclusive PNG grandes
      --tudo     converte também as pastas sem transparência (avatars, npcs, skills, maps, story, domains, brand)
      --sem-ia   não usa o rembg (só remove fundo branco liso)

  python tools/converter-imagens.py fatiar GRADE.png COLSxLINHAS pasta nome1 nome2 ... [--pixelar] [--sem-ia]
      Corta uma grade (vários sprites numa imagem só) e salva cada célula em public/<pasta>/<nome>.png

Instalação: pip install pillow      (opcional, recorte melhor: pip install rembg onnxruntime)
Os originais são mantidos. Imagens que já têm PNG são puladas."""
import sys, pathlib
from PIL import Image, ImageDraw
PUB = pathlib.Path(__file__).resolve().parent.parent / "public"
SPRITES = ["monsters", "battle/player", "summons", "items"]
OUTROS = ["avatars", "npcs", "skills", "maps", "story", "domains", "brand"]
EXTS = {".jpg", ".jpeg", ".webp", ".png"}
PX = {"monsters": 64, "battle/player": 64, "summons": 64, "items": 32, "skills": 32, "avatars": 96, "npcs": 96, "maps": 320, "story": 320, "domains": 320, "brand": 480}
A = sys.argv[1:]
flag = lambda f: f in A
rembg = None
if not flag("--sem-ia"):
    try:
        from rembg import remove as rembg
    except ImportError:
        print("(rembg não instalado: usando só a remoção de fundo branco liso)")

def tirar_fundo(img):
    if rembg: return rembg(img)
    w, h = img.size
    for xy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        if img.getpixel(xy)[3] > 0: ImageDraw.floodfill(img, xy, (0, 0, 0, 0), thresh=40)
    return img

def recortar(img):  # tira as bordas vazias e centraliza num quadrado
    box = img.getchannel("A").getbbox()
    if not box: return img
    img = img.crop(box); s = max(img.size); out = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    out.paste(img, ((s - img.width) // 2, (s - img.height) // 2)); return out

def pixelar(img, largura):  # reduz e limita a 32 cores: visual de pixel art de verdade
    if img.width <= largura: return img
    h = max(1, round(img.height * largura / img.width)); img = img.resize((largura, h), Image.BOX)
    alpha = img.getchannel("A").point(lambda v: 255 if v > 127 else 0)
    q = img.convert("RGB").quantize(colors=32, method=Image.MEDIANCUT).convert("RGBA"); q.putalpha(alpha); return q

def preparar(img, pasta):
    img = img.convert("RGBA")
    if pasta in SPRITES:
        if img.getpixel((0, 0))[3] > 0: img = tirar_fundo(img)
        img = recortar(img)
    return pixelar(img, PX.get(pasta, 64)) if flag("--pixelar") else img

def converter():
    pastas = SPRITES + (OUTROS if flag("--tudo") or flag("--pixelar") else []); n = 0
    for pasta in pastas:
        d = PUB / pasta
        if not d.exists(): continue
        for f in sorted(d.iterdir()):
            if f.suffix.lower() not in EXTS: continue
            destino = f.with_suffix(".png")
            if f.suffix.lower() != ".png" and destino.exists(): continue
            img = Image.open(f).convert("RGBA")
            if f.suffix.lower() == ".png":  # PNG: só reprocessa se tiver fundo (sprites) ou for grande demais (--pixelar)
                precisa = (pasta in SPRITES and img.getpixel((0, 0))[3] > 0) or (flag("--pixelar") and img.width > PX.get(pasta, 64))
                if not precisa: continue
            preparar(img, pasta).save(destino); n += 1; print("ok", destino.relative_to(PUB))
    print(n, "imagens processadas")

def fatiar():
    pos = [a for a in A[1:] if not a.startswith("--")]
    if len(pos) < 4: sys.exit("uso: fatiar GRADE.png COLSxLINHAS pasta nome1 nome2 ...")
    arq, grade, pasta, nomes = pos[0], pos[1], pos[2], pos[3:]
    cols, linhas = (int(x) for x in grade.lower().split("x")); im = Image.open(arq).convert("RGBA")
    if len(nomes) > cols * linhas: sys.exit("há mais nomes do que células")
    cw, ch = im.width // cols, im.height // linhas; (PUB / pasta).mkdir(parents=True, exist_ok=True)
    for i, nome in enumerate(nomes):
        c, l = i % cols, i // cols
        preparar(im.crop((c * cw, l * ch, (c + 1) * cw, (l + 1) * ch)), pasta).save(PUB / pasta / f"{nome}.png"); print("ok", f"{pasta}/{nome}.png")

if A[:1] == ["fatiar"]: fatiar()
elif A[:1] == ["converter"]: converter()
else: print(__doc__)
