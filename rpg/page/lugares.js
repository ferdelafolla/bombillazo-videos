// lugares.js — escenarios en parallax (capas que se mueven a distinta velocidad, siempre en píxeles enteros).
// Cada capítulo del vídeo vive en un lugar; la heroína (Chispa) viaja de uno a otro.
import { W, H, C, bayer, hash } from './px.js';
import { text } from './font.js';

export const VERT = H > W;
export const FLOOR = VERT ? 205 : 128;

const sky = (fb, cols, h = FLOOR) => fb.gradV(0, 0, W, h, cols);
const layer = (cam, f) => Math.round(cam * f);
// recorre "ranuras" del mundo visibles en pantalla para una capa con factor f
function slots(cam, f, slot, fn) {
  const o = layer(cam, f), i0 = Math.floor(o / slot) - 1, i1 = Math.ceil((o + W) / slot) + 1;
  for (let i = i0; i <= i1; i++) fn(i, i * slot - o);
}
function stars(fb, t, n = 40, hmax = FLOOR - 40) {
  for (let i = 0; i < n; i++) {
    const x = Math.floor(hash(i, 3) * W), y = Math.floor(hash(i, 7) * hmax);
    if (hash(i, Math.floor(t * 2 + i)) > .15) fb.px(x, y, hash(i, 9) > .7 ? C.yellow : C.white);
  }
}
function ground(fb, cam, top, bot, line, f = 1, tile = 16) {
  fb.rect(0, top, W, H - top, top === FLOOR ? bot : bot);
  fb.hline(0, W - 1, top, line);
  const o = layer(cam, f);
  for (let x = -((o % tile) + tile) % tile; x < W; x += tile) fb.vline(x, top + 1, Math.min(H - 1, top + 6), line);
}

// —— HOY: ciudad al atardecer, centros de datos en el horizonte ——
function hoy(fb, cam, t) {
  sky(fb, [C.night, C.navy, C.plum, C.rose, C.orange]);
  stars(fb, t, 30, FLOOR * .45);
  // sol bajo
  fb.disc(Math.round(W * .72 - layer(cam, .05)), FLOOR - 26, 13, C.amber); fb.disc(Math.round(W * .72 - layer(cam, .05)), FLOOR - 26, 10, C.yellow);
  slots(cam, .25, 22, (i, x) => {
    const h = 24 + Math.floor(hash(i, 1) * 46), w = 14 + Math.floor(hash(i, 2) * 8);
    fb.rect(x, FLOOR - 8 - h, w, h + 8, C.dslate);
    for (let wy = FLOOR - 4 - h; wy < FLOOR - 10; wy += 5) for (let wx = x + 2; wx < x + w - 2; wx += 4) if (hash(i * 31 + wx, wy) > .55) fb.px(wx, wy, C.amber);
  });
  slots(cam, .55, 70, (i, x) => {
    if (hash(i, 5) > .5) {   // centro de datos
      fb.rect(x, FLOOR - 34, 54, 34, C.slate); fb.rect(x, FLOOR - 36, 54, 2, C.ink);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 9; c++) fb.px(x + 4 + c * 6, FLOOR - 30 + r * 7, (hash(i * 9 + c, r + Math.floor(t * 3)) > .4) ? C.cyan : C.teal);
      fb.vline(x + 44, FLOOR - 52, FLOOR - 36, C.ink); fb.px(x + 44, FLOOR - 53, Math.floor(t * 2) % 2 ? C.red : C.crimson);
    } else {
      const h = 40 + Math.floor(hash(i, 6) * 30);
      fb.rect(x + 8, FLOOR - h, 26, h, C.dslate); fb.rect(x + 8, FLOOR - h, 26, 2, C.ink);
      for (let wy = FLOOR - h + 5; wy < FLOOR - 4; wy += 6) for (let wx = x + 11; wx < x + 32; wx += 5) fb.rect(wx, wy, 2, 3, hash(wx, wy) > .5 ? C.yellow : C.night);
    }
  });
  ground(fb, cam, FLOOR, C.slate, C.ink, 1);
  fb.rect(0, FLOOR + 6, W, H, C.dslate);
}

// —— MERCADO: plaza del pueblo de día ——
function mercado(fb, cam, t) {
  sky(fb, [C.blue, C.blue, C.cyan]);
  slots(cam, .1, 90, (i, x) => { const y = 14 + Math.floor(hash(i, 2) * 30); for (const [dx, r] of [[0, 7], [9, 9], [19, 6]]) fb.disc(x + dx + Math.round(t * 2) % 90, y, r, C.white); });
  slots(cam, .4, 44, (i, x) => {
    const h = 34 + Math.floor(hash(i, 3) * 20);
    fb.rect(x + 2, FLOOR - h, 38, h, hash(i, 4) > .5 ? C.sand : C.tan); fb.rect(x + 2, FLOOR - h, 38, 1, C.ink);
    for (let k = 0; k < 12; k++) fb.hline(x + 2 + k, x + 39 - k, FLOOR - h - k, k < 1 ? C.ink : C.crimson);
    fb.rect(x + 16, FLOOR - 14, 9, 14, C.dbrown); fb.rect(x + 6, FLOOR - h + 8, 6, 6, C.navy); fb.rect(x + 29, FLOOR - h + 8, 6, 6, C.navy);
  });
  slots(cam, .8, 64, (i, x) => {   // puestos con toldo a rayas
    if (hash(i, 8) < .45) return;
    for (let s = 0; s < 6; s++) fb.rect(x + s * 6, FLOOR - 26, 6, 7, s % 2 ? C.white : (hash(i, 9) > .5 ? C.red : C.green));
    fb.rect(x, FLOOR - 19, 36, 2, C.ink); fb.vline(x + 1, FLOOR - 19, FLOOR, C.dbrown); fb.vline(x + 34, FLOOR - 19, FLOOR, C.dbrown);
    fb.rect(x + 3, FLOOR - 10, 30, 10, C.brown); for (let k = 0; k < 5; k++) fb.disc(x + 7 + k * 6, FLOOR - 12, 2, [C.red, C.orange, C.lime, C.yellow, C.red][k]);
  });
  ground(fb, cam, FLOOR, C.tan, C.brown, 1, 10);
  fb.dither(0, FLOOR + 7, W, H - FLOOR - 7, (x, y) => .35, C.tan, C.clay);
}

// —— LONDRES 1720: puerto con barcos de vela (se ve en 4 tonos) ——
function londres(fb, cam, t) {
  sky(fb, [C.silver, C.white, C.white], FLOOR - 26);
  slots(cam, .2, 40, (i, x) => {   // casas con hastiales
    const h = 26 + Math.floor(hash(i, 3) * 22);
    fb.rect(x + 4, FLOOR - 26 - h, 30, h, C.steel);
    for (let k = 0; k < 15; k++) fb.hline(x + 4 + k, x + 33 - k, FLOOR - 26 - h - k, C.slate);
    for (let wy = FLOOR - 22 - h; wy < FLOOR - 30; wy += 7) { fb.rect(x + 9, wy, 4, 4, C.dslate); fb.rect(x + 24, wy, 4, 4, C.dslate); }
  });
  // la "casa de la compañía": edificio con columnas
  const bx = Math.round(W * .62 - layer(cam, .2));
  fb.rect(bx, FLOOR - 70, 60, 44, C.white); for (let k = 0; k < 14; k++) fb.hline(bx - 2 + k * 2, bx + 61 - k * 2, FLOOR - 70 - k, C.steel);
  for (let c = 0; c < 6; c++) fb.rect(bx + 4 + c * 10, FLOOR - 64, 4, 36, C.silver);
  // mar
  fb.rect(0, FLOOR - 26, W, 26, C.slate);
  for (let y = FLOOR - 26; y < FLOOR; y += 3) for (let x = 0; x < W; x++) if ((x + y * 3 + Math.floor(t * 6)) % 14 < 3) fb.px(x, y, C.silver);
  slots(cam, .6, 110, (i, x) => {   // barcos
    const bob = Math.round(Math.sin(t * 2 + i) * 1);
    fb.rect(x + 10, FLOOR - 16 + bob, 46, 8, C.dbrown); for (let k = 0; k < 6; k++) fb.hline(x + 10 + k, x + 55 - k, FLOOR - 8 + k + bob, C.dbrown);
    fb.vline(x + 33, FLOOR - 60 + bob, FLOOR - 16 + bob, C.ink);
    for (let k = 0; k < 30; k++) fb.hline(x + 34, x + 34 + Math.round(k * .6), FLOOR - 58 + k + bob, C.white);
    for (let k = 0; k < 22; k++) fb.hline(x + 32 - Math.round(k * .7), x + 32, FLOOR - 50 + k + bob, C.white);
    fb.rect(x + 33, FLOOR - 62 + bob, 6, 3, C.red);
  });
  // muelle
  fb.rect(0, FLOOR, W, H - FLOOR, C.brown);
  const o = layer(cam, 1); for (let x = -((o % 12) + 12) % 12; x < W; x += 12) fb.vline(x, FLOOR, H, C.dbrown);
  fb.hline(0, W - 1, FLOOR, C.ink);
}

// —— CENTRO DE DATOS: filas de armarios con luces ——
function datos(fb, cam, t) {
  fb.rect(0, 0, W, H, C.night);
  for (let x = 10; x < W; x += 40) fb.rect(x - layer(cam, .1) % 40, 6, 22, 2, C.silver);
  slots(cam, .35, 30, (i, x) => {
    fb.rect(x + 2, FLOOR - 70, 24, 64, C.ink); fb.rect(x + 4, FLOOR - 68, 20, 60, C.dslate);
    for (let r = 0; r < 12; r++) { fb.hline(x + 5, x + 22, FLOOR - 66 + r * 5, C.night); fb.px(x + 20, FLOOR - 65 + r * 5, hash(i * 13 + r, Math.floor(t * 4 + hash(i, r) * 7)) > .45 ? C.lime : C.green); fb.px(x + 7, FLOOR - 65 + r * 5, hash(i, r) > .7 ? C.cyan : C.teal); }
  });
  slots(cam, .8, 56, (i, x) => {
    fb.rect(x, FLOOR - 92, 30, 92, C.ink); fb.rect(x + 2, FLOOR - 90, 26, 88, C.slate);
    for (let r = 0; r < 16; r++) { fb.hline(x + 3, x + 26, FLOOR - 87 + r * 5, C.dslate); for (let c = 0; c < 3; c++) fb.px(x + 18 + c * 3, FLOOR - 86 + r * 5, hash(i * 7 + c, r + Math.floor(t * 6)) > .5 ? [C.lime, C.cyan, C.amber][c] : C.dslate); }
  });
  fb.rect(0, FLOOR, W, H - FLOOR, C.dslate); fb.hline(0, W - 1, FLOOR, C.ink);
  const o = layer(cam, 1); for (let x = -((o % 20) + 20) % 20; x < W; x += 20) fb.line(x, FLOOR + 1, x - 14, H, C.slate);
}

// —— NASDAQ 2000: ciudad de noche con pantallas de bolsa (se ve en 8-bit) ——
function nasdaq(fb, cam, t) {
  sky(fb, [C.ink, C.night, C.navy]);
  stars(fb, t, 24, FLOOR * .4);
  slots(cam, .2, 26, (i, x) => { const h = 40 + Math.floor(hash(i, 2) * 50); fb.rect(x, FLOOR - h, 22, h, C.night); for (let wy = FLOOR - h + 4; wy < FLOOR - 4; wy += 5) for (let wx = x + 3; wx < x + 20; wx += 4) if (hash(wx * 3, wy) > .6) fb.px(wx, wy, C.yellow); });
  // torre con pantalla curva y tira de cotizaciones
  const tx = Math.round(W * .55 - layer(cam, .5));
  fb.rect(tx, FLOOR - 100, 70, 100, C.dslate); fb.rect(tx + 4, FLOOR - 92, 62, 46, C.ink);
  for (let y = 0; y < 44; y++) for (let x = 0; x < 60; x++) if (bayer(x, y) < .35) fb.px(tx + 5 + x, FLOOR - 91 + y, C.navy);
  const tick = ' NDX +3.1%  TECH +0.8%  WEB +12%  DOT +6.4% ';
  fb.clip = [tx + 4, 0, tx + 66, H];
  text(fb, tick + tick, tx + 4 - Math.floor(t * 20) % 260, FLOOR - 40, C.lime);
  text(fb, '5048', tx + 20, FLOOR - 80, C.amber, null, 2);
  fb.clip = [0, 0, W, H];
  slots(cam, .9, 48, (i, x) => { if (hash(i, 4) > .5) { fb.rect(x, FLOOR - 30, 34, 30, C.ink); fb.rect(x + 3, FLOOR - 26, 28, 6, hash(i, Math.floor(t * 2)) > .5 ? C.hot : C.rose); } });
  ground(fb, cam, FLOOR, C.night, C.dslate, 1, 24);
}

// —— CRUCE: camino con tres señales (escenarios) ——
function cruce(fb, cam, t) {
  sky(fb, [C.blue, C.cyan, C.white]);
  slots(cam, .2, 120, (i, x) => { for (let k = 0; k < 40; k++) fb.hline(x + k, x + 120 - k, FLOOR - 10 - k, C.green); });
  slots(cam, .5, 90, (i, x) => { for (let k = 0; k < 24; k++) fb.hline(x + k, x + 80 - k, FLOOR - k, C.lime); fb.rect(x + 60, FLOOR - 40, 3, 20, C.dbrown); fb.disc(x + 61, FLOOR - 44, 8, C.dgreen); });
  fb.rect(0, FLOOR, W, H - FLOOR, C.tan); fb.hline(0, W - 1, FLOOR, C.brown);
  fb.dither(0, FLOOR + 1, W, H - FLOOR, () => .2, C.tan, C.sand);
}

// —— MIRADOR: colina de noche con telescopio (señales) ——
function mirador(fb, cam, t) {
  sky(fb, [C.ink, C.night, C.navy, C.dslate]);
  stars(fb, t, 60, FLOOR - 20);
  slots(cam, .3, 160, (i, x) => { for (let k = 0; k < 30; k++) fb.hline(x + k * 2, x + 160 - k * 2, FLOOR - k, C.dgreen); });
  const ox = Math.round(W * .7 - layer(cam, .6));
  fb.rect(ox, FLOOR - 30, 30, 30, C.slate); fb.disc(ox + 15, FLOOR - 30, 15, C.steel); fb.rect(ox - 2, FLOOR - 31, 34, 1, C.ink);
  fb.line(ox + 15, FLOOR - 40, ox + 34, FLOOR - 58, C.ink); fb.line(ox + 16, FLOOR - 40, ox + 35, FLOOR - 58, C.silver);
  fb.rect(0, FLOOR, W, H - FLOOR, C.dgreen); fb.hline(0, W - 1, FLOOR, C.ink);
}

// —— LA PUERTA: sala final con la gran puerta del jefe y el cristal de guardado ——
function puerta(fb, cam, t) {
  fb.rect(0, 0, W, H, C.ink);
  for (let y = 0; y < FLOOR; y += 10) for (let x = (y / 10) % 2 ? 0 : 10; x < W; x += 20) fb.rect(x - layer(cam, .3) % 20, y, 19, 9, C.night);
  const dx = Math.round(W / 2 - 46 - layer(cam, .7) + 30), dw = 92, dh = Math.min(118, FLOOR - 6);
  fb.rect(dx - 6, FLOOR - dh - 6, dw + 12, dh + 6, C.dslate);
  fb.rect(dx, FLOOR - dh, dw, dh, C.dbrown);
  fb.rect(dx + dw / 2 - 1, FLOOR - dh, 2, dh, C.ink);
  for (const px of [dx + 6, dx + dw / 2 + 5]) for (const py of [FLOOR - dh + 8, FLOOR - dh / 2 + 4]) { fb.rect(px, py, dw / 2 - 11, dh / 2 - 14, C.brown); fb.hline(px, px + dw / 2 - 12, py, C.tan); }
  text(fb, '?', dx + dw / 2 - 5, FLOOR - dh + 14, C.red, C.ink, 2);
  for (const tx of [dx - 22, dx + dw + 18]) { fb.rect(tx, FLOOR - 70, 4, 10, C.dbrown); const f = Math.floor(t * 12) % 3; fb.disc(tx + 2, FLOOR - 74 - f, 3, C.orange); fb.px(tx + 2, FLOOR - 76 - f, C.yellow); }
  fb.rect(0, FLOOR, W, H - FLOOR, C.dslate); fb.hline(0, W - 1, FLOOR, C.slate);
}

// —— LA PLAYA: mar abierto de día, olas que rompen, sombrilla y gaviotas ——
function playa(fb, cam, t) {
  sky(fb, [C.blue, C.blue, C.cyan, C.white], FLOOR - 40);
  slots(cam, .08, 110, (i, x) => { const y = 12 + Math.floor(hash(i, 2) * 26); for (const [dx, r] of [[0, 6], [8, 8], [17, 5]]) fb.disc(x + dx + Math.round(t * 2) % 110, y, r, C.white); });
  fb.disc(Math.round(W * .82 - layer(cam, .03)), 26, 11, C.yellow);
  const hz = FLOOR - 40;   // horizonte: el mar ocupa la franja de abajo
  fb.rect(0, hz, W, 40, C.blue);
  fb.dither(0, hz, W, 12, (x, y) => .5, C.blue, C.navy);
  for (let y = hz + 4; y < FLOOR - 4; y += 5) { const o = Math.round(Math.sin(t * 2 + y) * 6 + layer(cam, .3 + (y - hz) / 60)); for (let x = -((o % 22) + 22) % 22; x < W; x += 22) fb.hline(x, x + 6, y, y > FLOOR - 16 ? C.white : C.cyan); }
  const sh = Math.round(Math.sin(t * 1.6) * 3);   // la orilla avanza y se retira
  fb.rect(0, FLOOR - 4 + sh, W, 4 - sh + 1, C.white);
  fb.rect(0, FLOOR, W, H - FLOOR, C.sand); fb.hline(0, W - 1, FLOOR, C.tan);
  fb.dither(0, FLOOR + 1, W, H - FLOOR, () => .18, C.sand, C.tan);
  slots(cam, 1, 150, (i, x) => {   // sombrillas y conchas
    if (hash(i, 4) > .55) { fb.vline(x + 20, FLOOR - 30, FLOOR, C.ink); for (let k = 0; k < 14; k++) fb.hline(x + 6 + k, x + 34 - k, FLOOR - 30 - (13 - k), Math.floor((k) / 3) % 2 ? C.white : C.red); }
    if (hash(i, 7) > .4) { fb.disc(x + 70, FLOOR + 8, 2, C.pink); fb.px(x + 70, FLOOR + 6, C.white); }
  });
}

// —— LA MONTAÑA: picos nevados, lluvia y un río que baja ——
function montana(fb, cam, t) {
  sky(fb, [C.steel, C.silver, C.cyan]);
  slots(cam, .1, 100, (i, x) => { const y = 10 + Math.floor(hash(i, 2) * 14); for (const [dx, r] of [[0, 9], [12, 12], [25, 8]]) fb.disc(x + dx + Math.round(t * 3) % 100, y, r, C.silver); });
  slots(cam, .2, 120, (i, x) => { const h = 70 + Math.floor(hash(i, 1) * 30); for (let k = 0; k < h; k++) fb.hline(x + 60 - Math.round(k * .9), x + 60 + Math.round(k * .9), FLOOR - 20 - h + k, k < 14 ? C.white : C.slate); });
  slots(cam, .5, 90, (i, x) => { for (let k = 0; k < 46; k++) fb.hline(x + 45 - k, x + 45 + k, FLOOR - 46 + k, k < 6 ? C.white : C.dgreen); });
  // lluvia en diagonal
  for (let i = 0; i < 70; i++) { const x0 = Math.floor(hash(i, 3) * (W + 40)), y = Math.floor(((hash(i, 5) * FLOOR + t * 160) % FLOOR)); const x = (x0 - Math.floor(y * .3)) % W; fb.px(x, y, C.cyan); fb.px(x - 1, y - 2, C.cyan); }
  fb.rect(0, FLOOR, W, H - FLOOR, C.green); fb.hline(0, W - 1, FLOOR, C.dgreen);
  // río serpenteante que corre hacia la derecha
  for (let y = FLOOR + 2; y < H; y++) { const cx = Math.round(W * .62 + Math.sin(y * .12) * 12 - layer(cam, .9) % 40); fb.hline(cx - 6 - (y - FLOOR) / 8, cx + 6 + (y - FLOOR) / 8, y, C.blue); if ((y + Math.floor(t * 12)) % 5 === 0) fb.px(cx, y, C.white); }
}

// —— EL FONDO DEL MAR: oscuro, burbujas, chimeneas humeantes ——
function fondo(fb, cam, t) {
  fb.gradV(0, 0, W, FLOOR, [C.teal, C.navy, C.night, C.ink]);
  for (let k = 0; k < 5; k++) { const x = Math.round(((k * 70 + t * 6) % (W + 40)) - 20); for (let y = 0; y < FLOOR * .6; y++) if (bayer(x + y, y) < .12) fb.px(x + Math.round(y * .3), y, C.cyan); }   // rayos de luz
  slots(cam, .5, 110, (i, x) => {   // chimeneas: columnas de roca con humo negro
    const h = 30 + Math.floor(hash(i, 2) * 30);
    fb.rect(x + 20, FLOOR - h, 12, h, C.umber); fb.rect(x + 18, FLOOR - h, 16, 3, C.rust);
    fb.px(x + 26, FLOOR - h - 1, C.orange);
    for (let j = 0; j < 14; j++) { const ph = ((t * .8 + j / 14) % 1), r = 2 + Math.round(ph * 6); fb.disc(x + 26 + Math.round(Math.sin(t * 2 + j) * ph * 8), FLOOR - h - Math.round(ph * 60), r, ph < .3 ? C.dslate : C.night); }
  });
  for (let i = 0; i < 16; i++) { const x = Math.round(hash(i, 4) * W + Math.sin(t * 3 + i) * 2), y = Math.round(FLOOR - ((t * 30 + hash(i, 8) * FLOOR) % FLOOR)); fb.px(x, y, C.cyan); if (i % 3 === 0) { fb.px(x + 1, y, C.cyan); fb.px(x, y - 1, C.white); } }
  fb.rect(0, FLOOR, W, H - FLOOR, C.dslate); fb.hline(0, W - 1, FLOOR, C.ink);
  fb.dither(0, FLOOR + 1, W, H - FLOOR, () => .3, C.dslate, C.night);
}

// —— EL DESIERTO: el mar Muerto entre montañas ocres, orillas de sal blanca ——
function desierto(fb, cam, t) {
  sky(fb, [C.cyan, C.white, C.sand], FLOOR - 34);
  fb.disc(Math.round(W * .2 - layer(cam, .03)), 24, 12, C.yellow);
  slots(cam, .2, 140, (i, x) => { for (let k = 0; k < 36; k++) fb.hline(x + k * 2, x + 140 - k * 2, FLOOR - 34 - k, k < 2 ? C.clay : C.tan); });
  const hz = FLOOR - 34;
  fb.rect(0, hz, W, 34, C.teal); fb.dither(0, hz, W, 34, (x, y) => (y - hz) / 50, C.cyan, C.teal);
  for (let y = hz + 5; y < FLOOR - 6; y += 7) { const o = Math.round(t * 4 + y * 3 + layer(cam, .5)); for (let x = -(o % 30); x < W; x += 30) fb.hline(x, x + 4, y, C.white); }
  // islotes de sal
  slots(cam, .7, 80, (i, x) => { if (hash(i, 3) > .4) for (let k = 0; k < 5; k++) fb.hline(x + k, x + 22 - k, FLOOR - 6 - k, C.white); });
  fb.rect(0, FLOOR - 2, W, 3, C.white);
  fb.rect(0, FLOOR, W, H - FLOOR, C.sand); fb.hline(0, W - 1, FLOOR, C.white);
  fb.dither(0, FLOOR + 1, W, H - FLOOR, () => .25, C.sand, C.white);
}

// —— vida ambiente: cada sitio tiene algo que se mueve ——
const fr = (t, k) => ((t * k) % 1 + 1) % 1;
function pajaro(fb, x, y, t, col) { const a = Math.floor(t * 6) % 2; fb.px(x, y, col); fb.px(x - 1, y - a, col); fb.px(x - 2, y - 1 + a, col); fb.px(x + 1, y - a, col); fb.px(x + 2, y - 1 + a, col); }
const AMB = {
  playa(fb, t) { for (let i = 0; i < 3; i++) pajaro(fb, Math.round(fr(t + i * 2.3, 1 / 10) * (W + 20)) - 10, Math.round(FLOOR * (.12 + .07 * i) + Math.sin(t * 1.5 + i) * 4), t + i * .4, C.ink);
    const bx = Math.round(fr(t, 1 / 18) * (W + 60)) - 30, by = FLOOR - 30 + Math.round(Math.sin(t * 2) * 1.5);   // barquito
    fb.rect(bx, by, 16, 4, C.red); fb.vline(bx + 7, by - 12, by, C.ink); for (let k = 0; k < 10; k++) fb.hline(bx + 8, bx + 8 + Math.round(k * .7), by - 12 + k, C.white); },
  montana(fb, t) { if (Math.floor(t * 2.3) % 9 === 0 && fr(t * 2.3, 1) < .25) { fb.rect(0, 0, W, 2, C.white); } },
  fondo(fb, t) { for (let i = 0; i < 3; i++) { const x = Math.round(fr(t + i * 4.1, i % 2 ? .06 : -.05) * (W + 40)) - 20, y = Math.round(FLOOR * (.3 + .15 * i) + Math.sin(t * 2 + i) * 4), c = [C.orange, C.yellow, C.pink][i], d = i % 2 ? 1 : -1;
    fb.rect(x - 4, y - 2, 9, 5, c); fb.px(x - 5 * d, y, c); fb.px(x - 6 * d, y - 1, c); fb.px(x - 6 * d, y + 1, c); fb.px(x + 3 * d, y - 1, C.ink); } },
  desierto(fb, t) { const x = Math.round(W * .55 + Math.sin(t * .8) * 4), y = FLOOR - 20 + Math.round(Math.sin(t * 2) * 1.5);   // alguien flotando
    fb.rect(x, y, 14, 3, C.skin); fb.disc(x + 16, y, 3, C.skin); fb.rect(x + 2, y - 1, 6, 2, C.red); fb.hline(x - 4, x + 22, y + 3, C.white); },

  hoy(fb, t) {   // avión con luz parpadeante y coches por la calle
    const x = Math.round(fr(t, 1 / 14) * (W + 40)) - 20, y = Math.round(FLOOR * .2);
    fb.hline(x - 4, x + 4, y, C.silver); fb.px(x - 4, y - 1, C.silver); if (Math.floor(t * 3) % 2) fb.px(x + 4, y, C.red);
    for (let i = 0; i < 3; i++) { const cx = Math.round(fr(t + i * 3.1, i % 2 ? .09 : -.12) * (W + 30)) - 15, cy = FLOOR + 6 + (i % 2) * 6;
      fb.rect(cx, cy, 12, 4, [C.red, C.cyan, C.yellow][i]); fb.rect(cx + 3, cy - 2, 6, 2, C.ink); fb.px(i % 2 ? cx + 11 : cx, cy + 1, C.yellow); }
  },
  mercado(fb, t) { for (let i = 0; i < 4; i++) pajaro(fb, Math.round(fr(t + i * 1.7, 1 / 11) * (W + 20)) - 10, Math.round(FLOOR * (.15 + .07 * i) + Math.sin(t * 2 + i) * 3), t + i * .3, C.ink); },
  londres(fb, t) { for (let i = 0; i < 3; i++) pajaro(fb, W + 10 - Math.round(fr(t + i * 2.3, 1 / 9) * (W + 20)), Math.round(FLOOR * (.12 + .08 * i) + Math.sin(t * 1.5 + i) * 4), t + i * .4, C.ink); },
  datos(fb, t) { for (let i = 0; i < 18; i++) { const x = Math.round(hashA(i) * W), y = Math.round(FLOOR - fr(t + i * .7, .08 + hashA(i + 9) * .06) * FLOOR); if (Math.floor(t * 4 + i) % 3) fb.px(x + Math.round(Math.sin(t + i) * 3), y, C.cyan); } },
  nasdaq(fb, t) {   // focos que barren el cielo
    for (let k = 0; k < 2; k++) { const bx = Math.round(W * (.2 + .6 * k)), a = -Math.PI / 2 + Math.sin(t * .7 + k * 2) * .5;
      for (let r = 0; r < FLOOR; r += 2) for (let w = -1; w <= 1; w++) { const x = Math.round(bx + Math.cos(a) * r + w * r * .05), y = Math.round(FLOOR - Math.sin(-a) * r); if ((x + y) % 3 === 0) fb.px(x, y, C.silver); } }
  },
  cruce(fb, t) { for (let i = 0; i < 5; i++) { const x = Math.round(fr(t + i * 2.1, .05) * W + Math.sin(t * 2 + i) * 8), y = Math.round(FLOOR - 8 - Math.abs(Math.sin(t * 1.3 + i)) * 30), a = Math.floor(t * 10 + i) % 2, c = [C.pink, C.yellow, C.orange, C.white, C.lime][i]; fb.px(x, y, c); fb.px(x - 1, y - a, c); fb.px(x + 1, y - a, c); } },
  mirador(fb, t) { const p = fr(t, 1 / 5); if (p < .25) { const u = p / .25, x = Math.round(W * (.8 - .5 * u)), y = Math.round(FLOOR * (.08 + .2 * u)); for (let i = 0; i < 8; i++) fb.px(x + i, y - Math.round(i * .4), i < 2 ? C.white : C.cyan); } },
  puerta(fb, t) { for (let i = 0; i < 14; i++) { const x = Math.round(W * hashA(i) + Math.sin(t * 2 + i) * 4), y = Math.round(FLOOR - fr(t + i * .9, .12 + hashA(i + 3) * .1) * FLOOR * .8); if (Math.floor(t * 6 + i) % 4) fb.px(x, y, i % 3 ? C.orange : C.yellow); } },
};
function hashA(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
const BASE = { hoy, mercado, londres, datos, nasdaq, cruce, mirador, puerta, playa, montana, fondo, desierto };
export const LUGARES = Object.fromEntries(Object.entries(BASE).map(([k, f]) => [k, (fb, cam, t) => { f(fb, cam, t); AMB[k] && AMB[k](fb, t); }]));
export const NOMBRE = { hoy: 'HOY', mercado: 'EL MERCADO', londres: 'LONDRES · 1720', datos: 'CENTRO DE DATOS', nasdaq: 'NUEVA YORK · 2000', cruce: 'EL CRUCE', mirador: 'EL MIRADOR', puerta: 'LA ÚLTIMA PUERTA', playa: 'LA PLAYA', montana: 'LA MONTAÑA', fondo: 'EL FONDO DEL MAR', desierto: 'EL MAR MUERTO' };
