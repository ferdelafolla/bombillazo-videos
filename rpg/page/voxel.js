// voxel.js — mundo TODO 3D de vóxeles para el motor Pixel RPG (18/11/2026).
// El escenario, los objetos y Chispa son modelos de cubos (InstancedMesh) con luz, sombras y niebla;
// se renderiza a 2× la resolución del búfer (360×640 en vertical) y se escala por vecino más cercano:
// así queda la "textura de píxel por encima" pero con calidad. La interfaz (ventanas, títulos, diálogo)
// sigue siendo pixel art 2D dibujada encima.
// Los objetos (props) van en una segunda pasada con cámara ortográfica en coordenadas de pantalla y se
// encuadran por su esfera envolvente: nunca se cortan por los bordes.
import * as THREE from './vendor/three.module.js';
import { W, H } from './px.js';

export const K = 2, RW = W * K, RH = H * K;
const cv = document.createElement('canvas'); cv.width = RW; cv.height = RH;
let R = null;
try {
  R = new THREE.WebGLRenderer({ canvas: cv, antialias: false, alpha: false, preserveDrawingBuffer: true });
  R.setPixelRatio(1); R.setSize(RW, RH, false);
  R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFShadowMap;
  R.outputColorSpace = THREE.SRGBColorSpace; R.autoClear = false;
} catch (e) { console.warn('sin WebGL: no hay mundo de vóxeles', e); }
export const HAYVOX = !!R;
export const voxCanvas = cv;

// —— vóxeles ——
const hsh = (x, y, z) => { let h = (x * 374761393 + y * 668265263 + z * 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
const BOX = new THREE.BoxGeometry(1, 1, 1);
export class Vox {
  constructor() { this.m = new Map(); this.glow = new Set(); }
  set(x, y, z, c) { this.m.set(`${Math.round(x)},${Math.round(y)},${Math.round(z)}`, c); return this; }
  get(x, y, z) { return this.m.get(`${x},${y},${z}`); }
  del(x, y, z) { this.m.delete(`${Math.round(x)},${Math.round(y)},${Math.round(z)}`); return this; }
  box(x0, y0, z0, x1, y1, z1, c) { for (let x = x0; x < x1; x++) for (let y = y0; y < y1; y++) for (let z = z0; z < z1; z++) this.set(x, y, z, typeof c === 'function' ? c(x, y, z) : c); return this; }
  ball(cx, cy, cz, r, c, sy = 1) { const R2 = r * r; for (let x = Math.floor(-r); x <= r; x++) for (let y = Math.floor(-r * sy); y <= r * sy; y++) for (let z = Math.floor(-r); z <= r; z++) if (x * x + (y / sy) ** 2 + z * z <= R2 + r * .6) this.set(cx + x, cy + y, cz + z, typeof c === 'function' ? c(x, y, z) : c); return this; }
  cyl(cx, cz, y0, y1, r, c) { const R2 = r * r; for (let x = Math.floor(-r); x <= r; x++) for (let z = Math.floor(-r); z <= r; z++) if (x * x + z * z <= R2 + r * .6) for (let y = y0; y < y1; y++) this.set(cx + x, y, cz + z, typeof c === 'function' ? c(x, y, z) : c); return this; }
  luz(...cs) { cs.forEach(c => this.glow.add(c)); return this; }
  // malla: un InstancedMesh para lo iluminado y otro para lo que brilla; quita los cubos tapados por los 6 lados
  build(o = {}) {
    const jit = o.jit ?? .07, g = new THREE.Group(), lit = [], emi = [];
    for (const [k, c] of this.m) {
      const [x, y, z] = k.split(',').map(Number);
      if (this.m.has(`${x + 1},${y},${z}`) && this.m.has(`${x - 1},${y},${z}`) && this.m.has(`${x},${y + 1},${z}`) && this.m.has(`${x},${y - 1},${z}`) && this.m.has(`${x},${y},${z + 1}`) && this.m.has(`${x},${y},${z - 1}`)) continue;
      (this.glow.has(c) ? emi : lit).push([x, y, z, c]);
    }
    const mk = (arr, mat, sombra) => {
      if (!arr.length) return null;
      const im = new THREE.InstancedMesh(BOX, mat, arr.length), M = new THREE.Matrix4(), col = new THREE.Color();
      arr.forEach(([x, y, z, c], i) => { M.makeTranslation(x + .5, y + .5, z + .5); im.setMatrixAt(i, M); const j = 1 + (hsh(x, y, z) - .5) * 2 * jit; col.setHex(c).multiplyScalar(j); im.setColorAt(i, col); });
      im.castShadow = sombra && o.sombra !== false; im.receiveShadow = sombra && o.recibe !== false; g.add(im); return im;
    };
    mk(lit, new THREE.MeshLambertMaterial({ color: 0xffffff }), true);
    mk(emi, new THREE.MeshBasicMaterial({ color: 0xffffff }), false);
    if (o.centrar) { const b = new THREE.Box3().setFromObject(g), c = b.getCenter(new THREE.Vector3()); g.children.forEach(m => m.position.sub(c)); }
    return g;
  }
}

// —— paleta (ENDESGA-32, la misma del pixel art) ——
export const P = {
  ink: 0x181425, night: 0x262b44, dslate: 0x3a4466, slate: 0x5a6988, steel: 0x8b9bb4, silver: 0xc0cbdc, white: 0xffffff,
  red: 0xe43b44, crimson: 0xa22633, orange: 0xf77622, amber: 0xfeae34, yellow: 0xfee761, lime: 0x63c74d, green: 0x3e8948,
  dgreen: 0x265c42, teal: 0x193c3e, navy: 0x124e89, blue: 0x0099db, cyan: 0x2ce8f5, sand: 0xead4aa, tan: 0xe4a672,
  brown: 0xb86f50, dbrown: 0x733e39, umber: 0x3e2731, plum: 0x68386c, rose: 0xb55088, pink: 0xf6757a, skin: 0xe8b796,
};

// —— utilidades de escena ——
function cielo(cols) {   // degradado vertical como fondo
  const c = document.createElement('canvas'); c.width = 2; c.height = 64; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 64);
  cols.forEach((h, i) => gr.addColorStop(i / (cols.length - 1), '#' + h.toString(16).padStart(6, '0'))); g.fillStyle = gr; g.fillRect(0, 0, 2, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; return t;
}
function luces(scene, o = {}) {
  scene.add(new THREE.HemisphereLight(o.cielo ?? 0xbfd8ff, o.suelo ?? 0x3a4466, o.amb ?? 1.1));
  const d = new THREE.DirectionalLight(o.sol ?? 0xfff1d6, o.int ?? 2.2); d.position.set(...(o.dir || [-30, 50, 40])); d.castShadow = true;
  const s = o.sombra ?? 60; Object.assign(d.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 300 }); d.shadow.mapSize.set(1024, 1024); d.shadow.bias = -.0008;
  d.target.position.set(...(o.mira || [0, 0, 0])); scene.add(d, d.target); return d;
}
function estrellas(scene, n = 160, r = 180, ymin = 10) {
  const p = []; for (let i = 0; i < n; i++) { const a = hsh(i, 1, 2) * Math.PI * 2, e = .08 + hsh(i, 3, 4) * 1.2; p.push(Math.cos(a) * Math.cos(e) * r, ymin + Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r - 40); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false })); scene.add(pts); return pts;
}
const cam = (fov = 45) => new THREE.PerspectiveCamera(fov, RW / RH, .5, 600);

// —— modelos (props) ——
const MOD = {};
export function modelo(nombre) { if (!MOD[nombre] && FAB[nombre]) { const g = FAB[nombre](); const s = new THREE.Box3().setFromObject(g).getBoundingSphere(new THREE.Sphere()); g.userData.r = s.radius; MOD[nombre] = g; } return MOD[nombre]; }
const FAB = {
  avion: () => {   // avión de línea: fuselaje blanco, alas plata, cola roja, ventanillas
    const v = new Vox();
    for (let x = -14; x <= 14; x++) { const r = x > 10 ? 2.6 - (x - 10) * .5 : x < -10 ? 2.6 - (-10 - x) * .35 : 2.6; for (let y = -3; y <= 3; y++) for (let z = -3; z <= 3; z++) if (y * y + z * z <= r * r + .6) v.set(x, y, z, P.white); }
    for (let x = -10; x <= 9; x += 2) { v.set(x, 1, 3, P.navy); v.set(x, 1, -3, P.navy); }
    v.box(11, 0, -2, 13, 2, 3, P.navy);                       // cabina
    v.box(-4, -1, -18, 4, 0, 18, P.silver);                    // alas
    for (let z = -18; z < 18; z++) { const k = Math.abs(z) / 18 * 4 | 0; for (let x = -4; x < -4 + k; x++) v.del(x, -1, z); }
    v.box(-2, -4, -10, 3, -2, -7, P.slate); v.box(-2, -4, 7, 3, -2, 10, P.slate);   // motores
    v.box(-15, 1, -7, -11, 2, 7, P.silver);                    // estabilizador
    for (let y = 2; y < 10; y++) v.box(-15 + (y - 2) * .4 | 0, y, -1, -11 + (y - 2) * .3 | 0, y + 1, 1, P.red);
    v.set(0, -1, 18, P.red); v.set(0, -1, -18, P.lime); v.luz(P.red, P.lime);
    const g = v.build({ centrar: true }); g.rotation.set(.35, -.7, .12); const w = new THREE.Group(); w.add(g); return w;
  },
  torre: () => {
    const v = new Vox();
    v.cyl(0, 0, 0, 22, 2, (x, y) => y % 6 === 0 ? P.steel : P.silver);
    v.cyl(0, 0, 22, 23, 5, P.slate); v.cyl(0, 0, 23, 27, 5, (x, y, z) => (Math.abs(x) + Math.abs(z)) % 3 === 0 ? P.dslate : P.cyan);
    v.cyl(0, 0, 27, 28, 6, P.dslate); v.cyl(0, 0, 28, 29, 3, P.slate); v.box(0, 29, 0, 1, 33, 1, P.ink); v.set(0, 33, 0, P.red);
    v.luz(P.cyan, P.red);
    const g = v.build({ centrar: true }); g.rotation.x = .12; const w = new THREE.Group(); w.add(g); return w;
  },
  radar: () => {
    const v = new Vox();
    v.cyl(0, 0, 0, 3, 5, P.slate); v.cyl(0, 0, 3, 9, 1, P.silver);
    const w = new THREE.Group(); w.add(v.build({ centrar: false }));
    const a = new Vox();   // antena parabólica que gira
    for (let x = -8; x <= 8; x++) for (let y = -5; y <= 5; y++) { const z = Math.round((x * x) / 22 + (y * y) / 12); a.set(x, y, -z, P.white); a.set(x, y, -z - 1, P.silver); }
    a.box(0, -1, -3, 1, 1, 4, P.ink); a.set(0, 0, 4, P.lime); a.luz(P.lime);
    const ga = a.build(); ga.position.set(0, 11, 0); ga.rotation.x = -.35; ga.name = 'antena'; w.add(ga);
    w.children[0].position.y = 0; const b = new THREE.Box3().setFromObject(w), c = b.getCenter(new THREE.Vector3()); w.children.forEach(m => m.position.sub(c));
    const r = new THREE.Group(); r.add(w); return r;
  },
};

// Chispa en vóxeles: bombilla amarilla, casquillo a rayas, ojos cerrados, sonrisa roja y brazo que saluda
function chispaVox() {
  const g = new THREE.Group(), v = new Vox(), Rb = 7, cy = 15;
  v.ball(0, cy, 0, Rb, (x, y, z) => (x < -2 && y > 2 && z > 2) ? 0xfff6c0 : P.yellow);
  v.cyl(0, 0, 3, 8, 3.6, (x, y) => (y % 2 ? P.amber : P.dbrown)); v.cyl(0, 0, 1, 3, 2.6, P.dslate); v.set(0, 0, 0, P.ink);
  const front = (x, y) => Math.round(Math.sqrt(Math.max(0, Rb * Rb + Rb * .6 - x * x - (y - cy) ** 2)));
  for (const [x, y] of [[-4, 17], [-3, 18], [-2, 17], [2, 17], [3, 18], [4, 17]]) v.set(x, y, front(x, y), P.ink);   // ojos cerrados ^ ^
  v.set(0, 15, front(0, 15) + 1, P.orange); v.set(-1, 14, front(-1, 14) + 1, P.orange);                          // nariz <
  g.add(v.build({ jit: .04 }));
  const b = new Vox(); for (const [x, y] of [[-3, 0], [-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1], [3, 0]]) b.set(x, y, 0, P.red);
  const boca = b.build({ jit: 0 }); boca.position.set(0, 12, front(0, 12) + .2); boca.name = 'boca'; g.add(boca);
  const a = new Vox(); a.box(0, 0, 0, 2, 7, 2, P.yellow); const brazo = a.build(); brazo.position.set(-1, 0, -1);
  const hombro = new THREE.Group(); hombro.position.set(Rb - 1, cy + 1, -1); hombro.add(brazo); hombro.name = 'brazo'; g.add(hombro);
  g.userData.alto = cy + Rb + 1; return g;
}


const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), ss = x => x * x * (3 - 2 * x);
function avionMundo(sc) { const m = modelo('avion').clone(); m.children[0].rotation.set(0, 0, 0); m.scale.setScalar(sc); return m; }
function pose(m, x, y, z, yaw, pitch, roll) { m.position.set(x, y, z); m.rotation.set(roll, yaw, 0, 'YXZ'); m.children[0].rotation.set(0, 0, pitch); }
// —— escenarios ——
const ESC = {};
const FABE = {
  aeropuerto: () => {
    const s = new THREE.Scene(); s.background = cielo([P.ink, P.night, P.plum, P.rose]); s.fog = new THREE.Fog(0x3a2a4a, 90, 320);
    luces(s, { cielo: 0x9a8ac8, suelo: 0x7a7aa0, amb: 1.5, sol: 0xc8d0ff, int: 1.3, dir: [40, 70, 50], sombra: 120 });
    const v = new Vox();
    v.box(-160, -1, -90, 160, 0, 40, (x, y, z) => Math.abs(z) <= 7 ? P.night : P.dslate);                 // suelo y pista
    for (let x = -160; x < 160; x += 6) v.box(x, -1, 0, x + 3, 0, 1, P.white);
    for (let x = -160; x < 160; x += 2) { v.set(x, -1, -7, P.silver); v.set(x, -1, 7, P.silver); }
    v.box(-70, 0, -48, 10, 9, -34, P.slate); v.box(-72, 9, -50, 12, 10, -32, P.dslate);                  // terminal
    for (let x = -68; x < 8; x += 3) for (const y of [2, 5]) v.box(x, y, -34, x + 2, y + 2, -33, (hsh(x, y, 1) > .25) ? P.amber : P.navy);
    v.cyl(30, -40, 0, 26, 2, P.silver); v.cyl(30, -40, 26, 27, 6, P.slate);                               // torre de control
    v.cyl(30, -40, 27, 31, 6, (x, y, z) => (Math.abs(x) + Math.abs(z)) % 3 === 0 ? P.dslate : P.cyan); v.cyl(30, -40, 31, 32, 7, P.dslate);
    for (let i = 0; i < 34; i++) { const x = -150 + Math.floor(hsh(i, 9, 9) * 300), z = -80 - Math.floor(hsh(i, 8, 8) * 10), h = 6 + Math.floor(hsh(i, 7, 7) * 26); v.box(x, 0, z, x + 8, h, z + 8, P.night);
      for (let y = 2; y < h - 1; y += 3) if (hsh(i, y, 3) > .5) v.set(x + 3, y, z + 8, P.amber); }
    v.luz(P.cyan, P.amber); s.add(v.build());
    const luzP = new Vox(), luzA = new Vox();
    for (let x = -160; x < 160; x += 8) { luzP.set(x, 0, -8, P.cyan); luzP.set(x, 0, 8, P.cyan); luzA.set(x + 4, 0, -8, P.amber); luzA.set(x + 4, 0, 8, P.amber); }
    luzP.luz(P.cyan); luzA.luz(P.amber); const g1 = luzP.build(), g2 = luzA.build(); s.add(g1, g2);
    const bal = new Vox(); bal.set(30, 33, -40, P.red).luz(P.red); const gb = bal.build(); s.add(gb);
    [-40, 50].forEach((x, i) => { const m = avionMundo(.55); m.position.set(x, 4, -22); m.rotation.y = i ? Math.PI : 0; s.add(m); });
    const flota = Array.from({ length: 8 }, () => { const m = avionMundo(.55); s.add(m); m.visible = false; return m; });
    estrellas(s, 220, 220, 20);
    const c = cam(46);
    return { s, c, flota, upd(t) { g1.visible = Math.floor(t * 2) % 2 === 0; g2.visible = !g1.visible; gb.visible = Math.floor(t * 1.5) % 2 === 0; flota.forEach(m => m.visible = false);
      const x = Math.sin(t * .06) * 22; c.position.set(x, 9, 44); c.lookAt(x * .6, 7, -10); },
      acc: {
        // tres aviones aterrizan uno detrás de otro: descienden, levantan el morro, tocan pista y frenan
        aterrizajes(lt) {
          for (let i = 0; i < 3; i++) { const u = lt - i * 2.5; const m = flota[i]; if (u < 0) continue; m.visible = true;
            if (u < 3.4) { const k = u / 3.4; pose(m, -46 + 38 * k, 40 * (1 - k) ** 1.15 + 2.6, 0, 0, -.14 + .22 * ss(clamp((k - .75) / .25, 0, 1)), 0); }
            else { const r = Math.min(1, (u - 3.4) / 2.4), d = 36 * (r - r * r / 2); pose(m, -8 + d, 2.6, 0, 0, .08 * (1 - r), 0); } }
          c.position.set(-10, 8, 80); c.lookAt(-10, 5.5, 0);
        },
        // el cielo lleno: decenas de aviones cruzando a distintas alturas
        cielo_lleno(lt) {
          for (let i = 0; i < 8; i++) { const m = flota[i], dir = i % 2 ? -1 : 1, y = 40 + i * 8, z = -30 + (i % 3) * 18, x = ((i * 23 + lt * 16 * dir) % 90 + 90) % 90 - 45 - 12;
            m.visible = true; pose(m, x, y, z, dir > 0 ? 0 : Math.PI, 0, .15 * dir); }
          c.position.set(0, 10, 70); c.lookAt(0, 62, -20);
        },
      } };
  },
  radar: () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(P.ink); s.fog = new THREE.Fog(P.ink, 40, 110);
    luces(s, { cielo: 0x4a6a5a, suelo: 0x181425, amb: .7, sol: 0x9fe8b0, int: .9, dir: [10, 40, 40], sombra: 40 });
    const v = new Vox();
    v.box(-40, -1, -30, 40, 0, 30, (x, y, z) => ((x >> 2) + (z >> 2)) % 2 ? P.night : P.dslate);
    v.box(-40, 0, -16, 40, 34, -14, P.night);
    for (let i = -3; i <= 3; i++) { const x = i * 10 - 4;
      v.box(x, 0, -2, x + 8, 5, 4, P.slate); v.box(x, 5, 0, x + 8, 9, 2, P.dslate);
      v.box(x + 1, 6, 2, x + 7, 8, 3, (xx, yy) => (hsh(xx, yy, i) > .5 ? P.lime : P.dgreen));
      for (let k = 0; k < 6; k++) v.set(x + 1 + k, 5, 3, [P.amber, P.red, P.lime][(k + i + 9) % 3]); }
    v.luz(P.lime, P.amber, P.red); s.add(v.build());
    const tc = document.createElement('canvas'); tc.width = tc.height = 128; const tg = tc.getContext('2d');
    const tex = new THREE.CanvasTexture(tc); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.colorSpace = THREE.SRGBColorSpace;
    const pan = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.MeshBasicMaterial({ map: tex })); pan.position.set(0, 18, -13.9); s.add(pan);
    const marco = new Vox(); marco.box(-14, 4, -15, 14, 32, -14, P.slate); s.add(marco.build());
    const glow = new THREE.PointLight(0x63c74d, 30, 40, 1.6); glow.position.set(0, 18, -6); s.add(glow);
    const c = cam(48); let ruta = -1;
    const pinta = t => {   // pantalla: anillos, barrido, aviones con estela y (si ruta ≥ 0) un avión guiado por su ruta
      tg.fillStyle = '#0b1a12'; tg.fillRect(0, 0, 128, 128); tg.strokeStyle = '#265c42'; tg.lineWidth = 1;
      for (let k = 1; k <= 4; k++) { tg.beginPath(); tg.arc(64, 64, k * 15, 0, Math.PI * 2); tg.stroke(); }
      tg.beginPath(); tg.moveTo(4, 64); tg.lineTo(124, 64); tg.moveTo(64, 4); tg.lineTo(64, 124); tg.stroke();
      const a = t * 1.6; for (let d = 0; d < 20; d++) { tg.strokeStyle = `rgba(99,199,77,${(1 - d / 20) * .7})`; tg.beginPath(); tg.moveTo(64, 64); tg.lineTo(64 + Math.cos(a - d * .03) * 60, 64 + Math.sin(a - d * .03) * 60); tg.stroke(); }
      for (let i = 0; i < 10; i++) { const ang = hsh(i, 2, 2) * 6.28, sp = 3 + hsh(i, 3, 3) * 3, ph = (t * sp + hsh(i, 4, 4) * 120) % 120 - 60;
        const x = 64 + Math.cos(ang) * ph, y = 64 + Math.sin(ang) * ph; tg.fillStyle = '#3e8948'; for (let k = 1; k < 4; k++) tg.fillRect(Math.round(x - Math.cos(ang) * k * 3), Math.round(y - Math.sin(ang) * k * 3), 1, 1);
        tg.fillStyle = '#bfff9f'; tg.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3); }
      if (ruta >= 0) {   // ruta: entra por la izquierda, gira 90° y sigue hacia arriba
        const P0 = [10, 90], P1 = [64, 90], P2 = [64, 14], L1 = 54, L2 = 76, tot = L1 + L2, dib = clamp(ruta * 1.6, 0, 1) * tot;
        tg.strokeStyle = '#feae34'; tg.setLineDash([4, 3]); tg.beginPath(); tg.moveTo(...P0); tg.lineTo(P0[0] + Math.min(dib, L1), 90); if (dib > L1) tg.lineTo(64, 90 - (dib - L1)); tg.stroke(); tg.setLineDash([]);
        const av = clamp((ruta - .25) / .75, 0, 1) * tot, px = av < L1 ? P0[0] + av : 64, py = av < L1 ? 90 : 90 - (av - L1);
        tg.fillStyle = '#fee761'; tg.fillRect(Math.round(px) - 2, Math.round(py) - 2, 5, 5); tg.fillStyle = '#feae34'; tg.font = '8px monospace'; tg.fillText('IB3500', Math.round(px) + 4, Math.round(py) - 3);
      }
      tex.needsUpdate = true; glow.intensity = 24 + Math.sin(t * 3) * 6;
    };
    return { s, c, upd(t) { ruta = -1; pinta(t); const z = 46 - Math.sin(t * .05) * 6; c.position.set(Math.sin(t * .08) * 6, 14, z); c.lookAt(0, 15, -10); },
      acc: {
        // la cámara se acerca a la pantalla mientras el controlador traza la ruta de un avión
        pantalla(lt, dur, t) { ruta = clamp(lt / Math.max(1, dur - .3), 0, 1); pinta(t); const k = ss(clamp(lt / (dur * .7), 0, 1)); c.position.set(0, 16 + 2 * k, 48 - 26 * k); c.lookAt(0, 18, -14); },
      } };
  },
  aerovias: () => {
    const s = new THREE.Scene(); s.background = cielo([P.navy, P.blue, P.cyan, 0xd8f6ff]); s.fog = new THREE.Fog(0xbfe8ff, 140, 380);
    luces(s, { cielo: 0xd8f0ff, suelo: 0x3e8948, amb: 1.25, sol: 0xfff3d0, int: 2.4, dir: [-40, 80, 50], sombra: 140 });
    const tierra = new Vox(); for (let x = -40; x < 40; x++) for (let z = -40; z < 20; z++) { const f = hsh(x >> 2, 0, z >> 2); tierra.set(x, 0, z, f > .66 ? P.lime : f > .33 ? P.green : f > .1 ? P.sand : P.blue); }
    const gt = tierra.build({ jit: .03, sombra: false }); gt.scale.setScalar(6); gt.position.set(0, -70, -60); s.add(gt);
    const nubes = []; for (let i = 0; i < 10; i++) { const n = new Vox(); for (let k = 0; k < 4; k++) n.ball(k * 4 - 6, (k % 2) * 2, 0, 4 + (k % 3), P.white); const g = n.build({ jit: .03 }); g.position.set(-130 + i * 28, -26 + (i % 3) * 28, -50 - (i % 4) * 20); g.scale.setScalar(1.4); s.add(g); nubes.push(g); }
    const NIV = [-6, 6, 18, 30], carriles = NIV.map((y, i) => { const l = new Vox(), col = i % 2 ? P.cyan : P.orange; for (let x = 0; x < 300; x += 4) l.set(x, 0, 0, col); l.luz(col); const g = l.build({ sombra: false }); const piv = new THREE.Group(); piv.position.set(-150, y - 4, 0); piv.add(g); s.add(piv); return piv; });
    const flota = Array.from({ length: 8 }, () => { const m = avionMundo(.38); s.add(m); m.visible = false; return m; });
    const barra = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: P.yellow })); barra.visible = false; s.add(barra);
    const tope = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: P.yellow })); m.visible = false; s.add(m); return m; });
    const regla = (a, b, k) => {   // barra amarilla de a hasta (a→b)·k, con topes
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) * k; if (L < .1) return;
      barra.visible = true; barra.scale.set(dx ? L : 1.2, dy ? L : 1.2, 1.2); barra.position.set(a[0] + dx * k / 2, a[1] + dy * k / 2, 3);
      tope.forEach((m, i) => { m.visible = i === 0 || k >= 1; const p = i ? [a[0] + dx * k, a[1] + dy * k] : a; m.scale.set(dx ? 1.2 : 5, dx ? 5 : 1.2, 1.2); m.position.set(p[0], p[1], 3); });
    };
    const c = cam(46), base = t => { carriles.forEach(p => { p.scale.x = 1; p.visible = true; }); flota.forEach(m => m.visible = false); barra.visible = false; tope.forEach(m => m.visible = false);
      nubes.forEach((n, i) => { n.position.x = ((-130 + i * 28 + t * 2) % 280 + 280) % 280 - 140; }); };
    const vuelo = (t, n = 8) => { for (let i = 0; i < n; i++) { const L = i % 4, dir = L % 2 ? -1 : 1, x = ((i * 31 + L * 17 + t * 9 * dir) % 110 + 110) % 110 - 55; flota[i].visible = true; pose(flota[i], x, NIV[L], 0, dir > 0 ? 0 : Math.PI, 0, 0); } };
    return { s, c, upd(t) { base(t); vuelo(t); c.position.set(Math.sin(t * .05) * 4, 12, 92); c.lookAt(0, 12, 0); },
      acc: {
        // los carriles se dibujan de izquierda a derecha y cada avión se coloca en el suyo
        carriles(lt, dur, t) { carriles.forEach((p, i) => { p.scale.x = clamp((lt - i * .3) / 1.6, .001, 1); });
          for (let i = 0; i < 4; i++) { const m = flota[i], dir = i % 2 ? -1 : 1, y0 = NIV[i] + (i % 2 ? 7 : -7), k = ss(clamp((lt - .8 - i * .3) / 1.2, 0, 1)); m.visible = true; flota[i + 4].visible = false;
            pose(m, (i % 2 ? 9 : -9) + lt * 3 * dir, y0 + (NIV[i] - y0) * k, 0, dir > 0 ? 0 : Math.PI, 0, (1 - k) * .35 * dir); }
          c.position.set(0, 12, 92); c.lookAt(0, 12, 0); },
        // dos aviones en el mismo carril, separados ~9 km: la regla se estira entre los dos
        separacion(lt) { flota.forEach(m => m.visible = false); carriles.forEach((p, i) => p.visible = i === 1); const x = -26 + lt * 5, y = NIV[1];
          [0, 1].forEach(i => { flota[i].visible = true; pose(flota[i], x + i * 28, y, 0, 0, 0, 0); });
          regla([x + 6, y + 5], [x + 22, y + 5], ss(clamp((lt - .6) / 1.4, 0, 1)));
          c.position.set(x + 14, 12, 100); c.lookAt(x + 14, 9, 0); },
        // dos aviones se cruzan: uno pasa 300 m por encima del otro
        cruce(lt, dur) { flota.forEach(m => m.visible = false); carriles.forEach((p, i) => p.visible = i === 1 || i === 2); const u = lt / dur, xa = -24 + u * 48, xb = 24 - u * 48;
          flota[0].visible = flota[1].visible = true; pose(flota[0], xa, NIV[1], 0, 0, 0, 0); pose(flota[1], xb, NIV[2], 0, Math.PI, 0, 0);
          const k = ss(clamp((lt - dur * .35) / 1.2, 0, 1)); if (k > 0) regla([(xa + xb) / 2, NIV[1] + 3], [(xa + xb) / 2, NIV[2] - 3], k);
          c.position.set(0, 13, 88); c.lookAt(0, 11, 0); },
        // todos los carriles: los naranjas (impares) hacia el este, los cian (pares) hacia el oeste
        este_oeste(lt, dur, t) { vuelo(t * 1.6); c.position.set(0, 12, 96); c.lookAt(0, 12, 0); },
        // de frente: la cámara va detrás de un avión y el que viene de cara pasa por encima
        de_frente(lt, dur) { flota.forEach(m => m.visible = false); carriles.forEach(p => p.visible = false); const u = lt / dur, xa = -14 + u * 14, xb = 70 - u * 110;
          flota[0].visible = flota[1].visible = true; pose(flota[0], xa, NIV[1], 0, 0, 0, 0); pose(flota[1], xb, NIV[2], 0, Math.PI, 0, 0);
          c.position.set(xa - 20, NIV[1] + 4, 40); c.lookAt(xa + 10, NIV[1] - 1, 0); },
      } };
  },
  puerta: () => {   // cuarto final: pared de ladrillo, puerta con luz cálida y suelo de madera
    const s = new THREE.Scene(); s.background = new THREE.Color(P.ink); s.fog = new THREE.Fog(P.ink, 50, 120);
    luces(s, { cielo: 0x9a8ac8, suelo: 0x3e2731, amb: .8, sol: 0xffe2b0, int: 1.6, dir: [30, 50, 50], sombra: 50 });
    const v = new Vox();
    v.box(-40, -1, -20, 40, 0, 30, (x, y, z) => (z % 3 === 0 ? P.dbrown : P.brown));
    v.box(-40, 0, -14, 40, 40, -12, (x, y) => ((y % 4 === 0) || ((x + (y >> 2) * 3) % 7 === 0)) ? P.umber : (hsh(x, y, 0) > .5 ? P.crimson : 0x8a2a32));
    for (let y = 0; y < 22; y++) for (let x = -6; x < 6; x++) v.del(x, y, -13), v.del(x, y, -14);
    v.box(-6, 0, -16, 6, 22, -15, P.amber); v.box(-7, 22, -13, 7, 23, -11, P.slate);
    v.luz(P.amber); s.add(v.build());
    const l = new THREE.PointLight(0xfeae34, 120, 60, 1.6); l.position.set(0, 10, -10); s.add(l);
    estrellas(s, 0);
    const c = cam(44);
    return { s, c, upd(t) { l.intensity = 110 + Math.sin(t * 4) * 12; c.position.set(Math.sin(t * .07) * 8, 12, 46); c.lookAt(0, 11, -10); } };
  },
};

// ———————————————————— 19/11/2026: HD (píxeles), escaños (29-N) y GTA 6 (Leonida) ————————————————————
// utilidades nuevas: bloques dinámicos (un InstancedMesh que se recoloca cada fotograma), pantallas con textura y cámara "mira"
class Bloques {
  constructor(n, basic = false) { this.n = n; this.im = new THREE.InstancedMesh(BOX, basic ? new THREE.MeshBasicMaterial({ color: 0xffffff }) : new THREE.MeshLambertMaterial({ color: 0xffffff }), n);
    this.im.castShadow = !basic; this.im.receiveShadow = !basic; this.M = new THREE.Matrix4(); this.Q = new THREE.Quaternion(); this.E = new THREE.Euler(); this.S = new THREE.Vector3(); this.V = new THREE.Vector3(); this.col = new THREE.Color(); this.i = 0;
    this.im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); for (let k = 0; k < n; k++) this.im.setColorAt(k, this.col.setHex(0xffffff)); this.im.frustumCulled = false; }
  ini() { this.i = 0; return this; }
  pon(x, y, z, sx, sy, sz, c, ry = 0) { if (this.i >= this.n) return; this.Q.setFromEuler(this.E.set(0, ry, 0)); this.M.compose(this.V.set(x, y, z), this.Q, this.S.set(Math.max(1e-3, sx), Math.max(1e-3, sy), Math.max(1e-3, sz))); this.im.setMatrixAt(this.i, this.M); this.im.setColorAt(this.i, typeof c === 'number' ? this.col.setHex(c) : c); this.i++; }
  fin() { this.M.makeScale(0, 0, 0); for (let k = this.i; k < this.n; k++) this.im.setMatrixAt(k, this.M); this.im.count = this.n; this.im.instanceMatrix.needsUpdate = true; if (this.im.instanceColor) this.im.instanceColor.needsUpdate = true; }
}
function pantalla(w, h, pw, ph) { const cv = document.createElement('canvas'); cv.width = pw; cv.height = ph; const g = cv.getContext('2d'); const tex = new THREE.CanvasTexture(cv); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex })); return { m, g, cv, tex }; }
// cámara en p mirando a q, con el objetivo algo por encima del centro (lo importante entre el 10 % y el 60 % de la altura)
function mira(c, p, q, sube = .1) { c.position.set(...p); const d = Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); c.lookAt(q[0], q[1] - sube * d, q[2]); }
const lerp = (a, b, k) => a + (b - a) * k, hx = h => '#' + h.toString(16).padStart(6, '0');
function actor(n, sc = 1) { const m = modelo(n).clone(); m.scale.setScalar(sc); return m; }

// imagen de la "tele": atardecer en la costa con un velero; se dibuja a cualquier resolución
function paisaje(g, W2, H2, t) {
  const gr = g.createLinearGradient(0, 0, 0, H2 * .6); gr.addColorStop(0, '#124e89'); gr.addColorStop(.6, '#f6757a'); gr.addColorStop(1, '#feae34'); g.fillStyle = gr; g.fillRect(0, 0, W2, H2);
  g.fillStyle = '#fee761'; g.beginPath(); g.arc(W2 * .68, H2 * .5, H2 * .16, 0, 7); g.fill();
  g.fillStyle = '#68386c'; g.beginPath(); g.moveTo(0, H2 * .62); g.lineTo(W2 * .18, H2 * .36); g.lineTo(W2 * .34, H2 * .55); g.lineTo(W2 * .48, H2 * .42); g.lineTo(W2 * .6, H2 * .62); g.fill();
  g.fillStyle = '#0099db'; g.fillRect(0, H2 * .6, W2, H2 * .4); g.fillStyle = '#2ce8f5'; for (let k = 0; k < 6; k++) g.fillRect(((k * 37 + t * 9) % 110) / 100 * W2 - W2 * .05, H2 * (.68 + k * .05), W2 * .12, Math.max(1, H2 * .012));
  const bx = ((t * 6) % 140) / 100 * W2 - W2 * .2; g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(bx, H2 * .68); g.lineTo(bx + W2 * .06, H2 * .48); g.lineTo(bx + W2 * .07, H2 * .68); g.fill(); g.fillStyle = '#733e39'; g.fillRect(bx - W2 * .02, H2 * .68, W2 * .11, H2 * .04);
  g.fillStyle = '#3e8948'; g.fillRect(W2 * .06, H2 * .45, W2 * .015, H2 * .2); g.fillStyle = '#63c74d'; g.beginPath(); g.arc(W2 * .067, H2 * .44, H2 * .07, 0, 7); g.fill();
}
const _tmp = document.createElement('canvas'), _tg = _tmp.getContext('2d');
// pinta en la pantalla el paisaje a 'res' columnas (bloques nítidos) o, con borroso, estirado y suavizado
function emitir(P2, res, t, o = {}) {
  const { g, cv } = P2, w = Math.max(2, Math.round(res)), h = Math.max(2, Math.round(res * cv.height / cv.width)); _tmp.width = w; _tmp.height = h; paisaje(_tg, w, h, t);
  g.imageSmoothingEnabled = !!o.borroso; g.filter = o.borroso ? 'blur(2px)' : 'none'; g.drawImage(_tmp, 0, 0, cv.width, cv.height); g.filter = 'none';
  if (o.marca) { g.fillStyle = o.marcaCol || '#fee761'; g.fillRect(cv.width - 46, 6, 40, 20); g.fillStyle = '#181425'; g.font = 'bold 16px monospace'; g.fillText(o.marca, cv.width - 42, 22); }
  if (o.canal != null) { g.fillStyle = '#63c74d'; g.font = 'bold 20px monospace'; g.fillText('CH ' + o.canal, 8, 24); }
  P2.tex.needsUpdate = true;
}
function apagar(P2, k) { const { g, cv } = P2; g.fillStyle = '#0b0b12'; g.fillRect(0, 0, cv.width, cv.height); if (k > 0) { g.fillStyle = '#ffffff'; const hh = Math.max(1, cv.height * k * k); g.fillRect(cv.width * (.5 - k / 2), (cv.height - hh) / 2, cv.width * k, hh); } P2.tex.needsUpdate = true; }
// colores de la imagen a una rejilla de cols×filas
function rejilla(cols, filas) { _tmp.width = cols; _tmp.height = filas; paisaje(_tg, cols, filas, 3); const d = _tg.getImageData(0, 0, cols, filas).data, out = []; for (let i = 0; i < cols * filas; i++) out.push(new THREE.Color(`rgb(${d[i * 4]},${d[i * 4 + 1]},${d[i * 4 + 2]})`)); return out; }
// letras 5×7 para escribir con vóxeles
const F57 = { P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'], I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'], X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'], E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'], L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'] };

Object.assign(FAB, {
  tele: () => {   // televisor plano con marco negro, peana y piloto rojo
    const v = new Vox(); v.box(-10, 0, 0, 10, 12, 2, P.ink); v.box(-9, 1, 2, 9, 11, 3, P.night); v.box(-2, -3, 0, 2, 0, 2, P.dslate); v.box(-5, -4, -2, 5, -3, 3, P.slate); v.set(8, 0, 2, P.red); v.luz(P.red);
    const w = new THREE.Group(); w.add(v.build({ centrar: true })); return w;
  },
  mando: () => {   // mando a distancia con botones de colores
    const v = new Vox(); v.box(-2, 0, -1, 2, 14, 1, P.dslate); v.box(-2, 14, -1, 2, 15, 1, P.slate); v.set(0, 12, 1, P.red);
    for (let y = 3; y < 11; y += 2) for (const x of [-1, 1]) v.set(x, y, 1, [P.silver, P.white][(y + x + 9) % 2]); v.set(-1, 1, 1, P.lime); v.set(1, 1, 1, P.cyan); v.luz(P.red, P.lime, P.cyan);
    const w = new THREE.Group(); w.add(v.build({ centrar: true })); return w;
  },
  urna: () => {   // urna transparente con ranura y papeletas dentro
    const v = new Vox(); for (let x = -5; x <= 5; x++) for (let y = 0; y <= 10; y++) for (let z = -4; z <= 4; z++) if (Math.abs(x) === 5 || Math.abs(z) === 4 || y === 0 || y === 10) v.set(x, y, z, (y === 10 || y === 0) ? P.navy : 0xd8f6ff);
    for (let x = -2; x <= 2; x++) v.del(x, 10, 0); for (let i = 0; i < 9; i++) v.box(-4 + (i % 4) * 2, 1 + (i >> 2), -2 + (i % 3) * 2, -2 + (i % 4) * 2, 2 + (i >> 2), -1 + (i % 3) * 2, P.white);
    const w = new THREE.Group(); w.add(v.build({ centrar: true })); return w;
  },
  escano: () => {   // escaño: sillón rojo con respaldo y patas
    const v = new Vox(); v.box(-3, 2, -3, 3, 4, 3, P.crimson); v.box(-3, 4, -3, 3, 10, -1, P.red); v.box(-4, 2, -3, -3, 6, 3, P.dbrown); v.box(3, 2, -3, 4, 6, 3, P.dbrown); v.box(-3, 0, -2, -2, 2, -1, P.ink); v.box(2, 0, -2, 3, 2, -1, P.ink); v.box(-3, 0, 1, -2, 2, 2, P.ink); v.box(2, 0, 1, 3, 2, 2, P.ink);
    const w = new THREE.Group(); w.add(v.build({ centrar: true })); return w;
  },
  coche: () => {   // descapotable retro de los 80, rosa con franja blanca
    const v = new Vox(); v.box(-10, 2, -4, 10, 5, 4, P.pink); v.box(-10, 4, -4, 10, 5, -3, P.white); v.box(-10, 4, 3, 10, 5, 4, P.white); v.box(-3, 5, -4, 4, 6, 4, P.rose); v.box(-6, 3, -3, 3, 6, 3, P.umber); v.del(0, 5, 0);
    v.box(4, 6, -3, 5, 8, 3, 0xbfe8ff); v.box(10, 3, -3, 11, 4, -1, P.yellow); v.box(10, 3, 1, 11, 4, 3, P.yellow); v.box(-11, 3, -3, -10, 4, -1, P.red); v.box(-11, 3, 1, -10, 4, 3, P.red); v.luz(P.yellow, P.red);
    for (const [x, z] of [[-6, -4], [6, -4], [-6, 4], [6, 4]]) v.box(x - 2, 0, z - (z < 0 ? 1 : 0), x + 2, 3, z + (z < 0 ? 0 : 1), P.ink);
    const w = new THREE.Group(); const g = v.build({ centrar: true }); w.add(g); return w;
  },
  palmera: () => {   // palmera: tronco curvo a franjas y hojas que caen
    const v = new Vox(); for (let y = 0; y < 22; y++) { const x = Math.round(Math.sin(y / 9) * 3); v.box(x - 1, y, -1, x + 1, y + 1, 1, y % 3 ? P.tan : P.brown); }
    const top = [Math.round(Math.sin(22 / 9) * 3), 22]; for (let a = 0; a < 6; a++) { const ang = a / 6 * Math.PI * 2; for (let r = 1; r < 9; r++) v.set(top[0] + Math.cos(ang) * r, top[1] + 1 - (r * r) / 14, Math.sin(ang) * r, r % 3 ? P.green : P.lime); }
    v.ball(top[0], top[1], 0, 1.4, P.dbrown);
    const w = new THREE.Group(); w.add(v.build({ centrar: true })); return w;
  },
  caja: () => {   // caja de juego genérica con portada de atardecer y palmera (sin marcas)
    const v = new Vox(); v.box(-6, 0, -1, 6, 17, 1, P.ink);
    for (let x = -5; x < 5; x++) for (let y = 1; y < 16; y++) v.set(x, y, 1, y > 11 ? P.navy : y > 7 ? P.rose : y > 4 ? P.orange : P.blue);
    v.box(-1, 7, 1, 3, 11, 2, P.yellow); for (let y = 2; y < 12; y++) v.set(-4 + (y > 8 ? 1 : 0), y, 2, P.dbrown); for (let k = -2; k <= 2; k++) v.set(-4 + k, 12 - Math.abs(k) * .5, 2, P.green); v.luz(P.yellow);
    const w = new THREE.Group(); w.add(v.build({ centrar: true })); return w;
  },
});

Object.assign(FABE, {
  // —— HD: el salón con la tele ——
  salon: () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(P.umber); s.fog = new THREE.Fog(P.umber, 90, 200);
    luces(s, { cielo: 0xffd8b0, suelo: 0x3e2731, amb: 1.2, sol: 0xffe2b0, int: 1.4, dir: [30, 60, 60], sombra: 60 });
    const v = new Vox();
    v.box(-50, -1, -20, 50, 0, 60, (x, y, z) => ((x >> 2) + (z >> 3)) % 2 ? P.brown : P.dbrown);
    v.box(-50, 0, -22, 50, 50, -20, (x, y) => (x % 8 === 0 ? P.plum : 0x5a3060));
    v.box(-30, 0, -19, 30, 6, -12, P.dbrown); v.box(-30, 6, -19, 30, 7, -12, P.brown);                       // mueble
    v.box(36, 0, -18, 38, 26, -16, P.ink); v.ball(37, 28, -17, 4, P.amber); v.luz(P.amber);                     // lámpara
    for (let i = 0; i < 5; i++) v.box(-44 + i * 3, 30, -20, -42 + i * 3, 38 + (i % 2) * 3, -19, [P.red, P.cyan, P.lime, P.yellow, P.orange][i]);   // libros
    v.box(-22, 0, -2, 22, 1, 22, (x, y, z) => ((x + z) % 6 === 0 ? P.orange : P.crimson));   // alfombra
    v.box(-46, 0, -10, -34, 8, 2, P.navy); v.box(-46, 8, -10, -44, 16, 2, P.blue);   // butaca a un lado
    s.add(v.build());
    const tvs = [0, 1].map(() => { const tv = actor('tele', 1); const P2 = pantalla(18, 10, 256, 144); P2.m.position.set(0, 2, 2.6); tv.add(P2.m); s.add(tv); tv.userData.P = P2; return tv; });
    const mando = actor('mando', .45); s.add(mando);
    const l = new THREE.PointLight(0x9fd8ff, 60, 70, 1.6); l.position.set(0, 14, 6); s.add(l);
    const c = cam(46), quieto = t => { tvs[0].position.set(0, 11, -14); tvs[0].rotation.set(0, 0, 0); tvs[0].visible = true; tvs[1].visible = false; mando.visible = false; };
    return { s, c, upd(t) { quieto(t); emitir(tvs[0].userData.P, 256, t); mira(c, [Math.sin(t * .1) * 4, 15, 38], [0, 13, -14], .06); },
      acc: {
        // la tele se enciende y la imagen pasa de bloques gordos a nítida; la cámara se acerca
        encendido(lt, dur, t) { const P2 = tvs[0].userData.P; if (lt >= 0 && lt < .08) apagar(P2, .5 + lt / .16); else { const k = ss(clamp((lt - .6) / (dur * .6), 0, 1)); emitir(P2, lerp(12, 256, k * k), t, { marca: k > .98 ? 'HD' : null }); }
          const k = ss(clamp(lt / dur, 0, 1)); mira(c, [0, 17 - 2 * k, 62 - 26 * k], [0, 13, -14], .05); l.intensity = 60; },
        // el mando cambia de canal: cada canal salta de la baja definición a HD
        zapping(lt, dur, t) { const P2 = tvs[0].userData.P, n = Math.floor(lt / (dur / 3)), u = (lt % (dur / 3)) / (dur / 3); mando.visible = true;
          const pulsa = u < .12 ? Math.sin(u / .12 * Math.PI) : 0; mando.position.set(-7, 6.5 - pulsa * .8, 18); mando.rotation.set(-.9 - pulsa * .2, .3, -.15);
          if (u < .1) apagar(P2, 0); else emitir(P2, u < .45 ? 40 : 256, t + n * 7, { canal: 7 + n * 3, marca: u < .45 ? 'SD' : 'HD', marcaCol: u < .45 ? '#c0cbdc' : '#fee761', borroso: u < .45 });
          mira(c, [8, 15, 42], [1, 11, -12], .05); },
        // dos teles iguales: a la izquierda la señal antigua, a la derecha la HD
        dos_teles(lt, dur, t) { tvs[0].position.set(-11.5, 11, -14); tvs[1].position.set(11.5, 11, -14); tvs[1].visible = true; tvs[0].rotation.y = .12; tvs[1].rotation.y = -.12;
          emitir(tvs[0].userData.P, 40, t, { borroso: true, marca: 'SD', marcaCol: '#c0cbdc' }); emitir(tvs[1].userData.P, 256, t, { marca: 'HD' });
          const k = ss(clamp(lt / dur, 0, 1)); mira(c, [Math.sin(k * 1.2 - .6) * 10, 15, 82 - 6 * k], [0, 13, -14], .07); },
      } };
  },
  // —— HD: dentro de la imagen, un muro de píxeles de vóxeles ——
  pixeles: () => {
    const s = new THREE.Scene(); s.background = cielo([P.ink, P.night, P.dslate]); s.fog = new THREE.Fog(P.ink, 120, 260);
    luces(s, { cielo: 0xd8e0ff, suelo: 0x262b44, amb: 1.5, sol: 0xffffff, int: 1.6, dir: [-20, 40, 80], sombra: 60 });
    const v = new Vox(); for (let x = -80; x < 80; x += 1) for (let z = -40; z < 60; z += 1) if ((x & 7) === 0 || (z & 7) === 0) v.set(x, -12, z, P.dslate); v.luz(P.dslate); s.add(v.build({ sombra: false }));
    const CW = 14, CH = 8, FW = 32, FH = 18, ANCHO = 32, gC = rejilla(CW, CH), gF = rejilla(FW, FH), B = new Bloques(FW * FH + CW * CH + 10); s.add(B.im);
    const c = cam(46), mezcla = new THREE.Color();
    const fino = (k = 1, dz = () => 0) => { const b = ANCHO / FW; for (let j = 0; j < FH; j++) for (let i = 0; i < FW; i++) B.pon(-ANCHO / 2 + b * (i + .5), ANCHO * 9 / 32 - b * (j + .5) + 4, dz(i, j), b * .92 * k, b * .92 * k, b * .9, gF[j * FW + i]); };
    const grueso = (b, cx, cy, caida = () => 0, borra = 0) => { for (let j = 0; j < CH; j++) for (let i = 0; i < CW; i++) { let col = gC[j * CW + i];
      if (borra > 0) { const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, d]) => gC[clamp(j + d, 0, CH - 1) * CW + clamp(i + a, 0, CW - 1)]); mezcla.copy(col); n.forEach(q => mezcla.lerp(q, borra * .22)); col = mezcla.clone(); }
      B.pon(cx - CW * b / 2 + b * (i + .5), cy + CH * b / 2 - b * (j + .5) + caida(i, j), 0, b * (borra > 0 ? 1.04 : .94), b * (borra > 0 ? 1.04 : .94), b * .9, col); } };
    return { s, c, upd(t) { B.ini(); fino(1, (i, j) => Math.sin(t * 2 + i * .4 + j * .3) * .3); B.fin(); mira(c, [Math.sin(t * .1) * 6, 10, 72], [0, 9, 0], .08); },
      acc: {
        // la cámara se mete en la imagen hasta ver que son cubitos de colores
        zoom(lt, dur, t) { B.ini(); fino(1, (i, j) => Math.sin(t * 3 + i * .5 + j * .4) * .6 * ss(clamp(lt / dur, 0, 1))); B.fin(); const k = ss(clamp(lt / (dur * .85), 0, 1)); mira(c, [lerp(0, 6, k), lerp(9, 13, k), lerp(78, 22, k)], [lerp(0, 4, k), lerp(9, 12, k), 0], .05); },
        // la imagen antigua: pocos bloques gordos que caen fila a fila
        gruesos(lt, dur) { B.ini(); const b = ANCHO / CW; grueso(b, 0, 13, (i, j) => { const u = clamp((lt - j * .18 - i * .02) / .5, 0, 1); return (1 - ss(u)) * 40; }); B.fin(); mira(c, [0, 10, 76], [0, 9, 0], .08); },
        // cada bloque gordo se parte en bloques pequeños: cinco veces más puntos
        dividir(lt, dur) { B.ini(); const k = ss(clamp((lt - .3) / (dur * .6), 0, 1)), bC = ANCHO / CW, bF = ANCHO / FW;
          for (let j = 0; j < FH; j++) for (let i = 0; i < FW; i++) { const u = (i + .5) / FW, w = (j + .5) / FH, pi = Math.min(CW - 1, Math.floor(u * CW)), pj = Math.min(CH - 1, Math.floor(w * CH));
            const x0 = -ANCHO / 2 + bC * (pi + .5), y0 = 13 + CH * bC / 2 - bC * (pj + .5), x1 = -ANCHO / 2 + bF * (i + .5), y1 = ANCHO * 9 / 32 - bF * (j + .5) + 4, sz = lerp(bC * .94, bF * .92, k);
            B.pon(lerp(x0, x1, k), lerp(y0, y1, k), Math.sin(k * Math.PI) * (((i * 7 + j * 3) % 5) - 2) * 2, sz, sz, sz * .95, mezcla.copy(gC[pj * CW + pi]).lerp(gF[j * FW + i], k).clone()); }
          B.fin(); mira(c, [0, 10, 76 + 4 * k], [0, 9, 0], .08); },
        // la imagen pequeña se estira para llenar la pantalla: bloques enormes y colores corridos
        estirar(lt, dur) { B.ini(); const k = ss(clamp((lt - .2) / (dur * .55), 0, 1)); grueso(lerp(1.1, ANCHO / CW * 1.25, k), 0, 13, () => 0, k); B.fin(); mira(c, [0, 10, 80], [0, 9, 0], .08); },
      } };
  },
  // —— HD: la palabra PIXEL hecha de vóxeles ——
  mosaico: () => {
    const s = new THREE.Scene(); s.background = cielo([P.navy, P.plum, P.rose]); s.fog = new THREE.Fog(0x5a3060, 120, 260);
    luces(s, { cielo: 0xffe0f0, suelo: 0x3a4466, amb: 1.4, sol: 0xfff1d6, int: 1.8, dir: [-30, 60, 60], sombra: 70 });
    const v = new Vox(); v.box(-60, -1, -30, 60, 0, 40, (x, y, z) => ((x >> 2) + (z >> 2)) % 2 ? P.dslate : P.slate); s.add(v.build());
    const cubos = []; 'PIXEL'.split('').forEach((ch, li) => F57[ch].forEach((row, j) => row.split('').forEach((b, i) => { if (b === '1') cubos.push([li * 6 + i - 14.5, 6 - j, li]); })));
    const B = new Bloques(cubos.length + 4); s.add(B.im); const cols = [P.red, P.orange, P.yellow, P.lime, P.cyan];
    const c = cam(46), dibuja = (lt, t) => { B.ini(); cubos.forEach(([x, y, li], n) => { const u = lt == null ? 1 : clamp((lt - li * .35 - (6 - y) * .04) / .6, 0, 1), e = u < 1 ? (1 - ss(u)) * 30 : 0;
      B.pon(x * 1.6, 8 + y * 1.6 + e + Math.sin(t * 3 + x * .5) * .25, 0, 1.5, 1.5, 1.5, cols[li], (1 - u) * 3); }); B.fin(); };
    return { s, c, upd(t) { dibuja(null, t); mira(c, [Math.sin(t * .12) * 8, 16, 104], [0, 12, 0], .1); },
      acc: { letras(lt, dur, t) { dibuja(lt, t); const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-12, 6, k), 16, 108 - 6 * k], [0, 12, 0], .1); } } };
  },

  // —— escaños: el hemiciclo con 350 asientos ——
  hemiciclo: () => {
    const s = new THREE.Scene(); s.background = cielo([P.umber, P.dbrown, P.crimson]); s.fog = new THREE.Fog(0x3e2731, 120, 260);
    luces(s, { cielo: 0xffe2b0, suelo: 0x3e2731, amb: 1.3, sol: 0xfff1d6, int: 1.8, dir: [20, 70, 50], sombra: 80 });
    const v = new Vox(); v.box(-70, -1, -50, 70, 0, 40, (x, y, z) => (Math.hypot(x, z + 10) < 7 ? P.navy : ((x + z) & 3) ? P.dbrown : P.brown)); v.box(-6, 0, 0, 6, 3, 3, P.brown); v.box(-3, 3, 0, 3, 5, 3, P.dbrown);   // suelo, tribuna
    for (let x = -66; x < 66; x += 12) v.box(x, 0, -44, x + 4, 40, -40, P.sand); v.box(-70, 40, -46, 70, 44, -38, P.tan); s.add(v.build());
    const SE = hemiSitios(), B = new Bloques(SE.length * 2 + 4); B.im.scale.setScalar(.5); s.add(B.im);
    const c = cam(46);
    const pinta = (f, dy = () => 0) => { B.ini(); SE.forEach(([x, z, y, a], i) => { const col = f(i); B.pon(x, y + 1 + dy(i), z, 2.2, 1.4, 2, col, a); B.pon(x - Math.sin(a) * 1.0, y + 2.6 + dy(i), z - Math.cos(a) * 1.0, 2.2, 2.4, .6, col, a); }); B.fin(); };
    return { s, c, SE, upd(t) { pinta(() => P.crimson); mira(c, [Math.sin(t * .08) * 8, 55, 72], [0, 3, -10], .02); },
      acc: {
        // los 350 escaños se encienden fila a fila, de dentro afuera
        encender(lt, dur) { pinta(i => (lt > .3 + SE[i][4] * .22 + SE[i][5] * .5 ? P.yellow : P.crimson), i => { const d = lt - .3 - SE[i][4] * .22 - SE[i][5] * .5; return d > 0 && d < .3 ? Math.sin(d / .3 * Math.PI) * 2 : 0; }); mira(c, [0, 56, 74], [0, 3, -10], .02); },
        // los escaños salen volando hacia el cielo, a repartirse por provincias
        vuelo(lt, dur) { const k = clamp(lt / dur, 0, 1); pinta(() => P.yellow, i => { const d = clamp((lt - .2 - (i % 50) * .03) / 1.6, 0, 1); return ss(d) * 70 * (1 + (i % 7) * .1); }); mira(c, [0, 55 + 20 * ss(k), 74], [0, 3 + 35 * ss(k), -10], .02); },
      } };
  },
  // —— escaños: 52 peanas (50 provincias, Ceuta y Melilla) donde caen los escaños ——
  provincias: () => {
    const s = new THREE.Scene(); s.background = cielo([P.navy, P.blue, 0xbfe8ff]); s.fog = new THREE.Fog(0xbfe8ff, 140, 300);
    luces(s, { cielo: 0xd8f0ff, suelo: 0x3e8948, amb: 1.3, sol: 0xfff3d0, int: 2.0, dir: [-30, 70, 50], sombra: 70 });
    const v = new Vox(); v.box(-70, -2, -60, 70, -1, 50, (x, y, z) => ((x >> 3) + (z >> 3)) % 2 ? P.blue : P.navy); v.box(-26, -1, -40, 26, 0, 46, P.sand); v.box(-25, 0, -39, 25, 1, 37, P.tan); s.add(v.build());
    const PE = []; for (let j = 0; j < 10; j++) for (let i = 0; i < 5; i++) PE.push([-18 + i * 9, -34 + j * 7.4]); PE.push([-5, 42], [5, 42]);   // Ceuta y Melilla, aparte
    const peso = PE.map((p, i) => i >= 50 ? 0 : (i === 19 ? 30 : i === 12 ? 24 : i === 40 ? 13 : i === 30 ? 11 : 1 + (hsh(i, 5, 5) * 5 | 0)));
    const tot = peso.reduce((a, b) => a + b, 0), extra = peso.map(p => Math.round(p / tot * 248)); let dif = 248 - extra.reduce((a, b) => a + b, 0); extra[19] += dif;
    const B = new Bloques(52 * 2 + 400); s.add(B.im);
    const c = cam(46);
    const dibuja = (kb, ke, alto) => { B.ini(); PE.forEach(([x, z], i) => { const h = 1 + (alto ? peso[i] * .2 * alto : 0), isla = i >= 50; B.pon(x, 1 + h / 2, z, 7, h, 6, isla ? P.cyan : P.silver);
      const n0 = isla ? 1 : 2, n = n0 + extra[i]; for (let q = 0; q < n; q++) { const u = q < n0 ? clamp((kb - (i % 13) * .04 - q * .1) / .45, 0, 1) : clamp((ke - q * .06 - (i % 9) * .03) / .4, 0, 1); if (u <= 0) continue;
        const cx = x - 2.55 + (q % 4) * 1.7, cy = 1 + h + 1 + Math.floor(q / 4) * 1.5, cz = z; B.pon(cx, cy + (1 - ss(u)) * 30, cz, 1.5, 1.3, 2, q < n0 ? P.red : P.orange); } }); B.fin(); };
    return { s, c, upd(t) { dibuja(9, 9, 1); mira(c, [Math.sin(t * .08) * 6, 96, 96], [0, 0, 14], .02); },
      acc: {
        // dos escaños caen en cada provincia (uno en Ceuta y otro en Melilla)
        base(lt, dur) { dibuja(lt * 1.2, 0, 0); const k = ss(clamp(lt / dur, 0, 1)); mira(c, [0, 98 - 6 * k, 98 - 6 * k], [0, 0, 14], .02); },
        // las provincias con más gente crecen y reciben más escaños
        crecer(lt, dur) { const k = ss(clamp((lt - .2) / 1.5, 0, 1)); dibuja(9, lt * 1.4, k); mira(c, [lerp(0, 14, ss(clamp(lt / dur, 0, 1))), 96, 96], [0, 3, 14], .02); },
      } };
  },
  // —— escaños: la mesa del recuento (D'Hondt) y un hemiciclo al fondo ——
  recuento: () => {
    const s = new THREE.Scene(); s.background = cielo([P.ink, P.night, P.dslate]); s.fog = new THREE.Fog(P.night, 120, 260);
    luces(s, { cielo: 0xd8e0ff, suelo: 0x262b44, amb: 1.4, sol: 0xfff1d6, int: 1.9, dir: [-20, 70, 60], sombra: 80 });
    const v = new Vox(); v.box(-70, -1, -150, 70, 0, 40, (x, y, z) => ((x >> 2) + (z >> 2)) % 2 ? P.dslate : P.slate); v.box(-25, 0, -8, 25, 3, 8, P.brown); v.box(-25, 3, -8, 25, 4, 8, P.dbrown); s.add(v.build());
    const urnas = [-18, -6, 6, 18].map(x => { const u = actor('urna', .7); u.position.set(x, 8, 4); s.add(u); return u; });
    const esc = Array.from({ length: 8 }, () => { const e = actor('escano', .5); s.add(e); e.visible = false; return e; });
    const VOT = [30, 22, 12, 2], COL = [P.cyan, P.amber, P.pink, P.steel], B = new Bloques(900); s.add(B.im);
    const SE = hemiSitios(); const HB = new Bloques(SE.length * 2); HB.im.scale.setScalar(.5); HB.im.position.set(0, 0, -62); s.add(HB.im);
    const barra = new THREE.Mesh(new THREE.BoxGeometry(50, .5, .5), new THREE.MeshBasicMaterial({ color: P.red })); barra.visible = false; s.add(barra);
    const c = cam(46);
    // columnas de papeletas: partido p, divisor d → altura VOT[p]/d (en papeletas apiladas)
    const COLS = []; for (let p = 0; p < 3; p++) for (let d = 1; d <= 4; d++) COLS.push({ p, d, v: VOT[p] / d }); const orden = [...COLS].sort((a, b) => b.v - a.v);
    const pila = (x, z, n, col, cae = 0) => { for (let q = 0; q < Math.round(n); q++) B.pon(x, 4.6 + q * .7 - cae, z, 2.4, .5, 2.2, q % 2 ? col : new THREE.Color(col).multiplyScalar(.85)); };
    const hemi = (n, rojo) => { HB.ini(); SE.forEach(([x, z, y, a], i) => { const col = i < n ? P.yellow : P.crimson; HB.pon(x, y + 1, z, 2.2, 1.4, 2, col, a); HB.pon(x - Math.sin(a), y + 2.6, z - Math.cos(a), 2.2, 2.4, .6, col, a); }); HB.fin(); };
    const xCol = (p, d) => -18 + p * 12 + (d - 1) * 2.8;
    return { s, c, upd(t) { B.ini(); for (let p = 0; p < 4; p++) pila(-18 + p * 12, -2, VOT[p] * .5, COL[p]); B.fin(); esc.forEach(e => e.visible = false); barra.visible = false; urnas.forEach(u => u.visible = true); hemi(0); mira(c, [Math.sin(t * .1) * 8, 30, 84], [0, 9, 0], .06); },
      acc: {
        // cada montón de votos se divide entre 1, 2, 3 y 4: columnas cada vez más bajas
        dividir(lt, dur) { urnas.forEach(u => u.visible = false); B.ini(); COLS.forEach(({ p, d, v }) => { const u = ss(clamp((lt - .4 - (d - 1) * .5) / .6, 0, 1)); if (d === 1 || u > 0) pila(lerp(-18 + p * 12, xCol(p, d), d === 1 ? 1 : u), -2, v * .5 * (d === 1 ? 1 : u), COL[p]); }); B.fin();
          mira(c, [0, 30, 84], [0, 8, 0], .06); },
        // las columnas más altas, una a una, se llevan un escaño
        escanos(lt, dur) { urnas.forEach(u => u.visible = false); B.ini(); COLS.forEach(({ p, d, v }) => pila(xCol(p, d), -2, v * .5, COL[p])); B.fin();
          orden.slice(0, 6).forEach((o, i) => { const u = clamp((lt - .3 - i * .45) / .4, 0, 1); const e = esc[i]; e.visible = u > 0; e.position.set(xCol(o.p, o.d), 4.6 + o.v * .5 * .7 + 3 + (1 - ss(u)) * 14, -2); e.rotation.y = (1 - u) * 3; });
          mira(c, [0, 30, 82], [0, 10, 0], .06); },
        // el que no llega al 3 %: su montón se queda bajo la línea roja y se hunde
        barrera(lt, dur) { B.ini(); for (let p = 0; p < 4; p++) { const cae = p === 3 ? ss(clamp((lt - 1.2) / 1.2, 0, 1)) * 4 : 0; pila(-18 + p * 12, -2, VOT[p] * .5, COL[p], cae); } B.fin();
          barra.visible = true; barra.scale.y = barra.scale.z = 1; barra.position.set(0, 4.6 + 1.6, -2); barra.scale.x = ss(clamp(lt / .8, 0, 1)); urnas.forEach(u => u.visible = false); mira(c, [4, 20, 62], [2, 6, 0], .06); },
        // al fondo, el hemiciclo se llena hasta 176: la mitad más uno
        mayoria(lt, dur) { B.ini(); B.fin(); urnas.forEach(u => u.visible = false); hemi(Math.round(176 * ss(clamp((lt - .3) / (dur * .6), 0, 1)))); mira(c, [0, 60, 22], [0, 2, -72], .02); },
      } };
  },

  // —— GTA 6: la tienda de noche con la cola de gente ——
  tienda: () => {
    const s = new THREE.Scene(); s.background = cielo([P.ink, P.night, P.plum]); s.fog = new THREE.Fog(0x262b44, 90, 220);
    luces(s, { cielo: 0x9a8ac8, suelo: 0x262b44, amb: 1.2, sol: 0xc8d0ff, int: 1.2, dir: [40, 60, 60], sombra: 70 });
    const v = new Vox(); v.box(-80, -1, -30, 80, 0, 50, (x, y, z) => z > 8 ? (((x >> 2) & 1) && z === 20 ? P.yellow : P.night) : P.slate);
    v.box(-30, 0, -26, 30, 30, -18, P.dslate); v.box(-24, 0, -18, 24, 14, -17, P.ink); v.box(-32, 30, -28, 32, 32, -16, P.slate);   // fachada
    for (let x = -60; x < 60; x += 16) if (Math.abs(x) > 30) { const h = 24 + (hsh(x, 1, 1) * 30 | 0); v.box(x, 0, -40, x + 12, h, -30, P.night); for (let y = 3; y < h - 2; y += 4) for (let k = 2; k < 11; k += 3) if (hsh(x + k, y, 2) > .5) v.set(x + k, y, -30, P.amber); }
    for (let x = -22; x <= 22; x += 2) { v.set(x, 26, -17, (x / 2) % 2 ? P.pink : P.cyan); v.set(x, 19, -17, (x / 2) % 2 ? P.cyan : P.pink); } v.luz(P.amber, P.pink, P.cyan, P.yellow); s.add(v.build());
    const persiana = new Vox(); persiana.box(-24, 0, 0, 24, 14, 1, (x, y) => y % 2 ? P.silver : P.steel); const gp = persiana.build(); gp.position.set(0, 0, -16.9); s.add(gp);
    const interior = new THREE.PointLight(0xfeae34, 0, 60, 1.4); interior.position.set(0, 8, -12); s.add(interior);
    const panel = pantalla(20, 8, 160, 64); panel.m.position.set(0, 9, -15.7); s.add(panel.m);
    const caja = actor('caja', .9); caja.position.set(0, 8, -10); s.add(caja);
    const P0 = new Bloques(40 * 3); s.add(P0.im); const ropa = [P.red, P.blue, P.lime, P.orange, P.rose, P.cyan, P.yellow, P.teal];
    const gente = (av, brazos) => { P0.ini(); for (let i = 0; i < 18; i++) { const x = -6 - i * 4.2 + av, z = 2 + (i % 2) * 1.5, bob = Math.abs(Math.sin(av * 2 + i)) * .4;
      P0.pon(x, 2.5 + bob, z, 2.2, 4, 1.6, ropa[i % 8]); P0.pon(x, 5.5 + bob, z, 1.8, 1.8, 1.6, P.skin); P0.pon(x, 6.6 + bob, z, 1.9, .6, 1.7, i % 3 ? P.dbrown : P.ink);
      if (brazos > 0) { P0.pon(x - 1.4, 5 + bob + brazos * 2, z, .6, 3, .6, P.skin); } } P0.fin(); };
    const anio = (y, k) => { const g = panel.g; g.fillStyle = '#181425'; g.fillRect(0, 0, 160, 64); g.fillStyle = k ? '#fee761' : '#f6757a'; g.font = 'bold 44px monospace'; g.fillText(String(y), 26, 48); panel.tex.needsUpdate = true; };
    const c = cam(46);
    return { s, c, upd(t) { gente(0, 0); gp.position.y = 0; interior.intensity = 0; caja.visible = false; panel.m.visible = true; anio(2026, 1); mira(c, [Math.sin(t * .1) * 6, 13, 66], [0, 10, -10], .06); },
      acc: {
        // la cola avanza mientras el cartel cuenta los años: de 2013 a 2026
        cola(lt, dur) { gente(lt * 1.2, 0); const y = Math.min(2026, 2013 + Math.max(0, Math.floor(lt / (dur * .75) * 13))); anio(y, y === 2026); const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-10, 0, k), 12, 68], [lerp(-6, 0, k), 9, -10], .04); },
        // sube la persiana, sale la luz y aparece el juego; la gente levanta los brazos
        abrir(lt, dur, t) { const k = ss(clamp((lt - .2) / 1.4, 0, 1)); gp.position.y = k * 13.5; interior.intensity = 140 * k; caja.visible = k > .3; panel.m.visible = k < .3; caja.scale.setScalar(.9 + .5 * k); caja.position.set(0, 8 + Math.sin(t * 2) * .4, -6); caja.rotation.y = Math.sin(t * 1.3) * .45;
          gente(lt * .4 + 1.5, k > .6 ? Math.abs(Math.sin(t * 6)) : 0); mira(c, [0, 13, 58], [0, 10, -10], .08); },
        // la cámara sube por encima de la ciudad
        subir(lt, dur, t) { gente(2, 1); gp.position.y = 13.5; interior.intensity = 140; panel.m.visible = false; caja.visible = true; caja.scale.setScalar(1.4); caja.position.set(0, 8, -6); caja.rotation.y = Math.sin(t * 1.3) * .45; const k = ss(clamp(lt / dur, 0, 1)); mira(c, [0, 14 + 80 * k, 62 - 10 * k], [0, 8 - 6 * k, -10], .04); },
      } };
  },
  // —— GTA 6: Leonida, una península inventada con su ciudad y sus cayos ——
  leonida: () => {
    const s = new THREE.Scene(); s.background = cielo([P.navy, P.blue, P.cyan]); s.fog = new THREE.Fog(0x8fd8ff, 200, 420);
    luces(s, { cielo: 0xd8f0ff, suelo: 0x0099db, amb: 1.3, sol: 0xfff3d0, int: 2.2, dir: [-40, 90, 40], sombra: 120 });
    const mar = new Vox(); mar.box(-110, -2, -110, 110, -1, 110, (x, y, z) => ((x * 3 + z * 7) % 11 === 0 ? P.cyan : P.blue)); mar.luz(P.cyan); s.add(mar.build({ sombra: false }));
    // forma de península: ancha arriba (norte, z negativa) y que se estrecha al sur
    const enTierra = (x, z) => { if (z < -70) return x > -90 && x < 40; const ancho = z < -40 ? 26 : 26 - (z + 40) * .28; const cx = 8 + Math.sin(z * .04) * 5; return Math.abs(x - cx) < ancho && z < 52; };
    const filas = []; for (let z = -90; z < 56; z += 2) { const f = new Vox(); for (let x = -90; x < 60; x += 2) if (enTierra(x, z)) { const h = hsh(x >> 3, 1, z >> 3); f.box(x, -1, z, x + 2, 1, z + 2, Math.abs(x - 8 - Math.sin(z * .04) * 5) > (z < -40 ? 23 : 23 - (z + 40) * .28) ? P.sand : h > .75 ? P.dgreen : h > .2 ? P.green : P.teal); }
      const g = f.build({ jit: .04 }); s.add(g); filas.push([z, g]); }
    const ciudad = new Vox(); for (let i = 0; i < 26; i++) { const x = 20 + (i % 5) * 3, z = 30 + Math.floor(i / 5) * 3, h = 3 + (hsh(i, 2, 2) * 14 | 0); ciudad.box(x, 1, z, x + 2, 1 + h, z + 2, [P.pink, P.cyan, P.white, P.sand][i % 4]); }
    const gc = ciudad.build(); s.add(gc);
    const cayos = new Vox(); for (let i = 0; i < 9; i++) { const x = 6 - i * 7, z = 58 + i * 3.2; cayos.ball(x, -1, z, 2 + (i % 3) * .6, P.sand, .4); cayos.set(x, 1, z, P.green); if (i) cayos.box(x, 0, z - 2, x + 7, 1, z - 1, P.silver); } s.add(cayos.build());
    const palms = Array.from({ length: 10 }, (_, i) => { const p = actor('palmera', .45); p.position.set(-8 + (i % 5) * 9, 6, -10 + Math.floor(i / 5) * 30); s.add(p); return p; });
    const c = cam(46);
    const crece = k => { filas.forEach(([z, g], i) => { const u = clamp(k * filas.length * 1.2 - i, 0, 1); g.position.y = (1 - ss(u)) * -8; g.visible = u > 0; }); palms.forEach(p => p.visible = k > .9); gc.scale.y = clamp((k - .8) * 5, .02, 1); };
    return { s, c, upd(t) { crece(1); mira(c, [Math.sin(t * .05) * 10, 190, 130], [5, 0, 16], .0); },
      acc: {
        // la península sale del mar de norte a sur: Leonida = Florida
        mapa(lt, dur) { crece(clamp(lt / (dur * .8), 0, 1)); const k = ss(clamp(lt / dur, 0, 1)); mira(c, [0, 200 - 10 * k, 124 + 10 * k], [5, 0, 16], 0); },
        // la cámara baja en picado hasta la gran ciudad del sureste
        bajar(lt, dur) { crece(1); gc.scale.y = 1 + .3 * ss(clamp(lt / dur, 0, 1)); const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(0, 46, k), lerp(190, 34, k), lerp(130, 92, k)], [lerp(5, 26, k), 0, lerp(16, 36, k)], 0); },
      } };
  },
  // —— GTA 6: Vice City al atardecer, playa, neones, coches y el puente de los cayos ——
  vicecity: () => {
    const s = new THREE.Scene(); s.background = cielo([P.navy, P.plum, P.rose, P.orange]); s.fog = new THREE.Fog(0xb55088, 140, 320);
    luces(s, { cielo: 0xffc8e0, suelo: 0x124e89, amb: 1.4, sol: 0xffb070, int: 1.9, dir: [60, 40, 40], sombra: 120 });
    const v = new Vox(); v.box(-120, -1, -40, 120, 0, 12, (x, y, z) => z > 4 ? (x % 6 < 3 && z === 8 ? P.yellow : P.dslate) : P.slate);   // acera y carretera
    v.box(-120, -1, 12, 120, 0, 30, P.sand); v.box(-120, -2, 30, 120, -1, 140, (x, y, z) => (x * 3 + z * 5) % 13 === 0 ? P.cyan : P.blue);
    v.ball(-10, 40, -120, 18, P.yellow); v.luz(P.yellow, P.cyan); s.add(v.build());
    const NE = []; const edif = []; for (let i = 0; i < 11; i++) { const x = -100 + i * 19, h = 18 + (hsh(i, 3, 3) * 34 | 0), e = new Vox(); e.box(0, 0, 0, 14, h, 12, [P.white, P.sand, P.pink, 0xd8f6ff][i % 4]);
      for (let y = 3; y < h - 2; y += 4) for (let k = 2; k < 13; k += 3) e.set(k, y, 12, hsh(i, y, k) > .5 ? P.navy : P.cyan); const g = e.build(); g.position.set(x, 0, -36); s.add(g); edif.push(g);
      const n = new Vox(); for (let k = 0; k < 14; k++) n.set(k, h - 2, 12.2, i % 2 ? P.pink : P.cyan); n.luz(P.pink, P.cyan); const gn = n.build({ sombra: false }); gn.position.set(x, 0, -36); s.add(gn); NE.push(gn); }
    for (let i = 0; i < 9; i++) { const p = actor('palmera', .55); p.position.set(-96 + i * 24, 7, 10); s.add(p); }
    const puente = new Vox(); for (let x = -40; x < 200; x++) { puente.set(x, 2, 0, P.silver); puente.set(x, 2, 1, P.silver); puente.set(x, 2, 2, P.silver); if (x % 10 === 0) puente.box(x, -6, 0, x + 1, 2, 3, P.steel); }
    for (let i = 0; i < 8; i++) { const x = -20 + i * 30; puente.ball(x, -2, 1, 5, P.sand, .35); puente.set(x + 3, 0, 4, P.green); }
    const gpu = puente.build(); gpu.position.set(60, 0, 90); s.add(gpu);
    const coche = actor('coche', .5), poli = actor('coche', .5); s.add(coche, poli);
    const sirena = new THREE.Mesh(new THREE.BoxGeometry(2, .8, 1.2), new THREE.MeshBasicMaterial({ color: P.red })); poli.add(sirena); sirena.position.set(0, 7, 0);
    const c = cam(46);
    return { s, c, upd(t) { NE.forEach(n => n.visible = true); const x = ((t * 14) % 240) - 120; coche.position.set(x, 1.7, 7); coche.rotation.y = 0; poli.visible = false; mira(c, [Math.sin(t * .08) * 10, 16, 80], [0, 14, -10], .06); },
      acc: {
        // se encienden los neones, edificio a edificio, mientras pasa un descapotable
        neon(lt, dur, t) { NE.forEach((n, i) => n.visible = lt > .3 + i * .18); coche.position.set(-60 + lt * 22, 1.7, 7); poli.visible = false; const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-30, 10, k), 18, 84], [lerp(-24, 8, k), 16, -10], .06); },
        // Lucía y Jason huyen en el descapotable; detrás, un coche con sirena
        persecucion(lt, dur, t) { const x = -50 + lt * 30; coche.position.set(x, 1.7 + Math.abs(Math.sin(t * 9)) * .2, 7); poli.visible = true; poli.position.set(x - 16 + Math.sin(t * 2) * 2, 1.7, 5.5); sirena.material.color.setHex(Math.floor(t * 6) % 2 ? P.red : P.blue);
          mira(c, [x + 8, 14, 62], [x - 8, 6, 5], .06); },
        // el puente de los cayos: islotes unidos por una carretera sobre el mar
        cayos(lt, dur, t) { poli.visible = false; const x = 30 + lt * 20; coche.position.set(60 + x - 40, 5, 91.5); coche.rotation.y = 0; const k = ss(clamp(lt / dur, 0, 1)); mira(c, [60 + x - 40 + lerp(24, 8, k), 18, 134], [60 + x - 36, 1, 91], -.07); },
      } };
  },
});
// ———————————— 20/11/2026: terremoto (aviso en el móvil), Black Friday (Filadelfia) y Juegos del Hambre (el doble de tributos) ————————————
// figura de una persona en un Bloques: cuerpo, cabeza y pelo (ag = agacharse 0..1)
function persona(B, x, y, z, ropa, o = {}) { const s = o.s || 1, h = 1 - (o.ag || 0) * .45;
  B.pon(x, y + 2.2 * h * s, z, 2 * s, 4.4 * h * s, 1.5 * s, ropa); B.pon(x, y + (4.4 * h + .9) * s, z, 1.7 * s, 1.7 * s, 1.6 * s, P.skin); B.pon(x, y + (4.4 * h + 1.9) * s, z, 1.8 * s, .6 * s, 1.7 * s, o.pelo ?? P.dbrown);
  if (o.movil) B.pon(x + .9 * s, y + (3.4 * h) * s, z + .9 * s, .7 * s, 1.1 * s, .3 * s, o.movil); }
// texto en una pantalla (se redibuja solo si cambia)
function rotular(P2, lineas, fg, bg, px, o = {}) { const k = lineas.join('|') + fg + bg + px; if (P2._k === k) return; P2._k = k; const { g, cv, tex } = P2;
  g.fillStyle = bg; g.fillRect(0, 0, cv.width, cv.height); if (o.borde) { g.strokeStyle = o.borde; g.lineWidth = 4; g.strokeRect(2, 2, cv.width - 4, cv.height - 4); }
  g.font = `bold ${px}px monospace`; g.textAlign = 'center'; g.textBaseline = 'middle';
  lineas.forEach((l, i) => { g.fillStyle = Array.isArray(fg) ? fg[i] : fg; g.fillText(l, cv.width / 2, cv.height / 2 + (i - (lineas.length - 1) / 2) * px * 1.12); }); tex.needsUpdate = true; }
function centra(w) { const b = new THREE.Box3().setFromObject(w), c = b.getCenter(new THREE.Vector3()); w.children.forEach(m => m.position.sub(c)); const r = new THREE.Group(); r.add(w); return r; }
const bola = (col, r = 1) => new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({ color: col }));

Object.assign(FAB, {
  // —— terremoto ——
  movil: () => {   // móvil de pantalla grande (la pantalla se pinta aparte)
    const v = new Vox(); v.box(-4, 0, 0, 4, 15, 1, P.ink); v.box(-3, 1, 1, 3, 14, 2, P.night); v.set(0, 13, 2, P.slate); v.box(-1, 0, 1, 1, 1, 2, P.slate);
    const w = new THREE.Group(); w.add(v.build({ centrar: true, jit: .03 })); return w;
  },
  casa: () => {   // casa de dos aguas con chimenea y ventanas encendidas
    const v = new Vox(); v.box(-5, 0, -4, 5, 7, 4, P.sand);
    for (let y = 7; y < 12; y++) v.box(-6 + (y - 7), y, -5, 6 - (y - 7), y + 1, 5, y % 2 ? P.red : P.crimson);
    v.box(3, 9, -2, 5, 14, 0, P.brown); v.box(-1, 0, 4, 1, 4, 5, P.dbrown);
    for (const x of [-3, 3]) { v.box(x - 1, 3, 4, x + 1, 5, 5, P.amber); v.box(x - 1, 3, -5, x + 1, 5, -4, P.amber); } v.luz(P.amber);
    const w = new THREE.Group(); w.add(v.build({ centrar: true })); return w;
  },
  sensor: () => {   // estación sísmica: caseta, panel solar, mástil y luz verde
    const v = new Vox(); v.box(-3, 0, -3, 3, 5, 3, P.silver); v.box(-4, 5, -4, 4, 6, 4, P.dslate); v.box(-1, 1, 3, 1, 4, 4, P.slate);
    v.box(0, 6, 0, 1, 15, 1, P.steel); v.box(-2, 12, 0, 3, 13, 1, P.steel); v.set(0, 15, 0, P.lime); v.box(4, 2, -3, 5, 7, 3, P.navy); v.luz(P.lime);
    const w = new THREE.Group(); w.add(v.build({ centrar: true })); return w;
  },
  // —— Black Friday ——
  bolsa: () => {   // bolsa de compras negra con asas y etiqueta de descuento
    const v = new Vox(); v.box(-5, 0, -2, 5, 11, 2, P.ink); v.box(-3, 11, 0, -2, 14, 1, P.silver); v.box(2, 11, 0, 3, 14, 1, P.silver); v.box(-2, 13, 0, 2, 14, 1, P.silver);
    v.box(-3, 3, 2, 3, 8, 3, P.yellow); for (let i = 0; i < 4; i++) v.set(-2 + i + (i > 1 ? 1 : 0), 4 + i, 3, P.red); v.set(-2, 7, 3, P.red); v.set(2, 4, 3, P.red); v.luz(P.yellow);
    const w = new THREE.Group(); w.add(v.build({ centrar: true })); return w;
  },
  agente: () => {   // policía de tráfico de los años 60: gorra, placa, silbato y un brazo que se mueve
    const v = new Vox(); v.box(-2, 0, -1, 2, 6, 1, P.navy); v.box(-3, 6, -2, 3, 13, 2, P.navy); v.box(-3, 8, -2, 3, 9, 2, P.ink); v.set(-2, 11, 2, P.yellow);
    v.box(-2, 13, -2, 2, 17, 2, P.skin); v.set(-1, 15, 2, P.ink); v.set(1, 15, 2, P.ink); v.box(-2, 17, -2, 2, 19, 2, P.navy); v.box(-2, 17, 2, 2, 18, 4, P.ink); v.set(0, 18, 2, P.yellow);
    v.set(0, 14, 2, P.silver); v.set(0, 14, 3, P.silver); v.box(-5, 6, -1, -3, 12, 1, P.navy); v.box(-5, 4, -1, -3, 6, 1, P.white); v.box(-2, -1, -1, 2, 0, 2, P.ink); v.luz(P.yellow);
    const w = new THREE.Group(); w.add(v.build());
    const a = new Vox(); a.box(0, -6, -1, 2, 0, 1, P.navy); a.box(0, -8, -1, 2, -6, 1, P.white); const ga = a.build(); const hombro = new THREE.Group(); hombro.position.set(3, 12.5, 0); hombro.add(ga); hombro.name = 'brazo'; w.add(hombro);
    return centra(w);
  },
  libro: () => {   // libro de cuentas abierto: tapas rojas, lomo y renglones
    const v = new Vox(); v.box(-14, 0, -10, 14, 1, 10, P.crimson); v.box(-1, 0, -10, 1, 2, 10, P.dbrown);
    v.box(-13, 1, -9, -1, 2, 9, P.white); v.box(1, 1, -9, 13, 2, 9, P.white); for (let z = -8; z <= 8; z += 2) { v.box(-12, 2, z, -2, 2.4, z + 1, P.silver); v.box(2, 2, z, 12, 2.4, z + 1, P.silver); }
    const w = new THREE.Group(); w.add(v.build({ centrar: true, jit: .03 })); return w;
  },
  // —— Juegos del Hambre (sin personajes ni símbolos de la saga: objetos genéricos) ——
  cuerno: () => {   // gran cuerno dorado con cajas y mochilas en la boca
    const v = new Vox();
    for (let x = 0; x <= 26; x++) { const r = 7 - x * .23, cy = 7 + (x > 15 ? (x - 15) ** 2 * .09 : 0); for (let y = -8; y <= 8; y++) for (let z = -8; z <= 8; z++) { const d = Math.hypot(y, z); if (d <= r + .3 && (d > r - 1.3 || x > 20)) v.set(x, Math.round(cy + y), z, (x >> 2) % 2 ? P.amber : P.yellow); } }
    for (let i = 0; i < 7; i++) v.box(-3 - (i % 3) * 3, 0, -5 + (i % 4) * 3, -1 - (i % 3) * 3, 2 + (i % 2), -3 + (i % 4) * 3, [P.brown, P.green, P.orange, P.slate][i % 4]);
    const w = new THREE.Group(); w.add(v.build({ centrar: true, jit: .05 })); return w;
  },
  tren: () => {   // tren bala plateado con franja y ventanillas
    const v = new Vox(); v.box(-20, 1, -3, 20, 7, 3, P.silver); for (let x = 20; x < 27; x++) { const h = 7 - (x - 20) * .8; v.box(x, 1, -3 + (x - 20) * .3 | 0, x + 1, Math.max(2, h), 3 - (x - 20) * .3 | 0, P.silver); }
    v.box(-20, 4, 3, 20, 6, 4, P.navy); v.box(-20, 4, -4, 20, 6, -3, P.navy); v.box(-20, 1, 3, 25, 2, 4, P.red); v.box(-20, 1, -4, 25, 2, -3, P.red); v.box(-18, 0, -2, 22, 1, 2, P.ink); v.set(26, 2, 0, P.yellow); v.luz(P.yellow);
    const w = new THREE.Group(); w.add(v.build({ centrar: true })); return w;
  },
  pino: () => {   // pino de capas
    const v = new Vox(); v.box(-1, 0, -1, 1, 5, 1, P.dbrown); for (let k = 0; k < 4; k++) { const y0 = 4 + k * 4, r = 6 - k * 1.4; for (let y = 0; y < 5; y++) v.cyl(0, 0, y0 + y, y0 + y + 1, r * (1 - y / 6), k % 2 ? P.green : P.dgreen); }
    const w = new THREE.Group(); w.add(v.build({ centrar: true })); return w;
  },
});

Object.assign(FABE, {
  // —— terremoto 1: un pueblo de California, el móvil que avisa y la grieta ——
  falla: () => {
    const s = new THREE.Scene(); s.background = cielo([P.blue, P.cyan, 0xd8f6ff]); s.fog = new THREE.Fog(0xbfe8ff, 120, 260);
    luces(s, { cielo: 0xe8f4ff, suelo: 0x3e8948, amb: 1.25, sol: 0xfff1d6, int: 2.1, dir: [-40, 70, 50], sombra: 90 });
    const v = new Vox(); v.box(-100, -5, -90, 100, 0, 60, (x, y, z) => y === -1 ? (Math.abs(z + 5) < 3 ? P.slate : hsh(x >> 2, 1, z >> 2) > .7 ? P.green : P.lime) : P.brown);
    for (let i = 0; i < 9; i++) { const x = -80 + i * 20, h = 6 + hsh(i, 5, 5) * 8 | 0; v.ball(x, -2, -88, 14 + h, (X, Y) => Y > 10 ? P.silver : P.dgreen, .5); } s.add(v.build());
    const casas = [[-26, -24], [-10, -30], [8, -26], [26, -22], [-34, 8], [-18, 14], [18, 12], [34, 6], [0, -48], [-44, -40], [44, -38]].map(([x, z], i) => { const m = actor('casa', .8); m.position.set(x, 5, z); m.rotation.y = (hsh(i, 9, 9) - .5) * .8; m.userData.b = [x, z]; s.add(m); return m; });
    const G = new Bloques(140); s.add(G.im);
    const grieta = k => { G.ini(); for (let z = 55; z > -90; z -= 1.2) { const u = (55 - z) / 145; if (u > k) break; const x = Math.sin(z * .07) * 5 + Math.sin(z * .23) * 1.5, w2 = 1.6 + Math.sin(z * .5) * .6; G.pon(x, -.35, z, w2 * Math.min(1, (k - u) * 8), 1, 1.4, P.ink); } G.fin(); };
    const movil = actor('movil', .75); s.add(movil); const scr = pantalla(6, 13, 60, 130); scr.m.position.z = 1.06; movil.add(scr.m);
    const hora = () => rotular(scr, ['10:42', '', '', ''], '#c0cbdc', '#262b44', 14);
    const alerta = on => rotular(scr, on ? ['⚠', 'ALERTA', 'SÍSMICA', '', 'AGÁCHATE'] : ['10:42'], on ? ['#fee761', '#ffffff', '#ffffff', '#fff', '#fee761'] : '#c0cbdc', on ? '#e43b44' : '#262b44', on ? 13 : 14);
    const tiembla = (a, t) => casas.forEach((m, i) => { const [x, z] = m.userData.b; m.position.set(x + Math.sin(t * 41 + i) * a, 5 + Math.abs(Math.sin(t * 37 + i * 2)) * a * .6, z + Math.cos(t * 33 + i) * a * .5); m.rotation.z = Math.sin(t * 29 + i) * a * .05; });
    const c = cam(46);
    return { s, c, upd(t) { tiembla(0, t); grieta(0); movil.visible = true; movil.position.set(0, 7, 30); movil.rotation.set(-.05, Math.sin(t * .6) * .15, 0); hora(); mira(c, [0, 14, 70], [0, 7, 30], .02); },
      acc: {
        // el móvil vibra con la alerta roja; al fondo, el pueblo aún tranquilo… y empieza a temblar
        vibra(lt, dur, t) { const on = lt > .25; alerta(on); movil.position.set(on ? Math.sin(t * 70) * .25 : 0, 7, 30); movil.rotation.set(-.05, -.2 + Math.sin(t * .8) * .1, on ? Math.sin(t * 55) * .04 : 0);
          tiembla(lt > dur * .7 ? .4 * (lt - dur * .7) : 0, t); const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(4, -2, k), 13, lerp(74, 78, k)], [0, 7, 30], .02); },
        // sacudida: las casas tiemblan y el suelo se abre en una grieta
        sacudida(lt, dur, t) { movil.visible = false; const a = 1.3 * Math.min(1, lt * 2) * (1 - .5 * clamp((lt - dur * .7) / (dur * .3), 0, 1)); tiembla(a, t); grieta(ss(clamp(lt / (dur * .7), 0, 1)));
          const sh = Math.sin(t * 47) * a * .5; mira(c, [sh, 52 + sh, 104], [0, 0, -14], .04); },
        // la cámara se acerca a la grieta y baja hacia el suelo
        bajar(lt, dur, t) { movil.visible = false; tiembla(.15, t); grieta(1); const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(0, 4, k), lerp(52, 6, k), lerp(104, 22, k)], [lerp(0, 2, k), lerp(0, -8, k), lerp(-14, -6, k)], .04); },
      } };
  },
  // —— terremoto 2: el suelo en corte, con las ondas P (azules) y S (rojas) ——
  ondas: () => {
    const s = new THREE.Scene(); s.background = cielo([P.navy, P.blue, P.cyan]); s.fog = new THREE.Fog(0x124e89, 200, 400);
    luces(s, { cielo: 0xd8f0ff, suelo: 0x733e39, amb: 1.4, sol: 0xfff1d6, int: 1.8, dir: [-30, 60, 80], sombra: 60 });
    const v = new Vox(); v.box(-22, -40, -6, 22, 0, 6, (x, y, z) => { const j = hsh(x, y, z); if (y === -1) return j > .5 ? P.green : P.lime; if (y > -4) return P.brown; if (y > -15) return j > .8 ? P.brown : P.tan; if (y > -27) return j > .85 ? P.dbrown : P.brown; return j > .8 ? P.umber : P.dbrown; });
    for (let y = -31; y < -1; y++) { const x = Math.round(-12 + (y + 31) * .28); v.set(x, y, 5, P.ink); v.set(x + 1, y, 5, P.ink); } s.add(v.build({ jit: .05 }));
    const casas = [-6, 2, 10, 17].map((x, i) => { const m = actor('casa', .36); m.position.set(x, 2.3, 0); m.userData.x = x; s.add(m); return m; });
    const sensor = actor('sensor', .42); sensor.position.set(-17, 3.4, 1); s.add(sensor); const luzS = bola(P.lime, .9); luzS.position.set(-17, 7.4, 1.3); s.add(luzS);
    const H = [-12, -30], foco = bola(P.yellow, 1.6); foco.position.set(H[0], H[1], 6.4); s.add(foco);
    const B = new Bloques(700, true); s.add(B.im);
    const anillo = (r, col, wig, t) => { if (r <= .3) return; const N = Math.max(14, Math.min(160, r * 4 | 0)); for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2, rr = r + wig * Math.sin(a * 16 + t * 24); const x = H[0] + Math.cos(a) * rr, y = H[1] + Math.sin(a) * rr; if (Math.abs(x) < 21.6 && y < -.3 && y > -39.6) B.pon(x, y, 6.6, .95, .95, .5, col); } };
    const llega = (r, x) => r > Math.hypot(x - H[0], H[1]);
    const tiembla = (a, t) => casas.forEach((m, i) => { m.position.x = m.userData.x + Math.sin(t * 43 + i) * a; m.position.y = 2.3 + Math.abs(Math.sin(t * 39 + i)) * a * .7; m.rotation.z = Math.sin(t * 31 + i) * a * .12; });
    const c = cam(46);
    return { s, c, upd(t) { B.ini(); B.fin(); tiembla(0, t); foco.scale.setScalar(.6); luzS.material.color.setHex(P.dslate); mira(c, [Math.sin(t * .1) * 4, -14, 125], [0, -18, 0], .12); },
      acc: {
        // la falla se rompe en el foco y salen ondas de los dos tipos, una y otra vez
        rotura(lt, dur, t) { foco.scale.setScalar(1 + Math.abs(Math.sin(lt * 7)) * .8); B.ini(); for (let k = 0; k < 3; k++) { anillo(((lt * 12) + k * 9) % 27, P.cyan, 0, t); anillo(((lt * 7) + k * 9) % 27, P.red, .5, t); } B.fin(); tiembla(.08, t); },
        // las ondas P, rápidas: llegan al sensor (luz verde) y casi no mueven las casas
        ondas_p(lt, dur, t) { const r = lt * 36 / (dur * .55); B.ini(); anillo(r, P.cyan, 0, t); anillo(r - 2, P.blue, 0, t); B.fin(); foco.scale.setScalar(.8);
          luzS.material.color.setHex(llega(r, -17) ? (Math.floor(t * 6) % 2 ? P.lime : P.yellow) : P.dslate); tiembla(llega(r, 0) ? .06 : 0, t); },
        // detrás, las ondas S, lentas y onduladas: cuando llegan arriba, las casas se sacuden
        ondas_s(lt, dur, t) { const rp = 50 + lt * 30, r = lt * 34 / (dur * .6); B.ini(); anillo(rp, P.cyan, 0, t); anillo(r, P.red, .9, t); anillo(r - 2, P.orange, .9, t); B.fin(); foco.scale.setScalar(.8);
          luzS.material.color.setHex(P.lime); tiembla(llega(r, 0) ? .7 : .03, t); const k = ss(clamp(lt / dur, 0, 1)); mira(c, [0, lerp(-14, -10, k), lerp(125, 118, k)], [0, -18, 0], .12); },
      } };
  },
  // —— terremoto 3: el aviso sale del sensor y llega a los móviles antes que la sacudida ——
  aviso: () => {
    const s = new THREE.Scene(); s.background = cielo([P.blue, P.cyan, 0xe8f8ff]); s.fog = new THREE.Fog(0xcfeeff, 140, 300);
    luces(s, { cielo: 0xe8f4ff, suelo: 0x3e8948, amb: 1.3, sol: 0xfff1d6, int: 2, dir: [40, 70, 50], sombra: 80 });
    const v = new Vox(); v.box(-110, -2, -110, 110, 0, 60, (x, y, z) => (Math.abs(z - 8) < 3 || Math.abs(x - 4) < 3) ? P.slate : hsh(x >> 2, 3, z >> 2) > .7 ? P.green : P.lime); s.add(v.build());
    const casas = [[-14, -22], [2, -26], [18, -20], [-6, -8], [14, -6], [26, -32], [-24, -36], [8, -42]].map(([x, z], i) => { const m = actor('casa', .7); m.position.set(x, 4.4, z); m.userData.b = [x, z]; s.add(m); return m; });
    const iconos = casas.map(m => { const b = bola(P.red, 1.3); s.add(b); return b; });
    const sensor = actor('sensor', .9); sensor.position.set(-18, 8, 14); s.add(sensor); const luzS = bola(P.lime, 1.1); luzS.position.set(-18, 16, 14.5); s.add(luzS);
    const cartel = pantalla(22, 10, 176, 80); cartel.m.position.set(6, 17, -14); s.add(cartel.m); const poste = new THREE.Mesh(new THREE.BoxGeometry(1, 12, 1), new THREE.MeshLambertMaterial({ color: P.steel })); poste.position.set(6, 6, -14.6); s.add(poste);
    const B = new Bloques(900, true), Pp = new Bloques(40 * 4); s.add(B.im, Pp.im);
    const gente = [[-10, 10], [-4, 12], [2, 10], [8, 13], [14, 10], [20, 12], [-16, 14], [-1, 16], [11, 17], [24, 16]];
    const pon = (ag, alerta, t) => { Pp.ini(); gente.forEach(([x, z], i) => persona(Pp, x, 0, z, [P.red, P.blue, P.orange, P.rose, P.teal][i % 5], { s: .9, ag, movil: alerta ? (Math.floor(t * 8 + i) % 2 ? P.red : P.yellow) : P.ink })); Pp.fin(); };
    const arcos = (lt, t) => { for (let k = 0; k < 3; k++) { const r = ((lt * 70) + k * 26) % 78; if (r < 2) continue; const N = r * 2.2 | 0; for (let i = 0; i <= N; i++) { const a = Math.PI * i / N; B.pon(-18 + Math.cos(a) * r, 16 + Math.sin(a) * r * .5, 14 - Math.sin(a) * r * .55, 1, 1, 1, k % 2 ? P.yellow : P.amber); } } };
    const onda = (r, t) => { const N = 120; for (let i = 0; i < N; i++) { const a = -.2 + i / N * 1.3; const x = -120 + Math.cos(a) * r, z = 30 - Math.sin(a) * r; if (x > -60 && x < 60 && z > -60 && z < 50) B.pon(x, .5 + Math.abs(Math.sin(i * .7 + t * 9)) * 1.2, z, 3, 1.5, 3, i % 2 ? P.brown : P.dbrown); } };
    const tiembla = (a, t) => casas.forEach((m, i) => { const [x, z] = m.userData.b; m.position.set(x + Math.sin(t * 41 + i) * a, 4.4 + Math.abs(Math.sin(t * 37 + i)) * a * .5, z); });
    const c = cam(46);
    return { s, c, upd(t) { B.ini(); B.fin(); pon(0, false, t); iconos.forEach(b => b.visible = false); tiembla(0, t); cartel.m.visible = true; poste.visible = true; luzS.material.color.setHex(P.lime); rotular(cartel, ['PUEBLO', 'TRANQUILO'], '#ffffff', '#3a4466', 22, { borde: '#c0cbdc' }); mira(c, [Math.sin(t * .1) * 6, 30, 92], [0, 6, -8], .07); },
      acc: {
        // el sensor nota las ondas P y lanza el aviso: arcos de luz que llegan a todas las casas y móviles
        senal(lt, dur, t) { B.ini(); arcos(lt, t); onda(20 + lt * 6, t); B.fin(); luzS.material.color.setHex(Math.floor(t * 8) % 2 ? P.yellow : P.lime);
          const llegado = lt * 70; iconos.forEach((b, i) => { const [x, z] = casas[i].userData.b; const ok = llegado > Math.hypot(x + 18, z - 14); b.visible = ok; b.position.set(x, 14 + Math.sin(t * 5 + i) * .6, z); });
          pon(0, llegado > 30, t); rotular(cartel, llegado > 30 ? ['¡ALERTA', 'SÍSMICA!'] : ['PUEBLO', 'TRANQUILO'], llegado > 30 ? '#fee761' : '#ffffff', llegado > 30 ? '#e43b44' : '#3a4466', 22, { borde: '#ffffff' });
          const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-4, 4, k), 30, 96], [0, 6, -8], .07); },
        // cuenta atrás: la gente se agacha y se cubre; al final llega la sacudida
        cubrirse(lt, dur, t) { const ag = ss(clamp((lt - .3) / 1.2, 0, 1)), n = Math.max(0, Math.ceil(8 * (1 - lt / (dur * .85)))); B.ini(); onda(40 + lt * 17, t); B.fin(); pon(ag, true, t);
          iconos.forEach((b, i) => { const [x, z] = casas[i].userData.b; b.visible = true; b.position.set(x, 14, z); }); tiembla(lt > dur * .85 ? .8 : 0, t);
          rotular(cartel, n > 0 ? ['AGÁCHATE', String(n) + ' s'] : ['¡YA', 'LLEGA!'], '#fee761', '#e43b44', 22, { borde: '#ffffff' }); mira(c, [0, 26, 80], [2, 4, -2], .08); },
        // red de móviles vista desde arriba: el anillo de ondas P pasa y cada móvil que lo nota se enciende
        red(lt, dur, t) { B.ini(); const r = lt * 22; for (let i = 0; i < 330; i++) { const x = (hsh(i, 1, 7) - .5) * 90, z = (hsh(i, 2, 7) - .5) * 100 - 10, d = Math.hypot(x + 30, z + 20), on = d < r;
            B.pon(x, .6 + (on ? Math.max(0, 1.5 - (r - d) * .3) * 3 : 0), z, 2.2, .8, 3.4, on ? ((r - d) < 6 ? P.white : P.cyan) : P.ink); }
          const N = Math.max(20, r * 3 | 0); for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2; const x = -30 + Math.cos(a) * r, z = -20 + Math.sin(a) * r; if (Math.abs(x) < 50 && z > -62 && z < 44) B.pon(x, .3, z, 1.2, .4, 1.2, P.blue); } B.fin();
          iconos.forEach(b => b.visible = false); cartel.m.visible = false; poste.visible = false; Pp.ini(); Pp.fin(); const k = ss(clamp(lt / dur, 0, 1)); mira(c, [0, lerp(120, 132, k), lerp(56, 48, k)], [0, 0, -12], .0); },
      } };
  },

  // —— Black Friday 1: la tienda, la cola, el calendario y el apagón ——
  escaparate: () => {
    const s = new THREE.Scene(); s.background = cielo([P.ink, P.night, P.navy]); s.fog = new THREE.Fog(0x262b44, 100, 230);
    luces(s, { cielo: 0x9aa8d8, suelo: 0x262b44, amb: 1.25, sol: 0xd8e0ff, int: 1.2, dir: [30, 60, 70], sombra: 70 });
    const v = new Vox(); v.box(-90, -1, -30, 90, 0, 60, (x, y, z) => z > 10 ? ((x % 8 < 4) && z === 24 ? P.white : P.night) : P.slate);
    v.box(-34, 0, -26, 34, 34, -18, P.dslate); v.box(-36, 34, -28, 36, 36, -16, P.slate); v.box(-30, 2, -18, -8, 16, -17, 0x2a5f8a); v.box(8, 2, -18, 30, 16, -17, 0x2a5f8a);
    for (let x = -70; x < 70; x += 15) if (Math.abs(x) > 38) { const h = 26 + (hsh(x, 2, 1) * 30 | 0); v.box(x, 0, -40, x + 12, h, -30, P.night); for (let y = 3; y < h - 2; y += 4) for (let k = 2; k < 11; k += 3) if (hsh(x + k, y, 3) > .55) v.set(x + k, y, -30, P.amber); }
    v.luz(P.amber); s.add(v.build());
    const puerta = new Vox(); puerta.box(-7, 0, 0, 7, 16, 1, (x, y) => y % 2 ? P.silver : P.steel); const gp = puerta.build(); gp.position.set(0, 0, -16.9); s.add(gp);
    const interior = new THREE.PointLight(0xfee761, 0, 70, 1.3); interior.position.set(0, 8, -10); s.add(interior);
    const letrero = pantalla(30, 13, 240, 104); letrero.m.position.set(0, 25, -16.8); s.add(letrero.m);
    const cartelI = pantalla(10, 7, 100, 70), cartelD = pantalla(10, 7, 100, 70); cartelI.m.position.set(-14, 10, -16.8); cartelD.m.position.set(14, 10, -16.8); s.add(cartelI.m, cartelD.m);
    const bolsas = [0, 1, 2, 3].map(() => { const b = actor('bolsa', .5); s.add(b); return b; });
    const cal = new THREE.Group(); cal.position.set(0, 14, 16); s.add(cal); const atras = pantalla(16, 18, 128, 144), frente = pantalla(16, 18, 128, 144); atras.m.position.set(0, 0, -.05); cal.add(atras.m);
    const bisagra = new THREE.Group(); bisagra.position.set(0, 9, 0); frente.m.position.set(0, -9, 0); bisagra.add(frente.m); cal.add(bisagra);
    const anillas = new THREE.Mesh(new THREE.BoxGeometry(14, .8, .8), new THREE.MeshLambertMaterial({ color: P.steel })); anillas.position.set(0, 9.2, .2); cal.add(anillas);
    const pie = new THREE.Mesh(new THREE.BoxGeometry(1, 6, 1), new THREE.MeshLambertMaterial({ color: P.dslate })); pie.position.set(0, -12, -.5); cal.add(pie);
    const pag = (P2, dia, n, sub, col) => { const k = dia + n + sub; if (P2._k === k) return; P2._k = k; const { g, cv, tex } = P2; g.fillStyle = '#ffffff'; g.fillRect(0, 0, 128, 144); g.fillStyle = col; g.fillRect(0, 0, 128, 34);
      g.fillStyle = '#fff'; g.font = 'bold 22px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(dia, 64, 18); g.fillStyle = '#181425'; g.font = 'bold 66px monospace'; g.fillText(n, 64, 84); g.fillStyle = col; g.font = 'bold 13px monospace'; sub.split('|').forEach((l, i) => g.fillText(l, 64, 124 + i * 14 - (sub.includes('|') ? 7 : 0))); tex.needsUpdate = true; };
    const Pp = new Bloques(36 * 4); s.add(Pp.im); const ropa = [P.red, P.blue, P.lime, P.orange, P.rose, P.cyan, P.yellow, P.teal];
    const cola = (entra, salta) => { Pp.ini(); for (let i = 0; i < 30; i++) { const fila = i % 3, col = Math.floor(i / 3), x0 = (col - 4.5) * 4.6, z0 = 2 + fila * 4.5; const kk = clamp(entra * 2.2 - i / 30, 0, 1);
        const x = lerp(x0, 0, kk), z = lerp(z0, -18, kk); if (z < -14.5) continue; persona(Pp, x, Math.abs(Math.sin(salta * 9 + i)) * salta * .6, z, ropa[i % 8], { s: 1 }); } Pp.fin(); };
    const letreros = (negro) => { rotular(letrero, ['BLACK', 'FRIDAY'], [negro > 0 ? `rgb(${255 - negro * 230 | 0},${255 - negro * 230 | 0},${255 - negro * 210 | 0})` : '#ffffff', '#fee761'], '#181425', 44, { borde: '#fee761' }); rotular(cartelI, ['-50%'], '#fee761', '#e43b44', 34); rotular(cartelD, ['-70%'], '#fee761', '#e43b44', 34); };
    const c = cam(46);
    return { s, c, upd(t) { cola(0, 0); gp.position.y = 0; interior.intensity = 0; bolsas.forEach(b => b.visible = false); cal.visible = false; letrero.m.visible = true; letreros(0); mira(c, [Math.sin(t * .1) * 5, 16, 92], [0, 16, -12], .12); },
      acc: {
        // se abre la persiana y la cola entra corriendo; salen bolsas volando
        rebajas(lt, dur, t) { letrero.m.visible = false; const k = ss(clamp((lt - .2) / 1.2, 0, 1)); gp.position.y = k * 15.5; interior.intensity = 160 * k; cola(clamp((lt - .6) / (dur * 1.1), 0, 1), k > .5 ? 1 : 0);
          bolsas.forEach((b, i) => { const u = clamp((lt - 1.2 - i * .35) / 1.4, 0, 1); b.visible = u > 0 && u < 1; b.position.set(lerp(0, (i - 1.5) * 12, u), 6 + Math.sin(u * Math.PI) * 18, lerp(-14, 10, u)); b.rotation.set(u * 3, u * 5 + i, 0); });
          const kc = ss(clamp(lt / dur, 0, 1)); mira(c, [0, 16, lerp(98, 90, kc)], [0, 16, -12], .12); },
        // el calendario pasa la hoja: del jueves 26 (Acción de Gracias) al viernes 27
        calendario(lt, dur, t) { cal.visible = true; cola(.15, 0); gp.position.y = 15.5; interior.intensity = 160; pag(atras, 'VIERNES', '27', 'NOVIEMBRE', '#181425'); pag(frente, 'JUEVES', '26', 'ACCIÓN DE|GRACIAS', '#f77622');
          const k = ss(clamp((lt - dur * .35) / .9, 0, 1)); bisagra.rotation.x = -k * Math.PI * .98; frente.m.visible = k < .97; cal.rotation.y = Math.sin(t * .7) * .12; mira(c, [0, 16, 82], [0, 14, 16], .085); },
        // ¿por qué «negro»? se apaga todo y solo queda la palabra BLACK… a oscuras
        apagon(lt, dur, t) { const k = ss(clamp((lt - .3) / 1.4, 0, 1)); cola(.15, 0); gp.position.y = 15.5 * (1 - k); interior.intensity = 160 * (1 - k); letreros(k); const kc = ss(clamp(lt / dur, 0, 1)); mira(c, [0, lerp(16, 20, kc), lerp(92, 84, kc)], [0, 17, -12], .12); },
      } };
  },
  // —— Black Friday 2: el libro de cuentas, de rojo a negro ——
  cuentas: () => {
    const s = new THREE.Scene(); s.background = cielo([P.umber, P.dbrown, P.brown]); s.fog = new THREE.Fog(0x3e2731, 120, 240);
    luces(s, { cielo: 0xffe8c8, suelo: 0x3e2731, amb: 1.3, sol: 0xfff0d0, int: 2, dir: [-30, 80, 30], sombra: 50 });
    const v = new Vox(); v.box(-50, -4, -40, 50, 0, 40, (x, y, z) => y === -1 ? ((z >> 2) % 2 ? P.brown : P.tan) : P.dbrown);
    v.box(26, 0, -18, 30, 2, -14, P.dslate); v.box(27, 2, -17, 29, 20, -15, P.dslate); v.box(18, 18, -19, 30, 22, -13, P.amber); v.luz(P.amber);   // flexo
    for (let i = 0; i < 5; i++) v.cyl(-28, 14, i, i + 1, 3, P.yellow); v.cyl(-22, 20, 0, 3, 3, P.yellow); s.add(v.build());   // monedas
    const libro = actor('libro', 1.3); libro.position.set(0, 2, 0); s.add(libro);
    const izq = pantalla(15, 22, 120, 176), der = pantalla(15, 22, 120, 176); [izq, der].forEach((p2, i) => { p2.m.rotation.x = -Math.PI / 2; p2.m.position.set(i ? 9.5 : -9.5, 3.85, 0); s.add(p2.m); });
    const R0 = ['-1.200', '-850', '-430', '-90'], N0 = ['+300', '+1.500', '+2.900', '+4.800'];
    const hoja = (P2, filas, cols, tit) => { const k = filas.join() + cols.join(); if (P2._k === k) return; P2._k = k; const { g, tex } = P2; g.fillStyle = '#ffffff'; g.fillRect(0, 0, 120, 176); g.fillStyle = '#8b9bb4'; for (let y = 40; y < 176; y += 30) g.fillRect(6, y + 12, 108, 2);
      g.font = 'bold 15px monospace'; g.textAlign = 'center'; g.fillStyle = '#3a4466'; g.fillText(tit, 60, 22); g.font = 'bold 22px monospace'; filas.forEach((f, i) => { g.fillStyle = cols[i]; g.fillText(f, 60, 60 + i * 30); }); tex.needsUpdate = true; };
    const c = cam(46);
    return { s, c, upd(t) { hoja(izq, R0, R0.map(() => '#e43b44'), 'ENERO-OCT'); hoja(der, R0, R0.map(() => '#e43b44'), 'NOVIEMBRE'); mira(c, [Math.sin(t * .15) * 8, 72, 58], [0, 2, 0], .1); },
      acc: {
        // la página de noviembre pasa de números rojos a negros, fila a fila
        rojo_negro(lt, dur, t) { hoja(izq, R0, R0.map(() => '#e43b44'), 'ENERO-OCT'); const f = R0.map((r, i) => lt > dur * (.4 + i * .12) ? N0[i] : r); hoja(der, f, f.map(x => x[0] === '+' ? '#181425' : '#e43b44'), 'NOVIEMBRE');
          const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-6, 6, k), lerp(74, 66, k), lerp(60, 54, k)], [lerp(0, 4, k), 2, 0], .1); },
      } };
  },
  // —— Black Friday 3: Filadelfia en los años 60, atascos, gentío y el cartel de «Big Friday» ——
  filadelfia: () => {
    const s = new THREE.Scene(); s.background = cielo([P.steel, P.silver, 0xe8eef5]); s.fog = new THREE.Fog(0xc0cbdc, 110, 260);
    luces(s, { cielo: 0xe8eef8, suelo: 0x5a6988, amb: 1.35, sol: 0xfff4e0, int: 1.7, dir: [-40, 70, 40], sombra: 90 });
    const v = new Vox(); v.box(-40, -1, -140, 40, 0, 70, (x, y, z) => Math.abs(x) > 12 ? P.silver : (x === 0 && (z >> 2) % 2 ? P.yellow : P.dslate));
    v.box(-70, -1, -14, 70, 0, -2, (x, y, z) => Math.abs(x) > 12 ? P.silver : ((x >> 1) % 2 ? P.white : P.dslate));   // cruce con paso de cebra
    for (let i = 0; i < 7; i++) for (const sd of [-1, 1]) { const z = -130 + i * 26, h = 22 + (hsh(i, sd, 4) * 26 | 0), x0 = sd < 0 ? -40 : 16, col = [P.brown, P.dbrown, P.tan, P.crimson][(i + (sd > 0 ? 2 : 0)) % 4];
      if (z > -16 && z < 0) continue; v.box(x0, 0, z, x0 + 24, h, z + 22, col); for (let y = 4; y < h - 2; y += 5) for (let k = 2; k < 21; k += 4) v.box(sd < 0 ? x0 + 24 : x0 - 1, y, z + k, sd < 0 ? x0 + 25 : x0, y + 3, z + k + 2, hsh(i, y, k) > .4 ? P.navy : P.amber);
      v.box(sd < 0 ? x0 + 24 : x0 - 2, 6, z + 3, sd < 0 ? x0 + 26 : x0, 9, z + 19, [P.red, P.lime, P.blue][(i + sd + 3) % 3]); }
    v.box(-6, 0, -175, 6, 60, -163, P.sand); v.box(-3, 60, -172, 3, 74, -166, P.tan); v.cyl(0, -169, 74, 80, 2, P.silver); v.box(-3, 50, -163, 3, 56, -162, P.white); v.luz(P.amber); s.add(v.build());   // torre del reloj al fondo
    const agente = actor('agente', .55); agente.position.set(0, 6.2, -8); s.add(agente); const peana = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 1, 12), new THREE.MeshLambertMaterial({ color: P.white })); peana.position.set(0, .5, -8); s.add(peana);
    const brazo = agente.getObjectByName('brazo');
    const Cc = new Bloques(30 * 4), Pp = new Bloques(90 * 4); s.add(Cc.im, Pp.im); const colC = [P.red, P.blue, P.lime, P.yellow, P.rose, P.teal, P.orange, P.sand];
    const coches = (av, t) => { Cc.ini(); for (let i = 0; i < 26; i++) { const carril = i % 2, x = carril ? 5 : -5, dir = carril ? -1 : 1, z0 = (carril ? -120 : 60) + dir * -1 * 0 + (Math.floor(i / 2)) * 10.5 * (carril ? 1 : -1);
        const z = z0 + dir * av * (1 + .1 * Math.sin(i)), col = colC[i % 8], bot = Math.abs(Math.sin(t * 8 + i)) * .1; if (z > -16 && z < 0) continue;
        Cc.pon(x, 1.8 + bot, z, 5, 2.2, 9, col); Cc.pon(x, 3.6 + bot, z + dir * .5, 4.4, 1.6, 5, P.silver); Cc.pon(x, .7, z - 3, 5.4, 1.4, 1.6, P.ink); Cc.pon(x, .7, z + 3, 5.4, 1.4, 1.6, P.ink); } Cc.fin(); };
    const gentio = (n, t) => { Pp.ini(); for (let i = 0; i < n; i++) { const sd = i % 2 ? 1 : -1, x = sd * (14.5 + (i % 5) * 1.6), z = -110 + ((i * 37) % 160) + Math.sin(t * 1.5 + i) * 1.2; if (z > -15 && z < -1) continue; persona(Pp, x, 0, z, [P.crimson, P.navy, P.dbrown, P.plum, P.teal, P.slate][i % 6], { pelo: i % 3 ? P.dbrown : P.ink }); } Pp.fin(); };
    const banda = new THREE.Group(); s.add(banda); const cart = pantalla(30, 8, 240, 64); cart.m.position.set(15, 0, 0); banda.add(cart.m); banda.position.set(-15, 30, -40);
    rotular(cart, ['★ BIG FRIDAY ★'], '#e43b44', '#ffffff', 30, { borde: '#124e89' });
    const c = cam(46);
    return { s, c, upd(t) { coches(0, t); gentio(40, t); banda.visible = false; brazo.rotation.z = 0; agente.rotation.y = 0; mira(c, [Math.sin(t * .1) * 4, 18, 46], [0, 10, -20], .05); },
      acc: {
        // llegada: la cámara baja desde los tejados hasta el cruce
        llegar(lt, dur, t) { coches(lt * 2, t); gentio(40, t); const k = ss(clamp(lt / dur, 0, 1)); mira(c, [0, lerp(95, 20, k), lerp(70, 46, k)], [0, lerp(20, 10, k), lerp(-60, -20, k)], .04); },
        // atasco: los coches casi no avanzan, la acera se llena y el policía no para de hacer señas
        atasco(lt, dur, t) { coches(lt * .6, t); gentio(Math.min(90, 40 + lt * 18 | 0), t); brazo.rotation.z = 2.6 + Math.sin(t * 7) * .5; agente.rotation.y = Math.sin(t * 1.3) * .6; mira(c, [lerp(10, 4, ss(clamp(lt / dur, 0, 1))), 16, 36], [0, 8, -12], .08); },
        // las tiendas cuelgan «Big Friday»… se descuelga y nadie le hace caso
        cartel(lt, dur, t) { coches(lt * .6, t); gentio(90, t); brazo.rotation.z = 2.6 + Math.sin(t * 7) * .5; banda.visible = true; const sube = ss(clamp(lt / 1.2, 0, 1)), cae = ss(clamp((lt - dur * .55) / 1, 0, 1));
          banda.position.set(-15, lerp(6, 30, sube), -40); banda.rotation.z = -cae * 1.25; mira(c, [0, 18, 34], [0, 18, -40], .1); },
      } };
  },

  // —— Juegos 1: la arena con el cuerno dorado y los tributos en sus plataformas ——
  arena: () => {
    const s = new THREE.Scene(); s.background = cielo([P.navy, P.blue, P.cyan]); s.fog = new THREE.Fog(0x9fd8f0, 130, 300);
    luces(s, { cielo: 0xe0f0ff, suelo: 0x265c42, amb: 1.25, sol: 0xfff1d6, int: 2.2, dir: [-40, 80, 40], sombra: 70 });
    const v = new Vox(); v.box(-120, -2, -120, 120, 0, 120, (x, y, z) => { const d = Math.hypot(x, z); return d < 30 ? (hsh(x, 1, z) > .8 ? P.tan : P.sand) : hsh(x >> 2, 2, z >> 2) > .6 ? P.green : P.dgreen; });
    v.box(40, -2, -80, 90, -1, -40, P.blue); s.add(v.build({ jit: .05 }));
    for (let i = 0; i < 34; i++) { const a = i / 34 * Math.PI * 2 + hsh(i, 1, 1) * .2, r = 44 + hsh(i, 2, 2) * 30, p = actor('pino', .9 + hsh(i, 3, 3) * .6); p.position.set(Math.cos(a) * r, 9, Math.sin(a) * r); s.add(p); }
    const cuerno = actor('cuerno', .75); cuerno.position.set(0, 5, 0); cuerno.rotation.y = Math.PI / 2 + .3; s.add(cuerno);
    const B = new Bloques(48 * 5); s.add(B.im); const col12 = [P.red, P.orange, P.yellow, P.lime, P.green, P.teal, P.cyan, P.blue, P.navy, P.plum, P.rose, P.pink];
    const plataformas = (k2, t) => { B.ini(); for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2, x = Math.cos(a) * 20, z = Math.sin(a) * 20, nueva = i % 2 === 1, y = nueva ? lerp(-5, 0, k2) : 0; if (nueva && k2 <= 0) continue;
        B.pon(x, y + .5, z, 2.6, 1, 2.6, P.steel); persona(B, x, y + 1, z, col12[Math.floor(i / 4) % 12], { s: .75, pelo: i % 3 ? P.dbrown : P.ink }); } B.fin(); };
    const cielo2 = pantalla(26, 12, 208, 96); cielo2.m.position.set(0, 21, -22); s.add(cielo2.m);
    const c = cam(46);
    return { s, c, upd(t) { plataformas(1, t); cielo2.m.visible = false; const a = t * .05; mira(c, [Math.sin(a) * 70, 52, Math.cos(a) * 70], [0, 0, 0], .06); },
      acc: {
        // 24 plataformas… y de la tierra salen otras 24: 48 tributos
        duplicar(lt, dur, t) { plataformas(ss(clamp((lt - dur * .3) / (dur * .45), 0, 1)), t); mira(c, [0, 60, 78], [0, -2, 0], .05); },
        // vuelta alrededor de la arena
        vuelta(lt, dur, t) { plataformas(1, t); const a = .3 + lt * .32; mira(c, [Math.sin(a) * 88, 44, Math.cos(a) * 88], [0, 2, 0], .06); },
        // en el cielo, el número de los Juegos retrocede del 74 al 50
        atras(lt, dur, t) { plataformas(1, t); cielo2.m.visible = true; const n = Math.round(lerp(74, 50, ss(clamp((lt - .3) / (dur * .7), 0, 1)))); rotular(cielo2, [n + '.º', 'JUEGOS'], n === 50 ? '#fee761' : '#ffffff', '#124e89', 40, { borde: '#fee761' }); mira(c, [0, 24, 84], [0, 21, -22], .0); },
        // la cámara sube hasta ver el círculo entero desde arriba
        subir(lt, dur, t) { plataformas(1, t); const k = ss(clamp(lt / dur, 0, 1)); mira(c, [0, lerp(40, 112, k), lerp(78, 30, k)], [0, 0, 0], .04); },
      } };
  },
  // —— Juegos 2: la capital y los doce distritos, con los hitos de 25 años y el tren de tributos ——
  distritos: () => {
    const s = new THREE.Scene(); s.background = cielo([P.navy, P.blue, 0xbfe8ff]); s.fog = new THREE.Fog(0xb0d8f0, 150, 320);
    luces(s, { cielo: 0xe0f0ff, suelo: 0x265c42, amb: 1.3, sol: 0xfff1d6, int: 2, dir: [-30, 80, 60], sombra: 80 });
    const v = new Vox(); v.box(-110, -2, -110, 110, 0, 90, (x, y, z) => hsh(x >> 3, 4, z >> 3) > .65 ? P.green : P.lime);
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, x = Math.cos(a) * 7, z = -34 + Math.sin(a) * 5, h = 18 + (i % 3) * 8; v.box(x - 2, 0, z - 2, x + 2, h, z + 2, i % 2 ? P.white : P.silver); v.set(x, h, z, P.yellow); } v.box(-3, 0, -37, 3, 34, -31, P.white); v.ball(0, 34, -34, 4, P.silver); v.luz(P.yellow);
    const D = []; for (let i = 0; i < 12; i++) { const a = Math.PI * (.08 + .84 * i / 11), x = -Math.cos(a) * 34, z = -34 + Math.sin(a) * 40; D.push([x, z]);
      for (let k = 0; k < 3; k++) v.box(x - 3 + k * 2.2 | 0, 0, z - 1 + (k % 2) * 2 | 0, (x - 3 + k * 2.2 | 0) + 2, 3, (z - 1 + (k % 2) * 2 | 0) + 2, [P.brown, P.tan, P.sand][k]);
      const n = Math.hypot(x, z + 34) | 0; for (let r = 4; r < n - 3; r++) { const u = r / n; v.set(x * (1 - u), 0, z * (1 - u) + -34 * u, P.slate); } }
    s.add(v.build({ jit: .05 }));
    const tren = actor('tren', .32); s.add(tren);
    const hitos = [25, 50, 75].map((n, i) => { const g = new THREE.Group(); const col = new THREE.Mesh(new THREE.BoxGeometry(6, 14, 6), new THREE.MeshLambertMaterial({ color: i === 1 ? P.amber : P.silver })); col.position.y = 7; g.add(col);
      const p2 = pantalla(5.4, 5, 54, 50); p2.m.position.set(0, 10, 3.05); g.add(p2.m); rotular(p2, [String(n)], i === 1 ? '#181425' : '#3a4466', i === 1 ? '#fee761' : '#ffffff', 30); g.position.set((i - 1) * 13, 0, 34); s.add(g); return g; });
    const B = new Bloques(48 * 3); s.add(B.im); const col12 = [P.red, P.orange, P.yellow, P.lime, P.green, P.teal, P.cyan, P.blue, P.navy, P.plum, P.rose, P.pink];
    const tributos = (n, ida) => { B.ini(); D.forEach(([x, z], d) => { for (let k = 0; k < n; k++) { const ox = (k - 1.5) * 1.6, u = ida, X = lerp(x + ox, ox * .5, u), Z = lerp(z + 4, -28, u); persona(B, X, 0, Z, col12[d], { s: .8 }); } }); B.fin(); };
    const c = cam(46);
    return { s, c, upd(t) { tributos(0, 0); hitos.forEach(h => { h.visible = false; h.scale.y = 1; }); tren.visible = false; mira(c, [Math.sin(t * .05) * 8, 104, 78], [0, 0, -16], .04); },
      acc: {
        // tres hitos de piedra: 25, 50 y 75 años; el de 50 brilla en oro
        hitos(lt, dur, t) { hitos.forEach((h, i) => { const k = ss(clamp((lt - .2 - i * .5) / .7, 0, 1)); h.visible = k > 0; h.scale.set(1, Math.max(.01, k), 1); h.position.y = i === 1 && lt > 2 ? Math.abs(Math.sin(t * 3)) * .6 : 0; });
          const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-6, 4, k), 24, lerp(126, 118, k)], [0, 10, 30], .1); },
        // cada distrito saca dos tributos… y luego dos más; todos van hacia la capital y sale el tren
        envio(lt, dur, t) { const n = lt < dur * .38 ? 2 : 4; tributos(n, ss(clamp((lt - dur * .6) / (dur * .4), 0, 1))); tren.visible = lt > dur * .7; const u = clamp((lt - dur * .7) / (dur * .3), 0, 1); tren.position.set(0, 1.5, lerp(10, -26, u)); tren.rotation.y = Math.PI / 2;
          mira(c, [0, 104, 78], [0, 0, -16], .04); },
      } };
  },
  // —— Juegos 3: la plaza del distrito, el foco sobre un chico de 16 años y, años después, el mentor ——
  mentor: () => {
    const s = new THREE.Scene(); s.background = cielo([P.ink, P.night, P.slate]); s.fog = new THREE.Fog(0x262b44, 90, 200);
    luces(s, { cielo: 0x9aa8c8, suelo: 0x262b44, amb: 1.05, sol: 0xc8d0ff, int: 1.1, dir: [30, 60, 60], sombra: 60 });
    const v = new Vox(); v.box(-70, -1, -60, 70, 0, 60, (x, y, z) => ((x >> 2) + (z >> 2)) % 2 ? P.dslate : P.slate); v.box(-16, 0, -22, 16, 3, -10, P.dbrown); v.box(-16, 3, -22, 16, 4, -21, P.brown);
    for (let x = -60; x < 60; x += 14) { const h = 14 + (hsh(x, 6, 6) * 10 | 0); v.box(x, 0, -44, x + 12, h, -34, P.night); v.box(x + 2, h - 6, -34, x + 4, h - 3, -33, P.amber); } v.luz(P.amber); s.add(v.build());
    const panel = pantalla(26, 10, 208, 80); panel.m.position.set(0, 13, -21.5); s.add(panel.m); rotular(panel, ['DISTRITO 12', 'COSECHA 50'], ['#fee761', '#ffffff'], '#181425', 24, { borde: '#c0cbdc' });
    const foco = new THREE.SpotLight(0xfff1c0, 0, 90, .22, .4, 1); foco.position.set(0, 50, 10); s.add(foco, foco.target); const cono = new THREE.Mesh(new THREE.ConeGeometry(4.5, 46, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff1c0, transparent: true, opacity: .16, depthWrite: false })); s.add(cono);
    const B = new Bloques(60 * 3), H = new Bloques(4 * 4); s.add(B.im, H.im);
    const plaza = (sale) => { B.ini(); for (let i = 0; i < 48; i++) { const x = (i % 12 - 5.5) * 3.6, z = 4 + Math.floor(i / 12) * 4.2; if (i === 17 && sale > 0) continue; persona(B, x, 0, z, [P.slate, P.steel, P.dslate, P.silver][i % 4], { s: .9, pelo: i % 2 ? P.dbrown : P.ink }); } B.fin(); };
    const chico = (u, s2, mayor, t) => { const x = lerp((17 % 12 - 5.5) * 3.6, 0, u), z = lerp(4 + 4.2, -16, u), y = u > .7 ? 3 : 0; H.ini(); persona(H, x, y, z, mayor ? P.dbrown : P.teal, { s: s2, pelo: mayor ? P.tan : P.dbrown }); if (mayor > 0) persona(H, x + lerp(14, 4.5, mayor), 3, z + 1, P.green, { s: .8, pelo: P.dbrown }); H.fin();
      foco.target.position.set(x, y, z); cono.position.set(x, y + 23, z); };
    const c = cam(46);
    return { s, c, upd(t) { plaza(0); H.ini(); H.fin(); foco.intensity = 0; cono.visible = false; mira(c, [Math.sin(t * .1) * 5, 24, 84], [0, 6, -8], .08); },
      acc: {
        // el foco cae sobre un chico entre la gente y él sube al escenario
        chico(lt, dur, t) { const u = ss(clamp((lt - dur * .3) / (dur * .6), 0, 1)); plaza(1); chico(u, .9, 0, t); foco.intensity = 900; cono.visible = true; const k = ss(clamp(lt / dur, 0, 1)); mira(c, [0, lerp(26, 20, k), lerp(86, 64, k)], [0, 6, lerp(-4, -12, k)], .1); },
        // años después: el chico crece (pelo más claro) y llega una aprendiz a su lado
        crecer(lt, dur, t) { const k = ss(clamp((lt - .3) / (dur * .5), 0, 1)); plaza(1); chico(1, lerp(.9, 1.15, k), Math.max(.001, ss(clamp((lt - dur * .45) / (dur * .45), 0, 1))), t); foco.intensity = 900; cono.visible = true; mira(c, [4, 18, 58], [2, 7, -14], .1); },
      } };
  },
});
// sitios del hemiciclo: 350 asientos en filas semicirculares → [x, z, y, ángulo, fila, fracción]
function hemiSitios() { const out = []; const filas = 10; let quedan = 350; for (let f = 0; f < filas; f++) { const r = 14 + f * 3.6, n = f === filas - 1 ? quedan : Math.round(350 * r / (filas * 14 + 3.6 * 45)); quedan -= n;
  for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + Math.PI * (i + .5) / n; out.push([Math.sin(a) * r, -20 - Math.cos(a) * r * -1 * -1 + 0, f * 1.2, a, f, i / n]); } }
  // orden de izquierda a derecha (por ángulo) para que la mayoría se llene como un abanico
  return out.map(p => [p[0], -20 - Math.cos(p[3]) * (14 + p[4] * 3.6), p[2], p[3], p[4], p[5]]).sort((A, B2) => A[3] - B2[3]); }

export const voxTiene = n => HAYVOX && !!FABE[n];
function esc(n) { return ESC[n] || (ESC[n] = FABE[n]()); }

// —— pasada de objetos: cámara ortográfica en coordenadas del búfer (x → derecha, y → abajo) ——
const PS = new THREE.Scene();
{ PS.add(new THREE.HemisphereLight(0xeef4ff, 0x3a4466, 1.3)); const d = new THREE.DirectionalLight(0xffffff, 2.2); d.position.set(-.6, .9, 1); PS.add(d); }
const PC = new THREE.OrthographicCamera(0, W, 0, -H, -500, 500); PC.position.z = 200;
const POOL = {}; let usados = {};
function instancia(nombre) { const n = (usados[nombre] = (usados[nombre] || 0) + 1); const L = POOL[nombre] || (POOL[nombre] = []); if (!L[n - 1]) { const m = nombre === 'chispa' ? chispaVox() : modelo(nombre).clone(); PS.add(m); L.push(m); } return L[n - 1]; }

let actual = null, accion = null;
export function voxFrame(lugar) { actual = lugar; accion = null; for (const k in POOL) POOL[k].forEach(m => m.visible = false); usados = {}; }
export const voxActivo = () => !!actual;
// objeto 3D centrado en (cx, cy) que cabe en un círculo de diámetro `size` (píxeles del búfer), siempre dentro de la pantalla
export function voxProp(nombre, cx, cy, size, t, p = 1) {
  if (!actual || !FAB[nombre] || p <= 0) return false;
  const m = instancia(nombre), r = modelo(nombre).userData.r, rad = size / 2;
  const e = p < 1 ? 1 + 2.2 * (p - 1) ** 3 + 1.2 * (p - 1) ** 2 : 1;   // entra con rebote
  m.scale.setScalar(rad / r * Math.max(.05, e));
  const mx = rad + 2, my = rad + 2;
  m.position.set(Math.min(W - mx, Math.max(mx, cx)), -Math.min(H - my, Math.max(my, cy)), 0);
  m.rotation.set(0, Math.sin(t * .7) * .5 + (1 - p) * 2.5, 0);
  const an = m.getObjectByName('antena'); if (an) an.rotation.y = t * 2.2;
  m.visible = true; return true;
}
export function voxChispa(x, floor, o = {}) {
  if (!actual) return false;
  const m = instancia('chispa'), s = o.s || 1, alto = m.userData.alto, k = 30 * s / alto;
  m.scale.setScalar(k); m.position.set(x, -(floor - (o.hop || 0) * 6 * s - (o.bob || 0) * s), 0);
  m.rotation.set(.12, Math.sin((o.t || 0) * .9) * .35, 0);
  const b = m.getObjectByName('boca'); if (b) b.scale.set(1, 1 + (o.talk || 0) * 2.2 + (o.surprise ? 2 : 0), 1);
  const br = m.getObjectByName('brazo'); if (br) br.rotation.z = o.wave ? .6 + Math.sin((o.t || 0) * 12) * .5 : -.25;
  m.visible = true; return true;
}
// render: escenario completo + objetos encima
export function voxRender(t) {
  if (!actual) return null;
  const e = esc(actual); e.upd(t); if (accion && e.acc && e.acc[accion.n]) e.acc[accion.n](accion.lt, accion.dur, t);
  R.clear(); R.render(e.s, e.c); R.clearDepth(); R.render(PS, PC);
  return cv;
}
export function voxApagar() { actual = null; accion = null; }
export function voxAccion(n, lt, dur) { accion = n ? { n, lt, dur } : null; }
