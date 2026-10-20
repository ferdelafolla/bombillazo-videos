// micro.js — vista de microscopio: un viaje continuo desde granos de sal hasta los átomos.
// s = aumento de la cámara (1 = se ven los granos; 400 = se ven los iones del cristal).
// agua = true: iones de sodio y cloro sueltos entre moléculas de agua (la sal disuelta).
import { W, H, C, T, hash, bayer, clamp } from './px.js';
import { text, textW, textOutlined } from './font.js';
import { atomos3D, HAY3D } from './three3d.js';
// en las escenas de microscopio los átomos se recogen aquí y se pintan como esferas 3D (Three.js)
let COL = null;
const CALIENTES = new Set([C.orange, C.amber, C.yellow, C.white]);

const A = 0.06;            // distancia entre iones en el mundo (unidades del mundo)
const VERT = H > W;
const CX = W / 2;
let CY = H / 2;   // se recoloca encima del cuadro de diálogo (ver micro())
// granos de sal alrededor del central (x, y, tamaño) — el central se agranda hasta llenar la vista
const GRANOS = [[0, 0, 60], [-120, -45, 38], [105, 35, 48], [-70, 75, 30], [150, -70, 34], [35, -95, 24], [-165, 40, 26], [70, 100, 22]];

function rectC(fb, x, y, w, h, c) {   // rectángulo recortado a la pantalla (los granos pueden medir miles de píxeles)
  const x0 = Math.max(0, Math.floor(x)), y0 = Math.max(0, Math.floor(y)), x1 = Math.min(W, Math.ceil(x + w)), y1 = Math.min(H, Math.ceil(y + h));
  for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) fb.px(xx, yy, c);
}
function grano(fb, gx, gy, sz, s, t, i) {
  const w = sz * s, x = CX + (gx - sz / 2) * s, y = CY + (gy - sz / 2) * s, d = Math.min(w * .22, 40);
  if (x > W || y + w < -d || x + w + d < 0 || y > H) return;
  // cara de arriba y cara lateral (perspectiva sencilla)
  for (let k = 0; k < d; k++) { const yy = Math.round(y - k); if (yy < 0 || yy >= H) continue; fb.hline(Math.max(0, Math.round(x + k)), Math.min(W - 1, Math.round(x + w + k)), yy, C.white); }
  for (let k = 0; k < d; k++) { const xx = Math.round(x + w + k); if (xx < 0 || xx >= W) continue; for (let yy = Math.max(0, Math.round(y - k)); yy < Math.min(H, Math.round(y + w - k)); yy++) fb.px(xx, yy, bayer(xx, yy) < .5 ? C.silver : C.steel); }
  rectC(fb, x, y, w, w, C.white);
  // brillo del cristal: trama azulada y destellos
  const x0 = Math.max(0, Math.floor(x)), y0 = Math.max(0, Math.floor(y)), x1 = Math.min(W, x + w), y1 = Math.min(H, y + w);
  for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) { const u = ((xx - x) + (yy - y)) / (2 * w); if (bayer(xx, yy) < .25 + .5 * u) fb.px(xx, yy, C.cyan); }
  if (w > 6) { fb.hline(Math.round(x + 2), Math.round(x + Math.min(w * .4, 30)), Math.round(y + 2), C.white); }
  if (Math.floor(t * 4 + i) % 5 === 0 && w > 4) { const sx = Math.round(x + w * .25), sy = Math.round(y + w * .2); fb.px(sx, sy - 2, C.white); fb.px(sx, sy + 2, C.white); fb.px(sx - 2, sy, C.white); fb.px(sx + 2, sy, C.white); }
}
function ion(fb, x, y, r, na, glow) {
  const R = Math.max(1, Math.round(r));
  if (R <= 1) { fb.px(x, y, na ? C.pink : C.lime); return; }
  fb.disc(x, y, R + 1, C.ink); fb.disc(x, y, R, na ? C.rose : C.green); fb.disc(x - Math.round(R * .2), y - Math.round(R * .2), Math.max(1, Math.round(R * .7)), na ? C.pink : C.lime);
  if (R > 3) fb.disc(x - Math.round(R * .4), y - Math.round(R * .4), Math.max(1, Math.round(R * .22)), C.white);
  if (glow && R > 6) text(fb, na ? '+' : '-', x - 2, y - 3, C.ink);
}
function agua(fb, x, y, r, ang) {   // molécula de agua: oxígeno rojo con dos hidrógenos blancos a 104°
  const R = Math.max(1, Math.round(r));
  for (const da of [-.91, .91]) { const hx = Math.round(x + Math.cos(ang + da) * R * 1.2), hy = Math.round(y + Math.sin(ang + da) * R * 1.2); fb.disc(hx, hy, Math.max(1, Math.round(R * .55)) + 1, C.ink); fb.disc(hx, hy, Math.max(1, Math.round(R * .55)), C.white); }
  fb.disc(x, y, R + 1, C.ink); fb.disc(x, y, R, C.red); if (R > 2) fb.px(x - 1, y - 1, C.orange);
}
function fmtMag(m) {
  const p = Math.pow(10, Math.floor(Math.log10(m)) - 1), v = Math.round(m / p) * p;
  return '×' + String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function micro(fb, s, t, conAgua = false, dlgY = H) {
  CY = VERT ? 122 : Math.round(dlgY / 2);
  const sp = A * s;                       // separación entre iones en píxeles
  const f = clamp((sp - 3) / 14, 0, 1);    // 0 = aún no se ven los átomos, 1 = átomos nítidos
  if (!conAgua) {
    // campo oscuro del microscopio con granos brillantes
    fb.rect(0, 0, W, H, C.night); fb.dither(0, 0, W, H, (x, y) => .12, C.night, C.navy);
    for (let i = GRANOS.length - 1; i >= 0; i--) grano(fb, ...GRANOS[i], s, t, i);
    if (f > 0) {   // dentro de la cara del grano central: la blancura se aparta y aparece la red de iones
      const c = GRANOS[0], x = CX + (c[0] - c[2] / 2) * s, y = CY + (c[1] - c[2] / 2) * s;
      const x0 = Math.max(0, Math.floor(x)), y0 = Math.max(0, Math.floor(y)), x1 = Math.min(W, x + c[2] * s), y1 = Math.min(H, y + c[2] * s);
      for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) if (bayer(xx, yy) < f) fb.px(xx, yy, bayer(xx + 1, yy) < .3 ? C.navy : C.night);
      const ox = CX - (c[0] - c[2] / 2) * 0, i0 = Math.floor((0 - CX) / sp) - 1, i1 = Math.ceil((W - CX) / sp) + 1, j0 = Math.floor((0 - CY) / sp) - 1, j1 = Math.ceil((H - CY) / sp) + 1;
      if (sp > 10) for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {   // enlaces de la red
        const X = Math.round(ox + i * sp), Y = Math.round(CY + j * sp);
        if (bayer(X, Y) < f) { fb.hline(X, Math.round(X + sp), Y, C.steel); fb.vline(X, Y, Math.round(Y + sp), C.steel); }
      }
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const na = ((i + j) & 1) === 0, v = Math.sin(t * 9 + i * 1.3 + j * .7) * .05 * sp;   // vibran con el calor
        const X = Math.round(ox + i * sp + v), Y = Math.round(CY + j * sp + Math.cos(t * 8 + i * .9 + j * 1.7) * .05 * sp);
        if (hash(i, j, 7) > f * 1.05) continue;   // van apareciendo poco a poco
        ion(fb, X, Y, (na ? .24 : .36) * sp * (.6 + .4 * f), na, f > .9);
      }
    }
  } else {
    // agua vista al microscopio: azul, con puntitos que se acercan y se convierten en moléculas
    fb.rect(0, 0, W, H, C.navy); fb.dither(0, 0, W, H, (x, y) => .25 + .1 * Math.sin((x + y) * .05 + t), C.navy, C.blue);
    if (f < 1) for (let i = 0; i < 480; i++) {   // puntitos a varias escalas: siempre hay algunos a la vista mientras se acerca
      const sc = Math.pow(5, -(i % 4)), wx = (hash(i, 1) - .5) * 400 * sc, wy = (hash(i, 2) - .5) * 260 * sc, X = Math.round(CX + wx * s + Math.sin(t * 2 + i) * 2), Y = Math.round(CY + wy * s + Math.cos(t * 2 + i) * 2);
      if (X >= 0 && Y >= 0 && X < W && Y < H && bayer(X, Y) >= f) fb.px(X, Y, hash(i, 3) < .2 ? C.lime : hash(i, 3) < .35 ? C.pink : C.cyan);
    }
    if (f > 0) {
      const g = sp * 1.6, i0 = Math.floor(-CX / g) - 1, i1 = Math.ceil((W - CX) / g) + 1, j0 = Math.floor(-CY / g) - 1, j1 = Math.ceil((H - CY) / g) + 1;
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        if (hash(i, j, 9) > f * 1.05) continue;
        const k = hash(i, j, 3), X = Math.round(CX + (i + (hash(i, j, 4) - .5) * .6) * g + Math.sin(t * 2.3 + i * 1.7 + j) * .18 * g), Y = Math.round(CY + (j + (hash(i, j, 5) - .5) * .6) * g + Math.cos(t * 2.1 + j * 1.3 + i) * .18 * g);
        if (k < .17) ion(fb, X, Y, .26 * sp, true, f > .9);
        else if (k < .34) ion(fb, X, Y, .36 * sp, false, f > .9);
        else agua(fb, X, Y, .22 * sp, t * 1.5 + k * 20);
      }
    }
  }
  // —— el microscopio: campo circular, retícula, aumento y etiquetas ——
  const R = VERT ? 80 : Math.round(Math.min(W, dlgY) * .46), R2 = R * R;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const dx = x - CX + .5, dy = y - CY + .5, d2 = dx * dx + dy * dy; if (d2 > R2) fb.px(x, y, d2 < (R + 2) * (R + 2) ? C.steel : C.ink); else if (d2 > (R - 6) * (R - 6) && bayer(x, y) < (Math.sqrt(d2) - R + 6) / 7) fb.px(x, y, C.ink); }
  for (let k = -R + 8; k < R - 8; k += 3) { fb.px(Math.round(CX + k), Math.round(CY), C.cyan); fb.px(Math.round(CX), Math.round(CY + k), C.cyan); }
  const mag = fmtMag(100 * Math.pow(1e5, Math.log(Math.max(1, s)) / Math.log(400)));
  const lab = 'MICROSCOPIO', vert = H > W;
  text(fb, lab, vert ? Math.round(CX - textW(lab) / 2) : 6, vert ? CY - R + 8 : 6, C.cyan, C.ink);
  textOutlined(fb, mag, vert ? Math.round(CX - textW(mag, 2) / 2) : W - 8 - textW(mag, 2), vert ? CY + R - 22 : 6, C.yellow, C.ink, 2);
  if (f > .85) {   // leyenda
    const L = conAgua ? [['NA+ SODIO', 'na'], ['CL- CLORO', 'cl'], ['H2O AGUA', 'h2o']] : [['NA+ SODIO', 'na'], ['CL- CLORO', 'cl']];
    const lx = vert ? 16 : 6, ly = vert ? CY - R + 22 : dlgY - 6 - L.length * 11;
    L.forEach(([s2, k], n) => {
      const y = ly + n * 11;
      if (k === 'h2o') { fb.disc(lx + 3, y + 3, 3, C.red); fb.px(lx, y + 6, C.white); fb.px(lx + 6, y + 6, C.white); }
      else { fb.disc(lx + 3, y + 3, 3, C.ink); fb.disc(lx + 3, y + 3, 2, k === 'na' ? C.pink : C.lime); }
      text(fb, s2.replace('NA', 'Na').replace('CL', 'Cl'), lx + 10, y, C.white, C.ink);
    });
  }
}

// —— escenas de microscopio con historia continua (reentrada de una cápsula) ——
// Una sola "película" por secuencia: el progreso global avanza de escena en escena sin saltos.
//   aire 0→1 · choque 1→2 · aprieta 2→3 · plasma 3→4      (el aire delante del escudo)
//   ablacion 0→.5 · ablacion2 .5→1                         (la superficie del escudo)
const ETAPA = { aire: 0, choque: 1, aprieta: 2, plasma: 3 };
const ease = x => x < .5 ? 2 * x * x : 1 - 2 * (1 - x) * (1 - x);
const cl01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
let RX = 80, RY = 80;
function marco(fb, R, mag, etiqueta, dlgY) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const dx = (x - CX + .5) / RX, dy = (y - CY + .5) / RY, d = Math.sqrt(dx * dx + dy * dy); if (d > 1) fb.px(x, y, d < 1 + 2 / RY ? C.steel : C.ink); else if (d > 1 - 6 / RY && bayer(x, y) < (d - 1 + 6 / RY) * RY / 7) fb.px(x, y, C.ink); }
  const vert = H > W;
  text(fb, 'MICROSCOPIO', vert ? Math.round(CX - textW('MICROSCOPIO') / 2) : 4, vert ? CY - R + 8 : 3, C.cyan, C.ink);
  textOutlined(fb, mag, vert ? Math.round(CX - textW(mag, 2) / 2) : W - 4 - textW(mag, 2), vert ? CY + R - 22 : 2, C.yellow, C.ink, 2);
  if (etiqueta) { const sc = !vert && textW(etiqueta, 2) < W - 24 ? 2 : 1, w = textW(etiqueta, sc); textOutlined(fb, etiqueta, Math.round(CX - w / 2), vert ? CY + R - 36 : dlgY - 8 - sc * 8, C.white, C.ink, sc); }
}
function leyenda(fb, items, dlgY, R) {
  const vert = H > W, lx = vert ? 16 : CX - RX + 26, ly = vert ? CY - R + 22 : CY - RY + 14;
  items.forEach(([s2, col], n) => { const y = ly + n * 11; fb.disc(lx + 2, y + 3, 2, col); fb.disc(lx + 6, y + 3, 2, col); text(fb, s2, lx + 12, y, C.white, C.ink); });
}
// mezcla de color "calor": de su color frío a naranja y luego blanco
const CAL = [C.orange, C.amber, C.yellow, C.white];
function calCol(base, h) { if (h < .2) return base; return CAL[Math.min(3, Math.floor((h - .2) / .8 * 4))]; }
function atomo(fb, x, y, r, c, z = 0) {
  if (COL) { COL.push({ x, y, z, r: r + .6, c, emis: CALIENTES.has(c) ? .55 : 0 }); return; }
  fb.disc(x, y, r + 1, C.ink); fb.disc(x, y, r, c); if (r > 2) fb.px(x - 1, y - 1, C.white);
}
function molecula(fb, x, y, ang, r, c, sep) {   // N2 / O2: dos átomos unidos; sep > 0 los separa (se rompen)
  const d = r * (1.1 + sep), dx = Math.cos(ang) * d, dy = Math.sin(ang) * d * .6, dz = Math.sin(ang) * .5;
  if (sep < .3 && !COL) fb.line(Math.round(x - dx), Math.round(y - dy), Math.round(x + dx), Math.round(y + dy), C.ink);
  if (COL) { COL.push({ x: x - dx, y: y - dy, z: -dz, r: r + .6, c, emis: CALIENTES.has(c) ? .55 : 0 }, { x: x + dx, y: y + dy, z: dz, r: r + .6, c, emis: CALIENTES.has(c) ? .55 : 0 }); return; }
  atomo(fb, Math.round(x - dx), Math.round(y - dy), r, c); atomo(fb, Math.round(x + dx), Math.round(y + dy), r, c);
}

function secAire(fb, g, t, R, dlgY) {
  // g ∈ [0,4]: progreso global de la secuencia del aire
  const heat = cl01((g - 2) / 1.6), plasma = cl01(g - 3);
  // fondo: noche alta que se va encendiendo
  fb.rect(0, 0, W, H, C.night); fb.dither(0, 0, W, H, (x, y) => .1 + .5 * heat * cl01(1 - (x - CX + RX) / (2 * RX)), C.night, plasma > .3 ? C.rose : C.plum);
  if (plasma > 0) fb.dither(0, 0, W, H, (x, y) => plasma * .45 * cl01(1 - (x - CX + RX * .6) / (1.4 * RX)), T, C.orange);
  const xw0 = CX - RX * .62;                                   // superficie del escudo
  const xw = g < 1 ? CX - RX * 1.6 + (xw0 - (CX - RX * 1.6)) * ease(cl01(g * 1.4 - .4)) : xw0;
  // el escudo: bloque gris oscuro de átomos de carbono a la izquierda
  if (xw > CX - RX - 2) { for (let y = Math.round(CY - RY); y < CY + RY; y++) for (let x = Math.round(CX - RX); x < xw; x++) fb.px(x, y, ((x >> 2) + (y >> 2)) % 2 ? C.dslate : C.slate); fb.vline(Math.round(xw), Math.round(CY - RY), Math.round(CY + RY), heat > .3 ? CAL[Math.min(3, Math.floor(heat * 3))] : C.steel); }
  if (HAY3D) COL = [];
  const N = 34, rows = 9, cols = 4, comp = 1 - .35 * cl01(g - 2);   // en "aprieta" el montón se comprime
  for (let i = 0; i < N; i++) {
    const hy = hash(i, 11), hx = hash(i, 12), N2 = hash(i, 13) < .78;   // el aire es casi 4/5 nitrógeno
    const base = N2 ? C.blue : C.red, r = VERT ? 2 : 3;
    let x, y, ang = t * (1 + hash(i, 14)) + i;
    const slot = i < rows * cols ? i : -1, sc = slot >= 0 ? Math.floor(slot / rows) : 0, sr = slot >= 0 ? slot % rows : 0;
    const slotX = xw + 7 + sc * (VERT ? 9 : 12) * comp, slotY = CY - RY * .78 + (sr + (sc % 2) * .5) * (RY * 1.56 / rows);
    const arr = 1 + (sc * rows + sr) / (rows * cols) * .85;    // cuándo llega cada molécula (dentro de "choque")
    // movimiento libre: deriva lenta antes del choque, rápida durante
    const vel = g < 1 ? 7 : 7 + 55 * cl01(g - 1);
    const xFree = CX + RX - ((hx * 2 * RX + t * vel) % (2 * RX)), yFree = CY + (hy - .5) * 1.7 * RY;
    if (slot < 0 || g < arr - .12) { x = xFree; y = yFree; if (slot >= 0 && g > 1) { const k = cl01((g - (arr - .12)) / .12); x = xFree; } }
    else { const k = ease(cl01((g - (arr - .12)) / .12)); x = slotX + (CX + RX - slotX) * (1 - k); y = slotY; }
    if (slot >= 0 && g >= arr) { x = slotX; y = slotY; }
    const jit = slot >= 0 && g >= arr ? (.6 + 2.8 * heat) : .4;
    x += Math.sin(t * 13 + i * 2.1) * jit; y += Math.cos(t * 11 + i * 1.7) * jit;
    const h = slot >= 0 && g >= arr ? heat * (1 - sc * .15) : heat * .3;
    const sep = plasma > 0 && slot >= 0 ? cl01((plasma - hash(i, 15) * .5) / .4) * 2.2 : 0;
    if (g >= 1 && g < 2 && (slot < 0 || g < arr)) for (let k = 1; k < 6; k++) fb.px(Math.round(x + k * 2), Math.round(y), C.steel);   // estela de velocidad
    molecula(fb, Math.round(x), Math.round(y), sep > 0 ? ang * .2 + i : ang, r, calCol(base, h), sep);
    if (sep > 1 && Math.floor(t * 10 + i) % 3 === 0) fb.px(Math.round(x), Math.round(y - 4), C.white);
  }
  if (COL) { atomos3D(fb, COL, W, H); COL = null; }
  // termómetro cuando aprieta
  if (g > 1.8) { const hx = CX + RX - (VERT ? 22 : 44), top = CY - RY * .6, hh = RY * 1.2, lvl = cl01((g - 1.8) / 1.8);
    fb.rect(hx - 1, top - 1, 6, hh + 2, C.ink); fb.rect(hx, top + hh * (1 - lvl), 4, hh * lvl, lvl > .7 ? C.white : lvl > .4 ? C.yellow : C.orange); fb.disc(hx + 2, top + hh + 4, 4, C.red); text(fb, 'CALOR', hx - 26, top - 2, C.yellow, C.ink); }
  const et = g < 1 ? 'CASI NO HAY AIRE' : g < 2 ? 'NO LES DA TIEMPO A APARTARSE' : g < 3 ? 'SE APRIETAN Y SE CALIENTAN' : '¡SE ROMPEN Y BRILLAN!';
  marco(fb, R, '×10.000.000', et, dlgY);
  if (g < 1.2) leyenda(fb, [['N2 NITRÓGENO', C.blue], ['O2 OXÍGENO', C.red]], dlgY, R);
  else if (xw > CX - RX) text(fb, 'ESCUDO', Math.round(Math.max(CX - RX + 10, xw - 34)), Math.round(CY - RY * .2), C.silver, C.ink);
}

function secEscudo(fb, g, t, R, dlgY) {
  // g ∈ [0,1]: el escudo se deshace átomo a átomo y cada trocito se lleva el calor
  fb.rect(0, 0, W, H, C.night); fb.dither(0, 0, W, H, (x, y) => .55 * cl01((x - CX + RX * .2) / (RX * 1.2)), C.night, C.orange);
  const sp = 8, cols = 9, rows = Math.ceil(2 * RY / sp) + 1, x0 = CX - RX * .55, y0 = CY - RY;
  const quita = g * 3.2;                                        // cuántas columnas se han ido
  if (HAY3D) COL = [];
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
    const bx = x0 + c * sp, by = y0 + r * sp + (c % 2) * sp / 2, front = cols - 1 - c;   // front 0 = la capa de fuera
    const tsuelta = (front + hash(c, r, 3) * .9) / 3.2;          // cuándo se suelta este átomo
    const hot = cl01(1 - front / 3) , frio = front > 4;
    if (g < tsuelta) { atomo(fb, Math.round(bx + Math.sin(t * 12 + r + c) * hot), Math.round(by), 3, frio ? C.steel : calCol(C.slate, .2 + hot * .9)); }
    else {  // se va volando hacia la derecha y hacia arriba, con su estela de calor
      const d = (g - tsuelta) * 3.2, x = bx + d * 70, y = by - d * 26 + Math.sin(t * 6 + r) * 3;
      if (x < CX + RX + 6) { for (let k = 1; k < 5; k++) fb.px(Math.round(x - k * 3), Math.round(y + k), k < 3 ? C.yellow : C.orange); atomo(fb, Math.round(x), Math.round(y), 3, C.amber); }
    }
  }
  // átomos de aire calientes golpeando la superficie
  for (let i = 0; i < 26; i++) { const x = CX + RX - ((hash(i, 21) * RX * 1.2 + t * 60) % (RX * 1.2)), y = CY + (hash(i, 22) - .5) * 1.8 * RY; atomo(fb, Math.round(x), Math.round(y), 2, Math.floor(t * 8 + i) % 2 ? C.white : C.yellow, hash(i, 23) - .5); }
  if (COL) { atomos3D(fb, COL, W, H); COL = null; }
  // lo de dentro, a salvo: termómetro interior que se queda bajo
  const tx = CX - RX * .55 - 14, top = CY - RY * .5, hh = RY; fb.rect(tx - 1, top - 1, 6, hh + 2, C.ink); fb.rect(tx, top + hh * .8, 4, hh * .2, C.cyan); fb.disc(tx + 2, top + hh + 4, 4, C.blue);
  text(fb, 'DENTRO', tx - 6, top - 12, C.cyan, C.ink);
  marco(fb, R, '×10.000.000', g < .5 ? 'EL ESCUDO SE DESHACE' : 'CADA TROCITO SE LLEVA EL CALOR', dlgY);
}


// —— granizo: gotas superenfriadas → se congelan sobre un granito de hielo → capas como una cebolla ——
//   gotas 0→1 · congela 1→2 · capas 2→3     (y "corte": la piedra partida para contar sus capas)
const GRAN = { gotas: 0, congela: 1, capas: 2 };
function fondoFrio(fb, t) {
  fb.rect(0, 0, W, H, C.navy); fb.dither(0, 0, W, H, (x, y) => .25 + .15 * Math.sin((x * .05 + y * .03) + t * .3), C.navy, C.dslate);
  for (let i = 0; i < 30; i++) { if (Math.floor(t * 3 + i) % 4) continue; const x = Math.round(hash(i, 31) * W), y = Math.round(hash(i, 32) * H); fb.px(x, y, C.white); fb.px(x - 1, y, C.cyan); fb.px(x + 1, y, C.cyan); }
}
function anillos(fb, cx, cy, R, n, t, nuevo) {
  // corte de la piedra: anillos alternos opacos (blanco) y transparentes (azul hielo), del centro hacia fuera
  for (let k = n; k >= 1; k--) { const r = Math.round(R * k / Math.max(n, 1)); fb.disc(cx, cy, r + 1, C.ink); fb.disc(cx, cy, r, k % 2 ? C.white : C.cyan); if (k % 2 === 0) fb.dither(cx - r, cy - r, 2 * r, 2 * r, (x, y) => ((x - cx) ** 2 + (y - cy) ** 2 < r * r && (x - cx) ** 2 + (y - cy) ** 2 > (R * (k - 1) / n) ** 2) ? .25 : 0, T, C.white); }
  fb.disc(cx, cy, Math.max(2, Math.round(R / Math.max(n, 1) * .6)), C.silver);   // el granito de hielo del principio
  if (nuevo > 0 && nuevo < 1) for (let a = 0; a < 6.283; a += .35) fb.px(Math.round(cx + Math.cos(a) * (R + 3 + nuevo * 6)), Math.round(cy + Math.sin(a) * (R + 3 + nuevo * 6)), C.white);
  fb.px(cx - Math.round(R * .5), cy - Math.round(R * .5), C.white);
}
function secGranizo(fb, g, t, R, dlgY) {
  fondoFrio(fb, t);
  if (HAY3D) COL = [];
  const Rg = 4 + 9 * cl01(g - 1);                                   // radio del granizo que crece
  const capas = g >= 2;
  const by = capas ? Math.sin((g - 2) * Math.PI * 6) * RY * .18 : 0;   // sube y baja con el viento
  const gx = CX, gy = CY + by;
  for (let i = 0; i < 40; i++) {
    const hy = hash(i, 41), hx = hash(i, 42), ci = 1 + hash(i, 43) * .9, a = hash(i, 44) * 6.283;
    let x = CX + (hx - .5) * 1.8 * RX + Math.sin(t * 1.3 + i) * 3, y = CY + RY - ((hy * 2 * RY + t * 14) % (2 * RY));
    let c = C.blue, r = 2.2;
    if (!capas && g > ci - .15) {   // va hacia el granito y se congela al tocarlo
      const k = ease(cl01((g - (ci - .15)) / .15)), tx = gx + Math.cos(a) * Rg, ty = gy + Math.sin(a) * Rg;
      x = x + (tx - x) * k; y = y + (ty - y) * k; if (g >= ci) { x = tx; y = ty; c = C.white; r = 2.6; }
    } else if (capas && i % 3 === 0) { x = gx + Math.cos(a + t) * (RY * .62 + 6); y = gy + Math.sin(a + t) * (RY * .62 + 6) * .7; }
    if (!capas || i % 3 === 0) atomo(fb, Math.round(x), Math.round(y), r, c, hash(i, 45) - .5);
  }
  if (!capas) atomo(fb, Math.round(gx), Math.round(gy), Math.round(Rg), g < 1 ? C.silver : C.white, 0);
  if (COL) { atomos3D(fb, COL, W, H); COL = null; }
  if (capas) {
    const n = 1 + Math.floor((g - 2) * 7), nuevo = ((g - 2) * 7) % 1;
    anillos(fb, Math.round(gx), Math.round(gy), Math.round(RY * .55), n, t, nuevo);
    const flecha = Math.cos((g - 2) * Math.PI * 6) > 0 ? '↑' : '↓';   // hacia dónde lo lleva el viento
    textOutlined(fb, Math.cos((g - 2) * Math.PI * 6) > 0 ? 'SUBE' : 'BAJA', Math.round(gx + RY * .7), Math.round(gy - 4), C.cyan, C.ink, 1);
  }
  if (g < 1) { const s2 = 'AGUA LÍQUIDA A -15 °C'; textOutlined(fb, s2, Math.round(CX - textW(s2) / 2), Math.round(CY - RY + 12), C.cyan, C.ink, 1); }
  const et = g < 1 ? 'GOTAS SIN CONGELAR' : g < 2 ? 'AL TOCAR EL HIELO, SE CONGELAN' : 'UNA CAPA EN CADA VIAJE';
  marco(fb, R, '×100', et, dlgY);
  if (g < 1.2) leyenda(fb, [['AGUA', C.blue], ['HIELO', C.white]], dlgY, R);
}
function secCorte(fb, u, t, R, dlgY) {
  fondoFrio(fb, t);
  const n = 9, Rr = Math.round(RY * .62), cx = Math.round(CX - RX * .15), cy = Math.round(CY);
  anillos(fb, cx, cy, Rr, n, t, 0);
  // se cuentan los anillos uno a uno, como los de un árbol
  const cuenta = Math.min(n, Math.floor(u * (n + 3)));
  for (let k = 1; k <= cuenta; k++) { const r = Math.round(Rr * (k - .5) / n), x = cx + r, y = cy; fb.px(x, y, C.red); }
  if (cuenta > 0) { const s2 = String(cuenta); textOutlined(fb, s2, Math.round(cx + Rr + 12), Math.round(cy - 8), C.yellow, C.ink, 2); text(fb, cuenta === 1 ? 'CAPA' : 'CAPAS', Math.round(cx + Rr + 12), Math.round(cy + 10), C.white, C.ink); }
  fb.line(cx, cy, cx + Rr + 8, cy, C.red);
  marco(fb, R, '×2', 'SE PUEDEN CONTAR SUS CAPAS', dlgY);
}

export function microEscena(fb, modo, u, t, dlgY = H) {
  CY = VERT ? 122 : Math.round(dlgY / 2);
  const R = VERT ? 80 : Math.round(Math.min(W, dlgY) * .46);
  RX = VERT ? 80 : Math.round(W * .47); RY = VERT ? 80 : Math.round(dlgY * .47);
  if (modo in ETAPA) secAire(fb, ETAPA[modo] + u, t, R, dlgY);
  else if (modo in GRAN) secGranizo(fb, GRAN[modo] + u, t, R, dlgY);
  else if (modo === 'corte') secCorte(fb, u, t, R, dlgY);
  else if (modo === 'ablacion' || modo === 'ablacion2') secEscudo(fb, (modo === 'ablacion' ? 0 : .5) + u * .5, t, R, dlgY);
  else micro(fb, 400, t, false, dlgY);
}
