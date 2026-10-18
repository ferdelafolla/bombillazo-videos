// raster.js — convierte los iconos vectoriales de Chispazo y las fotos reales en sprites de paleta indexada.
// Iconos: cada trazo se rasteriza sin suavizado y su relleno toma un índice de la paleta; contorno de tinta de 1 px.
// Fotos: se reducen a pocos píxeles y se tramán (Bayer 4×4) al color más cercano de la paleta.
import { C, T, RGB, NPAL, bayer, PROTECT } from './px.js';
import { ICONOS } from './iconos_data.js';

const FILL = { R: C.red, K: C.ink, W: C.white, Y: C.yellow, B: C.blue, LB: C.cyan, G: C.green, LG: C.lime, O: C.orange, PU: C.rose, T: C.cyan, S: C.skin, M: C.brown, GR: C.silver };

const cache = new Map();
// Sprite de un icono a tamaño `size` (px). Animación de dibujo: p 0..1 (trazos que van apareciendo)
export function iconSprite(name, size, p = 1) {
  const key = name + size + ':' + Math.round(p * 12);
  if (cache.has(key)) return cache.get(key);
  const els = ICONOS[name] || ICONOS.bombilla, n = els.length, S = size;
  const cv = new OffscreenCanvas(S, S), g = cv.getContext('2d');
  const d = new Uint8Array(S * S).fill(T);
  const k = S / 440;
  els.forEach((e, i) => {
    const a = (i / n) * .6, q = Math.max(0, Math.min(1, (p - a) / (.4 + .4 / n)));
    if (q <= 0) return;
    const path = new Path2D(e.d);
    // relleno
    if (e.f && q > .7) {
      g.clearRect(0, 0, S, S); g.save(); g.translate(S / 2, S / 2); g.scale(k, k); g.fillStyle = '#fff'; g.fill(path); g.restore();
      const px = g.getImageData(0, 0, S, S).data;
      for (let j = 0; j < S * S; j++) if (px[j * 4 + 3] > 140) d[j] = FILL[e.f];
    }
    // trazo (recortado según q con dash)
    g.clearRect(0, 0, S, S); g.save(); g.translate(S / 2, S / 2); g.scale(k, k);
    g.lineWidth = Math.max((e.w || 10) * 1.0, 2.2 / k); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#fff';
    if (q < 1) { g.setLineDash([2000 * q, 4000]); }
    g.stroke(path); g.restore();
    const px = g.getImageData(0, 0, S, S).data;
    const col = e.s ? FILL[e.s] : C.ink;
    for (let j = 0; j < S * S; j++) if (px[j * 4 + 3] > 120) d[j] = col;
  });
  // contorno de tinta alrededor de todo el icono
  const o = d.slice();
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    if (d[y * S + x] !== T) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= S || Y >= S) continue;
      const c = d[Y * S + X]; if (c !== T && c !== C.ink) { o[y * S + x] = C.ink; break; }
    }
  }
  const spr = { w: S, h: S, d: o };
  cache.set(key, spr); return spr;
}

// Fotos: se cargan al iniciar (await loadPhotos([...]))
const fotos = {};
export async function loadPhotos(names) {
  await Promise.all(names.map(async n => {
    const img = new Image(); img.src = `./fotos/${n}.jpg`; await img.decode(); fotos[n] = img;
  }));
}
const usable = [...Array(NPAL).keys()].filter(i => !PROTECT.has(i));
function nearestIdx(r, g, b) {
  let best = 0, bd = 1e9;
  for (const i of usable) { const c = RGB[i]; const dd = (r - c[0]) ** 2 * .3 + (g - c[1]) ** 2 * .59 + (b - c[2]) ** 2 * .11; if (dd < bd) { bd = dd; best = i; } }
  return best;
}
// Sprite de una foto recortada (cover) a w×h px; pos = object-position vertical 0..1; zoom ≥ 1
export function photoSprite(name, w, h, pos = .5, zoom = 1) {
  const key = `${name}:${w}x${h}:${pos}:${zoom.toFixed(3)}`;
  if (cache.has(key)) return cache.get(key);
  const img = fotos[name]; const cv = new OffscreenCanvas(w, h), g = cv.getContext('2d');
  g.imageSmoothingQuality = 'high';
  const sc = Math.max(w / img.width, h / img.height) * zoom, sw = w / sc, sh = h / sc;
  const sx = (img.width - sw) / 2, sy = (img.height - sh) * pos;
  g.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
  const px = g.getImageData(0, 0, w, h).data, d = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const j = (y * w + x) * 4, e = (bayer(x, y) - .5) * 34;
    d[y * w + x] = nearestIdx(px[j] + e, px[j + 1] + e, px[j + 2] + e);
  }
  const spr = { w, h, d }; cache.set(key, spr); return spr;
}
