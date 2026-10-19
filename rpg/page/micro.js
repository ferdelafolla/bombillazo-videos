// micro.js — vista de microscopio: un viaje continuo desde granos de sal hasta los átomos.
// s = aumento de la cámara (1 = se ven los granos; 400 = se ven los iones del cristal).
// agua = true: iones de sodio y cloro sueltos entre moléculas de agua (la sal disuelta).
import { W, H, C, hash, bayer, clamp } from './px.js';
import { text, textW, textOutlined } from './font.js';

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
