"""Prepara una foto real. Por defecto en COLOR (contraste, saturación +15 %, grano leve);
con --tinta, a duotono (duotono negro → amarillo, 5 tonos, grano leve).
Uso: python3 scripts/foto_tinta.py entrada.jpg salida.png [--rojo]"""
import sys
import numpy as np
from PIL import Image, ImageFilter, ImageOps, ImageEnhance
src, dst = sys.argv[1], sys.argv[2]
im0 = Image.open(src).convert('RGB')
im0.thumbnail((1600, 1600))
if '--tinta' not in sys.argv:
    im0 = ImageOps.autocontrast(im0, cutoff=1)
    im0 = ImageEnhance.Color(im0).enhance(1.15)
    im0 = ImageEnhance.Contrast(im0).enhance(1.08).filter(ImageFilter.UnsharpMask(2, 80, 2))
    b = np.asarray(im0).astype(np.float32) + np.random.default_rng(1).normal(0, 4, (im0.size[1], im0.size[0], 1))
    Image.fromarray(np.clip(b, 0, 255).astype(np.uint8)).save(dst, quality=90); print(dst, im0.size); sys.exit()
im = im0.convert('L')
im = ImageOps.autocontrast(im, cutoff=2)
im = ImageEnhance.Contrast(im).enhance(1.35).filter(ImageFilter.UnsharpMask(2, 120, 2))
a = np.asarray(im).astype(np.float32) / 255
a = a ** 0.65
a = np.clip(a + np.random.default_rng(1).normal(0, 0.03, a.shape), 0, 1)
a = np.round(a * 4) / 4  # 5 tonos
ink = np.array([0x16, 0x14, 0x12], np.float32); hi = np.array([0xe6, 0x3b, 0x2e] if '--rojo' in sys.argv else [0xf7, 0xd9, 0x4c], np.float32)
out = ink + (hi - ink) * a[..., None]
Image.fromarray(out.astype(np.uint8)).save(dst)
print(dst, im.size)
