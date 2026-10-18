// chispa.js — Chispa en píxeles: bombilla amarilla redonda, ojos cerrados en arco, nariz "<",
// sonrisa roja que se abre al hablar, casquillo a rayas y un brazo que saluda. Todo procedural (índices de paleta).
import { C, bayer } from './px.js';

// Cabeza genérica (vale para el sprite y para el retrato): centro cx,cy, radio r
export function head(fb, cx, cy, r, { talk = 0, blink = false, surprise = 0 } = {}) {
  fb.disc(cx, cy, r + 1, C.ink);
  fb.disc(cx, cy, r, C.yellow);
  // sombra abajo a la derecha (luz arriba a la izquierda), con trama
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    if (x * x + y * y > r * r) continue;
    const k = (x + y) / (r * 1.4);
    if (k > .78) fb.px(cx + x, cy + y, C.amber);
    else if (k > .5 && bayer(cx + x, cy + y) < (k - .5) / .3) fb.px(cx + x, cy + y, C.amber);
  }
  const s = r / 10, z = Math.max(1, Math.round(s)), P = (x, y, c) => fb.rect(Math.round(cx + x * s), Math.round(cy + y * s), z, z, c);
  // brillo
  P(-6, -6, C.white); P(-5, -6, C.white); P(-6, -5, C.white);
  // ojos: arcos cerrados (o abiertos con sorpresa)
  for (const ex of [-4, 3]) {
    if (blink) { for (let i = 0; i < 3; i++) P(ex + i, -1, C.ink); }
    else if (surprise) { P(ex + 1, -2, C.ink); P(ex + 1, -1, C.ink); }
    else { P(ex, -2, C.ink); P(ex + 1, -1, C.ink); P(ex + 2, -2, C.ink); }
  }
  // nariz "<"
  P(1, 0, C.ink); P(0, 1, C.ink); P(1, 2, C.ink);
  // boca
  if (talk > .15) {
    const h = talk > .55 ? 3 : 2;
    for (let y = 0; y < h; y++) for (let x = -3; x <= 3; x++) if (!(y === h - 1 && Math.abs(x) === 3)) P(x, 4 + y, y === 0 ? C.red : C.crimson);
  } else {
    P(-4, 4, C.red); for (let x = -3; x <= 3; x++) P(x, 5, C.red); P(4, 4, C.red);
  }
}

// Sprite entero: x = centro, floor = línea del suelo (base del casquillo). s = escala entera.
// o: { talk 0..1, t (s), wave 0..1, hop 0..1 (salto al andar), dir }
export function chispa(fb, x, floor, o = {}) {
  const t = o.t || 0, s = o.s || 1;
  const bob = Math.floor(t * 2.4) % 2 === 0 ? 0 : 1;
  const hop = Math.round((o.hop || 0) * 4);
  const y0 = floor - hop * s;
  const R = (dx, dy, w, h, c) => fb.rect(x + dx * s, y0 + dy * s, w * s, h * s, c);
  // sombra en el suelo
  for (let i = -6; i <= 6; i++) if (Math.abs(i) < 6 - hop) fb.px(x + i * s, floor + 1, C.ink);
  // casquillo a rayas
  R(-6, -9, 12, 9, C.ink);
  R(-5, -8, 10, 7, C.amber);
  for (const yy of [-7, -5, -3]) R(-5, yy, 10, 1, C.dbrown);
  R(-4, -1, 8, 1, C.ink);
  // brazo (detrás de la cabeza a la derecha): saluda si wave
  const w = o.wave || 0, ang = w ? Math.sin(t * 12) * .5 - .9 : -.35;
  const ax = x + 9 * s, ay = y0 - (16 + bob) * s;
  for (let i = 0; i <= 7 * s; i++) {
    const px = Math.round(ax + Math.cos(ang) * i), py = Math.round(ay + Math.sin(ang) * i);
    fb.rect(px - s, py - s, 3 * s, 3 * s, C.ink);
  }
  for (let i = 1; i <= 6 * s; i++) {
    const px = Math.round(ax + Math.cos(ang) * i), py = Math.round(ay + Math.sin(ang) * i);
    fb.rect(px, py, s, s, C.yellow);
  }
  // cabeza
  const blink = (t % 3.3) < .12;
  head(fb, x, y0 - (19 + bob) * s, 10 * s, { talk: o.talk || 0, blink, surprise: o.surprise || 0 });
}

// Retrato 32×32 para el cuadro de diálogo
export function portrait(fb, x, y, o = {}) {
  fb.gradV(x, y, 32, 32, [C.navy, C.night]);
  head(fb, x + 16, y + 17, 13, { talk: o.talk || 0, blink: ((o.t || 0) % 3.3) < .12 });
}
