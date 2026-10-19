// main.js — Chispazo en "16-bit Pixel RPG" (estilo de lemo-opuscar, MIT). Director: lee la línea de tiempo
// del vídeo (las mismas voces y cortes que la versión normal) y la cuenta como un juego de rol:
// cada capítulo es un lugar, Chispa viaja entre ellos, los datos salen en ventanas de menú, objetos y combates,
// las épocas cambian la profundidad de color (1720 = 4 tonos, 2000 = 8-bit, hoy = 16-bit),
// las transiciones varían (andar, mosaico, remolino, puertas, barrido, iris, miniatura, caída de paleta) y cada una suena distinta.
import { W, H, FB, C, T, GBI, LUT, RGB, NPAL, makeOut, mosaic, darken, whiten, bayer, bayer8, clamp, ss, eo, eio, hash } from './px.js';
import { text, textW, textOutlined, wrap } from './font.js';
import { win, hand } from './ui.js';
import { chispa, portrait } from './chispa.js';
import { iconSprite, photoSprite, loadPhotos } from './raster.js';
import { LUGARES, NOMBRE, FLOOR, VERT } from './lugares.js';

const q = new URLSearchParams(location.search);
const ID = q.get('id') || 'Largo';
const D = await (await fetch(`./data/${ID}.json`)).json();
const AMP = await (await fetch('./data/amp.json')).json();
await loadPhotos(['servidores', 'nasdaq', 'newton', 'tierra_noche']);
const fb = new FB(), fbO = new FB(), out = makeOut(document.getElementById('c'));
const bufA = new Uint32Array(W * H), bufB = new Uint32Array(W * H);
// salida grande: el mundo se puede acercar/alejar (zoom de cámara) y el diálogo + HUD van encima sin zoom
const BW = W * 6, BH = H * 6, cv = document.getElementById('c'); cv.width = BW; cv.height = BH;
const g2 = cv.getContext('2d'); g2.imageSmoothingEnabled = false;
const loO = document.createElement('canvas'); loO.width = W; loO.height = H;
const gO = loO.getContext('2d'), imgO = gO.createImageData(W, H), u32O = new Uint32Array(imgO.data.buffer);
function show(z = 1, fx = W / 2, fy = H / 2, overlay = false, lutO = null) {
  const sw = W / z, sh = H / z, sx = clamp(fx - sw / 2, 0, W - sw), sy = clamp(fy - sh / 2, 0, H - sh);
  g2.imageSmoothingEnabled = false; g2.drawImage(out.lo, sx, sy, sw, sh, 0, 0, BW, BH);
  if (overlay) { const d = fbO.d; for (let i = 0; i < d.length; i++) u32O[i] = d[i] === T ? 0 : lutO[d[i]]; gO.putImageData(imgO, 0, 0); g2.drawImage(loO, 0, 0, BW, BH); }
}

// —— ritmo: todo entra en los tiempos de la música (112 ppm, la misma que audio_rpg.py) ——
const CHF = VERT ? 197 : FLOOR;
const BPM = 112, BEAT = 60 / BPM, HB = BEAT / 2;
const qa = (s, at) => Math.max(.04, Math.round((s.start + at) / HB) * HB - s.start);
const beatP = t => { const ph = ((t % BEAT) + BEAT) % BEAT / BEAT; return Math.max(0, 1 - ph * 3.5); };

// —— capítulo → lugar y época ——
const LUGAR = { gancho: 'hoy', gancho_short: 'hoy', que_es: 'mercado', curiosidad: 'londres', gasto: 'datos', quien: 'datos', si_burbuja: 'hoy', no_burbuja: 'hoy', puntocom: 'nasdaq', escenarios: 'cruce', senales: 'mirador', cierre: 'puerta' };
const ERA = { curiosidad: 'gb', puntocom: 'nes' };
const segs = D.segs;
// en los Shorts el gancho va en la época de su fragmento
const capReal = s => s.cap === 'gancho_short' ? (segs.find(x => x.cap && x.cap !== 'gancho_short') || {}).cap : s.cap;
const eraOf = s => s.kind !== 'escena' || s.cap === 'gancho_short' ? 'snes' : (ERA[capReal(s)] || 'snes');
const lugarOf = s => s.kind !== 'escena' ? 'puerta' : (s.cap === 'gancho_short' ? 'hoy' : (LUGAR[s.cap] || 'hoy'));
const LUTOF = { snes: LUT.full, nes: LUT.nes, gb: LUT.gb4 };
const TEMA = {
  snes: { skin: 'snes', txt: C.white, sh: C.night, hi: C.yellow, dim: C.steel },
  nes: { skin: 'nes', txt: C.white, sh: null, hi: C.amber, dim: C.steel },
  gb: { skin: 'gb', txt: GBI[0], sh: null, hi: GBI[0], dim: GBI[1] },
};

// —— disposición ——
const L = VERT
  ? { area: { x: 8, y: 56, w: 164, h: 128 }, chx: 152, hud: 44, dlg: { x: 6, y: 202, w: 168, h: 40 }, maxc: 22 }
  : { area: { x: 102, y: 22, w: 212, h: 106 }, chx: 54, hud: 4, dlg: { x: 4, y: 134, w: 312, h: 42 }, maxc: 46 };

// —— transiciones: cuál toca en cada corte ——
const TR = 0.6;   // duración (s), centrada en el corte
const DENTRO = ['zoomin', 'walk', 'slide', 'zoomout', 'mosaic', 'iris', 'walk', 'thumb'];
const ENTRE = ['swirl', 'zoomin', 'door', 'whip', 'zoomout', 'thumb', 'iris', 'mosaic'];
const trans = [];
{ let a = 0, b = 0, last = '';
  for (let k = 1; k < segs.length; k++) {
    const A = segs[k - 1], B = segs[k];
    let ty;
    if (eraOf(A) !== eraOf(B)) ty = 'era';
    else if (A.kind !== 'escena' || B.kind !== 'escena') ty = 'thumb';
    else if (A.cap === B.cap) ty = DENTRO[a++ % DENTRO.length];
    else ty = ENTRE[b++ % ENTRE.length];
    if (ty === last && ty !== 'era') ty = ty === 'mosaic' ? 'iris' : 'mosaic';
    trans[k] = ty; last = ty;
  }
}
const camOf = k => k * 140;
const CUES = [];
function cues(k) {
  if (CUES[k]) return CUES[k];
  const s = segs[k], c = { acc: [] };
  if (s.kind === 'sub') { c.win = qa(s, .3); c.tap = qa(s, s.dur * .62); c.acc = [c.tap]; }
  else if (s.kind === 'final') { c.win = qa(s, .1); c.big = qa(s, .45); c.tap = qa(s, s.dur - .7); c.acc = [c.big, c.tap]; }
  else {
    const e = s.escena;
    switch (e.tipo) {
      case 'titulo': c.icon = qa(s, .05); c.land = c.icon + BEAT; c.title = qa(s, .6); c.acc = [c.title]; break;
      case 'tarjetas': { c.win = qa(s, .1); c.items = []; let t0 = qa(s, .45); (e.items || []).forEach(() => { c.items.push(t0); t0 += Math.max(HB, Math.round(.38 / HB) * HB); }); c.acc = c.items.slice(-1); break; }
      case 'cifra': c.icon = qa(s, .05); c.win = qa(s, .3); c.val = qa(s, .45); c.settle = c.val + .07 * (e.valor || '').length + .2; c.lab = qa(s, 1.05); c.acc = [c.settle]; break;
      case 'grafica': c.win = qa(s, .05); c.draw = qa(s, .35); c.lab = c.draw + 1.4; c.acc = [c.lab]; break;
      case 'comparar': c.msg = qa(s, .05); c.L = qa(s, .3); c.R = c.L + BEAT; c.h1 = c.R + BEAT * 1.5; c.h2 = c.h1 + BEAT * 1.5; c.acc = [c.h1, c.h2]; break;
      case 'foto': c.win = qa(s, .05); c.lab = qa(s, .5); c.acc = [c.win + .2]; break;
      case 'suscribete': c.win = qa(s, .3); c.tap = qa(s, s.vozDur * .55); c.acc = [c.tap]; break;
      default: c.icon = qa(s, .05); c.land = c.icon + .45; c.acc = [c.land];
    }
  }
  return (CUES[k] = c);
}
// zoom de cámara: alterna acercarse / alejarse en cada escena, con golpes de zoom en los momentos fuertes
function camZoom(k, lt) {
  const s = segs[k], c = cues(k), u = clamp(lt / Math.max(1, s.dur), 0, 1), dir = k % 2 ? -1 : 1;
  let z = dir > 0 ? 1 + .14 * eio(u) : 1.14 - .14 * eio(u);
  for (const a of c.acc) { const d = lt - a; if (d > -.06 && d < .7) z += .16 * (d < 0 ? (1 + d / .06) : Math.exp(-d * 7)); }
  const A = L.area, fx = VERT ? W / 2 : W / 2 * .4 + (A.x + A.w / 2) * .6, fy = VERT ? 168 : H / 2 * .45 + (A.y + A.h / 2) * .55;
  return { z, fx, fy };
}
// saltitos de Chispa en los acentos, y balanceo al compás
function hopAt(k, lt) { let h = 0; for (const a of cues(k).acc) { const d = lt - a + .05; if (d > 0 && d < .32) h = Math.max(h, Math.sin(Math.PI * d / .32)); } return h; }

// —— utilidades ——
const norm = w => w.toLowerCase().replace(/[¿?¡!,.:;…"]/g, '');
const limpiar = s => s.replace(/[¿?¡!,.:;…]/g, '').toUpperCase();
const silabas = w => Math.max(1, (w.match(/[aeiouáéíóúü]+/gi) || []).length);
function ampAt(s, lt) {
  const a = AMP[s.voz] || []; if (lt < 0 || lt > s.vozDur) return 0;
  return a[Math.floor((lt + s.vozDesde) * 24)] || 0;
}
function centerText(s, y, col, sh, sc = 1, x0 = 0, w = W) { text(fb, s, x0 + Math.round((w - textW(s, sc)) / 2), y, col, sh, sc); }
function bigTitle(s, cx, y, maxW, col) {
  // a escala 2 si cabe (en hasta 2 líneas); si no, a escala 1
  let sc = 2, lines = wrap(s, maxW / 2);
  if (lines.length > 2 || lines.some(l => textW(l, 2) > maxW)) { sc = 1; lines = wrap(s, maxW); }
  lines.forEach((ln, i) => textOutlined(fb, ln, Math.round(cx - textW(ln, sc) / 2), y + i * (sc * 10), col, C.ink, sc));
  return lines.length * sc * 10;
}
const titleCol = th => th.skin === 'gb' ? GBI[3] : (y => y < 2 ? C.white : y < 4 ? C.yellow : y < 6 ? C.amber : C.orange);

// —— cuadro de diálogo = subtítulo (una sola línea, al ritmo de la voz) ——
function lineas(words, maxc) {
  const out = [[]]; let len = 0;
  words.forEach((w, i) => { const cur = out[out.length - 1]; if (cur.length && len + 1 + w.length > maxc) { out.push([i]); len = w.length; } else { cur.push(i); len += (cur.length > 1 ? 1 : 0) + w.length; } });
  return out;
}
function dialogo(s, lt, th, fb) {
  const e = s.escena; if (!e) return;
  const { x, y, w, h } = L.dlg;
  win(fb, x, y, w, h, th.skin);
  const amp = ampAt(s, lt);
  portrait(fb, x + 5, y + 4, { talk: amp > .25 ? amp : 0, t: s.start + lt });
  const words = e.texto.split(/\s+/), syl = words.map(silabas), tot = syl.reduce((a, b) => a + b, 0), habla = s.vozDur * .92;
  const at = []; let acc = 0; syl.forEach(v => { at.push(.05 + acc / tot * habla); acc += v; });
  const ls = lineas(words, L.maxc), hl = new Set((e.destacar || []).map(norm));
  let k = 0; for (let i = 0; i < ls.length; i++) if (i === 0 || lt >= at[ls[i][0]] - .05) k = i;
  let tx = x + 44; const ty = y + Math.round(h / 2) - 4;
  for (const i of ls[k]) {
    if (lt < at[i]) break;
    const wd = words[i], n = Math.min(wd.length, Math.floor((lt - at[i]) * 40) + 1);
    const vis = wd.slice(0, n), on = hl.has(norm(wd));
    if (on && th.skin !== 'gb') fb.rect(tx - 1, ty - 1, textW(vis) + 2, 9, C.yellow);
    text(fb, vis, tx, ty, on ? (th.skin === 'gb' ? GBI[0] : C.ink) : th.txt, on ? null : th.sh);
    if (on && th.skin === 'gb') fb.hline(tx, tx + textW(vis), ty + 8, GBI[1]);
    tx += textW(wd + ' ');
  }
  if (lt > s.vozDur && Math.floor(lt * 3) % 2 === 0) text(fb, '▼', x + w - 12, y + h - 12, th.txt);
}

// —— HUD: chapa de la marca + lugar ——
function hud(s, th, fb) {
  const lug = NOMBRE[lugarOf(s)], a = 'CHISPAZO', w = textW(a) + textW(lug) + 22;
  win(fb, 4, L.hud, w, 15, th.skin);
  text(fb, a, 10, L.hud + 4, th.skin === 'gb' ? GBI[0] : C.yellow, th.sh);
  text(fb, lug, 16 + textW(a), L.hud + 4, th.skin === 'gb' ? GBI[1] : C.silver, th.sh);
}

// —— piezas animadas ——
// ventana que se abre desde el centro con rebote; devuelve true cuando ya está abierta
function winA(x, y, w, h, skin, lt, at) {
  const p = clamp((lt - at) / .2, 0, 1); if (p <= 0) return false;
  const e = Math.min(1.08, backOut(p, 1.8)), ww = Math.max(8, Math.round(w * e)), hh = Math.max(6, Math.round(h * (p < 1 ? Math.min(1, e) : 1)));
  win(fb, Math.round(x + (w - ww) / 2), Math.round(y + (h - hh) / 2), ww, hh, skin); return p >= .85;
}
function backOut(t, k = 1.7) { t = clamp(t, 0, 1); const c3 = k + 1; return 1 + c3 * Math.pow(t - 1, 3) + k * Math.pow(t - 1, 2); }
// estallido de destellos
function burst(cx, cy, dt, col, n = 10, sp = 70) {
  if (dt <= 0 || dt > .45) return;
  for (let i = 0; i < n; i++) { const a = i / n * 6.283 + .3, r = 5 + dt * sp, x = Math.round(cx + Math.cos(a) * r * 1.3), y = Math.round(cy + Math.sin(a) * r * .8); fb.px(x, y, col); if (dt < .25) { fb.px(x - 1, y, col); fb.px(x + 1, y, col); fb.px(x, y - 1, col); fb.px(x, y + 1, col); } }
}
// número de daño que sube y parpadea
function dmg(x, y, dt, s2, col) { if (dt <= 0 || dt > .9 || (dt > .6 && Math.floor(dt * 16) % 2)) return; textOutlined(fb, s2, Math.round(x - textW(s2) / 2), Math.round(y - dt * 22), col, C.ink, 1); }
// título cuyas letras caen una a una con rebote
function dropTitle(s, cx, y, maxW, col, lt, at) {
  let sc = 2, lines = wrap(s, maxW / 2);
  if (lines.length > 2 || lines.some(l => textW(l, 2) > maxW)) { sc = 1; lines = wrap(s, maxW); }
  let n = 0;
  lines.forEach((ln, li) => { let x = Math.round(cx - textW(ln, sc) / 2); for (const ch of ln) { const p = clamp((lt - at - n * .03) / .25, 0, 1); n++; if (p > 0) textOutlined(fb, ch, x, y + li * sc * 10 - Math.round((1 - backOut(p, 2.2)) * 18), col, C.ink, sc); x += textW(ch + ' ', sc) - textW(' ', sc) + sc; } });
  return lines.length * sc * 10;
}

// —— contenidos: cada tipo de escena es un sistema del juego ——
const POP = (lt, at, d = .3) => clamp((lt - at) / d, 0, 1);
const slideIn = (lt, at) => Math.round((1 - eo(POP(lt, at))) * 30);
const PUNTOS = {
  sube: [[0, .9], [.2, .84], [.4, .7], [.55, .52], [.75, .3], [1, .06]],
  cae: [[0, .55], [.2, .38], [.42, .16], [.55, .12], [.66, .35], [.78, .82], [1, .9]],
  pico: [[0, .9], [.3, .86], [.42, .66], [.52, .08], [.62, .55], [.74, .9], [1, .92]],
  suave: [[0, .62], [.25, .34], [.48, .24], [.7, .3], [1, .5]],
};
const TARJ = [C.yellow, C.cyan, C.lime, C.orange, C.pink, C.red];

function contenido(k, s, lt, th) {
  const e = s.escena, A = L.area, cx = A.x + A.w / 2, c = cues(k), bp = beatP(s.start + lt);
  switch (e.tipo) {
    case 'titulo': {
      const sz = VERT ? 60 : 52, p = clamp((lt - c.icon) / .45, 0, 1);
      const ic = iconSprite(e.icono || 'bombilla', sz, clamp((lt - .1) / 1.0, 0, 1));
      const iy = A.y + 4 + Math.round((1 - backOut(p, 1.8)) * 30) - Math.round(bp * 2);
      if (p > 0) fb.blit(ic, Math.round(cx - ic.w / 2), iy);
      burst(cx, A.y + 4 + sz / 2, lt - c.land, th.skin === 'gb' ? GBI[3] : C.yellow, 12);
      const tt = e.texto_grande || limpiar((e.destacar || [''])[0]);
      const two = wrap(tt, (A.w - 16) / 2).length > 1, w = two ? A.w : Math.min(A.w, textW(tt, 2) + 20);
      if (winA(Math.round(cx - w / 2), A.y + sz + 10, w, two ? 50 : 30, th.skin, lt, c.title - .1)) dropTitle(tt, cx, A.y + sz + 18, A.w - 16, titleCol(th), lt, c.title);
      break;
    }
    case 'tarjetas': {
      const it = e.items || [], rowH = 15, h = 14 + it.length * rowH;
      const w = Math.min(A.w, Math.max(...it.map(x => textW(x))) + 40);
      const x = Math.round(cx - w / 2), y = A.y + Math.round((A.h - h) / 2);
      if (!winA(x, y, w, h, th.skin, lt, c.win)) break;
      let cur = -1, prev = 0;
      it.forEach((s2, i) => {
        const at = c.items[i]; if (lt < at) return; cur = i;
        const p = clamp((lt - at) / .22, 0, 1), off = Math.round((1 - eo(p)) * 40);
        if (lt - at < .15 && th.skin !== 'gb') fb.rect(x + 16, y + 7 + i * rowH, w - 22, 11, C.blue);
        fb.clip = [x + 4, y, x + w - 4, y + h]; text(fb, s2, x + 20 + off, y + 9 + i * rowH, th.skin === 'snes' ? TARJ[i % TARJ.length] : th.txt, th.sh); fb.clip = [0, 0, W, H];
      });
      if (cur >= 0) { const at = c.items[cur], from = cur > 0 ? cur - 1 : cur, f = eo(clamp((lt - at) / .12, 0, 1)); hand(fb, x + 5, Math.round(y + 9 + (from + (cur - from) * f) * rowH), lt, true); }
      if (e.icono) { const ic = iconSprite(e.icono, 26, clamp(lt / .8, 0, 1)); fb.blit(ic, x + w - 14, y - 14 - Math.round(bp * 2)); }
      break;
    }
    case 'cifra': {
      const val = e.valor || '', sc = textW(val, 3) < A.w - 20 ? 3 : textW(val, 2) < A.w - 20 ? 2 : 1;
      const ic = e.icono ? iconSprite(e.icono, 30, clamp(lt / .8, 0, 1)) : null;
      const w = Math.min(A.w, Math.max(textW(val, sc), textW(e.etiqueta || '')) + 24), h = 22 + sc * 8 + (e.etiqueta ? 14 : 0);
      const x = Math.round(cx - w / 2), y = A.y + (ic ? 30 : 16);
      if (ic) { const p = clamp((lt - c.icon) / .4, 0, 1); if (p > 0) fb.blit(ic, Math.round(cx - 15), y - 32 + Math.round((1 - backOut(p)) * 20) - Math.round(bp * 2)); }
      const shake = lt - c.settle > 0 && lt - c.settle < .2 ? [2, -2, 1, -1, 0][Math.floor((lt - c.settle) * 24)] || 0 : 0;
      if (!winA(x + shake, y, w, h, th.skin, lt, c.win)) break;
      if (lt > c.val) {
        let shown = '';   // tragaperras: cada cifra gira y se para, una tras otra
        [...val].forEach((ch, i) => { const st = c.val + i * .07; if (lt < st) return; shown += (/\d/.test(ch) && lt < st + .2) ? String(Math.floor(hash(i, Math.floor(lt * 30)) * 10)) : ch; });
        textOutlined(fb, shown, Math.round(cx - textW(val, sc) / 2) + shake, y + 8, titleCol(th), C.ink, sc);
      }
      burst(cx, y + 8 + sc * 4, lt - c.settle, th.skin === 'gb' ? GBI[3] : C.yellow, 14, 90);
      if (e.etiqueta && lt > c.lab) { const p = backOut(clamp((lt - c.lab) / .2, 0, 1), 2); centerText(e.etiqueta, y + 12 + sc * 8 + Math.round((1 - p) * 6), th.skin === 'snes' ? C.cyan : th.txt, th.sh, 1, x, w); }
      break;
    }
    case 'grafica': {
      const x = A.x + 6, y = A.y + 6, w = A.w - 12, h = A.h - 12;
      if (!winA(x, y, w, h, th.skin, lt, c.win)) break;
      const gx = x + 10, gy = y + 8, gw = w - 20, gh = h - 18;
      fb.vline(gx, gy, gy + gh, th.txt); fb.hline(gx, gx + gw, gy + gh, th.txt);
      for (let i = 1; i < 6; i++) fb.px(gx + Math.round(gw * i / 6), gy + gh + 1, th.txt);
      const P = PUNTOS[e.forma || 'sube'], pr = clamp((lt - c.draw) / 1.4, 0, 1);
      const pts = []; for (let i = 0; i <= 80; i++) { const u = i / 80; if (u > pr) break; let j = 0; while (j < P.length - 2 && P[j + 1][0] < u) j++; const [a0, b0] = P[j], [a1, b1] = P[j + 1]; const f = (u - a0) / (a1 - a0); const v = b0 + (b1 - b0) * eio(clamp(f, 0, 1)); pts.push([gx + 1 + u * (gw - 2), gy + v * gh]); }
      for (const [px, py] of pts) for (let yy = Math.round(py) + 2; yy < gy + gh; yy++) if (bayer(Math.round(px), yy) < .4) fb.px(Math.round(px), yy, th.skin === 'snes' ? C.blue : th.dim);
      const lc = th.skin === 'gb' ? GBI[0] : C.red;
      for (let i = 1; i < pts.length; i++) { fb.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], lc); fb.line(pts[i - 1][0], pts[i - 1][1] + 1, pts[i][0], pts[i][1] + 1, lc); }
      const et = e.etiquetas || [];
      if (et[1]) { for (let xx = gx; xx < gx + gw; xx += 4) fb.hline(xx, xx + 1, gy + gh * .45, th.skin === 'snes' ? C.cyan : th.txt); text(fb, et[1], gx + 4, gy + gh * .45 + 3, th.skin === 'snes' ? C.cyan : th.txt, th.sh); }
      if (pts.length) {   // cabeza de la línea: destello
        const [px, py] = pts[pts.length - 1], hx = Math.round(px), hy = Math.round(py), sc2 = pr < 1 ? 1 : 1 + Math.round(bp);
        fb.disc(hx, hy, 1 + sc2, th.skin === 'gb' ? GBI[0] : C.yellow);
        if (pr < 1 && Math.floor(lt * 12) % 2) { fb.px(hx, hy - 4, C.white); fb.px(hx, hy + 4, C.white); fb.px(hx - 4, hy, C.white); fb.px(hx + 4, hy, C.white); }
        burst(hx, hy, lt - c.lab, th.skin === 'gb' ? GBI[0] : C.yellow, 8, 50);
      }
      if (et[0] && lt > c.lab) { const [px, py] = pts[pts.length - 1]; const s2 = et[0], tw = textW(s2) + 8; const bx = clamp(Math.round(px - tw - 2), gx + 2, gx + gw - tw), by = clamp(Math.round(py - 16), gy, gy + gh - 12); if (winA(bx, by, tw, 13, th.skin, lt, c.lab)) text(fb, s2, bx + 4, by + 3, th.hi, th.sh); }
      break;
    }
    case 'comparar': {
      // combate: entran los dos bandos, se golpean al compás, salen números de daño y la vida baja
      const bw = Math.round((A.w - 30) / 2), bh = 44, y = A.y + 26;
      const msg = '¡COMBATE!', mw = textW(msg) + 20;
      if (winA(Math.round(cx - mw / 2), A.y + 2, mw, 16, th.skin, lt, c.msg)) text(fb, msg.slice(0, Math.floor((lt - c.msg) * 30)), Math.round(cx - textW(msg) / 2), A.y + 6, th.txt, th.sh);
      const sides = [[e.izq, A.x + 4, c.L, -1, c.h1, c.h2], [e.der, A.x + A.w - 4 - bw, c.R, 1, c.h2, c.h1]];
      sides.forEach(([nm, x0, at, dir, atk, hurt], i) => {
        if (lt < at) return;
        const pin = eo(clamp((lt - at) / .25, 0, 1));
        let x = Math.round(x0 + dir * (1 - pin) * 90);
        const da = lt - atk; if (da > 0 && da < .2) x += Math.round(-dir * Math.sin(da / .2 * Math.PI) * 10);   // embestida
        const dh = lt - hurt; const flash = dh > 0 && dh < .16 && Math.floor(dh * 24) % 2 === 0;
        if (dh > 0 && dh < .25) x += [3, -3, 2, -2, 1, 0][Math.floor(dh * 24)] || 0;
        win(fb, x, y, bw, bh, th.skin);
        if (flash && th.skin !== 'gb') fb.rect(x + 3, y + 3, bw - 6, bh - 6, C.white);
        const s2 = nm || '', sc = textW(s2, 2) < bw - 10 ? 2 : 1;
        textOutlined(fb, s2, Math.round(x + (bw - textW(s2, sc)) / 2), y + 8, th.skin === 'snes' ? (() => i ? C.pink : C.cyan) : th.txt, C.ink, sc);
        const hp = 1 - (i ? .45 : .3) * eo(clamp((lt - hurt) / .5, 0, 1));
        text(fb, 'HP', x + 8, y + bh - 22, th.dim, null);
        fb.rect(x + 8, y + bh - 12, bw - 16, 5, C.ink); fb.rect(x + 9, y + bh - 11, Math.round((bw - 18) * hp), 3, th.skin === 'snes' ? (hp > .6 ? C.lime : C.amber) : th.txt);
        dmg(x + bw / 2, y - 2, dh, i ? '-45' : '-30', th.skin === 'snes' ? C.red : th.txt);
      });
      if (lt > c.R) { const v = 'VS', sc = 2 + (beatP(s.start + lt) > .7 ? 1 : 0); textOutlined(fb, v, Math.round(cx - textW(v, sc) / 2), y + 22 - sc * 4, th.skin === 'snes' ? C.yellow : th.txt, C.ink, sc); }
      break;
    }
    case 'foto': {
      const fw = VERT ? A.w : A.w - 6, fh = VERT ? 96 : A.h - 26, x = Math.round(cx - fw / 2), y = A.y + 14;
      if (!winA(x - 4, y - 4, fw + 8, fh + 22, th.skin, lt, c.win)) break;
      const pos = e.encuadre ? parseFloat(e.encuadre.split(' ')[1]) / 100 : .5, u = clamp(lt / Math.max(1, s.dur), 0, 1);
      fb.blit(photoSprite(e.foto, fw, fh, pos, k % 2 ? 1.16 - .14 * u : 1 + .14 * u), x, y);
      if (lt - c.win < .12) fb.rect(x, y, fw, fh, C.white);   // flash de cámara
      const cred = (e.credito || '').replace(/^(Foto|Retrato|Imagen): /, '').replace(', vía Wikimedia Commons', '').replace('dominio público', 'dom. público').replace(' (Black Marble)', '');
      text(fb, cred, x + 2, y + fh + 5, th.dim, null);
      if (e.etiqueta && lt > c.lab) { const tw = textW(e.etiqueta) + 14; if (winA(Math.round(cx - tw / 2), y - 16, tw, 15, th.skin, lt, c.lab)) text(fb, e.etiqueta, Math.round(cx - textW(e.etiqueta) / 2), y - 12, th.hi, th.sh); }
      break;
    }
    case 'suscribete': {
      menuSub(lt, c.tap, th, '¿GUARDAR PARTIDA?', c.win);
      break;
    }
    default: {   // icono: objeto que sube como "objeto obtenido", aterriza y flota al compás
      if (s.cap === 'cierre') { guardado(lt, th); break; }
      const sz = VERT ? 76 : 70, ic = iconSprite(e.icono || 'bombilla', sz, clamp((lt - .1) / 1.0, 0, 1));
      const p = clamp((lt - c.icon) / .45, 0, 1); if (p <= 0) break;
      const y = A.y + 2 + Math.round((1 - backOut(p, 1.8)) * 40) - Math.round(bp * 2);
      fb.rect(Math.round(cx - 24), A.y + A.h - 10, 48, 6, th.skin === 'gb' ? GBI[1] : C.slate); fb.hline(Math.round(cx - 24), Math.round(cx + 23), A.y + A.h - 10, th.skin === 'gb' ? GBI[0] : C.ink);
      fb.blit(ic, Math.round(cx - sz / 2), y);
      burst(cx, y + sz / 2, lt - c.land, th.skin === 'gb' ? GBI[3] : C.yellow, 12, 80);
      for (let i = 0; i < 4; i++) { const ph = ((s.start + lt) / BEAT + i * .25) % 1; if (ph < .35) { const sx = Math.round(cx + (hash(i, Math.floor((s.start + lt) / BEAT)) - .5) * sz * 1.2), sy = Math.round(y + hash(i, 2) * sz); fb.px(sx, sy - 1, C.white); fb.px(sx - 1, sy, C.white); fb.px(sx + 1, sy, C.white); fb.px(sx, sy + 1, C.white); } }
    }
  }
}

// menú de suscripción (pausa a mitad y cierre)
function menuSub(lt, tap, th, titulo, at = 0) {
  const A = L.area, w = Math.min(A.w, 150), x = Math.round(A.x + A.w / 2 - w / 2), y = A.y + 8;
  if (!winA(x, y, w, 52, th.skin, lt, at)) return;
  text(fb, titulo, x + Math.round((w - textW(titulo)) / 2), y + 8, th.txt, th.sh);
  const done = lt >= tap;
  const op = done ? 'SUSCRITO ✓' : 'SUSCRÍBETE';
  text(fb, op, x + 26, y + 24, done ? C.lime : C.yellow, th.sh);
  text(fb, 'SEGUIR JUGANDO', x + 26, y + 37, th.dim, th.sh);
  hand(fb, x + 10, y + 24, lt, !done);
  burst(x + 50, y + 27, lt - tap, C.yellow, 12, 90);
}

// —— pantalla de guardado: repasa el viaje entero (partidas guardadas en cada época) ——
const toIdx = {};
function eraMap(era) {
  if (toIdx[era]) return toIdx[era];
  const Lx = LUTOF[era], m = new Uint8Array(256);
  for (let i = 0; i < NPAL; i++) { const v = Lx[i], r = v & 255, g = v >> 8 & 255, b = v >> 16 & 255; let best = 0, bd = 1e9; for (let j = 0; j < NPAL; j++) { const c = RGB[j], d = (r - c[0]) ** 2 + (g - c[1]) ** 2 + (b - c[2]) ** 2; if (d < bd) { bd = d; best = j; } } m[i] = best; }
  return (toIdx[era] = m);
}
const thumbs = {};
function thumb(lugar, era, w, h) {
  const key = lugar + era + w; if (thumbs[key]) return thumbs[key];
  const big = new FB(); LUGARES[lugar](big, 200, 3); const m = eraMap(era), d = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) d[y * w + x] = m[big.d[Math.floor(y / h * H) * W + Math.floor(x / w * W)]];
  return (thumbs[key] = { w, h, d });
}
const PARTIDAS = [
  { lugar: 'londres', era: 'gb', nombre: 'LONDRES · 1720', nota: 'MARES DEL SUR' },
  { lugar: 'nasdaq', era: 'nes', nombre: 'NUEVA YORK · 2000', nota: 'NASDAQ -78 %' },
  { lugar: 'hoy', era: 'snes', nombre: 'HOY', nota: '¿LA IA ES UNA BURBUJA?' },
];
function guardado(lt, th) {
  const A = L.area, rowH = VERT ? 34 : 30, w = A.w, x = A.x, y = A.y;
  win(fb, x, y, w, 16 + PARTIDAS.length * rowH, th.skin);
  text(fb, 'PARTIDAS GUARDADAS', x + 8, y + 5, C.yellow, th.sh);
  const cur = Math.min(PARTIDAS.length - 1, Math.floor(lt / 1.1));
  PARTIDAS.forEach((p, i) => {
    if (lt < i * .35) return;
    const ry = y + 16 + i * rowH, tw = VERT ? 44 : 44, thh = Math.round(tw * 9 / 16);
    fb.rect(x + 18, ry, tw + 2, thh + 2, i === cur ? C.yellow : C.ink); fb.blit(thumb(p.lugar, p.era, tw, thh), x + 19, ry + 1);
    text(fb, `PARTIDA ${i + 1}`, x + 26 + tw, ry + 1, i === cur ? C.white : C.steel, th.sh);
    text(fb, p.nombre, x + 26 + tw, ry + 10, i === cur ? C.cyan : C.steel, th.sh);
    if (!VERT) text(fb, p.nota, x + 26 + tw, ry + 19, i === cur ? C.yellow : C.slate, th.sh);
  });
  hand(fb, x + 5, y + 20 + cur * rowH, lt, true);
}

// —— render de un segmento completo (fondo + Chispa + contenido + diálogo + HUD) ——
function renderSeg(k, t, sep = false) {
  const s = segs[k], lt = t - s.start, th = TEMA[eraOf(s)], c = cues(k);
  const bob = beatP(t) > .5 ? 1 : 0, hop = hopAt(k, lt);
  const top = sep ? fbO : fb; if (sep) fbO.clear(T);
  if (s.kind === 'sub') {
    LUGARES.puerta(fb, camOf(k), t);
    chispa(fb, VERT ? 90 : 56, CHF, { t, s: 2, wave: 1, talk: ampAt(s, lt), bob, hop });
    menuSub(lt, c.tap, th, '¿QUIERES SABER MÁS?', c.win);
    return LUT.full;
  }
  if (s.kind === 'final') {
    LUGARES.puerta(fb, camOf(k), t);
    const A = L.area, rem = s.remate || '¿QUIERES VER MÁS?', w = A.w;
    if (winA(A.x, A.y, w, 30, th.skin, lt, c.win)) { const ls = wrap(rem, w - 12); ls.slice(0, 2).forEach((ln, i) => centerText(ln, A.y + 6 + i * 10, C.pink, th.sh, 1, A.x, w)); }
    const t2 = 'VÍDEO COMPLETO', t3 = 'EN EL CANAL';
    const nl = wrap(t2, (w - 10) / 2).length, hh = nl * 20 + 22;
    if (winA(A.x, A.y + 36, w, hh, th.skin, lt, c.big - .1)) { dropTitle(t2, A.x + w / 2, A.y + 43, w - 10, titleCol(th), lt, c.big); if (lt > c.big + .5) centerText(t3, A.y + 36 + hh - 14, C.cyan, th.sh, 1, A.x, w); }
    if (lt > c.big + .7) { const op = lt > c.tap ? 'SUSCRITO ✓' : '▶ CONTINUAR'; centerText(op, A.y + 44 + hh - (beatP(t) > .6 && lt < c.tap ? 1 : 0), C.yellow, th.sh, 1, A.x, w); }
    burst(A.x + w / 2, A.y + 50 + hh, lt - c.tap, C.yellow, 12, 90);
    chispa(fb, VERT ? 90 : L.chx, CHF, { t, wave: 1, talk: ampAt(s, lt), bob, hop });
    return LUT.full;
  }
  LUGARES[lugarOf(s)](fb, camOf(k) + Math.round(lt * 6), t);
  const e = s.escena, sub = e.tipo === 'suscribete';
  // reacciones: salta en los acentos, se sorprende con las cifras, embiste en los combates
  let lunge = 0; if (e.tipo === 'comparar') for (const a of [c.h1, c.h2]) { const d = lt - a; if (d > 0 && d < .2) lunge = Math.round(Math.sin(d / .2 * Math.PI) * 6); }
  chispa(fb, (sub ? (VERT ? 90 : 56) : L.chx) + lunge, CHF, { t, s: sub ? 2 : 1, talk: ampAt(s, lt), wave: sub || (e.tipo === 'tarjetas' && c.items && c.items.some(a => lt - a > 0 && lt - a < .3)) ? 1 : 0, bob, hop, surprise: e.tipo === 'cifra' && lt > c.settle && lt < c.settle + .8 ? 1 : 0 });
  contenido(k, s, lt, th);
  dialogo(s, lt, th, top);
  hud(s, th, top);
  return LUTOF[eraOf(s)];
}

// —— composición de transiciones (a nivel RGB) ——
function shiftCopy(dst, src, dx) { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const sx = x - dx; if (sx >= 0 && sx < W) dst[y * W + x] = src[y * W + sx]; } }
function compose(ty, p, k) {
  const u = out.u32;
  switch (ty) {
    case 'mosaic': { u.set(p < .5 ? bufA : bufB); mosaic(u, Math.round(1 + 14 * (1 - Math.abs(p - .5) * 2))); break; }
    case 'walk': case 'whip': {
      const sp = ty === 'whip' ? eio(p) : eo(p) * .5 + p * .5, off = Math.round(sp * W);
      u.fill(0); shiftCopy(u, bufA, -off); shiftCopy(u, bufB, W - off); break; }
    case 'slide': { const off = Math.round(eio(p) * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const sy = y + off; u[y * W + x] = sy < H ? bufA[sy * W + x] : bufB[(sy - H) * W + x]; } break; }
    case 'iris': { const cx = L.chx, cy = FLOOR - 20, R = eio(p) * Math.hypot(W, H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - cx, y - cy) - bayer8(x, y) * 10; u[y * W + x] = d < R ? bufB[y * W + x] : bufA[y * W + x]; } break; }
    case 'thumb': { // la escena nueva crece desde una miniatura en el centro, con mosaico
      const f = eo(clamp(p * 1.4 - .2, 0, 1)); u.set(bufA);
      const rw = Math.max(2, Math.round(W * (.15 + .85 * f))), rh = Math.max(2, Math.round(H * (.15 + .85 * f))), rx = Math.round((W - rw) / 2), ry = Math.round((H - rh) / 2), n = Math.max(1, Math.round(10 * (1 - f)));
      if (p > .1) for (let y = ry; y < ry + rh; y++) for (let x = rx; x < rx + rw; x++) { let sx = Math.floor((x - rx) / rw * W), sy = Math.floor((y - ry) / rh * H); sx = Math.floor(sx / n) * n; sy = Math.floor(sy / n) * n; u[y * W + x] = bufB[sy * W + sx]; }
      if (p > .1 && f < 1) for (let x = rx - 1; x <= rx + rw; x++) { if (x >= 0 && x < W) { if (ry > 0) u[(ry - 1) * W + x] = 0xffffffff; if (ry + rh < H) u[(ry + rh) * W + x] = 0xffffffff; } }
      break; }
    case 'door': { // dos hojas negras se cierran y se abren
      const c = p < .5 ? eo(p * 2) : 1 - eo((p - .5) * 2), half = Math.round(c * W / 2), src = p < .5 ? bufA : bufB;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; u[i] = (x < half || x >= W - half) ? ((x === half - 1 || x === W - half) ? 0xff443a26 : 0xff251418) : src[i]; }
      break; }
    case 'swirl': {
      const src = p < .55 ? bufA : bufB, s2 = p < .55 ? Math.pow(p / .55, 1.6) : Math.pow(1 - (p - .55) / .45, 1.6), n = 1 + Math.round(6 * s2);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const dx = x - W / 2, dy = y - H / 2, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx) + s2 * 7 * (1.2 - r / 190);
        let sx = Math.round(W / 2 + Math.cos(a) * r * (1 - s2 * .35)), sy = Math.round(H / 2 + Math.sin(a) * r * (1 - s2 * .35));
        sx = clamp(Math.floor(sx / n) * n, 0, W - 1); sy = clamp(Math.floor(sy / n) * n, 0, H - 1);
        u[y * W + x] = src[sy * W + sx];
      }
      if (Math.abs(p - .55) < .08) for (let i = 0; i < u.length; i++) if (bayer(i % W, (i / W) | 0) < .6) u[i] = 0xffffffff;
      break; }
    default: u.set(p < .5 ? bufA : bufB);
  }
}

function frame(t) {
  let k = 0; for (let i = 0; i < segs.length; i++) if (segs[i].start <= t) k = i;
  let a = -1, b = -1, p = 0;
  if (k > 0 && t < segs[k].start + TR / 2) { a = k - 1; b = k; p = (t - (segs[k].start - TR / 2)) / TR; }
  else if (k + 1 < segs.length && t > segs[k + 1].start - TR / 2) { a = k; b = k + 1; p = (t - (segs[k + 1].start - TR / 2)) / TR; }
  if (a < 0) {
    fb.clear(C.ink); const lut = renderSeg(k, t, true);
    let Lx = lut; if (t < .3) Lx = darken(lut, 1 - t / .3); if (t > D.dur - .4) Lx = darken(lut, (t - (D.dur - .4)) / .4);
    out.present(fb, Lx); const cz = segs[k].kind === 'escena' ? camZoom(k, t - segs[k].start) : { z: 1 + .06 * Math.sin((t - segs[k].start) * 1.5) ** 2, fx: W / 2, fy: H / 2 };
    show(cz.z, cz.fx, cz.fy, true, Lx); return;
  }
  const ty = trans[b]; p = clamp(p, 0, 1);
  if (ty === 'era') {   // caída de paleta por pasos (no alpha), con zoom hacia dentro y hacia fuera
    const src = p < .5 ? a : b; fb.clear(C.ink); const lut = renderSeg(src, t);
    out.present(fb, darken(lut, p < .5 ? p * 2 : (1 - p) * 2)); show(1 + .5 * Math.sin(p * Math.PI), L.chx, FLOOR - 20); return;
  }
  if (ty === 'zoomin' || ty === 'zoomout') {
    // zoomin: la cámara se zambulle en Chispa y sale ya en la escena nueva; zoomout: la nueva escena se revela alejándose
    const src = p < .5 ? a : b; fb.clear(C.ink); const lut = renderSeg(src, t); out.present(fb, lut);
    const m = p < .5 ? eio(p * 2) : 1 - eo((p - .5) * 2);
    if (ty === 'zoomin') { out.post(u => mosaic(u, Math.round(1 + 4 * m * m))); show(1 + 2.6 * m, L.chx, FLOOR - 20); }
    else { const z = p < .5 ? 1 + .9 * eio(p * 2) : 1.9 - .9 * eo((p - .5) * 2); show(z, W / 2, H / 2); }
    return;
  }
  fb.clear(C.ink); out.present(fb, renderSeg(a, t)); bufA.set(out.u32);
  fb.clear(C.ink); out.present(fb, renderSeg(b, t)); bufB.set(out.u32);
  out.post(() => compose(ty, p, b)); show();
}

// —— eventos de sonido (para la mezcla): transiciones, ventanas, cursores, fanfarrias, golpes ——
const EV = [];
const ev = (t, type, o = {}) => { if (t >= 0 && t <= D.dur) EV.push({ t: +t.toFixed(3), type, ...o }); };
segs.forEach((s, k) => {
  if (k > 0) { const ty = trans[k], t0 = s.start - TR / 2; ev(t0, 'tr_' + ty); if (ty === 'walk') for (let i = 0; i < 4; i++) ev(t0 + i * .15, 'step'); }
  const st = s.start, c = cues(k);
  if (s.kind === 'sub') { ev(st + c.win, 'open'); ev(st + c.win + .3, 'cursor'); ev(st + c.tap, 'select'); ev(st + c.tap + .05, 'save'); return; }
  if (s.kind === 'final') { ev(st + c.win, 'open'); ev(st + c.big, 'fanfare'); ev(st + c.tap, 'select'); return; }
  const e = s.escena;
  switch (e.tipo) {
    case 'titulo': ev(st + c.icon, 'rise'); ev(st + c.land, 'sparkle'); ev(st + c.title - .1, 'open'); ev(st + c.title, 'letters', { n: Math.min(14, (e.texto_grande || (e.destacar || [''])[0]).length) }); break;
    case 'tarjetas': ev(st + c.win, 'open'); c.items.forEach(a => ev(st + a, 'cursor')); break;
    case 'cifra': ev(st + c.win, 'open'); ev(st + c.val, 'slots', { d: c.settle - c.val }); ev(st + c.settle, 'fanfare'); break;
    case 'grafica': ev(st + c.win, 'open'); ev(st + c.draw, 'draw', { d: 1.4 }); ev(st + c.lab, 'sparkle'); break;
    case 'comparar': ev(st + c.msg, 'battle'); ev(st + c.L, 'whoosh'); ev(st + c.R, 'whoosh'); ev(st + c.h1, 'hit'); ev(st + c.h2, 'hit'); break;
    case 'foto': ev(st + c.win, 'flash'); ev(st + c.lab, 'cursor'); break;
    case 'suscribete': ev(st + c.win, 'open'); ev(st + c.tap, 'select'); ev(st + c.tap + .05, 'save'); break;
    default: if (s.cap === 'cierre') { ev(st, 'open'); [0, 1.1, 2.2].forEach(d => ev(st + d, 'cursor')); ev(st + 2.4, 'save'); break; } ev(st + c.icon, 'rise'); ev(st + c.land, 'sparkle');
  }
});
// las épocas para la música
const ERAS = segs.map(s => ({ t0: s.start, t1: s.start + s.dur, era: eraOf(s) }));

window.render = frame;
window.grabLo = t => { frame(t); const b = new Uint8Array(out.u32.buffer); let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); };
window.grab = t => { frame(t); return cv.toDataURL('image/jpeg', .94).slice(23); };
window.BIG = [BW, BH]; window.DUR = D.dur; window.EV = EV; window.ERAS = ERAS; window.SIZE = [W, H];
window.READY = true;
