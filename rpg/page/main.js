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
const fb = new FB(), out = makeOut(document.getElementById('c'));
const bufA = new Uint32Array(W * H), bufB = new Uint32Array(W * H);

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
const DENTRO = ['walk', 'slide', 'mosaic', 'iris', 'walk', 'thumb'];
const ENTRE = ['swirl', 'door', 'whip', 'thumb', 'iris', 'mosaic'];
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
function dialogo(s, lt, th) {
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
function hud(s, th) {
  const lug = NOMBRE[lugarOf(s)], a = 'CHISPAZO', w = textW(a) + textW(lug) + 22;
  win(fb, 4, L.hud, w, 15, th.skin);
  text(fb, a, 10, L.hud + 4, th.skin === 'gb' ? GBI[0] : C.yellow, th.sh);
  text(fb, lug, 16 + textW(a), L.hud + 4, th.skin === 'gb' ? GBI[1] : C.silver, th.sh);
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

function contenido(s, lt, th) {
  const e = s.escena, A = L.area, cx = A.x + A.w / 2;
  const dy = slideIn(lt, 0);
  switch (e.tipo) {
    case 'titulo': {
      const ic = iconSprite(e.icono || 'bombilla', VERT ? 60 : 52, clamp((lt - .1) / 1.2, 0, 1));
      const tt = e.texto_grande || limpiar((e.destacar || [''])[0]);
      fb.blit(ic, Math.round(cx - ic.w / 2), A.y + 4 + dy);
      if (lt > .6) { const nl = wrap(tt, (A.w - 16) / 2).length, two = nl > 1, w = two ? A.w : Math.min(A.w, textW(tt, 2) + 20); win(fb, Math.round(cx - w / 2), A.y + ic.h + 10, w, two ? 50 : 30, th.skin); bigTitle(tt, cx, A.y + ic.h + 18, A.w - 16, titleCol(th)); }
      break;
    }
    case 'tarjetas': {
      const it = e.items || [], rowH = 15, h = 14 + it.length * rowH + (e.icono ? 0 : 0);
      const w = Math.min(A.w, Math.max(...it.map(x => textW(x))) + 40);
      const x = Math.round(cx - w / 2), y = A.y + Math.round((A.h - h) / 2) + dy;
      win(fb, x, y, w, h, th.skin);
      let cur = -1;
      it.forEach((s2, i) => { const at = .45 + i * .38; if (lt < at) return; cur = i; text(fb, s2, x + 20, y + 9 + i * rowH, th.skin === 'snes' ? TARJ[i % TARJ.length] : th.txt, th.sh); });
      if (cur >= 0) hand(fb, x + 5, y + 9 + cur * rowH, lt, true);
      if (e.icono) { const ic = iconSprite(e.icono, 26, clamp(lt / .8, 0, 1)); fb.blit(ic, x + w - 14, y - 14); }
      break;
    }
    case 'cifra': {
      const val = e.valor || '', sc = textW(val, 3) < A.w - 20 ? 3 : textW(val, 2) < A.w - 20 ? 2 : 1;
      const ic = e.icono ? iconSprite(e.icono, 30, clamp(lt / .8, 0, 1)) : null;
      const w = Math.min(A.w, Math.max(textW(val, sc), textW(e.etiqueta || '')) + 24), h = 22 + sc * 8 + (e.etiqueta ? 14 : 0);
      const x = Math.round(cx - w / 2), y = A.y + (ic ? 30 : 16) + dy;
      if (ic) fb.blit(ic, Math.round(cx - 15), y - 32 + Math.round(Math.sin(lt * 4) * 1));
      win(fb, x, y, w, h, th.skin);
      if (lt > .3) { const n = Math.min(val.length, Math.floor((lt - .3) * 24)); textOutlined(fb, val.slice(0, n), Math.round(cx - textW(val, sc) / 2), y + 8, titleCol(th), C.ink, sc); }
      if (e.etiqueta && lt > 1.0) centerText(e.etiqueta, y + 12 + sc * 8, th.skin === 'snes' ? C.cyan : th.txt, th.sh, 1, x, w);
      if (lt > .3 && lt < 1.6) for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + lt * 3, r = 10 + (lt - .3) * 40; fb.px(Math.round(cx + Math.cos(a) * r * 1.6), Math.round(y + 14 + Math.sin(a) * r * .6), th.skin === 'gb' ? GBI[3] : C.yellow); }
      break;
    }
    case 'grafica': {
      const x = A.x + 6, y = A.y + 6 + dy, w = A.w - 12, h = A.h - 12;
      win(fb, x, y, w, h, th.skin);
      const gx = x + 10, gy = y + 8, gw = w - 20, gh = h - 18;
      fb.vline(gx, gy, gy + gh, th.txt); fb.hline(gx, gx + gw, gy + gh, th.txt);
      const P = PUNTOS[e.forma || 'sube'], pr = clamp((lt - .4) / 1.4, 0, 1);
      const pts = []; for (let i = 0; i <= 80; i++) { const u = i / 80; if (u > pr) break; let j = 0; while (j < P.length - 2 && P[j + 1][0] < u) j++; const [a0, b0] = P[j], [a1, b1] = P[j + 1]; const f = (u - a0) / (a1 - a0); const v = b0 + (b1 - b0) * eio(clamp(f, 0, 1)); pts.push([gx + 1 + u * (gw - 2), gy + v * gh]); }
      for (const [px, py] of pts) for (let yy = Math.round(py) + 2; yy < gy + gh; yy++) if (bayer(Math.round(px), yy) < .4) fb.px(Math.round(px), yy, th.skin === 'snes' ? C.blue : th.dim);
      for (let i = 1; i < pts.length; i++) { fb.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], th.skin === 'gb' ? GBI[0] : C.red); fb.line(pts[i - 1][0], pts[i - 1][1] + 1, pts[i][0], pts[i][1] + 1, th.skin === 'gb' ? GBI[0] : C.red); }
      const et = e.etiquetas || [];
      if (et[1]) { for (let xx = gx; xx < gx + gw; xx += 4) fb.hline(xx, xx + 1, gy + gh * .45, th.skin === 'snes' ? C.cyan : th.txt); text(fb, et[1], gx + 4, gy + gh * .45 + 3, th.skin === 'snes' ? C.cyan : th.txt, th.sh); }
      if (et[0] && pr >= 1) { const [px, py] = pts[pts.length - 1]; const s2 = et[0], tw = textW(s2) + 8; const bx = clamp(Math.round(px - tw - 2), gx + 2, gx + gw - tw), by = clamp(Math.round(py - 16), gy, gy + gh - 12); win(fb, bx, by, tw, 13, th.skin); text(fb, s2, bx + 4, by + 3, th.hi, th.sh); }
      if (pts.length) { const [px, py] = pts[pts.length - 1]; fb.disc(Math.round(px), Math.round(py), 2, th.skin === 'gb' ? GBI[0] : C.yellow); }
      break;
    }
    case 'comparar': {
      // combate: dos bandos con barra de vida; el mensaje de batalla arriba
      const bw = Math.round((A.w - 30) / 2), bh = 44, y = A.y + 26 + dy;
      const msg = '¡COMBATE!'; const mw = textW(msg) + 20; win(fb, Math.round(cx - mw / 2), A.y + 2, mw, 16, th.skin); text(fb, msg.slice(0, Math.floor(lt * 30)), Math.round(cx - textW(msg) / 2), A.y + 6, th.txt, th.sh);
      [[e.izq, A.x + 4, .45, C.blue], [e.der, A.x + A.w - 4 - bw, 1.05, C.red]].forEach(([nm, x, at, col], i) => {
        if (lt < at) return; const sh = lt < at + .2 ? (Math.floor(lt * 24) % 2 ? 2 : -2) : 0;
        win(fb, x + sh, y, bw, bh, th.skin);
        const s2 = nm || ''; const sc = textW(s2, 2) < bw - 10 ? 2 : 1;
        textOutlined(fb, s2, Math.round(x + sh + (bw - textW(s2, sc)) / 2), y + 8, th.skin === 'snes' ? (y2 => i ? C.pink : C.cyan) : th.txt, C.ink, sc);
        const hp = 1 - .35 * ss(at + .5, at + 1.5, lt) * (i ? 1 : .6);
        fb.rect(x + sh + 8, y + bh - 12, bw - 16, 5, C.ink); fb.rect(x + sh + 9, y + bh - 11, Math.round((bw - 18) * hp), 3, th.skin === 'snes' ? (hp > .5 ? C.lime : C.amber) : th.txt);
        text(fb, 'HP', x + sh + 8, y + bh - 22, th.dim, null);
      });
      if (lt > .6) textOutlined(fb, 'VS', Math.round(cx - textW('VS', 2) / 2), y + 14, th.skin === 'snes' ? C.yellow : th.txt, C.ink, 2);
      break;
    }
    case 'foto': {
      const fw = VERT ? A.w : A.w - 6, fh = VERT ? 96 : A.h - 26, x = Math.round(cx - fw / 2), y = A.y + 14 + dy;
      win(fb, x - 4, y - 4, fw + 8, fh + 22, th.skin);
      const pos = e.encuadre ? parseFloat(e.encuadre.split(' ')[1]) / 100 : .5;
      fb.blit(photoSprite(e.foto, fw, fh, pos, 1 + .08 * clamp(lt / Math.max(1, s.dur), 0, 1)), x, y);
      const cred = (e.credito || '').replace(/^(Foto|Retrato|Imagen): /, '').replace(', vía Wikimedia Commons', '').replace('dominio público', 'dom. público').replace(' (Black Marble)', '');
      text(fb, cred, x + 2, y + fh + 5, th.dim, null);
      if (e.etiqueta && lt > .5) { const tw = textW(e.etiqueta) + 14; win(fb, Math.round(cx - tw / 2), y - 16, tw, 15, th.skin); text(fb, e.etiqueta, Math.round(cx - textW(e.etiqueta) / 2), y - 12, th.hi, th.sh); }
      break;
    }
    case 'suscribete': {
      menuSub(lt, s.vozDur * .55, th, '¿GUARDAR PARTIDA?');
      break;
    }
    default: {   // icono: objeto sobre un pedestal con destellos
      if (s.cap === 'cierre') { guardado(lt, th); break; }
      const sz = VERT ? 76 : 70, ic = iconSprite(e.icono || 'bombilla', sz, clamp((lt - .1) / 1.3, 0, 1));
      const y = A.y + 2 + Math.round(Math.sin(lt * 2.4) * 1.5) + dy;
      fb.rect(Math.round(cx - 24), A.y + A.h - 10, 48, 6, th.skin === 'gb' ? GBI[1] : C.slate); fb.hline(Math.round(cx - 24), Math.round(cx + 23), A.y + A.h - 10, th.skin === 'gb' ? GBI[0] : C.ink);
      fb.blit(ic, Math.round(cx - sz / 2), y);
      for (let i = 0; i < 4; i++) { const ph = (lt * 1.3 + i * .25) % 1; if (ph < .5) { const sx = Math.round(cx + (hash(i, 1) - .5) * sz * 1.2), sy = Math.round(y + hash(i, 2) * sz); fb.px(sx, sy - 1, C.white); fb.px(sx - 1, sy, C.white); fb.px(sx + 1, sy, C.white); fb.px(sx, sy + 1, C.white); } }
    }
  }
}

// menú de suscripción (pausa a mitad y cierre)
function menuSub(lt, tap, th, titulo) {
  const A = L.area, w = Math.min(A.w, 150), x = Math.round(A.x + A.w / 2 - w / 2), y = A.y + 8;
  win(fb, x, y, w, 52, th.skin);
  text(fb, titulo, x + Math.round((w - textW(titulo)) / 2), y + 8, th.txt, th.sh);
  const done = lt >= tap;
  const op = done ? 'SUSCRITO ✓' : 'SUSCRÍBETE';
  text(fb, op, x + 26, y + 24, done ? C.lime : C.yellow, th.sh);
  text(fb, 'SEGUIR JUGANDO', x + 26, y + 37, th.dim, th.sh);
  hand(fb, x + 10, y + 24, lt, !done);
  if (done && lt < tap + .8) for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283, r = 8 + (lt - tap) * 60; fb.px(Math.round(x + 50 + Math.cos(a) * r), Math.round(y + 27 + Math.sin(a) * r * .6), C.yellow); }
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
function renderSeg(k, t) {
  const s = segs[k], lt = t - s.start, th = TEMA[eraOf(s)];
  if (s.kind === 'sub') {
    LUGARES.puerta(fb, camOf(k), t);
    chispa(fb, VERT ? 90 : 56, FLOOR, { t, s: 2, wave: 1, talk: ampAt(s, lt) });
    menuSub(lt, s.dur * .62, th, '¿QUIERES SABER MÁS?');
    return LUT.full;
  }
  if (s.kind === 'final') {
    LUGARES.puerta(fb, camOf(k), t);
    const A = L.area, rem = s.remate || '¿QUIERES VER MÁS?', w = A.w;
    win(fb, A.x, A.y, w, 30, th.skin); const ls = wrap(rem, w - 12); ls.slice(0, 2).forEach((ln, i) => centerText(ln, A.y + 6 + i * 10, C.pink, th.sh, 1, A.x, w));
    const t2 = 'VÍDEO COMPLETO', t3 = 'EN EL CANAL';
    const nl = wrap(t2, (w - 10) / 2).length, hh = nl * 20 + 22;
    if (lt > .4) { win(fb, A.x, A.y + 36, w, hh, th.skin); bigTitle(t2, A.x + w / 2, A.y + 43, w - 10, titleCol(th)); centerText(t3, A.y + 36 + hh - 14, C.cyan, th.sh, 1, A.x, w); }
    if (lt > 1.2) { const op = lt > s.dur - .6 ? 'SUSCRITO ✓' : '▶ CONTINUAR'; centerText(op, A.y + 44 + hh, C.yellow, th.sh, 1, A.x, w); }
    chispa(fb, VERT ? 90 : L.chx, FLOOR, { t, wave: 1, talk: ampAt(s, lt) });
    return LUT.full;
  }
  LUGARES[lugarOf(s)](fb, camOf(k) + Math.round(lt * 6), t);
  const e = s.escena;
  const sub = e.tipo === 'suscribete';
  chispa(fb, sub ? (VERT ? 90 : 56) : L.chx, FLOOR, { t, s: sub ? 2 : 1, talk: ampAt(s, lt), wave: sub ? 1 : 0 });
  contenido(s, lt, th);
  dialogo(s, lt, th);
  hud(s, th);
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
  // ¿estamos en una transición?
  let a = -1, b = -1, p = 0;
  if (k > 0 && t < segs[k].start + TR / 2) { a = k - 1; b = k; p = (t - (segs[k].start - TR / 2)) / TR; }
  else if (k + 1 < segs.length && t > segs[k + 1].start - TR / 2) { a = k; b = k + 1; p = (t - (segs[k + 1].start - TR / 2)) / TR; }
  if (a < 0) {
    fb.clear(C.ink); const lut = renderSeg(k, t);
    let Lx = lut; if (t < .3) Lx = darken(lut, 1 - t / .3); if (t > D.dur - .4) Lx = darken(lut, (t - (D.dur - .4)) / .4);
    out.present(fb, Lx); out.show(); return;
  }
  const ty = trans[b];
  if (ty === 'era') {   // caída de paleta por pasos (no alpha): oscurece la época vieja y aclara la nueva
    const src = p < .5 ? a : b; fb.clear(C.ink); const lut = renderSeg(src, t);
    out.present(fb, darken(lut, p < .5 ? p * 2 : (1 - p) * 2)); out.show(); return;
  }
  fb.clear(C.ink); out.present(fb, renderSeg(a, t)); bufA.set(out.u32);
  fb.clear(C.ink); out.present(fb, renderSeg(b, t)); bufB.set(out.u32);
  out.post(() => compose(ty, clamp(p, 0, 1), b)); out.show();
}

// —— eventos de sonido (para la mezcla): transiciones, ventanas, cursores, fanfarrias, golpes ——
const EV = [];
const ev = (t, type, o = {}) => { if (t >= 0 && t <= D.dur) EV.push({ t: +t.toFixed(3), type, ...o }); };
segs.forEach((s, k) => {
  if (k > 0) { const ty = trans[k], t0 = s.start - TR / 2; ev(t0, 'tr_' + ty); if (ty === 'walk') for (let i = 0; i < 4; i++) ev(t0 + i * .15, 'step'); }
  const st = s.start;
  if (s.kind === 'sub') { ev(st + .2, 'open'); ev(st + .6, 'cursor'); ev(st + s.dur * .62, 'select'); ev(st + s.dur * .62 + .05, 'save'); return; }
  if (s.kind === 'final') { ev(st + .4, 'fanfare'); ev(st + s.dur - .6, 'select'); return; }
  const e = s.escena;
  switch (e.tipo) {
    case 'titulo': ev(st + .1, 'draw', { d: 1.1 }); ev(st + .6, 'open'); break;
    case 'tarjetas': ev(st, 'open'); (e.items || []).forEach((_, i) => ev(st + .45 + i * .38, 'cursor')); break;
    case 'cifra': ev(st + .3, 'fanfare'); break;
    case 'grafica': ev(st, 'open'); ev(st + .4, 'draw', { d: 1.4 }); break;
    case 'comparar': ev(st, 'battle'); ev(st + .45, 'hit'); ev(st + 1.05, 'hit'); break;
    case 'foto': ev(st, 'open'); ev(st + .5, 'cursor'); break;
    case 'suscribete': ev(st + .3, 'open'); ev(st + s.vozDur * .55, 'select'); ev(st + s.vozDur * .55 + .05, 'save'); break;
    default: if (s.cap === 'cierre') { ev(st, 'open'); [0, 1.1, 2.2].forEach(d => ev(st + d, 'cursor')); ev(st + 2.4, 'save'); break; } ev(st + .1, 'draw', { d: 1.2 }); ev(st + 1.3, 'sparkle');
  }
});
// las épocas para la música
const ERAS = segs.map(s => ({ t0: s.start, t1: s.start + s.dur, era: eraOf(s) }));

window.render = frame;
window.grab = t => { frame(t); const b = new Uint8Array(out.u32.buffer); let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); };
window.DUR = D.dur; window.EV = EV; window.ERAS = ERAS; window.SIZE = [W, H];
window.READY = true;
