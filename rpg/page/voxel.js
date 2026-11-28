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

// ———————————————————— 21/11/2026: lluvia en Galicia, «Solo en casa» y F1 en Las Vegas ————————————————————
// lluvia (o nieve) en una caja: n gotas que caen y vuelven a empezar
function llueve(B, x0, x1, z0, z1, y0, y1, t, n, col = P.cyan, v = 42, o = {}) {
  const h = y1 - y0; for (let i = 0; i < n; i++) { let x = x0 + hsh(i, 5, 1) * (x1 - x0); const z = z0 + hsh(i, 6, 2) * (z1 - z0), y = y1 - ((t * v * (.8 + hsh(i, 8, 4) * .4) + hsh(i, 7, 3) * h) % h);
    if (o.copo) { x += Math.sin(t * 1.3 + i) * .8; B.pon(x, y, z, .55, .55, .55, col); } else B.pon(x + (o.inc || 0) * (y1 - y), y, z, .22, 2.4, .22, col); } }
// nubarrón de bloques: bolas de cubos alrededor de (x, y, z)
function nubarron(B, x, y, z, r, col, sem = 0, base) { for (let k = 0; k < 9; k++) { const a = hsh(k, sem, 11) * 6.28, d = hsh(k, sem, 12) * r * .8, s = r * (.55 + hsh(k, sem, 13) * .45);
  B.pon(x + Math.cos(a) * d, y + (hsh(k, sem, 14) - .3) * r * .5, z + Math.sin(a) * d * .6, s * 1.6, s * .9, s * 1.2, k < 3 && base != null ? base : col); } }
// coche de F1 genérico (sin equipos ni marcas), morro hacia +x
function f1(c1, c2) { const v = new Vox();
  v.box(-12, 1, -2, 12, 3, 2, c1); v.box(12, 1, -1, 17, 2, 1, c1); v.box(16, 0, -6, 19, 1, 6, c2);                 // chasis, morro y alerón delantero
  v.box(-6, 1, -4, 4, 3, 4, c1); v.box(-6, 3, -2, 0, 5, 2, c1); v.box(-3, 3, -1, 2, 4, 1, P.ink); v.box(-1, 5, 0, 3, 6, 1, P.ink);   // pontones, toma de aire, cabina, halo
  v.box(-1, 4, -1, 1, 5, 1, P.yellow); v.box(-15, 6, -5, -12, 7, 5, c2); v.box(-14, 2, -1, -13, 6, 1, P.ink);       // casco, alerón trasero
  v.box(-14, 1, -5, -12, 7, -4, c1); v.box(-14, 1, 4, -12, 7, 5, c1); v.box(4, 2, -2, 12, 3, 2, c2);
  for (const [x, z] of [[10, -5], [10, 5], [-10, -5], [-10, 5]]) v.box(x - 2, -1, z - 1, x + 2, 3, z + 1, P.ink);
  const w = new THREE.Group(); w.add(v.build({ centrar: false })); w.children[0].position.y = 1; return w; }
// la casa de ladrillo de la película (versión propia: dos plantas, ventanas blancas y tejado de pizarra con nieve)
function casaLad(v, x0, z0, puerta = true) { const zf = z0 + 14;
  v.box(x0, 0, z0, x0 + 30, 18, zf, (x, y) => (y % 3 === 0 || (x + ((y / 3) | 0) * 2) % 5 === 0) ? 0x9a6a5a : (hsh(x, y, 7) > .5 ? P.crimson : 0x8a2a32));
  const ven = (cx, y0) => { v.box(x0 + cx - 2, y0, zf, x0 + cx + 2, y0 + 6, zf + 1, P.white); v.box(x0 + cx - 1, y0 + 1, zf, x0 + cx + 1, y0 + 5, zf + 1, P.amber);
    v.box(x0 + cx - 3, y0, zf, x0 + cx - 2, y0 + 6, zf + 1, P.dgreen); v.box(x0 + cx + 2, y0, zf, x0 + cx + 3, y0 + 6, zf + 1, P.dgreen); };
  [4, 10, 20, 26].forEach(cx => ven(cx, 3)); [4, 10, 15, 20, 26].forEach(cx => ven(cx, 11));
  v.box(x0 + 12, 0, zf, x0 + 18, 9, zf + 1, P.white); v.box(x0 + 13, 0, zf, x0 + 17, 8, zf + 1, puerta ? P.dgreen : P.amber); v.box(x0 + 11, -1, zf, x0 + 19, 0, zf + 4, P.silver);
  for (let k = 0; k < 8; k++) v.box(x0 - 1 + (k > 5 ? 2 : 0), 18 + k, z0 - 1 + k, x0 + 31 - (k > 5 ? 2 : 0), 19 + k, zf + 1 - k, k === 7 ? P.white : (k % 2 ? P.dslate : P.slate));
  v.box(x0 - 1, 18, zf, x0 + 31, 19, zf + 1, P.white); v.box(x0 + 3, 18, z0 + 5, x0 + 6, 29, z0 + 8, P.crimson); v.box(x0 + 24, 18, z0 + 5, x0 + 27, 29, z0 + 8, P.crimson); v.luz(P.amber); }
function abeto(v, x, z, h = 14) { v.box(x, 0, z, x + 1, 3, z + 1, P.dbrown); for (let y = 3; y < h; y++) { const r = (h - y) * .42; v.cyl(x, z, y, y + 1, r, y % 3 === 0 ? P.white : P.dgreen); } v.set(x, h, z, P.white); }

Object.assign(FAB, {
  // —— lluvia en Galicia ——
  nube: () => { const v = new Vox(); [[0, 0, 0, 7], [-8, -1, 1, 5], [8, -1, -1, 5.5], [-3, 3, -1, 5], [4, 3, 1, 4.5], [0, 0, -4, 5]].forEach(([x, y, z, r]) => v.ball(x, y, z, r, (X, Y) => y + Y < -3 ? P.steel : (y + Y < -1 ? P.silver : P.white)));
    const w = new THREE.Group(); w.add(v.build({ centrar: true, jit: .04 })); return w; },
  faro: () => {   // faro gallego a franjas rojas y blancas sobre una roca, con la linterna encendida
    const v = new Vox(); v.ball(0, 0, 0, 6, P.slate, .5); v.cyl(0, 0, 2, 24, 3, (x, y) => ((y - 2) >> 2) % 2 ? P.red : P.white); v.cyl(0, 0, 24, 25, 4.6, P.dslate);
    v.cyl(0, 0, 25, 29, 2.6, (x, y, z) => (x + z) % 2 ? P.yellow : P.amber); v.cyl(0, 0, 29, 31, 3, P.red); v.set(0, 31, 0, P.dslate); v.luz(P.yellow, P.amber);
    const w = new THREE.Group(); w.add(v.build({ centrar: true })); return w; },
  horreo: () => {   // hórreo de piedra: pies con tornarratos, cámara de tablas, tejado de teja y cruz
    const v = new Vox(); for (const x of [-8, 0, 8]) for (const z of [-2, 2]) { v.box(x - 1, 0, z - 1, x + 1, 4, z + 1, P.steel); v.box(x - 2, 4, z - 2, x + 2, 5, z + 2, P.silver); }
    v.box(-10, 5, -3, 10, 11, 3, (x, y, z) => (Math.abs(z) === 3 && x % 2) ? P.dbrown : P.brown); v.box(-10, 5, -3, -9, 11, 3, P.silver); v.box(9, 5, -3, 10, 11, 3, P.silver);
    for (let k = 0; k < 4; k++) v.box(-11, 11 + k, -4 + k, 11, 12 + k, 4 - k, k % 2 ? P.crimson : P.orange); v.box(9, 15, 0, 10, 20, 1, P.silver); v.box(9, 17, -1, 10, 18, 2, P.silver);
    const w = new THREE.Group(); w.add(v.build({ centrar: true })); return w; },
  termometro: () => {   // termómetro de pared: marco blanco, rayas, bulbo rojo y columna ('mercurio') que sube y baja
    const v = new Vox(); v.box(-3, -2, -1, 4, 30, 0, P.white); for (let y = 2; y < 28; y += 3) v.box(2, y, 0, 3, y + 1, 1, P.ink); v.ball(0, 0, 0, 2.2, P.red); v.box(0, 0, 0, 1, 28, 1, P.silver);
    const w = new THREE.Group(); w.add(v.build({ centrar: false, jit: .02 }));
    const m = new Vox(); m.box(0, 0, 0, 1, 1, 1, P.red); const gm = m.build({ jit: 0 }); gm.position.set(0, 1.5, .3); gm.scale.set(1, 26, 1); gm.name = 'mercurio'; w.add(gm); return centra(w); },
  // —— Solo en casa ——
  casa_ladrillo: () => { const v = new Vox(); casaLad(v, -15, -7); const w = new THREE.Group(); w.add(v.build({ centrar: true })); return w; },
  claqueta: () => {   // claqueta de cine: pizarra negra y palo a rayas que se abre ('palo')
    const v = new Vox(); v.box(-10, 0, 0, 10, 12, 2, P.ink); for (const y of [4, 8]) v.box(-9, y, 2, 9, y + 1, 3, P.white); v.box(-10, 12, 0, 10, 14, 2, (x) => ((x + 20) >> 1) % 2 ? P.white : P.ink);
    const w = new THREE.Group(); w.add(v.build());
    const p = new Vox(); p.box(0, 0, 0, 20, 2, 2, (x) => ((x) >> 1) % 2 ? P.white : P.ink); const gp = p.build(); gp.position.set(0, 0, 0); const piv = new THREE.Group(); piv.position.set(-10, 14, 0); piv.add(gp); piv.name = 'palo'; w.add(piv);
    return centra(w); },
  camara_cine: () => {   // cámara de cine clásica con dos bobinas y objetivo
    const v = new Vox(); v.box(-6, 0, -3, 6, 7, 3, P.dslate); v.box(6, 2, -2, 10, 5, 2, P.ink); v.box(10, 1, -3, 11, 6, 3, P.slate); v.set(11, 3, 0, P.cyan);
    for (const x of [-3, 3]) { for (let a = 0; a < 6.28; a += .3) v.set(x + Math.round(Math.cos(a) * 3.5), 11 + Math.round(Math.sin(a) * 3.5), 0, P.slate); v.box(x, 7, 0, x + 1, 11, 1, P.slate); v.set(x, 11, 0, P.silver); }
    v.box(-1, -6, -1, 1, 0, 1, P.steel); v.luz(P.cyan); const w = new THREE.Group(); w.add(v.build({ centrar: true })); return w; },
  // —— F1 en Las Vegas ——
  monoplaza: () => { const g = f1(P.silver, P.cyan); return centra(g); },
  motor: () => {   // unidad de potencia: bloque gris, culatas, turbo y tubos
    const v = new Vox(); v.box(-7, 0, -4, 7, 6, 4, P.slate); for (const z of [-4, 3]) v.box(-6, 6, z, 6, 9, z + 1, P.steel); v.box(-6, 6, -3, 6, 7, 3, P.dslate);
    for (let x = -5; x <= 5; x += 2) { v.box(x, 6, -5, x + 1, 7, -4, P.orange); v.box(x, 6, 4, x + 1, 7, 5, P.orange); } v.ball(8, 4, 0, 2.5, P.silver); v.box(-8, 1, -2, -7, 5, 2, P.ink); v.box(-2, 9, -1, 2, 10, 1, P.red);
    const w = new THREE.Group(); w.add(v.build({ centrar: true })); return w; },
  letrero: () => {   // letrero luminoso de casino: marco de bombillas y estrella
    const v = new Vox(); v.box(-1, 0, 0, 1, 14, 2, P.steel); v.box(-10, 14, 0, 10, 26, 2, P.plum);
    for (let x = -10; x < 10; x++) { v.set(x, 14, 2, x % 2 ? P.yellow : P.amber); v.set(x, 25, 2, x % 2 ? P.amber : P.yellow); } for (let y = 14; y < 26; y++) { v.set(-10, y, 2, y % 2 ? P.yellow : P.amber); v.set(9, y, 2, y % 2 ? P.amber : P.yellow); }
    for (const [x, y] of [[0, 23], [-1, 21], [0, 21], [1, 21], [-3, 20], [-2, 20], [2, 20], [3, 20], [-1, 19], [0, 19], [1, 19], [-2, 17], [2, 17], [-2, 18], [2, 18]]) v.set(x, y, 2, P.pink);
    v.luz(P.yellow, P.amber, P.pink); const w = new THREE.Group(); w.add(v.build({ centrar: true })); return w; },
});

Object.assign(FABE, {
  // —— lluvia 1: un pueblo de la costa gallega bajo la lluvia, con faro y hórreo; al fondo, el mar ——
  costa: () => {
    const s = new THREE.Scene(); s.background = cielo([P.dslate, P.slate, P.steel]); s.fog = new THREE.Fog(0x8b9bb4, 80, 260);
    luces(s, { cielo: 0xc0cbdc, suelo: 0x265c42, amb: 1.6, sol: 0xdfe8ff, int: 1.0, dir: [-30, 60, 40], sombra: 90 });
    const mar = new THREE.Mesh(new THREE.PlaneGeometry(700, 400), new THREE.MeshLambertMaterial({ color: P.navy })); mar.rotation.x = -Math.PI / 2; mar.position.set(0, -6, -200); s.add(mar);
    const v = new Vox(); v.box(-90, -8, -16, 90, 0, 70, (x, y, z) => { if (y === -1) return Math.abs(x - 2) < 3 ? P.steel : (hsh(x >> 2, 1, z >> 2) > .6 ? P.green : P.dgreen); return hsh(x, y, z) > .5 ? P.slate : P.dslate; });
    for (let x = -90; x < 90; x++) for (let k = 0; k < 4; k++) if (hsh(x, k, 9) > .45) v.del(x, -1 - k, -16 + k), v.del(x, -2 - k, -16 + k);   // acantilado roto
    const piedra = (x, z, w, d, col) => { v.box(x, 0, z, x + w, 7, z + d, (X, Y, Z) => hsh(X, Y, Z) > .5 ? P.silver : P.steel); for (let k = 0; k < 4; k++) v.box(x - 1 + k, 7 + k, z - 1, x + w + 1 - k, 8 + k, z + d + 1, col); v.box(x + 2, 2, z + d, x + 4, 5, z + d + 1, P.amber); v.box(x + w - 4, 0, z + d, x + w - 2, 5, z + d + 1, P.dbrown); };
    piedra(-34, 6, 11, 8, P.crimson); piedra(-20, -4, 10, 8, P.orange); piedra(10, 4, 12, 8, P.crimson); piedra(26, 16, 10, 8, P.orange); piedra(-44, 24, 10, 8, P.orange); piedra(30, -6, 9, 7, P.crimson);
    for (let z = -12; z < 70; z += 3) { v.box(-50, 0, z, -49, 2, z + 1, P.steel); } v.luz(P.amber); s.add(v.build());
    const faro = actor('faro', .9); faro.position.set(13, 13, -12); s.add(faro); const horreo = actor('horreo', .7); horreo.position.set(-16, 7, 14); s.add(horreo);
    const B = new Bloques(1100, true), N = new Bloques(260), Pp = new Bloques(120); s.add(B.im, N.im, Pp.im);
    const haz = new THREE.Mesh(new THREE.BoxGeometry(60, 1.4, 1.4), new THREE.MeshBasicMaterial({ color: 0xfee761, transparent: true, opacity: .45 })); haz.position.set(13, 26, -12); s.add(haz);
    const gente = [[-14, 26, 1], [6, 30, -1], [-2, 20, 1], [18, 24, -1]];
    const camina = (t, prisa) => { Pp.ini(); gente.forEach(([x0, z, d], i) => { const x = x0 + d * ((t * (2 + prisa * 4) + i * 7) % 30 - 15); persona(Pp, x, 0, z, [P.navy, P.red, P.teal, P.amber][i], { s: 1.1 });
      Pp.pon(x, 8.6, z, 5.2, .5, 5.2, [P.red, P.yellow, P.blue, P.rose][i]); Pp.pon(x, 9.1, z, 3, .5, 3, [P.red, P.yellow, P.blue, P.rose][i]); Pp.pon(x, 7, z, .3, 3, .3, P.ink); }); Pp.fin(); };
    const cielo2 = (t, oscuro, avance) => { N.ini(); for (let i = 0; i < 14; i++) { const x = -80 + i * 13, z = lerp(-170, -30, avance) - (i % 3) * 14, y = 34 + (i % 4) * 5; nubarron(N, x + Math.sin(t * .3 + i) * 2, y, z, 9 + (i % 3) * 2, oscuro ? P.dslate : P.slate, i, P.night); } N.fin(); };
    const c = cam(46);
    return { s, c, upd(t) { B.ini(); llueve(B, -50, 50, -10, 80, 0, 50, t, 520, 0x9fd8ff, 44, { inc: .12 }); B.fin(); cielo2(t, false, .6); camina(t, 0); haz.rotation.y = t * 1.6;
        mira(c, [Math.sin(t * .08) * 5, 34, 118], [0, 8, 0], .06); },
      acc: {
        // chaparrón: la lluvia arrecia, la gente corre con paraguas y la cámara se acerca al pueblo
        chaparron(lt, dur, t) { const k = ss(clamp(lt / dur, 0, 1)); B.ini(); llueve(B, -50, 50, -10, 80, 0, 50, t, 600 + 450 * k, 0x9fd8ff, 52, { inc: .16 }); B.fin(); camina(t, 1); cielo2(t, true, .7);
          mira(c, [lerp(-4, 3, k), lerp(36, 26, k), lerp(124, 100, k)], [0, 8, 0], .06); },
        // la cámara se gira hacia el mar: una pared de nubes oscuras llega desde el horizonte
        mirar_mar(lt, dur, t) { const k = ss(clamp(lt / dur, 0, 1)); B.ini(); llueve(B, -50, 50, -10, 80, 0, 50, t, 700, 0x9fd8ff, 50, { inc: .16 }); B.fin(); camina(t, 1); cielo2(t, true, .2 + .7 * k);
          mira(c, [3, lerp(26, 34, k), lerp(100, 84, k)], [0, lerp(8, 26, k), lerp(0, -90, k)], .06); },
      } };
  },
  // —— lluvia 2: el Atlántico visto desde arriba; el viento del oeste empuja los frentes hacia Galicia (a la derecha) ——
  atlantico: () => {
    const s = new THREE.Scene(); s.background = cielo([P.navy, P.blue, P.cyan]); s.fog = new THREE.Fog(0x0099db, 160, 380);
    luces(s, { cielo: 0xe8f4ff, suelo: 0x124e89, amb: 1.4, sol: 0xfff1d6, int: 1.8, dir: [-40, 80, 30], sombra: 90 });
    const mar = new THREE.Mesh(new THREE.PlaneGeometry(800, 600), new THREE.MeshLambertMaterial({ color: P.navy })); mar.rotation.x = -Math.PI / 2; mar.position.y = -.5; s.add(mar);
    const costa = z => 18 + Math.sin(z * .21) * 3 + Math.sin(z * .57) * 1.6 + (z < -20 ? (z + 20) * -.15 : 0);   // costa recortada (rías)
    const v = new Vox(); for (let z = -90; z < 70; z++) { const x0 = Math.round(costa(z)); for (let x = x0; x < 110; x++) { const h = Math.max(1, Math.round(1 + (x - x0) * .35 + Math.sin(x * .3 + z * .2) * 2.5 + (hsh(x >> 2, 4, z >> 2) - .5) * 3)), hh = Math.min(h, 16);
      for (let y = 0; y < hh; y++) v.set(x, y, z, y === hh - 1 ? (hh > 12 ? P.silver : hh > 6 ? P.dgreen : (x - x0 < 2 ? P.sand : P.green)) : P.brown); } }
    s.add(v.build());
    const nubes = Array.from({ length: 12 }, (_, i) => { const m = actor('nube', .9 + hsh(i, 1, 1) * .5); s.add(m); return m; });
    const B = new Bloques(900, true); s.add(B.im);
    const vientos = (t, n, v2) => { for (let i = 0; i < n; i++) { const z = -70 + hsh(i, 2, 5) * 120, y = 6 + hsh(i, 3, 5) * 18, L = 140, x = -100 + ((t * v2 + hsh(i, 4, 5) * L) % L); B.pon(x, y, z, 7, .35, .35, P.white); } };
    const vapor = (t, n) => { for (let i = 0; i < n; i++) { const x = -70 + hsh(i, 6, 6) * 80, z = -60 + hsh(i, 7, 6) * 100, y = ((t * 5 + hsh(i, 8, 6) * 18) % 18); if (x < costa(z) - 2) B.pon(x, y, z, .7, .7, .7, P.cyan); } };
    const pon = (i, x, y, z) => { nubes[i].visible = true; nubes[i].position.set(x, y, z); };
    const c = cam(46);
    return { s, c, upd(t) { nubes.forEach((m, i) => { m.visible = false; m.scale.setScalar(.5 + hsh(i, 1, 1) * .3); }); B.ini(); vientos(t, 60, 20); B.fin(); mira(c, [-8, 112, 78], [6, 0, -14], .02); },
      acc: {
        // viento del oeste: rayas blancas que cruzan el océano de izquierda a derecha, y alguna nube que se deja llevar
        viento_oeste(lt, dur, t) { B.ini(); vientos(t, 150, 32); B.fin(); for (let i = 0; i < 4; i++) pon(i, -60 + ((lt * 12 + i * 30) % 90), 22 + i * 2, -40 + i * 22);
          const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-14, -6, k), 112, 80], [lerp(0, 6, k), 0, -14], .02); },
        // el frente: el mar se evapora, la humedad sube y se forma una fila de nubes que avanza hacia la costa
        frente(lt, dur, t) { B.ini(); vientos(t, 70, 32); vapor(t, 260); B.fin(); const k = clamp(lt / dur, 0, 1), xf = -70 + 60 * k;
          for (let i = 0; i < 9; i++) { const z = -70 + i * 15, sc = ss(clamp(k * 1.6 - i * .05, 0, 1)); nubes[i].scale.setScalar(.15 + sc * .5); pon(i, xf + Math.sin(i * 1.7) * 6, 24, z); }
          mira(c, [-14, 116, 80], [-2, 0, -14], .02); },
        // llegada: las nubes chocan con la costa, se amontonan y empieza a llover sobre tierra
        llegada(lt, dur, t) { const k = ss(clamp(lt / dur, 0, 1)); B.ini(); vientos(t, 40, 32);
          for (let i = 0; i < 9; i++) { const z = -70 + i * 15, x = Math.min(costa(z) + 2, -10 + 34 * k + Math.sin(i * 1.7) * 6); nubes[i].scale.setScalar(.7); pon(i, x, 24 + (x > costa(z) - 4 ? 4 : 0), z); }
          if (k > .4) llueve(B, 10, 40, -70, 60, 2, 20, t, 360 * (k - .3), 0x9fd8ff, 40); B.fin(); mira(c, [lerp(-8, 2, k), lerp(112, 74, k), lerp(78, 66, k)], [lerp(6, 16, k), 0, -10], .02); },
      } };
  },
  // —— lluvia 3: la montaña en corte; el aire sube por la ladera, se enfría, se hace nube y llueve ——
  ladera: () => {
    const s = new THREE.Scene(); s.background = cielo([P.blue, P.cyan, 0xd8f6ff]); s.fog = new THREE.Fog(0xbfe8ff, 200, 400);
    luces(s, { cielo: 0xe8f4ff, suelo: 0x3e8948, amb: 1.4, sol: 0xfff1d6, int: 1.9, dir: [-30, 60, 80], sombra: 70 });
    const alt = x => x < -18 ? -2 : x < 16 ? 40 * ss((x + 18) / 34) - 2 : Math.max(10, 38 - (x - 16) * .7);
    const v = new Vox(); for (let x = -60; x < 60; x++) { const h = Math.round(alt(x)); for (let z = -7; z < 7; z++) { if (h < 0) { v.set(x, -2, z, P.navy); v.set(x, -1, z, P.blue); continue; }
      for (let y = -8; y <= h; y++) v.set(x, y, z, y === h ? (h > 32 ? P.silver : P.green) : y > h - 3 ? P.dgreen : (hsh(x, y, z) > .8 ? P.dbrown : P.brown)); } }
    for (let i = 0; i < 12; i++) { const x = -14 + i * 2.6 | 0, h = Math.round(alt(x)); if (h > 30) continue; v.box(x, h + 1, -6, x + 1, h + 3, -5, P.dbrown); v.ball(x, h + 4, -5.5, 1.6, P.dgreen); } s.add(v.build({ jit: .05 }));
    const termo = actor('termometro', .8); termo.position.set(-19, 28, 2); s.add(termo); const merc = termo.getObjectByName('mercurio');
    const B = new Bloques(900, true), Nb = new Bloques(160); s.add(B.im, Nb.im);
    const ruta = u => { const x = lerp(-34, 18, u); return [x, Math.max(alt(x), 0) + 5 + (x < -18 ? 1 : 0)]; };
    const parcela = (u, nube, oscuro, t) => { const [x, y] = ruta(u); Nb.ini(); const r = 3.5 + nube * 5, n = 18 + (nube * 14 | 0); for (let k = 0; k < n; k++) { const a = hsh(k, 3, 3) * 6.28, d = hsh(k, 4, 3) * r;
      const col = nube > .05 ? (oscuro > .5 ? P.slate : (oscuro > .2 ? P.silver : P.white)) : (k % 3 ? P.cyan : P.white); const sz = nube > .05 ? 2.4 + nube * 1.5 : 1.8;
      Nb.pon(x + Math.cos(a) * d, y + Math.sin(a) * d * .6 + 1 + Math.sin(t * 2 + k) * .2, 8 + hsh(k, 5, 3) * 2, sz, sz * .8, sz, col); } Nb.fin(); return [x, y]; };
    const flechas = (t, u0, u1) => { for (let i = 0; i < 24; i++) { const u = u0 + ((t * .12 + i / 24) % 1) * (u1 - u0), [x, y] = ruta(u); B.pon(x, y - 1.5, 8.5, 1.6, .3, .3, P.white, -Math.atan2(alt(x + 1) - alt(x - 1), 2) * 0); } };
    const temp = y => clamp(1 - y / 50, .15, 1);
    const c = cam(46);
    return { s, c, upd(t) { B.ini(); flechas(t, 0, 1); B.fin(); parcela(.05, 0, 0, t); termo.position.set(-19, 28, 2); merc.scale.y = 26 * temp(0); mira(c, [Math.sin(t * .1) * 3, 22, 108], [0, 18, 0], .08); },
      acc: {
        // la burbuja de aire (azul) llega del mar y sube por la ladera
        subida(lt, dur, t) { const u = .02 + .55 * ss(clamp(lt / dur, 0, 1)); B.ini(); flechas(t, 0, 1); B.fin(); const [, y] = parcela(u, 0, 0, t); merc.scale.y = 26 * temp(y); },
        // arriba se enfría: los cubos se vuelven nube, la nube se oscurece y llueve en la ladera
        condensa(lt, dur, t) { const k = clamp(lt / dur, 0, 1), u = .57 + .3 * ss(k); const nube = ss(clamp(k * 2, 0, 1)), osc = clamp(k * 1.6 - .5, 0, 1); const [x, y] = parcela(u, nube, osc, t);
          B.ini(); flechas(t, .6, 1); if (osc > .1) for (let i = 0; i < 200 * osc; i++) { const xx = x - 6 + hsh(i, 9, 9) * 12, hh = y - Math.max(0, alt(xx)), yy = y - ((t * 30 + hsh(i, 8, 8) * hh) % hh); B.pon(xx, yy, 8 + hsh(i, 7, 7) * 3, .25, 2, .25, 0x9fd8ff); } B.fin();
          merc.scale.y = 26 * temp(y); mira(c, [2, 30, 104], [4, 28, 0], .08); },
        // el termómetro viaja con el aire: cada salto hacia arriba, la columna baja un poco
        termometro(lt, dur, t) { const k = clamp(lt / dur, 0, 1), u = .2 + .6 * k; const [x, y] = parcela(u, k > .5 ? .6 : 0, 0, t); termo.position.set(x - 8, y + 6, 4); merc.scale.y = 26 * temp(y) * (1 - .15 * k);
          B.ini(); for (let h = 0; h < 40; h += 5) B.pon(-40, h, 8, 3, .4, .4, P.white); flechas(t, 0, 1); B.fin(); mira(c, [x * .6 - 3, y + 10, 92], [x * .8 - 3, y + 10, 0], .08); },
      } };
  },
});

Object.assign(FABE, {
  // —— Solo en casa 1: calle nevada de noche y la casa de ladrillo; se encienden las luces y se abre la puerta ——
  nevada: () => {
    const s = new THREE.Scene(); s.background = cielo([P.ink, P.night, P.navy, P.dslate]); s.fog = new THREE.Fog(0x262b44, 90, 240);
    luces(s, { cielo: 0x9ab0e0, suelo: 0xc0cbdc, amb: 1.25, sol: 0xb8c8ff, int: 1.1, dir: [30, 70, 60], sombra: 80 });
    const v = new Vox(); v.box(-100, -2, -80, 100, 0, 90, (x, y, z) => (z > 26 && z < 40) ? (hsh(x >> 1, 2, z >> 1) > .85 ? P.white : P.steel) : (hsh(x, 1, z) > .2 ? P.white : P.silver));
    v.box(-2, 0, 10, 2, 1, 26, P.silver); casaLad(v, -15, -10, false);
    for (const [x, z, c1] of [[-62, -6, P.navy], [36, -4, P.sand], [-70, 50, P.teal], [40, 52, P.plum]]) { v.box(x, 0, z, x + 22, 12, z + 12, c1); for (let k = 0; k < 6; k++) v.box(x - 1, 12 + k, z - 1 + k, x + 23, 13 + k, z + 13 - k, k === 5 ? P.white : P.dslate);
      for (const dx of [4, 16]) v.box(x + dx, 4, z + (z > 20 ? -1 : 12), x + dx + 3, 8, z + (z > 20 ? 0 : 13), P.amber); }
    [[-28, 6], [26, 8], [-40, -20], [44, -24], [-22, 20], [22, 20]].forEach(([x, z], i) => abeto(v, x, z, 13 + (i % 3) * 3));
    for (const x of [-34, 34]) { v.box(x, 0, 24, x + 1, 13, 25, P.ink); v.box(x - 1, 13, 23, x + 2, 15, 26, P.yellow); } v.luz(P.amber, P.yellow); s.add(v.build());
    const piv = new THREE.Group(); piv.position.set(-2, 0, 4.5); const pv = new Vox(); pv.box(0, 0, 0, 4, 8, 1, P.dgreen); pv.set(3, 4, 1, P.yellow); const pm = pv.build({ jit: .02 }); piv.add(pm); s.add(piv);
    const calida = new THREE.PointLight(0xfeae34, 0, 40, 1.6); calida.position.set(0, 5, 8); s.add(calida);
    const L = new Bloques(160, true), Sn = new Bloques(500, true), Pp = new Bloques(30); s.add(L.im, Sn.im, Pp.im);
    const bombillas = []; for (let x = -16; x <= 16; x += 1.5) bombillas.push([x, 18.3, 5.2]); for (let y = 0; y <= 18; y += 1.5) { bombillas.push([-15.8, y, 4.6]); bombillas.push([15.8, y, 4.6]); }
    for (let x = -11; x <= 11; x += 1.5) bombillas.push([x, 9.6, 5]);
    const COL = [P.red, P.lime, P.yellow, P.blue, P.orange];
    const luces2 = (n, t) => { L.ini(); bombillas.forEach(([x, y, z], i) => { if (i < n) L.pon(x, y, z, .8, .8, .8, COL[(i + (Math.floor(t * 2) % 5)) % 5]); }); L.fin(); };
    const nieve = t => { Sn.ini(); llueve(Sn, -60, 60, -30, 80, 0, 50, t, 480, P.white, 4, { copo: true }); Sn.fin(); };
    const c = cam(46);
    return { s, c, upd(t) { nieve(t); luces2(0, t); piv.rotation.y = 0; calida.intensity = 0; Pp.ini(); Pp.fin(); mira(c, [Math.sin(t * .08) * 5, 22, 104], [0, 12, 0], .08); },
      acc: {
        // las luces de Navidad se encienden una a una y la cámara se acerca a la casa
        luces(lt, dur, t) { const k = ss(clamp(lt / dur, 0, 1)); luces2(Math.floor(bombillas.length * clamp(lt / (dur * .8), 0, 1)), t); mira(c, [lerp(-6, 0, k), lerp(26, 20, k), lerp(116, 96, k)], [0, 12, 0], .08); },
        // se abre la puerta, sale luz cálida y un hombre con abrigo baja los escalones hasta la nieve
        puerta_abre(lt, dur, t) { luces2(bombillas.length, t); const a = ss(clamp(lt / .9, 0, 1)); piv.rotation.y = -1.7 * a; calida.intensity = 60 * a;
          const w = clamp((lt - 1) / (dur - 1.2), 0, 1); Pp.ini(); if (lt > .8) persona(Pp, Math.sin(w * 6) * .3, w > .3 ? 0 : 0, lerp(3, 18, w), P.dgreen, { s: 1.6, pelo: P.tan }); Pp.fin();
          const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(4, 8, k), 13, lerp(88, 76, k)], [0, 9, 6], .08); },
      } };
  },
  // —— Solo en casa 2: el plató, con una réplica de la fachada, focos, grúa, claqueta y equipo de rodaje ——
  plato: () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(P.ink); s.fog = new THREE.Fog(P.ink, 90, 200);
    luces(s, { cielo: 0x9a8ac8, suelo: 0x3a4466, amb: 1.1, sol: 0xffe2b0, int: 1.8, dir: [20, 60, 70], sombra: 70 });
    const v = new Vox(); v.box(-70, -1, -50, 70, 0, 70, (x, y, z) => ((x >> 3) + (z >> 3)) % 2 ? P.night : P.dslate); v.box(-70, 0, -52, 70, 60, -50, P.ink);
    casaLad(v, -15, -24, true); v.box(-16, 0, -26, 16, 1, -24, P.dbrown);
    for (const x of [-17, 16]) for (let y = 0; y < 30; y += 6) { v.box(x, y, -26, x + 1, y + 6, -25, P.steel); v.box(x, y, -26, x + 1, y + 1, -10, P.steel); }   // andamios de la réplica
    v.box(-20, 0, 26, 20, 1, 30, P.slate); for (let x = -20; x < 20; x += 3) v.box(x, 1, 27, x + 1, 2, 29, P.dbrown);   // vía del travelling
    for (const [x, z] of [[-30, 10], [30, 12], [-34, -8], [34, -6]]) { v.box(x, 0, z, x + 1, 22, z + 1, P.steel); v.box(x - 3, 22, z - 2, x + 4, 27, z + 3, P.slate); v.box(x - 2, 23, z + 3, x + 3, 26, z + 4, P.yellow); }
    for (const x of [-22, 18]) { v.box(x, 0, 36, x + 4, 4, 40, P.dbrown); v.box(x, 4, 39, x + 4, 9, 40, P.navy); v.box(x, 4, 36, x + 4, 5, 39, P.navy); }   // sillas de director
    v.luz(P.yellow); s.add(v.build());
    for (const [x, z] of [[-30, 10], [30, 12]]) { const l = new THREE.SpotLight(0xffe8b0, 400, 140, .6, .5, 1.4); l.position.set(x, 24, z); l.target.position.set(0, 6, -10); s.add(l, l.target); }
    const claq = actor('claqueta', .9); s.add(claq); const palo = claq.getObjectByName('palo');
    const brazo = new THREE.Group(); brazo.position.set(26, 6, 22); s.add(brazo); const bv = new Vox(); bv.box(0, -1, -1, 40, 1, 1, P.amber); bv.box(-8, -2, -2, 0, 2, 2, P.slate); const gb = bv.build(); gb.position.x = -40; brazo.add(gb);
    const base = new Vox(); base.box(23, 0, 19, 29, 6, 25, P.slate); s.add(base.build());
    const camc = actor('camara_cine', .7); s.add(camc);
    const tablero = pantalla(18, 14, 144, 112); tablero.m.position.set(-24, 14, 18); tablero.m.rotation.y = .5; s.add(tablero.m); const pata = new Vox(); pata.box(-26, 0, 17, -25, 7, 18, P.dbrown); pata.box(-22, 0, 19, -21, 7, 20, P.dbrown); s.add(pata.build());
    const Pp = new Bloques(60); s.add(Pp.im);
    const equipo = t => { [[-26, 32, P.navy], [24, 34, P.rose], [10, 30, P.teal]].forEach(([x, z, c1], i) => persona(Pp, x + Math.sin(t * .5 + i) * 1.5, 0, z, c1, { s: 1.4 })); };
    const grua = a => { brazo.rotation.z = a; const p = new THREE.Vector3(-40, 0, 0).applyEuler(brazo.rotation).add(brazo.position); camc.position.set(p.x, p.y + 4, p.z); camc.rotation.y = -Math.PI / 2 + .3; };
    const c = cam(46);
    return { s, c, upd(t) { claq.visible = false; tablero.m.visible = true; rotular(tablero, ['RODAJE', 'SOLO EN', 'CASA'], '#ffffff', '#181425', 20, { borde: '#feae34' }); grua(-.15); Pp.ini(); equipo(t); Pp.fin(); mira(c, [Math.sin(t * .1) * 6, 26, 110], [0, 12, -6], .08); },
      acc: {
        // la claqueta se cierra delante del plató: ¡acción!
        claqueta(lt, dur, t) { claq.visible = true; claq.position.set(0, 18, 46); claq.rotation.set(0, Math.sin(t * .6) * .15, 0); const cierra = lt < .9 ? -.7 * ss(lt / .9) : -.7 * (1 - ss(clamp((lt - .9) / .15, 0, 1)));
          palo.rotation.z = lt > 1.05 ? 0 : -cierra * -1; palo.rotation.z = lt < 1.05 ? .7 * ss(clamp(lt / .9, 0, 1)) * (lt > .9 ? 1 - (lt - .9) / .15 : 1) : 0;
          mira(c, [0, 20, 112], [0, 14, 20], .08); },
        // la grúa sube la cámara de cine por la fachada mientras la nuestra la sigue
        grua(lt, dur, t) { const k = ss(clamp(lt / dur, 0, 1)); grua(-.15 + .75 * k); mira(c, [lerp(30, 12, k), lerp(10, 40, k), lerp(96, 84, k)], [lerp(-6, -4, k), lerp(8, 24, k), -10], .08); },
        // un padre y sus dos hijos cruzan delante de la casa; los niños corren delante
        familia(lt, dur, t) { grua(.6); const k = clamp(lt / dur, 0, 1); Pp.ini(); equipo(t); const x = lerp(-20, 14, k);
          persona(Pp, x, 0, 6, P.dgreen, { s: 1.6, pelo: P.tan }); persona(Pp, x + 7 + Math.sin(t * 6) * .5, Math.abs(Math.sin(t * 7)) * .8, 8, P.red, { s: .9, pelo: P.amber }); persona(Pp, x + 11, Math.abs(Math.sin(t * 7 + 1)) * .8, 5, P.blue, { s: .8 }); Pp.fin();
          mira(c, [lerp(-6, 6, k), 12, 66], [lerp(-6, 6, k), 7, 0], .08); },
        // el calendario de rodaje: las hojas pasan y la fecha de estreno sigue en interrogación
        calendario(lt, dur, t) { grua(.6); const M = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']; const i = Math.floor(lt * 6);
          rotular(tablero, lt < dur * .55 ? ['ESTRENO', M[i % 12], '¿?'] : ['ESTRENO', '¿ ? ?', ''], ['#feae34', '#ffffff', '#e43b44'], '#181425', 22, { borde: '#feae34' }); tablero.m.position.set(-24, 14, 18);
          mira(c, [-4, 17, 66], [-22, 13, 18], .06); },
      } };
  },
  // —— Solo en casa 3: Winnetka desde el aire, nevado, junto al lago Míchigan y con Chicago al fondo ——
  winnetka: () => {
    const s = new THREE.Scene(); s.background = cielo([P.navy, P.blue, P.cyan, 0xd8f6ff]); s.fog = new THREE.Fog(0xcfe6ff, 160, 420);
    luces(s, { cielo: 0xe8f4ff, suelo: 0xc0cbdc, amb: 1.4, sol: 0xfff1d6, int: 1.8, dir: [-40, 70, 50], sombra: 120 });
    const lago = new THREE.Mesh(new THREE.PlaneGeometry(900, 700), new THREE.MeshLambertMaterial({ color: 0x7fb8e0 })); lago.rotation.x = -Math.PI / 2; lago.position.set(0, -1.4, -300); s.add(lago);
    const v = new Vox(); v.box(-120, -3, -70, 120, 0, 120, (x, y, z) => ((x + 200) % 24 < 3 || (z + 200) % 24 < 3) ? P.steel : (hsh(x, 2, z) > .15 ? P.white : P.silver));
    for (let x = -120; x < 120; x++) for (let k = 0; k < 3; k++) if (hsh(x, 5, k) > .4) v.set(x, -1, -71 - k, P.sand);
    for (let i = 0; i < 70; i++) { const gx = -108 + (i % 10) * 24, gz = -56 + Math.floor(i / 10) * 24; if (Math.abs(gx - 4) < 10 && Math.abs(gz - 16) < 10) continue; const x = gx + 6, z = gz + 6, c1 = [P.sand, P.silver, P.crimson, P.navy, P.tan][i % 5];
      v.box(x, 0, z, x + 10, 6, z + 8, c1); for (let k = 0; k < 3; k++) v.box(x - 1, 6 + k, z - 1 + k, x + 11, 7 + k, z + 9 - k, k === 2 ? P.white : P.slate); if (hsh(i, 3, 3) > .4) abeto(v, x - 4, z + 10, 9); }
    for (let i = 0; i < 16; i++) { const x = -150 + i * 12 + (hsh(i, 1, 9) * 6 | 0), h = 30 + (hsh(i, 2, 9) * 70 | 0); v.box(x, 0, -330, x + 9, h, -322, (X, Y) => (Y % 4 === 1 && X % 3) ? P.silver : P.slate); }
    s.add(v.build());
    const casa = actor('casa_ladrillo', .55); casa.position.set(10, 6.4, 22); s.add(casa);
    const pin = new THREE.Group(); const pv = new Vox(); pv.ball(0, 8, 0, 3, P.red); pv.cyl(0, 0, 0, 5, 1, P.red); pv.set(0, 9, 3, P.white); pin.add(pv.build({ centrar: false })); s.add(pin);
    const Sn = new Bloques(400, true); s.add(Sn.im);
    const c = cam(46);
    return { s, c, upd(t) { Sn.ini(); llueve(Sn, -60, 60, -40, 80, 0, 60, t, 300, P.white, 4, { copo: true }); Sn.fin(); pin.position.set(10, 17 + Math.sin(t * 3) * 1.2, 22); pin.rotation.y = t;
        mira(c, [Math.sin(t * .08) * 10, 60, 120], [6, 4, 0], .06); },
      acc: {
        // vuelo desde el lago y los rascacielos de Chicago hasta la casa marcada con el alfiler rojo
        vuelo_lago(lt, dur, t) { const k = ss(clamp(lt / Math.min(dur, 4.5), 0, 1)); mira(c, [lerp(-30, 4, k), lerp(70, 42, k), lerp(-40, 92, k)], [lerp(-20, 10, k), lerp(30, 8, k), lerp(-320, 18, k)], .05); },
      } };
  },
});

Object.assign(FABE, {
  // —— F1 1: la recta del Strip de noche, con muros, vallas y torres iluminadas; vuelta rápida, crono y parrilla ——
  strip: () => {
    const s = new THREE.Scene(); s.background = cielo([P.ink, P.night, P.plum, P.rose]); s.fog = new THREE.Fog(0x3a2a4a, 120, 330);
    luces(s, { cielo: 0x9a8ac8, suelo: 0x5a5a80, amb: 1.4, sol: 0xc8d0ff, int: 1.2, dir: [30, 70, 40], sombra: 120 });
    const v = new Vox(); v.box(-60, -1, -260, 60, 0, 80, (x, y, z) => Math.abs(x) < 11 ? (Math.abs(x) === 10 ? P.white : (z === 0 || z === 1) ? ((x + z) % 2 ? P.white : P.ink) : P.night) : P.dslate);
    for (let z = -260; z < 80; z += 2) for (const x of [-11, 11]) v.set(x, -1, z, (z >> 1) % 2 ? P.red : P.white);
    for (const x of [-14, 13]) { v.box(x, 0, -260, x + 1, 2, 80, P.silver); v.box(x, 2, -260, x + 1, 6, 80, (X, Y, Z) => (Z % 3 === 0 || Y === 5) ? P.steel : P.navy); }
    for (let i = 0; i < 22; i++) { const lado = i % 2 ? 1 : -1, z = -250 + (i >> 1) * 30, x0 = lado > 0 ? 22 : -42, w = 20, h = 30 + (hsh(i, 2, 2) * 60 | 0), col = [P.rose, P.cyan, P.amber, P.yellow, P.pink][i % 5];
      v.box(x0, 0, z, x0 + w, h, z + 20, P.night); for (let y = 3; y < h - 2; y += 3) for (let zz = z + 1; zz < z + 19; zz += 2) if (hsh(i, y, zz) > .35) v.set(lado > 0 ? x0 - 1 : x0 + w, y, zz, hsh(i, y, zz + 1) > .5 ? col : P.amber);
      v.box(x0, h, z, x0 + w, h + 2, z + 20, col); }
    v.luz(P.rose, P.cyan, P.amber, P.yellow, P.pink); s.add(v.build());
    const coches = [[P.silver, P.cyan], [P.navy, P.red], [P.silver, P.teal], [P.orange, P.ink], [P.red, P.yellow], [P.green, P.white]].map(([a, b]) => { const m = f1(a, b); m.scale.setScalar(.36); s.add(m); return m; });
    const torre = pantalla(12, 18, 96, 144); torre.m.position.set(-19, 18, -4); torre.m.rotation.y = .7; s.add(torre.m); const pie = new Vox(); pie.box(-20, 0, -5, -18, 9, -3, P.slate); s.add(pie.build());
    const tags = [0, 1, 2].map(() => { const p = pantalla(5, 2.5, 60, 30); s.add(p.m); return p; });
    const B = new Bloques(200, true); s.add(B.im);
    const parrilla = i => [i % 2 ? 4 : -4, -10 - i * 9];
    const coloca = (m, x, z, yaw = -Math.PI / 2) => { m.visible = true; m.position.set(x, .4, z); m.rotation.set(0, yaw, 0); };
    const tabla = filas => rotular(torre, filas, ['#fee761', '#ffffff', '#ffffff', '#c0cbdc'], '#181425', 20, { borde: '#e43b44' });
    const c = cam(46);
    return { s, c, upd(t) { coches.forEach(m => m.visible = false); tags.forEach(p => p.m.visible = false); B.ini(); B.fin(); tabla(['LAS VEGAS', 'CLASIF.']); mira(c, [5, 7, 50], [0, 6, -40], .04); },
      acc: {
        // un coche plateado viene a toda velocidad por la recta y pasa junto a la cámara
        vuelta_rapida(lt, dur, t) { const z = -90 + lt * 55; coloca(coches[0], 0, z, Math.PI / 2 * -1 + Math.PI); coches[0].rotation.y = -Math.PI / 2;
          coches[0].rotation.y = Math.PI / 2 * -1; coches[0].position.y = .4 + Math.sin(t * 40) * .05; B.ini(); for (let i = 0; i < 30; i++) B.pon((hsh(i, 1, 1) - .5) * 20, 1 + hsh(i, 2, 1) * 8, z - 6 - ((t * 120 + i * 7) % 40), .2, .2, 5, P.white); B.fin();
          const sh = z > 20 ? Math.sin(t * 50) * .3 : 0; mira(c, [5 + sh, 5, 48], [lerp(0, 0, 0), 4, Math.min(z, 30) - 30], .02); },
        // cruza la meta y el panel de tiempos pone a Antonelli el primero
        cronometro(lt, dur, t) { const z = -60 + lt * 70; coloca(coches[0], 0, Math.min(z, 70)); coches[0].rotation.y = -Math.PI / 2;
          tabla(lt < 1 ? ['LAS VEGAS', 'CLASIF.'] : ['1 ANT', '2 VER', '3 RUS', 'TOP 3']); mira(c, [6, 15, 46], [-14, 14, -6], .04); },
        // la parrilla: el plateado (el más rápido) se va del primer puesto al sexto y todos los demás suben uno
        parrilla(lt, dur, t) { const k = ss(clamp((lt - .6) / 2.2, 0, 1)); coloca(coches[0], lerp(-4, 6, Math.sin(k * Math.PI) * 1.4 > 1 ? 1 : 0) * 0 + lerp(parrilla(0)[0], parrilla(5)[0], k), lerp(parrilla(0)[1], parrilla(5)[1], k));
          for (let i = 1; i < 6; i++) { const [x0, z0] = parrilla(i), [x1, z1] = parrilla(i - 1); coloca(coches[i], lerp(x0, x1, k), lerp(z0, z1, k)); }
          [[coches[1], 'VER', '#124e89'], [coches[2], 'RUS', '#3a4466'], [coches[0], 'ANT', '#e43b44']].forEach(([m, txt, bg], i) => { const p = tags[i]; p.m.visible = true; p.m.position.set(m.position.x, 6, m.position.z); p.m.lookAt(c.position); rotular(p, [txt], '#ffffff', bg, 20); });
          mira(c, [8, 42, 34], [0, 0, -28], .03); },
        // primer plano del plateado, ahora sexto, con una luz roja que parpadea encima
        retroceso(lt, dur, t) { coloca(coches[0], parrilla(5)[0], parrilla(5)[1]); for (let i = 1; i < 6; i++) { const [x, z] = parrilla(i - 1); coloca(coches[i], x, z); }
          const p = tags[0]; p.m.visible = true; p.m.position.set(parrilla(5)[0], 6 + Math.sin(t * 4) * .3, parrilla(5)[1]); p.m.lookAt(c.position); rotular(p, [Math.floor(t * 4) % 2 ? '?' : '¿?'], '#ffffff', Math.floor(t * 4) % 2 ? '#e43b44' : '#a22633', 22);
          mira(c, [parrilla(5)[0] + 14, 10, parrilla(5)[1] + 24], [parrilla(5)[0], 3, parrilla(5)[1]], .05); },
      } };
  },
  // —— F1 2: el garaje del equipo; los motores de la temporada en un banco… y llega el sexto ——
  garaje: () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(P.ink); s.fog = new THREE.Fog(P.ink, 80, 160);
    luces(s, { cielo: 0xdfe8ff, suelo: 0x3a4466, amb: 1.4, sol: 0xffffff, int: 1.6, dir: [10, 60, 60], sombra: 60 });
    const v = new Vox(); v.box(-50, -1, -40, 50, 0, 60, (x, y, z) => (x % 8 === 0 || z % 8 === 0) ? P.slate : P.steel); v.box(-50, 0, -42, 50, 40, -40, (x, y) => y > 30 ? P.dslate : (x % 10 === 0 ? P.slate : P.night));
    for (const x of [-50, 49]) v.box(x, 0, -40, x + 1, 40, 60, P.night); for (let x = -40; x < 40; x += 10) v.box(x, 38, -40, x + 6, 39, 40, P.white);
    v.box(-36, 0, 0, 36, 7, 6, P.dslate); v.box(-37, 7, -1, 37, 8, 7, P.silver); for (let x = -34; x < 34; x += 4) v.box(x, 2, 6, x + 3, 6, 7, P.slate);   // banco de trabajo
    for (let x = -44; x < -30; x += 3) v.box(x, 10, -40, x + 2, 30, -39, [P.red, P.amber, P.blue, P.lime, P.orange][(x + 44) / 3 | 0]);   // herramientas en la pared
    v.luz(P.white); s.add(v.build());
    const coche = f1(P.silver, P.cyan); coche.scale.setScalar(.6); coche.position.set(4, 3, -24); coche.rotation.y = -.25; s.add(coche); const gato = new Vox(); gato.box(-6, 0, -26, 14, 3, -22, P.red); s.add(gato.build());
    const motores = Array.from({ length: 6 }, (_, i) => { const m = actor('motor', .5); s.add(m); return m; });
    const etis = Array.from({ length: 6 }, () => { const p = pantalla(4, 3, 40, 30); s.add(p.m); return p; });
    const sirena = bola(P.red, 1.6); sirena.position.set(34, 20, -36); s.add(sirena); const carro = new Vox(); carro.box(-6, 0, -4, 6, 1, 4, P.dslate); for (const x of [-5, 4]) for (const z of [-4, 3]) carro.box(x, -2, z, x + 1, 0, z + 1, P.ink); const gc = carro.build(); s.add(gc);
    const X = i => -20 + i * 8;
    const pon = (i, x, y, z, rojo, sc = 1) => { const m = motores[i]; m.visible = true; m.position.set(x, y, z); m.scale.setScalar(.5 * sc); m.rotation.y = .4;
      const p = etis[i]; p.m.visible = sc > .5; p.m.position.set(x, 1.5, 7.2); rotular(p, [String(i + 1)], '#ffffff', rojo ? '#e43b44' : '#3e8948', 22); };
    const c = cam(46);
    return { s, c, upd(t) { motores.forEach(m => m.visible = false); etis.forEach(p => p.m.visible = false); sirena.visible = false; gc.visible = false; mira(c, [Math.sin(t * .1) * 6, 32, 100], [0, 8, -4], .08); },
      acc: {
        // los motores de la temporada aparecen uno a uno sobre el banco
        motores(lt, dur, t) { for (let i = 0; i < 5; i++) { const p = clamp((lt - .3 - i * (dur * .14)) / .35, 0, 1); if (p > 0) pon(i, X(i), 11 + (1 - ss(p)) * 8, 3, false, ss(p)); }
          const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-8, 4, k), 30, 96], [0, 9, 0], .08); },
        // llega el sexto en un carro: la etiqueta se pone roja y la sirena gira
        sexto(lt, dur, t) { for (let i = 0; i < 5; i++) pon(i, X(i), 11, 3, false); const k = ss(clamp(lt / (dur * .45), 0, 1)), x = lerp(60, X(5), k);
          gc.visible = true; gc.position.set(x, 2, 18); pon(5, x, 6.6, 18, k > .95); if (k > .95) { sirena.visible = Math.floor(t * 6) % 2 === 0; } mira(c, [10, 30, 100], [6, 8, 4], .08); },
      } };
  },
  // —— F1 3: los casinos de noche desde el aire, con la estela de luz de los coches por la avenida ——
  casinos: () => {
    const s = new THREE.Scene(); s.background = cielo([P.ink, P.night, P.plum]); s.fog = new THREE.Fog(0x262b44, 140, 380);
    luces(s, { cielo: 0x8a7ab8, suelo: 0x3a4466, amb: 1.1, sol: 0xb8c0ff, int: .9, dir: [30, 70, 40], sombra: 150 });
    const v = new Vox(); v.box(-90, -1, -340, 90, 0, 100, (x, y, z) => Math.abs(x) < 9 ? (Math.abs(x) > 7 ? P.white : P.ink) : P.night);
    for (let i = 0; i < 30; i++) { const lado = i % 2 ? 1 : -1, z = -330 + (i >> 1) * 28, w = 16 + (hsh(i, 1, 4) * 8 | 0), x0 = lado > 0 ? 14 : -14 - w, h = 24 + (hsh(i, 2, 4) * 80 | 0), col = [P.rose, P.cyan, P.amber, P.yellow, P.pink, P.lime][i % 6];
      for (let y = 0; y < h; y++) { const r = y > h * .7 ? 1 : 0; v.box(x0 + r, y, z + r, x0 + w - r, y + 1, z + 18 - r, (X, Y, Z) => ((Y % 3 === 1) && hsh(X, Y, Z) > .45) ? col : (hsh(X, Y, Z + 3) > .93 ? P.amber : P.night)); }
      v.box(x0, h, z, x0 + w, h + 1, z + 18, col); }
    v.luz(P.rose, P.cyan, P.amber, P.yellow, P.pink, P.lime); s.add(v.build());
    const letreros = [[12, -40], [-12, -110], [12, -180], [-12, -250]].map(([x, z]) => { const m = actor('letrero', .7); m.position.set(x, 10, z); m.rotation.y = x > 0 ? -.5 : .5; s.add(m); return m; });
    const B = new Bloques(260, true); s.add(B.im);
    const estela = t => { B.ini(); for (let k = 0; k < 3; k++) { const cab = 100 - ((t * 140 + k * 140) % 440); for (let i = 0; i < 60; i++) B.pon(k - 1, .6, cab + i * 1.2, .7, .5, 1.3, i < 3 ? P.white : (i < 25 ? P.red : P.crimson)); } B.fin(); };
    const c = cam(46);
    return { s, c, upd(t) { estela(t); letreros.forEach((m, i) => m.visible = true); mira(c, [Math.sin(t * .1) * 10, 80, 120], [0, 10, -60], .06); },
      acc: {
        // la cámara vuela por encima de la avenida; los letreros parpadean y pasan las estelas de los coches
        neones(lt, dur, t) { estela(t); letreros.forEach((m, i) => m.visible = Math.floor(t * 3 + i) % 4 !== 0); const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-10, 6, k), lerp(90, 46, k), lerp(140, 30, k)], [0, 10, lerp(-60, -120, k)], .06); },
      } };
  },
});

// ———————————————————— 22/11/2026: la luz de noche, las medallas y el penalti de once metros ————————————————————
const colLerp = (a, b, k) => new THREE.Color(a).lerp(new THREE.Color(b), clamp(k, 0, 1));
const PERFIL = [5, 4, 4, 3, 3, 4, 6, 8, 7, 5, 3, 2, 2, 2, 2, 3, 5, 7, 8, 9, 10, 9, 8, 6];   // precio relativo por horas: valle al mediodía, pico de 20 a 21 h
// gráfica de 24 barras en una pantalla; `hasta` = barras ya dibujadas, `sel` = hora resaltada
function grafica(P2, hasta, sel, titulo, parpadeo = false) { const k = `${hasta | 0}|${sel}|${titulo}|${parpadeo}`; if (P2._k === k) return; P2._k = k; const { g, cv, tex } = P2, W2 = cv.width, H2 = cv.height;
  g.fillStyle = '#181425'; g.fillRect(0, 0, W2, H2); g.strokeStyle = '#feae34'; g.lineWidth = 3; g.strokeRect(2, 2, W2 - 4, H2 - 4);
  g.font = 'bold 16px monospace'; g.textAlign = 'center'; g.fillStyle = '#ffffff'; g.fillText(titulo, W2 / 2, 18);
  const bw = (W2 - 16) / 24; for (let h = 0; h < Math.min(24, hasta); h++) { const v = PERFIL[h] / 10, bh = v * (H2 - 44);
    g.fillStyle = h === sel ? (parpadeo ? '#ffffff' : '#e43b44') : (v > .75 ? '#f77622' : v > .45 ? '#feae34' : '#63c74d'); g.fillRect(8 + h * bw + 1, H2 - 14 - bh, bw - 2, bh); }
  g.fillStyle = '#c0cbdc'; g.font = 'bold 11px monospace'; ['0', '12', '20', '24'].forEach((s, i) => g.fillText(s, 8 + [0, 12, 20.5, 23.6][i] * bw, H2 - 3)); tex.needsUpdate = true; }
// bloque de pisos español: fachada clara con balcones y tejado de teja
function pisos(v, x0, z0, w, h, col, fondo = 8) { v.box(x0, 0, z0, x0 + w, h, z0 + fondo, (x, y) => (y % 4 === 0) ? P.silver : col);
  for (let y = 4; y < h - 1; y += 4) for (let x = x0 + 1; x < x0 + w - 1; x += 3) { v.box(x, y - 3, z0 + fondo, x + 2, y - 1, z0 + fondo + 1, P.dslate); if ((x + y) % 2) v.box(x, y - 4, z0 + fondo, x + 2, y - 3, z0 + fondo + 2, P.steel); }
  for (let k = 0; k < 3; k++) v.box(x0 - 1 + k, h + k, z0 - 1 + k, x0 + w + 1 - k, h + k + 1, z0 + fondo + 1 - k, k % 2 ? P.crimson : P.brown); }
// ventanas de una fachada como bloques que se encienden (frac 0..1)
function ventanas(L, edificios, frac, t, colOn = P.amber) { L.ini(); edificios.forEach(([x0, z0, w, h, fondo], e) => { for (let y = 4; y < h - 1; y += 4) for (let x = x0 + 1; x < x0 + w - 1; x += 3) { const r = hsh(x, y, e);
  if (r < frac) L.pon(x + 1, y - 2, z0 + fondo + 1.12, 2, 2, .2, r > .85 ? P.yellow : (r > frac - .05 && Math.floor(t * 8) % 2 ? P.white : colOn)); } }); L.fin(); }
// trazo de energía: cubos que viajan por una polilínea (ruta de puntos), n cubos, velocidad v
function flujo(B, ruta, n, t, v, col, sz = 1.1) { const seg = []; let L = 0; for (let i = 1; i < ruta.length; i++) { const d = Math.hypot(...ruta[i].map((c, j) => c - ruta[i - 1][j])); seg.push(d); L += d; }
  for (let k = 0; k < n; k++) { let s = ((t * v + k * L / n) % L), i = 0; while (i < seg.length - 1 && s > seg[i]) { s -= seg[i]; i++; } const a = ruta[i], b = ruta[i + 1], u = s / seg[i];
    B.pon(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u), sz, sz, sz, col); } }
// pitch de fútbol: césped a franjas y líneas (1 m = 2 unidades; portería en z = zg mirando a +z)
function cesped(v, x0, x1, z0, z1, zg, o = {}) { v.box(x0, -1, z0, x1, 0, z1, (x, y, z) => { const ax = Math.abs(x), dz = z - zg;
  if (o.lineas !== false && ((ax === 40 && dz >= 0 && dz <= 33) || (dz === 33 && ax <= 40) || (ax === 18 && dz >= 0 && dz <= 11) || (dz === 11 && ax <= 18) || (dz === 0))) return P.white;
  if (o.punto && ax <= 0 && dz === 22) return P.white; return ((z - zg) >> 3) % 2 ? P.green : 0x4a9a52; }); }

Object.assign(FAB, {
  // —— la luz de noche ——
  placa: () => {   // placa solar: celdas azules con rejilla plateada, sobre un poste
    const v = new Vox(); v.box(-8, 0, -5, 8, 1, 5, (x, y, z) => (x % 4 === 0 || z % 3 === 0) ? P.silver : ((x + z) % 2 ? P.navy : P.blue)); v.box(-8, -1, -5, 8, 0, 5, P.slate);
    const g = v.build({ jit: .03 }); g.rotation.x = .5; const w = new THREE.Group(); w.add(g); const p = new Vox(); p.box(0, -8, 0, 1, -1, 1, P.steel); w.add(p.build()); return centra(w); },
  molino: () => {   // aerogenerador: torre blanca, góndola y tres aspas ('aspas') que giran
    const v = new Vox(); for (let y = 0; y < 44; y++) v.cyl(0, 0, y, y + 1, 1.6 - y * .015, y < 2 ? P.steel : P.white); v.box(-2, 44, -3, 3, 47, 4, P.white); v.box(-1, 45, 4, 2, 46, 5, P.silver);
    const w = new THREE.Group(); w.add(v.build({ jit: .02 }));
    const a = new Vox(); for (let k = 0; k < 3; k++) { const an = k * Math.PI * 2 / 3; for (let r = 1; r < 20; r++) { const x = Math.round(Math.cos(an) * r), y = Math.round(Math.sin(an) * r); a.set(x, y, 0, r > 16 ? P.red : P.white); if (r < 12) a.set(x + Math.round(-Math.sin(an)), y + Math.round(Math.cos(an)), 0, P.white); } }
    a.set(0, 0, 0, P.silver); a.set(0, 0, 1, P.silver); const ga = a.build({ jit: 0 }); const piv = new THREE.Group(); piv.position.set(.5, 45.5, 5.5); ga.position.set(-.5, -.5, -.5); piv.add(ga); piv.name = 'aspas'; w.add(piv); return w; },
  central: () => {   // central de ciclo combinado: nave gris, dos chimeneas a franjas y la turbina naranja
    const v = new Vox(); v.box(-14, 0, -8, 14, 12, 8, (x, y) => y % 4 === 0 ? P.silver : P.steel); for (let x = -12; x < 12; x += 4) v.box(x, 4, 8, x + 2, 9, 9, P.dslate);
    for (let k = 0; k < 5; k++) v.box(-15 + k, 12 + k, -9, 15 - k, 13 + k, 9, k % 2 ? P.slate : P.dslate);
    for (const x of [-8, 6]) v.cyl(x, -2, 12, 38, 2.4, (X, y) => ((y >> 2) % 2) ? P.red : P.white); v.box(15, 0, -4, 24, 8, 4, P.slate); v.cyl(19, 0, 8, 10, 3, P.orange); v.luz(P.orange);
    const w = new THREE.Group(); w.add(v.build({ centrar: false })); return w; },
  // —— las medallas ——
  medalla: () => {   // medalla: cinta roja con franja dorada, disco de oro y estrella en relieve
    const v = new Vox(); v.box(-3, 8, 0, 4, 18, 1, (x) => Math.abs(x) < 1 ? P.yellow : P.crimson); v.box(-4, 7, -1, 5, 8, 2, P.amber);
    for (let x = -6; x <= 6; x++) for (let y = -6; y <= 6; y++) if (x * x + y * y <= 40) { v.set(x, y, 0, x * x + y * y > 28 ? P.amber : P.yellow); v.set(x, y, -1, P.amber); }
    for (const [x, y] of [[0, 4], [0, 3], [-1, 2], [0, 2], [1, 2], [-3, 1], [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1], [3, 1], [-1, 0], [0, 0], [1, 0], [-2, -1], [2, -1], [-2, -2], [2, -2]]) v.set(x, y, 1, P.orange);
    v.luz(P.yellow); const w = new THREE.Group(); w.add(v.build({ centrar: true, jit: .03 })); return w; },
  sello: () => {   // sello de caucho: pomo de madera, mango y base con la goma roja
    const v = new Vox(); v.ball(0, 16, 0, 3, P.brown); v.cyl(0, 0, 5, 14, 1.4, P.dbrown); v.box(-6, 2, -4, 7, 5, 5, P.brown); v.box(-6, 0, -4, 7, 2, 5, P.red);
    const w = new THREE.Group(); w.add(v.build({ centrar: false })); return w; },
  carpeta: () => {   // carpeta de expediente: cartón beige con pestaña, papeles y goma
    const v = new Vox(); v.box(-8, 0, -6, 8, 1, 6, P.tan); v.box(-7, 1, -5, 7, 2, 5, P.white); v.box(-8, 2, -6, 8, 3, 6, P.sand); v.box(-3, 2, 6, 3, 3, 7, P.sand); v.box(-8, 3, -1, 8, 3.5, 0, P.red);
    const w = new THREE.Group(); w.add(v.build({ centrar: true, jit: .02 })); return w; },
  // —— el penalti ——
  porteria: () => {   // portería: postes blancos y red de malla gris (7,32 × 2,44 m a escala 2:1)
    const v = new Vox(); for (const x of [-8, 7]) v.box(x, 0, 0, x + 1, 5, 1, P.white); v.box(-8, 5, 0, 8, 6, 1, P.white);
    for (let x = -7; x < 7; x++) for (let y = 0; y < 5; y++) for (let z = -5; z < 0; z++) { const lado = x === -7 || x === 6, fondo = z === -5, techo = y === 4; if ((lado || fondo || techo) && (x + y + z) % 2 === 0) v.set(x, y, z, P.silver); }
    const w = new THREE.Group(); w.add(v.build({ centrar: false, jit: .02 })); return w; },
  balon: () => { const v = new Vox(); v.ball(0, 0, 0, 3, (x, y, z) => ((x + 4) % 3 === 0 && (y + 4) % 3 === 0) || (Math.abs(x) + Math.abs(y) + Math.abs(z)) === 4 && (x + z) % 2 === 0 ? P.ink : P.white);
    const w = new THREE.Group(); w.add(v.build({ centrar: true, jit: .02 })); return w; },
  balon_cuero: () => { const v = new Vox(); v.ball(0, 0, 0, 3, (x, y, z) => (y === 0 || x === 0) ? P.dbrown : (hsh(x, y, z) > .5 ? P.brown : 0xa0603f)); v.set(0, 3, 3, P.sand); v.set(0, 2, 3, P.sand);
    const w = new THREE.Group(); w.add(v.build({ centrar: true, jit: .02 })); return w; },
});

Object.assign(FABE, {
  // —— luz 1: una ciudad española al anochecer; se encienden las ventanas y el panel de precios marca la hora punta ——
  anochecer: () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(P.rose); s.fog = new THREE.Fog(0x3a2a4a, 140, 330);
    const sol = luces(s, { cielo: 0xffd8b0, suelo: 0x3a4466, amb: 1.3, sol: 0xffb070, int: 1.4, dir: [60, 40, -20], sombra: 90 });
    const v = new Vox(); v.box(-110, -1, -120, 110, 0, 80, (x, y, z) => (z > 0 && z < 12) ? (z === 6 && x % 6 < 3 ? P.white : P.dslate) : ((x % 30 === 0) ? P.dslate : P.steel));
    const edif = []; const fila = (z0, alto, sem) => { let x = -78; let i = 0; while (x < 70) { const w = 10 + (hsh(i, sem, 1) * 6 | 0), h = alto + (hsh(i, sem, 2) * 14 | 0); edif.push([x, z0, w, h, 8]); pisos(v, x, z0, w, h, [P.sand, P.tan, 0xf2e6c8, P.pink, P.silver][(i + sem) % 5]); x += w + 2; i++; } };
    fila(-10, 16, 1); fila(-34, 26, 2); fila(-60, 34, 3);
    for (let x = -70; x < 70; x += 16) { v.box(x, 0, 13, x + 1, 9, 14, P.ink); v.box(x - 1, 9, 12, x + 2, 10, 15, P.dslate); }   // farolas
    const pv = new Vox(); pv.box(17, 0, -5, 19, 36, -3, P.slate); pv.box(15, 36, -5, 21, 37, -3, P.dslate); s.add(pv.build());   // poste del panel de precios
    s.add(v.build());
    const L = new Bloques(1600, true), F = new Bloques(20, true), Pp = new Bloques(40); s.add(L.im, F.im, Pp.im);
    const sun = bola(P.orange, 7); s.add(sun); const panel = pantalla(22, 15, 240, 164); panel.m.position.set(18, 44, -3.4); s.add(panel.m);
    const cieloK = k => { s.background = k < .5 ? colLerp(0xf6a070, P.rose, k * 2) : colLerp(P.rose, P.night, (k - .5) * 2); s.fog.color.copy(s.background); sol.intensity = 1.4 * (1 - k * .7);
      sun.position.set(40, lerp(34, -12, k), -200); };
    const farolas = on => { F.ini(); if (on) for (let x = -70; x < 70; x += 16) F.pon(x + .5, 9.3, 13.5, 2.4, .8, 2.4, P.yellow); F.fin(); };
    const gente = t => { Pp.ini(); for (let i = 0; i < 5; i++) { const d = i % 2 ? 1 : -1, x = d * (((t * 5 + i * 31) % 140) - 70); persona(Pp, x, 0, 3 + i * 1.6, [P.navy, P.red, P.teal, P.plum, P.amber][i], { s: 1.1 }); } Pp.fin(); };
    const c = cam(46);
    return { s, c, upd(t) { cieloK(.55); ventanas(L, edif, .25, t); farolas(true); gente(t); panel.m.visible = false; mira(c, [Math.sin(t * .08) * 4, 34, 128], [0, 16, -20], .1); },
      acc: {
        // el sol se pone tras los bloques, el cielo pasa de naranja a noche y se van encendiendo las ventanas
        anochecer(lt, dur, t) { const k = ss(clamp(lt / (dur * 1.15), 0, 1)); cieloK(k * .9); ventanas(L, edif, .05 + .55 * k, t); farolas(k > .45); mira(c, [lerp(-6, 2, k), lerp(30, 36, k), lerp(140, 122, k)], [0, 16, -20], .12); },
        // el panel de precios dibuja las 24 horas y la barra de 20 a 21 h se pone roja
        reloj(lt, dur, t) { cieloK(.9); ventanas(L, edif, .6, t); farolas(true); panel.m.visible = true; const k = clamp(lt / (dur * .6), 0, 1);
          grafica(panel, 2 + k * 22, k > .9 ? 20 : -1, 'PRECIO DE HOY', Math.floor(t * 4) % 2 === 0); const kc = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(10, 16, kc), 42, lerp(70, 52, kc)], [18, 42, -3], .1); },
        // primer plano de una fachada: las ventanas se encienden por plantas, de abajo arriba
        encender(lt, dur, t) { cieloK(.95); const k = clamp(lt / (dur * .8), 0, 1); L.ini(); edif.forEach(([x0, z0, w, h, fo], e) => { for (let y = 4; y < h - 1; y += 4) for (let x = x0 + 1; x < x0 + w - 1; x += 3) { const on = (y / 36) < k * 1.2 - hsh(x, 3, e) * .2 || hsh(x, y, e) < .2;
            if (on) L.pon(x + 1, y - 2, z0 + fo + 1.12, 2, 2, .2, hsh(x, y, e) > .7 ? P.yellow : P.amber); } }); L.fin(); farolas(true); gente(t);
          const kc = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-2, 4, kc), lerp(12, 18, kc), lerp(62, 54, kc)], [2, 13, -6], .1); },
      } };
  },
  // —— luz 2: la red eléctrica: el campo de placas, la central de gas y la ciudad al fondo, unidos por torres ——
  parque_solar: () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(0x7fc8ff); s.fog = new THREE.Fog(0xbfe8ff, 160, 360);
    const sol = luces(s, { cielo: 0xe8f4ff, suelo: 0x3e8948, amb: 1.4, sol: 0xfff1d6, int: 1.9, dir: [-30, 80, 40], sombra: 110 });
    const v = new Vox(); v.box(-110, -1, -130, 110, 0, 70, (x, y, z) => (x < -4 && x > -56 && z > -18 && z < 40) ? P.sand : (hsh(x >> 2, 1, z >> 2) > .7 ? P.dgreen : P.green));
    const edif = []; let x = -40, i = 0; while (x < 40) { const w = 10 + (hsh(i, 9, 1) * 5 | 0), h = 18 + (hsh(i, 9, 2) * 22 | 0); edif.push([x, -100, w, h, 8]); pisos(v, x, -100, w, h, [P.sand, P.tan, P.silver, P.pink][i % 4]); x += w + 2; i++; }
    const torre = (tx, tz) => { for (let y = 0; y < 22; y++) { const r = Math.max(1, 3 - y * .1) | 0; v.set(tx - r, y, tz, P.steel); v.set(tx + r, y, tz, P.steel); if (y % 4 === 0) v.box(tx - r, y, tz, tx + r + 1, y + 1, tz + 1, P.silver); } v.box(tx - 5, 22, tz, tx + 6, 23, tz + 1, P.steel); };
    const T = [[-30, -24], [-18, -56], [-6, -84], [30, -32], [18, -62]]; T.forEach(([a, b]) => torre(a, b)); s.add(v.build());
    const placas = []; for (const pz of [-8, 4, 16, 28]) for (const px of [-46, -32, -18]) { const m = actor('placa', .72); m.position.set(px, 5, pz); s.add(m); placas.push(m); }
    const cen = actor('central', .85); cen.position.set(32, 0, -4); s.add(cen);
    const B = new Bloques(400, true), L = new Bloques(700, true), Hm = new Bloques(80); s.add(B.im, L.im, Hm.im);
    const sun = bola(P.yellow, 8); s.add(sun); const turb = new THREE.PointLight(0xf77622, 0, 50, 1.4); turb.position.set(48, 10, -4); s.add(turb);
    const cartel = pantalla(26, 11, 208, 88); cartel.m.position.set(-12, 40, -90); s.add(cartel.m);
    const rS = [[-30, 22, -24], [-18, 22, -56], [-6, 22, -84], [0, 16, -92]], rG = [[40, 12, -4], [30, 22, -32], [18, 22, -62], [-6, 22, -84], [0, 16, -92]];
    const cieloK = k => { s.background = k < .5 ? colLerp(0x7fc8ff, 0xf6a070, k * 2) : colLerp(0xf6a070, P.night, (k - .5) * 2); s.fog.color.copy(s.background); sol.intensity = 1.9 * (1 - k * .75);
      sun.position.set(lerp(-40, 80, k), lerp(110, -10, k), -220); sun.material.color.set(k > .3 ? P.orange : P.yellow); };
    const precio = (txt, col) => rotular(cartel, txt, '#ffffff', col, 30, { borde: '#ffffff' });
    const humo = (t, n) => { Hm.ini(); for (let k = 0; k < n; k++) for (const cx of [25.2, 37.1]) { const u = ((t * .4 + k / n) % 1); Hm.pon(cx + Math.sin(k * 3 + t) * u * 3, 33 + u * 24, -5.7, 2 + u * 4, 2 + u * 4, 2 + u * 4, u > .6 ? P.silver : P.steel); } Hm.fin(); };
    const c = cam(46);
    return { s, c, upd(t) { cieloK(0); B.ini(); B.fin(); ventanas(L, edif, 0, t); humo(t, 0); turb.intensity = 0; precio(['PRECIO', 'BAJO'], '#3e8948'); placas.forEach(m => m.rotation.y = 0); mira(c, [Math.sin(t * .08) * 6, 64, 100], [-4, 6, -30], .08); },
      acc: {
        // sol de mediodía: las placas brillan y una corriente de cubos amarillos viaja por las torres hasta la ciudad
        placas(lt, dur, t) { cieloK(.05); B.ini(); flujo(B, rS, 70, t, 40, P.yellow); B.fin(); placas.forEach((m, j) => m.rotation.y = Math.sin(t * .5 + j) * .05);
          const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-34, -14, k), lerp(52, 62, k), lerp(86, 104, k)], [lerp(-30, -10, k), 2, lerp(4, -36, k)], .08); },
        // el sol baja, el cielo se vuelve naranja y la corriente amarilla se va apagando
        puesta(lt, dur, t) { const k = ss(clamp(lt / dur, 0, 1)); cieloK(.1 + .8 * k); B.ini(); flujo(B, rS, Math.round(70 * (1 - k)), t, 40, P.yellow); B.fin(); ventanas(L, edif, .4 * k, t);
          mira(c, [lerp(-10, 4, k), lerp(60, 52, k), lerp(116, 104, k)], [-4, 14, -44], .08); },
        // de noche en la ciudad todas las ventanas se encienden y una columna roja de demanda crece a su lado
        demanda(lt, dur, t) { cieloK(.95); const k = ss(clamp(lt / (dur * .8), 0, 1)); ventanas(L, edif, .4 + .6 * k, t); B.ini(); for (let y = 0; y < 30 * k; y += 2) B.pon(14, y + 1, -86, 6, 1.6, 6, y > 20 ? P.red : y > 10 ? P.orange : P.amber); B.fin();
          precio(['DEMANDA', '+ + +'], '#a22633'); mira(c, [lerp(-4, 6, k), 34, lerp(-24, -36, k)], [4, 18, -96], .1); },
        // la central de gas arranca: humo en las chimeneas, la turbina brilla y llega una corriente naranja; el cartel se pone en rojo
        gas(lt, dur, t) { cieloK(.95); ventanas(L, edif, 1, t); humo(t, 10); turb.intensity = 80; B.ini(); flujo(B, rG, 60, t, 40, P.orange); B.fin();
          const k = ss(clamp(lt / dur, 0, 1)); precio(lt > dur * .55 ? ['PRECIO', 'ALTO'] : ['GAS', 'ON'], lt > dur * .55 ? '#e43b44' : '#f77622');
          mira(c, [lerp(86, 40, k), lerp(44, 56, k), lerp(96, 74, k)], [lerp(30, 6, k), lerp(26, 26, k), lerp(-4, -70, k)], .1); },
      } };
  },
  // —— luz 3: primavera, colinas con molinos girando deprisa y placas al sol; el cartel del precio baja de cero ——
  eolico: () => {
    const s = new THREE.Scene(); s.background = cielo([P.blue, 0x7fc8ff, 0xd8f6ff]); s.fog = new THREE.Fog(0xd8f6ff, 160, 380);
    luces(s, { cielo: 0xe8f4ff, suelo: 0x3e8948, amb: 1.5, sol: 0xfff1d6, int: 2.0, dir: [-40, 80, 50], sombra: 120 });
    const alt = (x, z) => Math.max(0, 8 + Math.sin(x * .05) * 7 + Math.cos(z * .06 + x * .02) * 6);
    const v = new Vox(); for (let x = -100; x < 100; x += 1) for (let z = -160; z < 60; z += 1) { const h = Math.round(alt(x, z)); for (let y = Math.max(0, h - 2); y <= h; y++) v.set(x, y, z, y < h ? P.dgreen : (hsh(x, z, 3) > .93 ? [P.yellow, P.pink, P.white, P.rose][(hsh(x, z, 4) * 4) | 0] : (hsh(x >> 2, 5, z >> 2) > .5 ? P.green : P.lime))); }
    s.add(v.build({ jit: .04 }));
    const mol = [[-36, -40], [-8, -70], [22, -46], [48, -90], [-60, -100], [6, -130]].map(([x, z]) => { const m = actor('molino', .8); m.position.set(x, alt(x, z), z); m.rotation.y = .2; s.add(m); return m; });
    const asp = mol.map(m => m.getObjectByName('aspas'));
    for (const [x, z] of [[-20, 10], [-6, 14], [8, 10], [22, 14]]) { const m = actor('placa', .6); m.position.set(x, alt(x, z) + 4, z); s.add(m); }
    const cartel = pantalla(20, 12, 160, 96); cartel.m.position.set(-2, 34, -20); s.add(cartel.m); const pp = new Vox(); pp.box(-3, Math.round(alt(-2, -20)), -21, -1, 28, -20, P.dbrown); s.add(pp.build());
    const B = new Bloques(200, true); s.add(B.im);
    const viento = (t, n) => { B.ini(); for (let i = 0; i < n; i++) { const z = -120 + hsh(i, 2, 5) * 150, y = 20 + hsh(i, 3, 5) * 30, x = -110 + ((t * 40 + hsh(i, 4, 5) * 220) % 220); B.pon(x, y, z, 8, .35, .35, P.white); } B.fin(); };
    const c = cam(46);
    return { s, c, upd(t) { asp.forEach((a, i) => a.rotation.z = t * 1.2 + i); viento(t, 30); rotular(cartel, ['PRECIO', '40 €'], '#ffffff', '#3e8948', 28, { borde: '#fee761' }); mira(c, [Math.sin(t * .08) * 6, 44, 96], [0, 22, -40], .08); },
      acc: {
        // los molinos giran cada vez más rápido con el viento y el cartel del precio baja hasta pasar de cero
        molinos(lt, dur, t) { const k = clamp(lt / (dur * .8), 0, 1); asp.forEach((a, i) => a.rotation.z = t * (1.5 + 5 * k) + i); viento(t, 120);
          const p = Math.round(lerp(40, -2, ss(k))); rotular(cartel, ['PRECIO', `${p} €`], '#ffffff', p > 0 ? '#3e8948' : '#124e89', 28, { borde: '#fee761' });
          const kc = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-30, 10, kc), lerp(50, 38, kc), lerp(110, 60, kc)], [lerp(-16, -2, kc), lerp(26, 30, kc), lerp(-50, -20, kc)], .08); },
      } };
  },
});

Object.assign(FABE, {
  // —— medallas 1: sala de honores con una vitrina de ocho medallas sobre cojines rojos ——
  vitrina: () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(P.umber); s.fog = new THREE.Fog(P.umber, 100, 200);
    luces(s, { cielo: 0xffe8c8, suelo: 0x733e39, amb: 1.4, sol: 0xfff1d6, int: 1.6, dir: [10, 60, 70], sombra: 60 });
    const v = new Vox(); v.box(-70, -1, -40, 70, 0, 60, (x, y, z) => ((x >> 3) + (z >> 3)) % 2 ? P.white : P.silver);
    v.box(-70, 0, -42, 70, 60, -40, (x, y) => y < 12 ? (x % 6 === 0 ? P.umber : P.dbrown) : (y === 12 ? P.amber : P.crimson));
    for (const x of [-46, -26, 24, 44]) { v.box(x, 0, -40, x + 4, 50, -36, (X, Y) => X === x + 1 ? P.silver : P.white); v.box(x - 1, 50, -41, x + 5, 52, -35, P.sand); }
    for (const x of [-60, 52]) for (let y = 14; y < 56; y++) v.box(x, y, -40, x + 8, y + 1, -39, (y % 6 < 3) ? P.crimson : 0x8a2a32);   // cortinajes
    v.box(-28, 0, -6, 28, 10, 6, (x, y) => y === 9 ? P.amber : P.dbrown); for (let i = 0; i < 8; i++) v.box(-24 + i * 6.5 | 0, 10, -2, (-24 + i * 6.5 | 0) + 5, 11, 2, P.crimson);
    v.box(-30, 0, 16, 30, 6, 24, P.dbrown); v.box(-31, 6, 15, 31, 7, 25, P.brown);   // mesa delante
    v.luz(P.amber); s.add(v.build());
    const vidrio = new THREE.Mesh(new THREE.BoxGeometry(56, 18, 12), new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: .12, depthWrite: false })); vidrio.position.set(0, 20, 0); s.add(vidrio);
    const marco = new Vox(); for (const x of [-28, 27]) for (const z of [-6, 5]) marco.box(x, 10, z, x + 1, 29, z + 1, P.amber); marco.box(-28, 29, -6, 28, 30, 6, P.amber); s.add(marco.build());
    const X = i => -21.5 + i * 6.5;
    const med = Array.from({ length: 8 }, (_, i) => { const m = actor('medalla', .38); s.add(m); return m; });
    const car = Array.from({ length: 8 }, () => { const m = actor('carpeta', .36); s.add(m); return m; });
    const tags = Array.from({ length: 8 }, () => { const p = pantalla(4, 3, 40, 30); s.add(p.m); return p; });
    const plaq = [0, 1].map(() => { const p = pantalla(12, 4.3, 196, 70); s.add(p.m); return p; });
    const pon = (i, x, y, z, sc = 1, ry = 0) => { const m = med[i]; m.visible = true; m.position.set(x, y, z); m.scale.setScalar(.38 * sc); m.rotation.y = ry; };
    const base = t => { for (let i = 0; i < 8; i++) pon(i, X(i), 17, 0, 1, Math.sin(t * .8 + i) * .25); };
    const c = cam(46);
    return { s, c, upd(t) { car.forEach(m => m.visible = false); tags.forEach(p => p.m.visible = false); plaq.forEach(p => p.m.visible = false); base(t); mira(c, [Math.sin(t * .1) * 4, 30, 100], [0, 24, 0], .1); },
      acc: {
        // las ocho medallas salen una a una de la vitrina y bajan a una carpeta de expediente, numerada, sobre la mesa
        ocho(lt, dur, t) { for (let i = 0; i < 8; i++) { const p = ss(clamp((lt - .2 - i * dur * .09) / .5, 0, 1)); const x = X(i);
            if (p <= 0) { pon(i, x, 17, 0, 1, Math.sin(t * .8 + i) * .25); continue; }
            pon(i, x, lerp(17, 12, p) + Math.sin(p * Math.PI) * 8, lerp(0, 20, p), 1, p * 6.28); car[i].visible = true; car[i].position.set(x, 7.6, 20); car[i].rotation.set(0, 0, 0);
            const tg = tags[i]; tg.m.visible = true; tg.m.position.set(x, 4, 25.3); rotular(tg, [String(i + 1)], '#ffffff', '#a22633', 22); }
          const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-4, 2, k), lerp(30, 34, k), lerp(104, 96, k)], [0, 21, 8], .06); },
        // siete medallas en fila (personas) y la octava, más grande, aparte (el sindicato)
        siete_uno(lt, dur, t) { const k = ss(clamp((lt - .3) / 1.2, 0, 1)); for (let i = 0; i < 7; i++) pon(i, X(i) - 5 * k, 17, 0, 1, Math.sin(t * .8 + i) * .25);
          pon(7, lerp(X(7), 19, k), lerp(17, 20, k), lerp(0, 14, k), 1 + .5 * k, t * .8);
          tags.forEach((p, i) => { p.m.visible = k > .5; if (i < 7) { p.m.position.set(X(i) - 5 * k, 26, 0); rotular(p, [String(i + 1)], '#ffffff', '#124e89', 22); } else { p.m.position.set(19, 30, 14); rotular(p, ['+1'], '#ffffff', '#a22633', 22); } });
          mira(c, [4, 30, 108], [2, 24, 2], .06); },
        // la cámara se acerca a dos medallas con su placa: Pilar Primo de Rivera y Pedro Barrié de la Maza
        nombres(lt, dur, t) { base(t); const ps = [[2, 'PILAR PRIMO', 'DE RIVERA'], [5, 'PEDRO BARRIÉ', 'DE LA MAZA']];
          ps.forEach(([i, a, b], j) => { const p = plaq[j]; p.m.visible = true; p.m.position.set(X(i), 27.5, 6.2); rotular(p, [a, b], '#fee761', '#3e2731', 22, { borde: '#feae34' }); pon(i, X(i), 18 + Math.sin(t * 2 + j) * .4, 0, 1.2, Math.sin(t) * .3); });
          const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-2, 4, k), 22, 78], [1.25, 22, 0], .06); },
      } };
  },
  // —— medallas 2: el archivo del ministerio: estanterías de expedientes, la mesa, el libro de la ley y el sello ——
  archivo: () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(P.ink); s.fog = new THREE.Fog(P.ink, 90, 180);
    luces(s, { cielo: 0xfff1d6, suelo: 0x733e39, amb: 1.3, sol: 0xfff1d6, int: 1.7, dir: [-20, 60, 60], sombra: 60 });
    const v = new Vox(); v.box(-60, -1, -40, 60, 0, 50, (x, y, z) => (z % 4 === 0) ? P.dbrown : P.brown); v.box(-60, 0, -42, 60, 50, -40, P.dslate);
    for (let y = 0; y < 40; y += 8) { v.box(-56, y, -40, 56, y + 1, -34, P.dbrown); for (let x = -55; x < 55; x += 2) if (hsh(x, y, 1) > .15) v.box(x, y + 1, -39, x + 2, y + 6 + (hsh(x, y, 2) * 2 | 0), -35, [P.tan, P.sand, P.navy, P.crimson, P.dgreen][(hsh(x, y, 3) * 5) | 0]); }
    v.box(-22, 0, -6, 22, 10, 8, P.dbrown); v.box(-23, 10, -7, 23, 11, 9, P.brown);   // mesa
    v.box(14, 11, -4, 22, 13, 4, P.slate); v.box(14, 13, -4, 22, 14, -3, P.slate);   // bandeja de entrada
    v.box(-20, 11, -5, -18, 12, -3, P.ink); v.box(-19, 12, -4, -18, 22, -3, P.ink); v.box(-21, 22, -5, -15, 24, -2, P.dgreen); v.luz(P.yellow);   // flexo
    v.box(-6, 0, 20, 6, 7, 26, P.crimson); v.box(-6, 7, 25, 6, 20, 26, P.crimson); for (const x of [-6, 5]) for (const z of [20, 25]) v.box(x, -1, z, x + 1, 0, z + 1, P.ink);   // silla vacía
    s.add(v.build());
    const lamp = new THREE.PointLight(0xfee761, 60, 40, 1.4); lamp.position.set(-17, 20, -2); s.add(lamp);
    // libro de la ley: hojas blancas y tapa azul que se abre ('tapa')
    const lb = new Vox(); lb.box(0, 0, 0, 12, 2, 9, P.white); lb.box(0, -1, 0, 12, 0, 9, P.navy); const gl = lb.build({ jit: .02 }); const libro = new THREE.Group(); libro.add(gl); libro.position.set(-10, 11, -2); s.add(libro);
    const tv = new Vox(); tv.box(0, 0, 0, 12, 1, 9, P.navy); tv.box(4, 1, 3, 8, 1.2, 6, P.amber); const gt = tv.build({ jit: .02 }); const tapa = new THREE.Group(); tapa.position.set(-10, 13, -2); tapa.add(gt); s.add(tapa);
    const pag = pantalla(11, 8.4, 132, 100); pag.m.rotation.x = -Math.PI / 2; pag.m.position.set(-4, 13.15, 2.5); s.add(pag.m);
    const med = actor('medalla', .5); s.add(med); const preg = pantalla(6, 4, 60, 40); s.add(preg.m);
    const car = actor('carpeta', .7); car.position.set(4, 12.5, 2); s.add(car); const sel = actor('sello', .6); s.add(sel); const marca = pantalla(9, 4, 120, 52); marca.m.rotation.x = -Math.PI / 2; s.add(marca.m);
    const cal = pantalla(16, 12, 128, 96); cal.m.position.set(30, 30, -33.8); s.add(cal.m);
    const C = new Bloques(40); s.add(C.im);
    const c = cam(46);
    return { s, c, upd(t) { tapa.rotation.z = 0; pag.m.visible = false; med.visible = false; preg.m.visible = false; sel.position.set(4, 24, 2); marca.m.visible = false; C.ini(); C.fin();
        rotular(cal, ['PLAZO', 'NOV'], ['#fee761', '#ffffff'], '#a22633', 26); mira(c, [Math.sin(t * .1) * 5, 30, 80], [0, 12, 0], .1); },
      acc: {
        // la medalla flota sobre la silla vacía y gira, con un signo de interrogación encima
        silla_vacia(lt, dur, t) { med.visible = true; med.position.set(0, 26 + Math.sin(t * 2) * .8, 23); med.rotation.y = t * 1.5; preg.m.visible = true; preg.m.position.set(0, 33, 23);
          rotular(preg, [Math.floor(t * 3) % 2 ? '¿?' : '?'], '#ffffff', '#a22633', 26); const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(18, 8, k), 30, lerp(86, 76, k)], [0, 25, 18], .08); },
        // el libro de la ley se abre sobre la mesa y aparece la página con el título
        ley(lt, dur, t) { const k = ss(clamp((lt - .2) / 1.2, 0, 1)); tapa.rotation.z = Math.PI * .98 * k; pag.m.visible = k > .7;
          rotular(pag, ['LEY 20/2022', 'MEMORIA', 'DEMOCRÁTICA'], ['#a22633', '#181425', '#181425'], '#ffffff', 16); const kc = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-14, -6, kc), lerp(44, 38, kc), lerp(52, 40, kc)], [-5, 14, 2], .02); },
        // llegan cartas de alegaciones volando a la bandeja y el calendario del plazo pasa sus días
        alegaciones(lt, dur, t) { tapa.rotation.z = Math.PI * .98; pag.m.visible = true; C.ini(); for (let i = 0; i < 9; i++) { const p = clamp((lt - i * .3) / .9, 0, 1); if (p <= 0) continue; const e = ss(p);
            C.pon(lerp(-40 + i * 3, 18, e), lerp(36, 13.6 + Math.min(i, 8) * .35, e) + Math.sin(e * Math.PI) * 8, lerp(30, 0, e), 4, .3, 3, i % 2 ? P.white : P.sand, (1 - e) * 4); } C.fin();
          rotular(cal, ['PLAZO', `DÍA ${1 + Math.min(10, Math.floor(lt * 3))}`], ['#fee761', '#ffffff'], '#a22633', 26); const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(10, 22, k), 30, lerp(60, 66, k)], [lerp(14, 24, k), lerp(14, 22, k), -6], .06); },
        // el sello baja sobre la carpeta y deja la marca roja de la resolución
        sello(lt, dur, t) { tapa.rotation.z = Math.PI * .98; pag.m.visible = true; const g = clamp((lt - .4) / .5, 0, 1), up = lt > 1.1 ? ss(clamp((lt - 1.1) / .6, 0, 1)) : 0;
          sel.position.set(4, lerp(24, 13.6, g * g) + up * 10, 2); marca.m.visible = lt > .9; marca.m.position.set(4, 14.6, 2); rotular(marca, ['RESOLUCIÓN'], '#e43b44', '#ead4aa', 18, { borde: '#e43b44' });
          mira(c, [10, 30, 34], [4, 13, 2], .04); },
      } };
  },
  // —— medallas 3: la imprenta del boletín: rodillos que giran, pliegos que salen y la página de 2023 ——
  imprenta: () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(P.night); s.fog = new THREE.Fog(P.night, 100, 220);
    luces(s, { cielo: 0xdfe8ff, suelo: 0x3a4466, amb: 1.4, sol: 0xffffff, int: 1.6, dir: [-30, 60, 60], sombra: 70 });
    const v = new Vox(); v.box(-70, -1, -50, 70, 0, 60, (x, y, z) => (x % 10 === 0 || z % 10 === 0) ? P.dslate : P.slate); v.box(-70, 0, -52, 70, 50, -50, P.dslate);
    for (const z of [-12, 10]) v.box(-30, 0, z, -10, 24, z + 2, P.steel); v.box(-30, 24, -12, -10, 26, 12, P.slate); v.box(-34, 0, -12, -30, 18, 12, P.dslate);   // bastidor de la rotativa
    v.box(-10, 4, -8, 40, 6, 8, P.ink); for (let x = -8; x < 40; x += 6) v.box(x, 0, -8, x + 1, 4, -7, P.steel), v.box(x, 0, 7, x + 1, 4, 8, P.steel);   // cinta
    v.box(42, 0, -9, 58, 3, 9, P.dbrown); s.add(v.build());
    const rod = [8, 14, 20].map(y => { const r = new Vox(); r.cyl(0, 0, -10, 10, 3, (x, Y, z) => (x + z) % 3 === 0 ? P.silver : P.steel); const g = r.build({ jit: .02 }); const p = new THREE.Group(); p.add(g); p.rotation.x = Math.PI / 2; const q = new THREE.Group(); q.add(p); q.position.set(-20, y, 0); s.add(q); return q; });
    const B = new Bloques(160); s.add(B.im);
    const hoja = pantalla(22, 30, 176, 240); hoja.m.position.set(14, 30, -10); s.add(hoja.m); const med = actor('medalla', .55); s.add(med);
    const c = cam(46);
    return { s, c, upd(t) { rod.forEach((r, i) => r.rotation.z = -t * 3 * (i % 2 ? -1 : 1)); B.ini(); for (let i = 0; i < 12; i++) { const u = ((t * .4 + i / 12) % 1); B.pon(lerp(-10, 40, u), 6.4, 0, 9, .25, 12, P.white); } B.fin();
        hoja.m.visible = true; med.position.set(24, 40, -6); med.rotation.y = Math.sin(t) * .4;
        rotular(hoja, ['BOLETÍN', '— 2023 —', '', 'MEDALLA', 'RETIRADA', 'A FRANCO'], ['#181425', '#a22633', '#181425', '#181425', '#181425', '#181425'], '#ffffff', 22, { borde: '#181425' }); mira(c, [Math.sin(t * .1) * 5, 34, 86], [6, 16, -2], .08); },
      acc: {
        // los rodillos giran, los pliegos salen por la cinta y se apilan; la cámara sube hasta la página de 2023
        imprenta(lt, dur, t) { const n = Math.min(14, Math.floor(lt * 4)); B.ini(); for (let i = 0; i < 12; i++) { const u = ((t * .5 + i / 12) % 1); B.pon(lerp(-10, 42, u), 6.4, 0, 9, .25, 12, P.white); }
            for (let i = 0; i < n; i++) B.pon(50, 3.3 + i * .5, 0, 10, .4, 13, i % 2 ? P.white : P.silver); B.fin(); rod.forEach((r, i) => r.rotation.z = -t * 6 * (i % 2 ? -1 : 1));
          const k = ss(clamp(lt / dur, 0, 1)); med.position.set(24, 40, -6); mira(c, [lerp(-10, 14, k), lerp(26, 34, k), lerp(80, 74, k)], [lerp(-4, 14, k), lerp(14, 34, k), -6], .06); },
      } };
  },
});

Object.assign(FABE, {
  // —— penalti 1: el estadio de noche con la grada llena; el penalti se va por encima del larguero y luego llega el 2-1 ——
  estadio: () => {
    const s = new THREE.Scene(); s.background = cielo([P.ink, P.night, P.navy]); s.fog = new THREE.Fog(0x262b44, 130, 300);
    luces(s, { cielo: 0xdfe8ff, suelo: 0x265c42, amb: 1.5, sol: 0xffffff, int: 1.8, dir: [20, 80, 50], sombra: 90 });
    const zg = -30, v = new Vox(); cesped(v, -64, 64, -40, 70, zg);
    for (let k = 0; k < 12; k++) { v.box(-80, k * 2.5, -44 - k * 3, 80, k * 2.5 + 2.5, -41 - k * 3, k % 4 === 3 ? P.white : P.slate); for (const sx of [-1, 1]) v.box(sx > 0 ? 66 + k * 3 : -69 - k * 3, k * 2.5, -44, sx > 0 ? 69 + k * 3 : -66 - k * 3, k * 2.5 + 2.5, 80, P.slate); }
    for (const [x, z] of [[-70, -48], [70, -48]]) { v.box(x - 1, 0, z, x + 1, 60, z + 2, P.steel); v.box(x - 6, 60, z - 1, x + 6, 66, z + 2, P.white); } v.luz(P.white); s.add(v.build());
    const por = actor('porteria', 1); por.position.set(0, 0, zg); s.add(por); const bal = actor('balon', .45); s.add(bal);
    const marcador = pantalla(30, 12, 240, 96); marcador.m.position.set(-36, 44, -66); marcador.m.rotation.x = -.2; s.add(marcador.m);
    const G = new Bloques(1500), Pp = new Bloques(60); s.add(G.im, Pp.im);
    const COLS = [P.white, P.white, P.white, P.silver, P.navy, P.amber, P.red, P.purple || P.plum, P.skin];
    const grada = (t, salto) => { G.ini(); for (let k = 0; k < 12; k++) for (let x = -78; x < 78; x += 2.2) { const j = salto ? Math.abs(Math.sin(t * 9 + x * .7 + k)) * 1.2 : 0; G.pon(x, k * 2.5 + 3 + j, -42.5 - k * 3, 1.4, 1.6, 1.2, COLS[(hsh(x * 10 | 0, k, 1) * COLS.length) | 0]); }
      for (const sx of [-1, 1]) for (let k = 0; k < 8; k++) for (let z = -40; z < 78; z += 2.4) G.pon(sx * (67.5 + k * 3), k * 2.5 + 3 + (salto ? Math.abs(Math.sin(t * 9 + z + k)) : 0), z, 1.2, 1.6, 1.4, COLS[(hsh(z * 10 | 0, k, 2) * COLS.length) | 0]); G.fin(); };
    const score = (a, b) => rotular(marcador, [`RMA ${a}-${b} CEL`], '#ffffff', '#181425', 30, { borde: '#fee761' });
    const spot = zg + 22;
    const c = cam(46);
    return { s, c, upd(t) { grada(t, false); score(1, 1); bal.position.set(0, .9, spot); Pp.ini(); Pp.fin(); mira(c, [Math.sin(t * .1) * 4, 10, 24], [0, 3, zg], .06); },
      acc: {
        // carrera, disparo y el balón se va alto por encima del larguero hacia la grada; el portero se tira al otro lado
        chut_alto(lt, dur, t) { grada(t, false); score(1, 1); const tk = .9; const run = clamp(lt / tk, 0, 1); Pp.ini();
          persona(Pp, lerp(-3, -.8, run), 0, lerp(spot + 8, spot + 1.2, run), P.white, { s: .58, pelo: P.ink });
          const dv = clamp((lt - tk) / .5, 0, 1); persona(Pp, lerp(0, -5, ss(dv)), Math.sin(dv * Math.PI) * 1.4, zg + 1, P.lime, { s: .58, ag: dv * .5 });
          for (const [x, z, col] of [[-14, spot + 12, P.white], [12, spot + 10, P.blue], [-20, spot + 4, P.blue], [18, spot + 6, P.white]]) persona(Pp, x, 0, z, col, { s: .58 }); Pp.fin();
          const f = clamp((lt - tk) / 1.4, 0, 1); bal.position.set(lerp(0, 4, f), .9 + f * 16 - f * f * 3, lerp(spot, zg - 24, f)); bal.rotation.x = f * 12;
          mira(c, [lerp(8, 5, f), lerp(4.5, 7, f), spot + 28], [0, lerp(3, 6, f), zg + 3], .0); },
        // otro disparo desde el borde del área: el balón entra por la escuadra, la red se mueve y la grada salta; 2-1
        gol_final(lt, dur, t) { const f = clamp((lt - .4) / .8, 0, 1), dentro = f >= 1; grada(t, dentro); score(dentro ? 2 : 1, 1); Pp.ini();
          persona(Pp, -12, 0, zg + 28, P.white, { s: .58 }); persona(Pp, lerp(0, 5, ss(f)), 0, zg + 1, P.lime, { s: .58, ag: f * .4 }); persona(Pp, -4, 0, zg + 12, P.blue, { s: .58 }); persona(Pp, 6, 0, zg + 16, P.blue, { s: .58 });
          if (dentro) for (let i = 0; i < 3; i++) persona(Pp, -12 + i * 2.5, Math.abs(Math.sin(t * 8 + i)) * 1.5, zg + 26 - i, P.white, { s: .58 }); Pp.fin();
          bal.position.set(lerp(-11, 6.4, f), lerp(.9, 4.2, f) + Math.sin(f * Math.PI) * 2, lerp(zg + 27, zg - 2 - (dentro ? 1.5 : 0), f)); bal.rotation.y = f * 8; por.position.z = zg - (dentro && lt < 1.6 ? Math.sin((lt - 1.2) * 12) * .3 : 0);
          const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(24, 10, k), lerp(14, 22, k), lerp(zg + 40, zg + 50, k)], [lerp(-2, -10, k), lerp(3, 14, k), lerp(zg + 6, zg - 30, k)], .06); },
      } };
  },
  // —— penalti 2: el área vista desde arriba, de día: la cinta métrica, las yardas, la línea antigua y el punto ——
  medida: () => {
    const s = new THREE.Scene(); s.background = cielo([P.blue, 0x7fc8ff, 0xd8f6ff]); s.fog = new THREE.Fog(0xd8f6ff, 140, 300);
    luces(s, { cielo: 0xe8f4ff, suelo: 0x3e8948, amb: 1.5, sol: 0xfff1d6, int: 1.9, dir: [-30, 80, 40], sombra: 80 });
    const zg = -20, v = new Vox(); cesped(v, -70, 70, -40, 70, zg); v.box(-70, 0, -42, 70, 6, -40, P.navy); for (let x = -70; x < 70; x += 12) v.box(x, 6, -42, x + 6, 7, -40, P.white); s.add(v.build());
    const por = actor('porteria', 1); por.position.set(0, 0, zg); s.add(por); const bal = actor('balon', .45); s.add(bal); const cue = actor('balon_cuero', .5); s.add(cue);
    const B = new Bloques(220, true), Pp = new Bloques(20); s.add(B.im, Pp.im);
    const et = pantalla(6, 2.6, 168, 72); s.add(et.m); const spot = zg + 22, YD = 1.8288;
    const rotEt = (txt, x, y, z, bg = '#181425') => { et.m.visible = true; et.m.position.set(x, y, z); et.m.lookAt(c.position); rotular(et, txt, '#ffffff', bg, 28, { borde: '#fee761' }); };
    const c = cam(46);
    return { s, c, upd(t) { B.ini(); B.pon(0, .06, spot, 1.4, .12, 1.4, P.white); B.fin(); bal.visible = true; bal.position.set(0, .9, spot); cue.visible = false; et.m.visible = false; Pp.ini(); Pp.fin(); mira(c, [26, 30, 20], [0, 0, zg + 10], .06); },
      acc: {
        // una cinta métrica amarilla se desenrolla desde la línea de gol hasta el punto: 11 metros
        medir(lt, dur, t) { const k = ss(clamp((lt - .2) / (dur * .6), 0, 1)), L = 22 * k; B.ini(); B.pon(0, .06, spot, 1.4, .12, 1.4, P.white); B.pon(0, .15, zg + L / 2, .9, .1, L, P.yellow);
            for (let m = 0; m <= L; m += 2) B.pon(0, .22, zg + m, 1.3, .08, .2, P.ink); B.pon(0, .6, zg + L, 1.6, 1.2, 1.2, P.amber); B.fin(); bal.position.set(0, .9, spot);
          if (k > .95) rotEt(['11 M'], 5, 3, spot - 9); mira(c, [lerp(6, 2, k), 36, spot + 20], [0, 0, zg + 7], .04); },
        // aparecen doce bloques de una yarda, rojos y blancos, uno detrás de otro
        yardas(lt, dur, t) { const n = Math.min(12, Math.floor(lt / (dur * .7) * 12) + 1); B.ini(); for (let i = 0; i < n; i++) B.pon(0, .5, zg + YD * (i + .5), 2.2, 1, YD * .96, i % 2 ? P.white : P.red); B.fin(); bal.visible = false;
          rotEt([`${n} YARDA${n > 1 ? 'S' : ''}`], 5, 3, zg + YD * n - 2); mira(c, [2, 36, spot + 20], [0, 0, zg + 7], .04); },
        // al lado de las 12 yardas, 11 bloques azules de un metro: el último se queda en 0,97
        equivale(lt, dur, t) { const k = clamp((lt - .3) / (dur * .6), 0, 1), n = Math.ceil(11 * k); B.ini(); for (let i = 0; i < 12; i++) B.pon(-1.5, .5, zg + YD * (i + .5), 2, 1, YD * .96, i % 2 ? P.white : P.red);
            for (let i = 0; i < n; i++) { const l = i === 10 ? 1.94 : 2; B.pon(1.5, .5, zg + i * 2 + l / 2, 2, 1, l * .96, i % 2 ? P.white : P.blue); } B.fin(); bal.visible = false;
          mira(c, [2, 36, spot + 20], [0, 0, zg + 7], .04); },
        // sin punto: una línea blanca cruza todo el campo y el balón de cuero se mueve por ella; el jugador elige su sitio
        linea(lt, dur, t) { const k = ss(clamp(lt / 1.2, 0, 1)); B.ini(); B.pon(0, .08, spot, 130 * k, .14, 1, P.white); B.fin(); bal.visible = false; cue.visible = true; const x = Math.sin(lt * 1.6) * 7;
          cue.position.set(x, .9, spot); cue.rotation.z = -x; Pp.ini(); persona(Pp, x - 1.5, 0, spot + 3, P.white, { s: .58, pelo: P.dbrown }); Pp.fin();
          mira(c, [0, 24, spot + 34], [0, 0, spot - 4], .06); },
        // la línea se encoge hasta convertirse en el punto, que destella, y el balón cae encima
        punto(lt, dur, t) { const k = ss(clamp(lt / 1.1, 0, 1)); B.ini(); B.pon(0, .08, spot, lerp(130, 1.4, k), .14, lerp(1, 1.4, k), P.white); if (k > .9) { const r = 1.4 + ((lt * 6) % 4); B.pon(0, .05, spot, r, .05, r, P.yellow); } B.fin();
          bal.visible = false; cue.visible = true; const f = clamp((lt - 1.1) / .5, 0, 1); cue.position.set(0, lerp(10, .9, f * f), spot); Pp.ini(); Pp.fin();
          const kc = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(0, 12, kc), lerp(24, 18, kc), lerp(spot + 34, spot + 22, kc)], [0, 0, spot - 4], .06); },
      } };
  },
  // —— penalti 3: Milford (Irlanda), 1891: un prado entre muros de piedra, casas encaladas y un portero con gorra ——
  milford: () => {
    const s = new THREE.Scene(); s.background = cielo([P.steel, P.silver, 0xe8eef6]); s.fog = new THREE.Fog(0xdfe6ee, 120, 280);
    luces(s, { cielo: 0xe8eef6, suelo: 0x3e8948, amb: 1.6, sol: 0xfff1d6, int: 1.5, dir: [-30, 70, 50], sombra: 90 });
    const alt = (x, z) => z < -40 ? Math.max(0, (-40 - z) * .18 + Math.sin(x * .06) * 4) : 0;
    const v = new Vox(); for (let x = -90; x < 90; x++) for (let z = -130; z < 60; z++) { const h = Math.round(alt(x, z)); v.set(x, h, z, hsh(x >> 1, 7, z >> 1) > .5 ? P.green : 0x4a9a52); if (h > 0) v.set(x, h - 1, z, P.dgreen); }
    for (const [x0, z0, x1, z1] of [[-60, -30, 60, -29], [-60, -30, -59, 40], [59, -30, 60, 40]]) v.box(x0, 1, z0, x1, 3, z1, (x, y, z) => hsh(x, y, z) > .5 ? P.silver : P.steel);
    const casita = (x, z) => { v.box(x, 1, z, x + 14, 8, z + 8, P.white); v.box(x + 6, 1, z + 8, x + 9, 6, z + 9, P.dbrown); v.box(x + 2, 4, z + 8, x + 4, 6, z + 9, P.navy); v.box(x + 10, 4, z + 8, x + 12, 6, z + 9, P.navy);
      for (let k = 0; k < 4; k++) v.box(x - 1, 8 + k, z - 1 + k, x + 15, 9 + k, z + 9 - k, k % 2 ? P.amber : P.sand); v.box(x + 11, 8, z + 2, x + 13, 14, z + 4, P.slate); };
    casita(-50, -48); casita(-28, -56); casita(30, -50); casita(48, -44);
    for (const x of [-8, 7]) v.box(x, 1, -16, x + 1, 6, -15, P.white); v.box(-8, 6, -16, 8, 7, -15, P.white);   // portería antigua con larguero
    for (const [x, z] of [[-70, -10], [72, 0], [-40, -90], [60, -100]]) { v.box(x, 1, z, x + 2, 9, z + 2, P.dbrown); v.ball(x + 1, 13, z + 1, 5, P.dgreen); }
    v.box(16, 1, 6, 17, 7, 7, P.dbrown); s.add(v.build());
    const letrero = pantalla(8, 3.4, 168, 72); letrero.m.position.set(16.5, 8.5, 7.2); letrero.m.rotation.y = -.5; s.add(letrero.m);
    const cue = actor('balon_cuero', .3); s.add(cue); const Pp = new Bloques(30); s.add(Pp.im);
    const c = cam(46);
    return { s, c, upd(t) { rotular(letrero, ['MILFORD', '1891'], '#fee761', '#733e39', 26, { borde: '#3e2731' }); Pp.ini(); persona(Pp, 0, 1, -14, P.lime, { s: .6, pelo: P.ink }); Pp.fin(); cue.position.set(0, 1.9, 4); mira(c, [Math.sin(t * .1) * 4, 14, 40], [0, 4, -14], .08); },
      acc: {
        // el portero salta de un poste al otro; un jugador chuta el balón de cuero desde la línea y el portero lo atrapa
        portero(lt, dur, t) { const dv = Math.sin(lt * 3); Pp.ini(); const px = dv * 5, py = 1 + Math.abs(Math.cos(lt * 3)) * 1.2; persona(Pp, px, py, -14, P.lime, { s: .6, pelo: P.ink });
          persona(Pp, -2, 1, 10, P.crimson, { s: .6, pelo: P.dbrown }); persona(Pp, -40, 1, 14, P.navy, { s: .6 }); persona(Pp, 36, 1, 18, P.navy, { s: .6 }); Pp.fin();
          const f = ((lt * .5) % 1); cue.position.set(lerp(-1, px, f), 1.9 + Math.sin(f * Math.PI) * 3, lerp(9, -13, f)); cue.rotation.x = -f * 10;
          const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(22, 6, k), lerp(16, 12, k), lerp(44, 30, k)], [lerp(14, 0, k), lerp(7, 4, k), lerp(4, -12, k)], .08); },
      } };
  },
});

// ———————————— 23/11/2026: el viento sur en Bilbao (Foehn), la veda de encuestas del 29-N y el Reino de León ————————————
// viento: rayas blancas que viajan por una caja en la dirección (dx, dz)
function rachas(B, x0, x1, y0, y1, z0, z1, t, n, v = 40, dir = 'z', col = P.white, L = 7) {
  for (let i = 0; i < n; i++) { const a = hsh(i, 21, 1), b = hsh(i, 22, 2), y = y0 + hsh(i, 23, 3) * (y1 - y0);
    if (dir === 'z') { const z = z0 + ((t * v * (.8 + b * .4) + a * (z1 - z0)) % (z1 - z0)); B.pon(x0 + b * (x1 - x0), y, z, .3, .3, L, col); }
    else { const x = x0 + ((t * v * (.8 + b * .4) + a * (x1 - x0)) % (x1 - x0)); B.pon(x, y, z0 + b * (z1 - z0), L, .3, .3, col); } } }
// bola de aire hecha de cubos (se recolorea en cada fotograma)
function parcela(B, x, y, z, r, col) { for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) for (let c = -r; c <= r; c++) { const d = a * a + b * b + c * c; if (d <= r * r + .5 && d >= (r - 1.3) ** 2) B.pon(x + a, y + b, z + c, 1, 1, 1, col); } }

Object.assign(FAB, {
  // —— viento sur ——
  veleta: () => {   // veleta de hierro: mástil, cruz de los puntos cardinales y flecha con cola ('flecha') que gira
    const v = new Vox(); v.box(0, 0, 0, 1, 14, 1, P.ink); v.box(-4, 9, 0, 5, 10, 1, P.dslate); v.box(0, 9, -4, 1, 10, 5, P.dslate); v.set(0, 9, 5, P.red); v.luz(P.red);
    const w = new THREE.Group(); w.add(v.build({ centrar: false, jit: .02 }));
    const f = new Vox(); f.box(-6, 0, 0, 6, 1, 1, P.ink); for (const [x, y] of [[6, 0], [5, 1], [5, -1], [4, 2], [4, -2]]) f.set(x, y, 0, P.amber); for (let y = -2; y <= 2; y++) f.box(-7, y, 0, -5, y + 1, 1, P.ink); f.luz(P.amber);
    const gf = f.build({ jit: 0 }); const piv = new THREE.Group(); piv.position.set(.5, 14.5, .5); gf.position.set(0, 0, -.5); piv.add(gf); piv.name = 'flecha'; w.add(piv); return w; },
  puente_ria: () => {   // puente blanco de arco sobre la ría: tablero, arco inclinado y tirantes
    const v = new Vox(); v.box(-16, 4, -3, 16, 5, 3, P.silver); v.box(-16, 5, -3, 16, 6, -2, P.white); v.box(-16, 5, 2, 16, 6, 3, P.white);
    for (let x = -14; x <= 14; x++) { const y = 5 + Math.round(10 * (1 - (x / 14) ** 2)); v.box(x, y, -1, x + 1, y + 2, 1, P.white); if (x % 3 === 0) v.box(x, 6, 0, x + 1, y, 1, P.steel); }
    for (const x of [-17, 16]) v.box(x, 0, -4, x + 2, 5, 4, P.steel);
    const w = new THREE.Group(); w.add(v.build({ centrar: false, jit: .02 })); return w; },
  caserio: () => {   // caserío vasco: muros blancos, entramado de madera, balcón, contraventanas verdes y tejado de teja a dos aguas
    const v = new Vox(); v.box(-15, 0, -10, 15, 14, 10, (x, y, z) => (z === 9 && (x % 6 === 0 || y === 7)) ? P.dbrown : P.white);
    for (const x of [-10, -4, 4, 10]) { v.box(x - 1, 9, 10, x + 2, 13, 11, P.navy); v.box(x - 2, 9, 10, x - 1, 13, 11, P.dgreen); v.box(x + 2, 9, 10, x + 3, 13, 11, P.dgreen); }
    v.box(-6, 0, 10, 6, 6, 11, P.dbrown); v.box(-7, 6, 10, 7, 7, 11, P.umber); v.box(-14, 7, 10, 14, 8, 13, P.brown); for (let x = -14; x < 14; x += 2) v.box(x, 8, 12, x + 1, 10, 13, P.dbrown);
    for (let k = 0; k < 9; k++) v.box(-17, 14 + k, -12 + k * 1.2 | 0, 17, 15 + k, 12 - k * 1.2 | 0, k % 2 ? P.red : P.crimson);
    v.box(8, 14, -2, 11, 24, 1, P.silver); const w = new THREE.Group(); w.add(v.build({ centrar: false })); return w; },
});

Object.assign(FABE, {
  // —— viento sur 1: la ría de Bilbao con sol, el puente blanco, los montes al sur y, detrás, la meseta bajo la niebla ——
  ria: () => {
    const s = new THREE.Scene(); s.background = cielo([P.blue, 0x7fc8ff, 0xd8f6ff]); s.fog = new THREE.Fog(0xd8f6ff, 160, 360);
    luces(s, { cielo: 0xe8f4ff, suelo: 0x3e8948, amb: 1.5, sol: 0xfff1d6, int: 2.0, dir: [-30, 70, 60], sombra: 110 });
    const alt = (x, z) => z < -100 ? Math.min(46, (-100 - z) * .9 + Math.sin(x * .07) * 5 + 2) : 0;
    const v = new Vox(); for (let x = -90; x < 90; x++) for (let z = -260; z < 60; z++) { if (z >= -100) { const rio = Math.abs(x + Math.sin(z * .03) * 3) < 8; v.set(x, -1, z, rio ? (hsh(x, z, 1) > .8 ? P.cyan : P.blue) : (Math.abs(x + Math.sin(z * .03) * 3) < 10 ? P.silver : P.steel)); continue; }
      let h = Math.round(alt(x, z)); if (z < -150) h = Math.max(30, Math.round(46 - (-150 - z) * .5)); v.set(x, h, z, z < -150 ? (hsh(x >> 2, 3, z >> 2) > .5 ? P.tan : P.sand) : (hsh(x >> 2, 4, z >> 2) > .55 ? P.dgreen : P.green)); if (h > 0) v.set(x, h - 1, z, P.dgreen); }
    const edif = []; for (const sd of [-1, 1]) { let z = -96, i = 0; while (z < 30) { const w = 8 + (hsh(i, sd + 5, 1) * 4 | 0), h = 14 + (hsh(i, sd + 5, 2) * 22 | 0), x0 = sd > 0 ? 14 + (i % 2) * 2 : -14 - 10 - (i % 2) * 2; pisos(v, x0, z, 10, h, [P.sand, P.tan, 0xf2e6c8, P.silver, P.pink][(i + (sd > 0 ? 2 : 0)) % 5], w); edif.push([x0, z, 10, h, w]); z += w + 2; i++; } }
    s.add(v.build());
    const pu = actor('puente_ria', 1); pu.position.set(0, -1, -20); s.add(pu); const pu2 = actor('puente_ria', 1); pu2.position.set(0, -1, -70); s.add(pu2);
    const B = new Bloques(500, true), Nb = new Bloques(900, true), Pp = new Bloques(120), F = new Bloques(40); s.add(B.im, Nb.im, Pp.im, F.im);
    const sun = bola(P.yellow, 8); sun.position.set(-60, 120, -300); s.add(sun);
    const niebla = () => { Nb.ini(); for (let x = -90; x < 90; x += 6) for (let z = -258; z < -160; z += 6) Nb.pon(x + hsh(x, z, 2) * 3, 38 + hsh(x, z, 3) * 3, z, 7, 3 + hsh(x, z, 4) * 3, 7, hsh(x, z, 5) > .5 ? P.white : 0xe8eef6); Nb.fin(); };
    const banderas = (t, f) => { F.ini(); for (const x of [-11, 11]) for (let z = -90; z < 30; z += 24) { F.pon(x, 4, z, .4, 8, .4, P.ink); for (let k = 0; k < 4; k++) F.pon(x, 7.2 + Math.sin(t * 9 + k + z) * .4 * f, z + 1 + k * 1.1 * f + .2, .3, 2, 1.1, k % 2 ? P.red : P.white); } F.fin(); };
    const gente = t => { Pp.ini(); for (let i = 0; i < 10; i++) { const sd = i % 2 ? 1 : -1, z = -90 + ((t * 3 * sd + i * 23) % 120 + 120) % 120; persona(Pp, sd * 11.5, 0, z, [P.red, P.yellow, P.lime, P.cyan, P.pink, P.orange][i % 6], { s: .7 }); } Pp.fin(); };
    const c = cam(46);
    return { s, c, upd(t) { s.fog.far = 360; niebla(); banderas(t, .3); gente(t); B.ini(); rachas(B, -40, 40, 6, 40, -150, 50, t, 30, 30); B.fin(); mira(c, [Math.sin(t * .1) * 4, 34, 80], [0, 14, -50], .1); },
      acc: {
        // el viento del sur baja de los montes y barre la ría: rachas hacia la cámara, banderas que ondean y la gente en manga corta
        llega_sur(lt, dur, t) { const k = clamp(lt / (dur * .6), 0, 1); banderas(t, .3 + k * .7); B.ini(); rachas(B, -40, 40, 6, 44, -150, -150 + 210 * Math.max(.15, k), t, 30 + 90 * k, 45); B.fin();
          const kc = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-6, 0, kc), lerp(36, 28, kc), lerp(88, 66, kc)], [0, 14, -50], .1); },
        // la cámara sube por encima de los montes: delante la ría con sol; detrás, la meseta tapada por la niebla
        dos_mundos(lt, dur, t) { s.fog.far = 600; banderas(t, 1); B.ini(); rachas(B, -40, 40, 30, 60, -200, 40, t, 40, 45); B.fin(); const k = ss(clamp(lt / (dur * .9), 0, 1));
          mira(c, [0, lerp(36, 150, k), lerp(80, 110, k)], [0, lerp(14, 30, k), lerp(-50, -190, k)], .1); },
      } };
  },
  // —— viento sur 2: la montaña en corte, de la meseta (izquierda) al mar (derecha); una bola de aire la cruza ——
  cordillera: () => {
    const s = new THREE.Scene(); s.background = cielo([P.blue, 0x7fc8ff, 0xd8f6ff]); s.fog = new THREE.Fog(0xd8f6ff, 220, 420);
    luces(s, { cielo: 0xe8f4ff, suelo: 0x3e8948, amb: 1.5, sol: 0xfff1d6, int: 2.0, dir: [10, 70, 60], sombra: 120 });
    const h = x => x < -26 ? 18 : x < 0 ? 18 + (x + 26) / 26 * 28 : x < 32 ? 46 * (1 - x / 32) ** 1.3 : 0;
    const v = new Vox(); for (let x = -90; x < 100; x++) { const H2 = Math.round(h(x)); for (let z = -30; z < 10; z++) { if (x >= 34) { v.set(x, -1, z, hsh(x, z, 1) > .85 ? P.cyan : P.blue); continue; }
      for (let y = -2; y <= H2; y++) { const sup = y === H2; v.set(x, y, z, sup ? (x < -26 ? (hsh(x, z, 2) > .5 ? P.tan : P.sand) : (H2 > 38 ? P.slate : (hsh(x >> 1, 3, z >> 1) > .5 ? P.green : P.dgreen))) : (z === 9 ? (y % 6 < 3 ? P.brown : P.dbrown) : P.dbrown)); } } }
    for (const x of [24, 28]) v.box(x, Math.round(h(x)) + 1, -6, x + 3, Math.round(h(x)) + 5, -2, P.white);   // casitas de la costa
    for (let x = 34; x < 42; x += 3) v.box(x - 10, 1, 2, x - 7, 6, 6, P.white);
    s.add(v.build({ jit: .05 }));
    const A = new Bloques(520), Nb = new Bloques(500, true), B = new Bloques(300, true), M = new Bloques(60, true); s.add(A.im, Nb.im, B.im, M.im);
    const sun = bola(P.yellow, 7); sun.position.set(70, 110, -260); s.add(sun);
    const et = pantalla(9, 4.5, 180, 90); s.add(et.m); const marcas = [0, 1, 2, 3].map(() => { const p = pantalla(9, 4.5, 112, 56); s.add(p.m); return p; });
    const ruta = u => { if (u < .25) { const x = lerp(-62, -26, u / .25); return [x, 30 + Math.sin(u * 30) * .4]; } if (u < .5) { const k = (u - .25) / .25, x = lerp(-26, -1, k); return [x, h(x) + 6]; }
      if (u < .9) { const k = (u - .5) / .4, x = lerp(-1, 28, k); return [x, h(x) + 6]; } const x = lerp(28, 40, (u - .9) / .1); return [x, 7]; };
    const colU = u => u < .5 ? colLerp(0x4fb0ff, 0x1a4fd0, u / .5) : colLerp(0x2c7fd6, 0xff6a3a, (u - .5) / .45);
    const bolaAire = (u, t) => { const [x, y] = ruta(u); A.ini(); parcela(A, x, y + Math.sin(t * 3) * .3, -10, 4, colU(u)); for (let i = 1; i < 7; i++) { const [tx, ty] = ruta(Math.max(0, u - i * .012)); if (u - i * .012 > 0) A.pon(tx, ty, -10, 1.2, 1.2, 1.2, colU(u - i * .012)); } A.fin(); return [x, y]; };
    const nieblaM = (o) => { Nb.ini(); for (let x = -88; x < -24; x += 5) for (let z = -28; z < 8; z += 6) Nb.pon(x, 21 + hsh(x, z, 3) * 2, z, 6, 4 + hsh(x, z, 4) * 2, 6, hsh(x, z, 5) > .5 ? P.white : 0xe8eef6); Nb.fin(); };
    const capa = (k, t) => { B.ini(); if (k > 0) { nubarron(B, -6, 52, -10, 9 * k, P.white, 3, P.silver); nubarron(B, -14, 46, -8, 7 * k, P.white, 5, P.silver); llueve(B, -22, -4, -14, -6, 26, 44, t, Math.round(50 * k), P.cyan, 30); } B.fin(); };
    const lbl = (txt, x, y, bg = '#124e89') => { et.m.visible = true; et.m.position.set(x, y, -6); rotular(et, txt, '#ffffff', bg, 46, { borde: '#ffffff' }); };
    const c = cam(46);
    return { s, c, upd(t) { nieblaM(); capa(0, t); M.ini(); M.fin(); et.m.visible = false; marcas.forEach(p => p.m.visible = false); bolaAire(0, t); mira(c, [-10, 70, 190], [-10, 24, -10], .06); },
      acc: {
        // la bola de aire, fresca, flota sobre la meseta tapada de niebla, con un interrogante encima
        pregunta(lt, dur, t) { const [x, y] = bolaAire(0, t); lbl([Math.floor(t * 2) % 2 ? '?' : '¿?'], x, y + 8); const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-58, -50, k), lerp(44, 40, k), lerp(80, 66, k)], [x + 4, y - 2, -10], .1); },
        // la bola sale hacia la montaña y la cámara se aleja hasta ver la meseta, la sierra y el mar
        cruzar(lt, dur, t) { const u = .25 * ss(clamp(lt / dur, 0, 1)); const [x, y] = bolaAire(u, t); const k = ss(clamp(lt / (dur * .8), 0, 1)); mira(c, [lerp(-50, -12, k), lerp(40, 80, k), lerp(66, 200, k)], [lerp(x, -12, k), lerp(y, 24, k), -10], .06); },
        // sube por la ladera, se enfría (azul) y deja una nube con lluvia sobre la cumbre
        subir(lt, dur, t) { const p = clamp(lt / (dur * .9), 0, 1), u = .25 + .25 * ss(p); const [x, y] = bolaAire(u, t); capa(clamp(p * 1.5, 0, 1), t);
          if (p > .6) lbl(['FRÍO'], x - 10, y + 6, '#124e89'); mira(c, [lerp(-30, -8, p), lerp(66, 76, p), 130], [lerp(-18, -4, p), lerp(30, 38, p), -10], .08); },
        // baja por el otro lado ya seco: se va poniendo naranja y aparecen las marcas +1 cada cien metros
        bajar(lt, dur, t) { const p = clamp(lt / (dur * .95), 0, 1), u = .5 + .4 * p; const [x, y] = bolaAire(u, t); capa(1, t); marcas.forEach((m, i) => { const ui = .52 + i * .1; m.m.visible = u > ui; if (u > ui) { const [mx, my] = ruta(ui); m.m.position.set(mx + 6, my + 7, -4); rotular(m, ['+1'], '#ffffff', '#f77622', 34, { borde: '#fee761' }); } });
          mira(c, [lerp(4, 18, p), lerp(76, 56, p), 150], [lerp(4, 18, p), lerp(38, 22, p), -10], 0); },
        // llega a la costa caliente, roja, junto a las casas; brilla y el sol luce
        foehn(lt, dur, t) { const p = clamp(lt / (dur * .5), 0, 1), u = .9 + .1 * ss(p); const [x, y] = bolaAire(u, t); capa(1, t); M.ini(); for (let i = 0; i < 14; i++) { const a = i / 14 * 6.28 + t; M.pon(x + Math.cos(a) * (6 + Math.sin(t * 4) * .5), y + Math.sin(a) * 6, -10, .8, .8, .8, P.yellow); } M.fin();
          const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(14, 34, k), lerp(52, 34, k), lerp(116, 84, k)], [lerp(14, 34, k), lerp(16, 9, k), -10], .1); },
      } };
  },
  // —— viento sur 3: el caserío en la ladera verde, ovejas, montes y la veleta del tejado que gira al sur ——
  caserio: () => {
    const s = new THREE.Scene(); s.background = cielo([P.blue, 0x7fc8ff, 0xd8f6ff]); s.fog = new THREE.Fog(0xd8f6ff, 140, 320);
    luces(s, { cielo: 0xe8f4ff, suelo: 0x3e8948, amb: 1.5, sol: 0xfff1d6, int: 2.0, dir: [-40, 70, 60], sombra: 80 });
    const alt = (x, z) => Math.max(0, z < -40 ? (-40 - z) * .5 + Math.sin(x * .05) * 6 : 0);
    const v = new Vox(); for (let x = -90; x < 90; x++) for (let z = -180; z < 60; z++) { const H2 = Math.round(alt(x, z)); v.set(x, H2, z, hsh(x >> 1, 9, z >> 1) > .9 ? P.yellow : (hsh(x >> 2, 8, z >> 2) > .5 ? P.green : P.lime)); if (H2 > 0) v.set(x, H2 - 1, z, P.dgreen); }
    for (let x = -60; x < 60; x += 3) v.box(x, 1, 30, x + 1, 4, 31, P.dbrown); v.box(-60, 3, 30, 60, 4, 31, P.brown);   // cercado
    for (const [x, z] of [[-40, -10], [44, -20], [-56, -60], [60, -70]]) { v.box(x, 0, z, x + 2, 10, z + 2, P.dbrown); v.ball(x + 1, 14, z + 1, 5, P.dgreen); }
    s.add(v.build());
    const ca = actor('caserio', 1); ca.position.set(0, 0, -10); s.add(ca); const ve = actor('veleta', 1); ve.position.set(9, 24, -11); s.add(ve); const fl = ve.getObjectByName('flecha');
    const B = new Bloques(200, true), O = new Bloques(60); s.add(B.im, O.im);
    const ovejas = t => { O.ini(); for (let i = 0; i < 6; i++) { const x = -30 + i * 11 + Math.sin(t * .3 + i) * 2, z = 14 + (i % 2) * 6; O.pon(x, 1.6, z, 3.2, 2.2, 2, P.white); O.pon(x + 2, 2.2, z, 1.2, 1.4, 1.2, P.ink); for (const dx of [-1, 1]) O.pon(x + dx, .4, z, .5, .8, .5, P.ink); } O.fin(); };
    const c = cam(46);
    return { s, c, upd(t) { ovejas(t); fl.rotation.y = Math.sin(t) * .4; B.ini(); rachas(B, -50, 50, 6, 40, -100, 25, t, 40, 40); B.fin(); mira(c, [Math.sin(t * .1) * 6, 26, 66], [0, 16, -10], .1); },
      acc: {
        // la veleta gira deprisa con las rachas y se queda apuntando al sur, hacia los montes de donde viene el viento
        veleta(lt, dur, t) { ovejas(t); const k = clamp(lt / (dur * .55), 0, 1); fl.rotation.y = k < 1 ? lt * 9 * (1 - k) + ss(k) * (Math.PI / 2) : Math.PI / 2 + Math.sin(t * 6) * .06;
          B.ini(); rachas(B, -50, 50, 6, 40, -100, 25, t, 70, 50); B.fin(); const kc = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-8, 8, kc), lerp(30, 40, kc), lerp(80, 84, kc)], [lerp(0, 6, kc), lerp(24, 44, kc), -10], .1); },
      } };
  },
});

Object.assign(FAB, {
  // —— veda de encuestas ——
  candado: () => {   // candado rojo: arco de acero y cuerpo con ojo de cerradura
    const v = new Vox(); v.box(-6, 0, -2, 7, 10, 3, (x, y) => y === 9 || y === 0 ? P.crimson : P.red); v.box(0, 3, 3, 1, 7, 4, P.ink); v.box(-1, 3, 3, 2, 5, 4, P.ink);
    for (let a = 0; a <= 16; a++) { const an = Math.PI * a / 16, x = Math.round(Math.cos(an) * 4.5), y = 10 + Math.round(Math.sin(an) * 5.5); v.box(x, y, -1, x + 1, y + 1, 2, P.silver); }
    for (const x of [-5, 4]) v.box(x, 10, -1, x + 1, 12, 2, P.silver);
    const w = new THREE.Group(); w.add(v.build({ centrar: true, jit: .02 })); return w; },
  periodico: () => {   // periódico doblado: cabecera negra, columnas grises y una gráfica de barras de colores neutros
    const v = new Vox(); v.box(-10, 0, -7, 10, 1, 7, P.white); v.box(-10, 1, -7, 10, 2, -5, P.ink);
    for (let z = -3; z < 7; z += 2) v.box(-9, 1, z, -1, 1.2, z + 1, P.steel); [[1, 3, P.blue], [3, 6, P.amber], [5, 4, P.lime], [7, 2, P.plum]].forEach(([x, h, c]) => v.box(x, 1, 5 - h * 1.5 | 0, x + 2, 2, 6, c));
    const w = new THREE.Group(); w.add(v.build({ centrar: true, jit: .02 })); return w; },
  sandia: () => { const v = new Vox(); v.ball(0, 0, 0, 5, (x, y, z) => (Math.abs(Math.round(Math.atan2(z, x) * 3)) % 2 ? P.green : P.dgreen), .8); const w = new THREE.Group(); w.add(v.build({ centrar: true, jit: .03 })); return w; },
  naranja: () => { const v = new Vox(); v.ball(0, 0, 0, 3, P.orange); v.set(0, 3, 0, P.green); v.set(1, 3, 0, P.lime); const w = new THREE.Group(); w.add(v.build({ centrar: true, jit: .05 })); return w; },
  // —— Reino de León ——
  corona: () => {   // corona real de oro con piedras rojas y verdes
    const v = new Vox(); for (let a = 0; a < 40; a++) { const an = a / 40 * 6.283, x = Math.round(Math.cos(an) * 7), z = Math.round(Math.sin(an) * 7); v.box(x, 0, z, x + 1, 4, z + 1, P.amber); if (a % 5 === 0) { v.box(x, 4, z, x + 1, 8, z + 1, P.yellow); v.set(x, 8, z, P.white); } if (a % 10 === 2) v.set(x, 2, z, P.red); if (a % 10 === 7) v.set(x, 2, z, P.lime); }
    v.box(-1, 0, -1, 2, 10, 2, P.yellow); v.box(-2, 8, 0, 3, 9, 1, P.yellow); v.luz(P.red, P.lime);
    const w = new THREE.Group(); w.add(v.build({ centrar: true, jit: .03 })); return w; },
  pergamino: () => {   // pergamino con rodillos de madera y renglones de tinta
    const v = new Vox(); v.box(-10, 0, -8, 10, 1, 8, P.sand); for (let z = -6; z < 7; z += 2) v.box(-8, 1, z, 6 - (z * 7 % 5), 1.2, z + 1, P.dbrown); v.box(-6, 1, -7, 6, 1.2, -6, P.crimson);
    for (const z of [-9, 8]) v.box(-12, 0, z, 12, 2, z + 1, P.brown); const w = new THREE.Group(); w.add(v.build({ centrar: true, jit: .03 })); return w; },
  estandarte: () => {   // estandarte morado con un león rampante sencillo, en su mástil
    const v = new Vox(); v.box(0, 0, 0, 1, 24, 1, P.dbrown); v.set(0, 24, 0, P.amber); v.box(1, 12, 0, 11, 23, 1, P.plum);
    for (const [x, y] of [[4, 14], [5, 15], [6, 15], [5, 16], [6, 16], [7, 16], [5, 17], [6, 17], [6, 18], [7, 19], [6, 20], [7, 20], [8, 21], [4, 16], [8, 17], [8, 15]]) v.set(x, y, 1, P.white);
    const w = new THREE.Group(); w.add(v.build({ centrar: false, jit: .02 })); return w; },
});

Object.assign(FABE, {
  // —— encuestas 1: la redacción de un periódico: mesas, pantallas y la gran pantalla de la encuesta ——
  redaccion: () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(P.night); s.fog = new THREE.Fog(P.night, 120, 240);
    luces(s, { cielo: 0xeef4ff, suelo: 0x3a4466, amb: 1.4, sol: 0xffffff, int: 1.6, dir: [-20, 70, 60], sombra: 70 });
    const v = new Vox(); v.box(-70, -1, -50, 70, 0, 60, (x, y, z) => ((x >> 3) + (z >> 3)) % 2 ? P.slate : P.dslate); v.box(-70, 0, -52, 70, 60, -50, (x, y) => y % 12 === 0 ? P.slate : P.steel);
    for (let x = -66; x < 66; x += 12) v.box(x, 44, -50, x + 8, 56, -49, P.cyan); v.luz(P.cyan);   // ventanales con la ciudad
    for (const z of [-10, 12]) for (const x of [-36, -12, 12, 36]) { v.box(x - 8, 0, z, x + 8, 8, z + 6, P.dbrown); v.box(x - 9, 8, z - 1, x + 9, 9, z + 7, P.brown); v.box(x - 3, 9, z, x + 3, 14, z + 1, P.ink); v.box(x - 1, 9, z + 1, x + 1, 10, z + 3, P.ink); }
    s.add(v.build());
    const mon = []; for (const z of [-10, 12]) for (const x of [-36, -12, 12, 36]) { const p = pantalla(5, 4, 40, 32); p.m.position.set(x, 11.6, z + 1.1); s.add(p.m); mon.push(p); }
    const big = pantalla(44, 24, 352, 192); big.m.position.set(0, 30, -49); s.add(big.m); const cal = pantalla(14, 16, 112, 128); cal.m.position.set(46, 26, -49); s.add(cal.m);
    const cand = actor('candado', 1.1); s.add(cand); const per = actor('periodico', .8); per.position.set(-12, 10, 15); s.add(per);
    const Pp = new Bloques(40), H = new Bloques(60); s.add(Pp.im, H.im);
    const barras = (k, gris) => { const { g, cv, tex } = big; const kk = `${(k * 40) | 0}${gris}`; if (big._k === kk) return; big._k = kk; g.fillStyle = gris ? '#3a4466' : '#ffffff'; g.fillRect(0, 0, cv.width, cv.height);
      g.fillStyle = gris ? '#8b9bb4' : '#181425'; g.font = 'bold 26px monospace'; g.textAlign = 'center'; g.fillText('ENCUESTA', cv.width / 2, 30);
      ['#0099db', '#feae34', '#63c74d', '#b55088', '#e43b44'].forEach((c, i) => { const hh = [.7, .55, .4, .3, .2][i] * 130 * k; g.fillStyle = gris ? '#5a6988' : c; g.fillRect(40 + i * 60, 180 - hh, 44, hh); }); tex.needsUpdate = true; };
    const gente = t => { Pp.ini(); [[-36, 18], [-12, -4], [12, 18], [36, -4], [24, 30]].forEach(([x, z], i) => persona(Pp, x + (i === 4 ? Math.sin(t * .6) * 20 : 0), 0, z, [P.navy, P.teal, P.plum, P.crimson, P.amber][i], { s: .9 })); Pp.fin(); };
    const dia = d => rotular(cal, ['NOV', d], ['#ffffff', '#181425'], '#e43b44', 34, { borde: '#ffffff' });
    const c = cam(46);
    return { s, c, upd(t) { gente(t); barras(1, false); cand.visible = false; H.ini(); H.fin(); dia('LUN 23'); mon.forEach((p, i) => rotular(p, [i % 2 ? '▮▮' : '▮'], '#2ce8f5', '#124e89', 14)); mira(c, [Math.sin(t * .1) * 5, 30, 96], [0, 22, -20], .1); },
      acc: {
        // la gráfica de la encuesta crece en la gran pantalla y un candado rojo cae encima: la pantalla se apaga en gris
        sellar(lt, dur, t) { const k = clamp(lt / 1, 0, 1), f = clamp((lt - 1.2) / .5, 0, 1); barras(ss(k), f >= 1); cand.visible = lt > 1.2; cand.position.set(0, lerp(70, 28, f * f), -45); cand.rotation.z = (1 - f) * .6 + (f >= 1 ? Math.sin((lt - 1.7) * 18) * Math.exp(-(lt - 1.7) * 5) * .2 : 0);
          const kc = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-6, 0, kc), lerp(30, 30, kc), lerp(100, 78, kc)], [0, 26, -40], .1); },
        // el calendario de la pared pasa sus hojas, que salen volando, hasta el domingo 29
        calendario(lt, dur, t) { barras(1, true); cand.visible = true; cand.position.set(0, 28, -45); const DIAS = ['LUN 23', 'MAR 24', 'MIÉ 25', 'JUE 26', 'VIE 27', 'SÁB 28', 'DOM 29'], n = Math.min(6, Math.floor(lt / (dur * .7) * 6.99)); dia(DIAS[n]);
          H.ini(); for (let i = 0; i < n; i++) { const u = clamp((lt - i * dur * .7 / 7) / 1.2, 0, 1); if (u < 1) H.pon(46 + u * 20 - i, 26 - u * 30, -48 + u * 30, 12, .3, 10, P.white, u * 5); } H.fin();
          const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(10, 40, k), 34, lerp(90, 66, k)], [lerp(20, 44, k), 32, -48], .1); },
      } };
  },
  // —— encuestas 2: el colegio electoral en un gimnasio: canasta, mesas con urnas de cristal, cabinas y la tira de días ——
  colegio: () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(P.umber); s.fog = new THREE.Fog(P.umber, 120, 240);
    luces(s, { cielo: 0xfff1d6, suelo: 0x733e39, amb: 1.5, sol: 0xfff1d6, int: 1.6, dir: [20, 70, 60], sombra: 70 });
    const v = new Vox(); v.box(-70, -1, -50, 70, 0, 60, (x, y, z) => (z % 5 === 0) ? P.brown : P.tan); for (let x = -60; x < 60; x++) { v.set(x, 0, 20, P.white); } v.box(-70, 0, -52, 70, 50, -50, (x, y) => y < 14 ? P.navy : P.sand);
    v.box(-2, 26, -50, 2, 40, -46, P.steel); v.box(-8, 30, -46, 8, 40, -45, P.white); v.box(-3, 30, -45, 3, 31, -40, P.orange);   // canasta
    for (const x of [-28, 0, 28]) { v.box(x - 10, 0, -8, x + 10, 8, 0, P.white); v.box(x - 11, 8, -9, x + 11, 9, 1, P.silver); }
    for (const x of [50, 58]) { v.box(x - 3, 0, -30, x + 3, 16, -24, P.steel); v.box(x - 3, 2, -24, x + 3, 15, -23, (X, y) => (X + y) % 3 ? P.navy : P.blue); }
    s.add(v.build());
    const vid = new THREE.MeshBasicMaterial({ color: 0xd8f6ff, transparent: true, opacity: .35, depthWrite: false }); const urnas = [-28, 0, 28].map(x => { const m = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 6), vid); m.position.set(x, 12, -4); s.add(m); return m; });
    const tiras = ['MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map((d, i) => { const p = pantalla(9, 7, 72, 56); p.m.position.set(-27.5 + i * 11, 22, -49); s.add(p.m); return [p, d]; });
    const preg = pantalla(10, 8, 80, 64); s.add(preg.m); const panel = pantalla(26, 15, 208, 120); s.add(panel.m); const cand = actor('candado', .5); s.add(cand);
    const Pp = new Bloques(80), Pa = new Bloques(80); s.add(Pp.im, Pa.im);
    const dias = n => tiras.forEach(([p, d], i) => rotular(p, [d, i === 5 ? 'VOTO' : (i < n ? 'NO' : '')], '#ffffff', i === 5 ? '#3e8948' : (i < n ? '#e43b44' : '#5a6988'), 20, { borde: '#ffffff' }));
    const cola = (t, mueve) => { Pp.ini(); Pa.ini(); for (let i = 0; i < 9; i++) { const x = -28 + (i % 3) * 28, u = mueve ? ((t * .25 + i * .37) % 1) : (i / 9); const z = lerp(40, 3, u); persona(Pp, x + (i % 2 ? 2 : -2), 0, z, [P.navy, P.red, P.teal, P.plum, P.amber, P.green, P.pink, P.slate, P.dbrown][i], { s: .9 });
        if (mueve && u > .85) Pa.pon(x, lerp(14, 10, (u - .85) / .15), -4, 2, .2, 1.4, P.white); } Pp.fin(); Pa.fin(); };
    const grafico = (k, x) => { const { g, cv, tex } = panel; const kk = `${(k * 30) | 0}${x}`; if (panel._k === kk) return; panel._k = kk; g.fillStyle = '#ffffff'; g.fillRect(0, 0, cv.width, cv.height);
      ['#0099db', '#feae34', '#63c74d', '#b55088'].forEach((c, i) => { const hh = [.8, .6, .45, .3][(i + ((k * 3) | 0)) % 4] * 90 * Math.min(1, k * 2); g.fillStyle = c; g.fillRect(24 + i * 44, 110 - hh, 32, hh); });
      if (x) { g.strokeStyle = '#e43b44'; g.lineWidth = 12; g.beginPath(); g.moveTo(10, 10); g.lineTo(198, 110); g.moveTo(198, 10); g.lineTo(10, 110); g.stroke(); } tex.needsUpdate = true; };
    const c = cam(46);
    return { s, c, upd(t) { dias(0); cola(t, true); preg.m.visible = false; panel.m.visible = false; cand.visible = false; mira(c, [Math.sin(t * .1) * 5, 44, 110], [0, 10, 0], .05); },
      acc: {
        // el gimnasio vacío; sobre las urnas aparece un gran interrogante
        pregunta(lt, dur, t) { cola(t, false); Pp.ini(); Pp.fin(); preg.m.visible = true; preg.m.position.set(0, 24 + Math.sin(t * 2), -2); rotular(preg, [Math.floor(t * 2) % 2 ? '?' : '¿?'], '#ffffff', '#e43b44', 40, { borde: '#ffffff' });
          const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-30, 0, k), lerp(46, 40, k), lerp(116, 96, k)], [0, 12, -6], .06); },
        // la tira de la pared: de martes a sábado las casillas se ponen en rojo una a una; el domingo, en verde
        cinco_dias(lt, dur, t) { cola(t, false); dias(Math.min(5, Math.floor(lt / (dur * .75) * 5) + 1)); const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-14, 0, k), 26, lerp(60, 48, k)], [lerp(-14, 0, k), 22, -49], .08); },
        // un panel de encuesta se acerca a la fila de votantes, lo tacha una X roja y desaparece; la gente vota tranquila
        condicionar(lt, dur, t) { dias(5); cola(t, true); const k = ss(clamp(lt / 1.2, 0, 1)), x = lt > 1.5, out = clamp((lt - 2.2) / .6, 0, 1); panel.m.visible = out < 1; panel.m.position.set(0, lerp(50, 30, k) + out * 30, lerp(-40, 14, k)); grafico(clamp(lt / 1.5, 0, 1), x);
          mira(c, [6, 32, 116], [0, 24, 6], .1); },
        // una encuestadora pregunta en la calle, las barras crecen... y el candado cierra el gráfico: no se puede publicar
        encuestar(lt, dur, t) { dias(5); Pp.ini(); persona(Pp, -6 + Math.sin(lt) * 2, 0, 30, P.lime, { s: 1, movil: P.white }); for (let i = 0; i < 5; i++) persona(Pp, 2 + i * 4, 0, 26 + (i % 2) * 4, [P.navy, P.red, P.teal, P.plum, P.amber][i], { s: .9 }); Pp.fin(); Pa.ini(); Pa.fin();
          panel.m.visible = true; panel.m.position.set(4, 24, 24); grafico(clamp(lt / (dur * .5), .05, 1), false); cand.visible = lt > dur * .55; const f = clamp((lt - dur * .55) / .4, 0, 1); cand.position.set(4, lerp(50, 23, f * f), 25);
          const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-10, 6, k), 28, lerp(116, 104, k)], [2, 20, 24], .1); },
      } };
  },
  // —— encuestas 3: un valle de Andorra: montañas, casas de piedra con pizarra, un puesto de fruta y el quiosco ——
  andorra: () => {
    const s = new THREE.Scene(); s.background = cielo([P.blue, 0x7fc8ff, 0xd8f6ff]); s.fog = new THREE.Fog(0xd8f6ff, 150, 340);
    luces(s, { cielo: 0xe8f4ff, suelo: 0x3e8948, amb: 1.5, sol: 0xfff1d6, int: 2.0, dir: [-30, 70, 60], sombra: 90 });
    const alt = (x, z) => { const d = Math.abs(x) - 26; return d > 0 ? Math.min(90, d * 1.2 + Math.sin(z * .08 + x * .03) * 6) : 0; };
    const v = new Vox(); for (let x = -100; x < 100; x++) for (let z = -200; z < 60; z++) { const zz = z < -60 ? 0 : 1; let H2 = Math.round(alt(x, z) + (z < -80 ? (-80 - z) * .6 : 0)); H2 = Math.max(0, H2);
      v.set(x, H2, z, H2 > 60 ? P.white : H2 > 30 ? (hsh(x, z, 2) > .5 ? P.steel : P.slate) : (H2 > 0 ? (hsh(x >> 2, 4, z >> 2) > .5 ? P.dgreen : P.green) : (Math.abs(x) < 4 ? P.slate : P.green))); if (H2 > 0) v.set(x, H2 - 1, z, P.dgreen); }
    const casa = (x, z) => { v.box(x, 0, z, x + 12, 10, z + 10, (X, Y, Z) => hsh(X, Y, Z) > .5 ? P.steel : P.silver); v.box(x + 4, 0, z + 10, x + 7, 6, z + 11, P.dbrown); v.box(x + 9, 5, z + 10, x + 11, 8, z + 11, P.amber); for (let k = 0; k < 5; k++) v.box(x - 1, 10 + k, z - 1 + k, x + 13, 11 + k, z + 11 - k, P.dslate); };
    casa(-22, -30); casa(10, -36); casa(-18, -60); casa(12, -66);
    v.box(-14, 0, 6, 14, 6, 12, P.dbrown); v.box(-15, 6, 5, 15, 7, 13, P.brown); for (let x = -15; x < 15; x++) v.box(x, 16, 4, x + 1, 17, 14, ((x + 15) >> 2) % 2 ? P.red : P.white); for (const x of [-15, 14]) v.box(x, 0, 12, x + 1, 16, 13, P.dbrown);   // puesto
    v.box(20, 0, 0, 30, 14, 8, P.dgreen); v.box(19, 14, -1, 31, 15, 9, P.lime); s.add(v.build());
    const san = Array.from({ length: 5 }, () => { const m = actor('sandia', .5); s.add(m); return m; }), nar = Array.from({ length: 8 }, () => { const m = actor('naranja', .5); s.add(m); return m; });
    const F = new Bloques(60); s.add(F.im); const per = actor('periodico', .9); s.add(per); const hoja = pantalla(16, 11, 192, 132); s.add(hoja.m);
    const c = cam(46);
    const pila = (k, t) => { F.ini(); const H = [5, 3, 4, 2]; const pos = [-10, -3.5, 3.5, 10];
      for (let i = 0; i < 5; i++) { const on = i < Math.round(H[0] * k); san[i].visible = on; san[i].position.set(pos[0], 9.5 + i * 3.6, 9); san[i].rotation.y = i; }
      for (let i = 0; i < 8; i++) { const col = i < 4 ? 1 : 2, j = i % 4, n = col === 1 ? H[1] : H[2]; const on = j < Math.round(n * k); nar[i].visible = on; nar[i].position.set(pos[col] + (col === 2 ? 0 : 0), 8.5 + j * 2.8, 9); }
      for (let j = 0; j < Math.round(H[3] * k); j++) F.pon(pos[3], 8.5 + j * 2.6, 9, 2.4, 2.4, 2.4, P.yellow); F.fin(); };
    const papel = () => { const { g, cv, tex } = hoja; if (hoja._k) return; hoja._k = 1; g.fillStyle = '#ffffff'; g.fillRect(0, 0, cv.width, cv.height); g.fillStyle = '#181425'; g.fillRect(0, 0, cv.width, 26); g.fillStyle = '#ffffff'; g.font = 'bold 20px monospace'; g.textAlign = 'center'; g.fillText('MERCADO', cv.width / 2, 19);
      [['#265c42', 4], ['#f77622', 3], ['#f77622', 3.6], ['#fee761', 2]].forEach(([c, h], i) => { for (let k = 0; k < h; k++) { g.fillStyle = c; g.beginPath(); g.arc(40 + i * 38, 118 - k * 20, 9, 0, 6.3); g.fill(); } }); tex.needsUpdate = true; };
    return { s, c, upd(t) { pila(1, t); per.position.set(25, 15.6, 4); per.rotation.y = Math.sin(t * .5) * .2; hoja.m.visible = false; mira(c, [Math.sin(t * .1) * 6, 30, 76], [0, 16, -10], .1); },
      acc: {
        // en el puesto, las frutas se apilan como las barras de una encuesta; en el quiosco, el periódico sale con su «gráfica» de frutas
        frutas(lt, dur, t) { const k = clamp(lt / (dur * .55), 0, 1); pila(k, t); papel(); const f = ss(clamp((lt - dur * .45) / .8, 0, 1)); hoja.m.visible = f > 0; hoja.m.position.set(lerp(25, 0, f), lerp(16, 30, f), lerp(4, 10, f)); hoja.m.scale.setScalar(Math.max(.05, f));
          const kc = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-10, 2, kc), lerp(24, 28, kc), lerp(66, 84, kc)], [0, lerp(16, 24, kc), 6], .1); },
      } };
  },
});

Object.assign(FABE, {
  // —— Reino de León 1: estadio de día, grada blanca, el banquillo y el letrero de la tribuna ——
  reino: () => {
    const s = new THREE.Scene(); s.background = cielo([P.blue, 0x7fc8ff, 0xd8f6ff]); s.fog = new THREE.Fog(0xd8f6ff, 150, 320);
    luces(s, { cielo: 0xe8f4ff, suelo: 0x3e8948, amb: 1.5, sol: 0xfff1d6, int: 1.9, dir: [-30, 80, 50], sombra: 90 });
    const zg = -30, v = new Vox(); cesped(v, -64, 64, -40, 70, zg);
    for (let k = 0; k < 10; k++) { v.box(-80, k * 2.5, -44 - k * 3, 80, k * 2.5 + 2.5, -41 - k * 3, k % 3 === 2 ? P.red : P.white); for (const sx of [-1, 1]) v.box(sx > 0 ? 66 + k * 3 : -69 - k * 3, k * 2.5, -44, sx > 0 ? 69 + k * 3 : -66 - k * 3, k * 2.5 + 2.5, 80, k % 3 === 2 ? P.red : P.silver); }
    v.box(-80, 25, -75, 80, 27, -40, P.slate); for (let x = -78; x < 80; x += 12) v.box(x, 0, -76, x + 1, 25, -75, P.steel);   // cubierta de la tribuna
    v.box(-12, 0, 14, 12, 1, 22, P.slate); v.box(-12, 1, 21, 12, 7, 22, P.navy); v.box(-13, 7, 13, 13, 8, 23, P.cyan);   // banquillo con techo
    for (let x = -10; x < 11; x += 3) v.box(x, 1, 18, x + 2, 3, 20, P.red); s.add(v.build());
    const por = new Vox(); for (const x of [-8, 7]) por.box(x, 0, 0, x + 1, 5, 1, P.white); por.box(-8, 5, 0, 8, 6, 1, P.white); for (let x = -7; x < 7; x++) for (let y = 0; y < 5; y++) if ((x + y) % 2 === 0) por.set(x, y, -4, P.silver); const gp = por.build({ jit: .02 }); gp.position.set(0, 0, zg); s.add(gp);
    const bal = new Bloques(4), G = new Bloques(1200), Pp = new Bloques(60); s.add(bal.im, G.im, Pp.im);
    const marc = pantalla(30, 11, 240, 88); marc.m.position.set(40, 34, -52); s.add(marc.m); const letr = pantalla(38, 4.75, 448, 56); letr.m.position.set(0, 30.5, -40.2); s.add(letr.m);
    const COLS = [P.white, P.white, P.white, P.silver, P.red, P.skin, P.navy];
    const grada = (t, salto) => { G.ini(); for (let k = 0; k < 10; k++) for (let x = -78; x < 78; x += 2.4) { const j = salto ? Math.abs(Math.sin(t * 9 + x * .7 + k)) * 1.2 : 0; G.pon(x, k * 2.5 + 3 + j, -42.5 - k * 3, 1.4, 1.6, 1.2, COLS[(hsh(x * 10 | 0, k, 1) * COLS.length) | 0]); } G.fin(); };
    const score = a => rotular(marc, [`CYD ${a}-0 ZAM`], '#ffffff', '#181425', 30, { borde: '#fee761' });
    const balon = (x, y, z) => { bal.ini(); bal.pon(x, y, z, 2, 2, 2, P.white); bal.fin(); };
    const c = cam(46);
    return { s, c, upd(t) { grada(t, false); score(2); balon(0, .7, zg + 30); Pp.ini(); persona(Pp, 0, 1, 18, P.ink, { s: .6 }); Pp.fin(); rotular(letr, ['REINO DE LEÓN'], '#fee761', '#a22633', 40, { borde: '#ffffff' }); mira(c, [Math.sin(t * .1) * 4, 18, 50], [0, 6, zg], .08); },
      acc: {
        // dos goles seguidos: el balón entra, la red tiembla, la grada salta y el marcador pasa a 1-0 y a 2-0
        goles(lt, dur, t) { const g1 = clamp((lt - .3) / .7, 0, 1), g2 = clamp((lt - 1.9) / .7, 0, 1), n = (g1 >= 1 ? 1 : 0) + (g2 >= 1 ? 1 : 0); grada(t, n > 0 && (lt < 1.7 || lt > 2.6)); score(n);
          const f = g2 > 0 ? g2 : g1, sx = g2 > 0 ? 8 : -9, ex = g2 > 0 ? -5 : 5; balon(lerp(sx, ex, f), lerp(.7, 3.5, f) + Math.sin(f * Math.PI) * 2, lerp(zg + 24, zg - 2, f));
          Pp.ini(); persona(Pp, lerp(0, g2 > 0 ? -5 : 5, ss(f)), 0, zg + 1, P.lime, { s: .58, ag: f * .4 }); persona(Pp, sx - 1, 0, zg + 26, P.white, { s: .58 }); persona(Pp, -3, 0, zg + 12, P.red, { s: .58 }); persona(Pp, 6, 0, zg + 15, P.red, { s: .58 });
          if (n) for (let i = 0; i < 3; i++) persona(Pp, sx - 3 + i * 2.5, Math.abs(Math.sin(t * 8 + i)) * 1.5, zg + 22 - i, P.white, { s: .58 }); Pp.fin();
          mira(c, [lerp(-6, 6, ss(clamp(lt / dur, 0, 1))), 13, zg + 42], [0, 4, zg + 2], .04); },
        // en el banquillo, el nuevo entrenador salta y los suplentes se levantan a celebrarlo
        banquillo(lt, dur, t) { grada(t, true); score(2); balon(30, .7, -10); Pp.ini(); persona(Pp, 0, 1 + Math.abs(Math.sin(t * 7)) * 1.6, 25, P.ink, { s: .7, pelo: P.dslate }); for (let i = 0; i < 6; i++) persona(Pp, -9 + i * 3.6, 1 + (lt > .8 ? Math.abs(Math.sin(t * 8 + i)) : 0), 19, P.white, { s: .6, ag: lt > .8 ? 0 : .4 }); Pp.fin();
          const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(26, 14, k), lerp(16, 15, k), lerp(84, 76, k)], [0, 6, 18], .06); },
        // la cámara sube por la grada hasta el letrero de la tribuna: REINO DE LEÓN, que destella
        letrero(lt, dur, t) { grada(t, false); score(2); const fl = Math.floor(t * 4) % 2; rotular(letr, ['REINO DE LEÓN'], fl ? '#fee761' : '#ffffff', '#a22633', 40, { borde: '#fee761' });
          const k = ss(clamp(lt / dur, 0, 1)); mira(c, [0, lerp(14, 26, k), lerp(40, 52, k)], [0, lerp(8, 27, k), lerp(zg, -40, k)], .06); },
      } };
  },
  // —— Reino de León 2: la ciudad amurallada de León hacia el año 910, con estandartes; al fondo, Zamora junto a su río ——
  corte: () => {
    const s = new THREE.Scene(); s.background = cielo([0x7fc8ff, 0xfee0b0, 0xf6a070]); s.fog = new THREE.Fog(0xfee0b0, 200, 520);
    luces(s, { cielo: 0xfff1d6, suelo: 0x3e8948, amb: 1.4, sol: 0xffd8a0, int: 1.9, dir: [-60, 50, 40], sombra: 100 });
    const v = new Vox(); for (let x = -120; x < 120; x++) for (let z = -330; z < 70; z++) { const rio = Math.abs(z + 250 + Math.sin(x * .05) * 8) < 5; v.set(x, -1, z, rio ? P.blue : (hsh(x >> 3, 2, z >> 3) > .6 ? 0xc8b46a : (hsh(x >> 2, 3, z >> 2) > .5 ? P.green : 0x7a9a3a))); }
    const muralla = (cx, cz, r, hh) => { for (let a = 0; a < 64; a++) { const an = a / 64 * 6.283, x = Math.round(cx + Math.cos(an) * r), z = Math.round(cz + Math.sin(an) * r * .8); v.box(x, 0, z, x + 2, hh, z + 2, (X, Y) => Y === hh - 1 && (X + z) % 2 ? P.sand : P.tan); if (a % 8 === 0) v.cyl(x, z, 0, hh + 3, 2.5, P.sand); }
      for (let i = 0; i < 26; i++) { const an = hsh(i, cx, 1) * 6.283, d = hsh(i, cx, 2) * r * .75, x = Math.round(cx + Math.cos(an) * d), z = Math.round(cz + Math.sin(an) * d * .8); v.box(x, 0, z, x + 5, 5, z + 5, P.white); v.box(x, 5, z, x + 5, 6, z + 5, P.red); } };
    muralla(0, -20, 34, 9); v.box(-8, 0, -30, 8, 18, -16, P.sand); v.box(-9, 18, -31, 9, 19, -15, P.tan); for (const [x, z] of [[-8, -30], [6, -30], [-8, -18], [6, -18]]) v.box(x, 18, z, x + 2, 24, z + 2, P.sand);   // palacio
    muralla(-40, -250, 22, 7); s.add(v.build());
    const cor = actor('corona', 1.4); s.add(cor); const est = [[-16, -14], [16, -14], [-30, -2], [30, -2]].map(([x, z]) => { const m = actor('estandarte', 1); m.position.set(x, 0, z); s.add(m); return m; });
    const T = new Bloques(500, true); s.add(T.im); const lb = ['LEÓN', 'ZAMORA'].map(n => { const p = pantalla(52, 14, 208, 56); rotular(p, [n], '#ffffff', '#68386c', 34, { borde: '#fee761' }); s.add(p.m); return p; });
    const c = cam(46);
    return { s, c, upd(t) { cor.position.set(0, 40 + Math.sin(t * 1.5), -22); cor.rotation.y = t * .6; est.forEach(m => m.position.y = 0); T.ini(); T.fin(); lb.forEach(p => p.m.visible = false); mira(c, [Math.sin(t * .1) * 6, 50, 90], [0, 12, -22], .1); },
      acc: {
        // la corona baja del cielo y se posa sobre el palacio de León; los estandartes morados suben en sus mástiles
        capital(lt, dur, t) { const f = ss(clamp(lt / (dur * .6), 0, 1)); cor.position.set(0, lerp(90, 30, f) + Math.sin(t * 1.5) * .6, -22); cor.rotation.y = t * .8; est.forEach((m, i) => m.position.y = lerp(-26, 0, ss(clamp((lt - .3 - i * .25) / .8, 0, 1))));
          const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-20, 6, k), lerp(50, 62, k), lerp(116, 126, k)], [0, lerp(22, 20, k), -22], .1); },
        // la cámara sube: el reino se pinta de morado desde León hasta Zamora, junto a su río
        mapa(lt, dur, t) { cor.position.set(0, 34, -22); cor.rotation.y = t * .8; const k = ss(clamp(lt / (dur * .8), 0, 1)); T.ini(); for (let i = 0; i < 26; i++) { const u = clamp(k * 26 - i, 0, 1); if (u <= 0) continue; const z = -20 - i * 9, x = lerp(0, -40, i / 26); T.pon(x, .2, z, 30 * u + 10, .2, 10, P.plum); } T.fin();
          lb[0].m.visible = true; lb[0].m.position.set(0, 46, -10); lb[1].m.visible = k > .6; lb[1].m.position.set(-40, 40, -236); lb.forEach(p => p.m.lookAt(c.position));
          mira(c, [lerp(10, 0, k), lerp(70, 200, k), lerp(70, 60, k)], [lerp(0, -20, k), 0, lerp(-30, -130, k)], .06); },
      } };
  },
  // —— Reino de León 3: las Cortes de 1188 en una sala románica: el rey, los obispos, los nobles y los ciudadanos ——
  cortes: () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(P.umber); s.fog = new THREE.Fog(P.umber, 110, 220);
    luces(s, { cielo: 0xffe8c8, suelo: 0x733e39, amb: 1.3, sol: 0xffd8a0, int: 1.7, dir: [30, 60, 60], sombra: 70 });
    const v = new Vox(); v.box(-50, -1, -50, 50, 0, 60, (x, y, z) => ((x >> 2) + (z >> 2)) % 2 ? P.tan : P.sand); v.box(-50, 0, -52, 50, 50, -50, P.sand);
    for (const x of [-40, -20, 0, 20, 40]) { if (x) v.box(x - 2, 0, -50, x + 2, 26, -46, P.tan); }
    for (let x = -40; x < 40; x++) { const m = ((x + 40) % 20) - 10; const y = 26 + Math.round(Math.sqrt(Math.max(0, 100 - m * m))); v.box(x, y, -50, x + 1, y + 2, -46, (x % 2) ? P.red : P.amber); v.box(x, y + 2, -50, x + 1, 50, -49, P.sand); }
    for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) v.box(sd > 0 ? 10 + k * 5 : -13 - k * 5, 0, -20, sd > 0 ? 13 + k * 5 : -10 - k * 5, 3 + k, 30, P.dbrown);   // bancos
    v.box(-8, 0, -46, 8, 3, -36, P.crimson); v.box(-4, 3, -44, 4, 15, -40, P.amber); v.box(-5, 3, -41, 5, 6, -38, P.amber); v.luz(P.amber);   // trono
    v.box(-6, 0, -4, 6, 7, 6, P.dbrown); v.box(-7, 7, -5, 7, 8, 7, P.brown); s.add(v.build());
    const rey = new Bloques(4), Pp = new Bloques(120); s.add(rey.im, Pp.im); const cor = actor('corona', .32); s.add(cor); const per = actor('pergamino', .7); s.add(per);
    for (const [x, z] of [[-30, -40], [30, -40]]) { const m = actor('estandarte', 1.1); m.position.set(x, 0, z); s.add(m); }
    const lamp = new THREE.PointLight(0xfeae34, 50, 60, 1.4); lamp.position.set(0, 30, 0); s.add(lamp);
    const sentados = k => { Pp.ini(); const grupos = [[-1, P.white, P.ink], [-1, P.crimson, P.dbrown], [1, P.plum, P.amber], [1, P.green, P.dbrown], [1, P.brown, P.ink], [-1, P.navy, P.dbrown]];
      grupos.forEach(([sd, ropa, pelo], gi) => { const fila = gi % 3; for (let i = 0; i < 6; i++) { const u = clamp(k * 1.6 - (gi * 6 + i) / 36, 0, 1); if (u <= 0) continue; const xf = sd * (11.5 + fila * 5), zf = -16 + i * 7.5; persona(Pp, xf, lerp(0, 3 + fila, u), lerp(56, zf, u), ropa, { s: .8, pelo, ag: u >= 1 ? .3 : 0 }); } }); Pp.fin(); };
    const c = cam(46);
    return { s, c, upd(t) { rey.ini(); rey.pon(0, 7.5, -41, 3, 6, 2, P.plum); rey.pon(0, 11.6, -41, 2.4, 2.4, 2.2, P.skin); rey.pon(0, 13, -41.2, 2.5, 1, 2.3, P.white); rey.fin(); cor.position.set(0, 14.5, -41); cor.rotation.y = t * .5;
        sentados(1); per.position.set(0, 8.8, 1); per.scale.set(.7, .7, .7); mira(c, [Math.sin(t * .1) * 4, 30, 80], [0, 12, -16], .1); },
      acc: {
        // entran los representantes y se sientan en los bancos; sobre la mesa se desenrolla el pergamino de los decretos
        cortes(lt, dur, t) { sentados(clamp(lt / (dur * .7), 0, 1)); const f = ss(clamp((lt - dur * .3) / 1, 0, 1)); per.scale.set(.7 * Math.max(.05, f), .7, .7);
          const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-8, 4, k), lerp(32, 26, k), lerp(90, 60, k)], [0, lerp(12, 10, k), lerp(-16, -10, k)], .1); },
      } };
  },
});

// ———————— 24/11/2026: el A350 de fibra de carbono (Air Europa), los Mundiales femeninos de 2031 y 2035 y los tres 1-0 de España ————————
// trocea un Vox en n rodajas por x (para cambiar el avión de metal a carbono pieza a pieza): hijos 'r0'…'r(n-1)'
function rodajas(v, n, x0, x1, o = {}) { const parts = Array.from({ length: n }, () => new Vox());
  for (const [k, c] of v.m) { const x = +k.split(',')[0], i = clamp(Math.floor((x - x0) / (x1 - x0) * n), 0, n - 1); parts[i].m.set(k, c); }
  const w = new THREE.Group(); parts.forEach((p, i) => { v.glow.forEach(c => p.glow.add(c)); const g = p.build({ jit: o.jit ?? .05 }); g.name = 'r' + i; w.add(g); }); return w; }
// A350: fuselaje ancho, alas en flecha con winglets curvados, dos motores grandes, tren de aterrizaje. Morro hacia +x; el eje del fuselaje en y = 0
function a350v(tipo) {   // tipo: 'metal' (blanco), 'carbono' (piel de fibra) o 'viejo' (aluminio pulido, sin winglets, generación anterior)
  const v = new Vox(), CAR = (x, y, z) => ((x + y + z) & 1) ? 0x22222e : 0x3a3a4a;
  const piel = tipo === 'carbono' ? CAR : tipo === 'viejo' ? ((x, y, z) => (x % 4 === 0 ? P.steel : P.silver)) : (() => P.white);
  const ala = tipo === 'carbono' ? CAR : tipo === 'viejo' ? (() => P.steel) : (() => P.silver);
  for (let x = -24; x <= 24; x++) { const r = x > 17 ? 3.3 - (x - 17) * .38 : x < -12 ? 3.3 - (-12 - x) * .2 : 3.3, cy = x < -12 ? (-12 - x) * .16 : 0;
    for (let y = -4; y <= 6; y++) for (let z = -4; z <= 4; z++) { const dy = y - cy; if (dy * dy + z * z <= r * r + .5) v.set(x, y, z, x > 21 ? (tipo === 'carbono' ? P.silver : piel(x, y, z)) : piel(x, y, z)); } }
  for (let x = -14; x <= 17; x += 2) for (const z of [-3, 3]) v.set(x, 1, z, P.navy);   // ventanillas
  for (const z of [-2, -1, 1, 2]) v.set(21, 1, z, P.ink); v.set(21, 1, 0, P.ink);   // cabina
  if (tipo !== 'carbono') for (let x = -18; x <= 20; x++) for (const z of [-3, 3]) v.set(x, -2, z, tipo === 'viejo' ? P.slate : P.navy);   // franja
  for (const sd of [-1, 1]) { for (let a = 3; a <= 26; a++) { const le = 6 - (a - 3) * .55, ch = Math.max(3, 10 - (a - 3) * .28), y = -1 + Math.round((a - 3) * .09);
      for (let x = Math.round(le - ch); x <= Math.round(le); x++) v.set(x, y, sd * a, x >= Math.round(le) - 0 && tipo === 'carbono' ? P.silver : ala(x, y, sd * a)); }
    if (tipo !== 'viejo') { const xt = Math.round(6 - 23 * .55); for (let k = 1; k <= 4; k++) v.box(xt - 3 + k, 1 + k - 1, sd * (26 + (k < 2 ? 1 : 1)), xt - 1 + k, 2 + k - 1, sd * (26 + 1) + 1, tipo === 'carbono' ? 0x22222e : P.navy); }
    v.set(Math.round(6 - 23 * .55), 1, sd * 26, sd > 0 ? P.lime : P.red);
    const ex = 4, ez = sd * 9; for (let x = ex - 3; x <= ex + 4; x++) for (let y = -6; y <= -2; y++) for (let z = ez - 2; z <= ez + 2; z++) if ((y + 4) ** 2 + (z - ez) ** 2 <= 4.6) v.set(x, y, z, x === ex + 4 && (y + 4) ** 2 + (z - ez) ** 2 <= 1.5 ? P.ink : x === ex + 4 ? P.slate : P.silver);   // motor
    for (let a = 2; a <= 10; a++) { const le = -17 - (a - 2) * .5; for (let x = Math.round(le - 4 + a * .2); x <= Math.round(le); x++) v.set(x, 2 + Math.round(a * .05), sd * a, ala(x, 2, sd * a)); } }
  for (let y = 3; y <= 14; y++) { const le = -15 - (y - 3) * .62, ch = 7 - (y - 3) * .3; for (let x = Math.round(le - ch); x <= Math.round(le); x++) v.set(x, y, 0, tipo === 'carbono' ? CAR(x, y, 0) : tipo === 'viejo' ? P.steel : (y > 9 ? P.cyan : P.navy)); }
  for (const [x, z] of [[19, 0], [2, -3], [2, 3]]) { v.box(x, -6, z, x + 1, -3, z + 1, P.ink); v.box(x - 1, -7, z, x + 1, -6, z + 1, P.dslate); }   // tren
  v.luz(P.lime, P.red); return v;
}
// fuegos artificiales: n cohetes que suben y estallan en bolas de cubos (ciclo de per segundos)
function fuegos(B, t, x0, x1, y0, y1, z, cols, n = 5, per = 2.6) { for (let i = 0; i < n; i++) { const ph = ((t + i * per / n) % per) / per, x = lerp(x0, x1, hsh(i, Math.floor((t + i * per / n) / per), 3)), hy = lerp(y0, y1, hsh(i, 7, Math.floor((t + i * per / n) / per)));
  const col = cols[(i + Math.floor((t + i * per / n) / per)) % cols.length];
  if (ph < .3) { B.pon(x, lerp(y0 - 20, hy, ph / .3), z, .8, 2, .8, P.amber); continue; }
  const e = (ph - .3) / .7, r = 3 + e * 12, s = 1.6 * (1 - e) + .2; for (let k = 0; k < 22; k++) { const a = k / 22 * 6.283, b = (hsh(k, i, 9) - .5) * 2.2; B.pon(x + Math.cos(a) * Math.cos(b) * r, hy + Math.sin(b) * r - e * e * 6, z + Math.sin(a) * Math.cos(b) * r, s, s, s, col); } } }
// bandera en un mástil con tres franjas que ondean (en un Bloques)
function banderaB(B, x, y, z, cols, t, s = 1, vert = false) { B.pon(x, y + 4 * s, z, .35 * s, 8 * s, .35 * s, P.silver);
  for (let k = 0; k < 6; k++) { const ond = Math.sin(t * 6 + k * .9 + x) * .35 * s * (k / 6); for (let f = 0; f < 3; f++) { const c = cols[vert ? (k * 3 / 6 | 0) : f];
    B.pon(x + .5 * s + k * .55 * s, y + 7.4 * s - f * .8 * s, z + ond, .56 * s, .8 * s, .25 * s, c); } } }
Object.assign(FAB, {
  // —— el A350 ——
  a350: () => rodajas(a350v('metal'), 8, -26, 26),        // de metal (blanco con franja y cola azules)
  a350c: () => rodajas(a350v('carbono'), 8, -26, 26),     // la misma silueta con la piel de fibra de carbono (morro, bordes y motores de metal)
  avion_viejo: () => rodajas(a350v('viejo'), 1, -26, 26), // la generación anterior: aluminio pulido, sin winglets
  bobina: () => {   // bobina de fibra de carbono: discos de acero y el hilo negro enrollado; eje horizontal (gira el hijo 'giro')
    const v = new Vox(); v.cyl(0, 0, -6, -5, 7, P.silver); v.cyl(0, 0, 5, 6, 7, P.silver); v.cyl(0, 0, -5, 5, 5, (x, y, z) => (y & 1) ? 0x22222e : 0x3a3a4a); v.cyl(0, 0, -7, 7, 1, P.steel);
    const g = v.build({ jit: .03 }); g.rotation.z = Math.PI / 2; const piv = new THREE.Group(); piv.add(g); piv.name = 'giro'; const w = new THREE.Group(); w.add(piv); return w; },
  pesa: () => {   // pesa de latón de balanza antigua, con asa
    const v = new Vox(); v.cyl(0, 0, 0, 2, 4, P.amber); v.cyl(0, 0, 2, 6, 3, (x, y) => y === 4 ? P.orange : P.amber); v.cyl(0, 0, 6, 7, 2, P.orange); v.box(-2, 7, 0, 3, 8, 1, P.dbrown); v.box(-2, 8, 0, -1, 10, 1, P.dbrown); v.box(2, 8, 0, 3, 10, 1, P.dbrown); v.box(-2, 10, 0, 3, 11, 1, P.dbrown);
    const w = new THREE.Group(); w.add(v.build({ jit: .04 })); return w; },
  // —— los Mundiales femeninos ——
  estadio_mini: () => {   // estadio en miniatura para el mapa: cuenco blanco, césped y cuatro focos que brillan
    const v = new Vox(); for (let x = -6; x <= 6; x++) for (let z = -5; z <= 5; z++) { const d = (x / 6) ** 2 + (z / 5) ** 2; if (d <= 1.05) v.box(x, 0, z, x + 1, d > .5 ? 1 + Math.round((d - .5) * 6) : 1, z + 1, d > .5 ? ((x + z) & 1 ? P.white : P.silver) : P.green); }
    for (const [x, z] of [[-6, -5], [6, -5], [-6, 5], [6, 5]]) { v.box(x, 0, z, x + 1, 7, z + 1, P.steel); v.set(x, 7, z, P.yellow); } v.luz(P.yellow); const w = new THREE.Group(); w.add(v.build({ jit: .03, centrar: true })); return w; },
  papel_picado: () => {   // guirnalda de papel picado: banderitas de colores con agujeros, colgadas de un cordel
    const v = new Vox(); v.box(-15, 8, 0, 16, 9, 1, P.ink); const cs = [P.pink, P.lime, P.yellow, P.cyan, P.orange, P.rose];
    for (let k = 0; k < 6; k++) { const x0 = -15 + k * 5 + 1; for (let x = x0; x < x0 + 4; x++) for (let y = 2; y < 8; y++) if (!((x - x0 === 1 || x - x0 === 2) && (y === 4 || y === 6)) && !(y === 2 && (x - x0) % 2)) v.set(x, y, 0, cs[k]); }
    const w = new THREE.Group(); w.add(v.build({ jit: .02, centrar: true })); return w; },
  cohete: () => {   // cohete de fuegos artificiales: tubo a rayas, cono y mecha encendida
    const v = new Vox(); v.cyl(0, 0, 0, 8, 1.4, (x, y) => y % 3 === 0 ? P.white : P.red); v.cyl(0, 0, 8, 9, 1, P.amber); v.set(0, 9, 0, P.amber); v.box(0, -6, 0, 1, 0, 1, P.brown); v.set(0, -7, 0, P.yellow); v.luz(P.yellow);
    const w = new THREE.Group(); w.add(v.build({ jit: .03, centrar: true })); return w; },
  // —— los tres 1-0 ——
  copa: () => {   // copa dorada genérica: peana verde, pie, cáliz y dos asas
    const v = new Vox(); v.cyl(0, 0, 0, 2, 4, P.dgreen); v.cyl(0, 0, 2, 3, 4, P.green); v.cyl(0, 0, 3, 5, 3, P.amber); v.cyl(0, 0, 5, 9, 1.4, P.yellow);
    for (let y = 9; y <= 17; y++) v.cyl(0, 0, y, y + 1, 2 + (y - 9) * .5, (x, yy, z) => (x * x + z * z) > (1 + (y - 9) * .5) ** 2 || y === 9 ? ((x + yy) % 4 === 0 ? P.amber : P.yellow) : undefined);
    for (const [k, c] of [...v.m]) if (c === undefined) v.m.delete(k);
    for (const sd of [-1, 1]) for (let y = 11; y <= 16; y++) { const x = sd * (4 + Math.round(Math.sin((y - 11) / 5 * Math.PI) * 2.4) + 2); v.set(x, y, 0, P.amber); }
    v.luz(); const w = new THREE.Group(); w.add(v.build({ jit: .05, centrar: true })); return w; },
  copa_euro: () => {   // copa plateada genérica de campeón continental: base negra, cuerpo alto y asas finas
    const v = new Vox(); v.cyl(0, 0, 0, 3, 4, P.ink); v.cyl(0, 0, 3, 4, 3, P.steel);
    for (let y = 4; y <= 22; y++) { const r = y < 8 ? 1.2 : y < 18 ? 1.6 + (y - 8) * .2 : 3.6; v.cyl(0, 0, y, y + 1, r, (x, yy) => (yy % 5 === 0 ? P.steel : P.white)); }
    for (const sd of [-1, 1]) { for (let y = 10; y <= 21; y++) v.set(sd * (4 + (y > 12 && y < 20 ? 2 : 1)), y, 0, P.silver); for (const y of [10, 21]) for (let a = 2; a <= 5; a++) v.set(sd * a, y, 0, P.silver); }
    const w = new THREE.Group(); w.add(v.build({ jit: .05, centrar: true })); return w; },
  foco: () => {   // torre de focos de estadio: mástil de celosía y panel de focos encendidos
    const v = new Vox(); for (let y = 0; y < 46; y++) { v.set(0, y, 0, P.steel); v.set(2, y, 0, P.steel); if (y % 4 === 0) v.box(0, y, 0, 3, y + 1, 1, P.slate); }
    v.box(-4, 46, -1, 7, 54, 1, P.dslate); for (let x = -3; x < 7; x += 2) for (let y = 47; y < 54; y += 2) v.set(x, y, 1, P.white); v.luz(P.white);
    const w = new THREE.Group(); w.add(v.build({ jit: .02 })); return w; },
});
Object.assign(FABE, {
  // —— A350 1: Barajas por la mañana: la T4 con su techo ondulado y pilares de colores, la pista y los A350 en las pasarelas ——
  barajas: () => {
    const s = new THREE.Scene(); s.background = cielo([P.blue, 0x7fc8ff, 0xdff4ff]); s.fog = new THREE.Fog(0xdff4ff, 180, 420);
    luces(s, { cielo: 0xe8f4ff, suelo: 0x5a6988, amb: 1.45, sol: 0xfff1d6, int: 2.1, dir: [-40, 80, 60], sombra: 120 });
    const v = new Vox();
    for (let x = -170; x < 170; x++) for (let z = -110; z < 170; z++) { let c;
      if (z >= 18 && z < 38) c = (z === 27 && (x >> 2) % 3 === 0) ? P.white : (z === 18 || z === 37) ? P.silver : P.dslate;   // pista
      else if (z >= -34 && z < 10) c = (z === 2 && (x & 3) < 2) ? P.yellow : P.slate;   // plataforma y calle de rodaje
      else if (z < -64) c = hsh(x >> 3, 1, z >> 3) > .5 ? 0x8fae5a : 0xa9b86a; else c = hsh(x >> 2, 2, z >> 2) > .5 ? P.green : 0x4a9a52; v.set(x, -1, z, c); }
    v.box(-100, 0, -62, 100, 10, -36, (x, y, z) => z === -36 ? (y % 3 === 0 ? P.silver : (hsh(x, y, 5) > .85 ? P.white : P.cyan)) : P.silver);   // terminal acristalada
    const TC = [P.navy, P.blue, P.cyan, P.lime, P.yellow, P.amber, P.orange, P.red];
    for (let x = -104; x < 104; x++) { const y = 12 + Math.round(Math.sin(x * .09) * 2); v.box(x, y, -66, x + 1, y + 1, -28, (X, Y, Z) => (Z === -28 || Z === -66) ? P.steel : ((X + Z) % 7 === 0 ? P.silver : P.white)); }
    for (let x = -100; x <= 100; x += 8) { const y = 12 + Math.round(Math.sin(x * .09) * 2), c = TC[clamp(Math.floor((x + 100) / 201 * TC.length), 0, TC.length - 1)]; v.box(x, 0, -30, x + 1, y, -29, c); v.box(x - 1, y - 1, -31, x + 2, y, -28, c); }
    for (const gx of [-64, -22, 22, 64]) { v.box(gx - 1, 4, -36, gx + 2, 7, -24, P.silver); v.box(gx - 1, 0, -26, gx + 2, 4, -25, P.steel); }   // pasarelas
    v.cyl(130, -50, 0, 34, 3, (x, y) => y % 6 === 0 ? P.steel : P.silver); v.cyl(130, -50, 34, 39, 6, (x, y, z) => (Math.abs(x) + Math.abs(z)) % 3 === 0 ? P.dslate : P.cyan); v.cyl(130, -50, 39, 40, 7, P.dslate); v.set(130, 41, -50, P.red);
    for (let x = -170; x < 170; x += 3) { const h = 6 + Math.round(Math.abs(Math.sin(x * .03)) * 14); v.box(x, 0, -110, x + 3, h, -104, hsh(x, 8, 1) > .5 ? 0x8fa0b8 : 0xa3b4c8); }   // sierra al fondo
    v.luz(P.red); s.add(v.build());
    const yo = 5.6, avi = actor('a350', 1); s.add(avi);
    const fila = [0, 1, 2, 3, 4].map(() => { const m = actor('a350', 1); s.add(m); return m; });
    const gates = [-64, 22, 64].map(gx => { const m = actor('a350', 1); m.position.set(gx, yo, -6); m.rotation.y = Math.PI / 2; s.add(m); return m; });
    const B = new Bloques(200, true); s.add(B.im);
    const c = cam(46);
    const estela = (x, y, z) => { B.ini(); for (let k = 1; k < 14; k++) B.pon(x - 22 - k * 3, y - 1, z + (k & 1 ? 9 : -9), 2.6, .8 + k * .05, .8 + k * .05, 0xffffff); B.fin(); };
    return { s, c, upd(t) { avi.position.set(-40, yo, 27); avi.rotation.set(0, 0, 0); fila.forEach(m => m.visible = false); B.ini(); B.fin();
        mira(c, [Math.sin(t * .1) * 6 + 20, 16, 136], [-46, 8, 26], .03); },
      acc: {
        // el A350 acelera por la pista, levanta el morro y despega hacia la cámara
        despega(lt, dur, t) { const k = clamp(lt / dur, 0, 1), x = -70 + 150 * k * k * .85 + 20 * k, up = ss(clamp((k - .5) / .3, 0, 1)), h = Math.max(0, k - .62) ** 2 * 120;
          avi.position.set(x, yo + h, 27); avi.rotation.set(0, 0, .2 * up); if (h > 1) estela(x, yo + h, 27); else { B.ini(); B.fin(); }
          mira(c, [x + 66, 16 + h * .6, 136], [x - 4, yo + h * .8 + 3, 26], .03); },
        // fila de A350 rodando hacia las pasarelas de la T4; detrás, más aviones que vienen
        flota(lt, dur, t) { avi.position.set(0, -50, 0); const k = clamp(lt / dur, 0, 1);
          fila.forEach((m, i) => { m.visible = true; m.position.set(120 - k * 70 + i * 58, yo, 2); m.rotation.y = Math.PI; });
          mira(c, [lerp(205, 185, k), lerp(46, 40, k), 40], [lerp(60, 40, k), 4, 0], .05); },
      } };
  },
  // —— A350 2: el taller de materiales compuestos: hangar con el A350 al fondo, la bobina de fibra, la báscula, la prensa y el panel por capas ——
  taller: () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(0x262b44); s.fog = new THREE.Fog(0x262b44, 160, 300);
    luces(s, { cielo: 0xeef4ff, suelo: 0x3a4466, amb: 1.6, sol: 0xffffff, int: 1.8, dir: [-20, 80, 50], sombra: 110 });
    const v = new Vox(); v.box(-110, -1, -100, 110, 0, 70, (x, y, z) => (z === 6 || x === -50 || x === 50) && (x & 3) < 2 ? P.yellow : ((x >> 3) + (z >> 3)) % 2 ? P.silver : 0xb0bccd);
    v.box(-110, 0, -102, 110, 60, -100, (x, y) => (x % 12 === 0) ? P.dslate : (y > 40 && y < 46 ? P.navy : P.slate)); for (const sx of [-112, 110]) v.box(sx, 0, -100, sx + 2, 60, 70, (x, y, z) => z % 12 === 0 ? P.dslate : P.slate);
    for (let x = -100; x <= 100; x += 25) v.box(x, 58, -100, x + 6, 59, 70, P.white); v.luz(P.white);
    v.box(-50, 0, 8, -8, 4, 22, P.dslate);   // banco de la bobina
    v.box(-12, 0, 10, 12, 2, 30, P.steel); v.box(-10, 2, 12, 10, 3, 28, P.silver);   // báscula
    v.box(22, 0, 12, 26, 8, 28, P.slate); v.box(40, 0, 12, 44, 8, 28, P.slate); v.box(20, 26, 8, 46, 30, 32, P.orange); v.box(22, 8, 8, 24, 26, 10, P.steel); v.box(42, 8, 8, 44, 26, 10, P.steel);   // prensa
    v.box(54, 0, 10, 84, 6, 30, P.dslate); s.add(v.build());
    const avi = actor('a350', 1.15), avc = actor('a350c', 1.15); for (const m of [avi, avc]) { m.position.set(0, 6.5, -50); m.rotation.y = -.25; s.add(m); }
    const bob = actor('bobina', 1); bob.position.set(-40, 12, 14); s.add(bob);
    const pesas = [0, 1, 2, 3, 4, 5].map(() => { const m = actor('pesa', .8); s.add(m); return m; });
    const avm = actor('a350', .28); s.add(avm);
    const B = new Bloques(900), G = new Bloques(200, true); s.add(B.im, G.im);
    const CAR = k => (k & 1) ? 0x22222e : 0x3a3a4a;
    const barril = (k, t) => { for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283 + t * 1.5; for (let y = 0; y < 14; y++) { const neg = (y / 14) < k; B.pon(-26 + y * 1.05, 11 + Math.sin(a) * 4.5, 14 + Math.cos(a) * 4.5, 1.05, 1.3, 1.3, neg ? CAR(i + y) : P.silver); } } };
    const hilo = (t) => { for (let k = 0; k < 10; k++) B.pon(lerp(-38, -24, k / 10), 17 - k * .1 + Math.sin(t * 6 + k) * .15, 14, 1.5, .3, .3, 0x22222e); };
    const vigas = (dob) => { B.pon(33, 9.5, 15, 22, 1.4, 3, P.silver); B.pon(33, 9.5 - dob, 25, 22, 1.4, 3, 0x2a2a36); };
    const panel = (n, k, t) => { for (let i = 0; i < n; i++) { const f = i === n - 1 ? k : 1, ori = i % 3, y = 6.5 + i * .7, x = lerp(110, 0, ss(f)); for (let s2 = 0; s2 < 10; s2++) {
        if (ori === 0) B.pon(69 + x, y, 12 + s2 * 1.8 + .9, 28, .6, 1.5, CAR(s2 + i)); else if (ori === 1) B.pon(56 + s2 * 2.8 + 1.4 + x, y, 20, 2.6, .6, 18, CAR(s2 + i)); else B.pon(56 + s2 * 2.8 + 1.4 + x, y, 20, 2.6, .6, 18, CAR(s2 + i + 1), .78); }
        } };
    const c = cam(46);
    const base = () => { B.ini(); G.ini(); avi.visible = true; avc.visible = false; pesas.forEach(m => m.visible = false); avm.visible = false; bob.getObjectByName('giro').rotation.x = 0; };
    return { s, c, upd(t) { base(); barril(.3, 0); vigas(0); panel(6, 1, t); B.fin(); G.fin(); mira(c, [Math.sin(t * .1) * 6, 30, 70], [0, 10, -40], .06); },
      acc: {
        // la bobina gira y enrolla el hilo negro de carbono sobre un tubo que se va oscureciendo
        pregunta(lt, dur, t) { base(); const k = clamp(lt / dur, 0, 1); bob.getObjectByName('giro').rotation.x = -t * 3; barril(.15 + k * .8, t); hilo(t); vigas(0); panel(6, 1, t); B.fin(); G.fin();
          mira(c, [lerp(-40, -24, ss(k)), 30, lerp(84, 78, k)], [-29, 11, 14], .02); },
        // pesas que caen una a una sobre el avión en la báscula; el depósito de combustible baja con cada kilo
        kilos(lt, dur, t) { base(); barril(.95, 0); vigas(0); panel(6, 1, t); avm.visible = true; let n = 0, hund = 0;
          pesas.forEach((m, i) => { const f = clamp((lt - .2 - i * .42) / .4, 0, 1); m.visible = f > 0; if (f >= 1) n++; const xi = -7 + (i % 3) * 7, zi = 15 + (i / 3 | 0) * 10; m.position.set(xi, 3 + lerp(40, 0, f * f) + (f >= 1 ? 0 : 0), zi); }); hund = n * .15;
          avm.position.set(0, 4.6 - hund + 1, 20); avm.rotation.y = .5; for (const m of pesas) if (m.visible && m.position.y < 4) m.position.y = 3 - hund;
          const lv = 1 - n * .13; B.pon(-4 + 22, 1 + 7 * lv, 34, 4, 14 * lv, 4, P.amber); B.pon(-4 + 22, 8, 34, 4.6, 14.6, 4.6, P.white); B.fin(); G.fin();
          const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-10, 6, k), 32, 80], [4, 8, 24], .03); },
        // ¿más frágil? la prensa baja sobre una viga de aluminio y otra de carbono
        fragil(lt, dur, t) { base(); barril(.95, 0); panel(6, 1, t); const k = ss(clamp(lt / (dur * .8), 0, 1)); B.pon(33, 26 - k * 13, 20, 24, 2, 16, P.orange); B.pon(33, 21 - k * 13 + 5, 20, 2, 10, 2, P.steel); vigas(0); B.fin(); G.fin();
          mira(c, [lerp(40, 34, k), 26, 94], [33, 13, 20], .02); },
        // capa a capa: tiras de carbono cruzadas con resina dorada; después una pesa cae encima y el panel no se dobla
        capas(lt, dur, t) { base(); barril(.95, 0); vigas(0); const per = (dur * .7) / 6, n = Math.min(6, Math.floor(lt / per) + 1), k = clamp((lt - (n - 1) * per) / per, 0, 1); panel(n, n === 6 && lt > per * 6 ? 1 : k, t);
          const f = clamp((lt - dur * .75) / .35, 0, 1); pesas[0].visible = f > 0; pesas[0].position.set(69, 11 + lerp(36, 0, f * f), 20); B.fin(); G.fin();
          mira(c, [lerp(92, 80, ss(clamp(lt / dur, 0, 1))), 40, 82], [69, 8, 20], .03); },
        // el A350 del hangar se vuelve de fibra de carbono de la cola al morro: el 53 %
        piezas(lt, dur, t) { base(); barril(.95, 0); vigas(0); panel(6, 1, t); B.fin(); G.fin(); avc.visible = true; const k = clamp((lt - .3) / (dur * .65), 0, 1), n = Math.round(k * 8);
          for (let i = 0; i < 8; i++) { avi.getObjectByName('r' + i).visible = i >= n; avc.getObjectByName('r' + i).visible = i < n; }
          const q = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-40, -10, q), lerp(40, 46, q), 52], [0, 2, -50], -.08); },
      } };
  },
  // —— A350 3: en vuelo sobre un mar de nubes al atardecer ——
  crucero: () => {
    const s = new THREE.Scene(); s.background = cielo([P.navy, 0x6a7cc8, 0xf6a070, 0xfee0b0]); s.fog = new THREE.Fog(0xf6c49a, 160, 380);
    luces(s, { cielo: 0xffe0c0, suelo: 0x5a6988, amb: 1.4, sol: 0xffd8a0, int: 2.2, dir: [60, 40, 60], sombra: 80 });
    const sun = bola(0xfff1a0, 14); sun.position.set(120, 20, -300); s.add(sun);
    const N = new Bloques(1400), B = new Bloques(400, true); s.add(N.im, B.im);
    const avc = actor('a350c', 1), avv = actor('avion_viejo', 1); s.add(avc, avv);
    for (const m of [avc]) for (let i = 0; i < 8; i++) m.getObjectByName('r' + i).visible = true;
    const nubes = t => { N.ini(); for (let i = 0; i < 260; i++) { const x = ((hsh(i, 1, 1) * 600 - t * 40) % 600 + 600) % 600 - 300, z = hsh(i, 2, 2) * 420 - 330, r = 8 + hsh(i, 3, 3) * 14;
        N.pon(x, -40 + hsh(i, 4, 4) * 4, z, r * 1.6, r * .5, r, hsh(i, 5, 5) > .4 ? 0xffffff : 0xffe8d8); N.pon(x + r * .4, -36 + hsh(i, 6, 6) * 3, z, r * .9, r * .4, r * .7, 0xfff4ec); } N.fin(); };
    const lab = ['ANTES', 'A350'].map(n => { const p = pantalla(14, 3.5, 112, 28); rotular(p, [n], n === 'A350' ? '#2ce8f5' : '#c0cbdc', '#181425', 20, { borde: '#ffffff' }); s.add(p.m); return p; });
    const c = cam(46);
    return { s, c, upd(t) { nubes(t); avv.visible = false; lab.forEach(p => p.m.visible = false); avc.position.set(0, Math.sin(t * 1.2) * .6, 0); avc.rotation.set(Math.sin(t * .7) * .03, 0, 0); B.ini(); B.fin();
        mira(c, [lerp(40, 46, Math.sin(t * .1) * .5 + .5), 14, 70], [0, 0, 0], -.05); },
      acc: {
        // dos aviones en paralelo con el mismo combustible: el de antes vacía su depósito; al A350 le sobra una cuarta parte
        combustible(lt, dur, t) { avv.visible = true; const k = clamp(lt / (dur * .85), 0, 1); avv.position.set(0, 8 + Math.sin(t * 1.1) * .5, -6); avc.position.set(0, -9 + Math.sin(t * 1.2) * .5, 6); avc.rotation.set(0, 0, 0); avv.rotation.set(0, 0, 0);
          B.ini(); for (const [m, gasto, col] of [[avv, 1, P.steel], [avc, .75, P.cyan]]) { const lv = 1 - gasto * k, y = m.position.y + 8.5, z = m.position.z, x = m.position.x + 6; B.pon(x, y, z, 1.2, 3.2, 30.4, P.ink); B.pon(x + .3, y, z - 15 + 15 * lv, 1.2, 2.4, 30 * lv, lv < .1 ? P.red : P.amber);
            for (let d = 0; d < 10 * gasto; d++) { const u = ((t * 1.4 + d / 10) % 1); B.pon(m.position.x - 2 - u * 50, m.position.y - 4, z + (d & 1 ? 9 : -9), .8, .8, .8, P.amber); } } B.fin();
          lab[0].m.visible = lab[1].m.visible = true; lab[0].m.position.set(8, 8 + 12.5, -6); lab[1].m.position.set(8, -9 + 12.5, 6); lab.forEach(p => p.m.lookAt(c.position));
          mira(c, [110, 2, 14], [0, -1.5, 0], .0); },
        // la cámara recorre el ala de punta a punta con una cinta métrica amarilla: casi 65 metros
        alas(lt, dur, t) { const k = ss(clamp(lt / dur, 0, 1)); avc.position.set(0, 0, 0); avc.rotation.set(0, Math.PI / 2 * 0, 0); B.ini(); const L = clamp(lt / (dur * .6), 0, 1);
          for (let z = -27; z <= -27 + 54 * L; z += 1) B.pon(-2 - (Math.abs(z) - 3) * .55, 1.6, z, 1.6, .3, 1, (Math.round(z) % 5 === 0) ? P.ink : P.yellow);
          const bl = Math.floor(t * 3) % 2; B.pon(-6.6, 1.5, 26.5, 1.6, 1.6, 1.6, bl ? P.lime : 0x1a3a1a); B.pon(-6.6, 1.5, -26.5, 1.6, 1.6, 1.6, bl ? P.red : 0x3a1a1a); B.fin();
          mira(c, [lerp(-10, 2, k), lerp(96, 92, k), 44], [-4, 0, 0], .12); },
      } };
  },
});
// mapa del Atlántico norte a 0,5 grados por cubo: x = (lon + 55)·2, z = (35 − lat)·2
const MAPA = {
  usa: [[-124.7, 48.4], [-123, 46], [-124.2, 42], [-120.5, 34.5], [-117.1, 32.5], [-114.7, 32.7], [-111, 31.3], [-106.5, 31.8], [-104.5, 29.6], [-103, 29], [-101.4, 29.8], [-99.5, 27.5], [-97.4, 25.9], [-97.4, 27.8], [-94.5, 29.5], [-89.5, 29.2], [-89, 30.3], [-85, 29.7], [-83, 29], [-82.6, 27.5], [-81, 25.2], [-80, 26.8], [-81.4, 30.5], [-79, 33.5], [-75.5, 35.5], [-76, 38.5], [-74, 40.6], [-70, 41.7], [-70.7, 43.1], [-67, 44.8], [-67.8, 47], [-69.2, 47.4], [-71.5, 45], [-75, 45], [-79, 43.3], [-83, 42], [-82.5, 45.5], [-84.7, 46.5], [-89.5, 48], [-95, 49], [-123, 49]],
  mex: [[-117.1, 32.5], [-114.7, 32.7], [-111, 31.3], [-106.5, 31.8], [-104.5, 29.6], [-103, 29], [-101.4, 29.8], [-99.5, 27.5], [-97.4, 25.9], [-97.7, 22], [-96, 19], [-94.5, 18.2], [-91, 18.7], [-90.4, 21], [-87, 21.5], [-87.5, 18.3], [-88.3, 17.8], [-90.5, 17.8], [-91.4, 16.1], [-92.2, 14.5], [-94, 16], [-96.5, 15.7], [-98.5, 16.3], [-101, 17.5], [-103.5, 18.3], [-105.7, 20.4], [-105.3, 22], [-108, 25], [-109.5, 26.5], [-112.2, 29], [-114.7, 31.5], [-114.8, 30], [-112.5, 27], [-110, 23.2], [-109.5, 23.1], [-111.5, 26], [-114, 28], [-115.7, 30]],
  cam: [[-92.2, 14.5], [-91.4, 16.1], [-90.5, 17.8], [-88.3, 17.8], [-88, 15.9], [-84, 15.8], [-83.2, 15], [-83.5, 11], [-85.7, 11.1], [-85.7, 9.9], [-87.5, 13], [-89.4, 13.5], [-91.4, 13.9]],
  cri: [[-85.7, 11.2], [-83.6, 10.9], [-83, 10], [-82.5, 9.5], [-82.9, 8.1], [-83.6, 8.4], [-84.6, 9.6], [-85.9, 9.9]],
  pan: [[-82.5, 9.5], [-79.5, 9.6], [-77.4, 8.6], [-78, 7.3], [-80.5, 7.5], [-81.7, 8.2], [-82.9, 8.1]],
  cub: [[-85, 21.9], [-82, 23.1], [-77.5, 22], [-74.2, 20.2], [-77.5, 19.9], [-80, 21.8], [-82.5, 22.2]],
  jam: [[-78.6, 18.4], [-76.9, 18.7], [-76, 18.1], [-76.9, 17.6], [-78.4, 18]],
  esp: [[-74.4, 19.8], [-71.6, 19.9], [-68.4, 18.6], [-71.5, 17.6], [-74.4, 18.3]],
  can: [[-125, 49], [-95, 49], [-89.5, 48], [-84.7, 46.5], [-82.5, 45.5], [-79, 43.3], [-75, 45], [-71.5, 45], [-69.2, 47.4], [-67.8, 47], [-67, 44.8], [-64, 45.5], [-61, 45.5], [-60, 47], [-65, 49], [-64, 51], [-56, 51.5], [-60, 55], [-62, 58.5], [-65, 60.5], [-125, 60.5]],
  gbr: [[-5.7, 50], [-3, 50.6], [1.4, 51.2], [1.7, 52.7], [0.3, 53.4], [-0.5, 54.5], [-1.6, 55.6], [-2.1, 57.7], [-3.4, 58.6], [-5, 58.6], [-6.2, 57.5], [-5.6, 55.4], [-4.8, 54.8], [-3.1, 54], [-3, 53.4], [-4.6, 53.3], [-4.3, 52.2], [-5.3, 51.7], [-3.4, 51.4]],
  irl: [[-10, 51.6], [-6.2, 52.2], [-6, 53.9], [-5.5, 54.6], [-7.3, 55.4], [-8.5, 54.9], [-10.1, 54.2], [-9.9, 53], [-10.4, 52]],
  eur: [[-9.3, 43.2], [-8.9, 37], [-6, 36.2], [-2, 36.7], [0, 38.7], [3.2, 42], [6, 43], [9, 44.2], [12, 44], [15, 42], [15, 54.5], [10.6, 54.4], [8.8, 54], [5, 53.4], [4, 51.4], [1.6, 50.9], [-1.5, 48.7], [-4.6, 48.5], [-1.8, 46.5], [-1.5, 43.4]],
  afr: [[-17, 21], [-16, 24], [-13, 27.7], [-9.8, 29.8], [-9.6, 32.5], [-6.8, 34], [-5.9, 35.8], [-2, 35.1], [3, 36.8], [10, 37.3], [11, 33], [15, 32], [15, 4], [-8, 4.5], [-13, 8], [-17, 14.7]],
  sam: [[-77.4, 8.6], [-75.5, 10.8], [-71.5, 12.4], [-68, 10.6], [-62, 10.7], [-60, 8.5], [-55, 6], [-50, 4], [-79, 4]],
};
const enPol = (x, y, pol) => { let d = false; for (let i = 0, j = pol.length - 1; i < pol.length; j = i++) { const [xi, yi] = pol[i], [xj, yj] = pol[j]; if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) d = !d; } return d; };
const mx = lon => (lon + 55) * 2, mz = lat => (35 - lat) * 2;
const BAND = [[P.red, P.white, P.red], [P.navy, P.yellow, P.navy], [P.green, P.white, P.red], [P.blue, P.white, P.blue], [P.ink, P.red, P.yellow], [P.red, P.yellow, P.red], [P.lime, P.yellow, P.blue], [P.white, P.blue, P.white], [P.orange, P.white, P.green], [P.crimson, P.white, P.navy], [P.yellow, P.navy, P.red], [P.dgreen, P.white, P.dgreen]];

Object.assign(FABE, {
  // —— Mundial femenino 1: el Atlántico norte en vóxeles: América a la izquierda, el Reino Unido y España a la derecha ——
  oceano: () => {
    const s = new THREE.Scene(); s.background = cielo([P.navy, P.blue, 0x9fdcff]); s.fog = new THREE.Fog(0x9fdcff, 260, 560);
    luces(s, { cielo: 0xe8f4ff, suelo: 0x124e89, amb: 1.5, sol: 0xfff1d6, int: 1.9, dir: [-30, 90, 60], sombra: 170 });
    const HOST = { usa: P.navy, mex: P.green, cri: P.red, jam: P.yellow, gbr: P.crimson }, plano = new Vox(), on = {}, off = {};
    for (const h in HOST) { on[h] = new Vox(); off[h] = new Vox(); }
    for (let X = -146; X < 146; X++) for (let Z = -54; Z < 200; Z++) { const lon = X / 2 - 55, lat = 35 - Z / 2; let pais = null;
      for (const k of ['usa', 'mex', 'cri', 'jam', 'gbr', 'cam', 'pan', 'cub', 'esp', 'can', 'irl', 'eur', 'afr', 'sam']) if (enPol(lon, lat, MAPA[k])) { pais = k; break; }
      if (pais === 'irl' && lat > 54.05 && lon > -8.2) pais = 'gbr';
      if (!pais) { plano.set(X, -1, Z, hsh(X >> 1, 1, Z >> 1) > .9 ? P.cyan : (hsh(X, 2, Z) > .5 ? P.blue : 0x0a8ad0)); continue; }
      if (HOST[pais]) { const c = (hsh(X, 3, Z) > .5 ? 1 : .88); on[pais].set(X, 1, Z, new THREE.Color(HOST[pais]).multiplyScalar(c).getHex()); on[pais].set(X, 0, Z, P.dslate); off[pais].set(X, 0, Z, hsh(X >> 2, 4, Z >> 2) > .5 ? P.sand : P.tan); continue; }
      plano.set(X, 0, Z, pais === 'can' || pais === 'eur' ? (hsh(X >> 2, 5, Z >> 2) > .5 ? P.green : 0x4a9a52) : pais === 'afr' ? P.tan : (hsh(X >> 2, 6, Z >> 2) > .5 ? P.dgreen : P.green)); }
    s.add(plano.build({ jit: .04 })); const G = {}; for (const h in HOST) { G[h] = { on: on[h].build({ jit: .03 }), off: off[h].build({ jit: .04 }) }; s.add(G[h].on, G[h].off); }
    const SED = { usa: [[-118.3, 34], [-74, 40.7], [-97, 32.8], [-84.4, 33.7], [-122.4, 37.8]], mex: [[-99.1, 19.4], [-103.4, 20.7], [-100.3, 25.7]], cri: [[-84.1, 9.9]], jam: [[-76.8, 18]], gbr: [[-0.1, 51.5], [-2.2, 53.5], [-4.25, 55.9], [-3.2, 51.5], [-5.9, 54.6]] };
    const est = {}; for (const h in SED) est[h] = SED[h].map(([lo, la]) => { const m = actor('estadio_mini', 1); m.userData.e = h === 'gbr' ? .55 : 1; m.position.set(mx(lo), 4, mz(la)); s.add(m); return m; });
    const F = new Bloques(1500), c = cam(46);
    s.add(F.im);
    const pais = (h, k, t) => { const g = G[h]; g.on.visible = k > 0; g.off.visible = k <= 0; g.on.position.y = k > 0 ? ss(k) * 1.5 + (k >= 1 ? Math.sin(t * 3) * .15 : 0) : 0; est[h].forEach((m, i) => { const u = clamp(k * 1.6 - i * .12, 0, 1); m.visible = u > 0; m.scale.setScalar(m.userData.e * Math.max(.05, ss(u))); m.position.y = 1.5 + 3 * m.userData.e; m.rotation.y = t * .5 + i; }); };
    const todos = (k, t) => { for (const h in HOST) pais(h, k, t); };
    return { s, c, upd(t) { todos(0, t); F.ini(); F.fin(); mira(c, [-40 + Math.sin(t * .1) * 6, 120, 160], [-40, 0, 10], .08); },
      acc: {
        // 48 banderas salen del mar en el centro del Atlántico, en oleadas, mientras la cámara pasa rasante
        banderas(lt, dur, t) { todos(0, t); F.ini(); for (let i = 0; i < 48; i++) { const col = i % 8, fila = i / 8 | 0, u = clamp((lt - .05 - (col + fila) * .06) / .45, 0, 1); if (u <= 0) continue;
            banderaB(F, -14 + col * 4.4 + (fila & 1) * 1.2, lerp(-12, 0, ss(u)) - 1, 12 + fila * 5.5, BAND[(i * 5) % BAND.length], t, .62, i % 3 === 0); } F.fin();
          const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-6, 6, k), lerp(18, 26, k), lerp(78, 86, k)], [2, 1, 26], .04); },
        // la cámara vuela sobre América: Estados Unidos, México, Costa Rica y Jamaica se levantan y salen sus estadios
        america(lt, dur, t) { F.ini(); F.fin(); for (const h of ['usa', 'mex', 'cri', 'jam']) pais(h, clamp((lt - .3 - ['usa', 'mex', 'cri', 'jam'].indexOf(h) * .45) / .6, 0, 1), t); pais('gbr', 0, t);
          const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-70, -96, k), lerp(150, 190, k), lerp(150, 176, k)], [-96, 0, lerp(0, 8, k)], .02); },
        // la cámara cruza el Atlántico hacia el este: el Reino Unido se levanta en rojo con sus estadios
        reino_unido(lt, dur, t) { F.ini(); F.fin(); for (const h of ['usa', 'mex', 'cri', 'jam']) pais(h, 1, t); pais('gbr', clamp((lt - dur * .45) / .6, 0, 1), t);
          const k = ss(clamp(lt / (dur * .6), 0, 1)); mira(c, [lerp(-60, 100, k), lerp(170, 95, k), lerp(170, 60, k)], [lerp(-80, 100, k), 0, lerp(10, -30, k)], .04); },
      } };
  },
  // —— Mundial femenino 2: el cuadro del torneo sobre un tablero de césped: grupos de selecciones y las cuatro sedes en las esquinas ——
  cuadro: () => {
    const s = new THREE.Scene(); s.background = cielo([0x262b44, 0x3a4466, 0x5a6988]); s.fog = new THREE.Fog(0x3a4466, 150, 300);
    luces(s, { cielo: 0xeef4ff, suelo: 0x3a4466, amb: 1.6, sol: 0xffffff, int: 1.9, dir: [-30, 80, 50], sombra: 80 });
    const ZON = [[-36, -22, P.navy], [36, -22, P.green], [-36, 34, P.red], [36, 34, P.yellow]];
    const v = new Vox(); v.box(-56, -3, -40, 56, 0, 52, (x, y, z) => y < -1 ? P.dbrown : ((x === -56 + 2 || x === 53 || z === -38 || z === 49 || x === 0) ? P.white : ((z >> 3) % 2 ? P.green : 0x4a9a52)));
    v.box(-60, -6, -44, 60, -3, 56, P.umber); s.add(v.build());
    const Z = new Bloques(8, true), T = new Bloques(800), Bl = new Bloques(260), A = new Bloques(60, true); s.add(Z.im, T.im, Bl.im, A.im);
    const pads = []; for (let g = 0; g < 12; g++) { const gx = -27 + (g % 4) * 18, gz = -16 + (g / 4 | 0) * 16; for (let i = 0; i < 4; i++) pads.push([gx - 4.5 + (i % 2) * 9, gz - 3 + (i >> 1) * 6]); }
    const qs = ZON.map(() => { const p = pantalla(6, 6, 48, 48); rotular(p, ['?'], '#fee761', '#181425', 40, { borde: '#ffffff' }); s.add(p.m); return p; });
    const equipo = (x, y, z, i) => { const c3 = BAND[i % BAND.length]; T.pon(x, y + 1.5, z, 4, 3, 4, P.white); for (let f = 0; f < 3; f++) T.pon(x - 1.33 + f * 1.33, y + 3.2, z, 1.33, .5, 4, c3[f]); };
    const zonas = (glow, t) => { Z.ini(); ZON.forEach(([x, z, col], i) => Z.pon(x, .2 + (glow ? Math.abs(Math.sin(t * 4 + i)) * .6 : 0), z, 34, .5, 20, col)); Z.fin(); };
    const c = cam(46);
    const base = (t) => { zonas(false, t); qs.forEach(p => p.m.visible = false); T.ini(); Bl.ini(); A.ini(); };
    const fin = () => { T.fin(); Bl.fin(); A.fin(); };
    return { s, c, upd(t) { base(t); for (let i = 0; i < 48; i++) equipo(pads[i][0], 0, pads[i][1], i); fin(); mira(c, [Math.sin(t * .1) * 6, 92, 100], [0, 0, 6], .06); },
      acc: {
        // las cuatro esquinas de las sedes brillan con interrogantes; en el centro, los 32 equipos de 2023
        pregunta(lt, dur, t) { base(t); zonas(true, t); for (let i = 0; i < 32; i++) equipo(pads[i][0], 0, pads[i][1], i); qs.forEach((p, i) => { p.m.visible = true; p.m.position.set(ZON[i][0] * .6, 9 + Math.sin(t * 3 + i) * .8, ZON[i][1] * .8); p.m.lookAt(c.position); }); fin();
          const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-30, 0, k), lerp(110, 120, k), lerp(110, 118, k)], [0, 0, 6], .04); },
        // de 32 a 48: dieciséis selecciones nuevas caen del cielo y rebotan en sus casillas
        crece(lt, dur, t) { base(t); for (let i = 0; i < 48; i++) { if (i < 32) { equipo(pads[i][0], 0, pads[i][1], i); continue; } const u = clamp((lt - .4 - (i - 32) * .1) / .5, 0, 1); if (u <= 0) continue;
            const y = u < .75 ? lerp(50, 0, (u / .75) ** 2) : Math.sin((u - .75) / .25 * Math.PI) * 2.5; equipo(pads[i][0], y, pads[i][1], i); } fin();
          const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(0, 8, k), lerp(100, 92, k), lerp(96, 92, k)], [0, 0, lerp(4, 10, k)], .05); },
        // los partidos: balones que salen de los grupos y se apilan detrás: 64 blancos como en 2023 y 40 dorados más (104)
        partidos(lt, dur, t) { base(t); for (let i = 0; i < 48; i++) equipo(pads[i][0], 0, pads[i][1], i); const n = Math.min(104, Math.floor(clamp((lt - .3) / (dur * .7), 0, 1) * 104));
          for (let b = 0; b < 104; b++) { const tx = -26 + (b % 13) * 4.3, ty = 3 + (b / 13 | 0) * 4.3, tz = -34; if (b < n) Bl.pon(tx, ty, tz, 3.4, 3.4, 3.4, b < 64 ? P.white : P.yellow); else if (b < n + 3) { const f = clamp(n + 3 - b - (lt * 20 % 1), 0, 1), p0 = pads[(b * 7) % 48]; Bl.pon(lerp(p0[0], tx, 1 - f), lerp(3, ty, 1 - f) + Math.sin((1 - f) * Math.PI) * 10, lerp(p0[1], tz, 1 - f), 2.4, 2.4, 2.4, b < 64 ? P.white : P.yellow); } } fin();
          const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-10, 6, k), lerp(70, 64, k), lerp(96, 100, k)], [0, 14, -14], .04); },
        // las 48 selecciones se reparten por las cuatro sedes y unos aviones de cubos van y vienen entre ellas
        reparte(lt, dur, t) { base(t); zonas(true, t); const k = ss(clamp(lt / (dur * .55), 0, 1));
          for (let i = 0; i < 48; i++) { const zz = ZON[i % 4], j = i / 4 | 0, dx = -12 + (j % 4) * 8, dz = -5 + (j / 4 | 0) * 5; equipo(lerp(pads[i][0], zz[0] + dx, k), Math.sin(k * Math.PI) * 8, lerp(pads[i][1], zz[1] + dz, k), i); }
          for (let a = 0; a < 6; a++) { const A0 = ZON[a % 4], A1 = ZON[(a + 1 + (a >> 2)) % 4], u = ((t * .5 + a / 6) % 1); A.pon(lerp(A0[0], A1[0], u), 14 + Math.sin(u * Math.PI) * 10, lerp(A0[1], A1[1], u), 4, 1, 1.2, P.white); A.pon(lerp(A0[0], A1[0], u), 14.4 + Math.sin(u * Math.PI) * 10, lerp(A0[1], A1[1], u), 1.2, .6, 5, P.white); }
          fin(); mira(c, [0, lerp(110, 130, k), lerp(110, 122, k)], [0, 0, 6], .03); },
      } };
  },
  // —— Mundial femenino 3: estadio en México de noche, con papel picado y fuegos artificiales verdes, blancos y rojos ——
  mexico: () => {
    const s = new THREE.Scene(); s.background = cielo([P.ink, P.night, 0x3a2a5a]); s.fog = new THREE.Fog(P.night, 170, 340);
    luces(s, { cielo: 0x9fb4ff, suelo: 0x262b44, amb: 1.0, sol: 0xfff1d6, int: 1.3, dir: [-30, 80, 60], sombra: 100 }); estrellas(s, 140, 260, 40);
    const v = new Vox(); cesped(v, -64, 64, -40, 70, -30, { lineas: false });
    for (let k = 0; k < 12; k++) { const r = 74 + k * 3; for (let a = 0; a < 180; a++) { const an = a / 180 * 6.283, x = Math.round(Math.cos(an) * r), z = Math.round(15 + Math.sin(an) * r * .75); if (z > 60) continue; v.box(x, k * 2.6, z, x + 2, k * 2.6 + 2.6, z + 2, k % 4 === 3 ? P.dslate : P.slate); } }
    v.box(-110, 32, -74, 110, 34, -60, P.dslate); s.add(v.build());
    const G = new Bloques(1400, true), F = new Bloques(700, true); s.add(G.im, F.im);
    const pp = [0, 1, 2, 3].map(i => { const m = actor('papel_picado', 1.3); m.position.set(-40 + (i & 1) * 50 + (i >> 1) * 15, 44 - (i >> 1) * 6, -10 + (i >> 1) * 22); s.add(m); return m; });
    const coh = [0, 1, 2].map(i => { const m = actor('cohete', .9); s.add(m); return m; });
    const lc = new THREE.PointLight(0xfeae34, 60, 140, 1.2); lc.position.set(0, 40, 0); s.add(lc);
    const MX = [P.lime, P.white, P.red, P.green];
    const grada = (t, k) => { G.ini(); for (let r = 0; r < 12; r++) for (let a = 0; a < 90; a++) { const an = a / 90 * 6.283, x = Math.cos(an) * (75 + r * 3), z = 15 + Math.sin(an) * (75 + r * 3) * .75; if (z > 58) continue; const on = hsh(a, r, 2) < .35 + k * .5;
        G.pon(x, r * 2.6 + 3 + (on ? Math.abs(Math.sin(t * 7 + a)) * k * .8 : 0), z, 1.4, 1.2, 1.4, on ? MX[(a + r) % 3] : 0x262b44); } G.fin(); };
    const c = cam(46);
    return { s, c, upd(t) { grada(t, .3); F.ini(); fuegos(F, t, -60, 60, 60, 90, -50, [P.lime, P.white, P.red], 4); F.fin(); coh.forEach(m => m.visible = false); pp.forEach((m, i) => m.rotation.z = Math.sin(t * 2 + i) * .05);
        mira(c, [Math.sin(t * .1) * 8, 30, 96], [0, 34, -30], .0); },
      acc: {
        // se encienden las gradas, suben tres cohetes y estallan en verde, blanco y rojo sobre el estadio
        primera(lt, dur, t) { const k = clamp(lt / dur, 0, 1); grada(t, .3 + k * .7); F.ini(); fuegos(F, t, -60, 60, 60, 92, -40, [P.lime, P.white, P.red], 6, 2.2); F.fin();
          coh.forEach((m, i) => { const u = clamp((lt - i * .5) / 1.2, 0, 1); m.visible = u > 0 && u < 1; m.position.set(-30 + i * 30, lerp(4, 70, u * u), -20); });
          mira(c, [lerp(-10, 10, ss(k)), lerp(22, 30, k), lerp(100, 90, k)], [0, lerp(30, 40, k), -30], -.02); },
      } };
  },
});
Object.assign(FABE, {
  // —— Tres 1-0 1: sala de trofeos con tres peanas: tres copas doradas y sus marcadores 1-0 con el año ——
  salon_trofeos: () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(P.ink); s.fog = new THREE.Fog(P.ink, 120, 240);
    luces(s, { cielo: 0xffe8c8, suelo: 0x3e2731, amb: 1.1, sol: 0xfff1d6, int: 1.6, dir: [20, 80, 60], sombra: 60 });
    const v = new Vox(); v.box(-60, -1, -50, 60, 0, 60, (x, y, z) => ((x >> 2) + (z >> 2)) % 2 ? P.silver : P.white); v.box(-8, 0, -50, 8, .5 | 0 + 1, 60, P.crimson);
    v.box(-60, 0, -52, 60, 50, -50, (x, y) => (y % 10 === 0 || x % 15 === 0) ? P.umber : P.dbrown); v.box(-60, 30, -50, 60, 31, -49, P.amber); v.luz(P.amber);
    for (const x of [-20, 0, 20]) { v.box(x - 5, 0, -26, x + 6, 12, -16, P.white); v.box(x - 6, 12, -27, x + 7, 13, -15, P.silver); }
    v.box(-40, 0, 10, 40, 3, 22, P.dslate); v.box(-41, 3, 9, 41, 4, 23, P.slate); s.add(v.build());   // escenario
    const copas = [-20, 0, 20].map(x => { const m = actor('copa', .72); s.add(m); return m; });
    const tab = ['2010', '2023', '2026'].map((a, i) => { const p = pantalla(10, 7.5, 80, 60); rotular(p, ['1-0', a], ['#fee761', '#ffffff'], '#181425', 22, { borde: '#e43b44' }); p.m.position.set(-20 + i * 20, 6, -15.4); s.add(p.m); return p; });
    const focos = [-20, 0, 20].map(x => { const l = new THREE.SpotLight(0xfff1d6, 0, 90, .35, .5, 1); l.position.set(x, 45, 10); l.target.position.set(x, 13, -21); s.add(l, l.target); return l; });
    const Pp = new Bloques(80), Fl = new Bloques(20, true); s.add(Pp.im, Fl.im);
    const c = cam(46);
    const pon = (k, t) => copas.forEach((m, i) => { const u = clamp(k * 3 - i, 0, 1); m.visible = u > 0; m.position.set(-20 + i * 20, 13 + 6.9 + lerp(-14, 0, ss(u)) + (u >= 1 ? Math.sin(t * 2 + i) * .3 : 0), -21); m.rotation.y = t * .6 + i; focos[i].intensity = 900 * ss(u); tab[i].m.visible = u > .5; });
    return { s, c, upd(t) { pon(1, t); Pp.ini(); Pp.fin(); Fl.ini(); Fl.fin(); mira(c, [Math.sin(t * .1) * 3, 32, 104], [0, 15, -21], .02); },
      acc: {
        // las tres copas suben una tras otra a sus peanas, se encienden sus focos y sus marcadores 1-0
        tres_copas(lt, dur, t) { pon(clamp((lt - .1) / (dur * .75), 0, 1), t); Pp.ini(); Pp.fin(); Fl.ini(); Fl.fin(); const k = ss(clamp(lt / dur, 0, 1)); mira(c, [0, lerp(30, 32, k), lerp(96, 104, k)], [0, 15, -21], .02); },
        // tres seleccionadores de traje suben al escenario delante de las copas; los fotógrafos disparan sus flashes
        reunion(lt, dur, t) { pon(1, t); Pp.ini(); const k = clamp(lt / (dur * .6), 0, 1); ['', '', ''].forEach((_, i) => persona(Pp, lerp(-46 + i * 4, -10 + i * 10, ss(clamp(k * 1.3 - i * .15, 0, 1))), 4, 16, [P.ink, P.navy, P.dslate][i], { s: 1.25, pelo: [P.silver, P.white, P.dbrown][i] }));
          for (let i = 0; i < 5; i++) persona(Pp, -24 + i * 12, 0, 40, [P.slate, P.brown, P.navy, P.dgreen, P.plum][i], { s: 1.1, movil: P.ink }); Pp.fin();
          Fl.ini(); for (let i = 0; i < 5; i++) if (hsh(i, Math.floor(t * 6), 4) > .7 && k > .7) Fl.pon(-23 + i * 12, 6, 38.5, 2.2, 2.2, 1, P.white); Fl.fin();
          const q = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-8, 6, q), 34, lerp(112, 104, q)], [0, 12, -4], .02); },
      } };
  },
  // —— Tres 1-0 2: estadio de noche con cuatro torres de focos; la misma portería para las tres finales ——
  finales: () => {
    const s = new THREE.Scene(); s.background = cielo([P.ink, P.night, P.dslate]); s.fog = new THREE.Fog(P.night, 170, 330);
    luces(s, { cielo: 0xd8e8ff, suelo: 0x265c42, amb: 1.3, sol: 0xf4f8ff, int: 1.8, dir: [-20, 90, 50], sombra: 90 }); estrellas(s, 120, 260, 50);
    const zg = -30, v = new Vox(); cesped(v, -64, 64, -40, 70, zg, { punto: true });
    for (let k = 0; k < 11; k++) { v.box(-82, k * 2.6, -46 - k * 3, 82, k * 2.6 + 2.6, -43 - k * 3, P.slate); for (const sx of [-1, 1]) v.box(sx > 0 ? 68 + k * 3 : -71 - k * 3, k * 2.6, -46, sx > 0 ? 71 + k * 3 : -68 - k * 3, k * 2.6 + 2.6, 90, P.slate); }
    s.add(v.build());
    const por = new Vox(); for (const x of [-8, 7]) por.box(x, 0, 0, x + 1, 5, 1, P.white); por.box(-8, 5, 0, 8, 6, 1, P.white); for (let x = -7; x < 7; x++) for (let y = 0; y < 5; y++) if ((x + y) % 2 === 0) por.set(x, y, -4, P.silver); const gp = por.build({ jit: .02 }); gp.position.set(0, 0, zg); s.add(gp);
    for (const [x, z] of [[-78, -48], [78, -48], [-78, 70], [78, 70]]) { const m = actor('foco', 1); m.position.set(x, 0, z); m.rotation.y = Math.atan2(-x, -z) + Math.PI / 2 * 0; m.lookAt(0, 0, 0); s.add(m); }
    const marc = pantalla(26, 9.1, 320, 112); marc.m.position.set(0, 10, -44); s.add(marc.m);
    const copas = [0, 1].map(() => { const m = actor('copa', .85); s.add(m); return m; });
    const G = new Bloques(1500), Pp = new Bloques(80), bal = new Bloques(2), F = new Bloques(500, true); s.add(G.im, Pp.im, bal.im, F.im);
    const grada = (t, salto, col2) => { G.ini(); for (let k = 0; k < 11; k++) for (let x = -80; x < 80; x += 2.4) { const j = salto ? Math.abs(Math.sin(t * 9 + x * .7 + k)) * 1.2 : 0; const r = hsh(x * 10 | 0, k, 1); G.pon(x, k * 2.6 + 3 + j, -44.5 - k * 3, 1.4, 1.6, 1.2, r < .45 ? P.red : r < .6 ? P.yellow : r < .85 ? col2 : P.skin); } G.fin(); };
    const score = (a, rv, an, extra) => rotular(marc, [`ESP ${a}-0 ${rv}`, an + (extra ? ' · PRÓRROGA' : '')], ['#ffffff', '#fee761'], '#181425', 34, { borde: '#e43b44' });
    const c = cam(46);
    // una final: el balón sale del área, la portera o el portero se lanza, gol, el marcador pasa a 1-0 y la grada salta
    const final = (lt, dur, t, rv, col2, an, extra, fem) => { const g = clamp((lt - .8) / .8, 0, 1), gol = g >= 1; grada(t, gol, col2); score(gol ? 1 : 0, rv, an, extra); copas.forEach(m => m.visible = false); F.ini(); F.fin();
      bal.ini(); bal.pon(lerp(4, -4.5, g), lerp(.8, 3.4, g) + Math.sin(g * Math.PI) * 1.6, lerp(zg + 20, zg - 2, g), 1.8, 1.8, 1.8, P.white); bal.fin();
      const pelo = fem ? P.dbrown : P.ink; Pp.ini(); persona(Pp, lerp(0, 4, ss(g)), Math.sin(g * Math.PI) * 1.5, zg + 1.5, col2 === P.white ? P.ink : P.lime, { s: .62, ag: g * .5 });
      persona(Pp, 5, gol ? Math.abs(Math.sin(t * 8)) * 2 : 0, zg + 22 - (gol ? 4 : 0), P.red, { s: .62, pelo });
      for (let i = 0; i < 4; i++) persona(Pp, -12 + i * 7, gol ? Math.abs(Math.sin(t * 7 + i)) * 1.4 : 0, zg + 12 + (i & 1) * 5, i % 2 ? P.red : col2, { s: .62, pelo }); Pp.fin();
      const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-8, 8, k), lerp(32, 36, k), zg + lerp(66, 72, k)], [0, 4, zg + 6], .0); };
    return { s, c, upd(t) { grada(t, false, P.white); score(0, '???', 'FINAL', false); copas.forEach(m => m.visible = false); bal.ini(); bal.fin(); Pp.ini(); Pp.fin(); F.ini(); F.fin(); mira(c, [Math.sin(t * .1) * 6, 30, 50], [0, 18, -40], -.02); },
      acc: {
        // la cámara sube sobre el estadio iluminado; el marcador gigante pregunta
        pregunta(lt, dur, t) { grada(t, false, P.white); rotular(marc, ['¿RÉCORD?', 'ESPAÑA'], ['#fee761', '#ffffff'], '#181425', 34, { borde: '#e43b44' }); bal.ini(); bal.fin(); Pp.ini(); Pp.fin(); F.ini(); F.fin(); copas.forEach(m => m.visible = false);
          const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-30, 0, k), lerp(14, 34, k), lerp(70, 56, k)], [0, lerp(10, 30, k), -50], -.04); },
        f2010(lt, dur, t) { final(lt, dur, t, 'NED', P.orange, '2010', true, false); },
        f2023(lt, dur, t) { final(lt, dur, t, 'ENG', P.white, '2023', false, true); },
        f2026(lt, dur, t) { final(lt, dur, t, 'ARG', 0x7fc8ff, '2026', true, false); },
        // dos copas doradas suben en el centro del campo, rodeadas de jugadores y jugadoras de rojo, entre fuegos artificiales
        doble(lt, dur, t) { grada(t, true, P.yellow); rotular(marc, ['1-0 · 1-0 · 1-0', 'ESPAÑA'], ['#fee761', '#ffffff'], '#e43b44', 32, { borde: '#fee761' }); bal.ini(); bal.fin();
          const u = ss(clamp(lt / 1.2, 0, 1)); copas.forEach((m, i) => { m.visible = true; m.position.set(-9 + i * 18, lerp(-10, 8, u) + Math.sin(t * 2 + i) * .3, 12); m.rotation.y = t * .7 + i * 2; });
          Pp.ini(); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; persona(Pp, Math.cos(a) * 16 + (i < 5 ? -7 : 7) * 0, Math.abs(Math.sin(t * 7 + i)) * 1.6, 12 + Math.sin(a) * 10, P.red, { s: .8, pelo: i % 2 ? P.dbrown : P.ink }); } Pp.fin();
          F.ini(); fuegos(F, t, -50, 50, 50, 75, -50, [P.red, P.yellow, P.white], 5); F.fin();
          const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(0, 6, k), lerp(28, 32, k), lerp(88, 96, k)], [0, 9, 12], .0); },
      } };
  },
  // —— Tres 1-0 3: podio de campeones al aire libre, de noche, con dos copas plateadas y confeti rojo y amarillo ——
  podio: () => {
    const s = new THREE.Scene(); s.background = cielo([P.ink, P.navy, P.plum]); s.fog = new THREE.Fog(P.navy, 140, 280);
    luces(s, { cielo: 0xd8e8ff, suelo: 0x3a4466, amb: 1.2, sol: 0xfff1d6, int: 1.8, dir: [-20, 80, 60], sombra: 60 }); estrellas(s, 120, 240, 30);
    const v = new Vox(); v.box(-60, -1, -60, 60, 0, 60, (x, y, z) => ((x >> 3) + (z >> 3)) % 2 ? P.dslate : P.slate);
    v.box(-22, 0, -12, -2, 8, 6, P.red); v.box(2, 0, -12, 22, 8, 6, P.red); v.box(-23, 8, -13, -1, 9, 7, P.yellow); v.box(1, 8, -13, 23, 9, 7, P.yellow);
    v.box(-60, 0, -42, 60, 40, -40, (x, y) => ((x + 60) >> 4) % 2 ? P.crimson : P.red); v.box(-60, 34, -40, 60, 35, -39, P.yellow); v.luz(P.yellow); s.add(v.build());
    const eu = [0, 1].map(() => { const m = actor('copa_euro', 1); s.add(m); return m; });
    const tab = ['2012', '2024'].map((a, i) => { const p = pantalla(12, 4, 96, 32); rotular(p, [a], '#fee761', '#181425', 26, { borde: '#ffffff' }); p.m.position.set(-12 + i * 24, 4.5, 6.2); s.add(p.m); return p; });
    const Cf = new Bloques(500, true); s.add(Cf.im); const c = cam(46);
    const conf = (t, n) => { Cf.ini(); for (let i = 0; i < n; i++) { const x = hsh(i, 1, 3) * 90 - 45, z = hsh(i, 2, 3) * 50 - 20, y = 60 - ((t * (6 + hsh(i, 3, 3) * 5) + hsh(i, 4, 3) * 60) % 60); Cf.pon(x + Math.sin(t * 3 + i) * 2, y, z, 1, .3, .7, [P.red, P.yellow, P.white][i % 3], t * 4 + i); } Cf.fin(); };
    const pon = (u, t) => eu.forEach((m, i) => { m.position.set(-12 + i * 24, 9 + 11.5 + lerp(-20, 0, ss(clamp(u * 1.6 - i * .5, 0, 1))), -3); m.rotation.y = t * .7 + i * 1.5; });
    return { s, c, upd(t) { pon(1, t); conf(t, 260); mira(c, [Math.sin(t * .1) * 6, 30, 104], [0, 15, -3], .02); },
      acc: {
        // las dos copas plateadas suben girando a lo alto del podio, con sus años, bajo una lluvia de confeti
        euro(lt, dur, t) { pon(clamp(lt / (dur * .6), 0, 1), t); conf(t, Math.round(lerp(40, 480, clamp(lt / dur, 0, 1)))); const k = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-6, 6, k), lerp(26, 30, k), lerp(96, 106, k)], [0, 15, -3], .02); },
      } };
  },
});

// ———————— 25/11/2026: la caída mundial de Microsoft (código rojo), el permiso por nacimiento de 20 semanas y Mario Kart World 1.9.0 ————————
Object.assign(FAB, {
  // —— la caída de Microsoft ——
  servidor: () => {   // armario de servidores: chasis oscuro, bandejas con rejilla y huecos para los LED (los LED de estado van en un Bloques aparte); base en y = 0, frente hacia +z
    const v = new Vox(); v.box(-4, 0, -3, 4, 22, 3, (x, y, z) => (x === -4 || x === 3) ? P.dslate : P.night);
    for (let y = 2; y < 21; y += 2) v.box(-3, y, 3, 3, y + 1, 4, (x) => (x & 1) ? P.slate : P.dslate);
    v.box(-4, 22, -3, 4, 23, 3, P.steel); v.box(-4, 0, 3, 4, 1, 4, P.steel);
    const w = new THREE.Group(); w.add(v.build({ jit: .04 })); return w; },
  sobre: () => {   // sobre de correo: blanco con la solapa en V y el sello rojo
    const v = new Vox(); v.box(-5, -3, 0, 5, 4, 1, P.white);
    for (let x = -5; x < 5; x++) { const y = 3 - Math.round(Math.abs(x + .5) * .7); v.set(x, y, 1, P.silver); }
    v.box(2, 1, 1, 4, 3, 2, P.red); const w = new THREE.Group(); w.add(v.build({ jit: .03, centrar: true })); return w; },
  sirena: () => {   // luz de alarma: base gris y cúpula roja que gira (hijo 'giro') con un foco blanco dentro
    const v = new Vox(); v.cyl(0, 0, 0, 2, 4, P.steel); const w = new THREE.Group(); w.add(v.build({ jit: .03 }));
    const c = new Vox(); c.cyl(0, 0, 0, 5, 3, (x, y, z) => x > 0 && Math.abs(z) < 2 ? P.white : P.red); c.cyl(0, 0, 5, 6, 2, P.red); c.luz(P.red, P.white);
    const g = c.build({ jit: .02 }); g.position.y = 2; const piv = new THREE.Group(); piv.add(g); piv.name = 'giro'; w.add(piv); return w; },
});
// mano de un reloj de pared (en el plano x-y, mirando a +z): cubos a lo largo del ángulo a (0 = las 12)
function manecilla(B, cx, cy, cz, a, L, g, col) { for (let r = 0; r <= L; r += .8) B.pon(cx + Math.sin(a) * r, cy + Math.cos(a) * r, cz, g, g, .6, col); }
Object.assign(FABE, {
  // —— Microsoft 1: oficina diáfana con doce mesas; los monitores muestran el correo y los sobres vuelan de mesa en mesa ——
  oficinas: () => {
    const s = new THREE.Scene(), cieloDia = new THREE.Color(0x9fdcff), cieloNoche = new THREE.Color(0x101830); s.background = cieloDia.clone(); s.fog = new THREE.Fog(0xb8c8dc, 150, 320);
    luces(s, { cielo: 0xeef4ff, suelo: 0x5a6988, amb: 1.5, sol: 0xfff1d6, int: 1.7, dir: [-30, 80, 60], sombra: 90 });
    const v = new Vox();
    v.box(-70, -1, -52, 70, 0, 50, (x, y, z) => ((x >> 3) + (z >> 3)) & 1 ? 0x8b9bb4 : 0x9aaac2);   // moqueta
    v.box(-70, 0, -54, 70, 48, -52, (x, y) => (y >= 8 && y < 30 && ((x + 70) % 20) >= 3) ? undefined : (y % 8 === 0 ? P.slate : P.silver));   // fachada con ventanales
    for (const [k, c] of [...v.m]) if (c === undefined) v.m.delete(k);
    for (let x = -70; x < 70; x += 20) v.box(x, 8, -54, x + 3, 30, -52, P.steel);
    for (let x = -200; x < 200; x += 9) { const h = 14 + Math.round(hsh(x, 3, 1) * 50); v.box(x, -30, -150, x + 7, h, -142, hsh(x, 1, 2) > .5 ? 0x8fa0b8 : 0xa3b4c8); }   // ciudad al fondo
    for (const sx of [-74, 70]) v.box(sx, 0, -52, sx + 4, 48, 50, P.silver);
    const MES = []; for (const z of [-26, -12, 2]) for (const x of [-18, -6, 6, 18]) MES.push([x, z]);
    for (const [x, z] of MES) { v.box(x - 4, 5, z - 3, x + 5, 6, z + 3, P.tan); v.box(x - 4, 0, z - 3, x - 3, 5, z - 2, P.dslate); v.box(x + 4, 0, z - 3, x + 5, 5, z - 2, P.dslate); v.box(x - 4, 0, z + 2, x - 3, 5, z + 3, P.dslate); v.box(x + 4, 0, z + 2, x + 5, 5, z + 3, P.dslate);
      v.box(x, 6, z - 2, x + 1, 8, z - 1, P.ink); v.box(x - 1, 6, z, x + 3, 7, z + 2, P.dslate); }   // pie del monitor y teclado
    s.add(v.build({ jit: .04 }));
    const cara = new Vox(); cara.cyl(0, 0, -1, 0, 8, P.dslate); cara.cyl(0, 0, 0, 1, 7, P.white); for (let h = 0; h < 12; h++) { const a = h / 12 * 6.283; cara.set(Math.round(Math.sin(a) * 6), 1, Math.round(-Math.cos(a) * 6), P.ink); }
    const reloj = new THREE.Group(); const gr = cara.build({ jit: .01 }); gr.rotation.x = Math.PI / 2; reloj.add(gr); reloj.position.set(0, 38, -51); s.add(reloj);
    const sob = Array.from({ length: 10 }, () => { const m = actor('sobre', .45); s.add(m); return m; });
    const B = new Bloques(260), L = new Bloques(80, true), M = new Bloques(60, true); s.add(B.im, L.im, M.im);
    const c = cam(46);
    // estado de cada monitor: 1 encendido con el correo, 0 apagado (con un aviso rojo que parpadea)
    const pinta = (on, t, gente = true) => { L.ini(); B.ini(); MES.forEach(([x, z], i) => { const k = on(i); L.pon(x + .5, 10, z - 1.6, 7, 4.4, .4, k ? 0x2ce8f5 : 0x0b0b12);
        if (k) { L.pon(x + .5, 10.2, z - 1.3, 3, 2, .3, P.white); L.pon(x + .5, 10.9, z - 1.2, 3, .3, .3, P.blue); } else if (Math.floor(t * 3) % 2) L.pon(x + .5, 10, z - 1.3, .8, 2.6, .3, P.red);
        if (gente) persona(B, x + .5, 2, z + 5, [P.blue, P.orange, P.green, P.rose, P.navy, P.crimson][i % 6], { s: 1.15, ag: .35, pelo: [P.dbrown, P.ink, P.amber][i % 3] }); });
      B.fin(); L.fin(); };
    const vuela = (t, k) => sob.forEach((m, i) => { const a = MES[i % 12], b = MES[(i * 5 + 3) % 12], u = ((t * .5 + i * .37) % 1);
        const x = lerp(a[0], b[0], u), z = lerp(a[1], b[1], u), y = 13 + Math.sin(u * Math.PI) * 8; m.visible = true;
        if (k > 0) { const f = clamp(k * 1.6 - i * .06, 0, 1); m.position.set(x, lerp(y, 6.5, f * f), z); m.rotation.set(f * 1.3, t * .3 + i, 0); } else { m.position.set(x, y, z); m.rotation.set(0, Math.atan2(b[0] - a[0], b[1] - a[1]) - Math.PI / 2, Math.sin(t * 4 + i) * .2); } });
    const manos = (h) => { M.ini(); manecilla(M, 0, 38, -49.4, h / 12 * 6.283, 4.2, 1, P.ink); manecilla(M, 0, 38, -49.1, h * 6.283, 5.8, .7, P.red); M.fin(); };
    return { s, c, upd(t) { pinta(() => 1, t); vuela(t, 0); manos(10.1 + t / 600); s.background.copy(cieloDia);
        mira(c, [Math.sin(t * .1) * 5, 50, 96], [0, 5, -12], .02); },
      acc: {
        // los monitores se apagan en una ola que cruza la oficina; los sobres caen sobre las mesas
        apagon(lt, dur, t) { const k = clamp((lt - .5) / (dur * .7), 0, 1); const ord = MES.map(([x, z]) => Math.hypot(x + 22, z + 26) / 60);
          pinta(i => ord[i] > k, t); vuela(t, k); manos(10.1); const q = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-8, 6, q), lerp(52, 46, q), lerp(100, 90, q)], [0, 6, -12], .01); },
        // el reloj de la pared da vueltas: fuera se hace de noche y vuelve a amanecer, y los monitores siguen negros
        reloj(lt, dur, t) { const k = clamp(lt / (dur * .9), 0, 1); pinta(() => 0, t); sob.forEach(m => m.visible = false); manos(17 + k * 23);
          const n = (Math.cos(k * 6.283) * -.5 + .5); s.background.copy(cieloDia).lerp(cieloNoche, Math.sin(k * Math.PI)); 
          const q = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(10, -4, q), 30, lerp(48, 40, q)], [0, 30, -50], -.04); },
      } };
  },
  // —— Microsoft 2: la sala de las pasarelas: cinco armarios de servidores que reciben el correo y lo reparten ——
  pasarelas: () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(0x181425); s.fog = new THREE.Fog(0x181425, 140, 260);
    luces(s, { cielo: 0xc8d8ff, suelo: 0x262b44, amb: 1.25, sol: 0xdfe8ff, int: 1.6, dir: [-30, 70, 60], sombra: 80 });
    const v = new Vox(); v.box(-90, -1, -60, 90, 0, 60, (x, y, z) => (x % 6 === 0 || z % 6 === 0) ? P.dslate : P.slate);
    v.box(-90, 0, -62, 90, 40, -60, (x, y) => y % 10 === 0 ? P.dslate : P.night); for (let x = -80; x <= 80; x += 20) v.box(x, 38, -60, x + 8, 39, 40, P.white); v.luz(P.white);
    for (let x = -88; x < 90; x += 10) for (const z of [-44, -32]) v.box(x, 0, z, x + 8, 18, z + 5, (X, Y, Z) => Z === z + 4 && Y % 3 === 1 && (X & 1) ? P.lime : P.dslate);   // filas de armarios al fondo
    v.box(-64, 0, 14, -56, 10, 30, P.navy); v.box(56, 0, 14, 64, 10, 30, P.dgreen);   // puerta de entrada y salida
    v.luz(P.lime); s.add(v.build({ jit: .04 }));
    const XS = [-20, -10, 0, 10, 20], rk = XS.map(x => { const m = actor('servidor', 1); m.position.set(x, 0, -6); s.add(m); return m; });
    const B = new Bloques(700), G = new Bloques(260, true); s.add(B.im, G.im);
    const lab = [['ENTRA'], ['SALE']].map(l => { const p = pantalla(10, 3, 80, 24); rotular(p, l, '#ffffff', '#124e89', 18); s.add(p.m); return p; });
    lab[0].m.position.set(-60, 13, 22); lab[1].m.position.set(60, 13, 22); rotular(lab[1], ['SALE'], '#ffffff', '#265c42', 18);
    const c = cam(46);
    // st[i]: 0 bien, 0..1 cargado (ámbar), 2 caído (rojo y humo)
    const leds = (st, t, rot) => { G.ini(); XS.forEach((x, i) => { if (rot && Math.abs(rot[i]) > .02) return; const e = st[i];
        for (let y = 3; y < 21; y += 2) for (const dx of [-2, 0, 2]) { const on = hsh(i, y * 3 + dx, Math.floor(t * 6)) > .35; const col = e >= 2 ? (Math.floor(t * 4 + y) % 2 ? P.red : 0x3a1010) : e > 0 ? (on ? P.amber : 0x4a3010) : (on ? P.lime : 0x1a3a1a); G.pon(x + dx + .5, y + .5, -2.4, 1, .6, .4, col); } }); G.fin(); };
    const humo = (i, t) => { for (let k = 0; k < 8; k++) { const u = (t * .6 + k / 8) % 1; B.pon(XS[i] + Math.sin(k * 2 + t) * 2, 23 + u * 14, -6 + Math.cos(k) * 1.5, 1.5 + u * 2, 1.5 + u * 2, 1.5 + u * 2, 0x6a7088); } };
    // sobres que viajan de la entrada al servidor dest(j) y de ahí a la salida; si el destino está caído o atascado, se apilan delante
    const ENT = [-60, 4, 22], SAL = [60, 4, 22];
    const correo = (t, n, dest, ok) => { for (let j = 0; j < n; j++) { const u = (t * .32 + j / n) % 1, d = dest(j, Math.floor(t * .32 + j / n)); if (d < 0) continue; const X = XS[d], F = [X, 4, 0];
        let p; if (u < .5) { const f = u / .5; p = [lerp(ENT[0], F[0], f), 4 + Math.sin(f * Math.PI) * 6, lerp(ENT[2], F[2], f)]; }
        else { if (!ok(d)) continue; const f = (u - .5) / .5; p = [lerp(F[0], SAL[0], f), 4 + Math.sin(f * Math.PI) * 6, lerp(F[2], SAL[2], f)]; }
        B.pon(p[0], p[1], p[2], 2.6, 1.7, .4, P.white); B.pon(p[0] + .7, p[1] + .3, p[2] + .25, .6, .6, .2, P.red); } };
    const pila = (i, n) => { for (let k = 0; k < n; k++) B.pon(XS[i] + ((k % 3) - 1) * 2.7, .9 + Math.floor(k / 3) * 1.8, 1.5 + (k % 2) * .4, 2.6, 1.7, .5, k % 4 ? P.white : P.silver); };
    const pose0 = () => rk.forEach((m, i) => { m.position.set(XS[i], 0, -6); m.rotation.set(0, 0, 0); });
    return { s, c, upd(t) { pose0(); B.ini(); correo(t, 10, j => j % 5, () => true); B.fin(); leds([0, 0, 0, 0, 0], t); lab.forEach(p => p.m.visible = true);
        mira(c, [Math.sin(t * .1) * 8, 38, 112], [0, 9, -4], .06); },
      acc: {
        // la cámara pasa entre los armarios: los sobres se quedan quietos en el aire, a medio camino
        pregunta(lt, dur, t) { pose0(); const k = ss(clamp(lt / dur, 0, 1)); B.ini(); correo(1.3, 14, j => j % 5, () => false); B.fin(); leds([2, 2, 2, 2, 2], t);
          mira(c, [lerp(-60, -24, k), lerp(24, 32, k), lerp(80, 100, k)], [0, 9, -4], .06); },
        // los sobres entran, cada uno a un armario por turnos, y salen hacia la puerta verde
        reparto(lt, dur, t) { pose0(); B.ini(); correo(t, 15, j => j % 5, () => true); B.fin(); leds([0, 0, 0, 0, 0], t); const k = ss(clamp(lt / dur, 0, 1));
          mira(c, [lerp(-6, 6, k), 40, 118], [0, 8, 2], .06); },
        // demasiados sobres al del centro: se le apilan delante, sus luces pasan a ámbar y luego a rojo, y echa humo
        atasco(lt, dur, t) { pose0(); const k = clamp(lt / (dur * .85), 0, 1); B.ini(); correo(t, 15, j => (j % 3 === 0 ? 2 : j % 5), d => d !== 2); pila(2, Math.round(k * 15)); if (k > .7) humo(2, t); B.fin();
          leds([0, 0, k > .7 ? 2 : k + .01, 0, 0], t); const q = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(14, 6, q), lerp(32, 28, q), lerp(96, 80, q)], [0, 9, -2], .05); },
        // cascada: el tráfico del caído salta a sus vecinos, que se atascan y caen; luego los de los extremos
        cascada(lt, dur, t) { pose0(); const k = clamp(lt / (dur * .9), 0, 1), tc = [.55, .25, 0, .25, .55].map(a => clamp((k - a) / .3, 0, 1));
          const st = tc.map(f => f >= 1 ? 2 : f > 0 ? f : 0), vivos = st.map(e => e < 2); B.ini();
          correo(t, 15, j => { const d = j % 5; if (vivos[d]) return d; const alt = [d - 1, d + 1, d - 2, d + 2].find(a => a >= 0 && a < 5 && vivos[a]); return alt ?? d; }, d => st[d] === 0);
          st.forEach((e, i) => { if (e > 0) pila(i, Math.round(Math.min(1, e === 2 ? 1 : e) * 9)); if (e >= 2) humo(i, t + i); }); B.fin(); leds(st, t);
          mira(c, [0, 38, 116], [0, 9, -4], .06); },
        // como fichas de dominó: los armarios caen uno sobre otro y casi todas las luces se apagan
        domino(lt, dur, t) { const k = clamp(lt / (dur * .8), 0, 1), rot = XS.map((x, i) => { const f = ss(clamp(k * 5 - i * .9, 0, 1)); return -(i < 4 ? .5 : 1.25) * f; });
          rk.forEach((m, i) => { m.rotation.set(0, 0, rot[i]); m.position.set(XS[i] - 4 + 4 * Math.cos(rot[i]), 0, -6); });
          B.ini(); for (let i = 0; i < 5; i++) if (Math.abs(rot[i]) > .1) humo(i, t + i); B.fin(); leds([2, 2, 2, 2, 2], t, rot); lab.forEach(p => p.m.visible = false);
          const q = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-36, -16, q), 30, lerp(92, 100, q)], [2, 6, -6], .04); },
      } };
  },
  // —— Microsoft 3: la sala de crisis: mesa larga con portátiles, la pantalla de la pared y la sirena roja ——
  sala_roja: () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(0x181425); s.fog = new THREE.Fog(0x181425, 120, 240);
    luces(s, { cielo: 0xd8e0ff, suelo: 0x262b44, amb: 1.2, sol: 0xffffff, int: 1.3, dir: [-20, 70, 60], sombra: 70 });
    const roja = new THREE.PointLight(0xff3030, 0, 0, 0); roja.position.set(0, 26, 0); s.add(roja);
    const v = new Vox(); v.box(-60, -1, -50, 60, 0, 50, (x, y, z) => ((x + z) >> 2) & 1 ? P.dslate : P.slate);
    v.box(-60, 0, -42, 60, 40, -40, (x, y) => y % 8 === 0 ? P.dslate : P.night); for (const sx of [-60, 58]) v.box(sx, 0, -40, sx + 2, 40, 50, P.night);
    v.box(-22, -4 + 4, -26, 22, 7, -25, P.dslate);
    v.box(-20, 6, -12, 20, 7, 4, P.dbrown); for (const [x, z] of [[-18, -10], [17, -10], [-18, 2], [17, 2]]) v.box(x, 0, z, x + 1, 6, z + 1, P.ink);   // mesa
    for (let x = -16; x <= 14; x += 6) for (const z of [-9, 1]) { v.box(x, 7, z, x + 4, 8, z + 3, P.steel); }   // portátiles (base)
    s.add(v.build({ jit: .04 }));
    const pan = pantalla(40, 20, 200, 100); pan.m.position.set(0, 22, -39.5); s.add(pan.m);
    const sir = actor('sirena', 1.4); sir.position.set(0, 33, -38); s.add(sir);
    const B = new Bloques(200), L = new Bloques(40, true); s.add(B.im, L.im);
    const dib = (k, t, rojo) => { const { g, cv, tex } = pan, W2 = cv.width, H2 = cv.height; g.fillStyle = rojo ? '#3a0a10' : '#0b1830'; g.fillRect(0, 0, W2, H2);
      g.fillStyle = rojo ? (Math.floor(t * 3) % 2 ? '#e43b44' : '#a22633') : '#2ce8f5'; g.font = 'bold 22px monospace'; g.textAlign = 'center'; g.fillText(rojo ? 'CÓDIGO ROJO' : 'ESTADO: OK', W2 / 2, 26);
      const h = Math.max(1, Math.round(lerp(24, 1, k))); for (let i = 0; i < 24; i++) { g.fillStyle = i < h ? (h > 1 ? '#feae34' : '#63c74d') : '#262b44'; g.fillRect(12 + i * 7.3, 46, 6, 22); }
      g.fillStyle = '#ffffff'; g.font = 'bold 20px monospace'; g.fillText(h > 1 ? `${h} H` : 'MENOS DE 1 H', W2 / 2, 90); tex.needsUpdate = true; };
    const gente = (t, alza) => { B.ini(); const R2 = [P.blue, P.orange, P.green, P.rose, P.navy, P.crimson, P.plum, P.teal];
      [-15, -9, -3, 3, 9, 15].forEach((x, i) => { persona(B, x, 0, 9, R2[i], { s: 1.6, ag: .25, pelo: [P.ink, P.dbrown, P.amber][i % 3] }); if (alza && i % 2 === 0) B.pon(x + 1.6, 11 + Math.sin(t * 5 + i) * .5, 9, .9, 3, .9, P.skin); });
      [-13, -1, 11].forEach((x, i) => persona(B, x, 0, -18, R2[i + 5], { s: 1.6, pelo: [P.dbrown, P.ink, P.amber][i % 3] })); B.fin();
      L.ini(); for (let x = -16; x <= 14; x += 6) for (const z of [-9, 1]) L.pon(x + 2, 9.2, z + (z < 0 ? .3 : 2.7), 4, 2.4, .3, Math.floor(t * 2 + x) % 3 ? 0x2ce8f5 : P.red); L.fin(); };
    const c = cam(46);
    return { s, c, upd(t) { roja.intensity = 0; sir.getObjectByName('giro').rotation.y = 0; dib(0, t, false); gente(t, false);
        mira(c, [Math.sin(t * .1) * 6, 34, 92], [0, 18, -20], .02); },
      acc: {
        // la sirena gira, la sala se tiñe de rojo y la pantalla baja la meta de 24 horas a menos de una
        codigo_rojo(lt, dur, t) { const k = clamp((lt - .6) / (dur * .75), 0, 1); sir.getObjectByName('giro').rotation.y = t * 5; roja.intensity = 2.2 + Math.sin(t * 10) * 1.4; dib(k, t, true); gente(t, true);
          const q = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(14, -4, q), lerp(34, 30, q), lerp(96, 84, q)], [0, 19, -20], .02); },
      } };
  },
});
Object.assign(FAB, {
  // —— el permiso por nacimiento ——
  cuna: () => {   // cuna de madera con barrotes, colchón azul claro y mantita a rayas; base en y = 0
    const v = new Vox(); for (const [x, z] of [[-8, -5], [7, -5], [-8, 4], [7, 4]]) v.box(x, 0, z, x + 1, 14, z + 1, P.brown);
    v.box(-8, 4, -5, 8, 5, 5, P.dbrown); v.box(-7, 5, -4, 7, 7, 4, 0xbfe8ff); v.box(-2, 7, -4, 7, 8, 4, (x, y, z) => (z & 1) ? P.pink : P.white); v.box(-7, 7, -2, -4, 8, 2, P.white);
    for (let x = -8; x < 8; x += 2) { v.box(x, 5, -5, x + 1, 13, -4, P.tan); v.box(x, 5, 4, x + 1, 13, 5, P.tan); } v.box(-8, 13, -5, 8, 14, -4, P.brown); v.box(-8, 13, 4, 8, 14, 5, P.brown);
    for (let z = -5; z < 5; z += 2) { v.box(-8, 5, z, -7, 13, z + 1, P.tan); v.box(7, 5, z, 8, 13, z + 1, P.tan); }
    const w = new THREE.Group(); w.add(v.build({ jit: .04 })); return w; },
  carrito: () => {   // carrito de bebé: capota azul, cuerpo blanco, asa y cuatro ruedas; base en y = 0, delante hacia +x
    const v = new Vox(); for (const [x, z] of [[-4, -4], [4, -4], [-4, 3], [4, 3]]) v.box(x - 1, 0, z, x + 2, 3, z + 1, P.ink);
    v.box(-5, 3, -3, 6, 4, 3, P.steel); v.box(-5, 4, -3, 6, 9, 3, (x, y) => y === 8 ? P.cyan : P.white);
    for (let a = 0; a < 7; a++) { const x0 = -5 + a, y0 = 9 + Math.round(Math.sin(a / 6 * Math.PI) * 0) ; v.box(-5, 9, -3, -5 + 7 - a, 9 + a, 3, P.blue); }
    for (const [k, c] of [...v.m]) { const [x, y] = k.split(',').map(Number); if (y > 9 && x > -5 + 7 - (y - 9) * 1.2) v.m.delete(k); }
    v.box(-8, 9, -3, -7, 15, -2, P.dslate); v.box(-8, 9, 2, -7, 15, 3, P.dslate); v.box(-9, 14, -3, -8, 15, 3, P.ink); v.box(-7, 4, -3, -5, 5, -2, P.dslate); v.box(-7, 4, 2, -5, 5, 3, P.dslate);
    const w = new THREE.Group(); w.add(v.build({ jit: .04 })); return w; },
  balanza: () => {   // balanza de dos platos: peana y columna de latón; el brazo (hijo 'brazo') se inclina; los platos van aparte
    const v = new Vox(); v.cyl(0, 0, 0, 2, 6, P.dbrown); v.cyl(0, 0, 2, 3, 4, P.amber); v.cyl(0, 0, 3, 24, 1, P.amber); v.ball(0, 25, 0, 1.6, P.yellow);
    const w = new THREE.Group(); w.add(v.build({ jit: .03 }));
    const b = new Vox(); b.box(-15, 0, 0, 16, 1, 1, P.amber); b.box(-15, -1, 0, -14, 0, 1, P.yellow); b.box(15, -1, 0, 16, 0, 1, P.yellow);
    const gb = b.build({ jit: .02 }); gb.position.set(-.5, -.5, -.5); const piv = new THREE.Group(); piv.add(gb); piv.position.y = 25; piv.name = 'brazo'; w.add(piv); return w; },
});
Object.assign(FABE, {
  // —— Permiso 1: el cuarto del bebé: cuna con móvil, ventana, calendario en la pared; el carrito entra con la familia ——
  cuarto_bebe: () => {
    const s = new THREE.Scene(); s.background = cielo([0x7fc8ff, 0xdff4ff]); s.fog = new THREE.Fog(0xfff4ec, 150, 300);
    luces(s, { cielo: 0xfff4e8, suelo: 0x8a6a5a, amb: 1.6, sol: 0xfff1d6, int: 1.7, dir: [30, 80, 70], sombra: 80 });
    const v = new Vox(); v.box(-50, -1, -40, 50, 0, 50, (x, y, z) => (z % 5 === 0) ? P.brown : (((x + (z / 5 | 0) * 7) % 16) === 0 ? P.dbrown : P.tan));   // tarima
    v.box(-50, 0, -42, 50, 44, -40, (x, y) => (y >= 12 && y < 32 && x >= -32 && x < -10) ? undefined : (y < 3 ? P.white : (((x >> 2) + (y >> 2)) & 1 ? 0xfde0e6 : 0xfff0f2)));   // pared con ventana
    v.box(-52, 0, -42, -50, 44, 50, (x, y, z) => (y < 3 ? P.white : ((z >> 2) & 1 ? 0xd6f0ff : 0xe8f8ff)));
    for (const [k, c] of [...v.m]) if (c === undefined) v.m.delete(k);
    v.box(-33, 11, -41, -9, 12, -39, P.white); v.box(-33, 32, -41, -9, 33, -39, P.white); v.box(-22, 12, -41, -21, 32, -40, P.white);   // marco
    v.box(-80, -10, -90, 80, 6, -88, P.green); for (let x = -80; x < 80; x += 12) abeto(v, x, -80, 22 + (x % 3) * 3);
    v.box(-16, 0, 6, 16, 1, 26, (x, y, z) => ((x + z) % 6 < 3) ? P.cyan : P.white);   // alfombra
    v.box(24, 0, -38, 44, 18, -32, P.white); v.box(24, 9, -38, 44, 10, -31, P.tan); for (const [x, c] of [[27, P.red], [32, P.yellow], [37, P.lime], [41, P.blue]]) v.box(x, 10, -36, x + 3, 13, -33, c);   // cómoda con juguetes
    s.add(v.build({ jit: .04 }));
    const cuna = actor('cuna', 1.2); cuna.position.set(-10, 0, -24); s.add(cuna);
    const car = actor('carrito', 1.2); s.add(car);
    const cal = pantalla(15, 17, 128, 144); cal.m.position.set(14, 25, -39.6); s.add(cal.m);
    const B = new Bloques(260), H = new Bloques(60, true); s.add(B.im, H.im);
    const hoja = (d, n) => rotular(cal, ['NOVIEMBRE', d, n], ['#a22633', '#181425', '#e43b44'], '#fff4ec', 22);
    const c = cam(46);
    const movil = t => { H.ini(); const cx = -10, cz = -24, y = 25; H.pon(cx, y + 6, cz, .4, 6, .4, P.white);
      for (let k = 0; k < 5; k++) { const a = t * 1.2 + k / 5 * 6.283; H.pon(cx + Math.cos(a) * 5, y - 1, cz + Math.sin(a) * 5, .3, 3, .3, P.white); H.pon(cx + Math.cos(a) * 5, y - 3.5, cz + Math.sin(a) * 5, 2, 2, 2, [P.yellow, P.pink, P.cyan, P.lime, P.orange][k]); } H.fin(); };
    const papis = (x, z, t, anda) => { const p = anda ? Math.sin(t * 8) * .5 : 0; persona(B, x + 11, Math.abs(p) * .4, z - 4, P.navy, { s: 2.4, pelo: P.ink }); persona(B, x + 12, Math.abs(-p) * .4, z + 5, P.rose, { s: 2.3, pelo: P.amber }); };
    // hojas del calendario que caen
    const hojas = (k, t) => { for (let i = 0; i < 6; i++) { const f = clamp(k * 7 - i, 0, 1); if (f <= 0 || f >= 1) continue; B.pon(14 + f * 22 + Math.sin(f * 9 + i) * 2, 25 - f * 25, -38 + f * 6, 7, 8, .3, 0xfff4ec, f * 2); } };
    return { s, c, upd(t) { B.ini(); car.position.set(12, 0, 2); car.rotation.y = Math.PI; papis(12, 2, t, false); B.fin(); movil(t); hoja('MARTES', '24');
        mira(c, [Math.sin(t * .1) * 6 + 2, 42, 104], [2, 12, -14], .0); },
      acc: {
        // el carrito entra desde la derecha empujado por la familia y se para junto a la cuna; el móvil gira
        llega_bebe(lt, dur, t) { const k = ss(clamp(lt / (dur * .85), 0, 1)), x = lerp(50, 4, k); B.ini(); car.position.set(x, 0, 4); car.rotation.y = Math.PI; papis(x, 4, t, k < .99); B.fin(); movil(t); hoja('LUNES', '23');
          mira(c, [lerp(10, 2, k), 42, 106], [lerp(10, 2, k), 12, -12], .0); },
        // las hojas del calendario caen hasta el martes 24
        martes(lt, dur, t) { const k = clamp(lt / (dur * .7), 0, 1); B.ini(); car.position.set(4, 0, 4); car.rotation.y = Math.PI; papis(4, 4, t, false); hojas(k, t); B.fin(); movil(t); hoja(k < .6 ? 'LUNES' : 'MARTES', k < .6 ? '23' : '24');
          const q = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(4, 12, q), lerp(40, 30, q), lerp(96, 22, q)], [lerp(4, 14, q), lerp(14, 24, q), -38], .0); },
      } };
  },
  // —— Permiso 2: el camino de las semanas: dos carriles de 20 casillas en un parque, uno por progenitor ——
  semanario: () => {
    const s = new THREE.Scene(); s.background = cielo([P.blue, 0x9fdcff, 0xe8f8ff]); s.fog = new THREE.Fog(0xe8f8ff, 170, 340);
    luces(s, { cielo: 0xeef8ff, suelo: 0x4a7a4a, amb: 1.5, sol: 0xfff1d6, int: 2, dir: [-40, 80, 50], sombra: 110 });
    const v = new Vox(); v.box(-90, -1, -170, 90, 0, 70, (x, y, z) => hsh(x >> 2, 1, z >> 2) > .5 ? P.green : 0x4a9a52);
    for (let i = 0; i < 26; i++) { const x = (i % 2 ? 1 : -1) * (28 + hsh(i, 2, 2) * 40), z = 40 - i * 8; abeto(v, Math.round(x), Math.round(z), 14 + Math.round(hsh(i, 3, 3) * 8)); }
    v.box(-16, 0, -152, 16, 1, 36, P.sand); s.add(v.build({ jit: .04 }));
    const car = actor('carrito', 1); s.add(car);
    const B = new Bloques(500), G = new Bloques(120, true); s.add(B.im, G.im);
    const ZT = i => 28 - i * 8;   // casilla i (0..19)
    const casillas = (nA, nB, n20, ext) => { B.ini(); for (const [x, n, col] of [[-7, nA, P.lime], [7, nB, P.cyan]]) for (let i = 0; i < 20; i++) {
        if (i === 19) { if (n20 <= 0) continue; const y = lerp(40, 1.2, ss(Math.min(1, n20))); B.pon(x, y, ZT(i), 6.2, 1.4, 6.2, P.amber); continue; }
        B.pon(x, 1.2, ZT(i), 6.2, 1, 6.2, i < n ? col : (i % 2 ? P.white : P.silver)); } };
    const papis = (fa, fb, t) => { for (const [x, f, ropa, pelo] of [[-7, fa, P.navy, P.ink], [7, fb, P.rose, P.amber]]) { const z = lerp(36, ZT(Math.min(19, f)), f > 0 ? 1 : 0) , anda = Math.sin(t * 9) * .4;
        const zz = f <= 0 ? 36 : lerp(ZT(Math.floor(f)), ZT(Math.min(19, Math.floor(f) + 1)), f % 1); persona(B, x, 1.7 + Math.abs(anda), zz, ropa, { s: 2.2, pelo }); } };
    const c = cam(46);
    return { s, c, upd(t) { car.visible = false; casillas(19, 19, 1, 0); papis(0, 0, t); B.fin(); G.ini(); G.fin();
        mira(c, [Math.sin(t * .1) * 6, 44, 84], [0, 0, -40], .02); },
      acc: {
        // el carrito y los dos progenitores al principio del camino; la cámara vuela por encima de las casillas
        pregunta(lt, dur, t) { car.visible = true; car.position.set(0, 1.5, 40); car.rotation.y = Math.PI / 2; casillas(0, 0, 0); papis(0, 0, t); B.fin(); G.ini(); G.fin(); const k = ss(clamp(lt / dur, 0, 1));
          mira(c, [lerp(-34, 0, k), lerp(36, 50, k), lerp(110, 116, k)], [0, 0, lerp(16, -40, k)], .02); },
        // cada uno avanza por su carril encendiendo casillas; al llegar a la 19 cae del cielo la casilla 20, dorada
        veinte(lt, dur, t) { car.visible = false; const k = clamp(lt / (dur * .65), 0, 1), n = k * 19, f20 = clamp((lt - dur * .68) / .5, 0, 1); casillas(Math.floor(n), Math.floor(n), f20); papis(Math.min(n, 18.99) + (f20 >= 1 ? clamp((lt - dur * .8) / .4, 0, 1) : 0), Math.min(n, 18.99) + (f20 >= 1 ? clamp((lt - dur * .8) / .4, 0, 1) : 0), t); B.fin(); G.ini(); G.fin();
          const q = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-14, 14, q), lerp(46, 52, q), lerp(80, 40, q)], [0, 0, lerp(-30, -100, q)], .02); },
        // un muro de cristal sube entre los carriles: una casilla intenta saltar al otro lado y rebota; después dos barras se llenan al 100 %
        cobro(lt, dur, t) { car.visible = false; casillas(19, 19, 1); papis(19, 19, t); const m = ss(clamp(lt / .6, 0, 1)), j = clamp((lt - .7) / 1.2, 0, 1), xj = -7 + Math.sin(j * Math.PI) * 6, yj = 3 + Math.sin(j * Math.PI) * 9;
          if (j > 0 && j < 1) B.pon(xj, yj, -40, 4, 1.2, 4, P.lime, j * 6);
          const f = ss(clamp((lt - dur * .45) / (dur * .4), 0, 1)); for (const [x, col] of [[-7, P.lime], [7, P.cyan]]) { B.pon(x, 2 + 9 * f, -138, 6, 18 * f, 4, col); B.pon(x, 20.5, -138, 6.4, 1, 4.4, P.white); }
          B.fin(); G.ini(); G.pon(0, 1 + 4 * m, -50, .6, 8 * m, 170, 0xbfefff); G.fin();
          const q = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-50, -40, q), lerp(46, 52, q), lerp(10, -20, q)], [0, 6, lerp(-50, -110, q)], .02); },
      } };
  },
  // —— Permiso 3: la sala de la Diputación Permanente: escaños en filas, la mesa, banderas, el atril y la balanza ——
  diputacion: () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(0x3e2731); s.fog = new THREE.Fog(0x3e2731, 140, 260);
    luces(s, { cielo: 0xfff0d8, suelo: 0x733e39, amb: 1.4, sol: 0xfff1d6, int: 1.7, dir: [-30, 80, 60], sombra: 90 });
    const v = new Vox(); v.box(-60, -1, -50, 60, 0, 60, (x, y, z) => (Math.abs(x) < 6) ? P.crimson : (((x + z) >> 2) & 1 ? P.dbrown : P.brown));
    v.box(-60, 0, -52, 60, 46, -50, (x, y) => (x % 10 === 0 || y % 12 === 0) ? P.dbrown : P.brown); for (const sx of [-62, 60]) v.box(sx, 0, -50, sx + 2, 46, 60, P.dbrown);
    v.box(-30, 0, -46, 30, 4, -34, P.dbrown); v.box(-26, 4, -44, 26, 10, -38, P.brown); v.box(-26, 10, -44, 26, 11, -37, P.tan);   // mesa de la presidencia
    for (let x = -24; x < 26; x += 8) v.box(x, 4, -48, x + 4, 16, -45, P.crimson);   // sillones
    for (let f = 0; f < 4; f++) { const z = 4 + f * 9, y = f * 1.5; for (const sd of [-1, 1]) { v.box(sd > 0 ? 8 : -46, 0, z, sd > 0 ? 46 : -8, Math.round(y) + 1, z + 8, P.dbrown); v.box(sd > 0 ? 8 : -46, Math.round(y) + 1, z, sd > 0 ? 46 : -8, Math.round(y) + 5, z + 2, P.brown); } }
    s.add(v.build({ jit: .04 }));
    const atr = actor('atril', 1); atr.position.set(0, 0, -16); s.add(atr);
    const bal = actor('balanza', 1); bal.position.set(0, 0, -16); s.add(bal);
    const cal = pantalla(14, 10, 96, 72); cal.m.position.set(-20, 30, -49.5); s.add(cal.m);
    const B = new Bloques(500), F = new Bloques(80); s.add(B.im, F.im);
    const SITIOS = []; for (let f = 0; f < 4; f++) for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) SITIOS.push([sd * (12 + i * 9), f * 1.5 + 1, 10 + f * 9]);
    const banderas = t => { F.ini(); banderaB(F, -40, 0, -46, [P.red, P.yellow, P.red], t, 2.4); banderaB(F, 30, 0, -46, [P.navy, P.yellow, P.navy], t, 2.4); F.fin(); };
    const gente = (alz, t) => { SITIOS.forEach(([x, y, z], i) => { persona(B, x, y, z, [P.navy, P.dslate, P.plum, P.teal, P.crimson][i % 5], { s: 1.7, ag: .3, pelo: [P.ink, P.dbrown, P.silver, P.amber][i % 4] });
      if (i < alz) { B.pon(x + 1.6, y + 9.5, z, .8, 3, .8, P.skin); B.pon(x + 1.6, y + 11.6, z, 2, 1.4, .3, P.lime); } }); };
    const dias = n => rotular(cal, ['PLAZO', n > 0 ? `DÍA ${n} / 30` : '30 DÍAS'], ['#feae34', '#ffffff'], '#181425', 16, { borde: '#feae34' });
    const c = cam(46);
    const base = () => { atr.visible = true; bal.visible = false; };
    return { s, c, upd(t) { base(); B.ini(); gente(0, t); B.fin(); banderas(t); dias(0);
        mira(c, [Math.sin(t * .1) * 6, 56, 104], [0, 10, -20], .0); },
      acc: {
        // una carpeta con lazo rojo baja volando y se posa en el atril; un sello la marca: real decreto-ley
        decreto(lt, dur, t) { base(); const k = ss(clamp(lt / (dur * .55), 0, 1)); B.ini(); gente(0, t); const x = lerp(40, 0, k), y = lerp(50, 19.6, k), z = lerp(20, -16, k);
          B.pon(x, y, z, 9, .8, 6.5, P.amber, (1 - k) * 3); B.pon(x, y + .5, z, 1.2, .3, 6.6, P.red, (1 - k) * 3);
          const sl = clamp((lt - dur * .65) / .3, 0, 1); if (sl > 0) { B.pon(2.4, lerp(30, 20.6, ss(sl)), -15, 3, 1.4, 3, P.red); B.pon(2.4, lerp(32, 22.4, ss(sl)), -15, 1.2, 3, 1.2, P.dbrown); }
          B.fin(); banderas(t); dias(0); const q = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(18, 6, q), lerp(48, 40, q), lerp(90, 62, q)], [0, 16, -16], .03); },
        // los diputados levantan la mano con su tarjeta verde uno a uno; el plazo de la pared corre de 30 días a la votación
        votacion(lt, dur, t) { base(); const k = clamp(lt / (dur * .85), 0, 1); B.ini(); gente(Math.round(k * SITIOS.length), t); B.fin(); banderas(t); dias(Math.max(1, Math.round(30 * k)));
          const q = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-10, 6, q), lerp(60, 54, q), lerp(108, 100, q)], [0, 10, -10], .0); },
        // la balanza: dieciséis bloques rosas y dieciséis azules caen en los platos hasta quedar igualados
        igualdad(lt, dur, t) { atr.visible = false; bal.visible = true; const k = clamp(lt / (dur * .75), 0, 1), na = Math.min(16, Math.round(k * 22)), nb = Math.min(16, Math.round(k * 16));
          const ang = clamp((na - nb) * .03, -.3, .3); bal.getObjectByName('brazo').rotation.z = ang; B.ini(); gente(0, t);
          for (const [sd, n, col] of [[-1, na, P.pink], [1, nb, P.cyan]]) { const px = sd * 15, yy = 25 + sd * Math.sin(ang) * 15 - 9;
            B.pon(px, yy + 5, -16, .3, 9, .3, P.amber); B.pon(px, yy, -16, 9, .6, 9, P.yellow); for (let i = 0; i < n; i++) B.pon(px + ((i % 4) - 1.5) * 2, yy + 1 + Math.floor(i / 4) * 1.6, -16 + ((i >> 1) & 1 ? 1 : -1), 1.8, 1.4, 1.8, col); }
          B.fin(); banderas(t); dias(0); const q = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-8, 6, q), 40, lerp(84, 74, q)], [0, 18, -16], .0); },
      } };
  },
});
Object.assign(FAB, {
  atril: () => {   // atril de madera con micrófono
    const v = new Vox(); v.box(-4, 0, -3, 5, 2, 4, P.dbrown); v.box(-2, 2, -1, 3, 16, 2, P.brown); v.box(-6, 16, -4, 7, 18, 5, P.dbrown); v.box(-6, 18, -4, 7, 19, 4, P.tan);
    v.box(0, 19, -3, 1, 24, -2, P.ink); v.ball(0, 24, -2, 1, P.slate); const w = new THREE.Group(); w.add(v.build({ jit: .04 })); return w; },
});
// kart genérico (sin personajes ni marcas): chasis de color, piloto con casco blanco y visera, cuatro ruedas gordas; morro hacia +x, base en y = 0
function kartV(col, col2 = P.white) { const v = new Vox();
  for (const [x, z] of [[-4, -4], [3, -4], [-4, 3], [3, 3]]) v.box(x - 1, 0, z, x + 2, 3, z + 1, (X, Y) => Y === 1 && X === x ? P.steel : P.ink);
  v.box(-5, 1, -3, 6, 3, 3, col); v.box(5, 1, -3, 7, 2, 3, col2); v.box(-6, 2, -3, -5, 4, 3, P.dslate); v.box(-6, 4, -3, -5, 5, 3, col);   // chasis, morro y alerón
  v.box(-3, 3, -2, 1, 4, 2, P.ink); v.box(-3, 4, -2, -2, 7, 2, P.ink);   // asiento
  v.box(-2, 3, -2, 1, 7, 2, col2 === P.white ? P.navy : col2); v.box(1, 5, -1, 3, 6, 1, P.dslate); v.box(2, 5, -2, 3, 7, 2, P.dslate);   // piloto y volante
  v.ball(-.5, 9, 0, 2.2, (x, y, z) => (x > .8 && y > -1 && y < 1.2) ? P.ink : P.white);   // casco con visera
  v.box(-7, 2, -2, -6, 3, -1, P.steel); v.box(-7, 2, 1, -6, 3, 2, P.steel);   // escapes
  const w = new THREE.Group(); w.add(v.build({ jit: .04 })); return w; }
Object.assign(FAB, {
  // —— Mario Kart World 1.9.0 ——
  kart: () => kartV(P.red), kart_b: () => kartV(P.blue), kart_v: () => kartV(P.lime, P.dgreen), kart_a: () => kartV(P.yellow, P.orange), kart_m: () => kartV(P.plum, P.pink), kart_n: () => kartV(P.orange, P.amber),
  dron: () => {   // dron con cámara: cuatro rotores (hijos 'rotor') y piloto rojo de grabación
    const v = new Vox(); v.box(-2, 0, -2, 3, 2, 3, P.dslate); v.box(-1, -2, -1, 2, 0, 2, P.ink); v.set(1, -1, 2, P.cyan); v.set(0, 2, 0, P.red); v.luz(P.red, P.cyan);
    for (const [x, z] of [[-5, -5], [5, -5], [-5, 5], [5, 5]]) { v.box(Math.min(x, 0), 1, 0, Math.max(x, 0) + 1, 2, 1, P.steel); v.box(0, 1, Math.min(z, 0), 1, 2, Math.max(z, 0) + 1, P.steel); v.box(x, 2, z, x + 1, 3, z + 1, P.ink); }
    const w = new THREE.Group(); w.add(v.build({ jit: .03 }));
    for (const [x, z] of [[-5, -5], [5, -5], [-5, 5], [5, 5]]) { const r = new Vox(); r.box(-3, 0, 0, 4, 1, 1, P.silver); const g = r.build({ jit: 0 }); g.position.set(-.5, 0, -.5); const p = new THREE.Group(); p.add(g); p.position.set(x + .5, 3.2, z + .5); p.name = 'rotor'; w.add(p); }
    return w; },
  carrete: () => {   // carrete de película: dos discos con agujeros y la cinta enrollada; eje en z
    const v = new Vox(); for (const z of [-2, 2]) { for (let x = -6; x <= 6; x++) for (let y = -6; y <= 6; y++) { const d = x * x + y * y; if (d <= 38 && !(d >= 8 && d <= 22 && ((Math.atan2(y, x) + 7) * 1.6 | 0) % 2)) v.set(x, y, z, P.silver); } }
    for (let x = -4; x <= 4; x++) for (let y = -4; y <= 4; y++) if (x * x + y * y <= 18) for (let z = -1; z <= 1; z++) v.set(x, y, z, x * x + y * y <= 3 ? P.steel : 0x2a2a36);
    const w = new THREE.Group(); w.add(v.build({ jit: .03, centrar: true })); return w; },
});
// circuito ovalado (dos rectas de 80 y dos curvas de radio R) → [x, z, yaw] en la distancia u
const OV = { L: 40, R: 20 }; OV.P = 4 * OV.L + 2 * Math.PI * OV.R;
function oval(u) { const { L, R } = OV, A = Math.PI * R; u = ((u % OV.P) + OV.P) % OV.P; let x, z;
  if (u < L) { x = u; z = R; } else if (u < L + A) { const a = Math.PI / 2 - (u - L) / R; x = L + Math.cos(a) * R; z = Math.sin(a) * R; }
  else if (u < 3 * L + A) { x = L - (u - L - A); z = -R; } else if (u < 3 * L + 2 * A) { const a = -Math.PI / 2 - (u - 3 * L - A) / R; x = -L + Math.cos(a) * R; z = Math.sin(a) * R; }
  else { x = -L + (u - 3 * L - 2 * A); z = R; } return [x, z]; }
function enOval(m, u, y = 0) { const [x, z] = oval(u), [x2, z2] = oval(u + 1); m.position.set(x, y, z); m.rotation.set(0, Math.atan2(-(z2 - z), x2 - x), 0); }
const ovD = (x, z) => { const ax = Math.abs(x); return ax <= OV.L ? Math.abs(Math.abs(z) - OV.R) : Math.abs(Math.hypot(ax - OV.L, z) - OV.R); };
Object.assign(FABE, {
  // —— Mario Kart 1: circuito del desierto: óvalo de asfalto con pianos, dunas, cactus, grada y el semáforo de salida ——
  pista_arena: () => {
    const s = new THREE.Scene(); s.background = cielo([0x0099db, 0x7fd0ff, 0xffe6b0]); s.fog = new THREE.Fog(0xffe6b0, 170, 360);
    luces(s, { cielo: 0xfff4e0, suelo: 0xb08a50, amb: 1.5, sol: 0xfff1d6, int: 2.2, dir: [-40, 90, 50], sombra: 110 });
    const v = new Vox();
    for (let x = -110; x < 110; x++) for (let z = -90; z < 90; z++) { const d = ovD(x + .5, z + .5); let c, y = -1;
      if (d < 6) c = (Math.abs(x) < 1.5 && z > 0) ? (((z + (x < 0 ? 1 : 0)) & 1) ? P.white : P.ink) : (hsh(x, 1, z) > .9 ? 0x4a5370 : P.dslate);
      else if (d < 7.5) c = ((Math.floor((x + z) / 2)) & 1) ? P.red : P.white;
      else { c = hsh(x >> 2, 3, z >> 2) > .5 ? P.sand : 0xf0dcb0; if (d > 30) y = Math.round(Math.max(0, Math.sin(x * .05) * Math.cos(z * .07) * 5 + (d - 30) * .06)) - 1; }
      v.set(x, y, z, c); if (y > -1) v.box(x, -1, z, x + 1, y, z + 1, P.tan); }
    for (let i = 0; i < 18; i++) { const x = Math.round(hsh(i, 1, 9) * 200 - 100), z = Math.round(hsh(i, 2, 9) * 160 - 80); if (ovD(x, z) < 14) continue; const h = 6 + (i % 4) * 2;
      v.box(x, 0, z, x + 2, h, z + 2, P.green); v.box(x - 3, 3, z, x, 4, z + 2, P.green); v.box(x - 3, 4, z, x - 2, 7, z + 2, P.green); v.box(x + 2, 4, z, x + 5, 5, z + 2, P.green); v.box(x + 4, 5, z, x + 5, 8, z + 2, P.green); }
    for (let f = 0; f < 5; f++) v.box(-36, f * 2, -37 - f * 3, 36, f * 2 + 2, -34 - f * 3, (x) => f === 4 ? P.slate : (hsh(x, f, 3) > .5 ? [P.red, P.blue, P.yellow, P.lime][x & 3] : P.silver));   // grada
    v.box(-36, 10, -50, 36, 12, -48, P.slate);
    v.box(-2, 0, 9, 0, 18, 11, P.steel); v.box(-2, 0, 31, 0, 18, 33, P.steel); v.box(-2, 18, 9, 0, 20, 33, P.dslate);   // pórtico de salida
    s.add(v.build({ jit: .05 }));
    const KN = ['kart', 'kart_b', 'kart_v', 'kart_a', 'kart_m', 'kart_n'], ks = KN.map(n => { const m = actor(n, 1); s.add(m); return m; });
    const Lz = new Bloques(12, true), B = new Bloques(200); s.add(Lz.im, B.im);
    const luzS = (n, verde) => { Lz.ini(); for (let i = 0; i < 3; i++) Lz.pon(-.5, 16, 15 + i * 6, 1.4, 2.6, 2.6, verde ? P.lime : (i < n ? P.red : 0x3a1a1a)); Lz.fin(); };
    const polvo = (m, t) => { for (let k = 0; k < 4; k++) { const u = (t * 2 + k / 4) % 1, a = m.rotation.y; B.pon(m.position.x - Math.cos(a) * (6 + u * 8), .6 + u * 2, m.position.z + Math.sin(a) * (6 + u * 8) + Math.sin(k * 3) * 2, 1 + u * 1.4, 1 + u * 1.4, 1 + u * 1.4, 0xf0dcb0); } };
    const parrilla = () => ks.forEach((m, i) => { m.position.set(-8 - Math.floor(i / 2) * 11, 0, OV.R + (i % 2 ? 2.6 : -2.6)); m.rotation.set(0, 0, 0); });
    const c = cam(46);
    return { s, c, upd(t) { parrilla(); luzS(0, false); B.ini(); B.fin();
        mira(c, [Math.sin(t * .1) * 6 - 30, 38, 102], [-18, 3, 20], .06); },
      acc: {
        // semáforo rojo, rojo, rojo… ¡verde!: los seis karts salen derrapando hacia la cámara
        salida(lt, dur, t) { const go = 1.25, n = Math.min(3, Math.floor(lt / .4) + 1); luzS(n, lt > go); B.ini();
          ks.forEach((m, i) => { const st = -8 - Math.floor(i / 2) * 11, e = Math.max(0, lt - go - i * .06), d = 14 * e * e + 4 * e; m.position.set(st + d, 0, OV.R + (i % 2 ? 2.6 : -2.6)); m.rotation.set(0, Math.sin(e * 9 + i) * .04, 0); if (e > 0) polvo(m, t + i); });
          B.fin(); const cx = Math.min(ks[2].position.x, 60); mira(c, [cx - 12, 38, 100], [cx, 3, 20], .07); },
        // vuelta al óvalo: los karts toman la curva en fila, adelantándose; la cámara los sigue
        carrera(lt, dur, t) { luzS(0, true); B.ini(); const u0 = 30 + lt * 34;
          ks.forEach((m, i) => { const u = u0 - i * 9 + Math.sin(lt * 1.3 + i) * 3; enOval(m, u); const [x, z] = oval(u), lat = Math.sin(lt * 1.7 + i * 2) * 2.5; const a = m.rotation.y; m.position.x += Math.sin(a) * lat; m.position.z += Math.cos(a) * lat; polvo(m, t + i); });
          B.fin(); const [cx, cz] = oval(u0 - 20); mira(c, [cx * .5, 60, cz * .5 + 90], [cx, 2, cz], .08); },
      } };
  },
  // —— Mario Kart 2: la remezcla en la playa: un circuito de piezas sueltas que se levantan y se recolocan con curvas y un salto nuevos ——
  remezcla: () => {
    const s = new THREE.Scene(); s.background = cielo([0x0099db, 0x8fdcff, 0xe8fbff]); s.fog = new THREE.Fog(0xe8fbff, 170, 360);
    luces(s, { cielo: 0xf0fbff, suelo: 0xc8a870, amb: 1.5, sol: 0xfff1d6, int: 2.2, dir: [-40, 90, 50], sombra: 120 });
    const v = new Vox(); for (let x = -110; x < 110; x++) for (let z = -200; z < 90; z++) { const mar = x > 34 + Math.sin(z * .05) * 4; v.set(x, mar ? -2 : -1, z, mar ? (hsh(x >> 1, 1, z >> 1) > .85 ? P.cyan : (x > 50 ? P.blue : 0x0abde0)) : (hsh(x >> 2, 2, z >> 2) > .5 ? P.sand : 0xf2e0b8)); }
    for (let i = 0; i < 9; i++) { const px = -40 - (i % 2) * 12, pz = 40 - i * 26;   // palmeras de playa hechas aquí mismo
      for (let y = 0; y < 16; y++) v.box(px + Math.round(y * y / 60), y, pz, px + Math.round(y * y / 60) + 2, y + 1, pz + 2, y % 3 ? P.brown : P.dbrown);
      const tx = px + 4, ty = 16; for (let a = 0; a < 6; a++) { const an = a / 6 * 6.283; for (let r = 1; r < 9; r++) v.set(tx + Math.cos(an) * r, ty + 1 - Math.round(r * r / 16), pz + 1 + Math.sin(an) * r, r % 2 ? P.green : P.lime); } v.box(tx - 1, ty, pz, tx + 2, ty + 2, pz + 2, P.dgreen); }
    s.add(v.build({ jit: .04 }));
    const kr = actor('kart', 1), kg = actor('kart_b', 1), dr = actor('dron', 1.1); s.add(kr, kg, dr);
    const N = 46, B = new Bloques(N * 4 + 200), G = new Bloques(120, true); s.add(B.im, G.im);
    const rec = pantalla(8, 3, 64, 24); s.add(rec.m); rotular(rec, ['● REC'], '#e43b44', '#181425', 16);
    // trazado viejo (recto con una curva suave) y trazado nuevo (eses y un salto); f = 0 viejo, 1 nuevo, por pieza
    const via = (sN, f) => { const z = 40 - sN * 220, xa = Math.sin(sN * 3.1) * 6, xb = Math.sin(sN * 9.4) * 15, yb = Math.max(0, Math.sin((sN - .55) / .12 * Math.PI)) * (sN > .55 && sN < .67 ? 7 : 0);
      return [lerp(xa, xb, f), lerp(0, yb, f), z]; };
    const fPieza = (i, k) => ss(clamp(k * 1.8 - i / N * .8, 0, 1));
    const pista = (k, t) => { for (let i = 0; i < N; i++) { const sN = i / N, f = fPieza(i, k), [x, y, z] = via(sN, f), [x2, , z2] = via(sN + 1 / N, f), a = Math.atan2(x2 - x, z2 - z), sube = Math.sin(f * Math.PI) * 14;
        B.pon(x, y + sube, z, 12, 1, 5.2, i % 2 ? P.dslate : 0x4a5370, a); B.pon(x + Math.cos(a) * 6.6, y + sube + .2, z - Math.sin(a) * 6.6, 1.2, 1.2, 5.2, i % 2 ? P.red : P.white, a); B.pon(x - Math.cos(a) * 6.6, y + sube + .2, z + Math.sin(a) * 6.6, 1.2, 1.2, 5.2, i % 2 ? P.white : P.red, a); } };
    const enVia = (m, sN, f) => { const [x, y, z] = via(sN, f), [x2, y2, z2] = via(sN + .01, f); m.position.set(x, y + .8, z); m.rotation.set(0, Math.atan2(-(x2 - x), -(z2 - z)) * 0 + Math.atan2(-(z2 - z), x2 - x), 0); };
    const fantasma = () => { G.ini(); for (let i = 0; i < 60; i++) { const [x, , z] = via(i / 60, 0); G.pon(x, .6, z, 1, .4, 1, P.cyan); } G.fin(); };
    const c = cam(46);
    return { s, c, upd(t) { B.ini(); pista(0, t); B.fin(); G.ini(); G.fin(); kg.visible = false; dr.visible = false; rec.m.visible = false; enVia(kr, .1, 0);
        mira(c, [Math.sin(t * .1) * 6, 52, 96], [0, 0, -40], .02); },
      acc: {
        // el kart recorre de memoria el trazado de siempre, marcado con puntos azules
        pregunta(lt, dur, t) { B.ini(); pista(0, t); B.fin(); fantasma(); kg.visible = false; dr.visible = false; rec.m.visible = false; const sN = clamp(lt / dur, 0, 1) * .6 + .05; enVia(kr, sN, 0);
          const [x, , z] = via(sN, 0); mira(c, [x - 10, 40, z + 70], [x, 2, z - 20], .04); },
        // las piezas saltan una a una y caen formando eses y un salto; el kart estrena las curvas nuevas
        remezcla(lt, dur, t) { const k = clamp(lt / (dur * .7), 0, 1); B.ini(); pista(k, t); B.fin(); G.ini(); G.fin(); kg.visible = false; dr.visible = false; rec.m.visible = false;
          const sN = clamp((lt - dur * .55) / (dur * .45), 0, 1) * .8 + .02; enVia(kr, sN, 1); if (k < 1) kr.position.y += 0; const q = ss(clamp(lt / dur, 0, 1));
          mira(c, [lerp(-30, 10, q), lerp(70, 60, q), lerp(90, 80, q)], [0, 0, lerp(-50, -70, q)], .02); },
        // dos karts por las eses nuevas; un dron con cámara los sigue y graba: ● REC
        grabar(lt, dur, t) { B.ini(); pista(1, t); B.fin(); G.ini(); G.fin(); kg.visible = dr.visible = rec.m.visible = true; const sN = .15 + clamp(lt / dur, 0, 1) * .45;
          enVia(kr, sN, 1); enVia(kg, sN - .035, 1); const [x, y, z] = via(sN - .01, 1); dr.position.set(x + 6, y + 12 + Math.sin(t * 3) * .6, z + 10); dr.rotation.y = Math.PI * .8;
          dr.children.forEach(ch => { if (ch.name === 'rotor') ch.rotation.y = t * 30; }); rec.m.position.set(x + 6, y + 19, z + 10); rec.m.lookAt(c.position); rec.m.visible = Math.floor(t * 2) % 2 === 0;
          mira(c, [x - 26, y + 42, z + 90], [x + 2, y + 6, z - 8], .04); },
      } };
  },
  // —— Mario Kart 3: el salón de las repeticiones: sofá, alfombra, la tele con el menú y la estantería de carretes ——
  sala_replay: () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(0x262b44); s.fog = new THREE.Fog(0x262b44, 140, 260);
    luces(s, { cielo: 0xfff0e0, suelo: 0x5a4a5a, amb: 1.5, sol: 0xfff1d6, int: 1.5, dir: [30, 80, 60], sombra: 90 });
    const v = new Vox(); v.box(-60, -1, -50, 60, 0, 60, (x, y, z) => (z % 4 === 0) ? P.dbrown : P.brown);
    v.box(-60, 0, -52, 60, 44, -50, (x, y) => (y < 3 ? P.white : ((x >> 3) & 1 ? 0x5a6988 : 0x506080))); for (const sx of [-62, 60]) v.box(sx, 0, -50, sx + 2, 44, 60, 0x506080);
    v.box(-24, 0, -48, 24, 6, -38, P.dbrown); v.box(-24, 6, -48, 24, 7, -37, P.tan);   // mueble de la tele
    v.box(-30, 0, -16, 30, 1, 40, (x, y, z) => ((x >> 2) + (z >> 2)) & 1 ? P.plum : P.rose);   // alfombra
    v.box(-26, 0, 34, 26, 6, 44, P.navy); v.box(-26, 6, 40, 26, 16, 44, P.navy); v.box(-28, 0, 34, -24, 11, 44, P.blue); v.box(24, 0, 34, 28, 11, 44, P.blue);   // sofá
    v.box(36, 0, -46, 58, 2, -10, P.dbrown); v.box(36, 14, -46, 58, 15, -10, P.dbrown); v.box(36, 28, -46, 58, 29, -10, P.dbrown); v.box(56, 0, -46, 58, 30, -10, P.dbrown);   // estantería
    v.box(28, 0, -46, 36, 8, -38, P.slate); v.box(29, 8, -45, 35, 9, -39, P.ink);   // papelera
    s.add(v.build({ jit: .04 }));
    const tv = pantalla(40, 22.5, 192, 108); tv.m.position.set(0, 21, -47); s.add(tv.m);
    const rl = Array.from({ length: 6 }, () => { const m = actor('carrete', .48); s.add(m); return m; });
    const mini = Array.from({ length: 24 }, (_, i) => { const m = actor(['kart', 'kart_b', 'kart_v', 'kart_a', 'kart_m', 'kart_n'][i % 6], .55); s.add(m); return m; });
    const B = new Bloques(80); s.add(B.im);
    const KC = ['#e43b44', '#0099db', '#63c74d', '#fee761', '#68386c', '#f77622'];
    const dibTV = (modo, k, t) => { const { g, cv, tex } = tv, W2 = cv.width, H2 = cv.height; g.fillStyle = '#181425'; g.fillRect(0, 0, W2, H2);
      if (modo === 'menu') { g.fillStyle = '#feae34'; g.font = 'bold 14px monospace'; g.textAlign = 'center'; g.fillText('MENÚ PRINCIPAL', W2 / 2, 18);
        ['CARRERA', 'KO TOUR', 'REPETICIÓN', 'OPCIONES'].forEach((o, i) => { const sel = i === 2; g.fillStyle = sel ? '#124e89' : '#262b44'; g.fillRect(40, 28 + i * 19, W2 - 80, 16); g.fillStyle = sel ? '#ffffff' : '#8b9bb4'; g.fillText((sel ? '> ' : '') + o, W2 / 2, 40 + i * 19); }); }
      else { const cx = W2 / 2, cy = H2 / 2 + 8, sx = 1.25, sz = 1.05; g.strokeStyle = '#5a6988'; g.lineWidth = 10; g.beginPath(); for (let u = 0; u <= OV.P; u += 4) { const [x, z] = oval(u); u ? g.lineTo(cx + x * sx, cy + z * sz) : g.moveTo(cx + x * sx, cy + z * sz); } g.stroke();
        for (let i = 0; i < 6; i++) { const [x, z] = oval(k * 500 - i * 12); g.fillStyle = KC[i]; g.fillRect(cx + x * sx - 3, cy + z * sz - 3, 6, 6); }
        g.fillStyle = Math.floor(t * 2) % 2 ? '#e43b44' : '#ffffff'; g.font = 'bold 13px monospace'; g.textAlign = 'left'; g.fillText(modo === 'lleno' ? 'MEMORIA LLENA' : '▶ REPETICIÓN', 8, 15); }
      tex.needsUpdate = true; };
    const estante = (k) => { rl.forEach((m, i) => { const slot = i - k; m.visible = slot > -1.2 && slot < 5.5; const z = -42 + slot * 7;
        if (slot < 0) { const f = clamp(-slot / 1.2, 0, 1); m.position.set(lerp(46, 32, f), lerp(18.4, 6, f * f), -42); m.rotation.set(f * 3, Math.PI / 2, 0); }
        else { m.position.set(46, 18.4, z); m.rotation.set(0, Math.PI / 2, 0); } }); };
    const c = cam(46);
    const nada = () => { mini.forEach(m => m.visible = false); };
    return { s, c, upd(t) { nada(); estante(0); dibTV('menu', 0, t); B.ini(); B.fin();
        mira(c, [Math.sin(t * .1) * 6, 34, 86], [4, 18, -30], .02); },
      acc: {
        // el cursor baja hasta REPETICIÓN y la tele reproduce la carrera vista desde arriba
        repeticion(lt, dur, t) { nada(); estante(0); dibTV(lt < dur * .35 ? 'menu' : 'rep', (lt - dur * .35) / 6, t); const q = ss(clamp(lt / dur, 0, 1));
          mira(c, [lerp(-6, 0, q), lerp(30, 24, q), lerp(80, 50, q)], [0, 21, -46], -.02); },
        // la estantería está llena de carretes: entra uno nuevo por la derecha y el más antiguo cae a la papelera
        memoria(lt, dur, t) { nada(); const k = ss(clamp((lt - .4) / (dur * .6), 0, 1)); estante(k); dibTV('lleno', lt / 6, t); const q = ss(clamp(lt / dur, 0, 1));
          mira(c, [lerp(-50, -42, q), 30, lerp(-20, -24, q)], [42, 14, -24], .02); },
        // veinticuatro karts en miniatura forman la parrilla sobre la alfombra, de dos en dos
        parrilla(lt, dur, t) { estante(1); dibTV('rep', lt / 6, t); mini.forEach((m, i) => { const f = ss(clamp(lt * 3 - i * .1, 0, 1)); m.visible = f > 0; m.position.set(-16.5 + (i % 4) * 11, lerp(14, 2, f), -10 + Math.floor(i / 4) * 8.5); m.rotation.set(0, -Math.PI / 2, 0); });
          const q = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-24, -6, q), 62, 96], [0, 2, 12], .03); },
      } };
  },
});

// ———————————— 26/11/2026: el cráter de Dimorphos (Hera), la jornada de reflexión del 29-N y el gol 987 de Cristiano ————————————
// roca de asteroide: tonos de gris y pardo por ruido (para Vox.ball / funciones de color)
const roca = (x, y, z, s = 0) => { const h = hsh(x >> 1, y >> 1, (z >> 1) + s), k = hsh(x, y, z + s); return k > .93 ? P.silver : h > .66 ? P.steel : h > .33 ? P.slate : (k > .5 ? 0x6b5e58 : P.dslate); };
// Dimorphos: roca alargada (13 × 9 × 9); con cráter = una cara entera hundida en cuenco (en +x), con fondo de roca fresca más clara
function dimV(crater) { const v = new Vox();
  for (let x = -7; x <= 7; x++) for (let y = -5; y <= 5; y++) for (let z = -5; z <= 5; z++) { const n = hsh(x >> 1, y >> 1, z >> 1) * .22; if ((x / 7) ** 2 + (y / 4.8) ** 2 + (z / 4.8) ** 2 <= 1 + n - .1) v.set(x, y, z, roca(x, y, z, 7)); }
  if (crater) { for (let x = -1; x <= 8; x++) for (let y = -6; y <= 6; y++) for (let z = -6; z <= 6; z++) if ((x - 11) ** 2 + y * y + z * z < 62) v.del(x, y, z);
    for (const [k, c] of [...v.m]) { const [x, y, z] = k.split(',').map(Number); const d = (x - 11) ** 2 + y * y + z * z; if (d < 78 && x > 1) v.m.set(k, d < 70 ? (hsh(x, y, z) > .5 ? P.silver : 0xa8a8b8) : P.sand); } }
  const w = new THREE.Group(); w.add(v.build({ jit: .06, centrar: true })); return w; }
Object.assign(FAB, {
  asteroide: () => {   // Didymos: peonza de roca de ~30 cubos con una cresta en el ecuador
    const v = new Vox(); v.ball(0, 0, 0, 14, (x, y, z) => roca(x, y, z), .82); for (let a = 0; a < 6.283; a += .05) { const r = 14.4; v.set(Math.cos(a) * r, 0, Math.sin(a) * r, P.steel); v.set(Math.cos(a) * r, 1, Math.sin(a) * r, P.slate); }
    for (let i = 0; i < 9; i++) { const a = hsh(i, 1, 4) * 6.283, b = (hsh(i, 2, 4) - .5) * 2, cx = Math.cos(a) * Math.cos(b) * 13, cy = Math.sin(b) * 11, cz = Math.sin(a) * Math.cos(b) * 13; v.ball(cx, cy, cz, 2.2 + hsh(i, 3, 4) * 1.5, P.dslate); }
    const w = new THREE.Group(); w.add(v.build({ jit: .05, centrar: true })); return w; },
  dimorphos: () => dimV(true), dimorphos0: () => dimV(false),
  dart: () => {   // nave DART: caja dorada con antena y dos paneles solares enrollables largos; morro (cámara) hacia +x
    const v = new Vox(); v.box(-2, -2, -2, 3, 3, 3, (x, y, z) => (x + y + z) & 1 ? P.amber : P.yellow); v.box(3, -1, -1, 4, 2, 2, P.ink); v.set(4, 0, 0, P.cyan); v.luz(P.cyan);
    for (const s of [-1, 1]) { v.box(0, 0, s > 0 ? 3 : -4, 1, 1, s > 0 ? 6 : -3, P.silver); v.cyl(.5, s * 10, 0, 1, 4.6, (x, y, z) => (Math.abs(x) + Math.abs(z)) % 3 === 0 ? P.silver : P.navy); }
    v.box(-4, -1, -1, -2, 2, 2, P.silver); v.cyl(-4.5, 0, -1, 0, 2, P.white);
    const w = new THREE.Group(); const g = v.build({ jit: .04, centrar: true }); w.add(g); return w; },
  hera: () => {   // sonda europea Hera: cuerpo dorado, dos alas de paneles en cruz, antena plato y cámara (hacia +x)
    const v = new Vox(); v.box(-3, -3, -3, 4, 4, 4, (x, y, z) => (y % 2 ? P.amber : P.orange)); v.box(4, -1, -1, 6, 2, 2, P.ink); v.set(6, 0, 0, P.cyan); v.luz(P.cyan);
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) v.box(-2, 0, s > 0 ? 4 + k * 5 : -8 - k * 5, 3, 1, s > 0 ? 8 + k * 5 : -4 - k * 5, (x, y, z) => (x + z) % 2 ? P.navy : P.blue);
    v.box(0, 0, 4, 1, 1, 19, P.silver); v.box(0, 0, -19, 1, 1, -4, P.silver);
    for (let x = -4; x <= 4; x++) for (let z = -4; z <= 4; z++) if (x * x + z * z <= 18) v.set(x, 5 + Math.round((x * x + z * z) / 9), z, P.white);
    const w = new THREE.Group(); w.add(v.build({ jit: .04, centrar: true })); return w; },
});
// fondo espacial común: estrellas y un Sol lejano
function espacio(s) { s.background = new THREE.Color(0x07060e); estrellas(s, 420, 320, -200); const sol = bola(0xfff1c0, 6); sol.position.set(-220, 90, -260); s.add(sol);
  s.add(new THREE.HemisphereLight(0x9aa8c8, 0x1a1a2a, .55)); const d = new THREE.DirectionalLight(0xfff1d6, 2.8); d.position.set(-60, 40, 30); s.add(d); return d; }
Object.assign(FABE, {
  // —— Dimorphos 1: el sistema doble en el espacio: Didymos grande, Dimorphos pequeño; DART se estrella y salta el polvo ——
  didymos: () => {
    const s = new THREE.Scene(); espacio(s);
    const dy = actor('asteroide', 1), dm = actor('dimorphos', 1), d0 = actor('dimorphos0', 1), dt = actor('dart', .9); s.add(dy, dm, d0, dt);
    const fl = bola(0xffffff, 1); fl.material.transparent = true; s.add(fl); const B = new Bloques(260, true); s.add(B.im);
    const P0 = new THREE.Vector3(40, 0, 0);
    const base = (t, crater) => { dy.rotation.y = t * .25; dm.position.copy(P0); d0.position.copy(P0); dm.visible = crater; d0.visible = !crater; dm.rotation.set(0, 0, 0); d0.rotation.set(0, 0, 0); dt.visible = false; fl.visible = false; B.ini(); B.fin(); };
    const c = cam(46);
    return { s, c, upd(t) { base(t, true); mira(c, [P0.x + 34, 10, 30], [P0.x - 6, 0, 0], .0); },
      acc: {
        // la cámara llega desde lejos hasta la cara hundida de Dimorphos, con Didymos detrás
        llegada(lt, dur, t) { base(t, true); const q = ss(clamp(lt / dur, 0, 1)), d = lerp(90, 34, q), a = lerp(.9, .55, q);
          mira(c, [P0.x + Math.cos(a) * d, lerp(22, 6, q), Math.sin(a) * d], [P0.x - 4, -2, 0], -.02); },
        // DART cruza el cuadro y se estrella contra la cara de Dimorphos: destello, chorro de polvo y cráter
        choque(lt, dur, t) { const ti = dur * .5, hit = lt > ti; base(t, hit); const k = clamp(lt / ti, 0, 1);
          if (!hit) { dt.visible = true; dt.position.set(P0.x + lerp(44, 7, k), lerp(4, 0, k), lerp(14, 0, k)); dt.lookAt(P0); dt.rotateY(-Math.PI / 2); }
          else { const e = lt - ti; fl.visible = e < .9; fl.scale.setScalar(2 + e * 22); fl.material.opacity = clamp(1 - e / .9, 0, 1);
            B.ini(); for (let i = 0; i < 240; i++) { const a = (hsh(i, 1, 1) - .5) * 1.9, b = (hsh(i, 2, 1) - .5) * 1.9, v = 8 + hsh(i, 3, 1) * 22, r = e * v, sz = Math.max(.2, 1.2 - e * .25);
              B.pon(P0.x + 6 + Math.cos(a) * Math.cos(b) * r, Math.sin(b) * r, Math.sin(a) * Math.cos(b) * r, sz, sz, sz, i % 3 ? 0xd8c8b0 : P.white); } B.fin(); }
          mira(c, [P0.x + 34, 12, 62], [P0.x + 16, 0, 6], .02); },
      } };
  },
  // —— Dimorphos 2: la defensa planetaria: la Tierra, una roca que se acerca y la nave que la empuja ——
  defensa: () => {
    const s = new THREE.Scene(); espacio(s);
    const v = new Vox(); v.ball(0, 0, 0, 20, (x, y, z) => { const n = hsh(x >> 2, y >> 2, z >> 2) + hsh(x >> 1, y >> 1, z >> 1) * .3; if (Math.abs(y) > 17) return P.white; return n > .95 ? P.white : n > .78 ? (Math.abs(y) < 7 ? P.sand : P.green) : n > .72 ? P.lime : (n < .2 ? P.navy : P.blue); });
    const tierra = v.build({ jit: .04, centrar: true }); s.add(tierra); const at = bola(0x7fd0ff, 21.5); at.material.transparent = true; at.material.opacity = .14; s.add(at);
    const rk = actor('asteroide', .45), dt = actor('dart', .9); s.add(rk, dt);
    const B = new Bloques(420, true); s.add(B.im); const fl = bola(0xffffff, 1); fl.material.transparent = true; s.add(fl);
    const c = cam(46);
    const nada = (t) => { tierra.rotation.y = t * .15; rk.visible = dt.visible = fl.visible = false; B.ini(); B.fin(); };
    // ruta de la roca: hacia la Tierra (vieja) o desviada (nueva) a partir de u = .5
    const ruta = (u, desv) => { const x = lerp(-150, 10, u), z = lerp(-70, 5, u), y = lerp(30, 0, u) + (desv ? Math.max(0, u - .5) ** 1.6 * 110 : 0); return [x, y, z]; };
    return { s, c, upd(t) { nada(t); mira(c, [30, 20, 90], [0, 0, 0], .02); },
      acc: {
        // en el espacio, la nave avanza despacio hacia una roca; la cámara las rodea (¿por qué?)
        pregunta(lt, dur, t) { nada(t); rk.visible = dt.visible = true; const o = new THREE.Vector3(-120, 20, -40); rk.position.copy(o); rk.rotation.set(t * .3, t * .2, 0);
          const k = clamp(lt / dur, 0, 1); dt.position.set(o.x + lerp(40, 22, k), o.y + 2, o.z + lerp(14, 6, k)); dt.lookAt(o); dt.rotateY(-Math.PI / 2);
          const a = .6 + lt * .12; mira(c, [o.x + 12 + Math.cos(a) * 84, o.y + 18, o.z + Math.sin(a) * 84], [o.x + 12, o.y, o.z + 4], .04); },
        // un escudo de satélites (cubos azules) se monta alrededor de la Tierra
        escudo(lt, dur, t) { nada(t); B.ini(); const N = 140, k = clamp(lt / (dur * .8), 0, 1);
          for (let i = 0; i < N; i++) { const f = ss(clamp(k * 1.6 - i / N * .6, 0, 1)); if (f <= 0) continue; const a = i * 2.399 + t * .2, y = 1 - 2 * (i + .5) / N, rr = Math.sqrt(1 - y * y), R2 = lerp(90, 30, f);
            B.pon(Math.cos(a) * rr * R2, y * R2, Math.sin(a) * rr * R2, 1.4, 1.4, 1.4, i % 7 ? P.cyan : P.white); } B.fin();
          const a = lt * .1; mira(c, [Math.sin(a) * 30 + 10, 26, 110], [0, 6, 0], -.02); },
        // la roca viene hacia la Tierra (rastro rojo); la nave la golpea y su rastro se curva (verde) y pasa de largo
        empujar(lt, dur, t) { nada(t); rk.visible = true; const u = clamp(lt / dur, 0, 1) * .95, hit = u > .5; const [x, y, z] = ruta(u, hit); rk.position.set(x, y, z); rk.rotation.set(t * .5, t * .3, 0);
          B.ini(); for (let i = 0; i < 60; i++) { const w = i / 60; if (w > .5 && hit) break; const [a, b, cc] = ruta(w, false); B.pon(a, b, cc, .9, .9, .9, w < u ? 0x7a2030 : P.red); }
          if (hit) for (let i = 30; i < 60; i++) { const w = i / 60, [a, b, cc] = ruta(w, true); B.pon(a, b, cc, 1, 1, 1, w < u ? P.dgreen : P.lime); }
          B.fin(); if (!hit) { dt.visible = true; const k = clamp(u / .5, 0, 1), [hx2, hy, hz] = ruta(.5, false); dt.position.set(hx2 + lerp(70, 0, k), hy + lerp(-30, 0, k), hz + lerp(50, 0, k)); dt.lookAt(rk.position); dt.rotateY(-Math.PI / 2); }
          else { const e = (u - .5) * dur; fl.visible = e < .6; const [hx2, hy, hz] = ruta(.5, false); fl.position.set(hx2, hy, hz); fl.scale.setScalar(2 + e * 18); fl.material.opacity = clamp(1 - e / .6, 0, 1); }
          mira(c, [-24, 70, 215], [-40, 8, -20], .02); },
      } };
  },
  // —— Dimorphos 3: la visita de Hera: órbitas, fotos de la cara hundida, tumbos con rocas y la comparación con un campo ——
  hera_sonda: () => {
    const s = new THREE.Scene(); espacio(s);
    const dy = actor('asteroide', 1), dm = actor('dimorphos', 1), he = actor('hera', .8), big = actor('dimorphos', 5.6); s.add(dy, dm, he, big);
    const B = new Bloques(520, true); s.add(B.im); const fl = bola(0xffffff, 1.4); fl.material.transparent = true; s.add(fl);
    const v = new Vox(); const FX = 300; cesped(v, FX - 26, FX + 26, -34, 34, -34, { lineas: false });
    v.box(FX - 26, 0, -34, FX + 26, 1, -33, P.white); v.box(FX - 26, 0, 33, FX + 26, 1, 34, P.white); v.box(FX - 26, 0, -34, FX - 25, 1, 34, P.white); v.box(FX + 25, 0, -34, FX + 26, 1, 34, P.white); v.box(FX - 26, 0, 0, FX + 26, 1, 1, P.white);
    for (const z of [-34, 33]) { v.box(FX - 4, 0, z, FX - 3, 5, z + 1, P.white); v.box(FX + 3, 0, z, FX + 4, 5, z + 1, P.white); v.box(FX - 4, 5, z, FX + 4, 6, z + 1, P.white); }
    const campo = v.build({ jit: .05 }); s.add(campo);
    const P0 = new THREE.Vector3(40, 0, 0), c = cam(46);
    const base = (t) => { dy.rotation.y = t * .25; dm.position.copy(P0); dm.rotation.set(0, 0, 0); he.visible = false; big.visible = false; fl.visible = false; B.ini(); B.fin(); };
    return { s, c, upd(t) { base(t); mira(c, [P0.x + 30, 8, 26], [P0.x, 0, 0], .0); },
      acc: {
        // vista desde arriba: la órbita vieja (roja, más grande) y la nueva (verde, más pequeña); Dimorphos pasa de una a otra
        orbita(lt, dur, t) { base(t); const k = clamp(lt / dur, 0, 1), sw = ss(clamp((k - .35) / .25, 0, 1)), R2 = lerp(46, 38, sw), a = lt * .9;
          dm.position.set(Math.cos(a) * R2, 0, Math.sin(a) * R2); dm.rotation.y = -a;
          B.ini(); for (let i = 0; i < 90; i++) { const b = i / 90 * 6.283; B.pon(Math.cos(b) * 46, 0, Math.sin(b) * 46, .9, .9, .9, P.red); if (sw > 0 && i / 90 < sw) B.pon(Math.cos(b) * 38, 0, Math.sin(b) * 38, 1.1, 1.1, 1.1, P.lime); } B.fin();
          mira(c, [0, 150, 70], [0, 0, 0], -.05); },
        // Hera llega junto a la cara hundida y hace fotos (destellos)
        foto(lt, dur, t) { base(t); he.visible = true; const k = ss(clamp(lt / (dur * .5), 0, 1)); he.position.set(P0.x + lerp(40, 16, k), lerp(10, 3, k), lerp(16, 5, k)); he.lookAt(P0); he.rotateY(-Math.PI / 2);
          const ph = (lt - dur * .45) % 1.1; if (lt > dur * .45 && ph < .25) { fl.visible = true; fl.position.copy(he.position).lerp(P0, .25); fl.scale.setScalar(1 + ph * 4); fl.material.opacity = 1 - ph / .25; }
          mira(c, [P0.x + 54, 18, 46], [P0.x + 8, 0, 2], .02); },
        // Dimorphos gira descontrolado, en tres ejes, rodeado de cientos de rocas pequeñas
        tumbos(lt, dur, t) { base(t); dm.rotation.set(lt * .9, lt * .55, Math.sin(lt * .7) * 1.2); B.ini();
          for (let i = 0; i < 380; i++) { const r = 10 + hsh(i, 1, 2) * 16, a = hsh(i, 2, 2) * 6.283 + lt * (.15 + hsh(i, 4, 2) * .2), inc = (hsh(i, 3, 2) - .5) * 1.6, sz = .3 + hsh(i, 5, 2) * .6;
            B.pon(P0.x + Math.cos(a) * r, Math.sin(a) * r * Math.sin(inc), Math.sin(a) * r * Math.cos(inc), sz, sz, sz, hsh(i, 6, 2) > .5 ? P.steel : P.slate); } B.fin();
          const a = .4 + lt * .1; mira(c, [P0.x + Math.cos(a) * 52, 12, Math.sin(a) * 52], [P0.x, 0, 0], .02); },
        // tamaño: Dimorphos a escala junto a un campo de fútbol (1 m = 2 cubos: el campo mide 105 m y la roca unos 151)
        medida(lt, dur, t) { base(t); big.visible = true; big.position.set(FX, 20, -76); big.rotation.set(0, Math.PI / 2 + Math.sin(t * .2) * .1, 0);
          const q = ss(clamp(lt / dur, 0, 1)); mira(c, [FX + lerp(30, 10, q), lerp(175, 160, q), lerp(135, 120, q)], [FX, 0, -34], .03); },
      } };
  },
});

// —— jornada de reflexión ——
Object.assign(FAB, {
  megafono: () => {   // megáfono rojo y blanco: boca hacia +x
    const v = new Vox(); for (let x = 0; x <= 10; x++) { const r = 1.4 + x * .42; for (let y = -6; y <= 6; y++) for (let z = -6; z <= 6; z++) { const d = Math.hypot(y, z); if (d <= r && d > r - 1.2) v.set(x, y, z, x > 8 ? P.white : P.red); } }
    v.box(-4, -1, -1, 1, 2, 2, P.ink); v.box(-2, -6, -1, 0, -1, 1, P.dslate); v.cyl(-4, 0, -1, 2, 1.5, P.silver);
    const w = new THREE.Group(); w.add(v.build({ jit: .04, centrar: true })); return w; },
  valla: () => {   // valla publicitaria: dos patas y un marco de 24 × 14 (el cartel es una pantalla aparte en z = +1.2)
    const v = new Vox(); v.box(-9, 0, 0, -7, 12, 1, P.steel); v.box(7, 0, 0, 9, 12, 1, P.steel); v.box(-13, 12, 0, 13, 28, 1, P.dslate); v.box(-13, 11, 0, 13, 12, 2, P.slate); v.box(-12, 28, 1, -11, 30, 2, P.amber); v.box(11, 28, 1, 12, 30, 2, P.amber); v.luz(P.amber);
    const w = new THREE.Group(); w.add(v.build({ jit: .04 })); return w; },
  sobre_voto: () => {   // sobre de votación con la papeleta asomando
    const v = new Vox(); v.box(-6, 0, -4, 6, 1, 4, P.sand); for (let x = -6; x < 6; x++) { const h = 4 - Math.abs(x + .5) * .66; v.box(x, 1, 4 - Math.max(1, Math.round(h)), x + 1, 2, 4, 0xd8c098); }
    v.box(-4, 1, -3, 4, 2, 0, P.white); v.box(-3, 2, -3, 3, 2.5, -2, P.dslate);
    const w = new THREE.Group(); w.add(v.build({ jit: .03, centrar: true })); return w; },
});
Object.assign(FABE, {
  // —— 29-N 1: la plaza del último mitin, de noche: escenario con focos, altavoces, pantalla y público con banderitas ——
  plaza_mitin: () => {
    const s = new THREE.Scene(); s.background = cielo([0x0b0b22, 0x262b44, 0x3a4466]); s.fog = new THREE.Fog(0x262b44, 150, 300);
    s.add(new THREE.HemisphereLight(0x8090c0, 0x302838, .9)); const sp = new THREE.PointLight(0xffe6b0, 900, 160, 1.6); sp.position.set(0, 40, 10); s.add(sp);
    const v = new Vox(); v.box(-90, -1, -60, 90, 0, 90, (x, y, z) => ((x >> 3) + (z >> 3)) & 1 ? P.slate : P.steel);
    v.box(-34, 0, -30, 34, 6, -8, P.dslate); v.box(-34, 6, -30, 34, 7, -8, P.dbrown);   // escenario
    for (const sx of [-34, 32]) { v.box(sx, 7, -30, sx + 2, 44, -28, P.ink); } v.box(-34, 42, -30, 34, 44, -28, P.ink);   // pórtico
    for (const sx of [-30, 24]) v.box(sx, 7, -26, sx + 6, 24, -20, (x, y) => y % 3 ? P.ink : P.dslate);   // altavoces
    for (let i = 0; i < 6; i++) { const z = -70 - (i % 3) * 14, x = -80 + i * 32; pisos(v, x, z, 26, 40 + (i % 3) * 8, [P.brown, P.tan, P.rose][i % 3]); }
    s.add(v.build({ jit: .05 }));
    const L = new Bloques(40, true), B = new Bloques(900); s.add(L.im, B.im);
    const scr = pantalla(36, 18, 144, 72); scr.m.position.set(0, 27, -28.5); s.add(scr.m);
    const atrilM = actor('megafono', .9); s.add(atrilM);
    const gente = Array.from({ length: 110 }, (_, i) => [-40 + (i % 14) * 6 + hsh(i, 1, 5) * 3, 6 + Math.floor(i / 14) * 6 + hsh(i, 2, 5) * 2, [P.navy, P.crimson, P.dgreen, P.plum, P.umber, P.blue][i % 6]]);
    const dib = (k, t) => { L.ini(); for (let i = 0; i < 8; i++) { const on = k < 1 - i / 8; L.pon(-28 + i * 8, 43, -27, 3, 2, 2, on ? P.yellow : 0x2a2a36); } L.fin(); sp.intensity = 900 * (1 - k) + 30; };
    const publico = (t, k, ban) => { B.ini(); gente.forEach(([x, z, col], i) => { const sal = clamp(k * 1.5 - hsh(i, 3, 5) * .5, 0, 1); if (sal >= 1) return; const zz = z + sal * 70, xx = x + (x > 0 ? 1 : -1) * sal * 20;
      const salto = k === 0 ? Math.max(0, Math.sin(t * 7 + i)) * .8 : 0; persona(B, xx, salto, zz, col); if (ban && k === 0 && i % 4 === 0) { const ond = Math.sin(t * 6 + i) * .8; B.pon(xx + 1 + ond, 9 + salto, zz, 2.4, 1.6, .2, [P.yellow, P.white, P.cyan, P.orange][i % 4]); B.pon(xx + .8, 7 + salto, zz, .2, 4, .2, P.silver); } }); B.fin(); };
    const c = cam(46);
    return { s, c, upd(t) { dib(0, t); publico(t, 0, true); rotular(scr, ['29-N'], '#fee761', '#124e89', 34); atrilM.position.set(0, 13, -16); atrilM.rotation.set(0, Math.PI / 2, -.3);
        mira(c, [Math.sin(t * .1) * 8, 34, 92], [0, 14, -10], .04); },
      acc: {
        // fiesta de mitin; a mitad, los focos se apagan uno a uno, la pantalla se funde y el público se va a casa
        apagon(lt, dur, t) { const k = ss(clamp((lt - dur * .35) / (dur * .6), 0, 1)); dib(k, t); publico(t, k, true); atrilM.position.set(0, 13 - k * 6, -16); atrilM.rotation.set(0, Math.PI / 2, -.3 + k * 1.2);
          rotular(scr, [''], '#fee761', k > .5 ? '#181425' : '#124e89', 34);
          mira(c, [0, 30, lerp(80, 96, k)], [0, 16, -10], .0); },
        // en la pantalla del escenario pasa la hoja del calendario: VIERNES 27 → SÁBADO 28 (rojo)
        calendario(lt, dur, t) { dib(1, t); publico(t, 1, false); atrilM.position.set(0, 7.5, -16); atrilM.rotation.set(0, Math.PI / 2, .9); const f = lt > dur * .4;
          rotular(scr, f ? ['SÁBADO', '28'] : ['VIERNES', '27'], f ? '#e43b44' : '#181425', '#ffffff', 26, { borde: '#181425' }); const q = ss(clamp(lt / dur, 0, 1));
          mira(c, [0, lerp(34, 28, q), lerp(70, 50, q)], [0, 26, -28], -.02); },
      } };
  },
  // —— 29-N 2: la calle de los carteles: bloques de pisos, vallas, reloj en una farola, gente con el móvil y una furgoneta con megáfono ——
  calle_carteles: () => {
    const s = new THREE.Scene(); s.background = cielo([0x124e89, 0x5a6988, 0xf6757a]); s.fog = new THREE.Fog(0x5a6988, 140, 280);
    luces(s, { cielo: 0xe0e8ff, suelo: 0x6a5a6a, amb: 1.2, sol: 0xffd0a0, int: 1.8, dir: [60, 50, 40], sombra: 110 });
    const v = new Vox(); v.box(-120, -1, -40, 120, 0, 60, (x, y, z) => (z > -8 && z < 12) ? (z === 2 && (x >> 2) & 1 ? P.white : P.dslate) : (((x >> 2) + (z >> 2)) & 1 ? P.silver : P.steel));
    for (let i = 0; i < 8; i++) pisos(v, -118 + i * 30, -40, 26, 30 + (i * 7) % 18, [P.tan, P.brown, P.sand, P.rose][i % 4]);
    v.box(30, 0, 16, 32, 26, 18, P.ink); v.box(26, 26, 16, 36, 36, 18, P.ink); v.box(27, 27, 17, 35, 35, 18.4, P.white);   // farola con reloj
    s.add(v.build({ jit: .05 }));
    const vallas = [-60, -20, 60].map(x => { const m = actor('valla', 1); m.position.set(x, 0, -14); s.add(m); const p = pantalla(25, 15, 100, 60); p.m.position.set(x, 20, -12.8); s.add(p.m); return p; });
    const B = new Bloques(300), H2 = new Bloques(20, true); s.add(B.im, H2.im);
    const van = new Vox(); van.box(-8, 1, -4, 8, 9, 4, P.white); van.box(4, 5, -4, 8, 8, 4, P.cyan); for (const [x, z] of [[-5, -4], [4, -4], [-5, 3], [4, 3]]) van.box(x, 0, z, x + 2, 2, z + 1, P.ink);
    const vg = new THREE.Group(); vg.add(van.build({ jit: .03 })); const mg = actor('megafono', .55); mg.position.set(0, 12, 0); vg.add(mg); s.add(vg);
    const tel = pantalla(14, 26, 56, 104); s.add(tel.m);
    const COL = ['#e43b44', '#124e89', '#3e8948', '#68386c', '#f77622', '#0099db'];
    const carteles = (cubre) => vallas.forEach((p, i) => { const { g, cv, tex } = p; g.fillStyle = COL[i * 2]; g.fillRect(0, 0, cv.width, cv.height); g.fillStyle = COL[i * 2 + 1]; g.fillRect(0, 40, cv.width, 20);
      g.fillStyle = '#ffffff'; g.font = 'bold 22px monospace'; g.textAlign = 'center'; g.fillText('¡VOTA!', 50, 28); g.font = 'bold 14px monospace'; g.fillText('29-N', 50, 55);
      if (cubre > 0) { g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, cv.width, cv.height * cubre); } tex.needsUpdate = true; });
    const reloj = (h) => { H2.ini(); const a = h / 12 * 6.283, m = (h % 1) * 6.283; manecilla(H2, 31, 31, 18.6, a, 2.6, .8, P.ink); manecilla(H2, 31, 31, 18.8, m, 3.6, .5, P.red); H2.fin(); };
    const paseo = (t, movil) => { B.ini(); for (let i = 0; i < 16; i++) { const x = ((hsh(i, 1, 7) * 220 + t * (i % 2 ? 4 : -4)) % 220 + 220) % 220 - 110, z = i % 2 ? -6 : 16; persona(B, x, 0, z + hsh(i, 2, 7) * 3, [P.navy, P.crimson, P.dgreen, P.plum, P.umber][i % 5], movil ? { movil: P.cyan } : {}); } B.fin(); };
    const c = cam(46);
    return { s, c, upd(t) { carteles(0); reloj(8.4); paseo(t, false); vg.position.set(-40, 0, 6); tel.m.visible = false;
        mira(c, [Math.sin(t * .1) * 10, 26, 70], [0, 14, -12], .02); },
      acc: {
        // la furgoneta con megáfono recorre la calle de los carteles; la cámara la sigue
        pregunta(lt, dur, t) { carteles(0); reloj(23.5 + lt * .02); paseo(t, false); tel.m.visible = false; const x = lerp(-100, 20, clamp(lt / dur, 0, 1)); vg.position.set(x, 0, 6); mg.rotation.y = Math.sin(t * 3) * .3;
          mira(c, [x + 4, 30, 84], [x + 8, 10, 0], .08); },
        // el reloj llega a las doce: la furgoneta se para y los carteles se tapan de blanco
        medianoche(lt, dur, t) { const h = Math.min(24, 23.6 + lt * .14), k = ss(clamp((lt - dur * .45) / (dur * .4), 0, 1)); carteles(k); reloj(h); paseo(t * .3, false); tel.m.visible = false; vg.position.set(20, 0, 6);
          const q = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(40, 0, q), lerp(30, 26, q), lerp(66, 84, q)], [lerp(31, 0, q), lerp(26, 16, q), -12], .02); },
        // un móvil gigante en la calle: los anuncios de la campaña salen tachados; la gente mira su móvil
        redes(lt, dur, t) { carteles(1); reloj(24); paseo(t, true); vg.position.set(20, 0, 6); tel.m.visible = true; tel.m.position.set(0, 18, 20); tel.m.lookAt(c.position);
          const { g, cv, tex } = tel, n = Math.min(4, Math.floor(lt / .6) + 1); g.fillStyle = '#181425'; g.fillRect(0, 0, cv.width, cv.height); g.fillStyle = '#5a6988'; g.fillRect(0, 0, cv.width, 12);
          for (let i = 0; i < n; i++) { const y = 18 + i * 21; g.fillStyle = '#ffffff'; g.fillRect(4, y, 48, 16); g.fillStyle = COL[i]; g.fillRect(6, y + 2, 10, 12); g.fillStyle = '#8b9bb4'; g.fillRect(19, y + 4, 28, 3); g.fillRect(19, y + 9, 20, 3);
            if (lt > .6 * i + .4) { g.strokeStyle = '#e43b44'; g.lineWidth = 3; g.beginPath(); g.moveTo(4, y); g.lineTo(52, y + 16); g.moveTo(52, y); g.lineTo(4, y + 16); g.stroke(); } } tex.needsUpdate = true;
          mira(c, [0, 26, 74], [0, 16, 12], .02); },
      } };
  },
  // —— 29-N 3: el fin de semana del voto: casa en corte (sábado tranquilo), colegio electoral con cola (domingo) y, al lado, «otro país» con campaña el mismo día ——
  salon_voto: () => {
    const s = new THREE.Scene(); s.background = cielo([0x0099db, 0x7fd0ff, 0xffe6b0]); s.fog = new THREE.Fog(0xffe6b0, 170, 340);
    luces(s, { cielo: 0xfff4e0, suelo: 0x6a6a5a, amb: 1.4, sol: 0xfff1d6, int: 2, dir: [-40, 80, 60], sombra: 130 });
    const v = new Vox(); v.box(-140, -1, -60, 160, 0, 70, (x, y, z) => z > 22 && z < 40 ? P.dslate : (((x >> 3) + (z >> 3)) & 1 ? P.lime : P.green));
    // casa en corte (x −110…−60): suelo de madera, paredes en tres lados, sofá, mesa, lámpara y ventana
    v.box(-112, 0, -20, -60, 1, 14, P.brown); v.box(-112, 1, -22, -60, 30, -20, P.sand); v.box(-114, 1, -22, -112, 30, 14, P.sand); v.box(-60, 1, -22, -58, 30, 14, P.sand);
    v.box(-96, 12, -22, -80, 24, -21, P.cyan); v.box(-104, 1, -16, -78, 6, -8, P.navy); v.box(-104, 6, -16, -78, 12, -13, P.navy); v.box(-92, 1, -2, -76, 6, 6, P.dbrown);
    v.box(-68, 1, -14, -66, 22, -12, P.dslate); v.box(-70, 22, -16, -64, 25, -10, P.yellow); v.luz(P.yellow);
    // colegio electoral (x −20…40): fachada con puerta y letrero
    v.box(-20, 0, -40, 40, 34, -10, (x, y) => y % 5 === 0 ? P.silver : P.tan); v.box(4, 0, -10, 16, 16, -9, P.dbrown); v.box(-12, 22, -10, 32, 30, -9, P.white);
    for (const x of [-16, 22, 30]) v.box(x, 8, -10, x + 6, 18, -9, P.cyan);
    // otro país (x 80…150): edificio de ladrillo con puerta
    v.box(80, 0, -40, 150, 30, -12, (x, y) => (y % 3 === 0 || (x + (y / 3 | 0) * 2) % 6 === 0) ? P.dbrown : P.brown); v.box(110, 0, -12, 120, 14, -11, P.navy);
    s.add(v.build({ jit: .05 }));
    const let1 = pantalla(42, 7, 168, 28); let1.m.position.set(10, 26, -8.8); s.add(let1.m); rotular(let1, ['COLEGIO ELECTORAL'], '#124e89', '#ffffff', 18);
    const let2 = pantalla(36, 7, 144, 28); let2.m.position.set(115, 22, -11.8); s.add(let2.m); rotular(let2, ['POLLING STATION'], '#ffffff', '#124e89', 18);
    const sob = actor('sobre_voto', .8), sob2 = actor('sobre_voto', .8), meg = actor('megafono', .6); s.add(sob, sob2, meg);
    const urn = new Vox(); urn.box(-3, 0, -3, 4, 8, 4, 0x9fe6f0); urn.box(-3, 8, -3, 4, 9, 4, P.navy); urn.box(0, 8, -1, 1, 9, 2, P.ink); const ug = new THREE.Group(); ug.add(urn.build({ jit: .02 })); ug.position.set(10, 0, -4); s.add(ug);
    const B = new Bloques(500); s.add(B.im); const c = cam(46);
    const nada = () => { sob.visible = sob2.visible = meg.visible = false; B.ini(); B.fin(); };
    return { s, c, upd(t) { nada(); mira(c, [10 + Math.sin(t * .1) * 6, 34, 96], [10, 12, -14], .02); },
      acc: {
        // sábado en casa: una persona en el sofá mira dos sobres, con calma, sin carteles ni ruido
        pensar(lt, dur, t) { nada(); B.ini(); persona(B, -91, 6, -10, P.crimson, { s: 1.3 }); B.fin(); sob.visible = sob2.visible = true;
          sob.position.set(-87, 7.2, 1); sob2.position.set(-81, 7.2, 2.5); sob.rotation.y = Math.sin(t * .6) * .2; sob2.rotation.y = -.3 + Math.sin(t * .5 + 1) * .2; const el = Math.floor(lt / 1.4) % 2; (el ? sob2 : sob).position.y = 7.2 + Math.abs(Math.sin(lt * 2.2)) * 1.5;
          const q = ss(clamp(lt / dur, 0, 1)); mira(c, [-86 + lerp(-10, 0, q), lerp(40, 32, q), lerp(72, 56, q)], [-86, 8, -6], .02); },
        // domingo: una cola de votantes entra por la puerta, cada uno mete su sobre en la urna transparente
        urnas(lt, dur, t) { nada(); B.ini(); for (let i = 0; i < 9; i++) { const u = lt * 1.6 - i * 1.1; let x, z; if (u < 0) { x = 40 + i * 2; z = 30 + i * 0; x = 30 + (-u) * 5; z = 14; } else { const f = clamp(u / 2, 0, 1); x = lerp(30, 14, f); z = lerp(14, -1, f); }
            if (u > 3.2) continue; persona(B, Math.min(x, 70), 0, z, [P.navy, P.dgreen, P.plum, P.umber, P.crimson, P.blue][i % 6]); if (u > 2 && u < 2.8) B.pon(12, lerp(11, 8, (u - 2) / .8), -.5, 2.4, .3, 1.6, P.sand); } B.fin();
          mira(c, [22, 32, 84], [12, 12, -4], .06); },
        // en otro país se hace campaña hasta el mismo día: gente con pancartas y un megáfono junto al colegio
        fuera(lt, dur, t) { nada(); meg.visible = true; meg.position.set(104, 10 + Math.sin(t * 4) * .3, 4); meg.rotation.set(0, Math.PI * .8, .2); B.ini();
          for (let i = 0; i < 10; i++) { const x = 96 + i * 4 + Math.sin(t + i) * .6, z = 8 + (i % 3) * 3, sal = Math.max(0, Math.sin(t * 6 + i)) * .6; persona(B, x, sal, z, [P.navy, P.crimson, P.amber, P.dgreen][i % 4]);
            if (i % 2) { B.pon(x, 10 + sal, z, .2, 4, .2, P.silver); B.pon(x, 12.5 + sal, z, 5, 3, .3, [P.red, P.blue, P.yellow, P.white][i % 4]); } } B.fin();
          const q = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(70, 115, q), 34, lerp(118, 110, q)], [115, 12, -8], .06); },
      } };
  },
});

// —— Cristiano 987: futbolista genérico (sin caras ni escudos) ——
function jugadorV(cam, pan, med) { const g = new THREE.Group(), v = new Vox();
  v.box(-2, 7, -1, 2, 13, 1, cam); v.box(-3, 8, -1, -2, 12, 1, cam); v.box(2, 8, -1, 3, 12, 1, cam); v.box(-2, 6, -1, 2, 8, 1, pan);
  v.box(-1, 13, -1, 1, 14, 1, P.skin); v.box(-2, 14, -2, 2, 17, 2, P.skin); v.box(-2, 17, -2, 2, 18, 2, P.dbrown); v.box(-2, 15, -2, 2, 17, -1, P.dbrown);
  v.box(-3, 7, -1, -2, 8, 1, P.skin); v.box(2, 7, -1, 3, 8, 1, P.skin);
  g.add(v.build({ jit: .03 }));
  for (const sx of [-1, 1]) { const p = new Vox(); p.box(-1, -6, -1, 1, 0, 1, (x, y) => y < -5 ? P.ink : y < -2 ? med : P.skin); const pg = p.build({ jit: .03 }); const h = new THREE.Group(); h.add(pg); h.position.set(sx * 1, 6, 0); if (sx > 0) h.name = 'pierna'; g.add(h); }
  return g; }
Object.assign(FAB, {
  jugador_am: () => jugadorV(P.yellow, P.navy, P.yellow), jugador_bl: () => jugadorV(P.white, P.white, P.white), jugador_gr: () => jugadorV(P.silver, P.dslate, P.silver),
  portero: () => jugadorV(P.lime, P.ink, P.lime),
  marcador: () => {   // marcador de estadio sobre dos pilares (la cifra es una pantalla aparte en z = +1.6)
    const v = new Vox(); v.box(-14, 0, 0, -12, 16, 2, P.steel); v.box(12, 0, 0, 14, 16, 2, P.steel); v.box(-18, 16, 0, 18, 34, 2, P.ink); v.box(-18, 34, 0, 18, 35, 2, P.amber); v.luz(P.amber);
    const w = new THREE.Group(); w.add(v.build({ jit: .03 })); return w; },
});
// portería de 7,3 × 2,4 m a escala 1 m = 2 cubos, con red de cuadros (en z = zg, mirando a +z)
function porteriaV(v, zg) { v.box(-8, 0, zg, -7, 6, zg + 1, P.white); v.box(7, 0, zg, 8, 6, zg + 1, P.white); v.box(-8, 6, zg, 8, 7, zg + 1, P.white);
  for (let x = -7; x < 7; x++) for (let y = 0; y < 6; y++) if ((x + y) % 2 === 0) v.set(x, y, zg - 4, P.silver); for (let z = zg - 4; z < zg; z++) for (let y = 0; y < 6; y += 2) { v.set(-8, y, z, P.silver); v.set(7, y, z, P.silver); } }
const balonB = (B, x, y, z, s = 1) => { B.pon(x, y, z, 1.1 * s, 1.1 * s, 1.1 * s, P.white); B.pon(x + .2 * s, y + .2 * s, z + .2 * s, .5 * s, .5 * s, .5 * s, P.ink); };
Object.assign(FABE, {
  // —— Cristiano 1: estadio de noche con gradas llenas, focos, portería y marcador ——
  estadio_noche: () => {
    const s = new THREE.Scene(); s.background = cielo([0x07060e, 0x124e89, 0x262b44]); s.fog = new THREE.Fog(0x124e89, 160, 320);
    luces(s, { cielo: 0xd0e0ff, suelo: 0x204030, amb: 1.2, sol: 0xffffff, int: 2.3, dir: [30, 90, 60], sombra: 90 });
    const v = new Vox(); cesped(v, -60, 60, -30, 70, -20, {}); porteriaV(v, -20);
    for (let f = 0; f < 8; f++) v.box(-70, f * 3, -42 - f * 3, 70, f * 3 + 3, -39 - f * 3, (x) => hsh(x, f, 1) > .45 ? [P.yellow, P.navy, P.white, P.yellow][x & 3] : P.dslate);   // grada de fondo
    for (const sx of [-74, 66]) v.box(sx, 0, -70, sx + 8, 70, -62, P.steel); for (const sx of [-76, 64]) v.box(sx, 70, -72, sx + 12, 76, -62, P.white); v.luz(P.white);
    s.add(v.build({ jit: .05 }));
    const mk = actor('marcador', 1); mk.position.set(24, -12, -40); s.add(mk); const scr = pantalla(34, 16, 136, 64); scr.m.position.set(24, 13, -37.8); s.add(scr.m);
    const cr = actor('jugador_am', 1), po = actor('portero', 1), ri = [actor('jugador_gr', 1), actor('jugador_gr', 1)], co = [actor('jugador_am', 1), actor('jugador_am', 1), actor('jugador_am', 1)]; s.add(cr, po, ...ri, ...co);
    const B = new Bloques(300, true); s.add(B.im);
    const cuenta = (txt, sub, col = '#fee761') => rotular(scr, sub ? [txt, sub] : [txt], [col, '#ffffff'], '#181425', sub ? 24 : 34);
    const fija = () => { cr.position.set(-2, 0, 6); cr.rotation.set(0, Math.PI, 0); po.position.set(0, 0, -18); po.rotation.set(0, 0, 0); ri.forEach((m, i) => { m.position.set(-24 + i * 48, 0, 16); m.rotation.set(0, Math.PI, 0); }); co.forEach((m, i) => { m.position.set(-30 + i * 30, 0, 30); m.rotation.set(0, Math.PI, 0); });
      [cr, ...co].forEach(m => m.getObjectByName('pierna').rotation.x = 0); };
    const c = cam(46);
    // tiro: balón desde el punto de penalti (z = 2, 11 m) a la escuadra; el portero se tira al otro lado
    const tiro = (k, B2) => { const x = lerp(0, 5.5, k), y = lerp(.6, 4.8, k) + Math.sin(k * Math.PI) * 1.4, z = lerp(2, -21, k); balonB(B2, x, y, z); };
    return { s, c, upd(t) { fija(); B.ini(); balonB(B, 0, .6, 2); B.fin(); cuenta('987', 'GOLES');
        mira(c, [Math.sin(t * .1) * 6, 22, 60], [0, 6, -14], .0); },
      acc: {
        // el marcador cuenta 985, 986, 987… y se queda en «FALTAN 13» con la portería y el balón en la red
        contador(lt, dur, t) { fija(); cr.position.set(-14, 0, 4); ri.forEach(m => m.position.x += 200); co.forEach(m => m.position.x += 200); const n = Math.min(987, 984 + Math.floor(lt / .45)); cuenta(String(n), n >= 987 ? 'FALTAN 13' : 'GOLES', n >= 987 ? '#fee761' : '#ffffff');
          B.ini(); const k = (lt % .45) / .45; if (n < 987) tiro(k, B); else balonB(B, 5.5, 1, -22); B.fin(); po.rotation.z = 0;
          mira(c, [lerp(0, 11, ss(clamp(lt / dur, 0, 1))), 20, 82], [12, 12, -30], .02); },
        // carrerilla, golpeo y gol: el portero se lanza hacia el lado contrario
        penalti(lt, dur, t) { fija(); ri.forEach(m => m.position.x += 200); co.forEach(m => m.position.x += 200); const tk = 1.1, k = clamp((lt - tk) / .5, 0, 1); cr.position.set(lerp(-5, -1, clamp(lt / tk, 0, 1)), Math.abs(Math.sin(lt * 9)) * (lt < tk ? .5 : 0), lerp(12, 4, clamp(lt / tk, 0, 1)));
          cr.getObjectByName('pierna').rotation.x = lt < tk ? Math.sin(lt * 9) * .5 : lerp(.6, -1.3, clamp((lt - tk) / .25, 0, 1));
          const dv = clamp((lt - tk - .1) / .5, 0, 1); po.position.set(lerp(0, -5, dv), Math.sin(dv * Math.PI) * 2, -18); po.rotation.set(0, 0, dv * 1.3);
          B.ini(); if (lt < tk) balonB(B, 0, .6, 2); else tiro(k, B); B.fin(); cuenta(lt > tk + .5 ? '987' : '986', 'GOLES', lt > tk + .5 ? '#fee761' : '#ffffff');
          mira(c, [-14, 20, 68], [2, 5, -16], .06); },
        // final 2-1: los jugadores de amarillo saltan, cae confeti y suben fuegos artificiales
        victoria(lt, dur, t) { fija(); cuenta('2-1', 'FINAL'); po.rotation.z = 0; [cr, ...co].forEach((m, i) => { m.position.y = Math.max(0, Math.sin(t * 6 + i * 1.3)) * 3; m.rotation.y = Math.PI + Math.sin(t * 2 + i) * .6; });
          cr.position.set(0, cr.position.y, 10); co.forEach((m, i) => m.position.set(-8 + i * 8, m.position.y, 16));
          B.ini(); for (let i = 0; i < 160; i++) { const y = 40 - ((t * 6 + hsh(i, 1, 3) * 40) % 40); B.pon(-30 + hsh(i, 2, 3) * 60 + Math.sin(t + i) * 1.5, y, -10 + hsh(i, 3, 3) * 40, .6, .6, .2, [P.yellow, P.navy, P.white][i % 3]); }
          fuegos(B, t, -50, 50, 50, 75, -60, [P.yellow, P.cyan, P.white]); B.fin();
          mira(c, [0, 26, 86], [6, 14, -10], .06); },
      } };
  },
  // —— Cristiano 2: la sala de la cuenta: un tubo de cristal con la raya de los 1.000 y seis rampas de colores (clubes y selección) ——
  taller_goles: () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(0x262b44); s.fog = new THREE.Fog(0x262b44, 150, 300);
    luces(s, { cielo: 0xfff0e0, suelo: 0x504860, amb: 1.4, sol: 0xffffff, int: 1.7, dir: [30, 90, 70], sombra: 100 });
    const v = new Vox(); v.box(-80, -1, -60, 80, 0, 60, (x, y, z) => ((x >> 3) + (z >> 3)) & 1 ? P.dslate : P.slate); v.box(-80, 0, -62, 80, 70, -60, P.night);
    for (let y = 0; y < 60; y++) for (let a = 0; a < 6.283; a += .09) if (y < 2 || Math.floor(a / .09) % 9 === 0) v.set(Math.cos(a) * 13, y, -20 + Math.sin(a) * 13, y < 2 ? P.steel : 0x9fe6f0);
    for (let a = 0; a < 6.283; a += .06) v.set(Math.cos(a) * 13.4, 56, -20 + Math.sin(a) * 13.4, P.red); v.luz(P.red);
    const RC = [[0x3e8948, P.white], [P.red, P.red], [P.white, P.white], [P.ink, P.white], [P.red, P.dgreen], [P.yellow, P.navy]];
    RC.forEach(([c1, c2], i) => { const a = Math.PI * (.12 + i * .152), x0 = Math.cos(a) * 60, z0 = -20 - Math.sin(a) * 30 + 40; for (let k = 0; k < 28; k++) { const f = k / 28; v.box(lerp(x0, Math.cos(a) * 14, f), lerp(66, 58, f), lerp(z0, -20 + Math.sin(a) * 0, f), lerp(x0, Math.cos(a) * 14, f) + 3, lerp(66, 58, f) + 1, lerp(z0, -20, f) + 3, k % 4 < 2 ? c1 : c2); } });
    v.box(32, 0, -32, 52, 14, -12, P.steel); v.box(34, 14, -30, 50, 15, -14, P.red);   // cubo de los amistosos
    s.add(v.build({ jit: .04 }));
    const cnt = pantalla(30, 9, 120, 36); cnt.m.position.set(-28, 40, -59); s.add(cnt.m);
    const etq = pantalla(26, 7, 104, 28); etq.m.position.set(42, 32, -11.5); s.add(etq.m); rotular(etq, ['AMISTOSOS: NO'], '#ffffff', '#a22633', 14);
    const etq2 = pantalla(26, 7, 104, 28); etq2.m.position.set(0, 64, -6); s.add(etq2.m); rotular(etq2, ['META: 1.000'], '#e43b44', '#ffffff', 16);
    const B = new Bloques(1400), F = new Bloques(80); s.add(B.im, F.im);
    const tubo = (n) => { const filas = n / 987 * 52 | 0; for (let y = 0; y < filas; y++) for (let k = 0; k < 18; k++) { const a = k / 18 * 6.283 + y * .4, r = 4 + (k % 3) * 3; B.pon(Math.cos(a) * r, 2.5 + y, -20 + Math.sin(a) * r, 1.6, 1, 1.6, k % 5 ? P.white : P.ink); } };
    const cae = (t, rate) => { for (let i = 0; i < 6; i++) for (let k = 0; k < 3; k++) { const a = Math.PI * (.12 + i * .152), f = ((t * rate + k / 3 + i * .17) % 1), x0 = Math.cos(a) * 60, z0 = -20 - Math.sin(a) * 30 + 40;
      balonB(B, lerp(x0, 0, f) + 1.5, lerp(68, 58, f) + 1, lerp(z0, -20, f) + 1.5, 1.4); } };
    const c = cam(46);
    return { s, c, upd(t) { B.ini(); tubo(120); B.fin(); F.ini(); F.fin(); rotular(cnt, ['0'], '#fee761', '#181425', 26); mira(c, [Math.sin(t * .1) * 10, 50, 104], [0, 34, -20], .0); },
      acc: {
        // el tubo está casi vacío; la cámara sube por él hasta la raya roja de los 1.000
        pregunta(lt, dur, t) { B.ini(); tubo(40); B.fin(); F.ini(); F.fin(); rotular(cnt, ['¿1.000?'], '#fee761', '#181425', 26); const q = ss(clamp(lt / dur, 0, 1));
          mira(c, [lerp(-14, 10, q), lerp(24, 64, q), 92], [-8, lerp(16, 50, q), -20], .02); },
        // los balones bajan por las seis rampas (colores de cada club y de la selección) y el tubo se llena hasta 987
        suma(lt, dur, t) { const n = Math.round(987 * ss(clamp(lt / (dur * .9), 0, 1))); B.ini(); tubo(Math.max(40, n)); cae(t, .9); B.fin(); F.ini(); F.fin(); rotular(cnt, [String(n)], '#fee761', '#181425', 26);
          mira(c, [Math.sin(lt * .15) * 16, 52, 124], [-6, 34, -20], .02); },
        // un balón gris de amistoso llega por la rampa y rebota al cubo rojo: no entra en la cuenta
        oficiales(lt, dur, t) { B.ini(); tubo(987); B.fin(); rotular(cnt, ['987'], '#fee761', '#181425', 26); F.ini(); for (let i = 0; i < 3; i++) { const f = clamp((lt - i * 1.1) / 1.4, 0, 1); if (f <= 0) continue;
            const x = lerp(10, 42, f), y = 60 - f * 44 + Math.sin(f * Math.PI) * 18, z = lerp(-14, -22, f); F.pon(x, y, z, 1.6, 1.6, 1.6, P.steel); F.pon(x + .3, y + .3, z + .3, .7, .7, .7, P.dslate); } F.fin();
          mira(c, [20, 46, 112], [18, 30, -20], .04); },
      } };
  },
  // —— Cristiano 3: un estadio blanco de día: dos columnas de balones, la de toda la carrera (987) y la del Madrid (450) ——
  madrid_blanco: () => {
    const s = new THREE.Scene(); s.background = cielo([0x0099db, 0x7fd0ff, 0xffffff]); s.fog = new THREE.Fog(0xffffff, 170, 340);
    luces(s, { cielo: 0xffffff, suelo: 0x406040, amb: 1.5, sol: 0xfff8e0, int: 2.2, dir: [-40, 90, 50], sombra: 110 });
    const v = new Vox(); cesped(v, -70, 70, -30, 60, -20, {});
    for (let f = 0; f < 9; f++) v.box(-80, f * 3, -42 - f * 3, 80, f * 3 + 3, -39 - f * 3, (x) => hsh(x, f, 2) > .4 ? [P.white, P.white, P.navy, P.silver][x & 3] : P.steel);
    v.box(-80, 27, -72, 80, 31, -66, P.white);
    s.add(v.build({ jit: .05 }));
    const jg = actor('jugador_bl', 1.4); s.add(jg); const B = new Bloques(1200); s.add(B.im);
    const e1 = pantalla(16, 5, 80, 25), e2 = pantalla(16, 5, 80, 25); s.add(e1.m, e2.m); rotular(e1, ['CARRERA'], '#ffffff', '#3a4466', 14); rotular(e2, ['MADRID'], '#124e89', '#ffffff', 14, { borde: '#124e89' });
    const col = (x, n, cl, k) => { const filas = Math.round(n / 25 * k); for (let y = 0; y < filas; y++) for (let i = 0; i < 25; i++) if (i % 5 < 5) B.pon(x + (i % 5) * 1.6 - 3.2, .6 + y * 1.25, (i / 5 | 0) * 1.6 - 3.2, 1.3, 1.1, 1.3, cl(y, i)); return filas * 1.25; };
    const c = cam(46);
    return { s, c, upd(t) { B.ini(); B.fin(); jg.position.set(0, 0, 14); jg.rotation.set(0, 0, 0); e1.m.visible = e2.m.visible = false; mira(c, [Math.sin(t * .1) * 8, 24, 80], [0, 14, 0], .02); },
      acc: {
        // las dos columnas crecen a la vez: la gris llega a 987 y la blanca se para en 450, casi la mitad
        madrid(lt, dur, t) { const k = ss(clamp(lt / (dur * .8), 0, 1)); B.ini(); const h1 = col(-12, 987, (y, i) => (y + i) % 7 ? P.silver : P.steel, k), h2 = col(12, 450, (y, i) => (y + i) % 7 ? P.white : P.navy, k); B.fin();
          e1.m.visible = e2.m.visible = true; e1.m.position.set(-12, h1 + 4, 5); e2.m.position.set(12, h2 + 4, 5); jg.position.set(22, Math.max(0, Math.sin(t * 5)) * (k >= 1 ? 2 : 0), 12); jg.rotation.set(0, -.5, 0);
          mira(c, [0, 36, 118], [0, 24, 0], .08); },
      } };
  },
});

// ———————————————————— 27/11/2026: las bolas del Gordo, la mesa electoral del 29-N y «Elf 2» ————————————————————
// bombo de la Lotería: jaula esférica de latón (hijo 'giro', gira sobre el eje x) en un soporte; centro de la esfera en y = 20
function bomboV(r = 14, H0 = 20) {
  const w = new THREE.Group(), v = new Vox();
  v.box(-r - 7, 0, -7, r + 8, 2, 8, P.brown); v.box(-r - 6, 2, -6, r + 7, 3, 7, P.amber);
  for (const sx of [-r - 5, r + 4]) { v.box(sx, 3, -1, sx + 2, H0 + 1, 2, P.amber); v.box(sx - 1, 3, -3, sx + 3, 5, 4, P.tan); }
  v.box(r + 6, H0 - 1, 0, r + 7, H0 + 1, 1, P.amber); v.box(r + 7, H0, 0, r + 8, H0 + 8, 1, P.tan); v.box(r + 7, H0 + 7, -2, r + 8, H0 + 8, 1, P.dbrown);
  w.add(v.build({ jit: .05 }));
  const c = new Vox();
  for (let x = -r; x <= r; x++) for (let y = -r; y <= r; y++) for (let z = -r; z <= r; z++) { const d = Math.hypot(x, y, z); if (Math.abs(d - r) > .55) continue;
    const rho = Math.hypot(y, z), fr = (Math.atan2(y, z) / (2 * Math.PI) + 1) * 14, bar = Math.abs(fr - Math.round(fr)) * 2 * Math.PI * rho / 14 < .6;
    if (x % 4 === 0) c.set(x, y, z, P.amber); else if (bar) c.set(x, y, z, P.tan); }
  for (const sx of [-r - 1, r]) c.box(sx, -2, -2, sx + 1, 2, 2, P.brown);
  const g = c.build({ jit: .06 }); g.position.set(-.5, -.5, -.5); const piv = new THREE.Group(); piv.add(g); piv.position.set(0, H0, 0); piv.name = 'giro'; w.add(piv); return w;
}
// bolas de boj dentro del bombo: un montón en el fondo que la jaula arrastra (a = agitación 0..1)
const _bp = (() => { const L = []; for (let i = 0; L.length < 700 && i < 9000; i++) { const x = (hsh(i, 1, 5) * 2 - 1), y = (hsh(i, 2, 5) * 2 - 1), z = (hsh(i, 3, 5) * 2 - 1); if (x * x + y * y + z * z < 1) L.push([x, y, z]); } return L.sort((a, b) => a[1] - b[1]); })();
function bolasBombo(B, cx, cy, cz, r, n, t, a = 0) { const rr = r - 1.6, th = a * .7 + Math.sin(t * 1.3) * .08 * a;
  for (let i = 0; i < Math.min(n, _bp.length); i++) { let [x, y, z] = _bp[i].map(q => q * rr); const yy = y * Math.cos(th) - z * Math.sin(th), zz = y * Math.sin(th) + z * Math.cos(th); y = yy; z = zz;
    if (a > 0) { x += Math.sin(t * 7 + i) * a * 1.2; y += (i % 6 === 0 ? Math.abs(Math.sin(t * 3.1 + i * .7)) * a * rr * 1.1 : Math.sin(t * 6 + i * 1.7) * a); }
    const d = Math.hypot(x, y, z); if (d > rr) { x *= rr / d; y *= rr / d; z *= rr / d; }
    B.pon(cx + x, cy + y, cz + z, 1.15, 1.15, 1.15, [P.sand, P.tan, 0xf3dca0][i % 3], i); } }
// cifras de 3×5 para grabar en las bolas
const DIG = { 0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001001001001', 8: '111101111101111', 9: '111101111001111' };
Object.assign(FAB, {
  bombo: () => bomboV(),
  bola_boj: () => {   // bola de madera de boj con el número grabado (07) por delante y por detrás
    const v = new Vox(), r = 7; v.ball(0, 0, 0, r, (x, y, z) => hsh(x, y * 3, z) > .8 ? P.tan : P.sand);
    for (const sz of [1, -1]) ['0', '7'].forEach((d, k) => { for (let i = 0; i < 15; i++) if (DIG[d][i] === '1') { const x = (k ? 1 : -3) + (i % 3) * (sz), y = 2 - (i / 3 | 0); const xx = sz > 0 ? x : -x; v.set(xx, y, sz * Math.round(Math.sqrt(Math.max(0, r * r + r * .6 - xx * xx - y * y))), P.umber); } });
    const g = new THREE.Group(); g.add(v.build({ jit: .05, centrar: true })); return g; },
  laser: () => {   // grabadora láser: bancada, columna y cabezal rojo
    const v = new Vox(); v.box(-8, 0, -6, 9, 3, 7, P.slate); v.box(-8, 3, -6, 9, 4, 7, P.steel); v.box(-7, 4, -5, -4, 22, -2, P.dslate); v.box(-7, 20, -5, 6, 23, -2, P.dslate);
    v.box(3, 16, -5, 7, 20, -1, P.ink); v.box(4, 15, -4, 6, 16, -2, P.red); v.box(-2, 21, -2, 0, 22, -1, P.lime); v.luz(P.red, P.lime);
    const g = new THREE.Group(); g.add(v.build({ jit: .04 })); return g; },
});
Object.assign(FABE, {
  // —— Gordo 1: el escenario del Teatro (telón rojo, suelo de tablas y el bombo grande en el centro) ——
  teatro_gordo: () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(0x120a14); s.fog = new THREE.Fog(0x120a14, 150, 300);
    luces(s, { cielo: 0xfff0d0, suelo: 0x3e2731, amb: 1.2, sol: 0xfff1c0, int: 2.4, dir: [-20, 80, 60], sombra: 70 });
    const v = new Vox(); v.box(-70, -1, -40, 70, 0, 40, (x, y, z) => (z & 3) ? P.brown : P.dbrown);
    v.box(-70, 0, -46, 70, 70, -42, (x) => (x & 3) === 0 ? P.crimson : (x & 3) === 2 ? 0x8a1a2a : P.red);
    for (const sx of [-1, 1]) { v.box(sx < 0 ? -70 : 52, 0, -42, sx < 0 ? -52 : 70, 70, -10, (x, y, z) => (z & 3) ? P.red : P.crimson); }
    v.box(-56, 66, -12, 56, 72, -8, P.amber); for (const sx of [-58, 54]) v.box(sx, 0, -12, sx + 4, 72, -8, P.amber);
    for (let x = -50; x <= 50; x += 10) v.box(x, 0, 30, x + 3, 1, 33, P.amber);   // candilejas
    v.luz(P.amber); s.add(v.build({ jit: .05 }));
    const bo = actor('bombo'); s.add(bo); const giro = bo.getObjectByName('giro');
    const B = new Bloques(700), G = new Bloques(260); s.add(B.im, G.im);
    const b3 = [actor('bola_boj', .55), actor('bola_boj', .55), actor('bola_boj', .55)]; b3.forEach(b => { b.visible = false; s.add(b); });
    const c = cam(46);
    const base = (t, n, a, vel) => { giro.rotation.x = t * vel; B.ini(); bolasBombo(B, 0, 20, 0, 14, n, t, a); B.fin(); G.ini(); G.fin(); b3.forEach(b => b.visible = false); };
    return { s, c, upd(t) { base(t, 420, .35, .6); mira(c, [Math.sin(t * .1) * 10, 30, 100], [0, 20, 0], -.04); },
      acc: {
        // el bombo gira lleno de bolas y la cámara se acerca despacio
        gira(lt, dur, t) { base(t, 520, .8, 1.6); const q = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(18, 6, q), lerp(28, 26, q), lerp(104, 92, q)], [0, 20, 0], -.04); },
        // las bolas caen desde la tolva en un chorro y el bombo se va llenando
        llenar(lt, dur, t) { const k = ss(clamp(lt / (dur * .9), 0, 1)); giro.rotation.x = t * .5; B.ini(); bolasBombo(B, 0, 20, 0, 14, Math.round(lerp(60, 560, k)), t, .25); B.fin();
          G.ini(); flujo(G, [[-34, 62, 4], [-14, 46, 2], [0, 34, 0]], 60, t, 22, P.sand, 1.15); G.pon(-38, 64, 4, 10, 4, 8, P.amber); G.fin(); b3.forEach(b => b.visible = false);
          mira(c, [-8, 32, 104], [-6, 22, 0], -.02); },
        // tres bolas salen al frente y suben y bajan: ¿cuál tiene más suerte?
        pregunta(lt, dur, t) { base(t, 520, .3, .4); b3.forEach((b, i) => { b.visible = true; const k = ss(clamp((lt - i * .25) / 1, 0, 1)); b.position.set((i - 1) * 9, lerp(12, 27, k) + Math.sin(t * 2.4 + i * 2.1) * 2.2, lerp(0, 40, k)); b.rotation.set(0, Math.sin(t + i) * .5, 0); });
          mira(c, [0, 28, 104], [0, 20, 10], -.03); },
      } };
  },
  // —— Gordo 2: el taller de las bolas (láser, báscula y rampa de carreras) ——
  taller_boj: () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(0x262b44); s.fog = new THREE.Fog(0x262b44, 140, 280);
    luces(s, { cielo: 0xf0f4ff, suelo: 0x3a4466, amb: 1.4, sol: 0xffffff, int: 2.1, dir: [-30, 80, 50], sombra: 80 });
    const v = new Vox(); v.box(-80, -1, -50, 80, 0, 50, (x, y, z) => ((x >> 3) + (z >> 3)) & 1 ? P.slate : P.steel);
    v.box(-80, 0, -52, 80, 50, -48, (x, y) => y % 10 === 0 ? P.dslate : P.night);
    for (let y = 8; y < 44; y += 12) { v.box(-70, y, -48, 70, y + 1, -40, P.brown); for (let x = -68; x < 68; x += 7) v.box(x, y + 1, -46, x + 5, y + 5, -42, (xx, yy, zz) => hsh(xx, yy, zz) > .5 ? P.sand : P.tan); }
    v.box(-34, 0, -14, -6, 10, 4, P.dbrown);          // banco del láser
    v.box(6, 0, -10, 30, 2, 6, P.dslate); v.box(8, 2, -8, 28, 3, 4, P.silver); v.box(12, 2, -12, 24, 13, -10, P.ink);   // báscula
    // rampa de 7 carriles: baja de x = -40 (y 22) a x = 10 (y 4) y sigue plana hasta 40, en z 14..40
    for (let x = -42; x < 42; x++) { const y = x < 10 ? Math.round(lerp(22, 4, (x + 42) / 52)) : 4; v.box(x, 0, 14, x + 1, y, 40, P.brown); for (let k = 0; k <= 7; k++) v.box(x, y, 14 + k * 3.7 | 0, x + 1, y + 2, (14 + k * 3.7 | 0) + 1, P.dbrown); }
    v.box(36, 4, 14, 37, 9, 41, P.lime); v.luz(P.lime);
    s.add(v.build({ jit: .05 }));
    const la = actor('laser', 1.3); la.position.set(-20, 10, 3); s.add(la);
    const bola = actor('bola_boj', .5); s.add(bola);
    const pan = pantalla(10, 4, 60, 24); pan.m.position.set(18, 9, -9.8); s.add(pan.m);
    const B = new Bloques(80, true), R7 = []; for (let i = 0; i < 7; i++) { const b = actor('bola_boj', .27); s.add(b); R7.push(b); }
    const c = cam(46);
    const r7 = (f) => R7.forEach((b, i) => { const x = lerp(-38, 32, f), y = (x < 10 ? lerp(22, 4, (x + 42) / 52) : 4) + 2.2; b.position.set(x, y, 15.8 + i * 3.7); b.rotation.set(0, 0, -f * 22); });
    return { s, c, upd(t) { bola.position.set(-13.5, 18.8, -1.5); bola.rotation.set(0, t * .8, 0); B.ini(); B.fin(); rotular(pan, ['0,0'], '#63c74d', '#181425', 18); r7(0); mira(c, [0, 44, 110], [0, 14, 0], .0); },
      acc: {
        // la bola gira bajo el cabezal y el haz rojo graba la cifra (chispas naranjas)
        laser(lt, dur, t) { bola.position.set(-13.5, 18.8, -1.5); bola.rotation.set(0, t * 1.6, 0); B.ini(); const on = Math.sin(t * 18) > -.3; if (on) B.pon(-13.5, 25.9, -1.5, .5, 7.3, .5, P.red);
          for (let i = 0; i < 6; i++) { const ph = (t * 3 + i / 6) % 1; B.pon(-13.5 + Math.cos(i * 1.7) * ph * 5, 22.3 + ph * 3 - ph * ph * 6, -1.5 + Math.sin(i * 1.7) * ph * 5, .5, .5, .5, P.orange); } B.fin();
          const q = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-2, -8, q), 28, lerp(74, 66, q)], [-14, 23, -1.5], .02); },
        // la bola cae en la báscula: 3,0 gramos; una regla de 18 mm la mide
        bascula(lt, dur, t) { const f = clamp(lt / .9, 0, 1), y = lerp(26, 6.5, f * f) + (f >= 1 ? Math.abs(Math.sin((lt - .9) * 9)) * Math.exp(-(lt - .9) * 4) * 1.5 : 0); bola.position.set(18, y, -2); bola.rotation.set(0, t, 0);
          rotular(pan, [f >= 1 ? (lt > 1.4 ? '3,0 g' : (Math.random() * 3).toFixed(1)) : '0,0'], '#63c74d', '#181425', 18);
          B.ini(); const j = clamp((lt - 1.6) / .8, 0, 1); B.pon(lerp(8, 14.2, j), 6.6, 2.6, 1, 6, 1, P.cyan); B.pon(lerp(28, 21.8, j), 6.6, 2.6, 1, 6, 1, P.cyan); B.pon(18, 3.4, 2.6, 22, .6, 1, P.cyan); B.fin();
          mira(c, [22, 18, 52], [18, 8, -2], .06); },
        // siete bolas iguales bajan por la rampa a la vez y llegan a la meta empatadas
        iguales(lt, dur, t) { const f = clamp((lt - .3) / (dur * .75), 0, 1); r7(f * f * (f < 1 ? 1 : 1)); B.ini(); if (f >= 1) for (let i = 0; i < 7; i++) B.pon(36.5, 10 + Math.sin(t * 8 + i) * .4, 15.8 + i * 3.7, 1, 1.4, 1.4, P.lime); B.fin();
          bola.position.set(-13.5, 18.8, -1.5); mira(c, [88, 36, 27], [R7[3].position.x, R7[3].position.y, 27], .06); },
      } };
  },
  // —— Gordo 3: el bombo de cerca: gira, se para y deja caer una bola por el canal; luego, en la báscula grande ——
  bombo_giro: () => {
    const s = new THREE.Scene(); s.background = cielo([0x124e89, 0x262b44, 0x181425]); s.fog = new THREE.Fog(0x181425, 150, 300);
    luces(s, { cielo: 0xfff0d0, suelo: 0x3a4466, amb: 1.3, sol: 0xfff1c0, int: 2.3, dir: [30, 80, 60], sombra: 70 });
    const v = new Vox(); v.box(-70, -5, -40, 70, -4, 40, (x, y, z) => ((x >> 2) + (z >> 2)) & 1 ? P.navy : P.night);
    v.box(-30, -4, -12, 30, 0, 14, P.dslate); v.box(-31, -1, -13, 31, 0, 15, P.steel);   // plataforma de la báscula
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI; v.set(Math.round(Math.cos(a) * 6) + 31, Math.round(Math.sin(a) * 6) + 10, -2, P.white); }
    v.box(24, 3, -4, 38, 18, -3, P.ink); v.box(30, -4, -4, 32, 3, -3, P.steel);                                                 // esfera de la báscula
    v.box(-4, 0, 16, 4, 4, 22, P.amber); v.box(-3, 2, 17, 3, 4, 21, P.ink);               // copa donde cae la bola
    s.add(v.build({ jit: .05 }));
    const bo = actor('bombo'); s.add(bo); const giro = bo.getObjectByName('giro');
    const bola = actor('bola_boj', .2); s.add(bola);
    const B = new Bloques(620), N = new Bloques(60, true), P2 = new Bloques(40); s.add(B.im, N.im, P2.im);
    const aguja = (k) => { N.ini(); manecilla(N, 31, 10, -2.5, lerp(-Math.PI / 2, Math.PI / 2 * .95, k), 5.5, .8, P.red); N.fin(); };
    const canal = (op) => { P2.ini(); for (let i = 0; i < 10; i++) P2.pon(0, 6 - i * .5, 4 + i * 1.3, 3, .5, 1.4, P.silver); if (op) P2.pon(0, 5.6, 0, 2.2, .4, 2.2, P.ink); P2.fin(); };
    const c = cam(46);
    return { s, c, upd(t) { giro.rotation.x = t * .7; B.ini(); bolasBombo(B, 0, 20, 0, 14, 480, t, .4); B.fin(); aguja(0); canal(false); bola.visible = false; mira(c, [Math.sin(t * .1) * 10, 30, 96], [0, 18, 0], -.04); },
      acc: {
        // gira deprisa, frena, se abre la portezuela y una bola baja por el canal hasta la copa
        mezcla(lt, dur, t) { const T = dur * .55, k = clamp(lt / T, 0, 1), w = (1 - k) * 3.2 + .1; const u = Math.min(lt, T); giro.rotation.x = 3.2 * (u - u * u / (2 * T));
          B.ini(); bolasBombo(B, 0, 20, 0, 14, 480, t, w / 3.2); B.fin(); aguja(0); canal(k >= 1);
          const f = clamp((lt - dur * .58) / (dur * .35), 0, 1); bola.visible = f > 0; bola.position.set(0, f < .3 ? lerp(7, 6, f / .3) : 6 - (f - .3) / .7 * 3, f < .3 ? 0 : lerp(4, 18.5, (f - .3) / .7)); bola.rotation.set(f * 8, 0, 0);
          const q = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(10, 16, q), lerp(30, 22, q), lerp(92, 66, q)], [0, lerp(18, 10, q), lerp(0, 10, q)], -.05); },
        // la cámara se aleja: el bombo está sobre una báscula y la aguja sube hasta 850 kilos; dos personas al lado para comparar
        peso(lt, dur, t) { giro.rotation.x = t * .3; B.ini(); bolasBombo(B, 0, 20, 0, 14, 480, t, .2); persona(B, -14, 0, 24, P.navy, { s: 2.3, pelo: P.ink }); persona(B, -7, 0, 25, P.crimson, { s: 2.2, pelo: P.amber }); B.fin();
          aguja(ss(clamp((lt - .4) / (dur * .6), 0, 1))); canal(false); bola.visible = false; mira(c, [9, 30, 136], [9, 18, 0], .06); },
      } };
  },
});
// reloj de pared dibujado en una pantalla (h en horas decimales)
function relojP(P2, h, fondo = '#ffffff') { const k = (h * 60 | 0) + fondo; if (P2._k === k) return; P2._k = k; const { g, cv, tex } = P2, W2 = cv.width, r = W2 / 2 - 3;
  g.fillStyle = '#262b44'; g.fillRect(0, 0, W2, W2); g.fillStyle = fondo; g.beginPath(); g.arc(W2 / 2, W2 / 2, r, 0, 7); g.fill(); g.fillStyle = '#181425';
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; g.fillRect(W2 / 2 + Math.sin(a) * (r - 5) - 2, W2 / 2 - Math.cos(a) * (r - 5) - 2, 4, 4); }
  const mano = (a, L, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(W2 / 2, W2 / 2); g.lineTo(W2 / 2 + Math.sin(a) * L, W2 / 2 - Math.cos(a) * L); g.stroke(); };
  mano((h % 12) / 12 * 6.283, r * .5, 5, '#181425'); mano((h % 1) * 6.283, r * .8, 3, '#e43b44'); tex.needsUpdate = true; }
const ROPA = [P.blue, P.orange, P.green, P.rose, P.navy, P.crimson, P.plum, P.teal, P.amber, P.lime, P.brown, P.slate];
const PELO = [P.ink, P.dbrown, P.amber, P.steel, P.umber];
Object.assign(FAB, {
  urna_cristal: () => {   // urna de cristal con aristas blancas y tapa azul con ranura
    const v = new Vox(); v.box(-5, 0, -4, 6, 10, 5, (x, y, z) => (x === -5 || x === 5) && (z === -4 || z === 4) || y === 0 ? P.white : (y + x + z) % 5 === 0 ? 0xd8f4ff : 0x9fd8f0);
    v.box(-5, 10, -4, 6, 12, 5, P.navy); v.box(-3, 11, 0, 4, 12, 1, P.ink); v.box(-2, 4, 5, 3, 7, 6, P.white);
    const g = new THREE.Group(); g.add(v.build({ jit: .03, centrar: true })); return g; },
  carta: () => {   // sobre de notificación: blanco, solapa y sello rojo
    const v = new Vox(); v.box(-9, -6, 0, 10, 7, 1, P.white); for (let x = -9; x < 10; x++) { const y = 6 - Math.abs(x) * .6 | 0; v.set(x, y, 1, P.silver); }
    v.box(-1, 1, 1, 2, 4, 2, P.red); v.box(-7, -4, 1, 1, -3, 2, P.steel); v.box(-7, -2, 1, 4, -1, 2, P.steel); v.luz(P.red);
    const g = new THREE.Group(); g.add(v.build({ jit: .02, centrar: true })); return g; },
  birrete: () => {   // birrete de graduación: placa negra, gorro y borla dorada
    const v = new Vox(); v.cyl(0, 0, 0, 3, 4, P.ink); v.box(-7, 3, -7, 8, 4, 8, P.ink); v.set(0, 4, 0, P.amber); for (let i = 0; i < 6; i++) v.set(i, 4, i, P.amber); v.box(6, -1, 6, 7, 4, 7, P.amber);
    const g = new THREE.Group(); g.add(v.build({ jit: .03, centrar: true })); return g; },
});
Object.assign(FABE, {
  // —— Mesa 1: el salón de plenos: el censo de vecinos, la pantalla del sorteo y la mesa con la urna delante ——
  ayto_sorteo: () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(0x3e2731); s.fog = new THREE.Fog(0x3e2731, 160, 300);
    luces(s, { cielo: 0xfff4e0, suelo: 0x5a4040, amb: 1.4, sol: 0xfff1d6, int: 2.1, dir: [-30, 80, 60], sombra: 80 });
    const v = new Vox(); v.box(-70, -1, -60, 70, 0, 50, (x, y, z) => ((x + 200) % 6 < 3) !== ((z + 200) % 12 < 6) ? P.brown : P.tan);
    v.box(-70, 0, -62, 70, 64, -56, (x, y) => y < 14 ? P.dbrown : (y % 16 === 0 ? P.tan : P.sand));
    v.box(-28, 26, -56, 28, 56, -55, P.ink); v.box(-30, 56, -56, 30, 58, -54, P.amber);   // marco de la pantalla
    v.box(-20, 0, -4, 20, 7, 4, P.navy); v.box(-21, 7, -5, 21, 8, 5, P.silver);           // mesa electoral
    s.add(v.build({ jit: .05 }));
    const pan = pantalla(54, 28, 216, 112); pan.m.position.set(0, 41, -54.5); s.add(pan.m);
    const ur = actor('urna_cristal', .7); ur.position.set(14, 12.2, 0); s.add(ur);
    const ca = actor('carta', 1); ca.visible = false; s.add(ca);
    const B = new Bloques(400), L = new Bloques(40, true); s.add(B.im, L.im);
    const sitio = i => [(i % 7 - 3) * 7, -50 + (i / 7 | 0) * 6], ELEG = [17, 9, 25], SILLA = [[0, -10], [-10, -10], [10, -10]];
    const ROL = ['PRESIDENTE', 'VOCAL 1', 'VOCAL 2'];
    const dib = (t, k) => { const st = k.map(q => q >= 1 ? 1 : 0).join(''), fr = Math.floor(t * 12); const key = st + (k.some(q => q > 0 && q < 1) ? fr : ''); if (pan._k === key) return; pan._k = key;
      const { g, cv, tex } = pan; g.fillStyle = '#0b1830'; g.fillRect(0, 0, cv.width, cv.height); g.font = 'bold 14px monospace'; g.textAlign = 'center'; g.fillStyle = '#feae34'; g.fillText('SORTEO PÚBLICO · MESA 1', 108, 16);
      for (let r = 0; r < 3; r++) { const q = k[r], y = 40 + r * 26; g.fillStyle = q >= 1 ? '#fee761' : '#262b44'; g.fillRect(12, y - 12, 192, 22); g.fillStyle = q >= 1 ? '#181425' : '#c0cbdc';
        const n = q >= 1 ? 1000 + ELEG[r] * 37 : (q > 0 ? 1000 + Math.floor(hsh(fr, r, 3) * 8999) : 0); g.font = 'bold 13px monospace'; g.fillText(ROL[r] + ': ' + (n ? 'VECINO ' + n : '· · ·'), 108, y + 4); } tex.needsUpdate = true; };
    const gente = (t, ida, marca) => { B.ini(); L.ini(); for (let i = 0; i < 35; i++) { let [x, z] = sitio(i); let ag = 0; const e = ELEG.indexOf(i);
        if (e >= 0 && ida[e] > 0) { const q = ss(ida[e]); x = lerp(x, SILLA[e][0], q); z = lerp(z, SILLA[e][1], q); ag = 0; }
        persona(B, x, Math.max(0, Math.sin(t * 9 + i) * (e >= 0 && ida[e] > 0 && ida[e] < 1 ? .6 : 0)), z, ROPA[i % 12], { s: 1.6, ag, pelo: PELO[i % 5] });
        if (e >= 0 && marca[e] > 0) { L.pon(x, 14 + Math.sin(t * 4) * .5, z, 1.4, 1.4, 1.4, P.yellow); if (marca[e] < 1) L.pon(x, 30, z, .8, 30, .8, P.yellow); } }
      B.fin(); L.fin(); };
    const c = cam(46);
    return { s, c, upd(t) { ca.visible = false; dib(t, [1, 1, 1]); gente(t, [0, 0, 0], [0, 0, 0]); mira(c, [Math.sin(t * .1) * 8, 60, 104], [0, 8, -14], .02); },
      acc: {
        // tres vecinos salen del grupo y se sientan en la mesa de la urna
        mesa(lt, dur, t) { const k = [0, 1, 2].map(i => clamp((lt - .2 - i * .35) / 1.6, 0, 1)); dib(t, [0, 0, 0]); gente(t, k, k.map(q => q > 0 ? 1 : 0)); mira(c, [Math.sin(t * .2) * 6, 64, 96], [0, 0, -14], .0); },
        // la pantalla baraja números y se para en tres: un rayo amarillo señala a cada elegido
        sorteo(lt, dur, t) { const k = [0, 1, 2].map(i => clamp((lt - .3 - i * dur * .25) / (dur * .22), 0, 1)); dib(t, k); gente(t, [0, 0, 0], k.map(q => q >= 1 ? (lt < dur * .9 ? .5 : 1) : 0));
          const q = ss(clamp(lt / dur, 0, 1)); mira(c, [0, lerp(56, 48, q), lerp(104, 96, q)], [0, 22, -30], .02); },
        // llega la carta de la Junta Electoral: vuela desde la pantalla hasta la cámara y se para delante
        carta(lt, dur, t) { dib(t, [1, 1, 1]); gente(t, [0, 0, 0], [1, 1, 1]); const f = ss(clamp(lt / (dur * .6), 0, 1)); ca.visible = true; ca.position.set(lerp(0, 0, f), lerp(40, 34, f), lerp(-50, 52, f)); ca.rotation.set(Math.sin(t * 3) * .15, (1 - f) * 6.283 * 1.5, Math.sin(t * 2) * .08); ca.scale.setScalar(lerp(.6, 1, f));
          mira(c, [0, 52, 104], [0, 20, -10], .02); },
      } };
  },
  // —— Mesa 2: el gimnasio del colegio electoral: ventanas que cambian con la hora, reloj, urna, cabina y cola ——
  aula_voto: () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(0x262b44); s.fog = new THREE.Fog(0x262b44, 160, 300);
    const amb = new THREE.HemisphereLight(0xf0f4ff, 0x5a4a40, 1.3); s.add(amb); const sol = luces(s, { cielo: 0xf0f4ff, suelo: 0x5a4a40, amb: 0, sol: 0xffffff, int: 2, dir: [-30, 80, 60], sombra: 80 });
    const v = new Vox(); v.box(-70, -1, -50, 70, 0, 50, (x, y, z) => (x + 200) % 10 === 0 ? P.dbrown : P.tan);
    v.box(-70, 0, -52, 70, 52, -48, (x, y) => y < 12 ? P.steel : P.silver); for (const sx of [-72, 68]) v.box(sx, 0, -48, sx + 4, 52, 40, P.silver);
    for (let x = -60; x < 60; x += 20) v.box(x, 22, -48.5, x + 14, 36, -47.5, P.white);              // marcos de ventanas
    v.box(30, 0, -48.5, 42, 20, -47.5, P.dbrown);                                                     // puerta
    v.box(-16, 0, -4, 16, 7, 4, P.white); v.box(-17, 7, -5, 17, 8, 5, P.navy);                         // mesa
    for (const x of [-8, 0, 8]) v.box(x - 2, 0, -12, x + 2, 4, -8, P.dbrown);
    v.box(-44, 0, -20, -30, 22, -6, P.slate); v.box(-43, 2, -6, -31, 20, -5, P.crimson);               // cabina con cortina
    s.add(v.build({ jit: .05 }));
    const VEN = new Bloques(12, true); s.add(VEN.im);
    const rel = pantalla(10, 10, 64, 64); rel.m.position.set(-2, 42, -47.4); s.add(rel.m);
    const mul = pantalla(22, 9, 132, 54); mul.m.position.set(0, 30, 6); s.add(mul.m); rotular(mul, ['¡MULTA!'], '#ffffff', '#e43b44', 30, { borde: '#181425' });
    const ur = actor('urna_cristal', 1); ur.position.set(0, 14, 0); s.add(ur);
    const B = new Bloques(260), L = new Bloques(30, true); s.add(B.im, L.im);
    const cielo2 = (h) => h < 8.5 ? colLerp(0x124e89, 0xf77622, (h - 7.5)) : h < 18 ? colLerp(0xf77622, 0x7fd0ff, (h - 8.5) * 2) : colLerp(0x7fd0ff, 0x181425, (h - 18) / 2.5);
    const ventanas2 = (h) => { VEN.ini(); const col = cielo2(h); for (let x = -60; x < 60; x += 20) VEN.pon(x + 7, 29, -47.2, 12, 12, .5, col); VEN.fin(); };
    const mesa = (t, sent, sup, k) => { // 3 sentados, 6 suplentes de pie que se van con k
      for (let i = 0; i < 3; i++) persona(B, [-8, 0, 8][i], 0, -10, ROPA[i + 3], { s: 1.7, ag: sent ? .4 : 0, pelo: PELO[i] });
      if (sup) for (let i = 0; i < 6; i++) { const q = ss(clamp(k * 1.4 - i * .07, 0, 1)); persona(B, lerp(-15 + i * 6, 36, q), Math.abs(Math.sin(t * 9 + i)) * (q > 0 && q < 1 ? .6 : 0), lerp(-20, -44, q), ROPA[(i + 7) % 12], { s: 1.7, pelo: PELO[(i + 2) % 5] }); } };
    const c = cam(46);
    const vista = (t) => mira(c, [Math.sin(t * .1) * 6, 60, 92], [0, 8, -14], .02);
    return { s, c, upd(t) { ur.position.x = 0; ventanas2(12); relojP(rel, 12); mul.m.visible = false; amb.intensity = 1.3; sol.intensity = 2; B.ini(); mesa(t, true, false, 0); B.fin(); L.ini(); L.fin(); vista(t); },
      acc: {
        // amanece: el reloj marca las 8, entran los nueve (titulares y suplentes), se sientan tres y los suplentes se van
        madrugar(lt, dur, t) { const k = clamp(lt / dur, 0, 1); const h = lerp(7.6, 8.1, k); ventanas2(h); relojP(rel, 8 + k * .05); amb.intensity = lerp(.7, 1.3, k);
          B.ini(); const ent = ss(clamp(k * 2.2, 0, 1)); for (let i = 0; i < 3; i++) persona(B, lerp(36, [-8, 0, 8][i], ent), 0, lerp(-44, -10, ent), ROPA[i + 3], { s: 1.7, ag: ent >= 1 ? .4 : 0, pelo: PELO[i] });
          for (let i = 0; i < 6; i++) { const e2 = ss(clamp(k * 2.2 - .1 - i * .05, 0, 1)), q = ss(clamp((k - .62) * 3 - i * .05, 0, 1)); persona(B, q > 0 ? lerp(-15 + i * 6, 36, q) : lerp(36, -15 + i * 6, e2), 0, q > 0 ? lerp(-20, -44, q) : lerp(-44, -20, e2), ROPA[(i + 7) % 12], { s: 1.7, pelo: PELO[(i + 2) % 5] }); }
          B.fin(); L.ini(); L.fin(); mul.m.visible = false; vista(t); },
        // de 9 a 20 h en unos segundos: la cola vota, los sobres caen en la urna, anochece y se vuelcan los votos en la mesa
        recuento(lt, dur, t) { const k = clamp(lt / dur, 0, 1), h = lerp(9, 20.3, Math.min(1, k / .75)); ventanas2(h); relojP(rel, h); mul.m.visible = false; amb.intensity = h > 19 ? lerp(1.3, .9, (h - 19)) : 1.3;
          B.ini(); mesa(t, true, false, 0); const vol = k < .75; if (vol) for (let i = 0; i < 6; i++) { const f = ((lt * .55 + i / 6) % 1); const x = f < .5 ? lerp(36, 4, f * 2) : lerp(4, 36, (f - .5) * 2), z = f < .5 ? lerp(-44, 12, f * 2) : lerp(12, -44, (f - .5) * 2);
              persona(B, x, Math.abs(Math.sin(t * 9 + i)) * .5, z, ROPA[(i * 5) % 12], { s: 1.7, pelo: PELO[i % 5] }); if (f > .45 && f < .5) B.pon(1, lerp(20, 13, (f - .45) * 20), 4, 2, .3, 1.2, P.white); }
          const n = Math.round(Math.min(1, k / .75) * 30); for (let i = 0; i < n && vol; i++) B.pon(-3 + (i % 6) * 1.2, 8.6 + (i / 6 | 0) * .4, -2 + hsh(i, 1, 1) * 4, 1.6, .3, 1.1, P.white);
          if (!vol) { const q = ss((k - .75) / .25); for (let i = 0; i < 30; i++) { const pile = i % 3; B.pon(lerp(0, -10 + pile * 10, q) + hsh(i, 2, 2), 8.4 + (i / 3 | 0) * .35 * q, lerp(0, 2.5, q), 2.2, .3, 1.5, i % 3 === 1 ? P.yellow : P.white); } }
          B.fin(); L.ini(); L.fin(); mira(c, [Math.sin(t * .2) * 8, 56, 84], [0, 8, -10], .02); },
        // se apagan las luces: la silla de la presidencia está vacía bajo un foco y baja el cartel de la multa
        obligatorio(lt, dur, t) { ventanas2(20.5); relojP(rel, 8); amb.intensity = .45; sol.intensity = .3; B.ini(); persona(B, -8, 0, -10, ROPA[4], { s: 1.7, ag: .4, pelo: PELO[1] }); persona(B, 8, 0, -10, ROPA[5], { s: 1.7, ag: .4, pelo: PELO[2] }); B.fin();
          L.ini(); L.pon(0, 12.5, -10.5, 4.4, 4.4, .6, Math.floor(t * 4) % 2 ? P.red : P.crimson); L.pon(0, 12.5, -10.2, 3, 3, .6, P.ink); L.fin();
          const f = ss(clamp((lt - .5) / 1.2, 0, 1)); ur.position.x = 12; mul.m.visible = f > 0; mul.m.position.set(0, lerp(56, 30, f), -2); mira(c, [0, 58, 88], [0, 10, -10], .02); },
      } };
  },
  // —— Mesa 3: la oficina del lunes: monedas de la dieta, el reloj que se adelanta cinco horas y el birrete ——
  lunes_libre: () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(0x3a4466); s.fog = new THREE.Fog(0x3a4466, 160, 300);
    luces(s, { cielo: 0xfff8e8, suelo: 0x5a6988, amb: 1.4, sol: 0xfff1d6, int: 2.2, dir: [40, 80, 60], sombra: 80 });
    const v = new Vox(); v.box(-70, -1, -50, 70, 0, 50, (x, y, z) => ((x >> 3) + (z >> 3)) & 1 ? P.steel : P.silver);
    v.box(-70, 0, -52, 70, 56, -48, (x, y) => y < 10 ? P.dslate : P.sand); v.box(-50, 18, -48.5, -14, 40, -47.5, P.white); v.box(-48, 20, -48.2, -16, 38, -47.8, 0x7fd0ff);
    v.box(26, 0, -48.5, 38, 22, -47.5, P.dbrown); v.box(-8, 0, -24, 22, 9, -16, P.brown); v.box(2, 9, -22, 10, 15, -21, P.ink); v.box(3, 10, -21.2, 9, 14, -20.8, P.cyan);   // mesa y ordenador
    v.box(-30, 0, 10, 30, 3, 20, P.dslate);                                                                                          // peana
    v.box(-41, 30, -47.6, -23, 31, -47, P.amber); v.luz(P.cyan);
    s.add(v.build({ jit: .05 }));
    const rel = pantalla(14, 14, 64, 64); rel.m.position.set(10, 38, -47.4); s.add(rel.m);
    const cal = pantalla(14, 9, 84, 54); cal.m.position.set(-14, 26, -47.4); cal.m.visible = false; s.add(cal.m); rotular(cal, ['LUNES', '30'], ['#e43b44', '#181425'], '#ffffff', 18);
    const dip = pantalla(14, 5.6, 160, 64); dip.m.position.set(13, 22, 14); s.add(dip.m); rotular(dip, ['BACHILLERATO'], '#3e2731', '#ead4aa', 20, { borde: '#a22633' });
    const bi = actor('birrete', .55); s.add(bi);
    const B = new Bloques(200), L = new Bloques(60, true); s.add(B.im, L.im);
    const monedas = (n) => { for (let i = 0; i < n; i++) { const st = i / 10 | 0, h = i % 10; B.pon(-21 + st * 7, 3.4 + h * .9, 15, 4.6, .7, 4.6, h % 2 ? P.amber : P.yellow); } };
    const c = cam(46);
    return { s, c, upd(t) { relojP(rel, 9); dip.m.visible = false; bi.visible = false; B.ini(); persona(B, 6, 0, -14, P.navy, { s: 1.8, ag: .4, pelo: P.ink }); B.fin(); L.ini(); L.fin(); mira(c, [Math.sin(t * .1) * 6, 36, 96], [0, 14, -8], .02); },
      acc: {
        // caen las monedas hasta 7 pilas (setenta euros); luego el reloj corre cinco horas y la persona se va a casa
        lunes(lt, dur, t) { const k = clamp(lt / (dur * .45), 0, 1), j = ss(clamp((lt - dur * .5) / (dur * .4), 0, 1)); relojP(rel, 9 + j * 5); dip.m.visible = false; bi.visible = false;
          B.ini(); monedas(Math.round(k * 70)); if (k < 1) { const f = (lt * 4) % 1; B.pon(-21 + ((Math.round(k * 70)) / 10 | 0) * 7, lerp(30, 4, f), 15, 4.6, .7, 4.6, P.yellow); }
          const w = clamp((j - .55) / .45, 0, 1); persona(B, lerp(6, 32, w), w > 0 && w < 1 ? Math.abs(Math.sin(t * 9)) * .6 : 0, lerp(-14, -44, w), P.navy, { s: 1.8, ag: w > 0 ? 0 : .4, pelo: P.ink }); B.fin();
          L.ini(); if (j > 0 && j < 1) for (let i = 0; i < 6; i++) L.pon(10 + Math.sin(i + t * 9) * 8, 38 + Math.cos(i + t * 9) * 8, -47, .8, .8, .8, P.yellow); L.fin(); mira(c, [Math.sin(t * .2) * 6, 40, 96], [0, 8, -4], .04); },
        // el presidente de la mesa sube a la peana, le cae un birrete y aparece el título de bachillerato
        titulo(lt, dur, t) { relojP(rel, 14); B.ini(); persona(B, 0, 3, 15, P.navy, { s: 2.6, pelo: P.ink }); B.fin(); const f = ss(clamp(lt / 1.4, 0, 1)); bi.visible = true; bi.position.set(0, lerp(50, 23.2, f), 15); bi.rotation.set(.15, t * (1 - f) * 4, .1);
          dip.m.visible = lt > 1.3; dip.m.scale.setScalar(ss(clamp((lt - 1.3) / .4, 0, 1)) + .001); L.ini(); if (f >= 1) for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283 + t; L.pon(Math.cos(a) * 9, 18 + Math.sin(a * 2) * 3, 15 + Math.sin(a) * 9, .7, .7, .7, i % 2 ? P.yellow : P.white); } L.fin();
          mira(c, [0, 30, 78], [4, 16, 10], .04); },
      } };
  },
});
Object.assign(FAB, {
  guitarra: () => {   // guitarra eléctrica genérica: cuerpo rojo de doble corte, golpeador blanco, mástil y clavijero
    const v = new Vox();
    for (let x = -9; x <= 9; x++) for (let y = -11; y <= 8; y++) { const a = (x / 9) ** 2 + ((y + 3) / 9) ** 2, b = ((x - 3) / 5) ** 2 + ((y - 5) / 4) ** 2, cut = (x < -2 && y > 3 && ((x + 6) / 4) ** 2 + ((y - 7) / 4) ** 2 < 1);
      if ((a < 1 || (b < 1 && x > 0)) && !cut) for (let z = -1; z <= 1; z++) v.set(x, y, z, z === 1 && x > -6 && x < 5 && y < 2 && y > -9 ? P.white : P.red); }
    v.box(-3, -5, 2, 4, -3, 3, P.ink); v.box(-3, 1, 2, 4, 3, 3, P.ink); v.box(-2, -9, 2, 3, -8, 3, P.silver); v.set(6, -7, 2, P.silver); v.set(6, -9, 2, P.silver);
    v.box(-1, 8, -1, 2, 30, 1, P.dbrown); for (let y = 10; y < 30; y += 3) v.box(-1, y, 1, 2, y + 1, 2, P.silver);
    v.box(-2, 30, -1, 3, 37, 1, P.ink); for (let y = 31; y < 37; y += 2) { v.set(-3, y, 0, P.silver); v.set(3, y, 0, P.silver); }
    const g = new THREE.Group(); g.add(v.build({ jit: .03, centrar: true })); return g; },
  maquina_escribir: () => {   // máquina de escribir verde con teclas, rodillo y una hoja
    const v = new Vox(); v.box(-9, 0, -6, 10, 4, 7, P.dgreen); v.box(-8, 4, -6, 9, 7, 0, P.dgreen);
    for (let r = 0; r < 3; r++) for (let x = -7; x <= 7; x += 2) v.set(x + (r & 1), 4 + r * .5 | 0, 5 - r * 2, P.white);
    v.box(-11, 7, -5, 12, 9, -2, P.ink); v.box(-6, 9, -4, 7, 17, -3, P.white); v.box(12, 7, -4, 14, 8, -3, P.silver);
    const g = new THREE.Group(); g.add(v.build({ jit: .03, centrar: true })); return g; },
  micro_pod: () => {   // micrófono de pódcast en su brazo, con rejilla y luz roja
    const v = new Vox(); v.box(-4, 0, -4, 5, 1, 5, P.ink); v.box(0, 1, 0, 1, 10, 1, P.steel); for (let i = 0; i < 8; i++) v.set(i, 10 + i, 0, P.steel);
    v.cyl(8, 0, 16, 26, 2.6, (x, y) => y % 2 ? P.silver : P.slate); v.box(7, 26, -1, 10, 27, 2, P.red); v.luz(P.red);
    const g = new THREE.Group(); g.add(v.build({ jit: .03, centrar: true })); return g; },
  elfo_malo: () => {   // elfo malvado genérico: abrigo morado, orejas puntiagudas, gorro largo negro y ojos rojos
    const v = new Vox(); v.box(-2, 0, -1, 0, 3, 1, P.ink); v.box(1, 0, -1, 3, 3, 1, P.ink); v.box(-3, 3, -2, 4, 10, 3, P.plum); v.box(-3, 5, -2, 4, 6, 3, P.ink); v.set(0, 5, 3, P.amber);
    v.box(-4, 5, -1, -3, 9, 1, P.plum); v.box(4, 5, -1, 5, 9, 1, P.plum); v.box(-2, 10, -2, 3, 15, 3, P.skin); v.set(-3, 13, 0, P.skin); v.set(-4, 14, 0, P.skin); v.set(3, 13, 0, P.skin); v.set(4, 14, 0, P.skin);
    v.set(-1, 13, 3, P.red); v.set(1, 13, 3, P.red); v.box(-1, 11, 3, 2, 12, 4, P.umber); v.luz(P.red);
    for (let y = 15; y < 23; y++) { const r = (23 - y) * .35; v.box(Math.round(-r - .5), y, Math.round(-r - .5), Math.round(r + 1.5), y + 1, Math.round(r + 1.5), y === 15 ? P.dslate : P.ink); } v.set(2, 23, 0, P.ink); v.set(3, 23, 0, P.red);
    const g = new THREE.Group(); g.add(v.build({ jit: .04, centrar: true })); return g; },
  trineo: () => {   // trineo de madera con patines dorados
    const v = new Vox(); v.box(-10, 3, -5, 11, 5, 6, P.brown); v.box(-10, 5, -5, -8, 12, 6, P.dbrown); v.box(-10, 5, -5, 11, 8, -4, P.dbrown); v.box(-10, 5, 5, 11, 8, 6, P.dbrown);
    for (const z of [-4, 4]) { v.box(-11, 0, z, 13, 1, z + 1, P.amber); v.set(13, 1, z, P.amber); v.set(14, 2, z, P.amber); v.set(-6, 1, z, P.amber); v.set(-6, 2, z, P.amber); v.set(6, 1, z, P.amber); v.set(6, 2, z, P.amber); }
    const g = new THREE.Group(); g.add(v.build({ jit: .04, centrar: true })); return g; },
});
// tele con una escena navideña genérica (calle nevada, árbol con luces, casa con ventanas encendidas)
function teleNav(P2, t, i) { const { g, cv, tex } = P2, W2 = cv.width, H2 = cv.height; g.fillStyle = '#124e89'; g.fillRect(0, 0, W2, H2); g.fillStyle = '#ffffff'; g.fillRect(0, H2 * .75, W2, H2 * .25);
  g.fillStyle = '#733e39'; g.fillRect(W2 * .55, H2 * .4, W2 * .35, H2 * .36); g.fillStyle = '#a22633'; g.beginPath(); g.moveTo(W2 * .5, H2 * .42); g.lineTo(W2 * .725, H2 * .2); g.lineTo(W2 * .95, H2 * .42); g.fill();
  g.fillStyle = '#feae34'; g.fillRect(W2 * .62, H2 * .5, 6, 6); g.fillRect(W2 * .78, H2 * .5, 6, 6);
  g.fillStyle = '#265c42'; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(W2 * .25, H2 * (.18 + k * .16)); g.lineTo(W2 * (.1 - k * .03), H2 * (.42 + k * .16)); g.lineTo(W2 * (.4 + k * .03), H2 * (.42 + k * .16)); g.fill(); }
  g.fillStyle = '#fee761'; g.fillRect(W2 * .25 - 3, H2 * .14, 6, 6); for (let k = 0; k < 6; k++) { g.fillStyle = (Math.floor(t * 3) + k + i) % 2 ? '#e43b44' : '#2ce8f5'; g.fillRect(W2 * (.17 + (k % 3) * .08), H2 * (.32 + (k / 3 | 0) * .18), 3, 3); }
  g.fillStyle = '#ffffff'; for (let k = 0; k < 14; k++) g.fillRect((hsh(k, i, 1) * W2 + t * 3) % W2, (hsh(k, i, 2) * H2 + t * 14 * (1 + hsh(k, 1, i))) % H2, 2, 2); tex.needsUpdate = true; }
const conoLuz = (col, h, r) => { const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 16, 1, true), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .22, depthWrite: false, side: THREE.DoubleSide })); m.geometry.translate(0, -h / 2, 0); return m; };
Object.assign(FABE, {
  // —— Elf 1: escenario de concierto navideño: guitarra gigante, máquina de escribir que suelta hojas, focos y nieve ——
  escenario_rock: () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(0x0b0b16); s.fog = new THREE.Fog(0x0b0b16, 150, 280);
    const amb = new THREE.HemisphereLight(0xb0b8ff, 0x262b44, 1.1); s.add(amb); luces(s, { amb: 0, sol: 0xd8e0ff, int: 1.6, dir: [20, 80, 60], sombra: 80 });
    const v = new Vox(); v.box(-70, -1, -50, 70, 0, 40, (x, y, z) => z > 20 ? P.night : ((z & 3) ? P.ink : P.umber));
    v.box(-70, 0, -52, 70, 70, -48, P.ink); v.box(-60, 62, -40, 60, 64, -38, P.steel); for (const sx of [-60, 58]) v.box(sx, 0, -40, sx + 2, 64, -38, P.steel);
    for (const sx of [-44, 32]) { v.box(sx, 0, -30, sx + 12, 24, -20, P.ink); for (let y = 2; y < 24; y += 3) v.box(sx + 1, y, -20, sx + 11, y + 2, -19, P.dslate); }   // amplificadores
    for (let y = 0; y < 26; y++) { const r = (26 - y) * .33; v.cyl(50, -6, y, y + 1, r, (x, yy, z) => hsh(x, yy, z) > .9 ? P.red : hsh(x, yy, z) > .82 ? P.yellow : P.dgreen); } v.box(50, 26, -6, 51, 28, -5, P.yellow);
    v.box(-16, 0, 10, -8, 7, 18, P.steel); v.luz(P.red, P.yellow); s.add(v.build({ jit: .05 }));
    const LED = new Bloques(9 * 14, true); s.add(LED.im);
    const gu = actor('guitarra', .75); s.add(gu); const mq = actor('maquina_escribir', .7); mq.position.set(-12, 12, 14); s.add(mq);
    const TV = []; for (let i = 0; i < 9; i++) { const p = pantalla(26, 17, 104, 68); p.m.position.set(((i % 3) - 1) * 30, 50 - (i / 3 | 0) * 20, -47.4); s.add(p.m); TV.push(p); }
    const conos = [-40, -14, 14, 40].map((x, i) => { const cc = conoLuz([P.cyan, P.amber, P.rose, P.lime][i], 62, 12); cc.position.set(x, 62, -36); s.add(cc); return cc; });
    const B = new Bloques(260), N = new Bloques(260, true); s.add(B.im, N.im);
    const led = (t, on) => { LED.ini(); if (on) for (let i = 0; i < 9; i++) for (let j = 0; j < 14; j++) LED.pon(-52 + j * 8, 34 + i * 3.4, -47.6, 7, 3, .4, ((i + j + Math.floor(t * 4)) % 5 === 0) ? P.red : ((i * j + Math.floor(t * 3)) % 7 === 0 ? P.yellow : 0x1a2040)); LED.fin(); };
    const hojas = (t, n, alto) => { for (let i = 0; i < n; i++) { const f = ((t * .45 + i / n) % 1), a = i * 2.4 + f * 5; B.pon(-12 + Math.cos(a) * f * 18, 18 + f * alto, 14 + Math.sin(a) * f * 10 - f * 20, 3, .2, 4, P.white, a); } };
    const nieve = (t) => { N.ini(); llueve(N, -40, 40, -40, 30, 0, 70, t, 110, P.white, 9, { copo: true }); N.fin(); };
    const c = cam(46);
    const base = (t, foc) => { mq.visible = true; TV.forEach(p => p.m.visible = false); led(t, true); conos.forEach((cc, i) => { cc.visible = foc; cc.rotation.set(Math.sin(t * 1.3 + i) * .5, 0, Math.sin(t * 1.1 + i * 2) * .45); }); gu.position.set(4, 26, -6); gu.visible = true; gu.rotation.set(0, Math.sin(t * .6) * .4, -.5); };
    return { s, c, upd(t) { base(t, true); amb.intensity = 1.1; B.ini(); hojas(t, 8, 30); B.fin(); nieve(t); mira(c, [Math.sin(t * .1) * 8, 30, 96], [0, 22, -6], .02); },
      acc: {
        // la guitarra vibra con el riff, los focos barren y la máquina de escribir escupe las hojas del guion
        riff(lt, dur, t) { base(t, true); gu.rotation.set(Math.sin(t * 13) * .05, Math.sin(t * .8) * .5, -.5 + Math.sin(t * 9) * .08); gu.position.y = 26 + Math.abs(Math.sin(t * 4.5)) * 1.5;
          B.ini(); hojas(t, 18, 40); B.fin(); nieve(t); const q = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-10, 8, q), 32, lerp(104, 92, q)], [0, 24, -4], .02); },
        // la pared de LED se convierte en nueve teles que se encienden una a una con una película navideña
        teles(lt, dur, t) { base(t, false); led(t, false); TV.forEach((p, i) => { p.m.visible = lt > .25 + i * .22; if (p.m.visible) teleNav(p, t, i); }); gu.visible = false;
          B.ini(); B.fin(); nieve(t); mira(c, [0, 38, 92], [0, 32, -40], .04); },
        // todo se apaga menos un foco sobre el guion, que pasa sus hojas solo
        pregunta(lt, dur, t) { base(t, false); led(t, false); amb.intensity = .5; conos[1].visible = true; conos[1].position.set(-12, 62, 14); conos[1].rotation.set(0, 0, 0);
          B.ini(); for (let i = 0; i < 12; i++) B.pon(-12, 12.5 + i * .3, 14, 8, .25, 10, i === 11 ? P.red : P.white); for (let i = 0; i < 2; i++) { const f = ((t * .8 + i * .5) % 1); B.pon(-12 - Math.cos(f * Math.PI) * 4, 16.5 + Math.sin(f * Math.PI) * 4, 14, 8 * Math.abs(Math.cos(f * Math.PI)) + .3, .25, 10, P.white); } B.fin();
          mq.visible = false; gu.visible = false; nieve(t); const q = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(0, -6, q), lerp(38, 34, q), lerp(92, 74, q)], [-12, 14, 14], .04); },
      } };
  },
});
Object.assign(FABE, {
  // —— Elf 2: el despacho de la productora de noche: micro del pódcast, lámpara, guion, monedas y calendario ——
  productora: () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(0x181425); s.fog = new THREE.Fog(0x181425, 150, 280);
    const amb = new THREE.HemisphereLight(0xc8c0ff, 0x3e2731, 1.1); s.add(amb); const sol = luces(s, { amb: 0, sol: 0xd8d0ff, int: 1.3, dir: [-30, 80, 60], sombra: 70 });
    const lamp = new THREE.PointLight(0xffc870, 900, 0, 1.6); lamp.position.set(-6, 22, -6); s.add(lamp);
    const v = new Vox(); v.box(-70, -1, -50, 70, 0, 40, (x, y, z) => hsh(x >> 1, 0, z >> 1) > .5 ? P.plum : 0x5a2f5e);
    v.box(-70, 0, -52, 70, 60, -48, (x, y) => y < 8 ? P.umber : P.dbrown); v.box(-12, 18, -48.5, 30, 46, -47.5, P.ink);
    for (let i = 0; i < 40; i++) { const x = -10 + Math.floor(hsh(i, 2, 2) * 38), h = 2 + Math.floor(hsh(i, 3, 3) * 18); v.box(x, 19, -48.6, x + 3, 19 + h, -48, P.night); if (hsh(i, 4, 4) > .4) v.set(x + 1, 19 + h - 2, -47.9, P.amber); }
    for (const [x, col] of [[-44, P.red], [-30, P.blue], [40, P.lime], [54, P.orange]]) { v.box(x - 5, 22, -48.5, x + 5, 38, -47.5, P.amber); v.box(x - 4, 23, -48.6, x + 4, 37, -47.4, col); }
    v.box(-24, 0, -16, 24, 10, 0, P.brown); v.box(-25, 10, -17, 25, 11, 1, P.dbrown);   // mesa
    v.box(-8, 11, -12, -6, 20, -10, P.ink); v.box(-10, 20, -12, -2, 22, -6, P.ink); v.box(14, 11, -12, 20, 13, -7, P.ink); v.box(15, 13, -11, 19, 14, -8, P.slate);   // lámpara y teléfono
    v.luz(P.amber); s.add(v.build({ jit: .05 }));
    const mic = actor('micro_pod', 1.1); mic.position.set(-16, 26, -6); s.add(mic);
    const aire = pantalla(18, 6, 108, 36); aire.m.position.set(-34, 46, -47.4); s.add(aire.m);
    const cal = pantalla(10, 10, 72, 72); cal.m.position.set(17, 17, -9); cal.m.rotation.y = -.25; s.add(cal.m);
    const B = new Bloques(520), L = new Bloques(80, true); s.add(B.im, L.im);
    const guion = (amar) => { for (let i = 0; i < 10; i++) B.pon(4, 11.6 + i * .3, -6, 8, .25, 10, i === 9 ? colLerp(P.red, 0x7a3a30, amar).getHex() : colLerp(P.white, P.tan, amar).getHex()); };
    const calen = (y) => { const k = String(y); if (cal._k === k) return; cal._k = k; const { g, cv, tex } = cal; g.fillStyle = '#ffffff'; g.fillRect(0, 0, 72, 72); g.fillStyle = '#e43b44'; g.fillRect(0, 0, 72, 20);
      g.fillStyle = '#ffffff'; g.font = 'bold 13px monospace'; g.textAlign = 'center'; g.fillText('AÑO', 36, 15); g.fillStyle = '#181425'; g.font = 'bold 22px monospace'; g.fillText(k, 36, 50); tex.needsUpdate = true; };
    const c = cam(46);
    const base = (t, on, luz) => { rotular(aire, ['EN EL AIRE'], on ? '#ffffff' : '#5a6988', on ? '#e43b44' : '#262b44', 16); lamp.intensity = 900 * luz; amb.intensity = lerp(.45, 1.1, luz); sol.intensity = 1.3 * luz; calen(2003); };
    return { s, c, upd(t) { base(t, false, 1); B.ini(); guion(0); B.fin(); L.ini(); L.fin(); mira(c, [Math.sin(t * .1) * 6, 34, 86], [0, 18, -10], .02); },
      acc: {
        // se enciende «EN EL AIRE» y salen ondas del micrófono mientras habla
        podcast(lt, dur, t) { base(t, true, 1); B.ini(); guion(0); B.fin(); L.ini(); for (let r = 0; r < 4; r++) { const f = ((t * .9 + r / 4) % 1), R2 = 3 + f * 12, y = 32, x = -12; for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283; L.pon(x + Math.cos(a) * R2, y + Math.sin(a) * R2, -4, .7, .7, .7, f < .5 ? P.cyan : P.blue); } } L.fin();
          const q = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-6, -10, q), 34, lerp(78, 66, q)], [-13, 28, -6], .05); },
        // la lámpara se va apagando sobre el guion: la idea se apaga
        apagando(lt, dur, t) { const k = 1 - ss(clamp((lt - .4) / (dur * .75), 0, 1)); base(t, false, Math.max(.05, k)); B.ini(); guion(0); B.fin(); L.ini(); for (let i = 0; i < 14; i++) L.pon(4 + Math.sin(i * 3 + t * .5) * 6, 13 + ((t * .6 + hsh(i, 1, 1)) % 1) * 9, -6 + Math.cos(i * 2 + t * .4) * 5, .3, .3, .3, P.silver); L.fin();
          const q = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(10, 6, q), lerp(34, 28, q), lerp(60, 44, q)], [2, 14, -6], .04); },
        // dos estrellas (siluetas con estrella encima) y detrás crecen pilas y pilas de monedas: hoy cuestan muchísimo más
        dinero(lt, dur, t) { base(t, false, 1); const k = ss(clamp(lt / (dur * .85), 0, 1)); B.ini(); guion(0);
          for (const [x, cl] of [[-12, P.navy], [12, P.crimson]]) { persona(B, x, 11, 4, cl, { s: 2, pelo: P.ink }); for (let st = 0; st < 3; st++) { const n = Math.round(k * (10 + st * 9)); for (let h = 0; h < n; h++) B.pon(x - 6 + st * 6, 11.4 + h * .9, -10, 4.4, .7, 4.4, h % 2 ? P.amber : P.yellow); } }
          B.fin(); L.ini(); for (const x of [-12, 12]) L.pon(x, 30 + Math.sin(t * 3 + x) * .6, 4, 2, 2, .6, P.yellow); L.fin(); mira(c, [0, lerp(40, 46, k), 88], [0, lerp(10, 16, k), -6], .04); },
        // el calendario pasa de 2003 a hoy, el guion amarillea y le salen telarañas
        tiempo(lt, dur, t) { base(t, false, .8); const k = ss(clamp(lt / (dur * .8), 0, 1)); calen(Math.round(lerp(2003, 2026, k))); B.ini(); guion(k);
          if (k > .3) for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI; B.pon(4 + Math.cos(a) * 5 * k, 16 + Math.sin(a) * 4 * k, -6, .25, .25 + 6 * k * Math.abs(Math.sin(a + .5)), .25, P.silver); } B.fin(); L.ini(); L.fin();
          mira(c, [8, 32, 62], [10, 15, -8], .04); },
      } };
  },
  // —— Elf 3: el Polo Sur de noche: aurora, poste a rayas, pingüinos y los elfos malvados con el trineo ——
  polo_sur: () => {
    const s = new THREE.Scene(); s.background = cielo([0x07060e, 0x124e89, 0x193c3e]); s.fog = new THREE.Fog(0x193c3e, 150, 300); estrellas(s, 220, 220, 20);
    luces(s, { cielo: 0xc0f0ff, suelo: 0x8b9bb4, amb: 1.3, sol: 0xd8f0ff, int: 1.6, dir: [-40, 70, 50], sombra: 90 });
    const v = new Vox(); v.box(-90, -1, -70, 90, 0, 50, (x, y, z) => hsh(x, 0, z) > .97 ? P.steel : hsh(x >> 2, 1, z >> 2) > .5 ? P.white : P.silver);
    for (let i = 0; i < 14; i++) { const x = -80 + hsh(i, 5, 5) * 160, z = -66 + hsh(i, 6, 6) * 20, r = 5 + hsh(i, 7, 7) * 9; v.ball(Math.round(x), 0, Math.round(z), r, (a, b) => b > r * .3 ? P.white : P.silver, .6); }
    v.cyl(-28, -18, 0, 16, 1, (x, y) => (y >> 1) & 1 ? P.red : P.white); v.ball(-28, 18, -18, 2.6, P.silver);
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; v.box(Math.round(-28 + Math.cos(a) * 8), 0, Math.round(-18 + Math.sin(a) * 8), Math.round(-28 + Math.cos(a) * 8) + 1, 8, Math.round(-18 + Math.sin(a) * 8) + 1, P.steel); }
    s.add(v.build({ jit: .04 }));
    const tr = actor('trineo', 1); s.add(tr); const EL = [0, 1, 2, 3].map(() => { const e = actor('elfo_malo', .55); s.add(e); return e; });
    const AU = new Bloques(160, true), B = new Bloques(260); s.add(AU.im, B.im);
    const aurora = (t) => { AU.ini(); for (let r = 0; r < 2; r++) for (let i = 0; i < 60; i++) { const x = -110 + i * 3.7, y = 30 + r * 9 + Math.sin(i * .25 + t * .8 + r) * 6; AU.pon(x, y, -90 - r * 10, 3.8, 6 + Math.sin(i * .5 + t) * 3, 1, (i + r) % 3 ? P.lime : P.cyan); } AU.fin(); };
    const convoy = (x, t, mov) => { tr.position.set(x + 14, 2.6, 4); tr.rotation.set(0, Math.PI, 0); EL.forEach((e, i) => { e.position.set(x - 4 - (i >> 1) * 7, 6 + (mov ? Math.abs(Math.sin(t * 8 + i)) * 1.4 : 0), 4 + (i & 1 ? 4 : -4)); e.rotation.set(0, -Math.PI / 2, mov ? Math.sin(t * 8 + i) * .1 : 0); });
      persona(B, x + 12, 4, 4, P.red, { s: 1.7, pelo: P.white }); B.pon(x + 12, 13.2, 4, 2.2, 1.6, 2.2, P.red); B.pon(x + 12, 14.4, 4, .9, .9, .9, P.white); B.pon(x + 11.2, 8.2, 4, 1, 2.4, 1.8, P.white);
      for (let i = 0; i < 2; i++) for (let k = 0; k < 8; k++) B.pon(x + 1.5 - k * 1.3, 6.5, 4 + (i ? 4 : -4) * k / 8, 1.3, .3, .3, P.amber); };
    const pinguinos = (t) => { for (let i = 0; i < 6; i++) { const x = 24 + (i % 3) * 5, z = -10 + (i / 3 | 0) * 6, h = Math.abs(Math.sin(t * 3 + i)) * .5; B.pon(x, 3 + h, z, 3, 6, 2.6, P.ink); B.pon(x, 3 + h, z + 1.2, 2, 4.4, .6, P.white); B.pon(x, 7 + h, z + 1.5, .8, .6, 1, P.orange); } };
    const c = cam(46);
    return { s, c, upd(t) { aurora(t); B.ini(); convoy(-6, t, false); pinguinos(t); B.fin(); mira(c, [Math.sin(t * .1) * 10, 28, 80], [0, 6, -2], .04); },
      acc: {
        // los elfos tiran del trineo con Papá Noel atado y cruzan el hielo; los pingüinos miran
        secuestro(lt, dur, t) { aurora(t); const x = lerp(30, -26, clamp(lt / dur, 0, 1)); B.ini(); convoy(x, t, true); pinguinos(t); B.fin(); mira(c, [x + 10, 30, 86], [x + 5, 6, 0], .04); },
      } };
  },
});

// ———————————————————— 28/11/2026: el megavatio-hora, los resultados del 29-N y la Copa Davis ————————————————————
// microondas genérico (16 × 9 × 10, frente en +z): hijo 'luz' (interior encendido, se muestra/oculta) y 'plato' que gira
function microV() { const w = new THREE.Group(), v = new Vox();
  v.box(0, 0, 0, 16, 9, 10, P.silver); v.box(0, 0, 0, 16, 1, 10, P.steel); v.box(1, 1, 10, 11, 8, 11, P.slate); v.box(2, 2, 10, 10, 7, 11, P.ink);
  v.box(12, 6, 10, 15, 8, 11, P.ink); v.set(12, 6, 10, P.lime); v.set(13, 6, 10, P.lime); v.set(14, 6, 10, P.lime);
  for (let y = 2; y < 5; y++) for (let x = 12; x < 15; x += 2) v.set(x, y, 10, P.dslate); v.box(10, 3, 11, 11, 6, 12, P.steel); v.luz(P.lime);
  w.add(v.build({ jit: .04 }));
  const luz = new THREE.Mesh(new THREE.BoxGeometry(8, 5, .2), new THREE.MeshBasicMaterial({ color: 0xffc860, transparent: true, opacity: .8 })); luz.position.set(6, 4.5, 11.15); luz.name = 'luz'; luz.visible = false; w.add(luz);
  const pv = new Vox(); pv.cyl(0, 0, 0, 1, 2.6, P.white); pv.box(-1, 1, -1, 1, 2, 1, P.orange); const pl = pv.build({ jit: .03 }); const piv = new THREE.Group(); piv.add(pl); piv.position.set(6, 2.2, 5); piv.name = 'plato'; w.add(piv);
  return w; }
Object.assign(FAB, {
  microondas: () => microV(),
  // contador de la luz de disco (10 × 14 × 3) con el disco 'disco' que gira delante de la ventana
  contador: () => { const w = new THREE.Group(), v = new Vox();
    v.box(0, 0, 0, 10, 14, 3, P.silver); v.box(0, 0, 0, 10, 1, 3, P.steel); v.box(1, 7, 3, 9, 13, 4, P.ink); v.box(2, 2, 3, 8, 5, 4, P.night);
    for (let x = 2; x < 8; x += 2) v.set(x, 3, 3, P.white); v.box(3, -3, 1, 7, 0, 2, P.ink); w.add(v.build({ jit: .04 }));
    const d = new Vox(); d.cyl(0, 0, 0, 1, 3.4, P.steel); d.set(3, 0, 0, P.red); d.set(-3, 0, 0, P.red); const g = d.build({ jit: .02 }); g.position.set(-.5, -.5, -.5); const piv = new THREE.Group(); piv.add(g); piv.position.set(5, 9.5, 3.8); piv.name = 'disco'; w.add(piv);
    return w; },
  // máquina de vapor de balancín (tipo Watt): cilindro a la izquierda (x = -18), balancín 'balancin' sobre el pilar (0, 29), volante 'volante' en (16, 14)
  maquina_vapor: () => { const w = new THREE.Group(), v = new Vox();
    v.box(-26, 0, -7, 28, 3, 8, P.dslate); v.box(-25, 3, -6, 27, 4, 7, P.slate);
    v.cyl(-18, 0, 4, 20, 4.5, (x, y) => y % 5 === 0 ? P.amber : P.dbrown); v.cyl(-18, 0, 20, 21, 5.2, P.amber);
    v.box(-2, 4, -3, 2, 28, 3, P.brown); v.box(-3, 4, -4, 3, 7, 4, P.dbrown); v.box(-3, 27, -3, 3, 29, 3, P.dbrown);
    v.box(13, 4, -5, 15, 15, -3, P.brown); v.box(13, 4, 3, 15, 15, 5, P.brown);   // soportes del eje del volante
    v.box(-34, 0, -18, -24, 46, -10, (x, y) => y % 3 === 0 ? P.dbrown : P.brown); v.box(-35, 44, -19, -23, 47, -9, P.umber);   // chimenea de ladrillo
    v.box(-32, 3, -10, -20, 13, -1, P.crimson);   // caldera
    w.add(v.build({ jit: .06 }));
    const b = new Vox(); b.box(-20, -1, -1, 21, 2, 2, P.umber); b.box(-21, -2, -1, -18, 3, 2, P.amber); b.box(18, -2, -1, 21, 3, 2, P.amber); const bg = b.build({ jit: .04 }); bg.position.set(0, -.5, -.5);
    const piv = new THREE.Group(); piv.add(bg); piv.position.set(0, 29.5, 0); piv.name = 'balancin'; w.add(piv);
    const f = new Vox(); for (let x = -11; x <= 11; x++) for (let y = -11; y <= 11; y++) { const r = Math.hypot(x, y); if (r > 9.3 && r < 11.2) f.set(x, y, 0, P.ink); else if (r < 9.4 && (Math.abs(x) < 1 || Math.abs(y) < 1 || Math.abs(x - y) < .8 || Math.abs(x + y) < .8)) f.set(x, y, 0, P.slate); }
    f.box(-1, -1, -1, 2, 2, 2, P.amber); f.set(6, 0, 1, P.red); const fg = f.build({ jit: .04 }); fg.position.set(-.5, -.5, -.5); const pv = new THREE.Group(); pv.add(fg); pv.position.set(16, 14, 6); pv.name = 'volante'; w.add(pv);
    return w; },
});
// moneda: disco plano de cobre (céntimo) o dorado
const monedaB = (B, x, y, z, col = P.tan, s = 1) => { B.pon(x, y, z, 2.2 * s, .45 * s, 2.2 * s, col); B.pon(x, y, z, 1.5 * s, .5 * s, 2.8 * s, col); B.pon(x, y, z, 2.8 * s, .5 * s, 1.5 * s, col); };
// signo de interrogación de bloques (5 × 7) en el plano x-y
const INTERR = ['01110', '10001', '00001', '00010', '00100', '00000', '00100'];
function interrB(B, x, y, z, s, col) { INTERR.forEach((f, j) => [...f].forEach((q, i) => { if (q === '1') B.pon(x + (i - 2) * s, y + (6 - j) * s, z, s, s, s, col); })); }
Object.assign(FABE, {
  // —— MWh 1: la fachada de una casa con el contador de la luz; el cable trae la energía y salen monedas ——
  contador: () => {
    const s = new THREE.Scene(); s.background = cielo([0x0b1a3a, 0x124e89, 0x68386c]); s.fog = new THREE.Fog(0x262b44, 160, 320);
    luces(s, { cielo: 0xc8d8ff, suelo: 0x3a4466, amb: 1.2, sol: 0xffe0b0, int: 2.0, dir: [40, 70, 80], sombra: 80 });
    const v = new Vox(); v.box(-70, -1, -40, 70, 0, 70, (x, y, z) => z > 6 ? (((x >> 2) + (z >> 2)) & 1 ? P.dslate : P.slate) : ((x + z) & 1 ? P.silver : P.steel));
    v.box(-30, 0, -22, 24, 44, -12, (x, y) => y % 6 === 0 ? P.tan : P.sand); v.box(-32, 44, -24, 26, 47, -10, P.dbrown);
    for (const [x0, y0] of [[-24, 26], [-10, 26], [6, 26], [-24, 10], [-10, 10]]) { v.box(x0, y0, -12, x0 + 8, y0 + 10, -11, P.white); v.box(x0 + 1, y0 + 1, -12, x0 + 7, y0 + 9, -10, P.amber); v.box(x0 + 3, y0 + 1, -11, x0 + 4, y0 + 9, -10, P.white); }
    v.box(-2, 0, -12, 6, 16, -11, P.dbrown); v.box(-3, 16, -12, 7, 17, -10, P.white); v.set(4, 7, -10, P.amber);
    v.box(34, 0, -8, 36, 52, -6, P.dbrown); v.box(30, 50, -8, 40, 51, -6, P.dbrown);   // poste de la luz
    v.luz(P.amber); s.add(v.build({ jit: .05 }));
    const ct = actor('contador', 1.2); ct.position.set(9, 6, -11); s.add(ct); const disco = ct.getObjectByName('disco');
    const B = new Bloques(260), F = new Bloques(80, true); s.add(B.im, F.im);
    const ruta = [[38, 51, -7], [24, 42, -10], [17, 30, -9.5], [15, 22, -8.5]];
    const cable = new Bloques(60); s.add(cable.im); cable.ini(); for (let i = 0; i < 3; i++) { const a = ruta[i], b = ruta[i + 1]; for (let k = 0; k < 14; k++) { const u = k / 14; cable.pon(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u), .6, .6, .6, P.ink); } } cable.fin();
    const c = cam(46);
    const base = (t, vel, nf) => { disco.rotation.y = t * vel; F.ini(); flujo(F, ruta, nf, t, 14, P.yellow, 1); F.fin(); };
    return { s, c, upd(t) { base(t, 2, 6); B.ini(); B.fin(); mira(c, [6, 40, 92], [10, 12, -6], .08); },
      acc: {
        // el disco gira deprisa, la energía baja por el cable y del contador saltan monedas que caen a la acera
        precio(lt, dur, t) { base(t, 9, 14); B.ini(); for (let i = 0; i < 26; i++) { const t0 = i * .13, u = lt - t0; if (u < 0) continue; const T = 1.1, f = Math.min(u, T);
            const x = 15 + Math.cos(i * 2.3) * f * 9, z = -7 + f * 6 + Math.sin(i * 1.7) * 2, y = Math.max(.3 + (i % 5) * .45 * (u > T ? 1 : 0), 18 + f * 14 - f * f * 26);
            monedaB(B, x, u > T ? .3 + (i % 4) * .5 : y, z, P.amber, .9); } B.fin();
          const q = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(2, 8, q), lerp(42, 36, q), lerp(98, 84, q)], [10, 12, -6], .08); },
        // la cámara se acerca al contador; encima sube un interrogante de bloques
        pregunta(lt, dur, t) { base(t, 5, 10); B.ini(); for (let i = 0; i < 26; i++) monedaB(B, 15 + Math.cos(i * 2.3) * 9.9, .3 + (i % 4) * .5, -.4 + Math.sin(i * 1.7) * 2, P.amber, .9);
          const k = ss(clamp(lt / .8, 0, 1)); interrB(B, 15, lerp(10, 26, k) + Math.sin(t * 3) * .6, -6, 1.3, P.yellow); B.fin();
          mira(c, [12, 34, 66], [14, 16, -8], .08); },
      } };
  },
  // —— MWh 2: la cocina: una bombilla de 10 W y un microondas de 1.000 W; medidores y reloj de pared ——
  cocina_vatios: () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(0x3a4466); s.fog = new THREE.Fog(0x3a4466, 160, 320);
    luces(s, { cielo: 0xfff4e0, suelo: 0x5a6988, amb: 1.3, sol: 0xfff1d6, int: 2.0, dir: [-20, 70, 70], sombra: 70 });
    const v = new Vox(); v.box(-60, -1, -30, 60, 0, 50, (x, y, z) => ((x >> 2) + (z >> 2)) & 1 ? P.sand : P.white);
    v.box(-60, 0, -32, 60, 60, -28, (x, y) => (x % 4 === 0 || y % 4 === 0) ? P.silver : P.white);
    v.box(-40, 0, -28, 40, 13, -10, P.navy); v.box(-41, 13, -29, 41, 15, -8, P.brown); for (let x = -36; x < 40; x += 13) v.box(x, 4, -10, x + 1, 9, -9, P.silver);
    v.box(-3, 30, -28, 3, 34, -27, P.white); v.box(-2, 31, -27, -1, 33, -26, P.ink); v.box(1, 31, -27, 2, 33, -26, P.ink);   // enchufe
    // lámpara de mesa
    v.box(-20, 15, -18, -12, 16, -10, P.dslate); v.box(-17, 16, -15, -15, 25, -13, P.steel);
    s.add(v.build({ jit: .04 }));
    const bulbo = bola(0x5a6988, 2.6); bulbo.position.set(-15.5, 27.5, -13.5); s.add(bulbo);
    const halo = bola(0xfee761, 4.5); halo.material.transparent = true; halo.material.opacity = .25; halo.position.copy(bulbo.position); s.add(halo);
    const mo = actor('microondas', 1.15); mo.position.set(1, 15, -24); s.add(mo); const luz = mo.getObjectByName('luz'), plato = mo.getObjectByName('plato');
    const reloj = pantalla(9, 9, 48, 48); reloj.m.position.set(10, 33.5, -27.9); s.add(reloj.m);
    const e1 = pantalla(9, 3.6, 72, 28), e2 = pantalla(12, 3.6, 96, 28); e1.m.position.set(-15.5, 41.5, -27.9); e2.m.position.set(10, 41.5, -27.9); s.add(e1.m, e2.m);
    rotular(e1, ['10 W'], '#fee761', '#181425', 20); rotular(e2, ['1.000 W'], '#fee761', '#181425', 20);
    const B = new Bloques(200, true), G = new Bloques(80); s.add(B.im, G.im);
    const c = cam(46);
    const r1 = [[-1.5, 30, -27], [-1.5, 22, -27], [-9, 17, -24], [-15.5, 17, -14]], r2 = [[1.5, 30, -27], [1.5, 24, -27], [6, 24, -25]];
    const medidor = (x, k, col) => { for (let i = 0; i < 10; i++) G.pon(x, 32 + i * 1, -27.4, 2.4, .8, .6, i < Math.round(k * 10) ? col : P.dslate); };
    const estado = (t, kb, km, lamp, micro) => { bulbo.material.color.setHex(lamp ? 0xfee761 : 0x5a6988); halo.visible = lamp; luz.visible = micro; plato.rotation.y = micro ? t * 2 : 0;
      B.ini(); if (lamp) flujo(B, r1, 2, t, 4, P.yellow, .9); if (micro) flujo(B, r2, 12, t, 26, P.yellow, .9); B.fin(); G.ini(); medidor(-20.5, kb, P.lime); medidor(21.5, km, P.red); G.fin(); };
    return { s, c, upd(t) { estado(t, 0, 0, false, false); relojP(reloj, 12); mira(c, [0, 40, 100], [0, 22, -20], .08); },
      acc: {
        // primero se enciende la bombilla (poca energía, despacio); luego el microondas (mucha, deprisa)
        potencia(lt, dur, t) { const a = clamp(lt / .5, 0, 1), b = clamp((lt - dur * .45) / .6, 0, 1); estado(t, a * .1, b, a > 0, b > 0); relojP(reloj, 12);
          const q = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-6, 2, q), 40, 100], [lerp(-4, 2, q), 22, -20], .08); },
        // el microondas funciona y el reloj de pared da una vuelta entera: una hora
        una_hora(lt, dur, t) { estado(t, .1, 1, true, true); const k = clamp(lt / (dur * .85), 0, 1); relojP(reloj, 12 + k);
          mira(c, [8, 36, 80], [8, 24, -22], .08); },
      } };
  },
  // —— MWh 3: una nave con mil microondas (20 × 50) que se encienden; monedas de céntimo y el sol del mediodía ——
  nave_microondas: () => {
    const s = new THREE.Scene(); const noche = 0x181425, dia = 0x8fd3ff; s.background = new THREE.Color(noche); s.fog = new THREE.Fog(noche, 260, 560);
    luces(s, { cielo: 0xd0e0ff, suelo: 0x3a4466, amb: 1.25, sol: 0xfff1d6, int: 1.9, dir: [-60, 120, 80], sombra: 200, mira: [0, 0, -140] });
    const v = new Vox(); v.box(-90, -1, -330, 90, 0, 40, (x, y, z) => ((x >> 3) + (z >> 3)) & 1 ? P.dslate : P.slate); s.add(v.build({ jit: .04, sombra: false }));
    const pos = []; for (let r = 0; r < 50; r++) for (let q = 0; q < 20; q++) pos.push([(q - 9.5) * 7, -r * 6]); pos.sort((a, b) => Math.hypot(a[0], a[1]) - Math.hypot(b[0], b[1]));
    const CU = new Bloques(1000), VE = new Bloques(1000, true), M = new Bloques(80), PZ = new Bloques(40, true); s.add(CU.im, VE.im, M.im, PZ.im);
    CU.ini(); pos.forEach(([x, z]) => CU.pon(x, 1.4, z, 4.8, 2.8, 3.2, P.silver)); CU.fin();
    const sol = bola(0xfff1c0, 9); s.add(sol); sol.visible = false;
    const cartel = pantalla(10, 1.9, 252, 48); cartel.m.position.set(-1, 8.5, -6); s.add(cartel.m); cartel.m.visible = false;
    const c = cam(46);
    const encender = (n, t) => { VE.ini(); pos.forEach(([x, z], i) => VE.pon(x - .7, 1.5, z + 1.62, 2.8, 1.8, .1, i < n ? (((i * 7 + Math.floor(t * 3)) % 11) ? 0xffc860 : 0xffe9a0) : P.ink)); VE.fin(); };
    const pila = (n, lt, fuera = 0, lf = 0) => { M.ini(); for (let i = 0; i < n; i++) { const ti = i * .07, u = clamp((lt - ti) / .35, 0, 1); monedaB(M, 6.5, lerp(14, .3 + i * .5, u * u), 2.5, P.tan, .8); }
      for (let i = 0; i < fuera; i++) { const u = clamp((lf - .6 - i * .15) / .9, 0, 1); if (u < 1) monedaB(M, 6.5 + u * (8 + i * 3), .3 + (n + i) * .5 + u * 16 - u * u * 6, 2.5 - u * 6, P.tan, .8); } M.fin(); };
    const cielo2 = (k) => { const col = colLerp(noche, dia, k); s.background = col; s.fog.color = col; };
    return { s, c, upd(t) { cielo2(0); encender(1, t); M.ini(); M.fin(); PZ.ini(); PZ.fin(); sol.visible = false; cartel.m.visible = false; mira(c, [0, 8, 26], [0, 2, 0], -.03); },
      acc: {
        // de un microondas a mil: se van encendiendo en ondas y la cámara sube hasta ver la nave entera
        mil(lt, dur, t) { const k = clamp(lt / (dur * .8), 0, 1); encender(Math.round(lerp(1, 1000, k * k)), t); const q = ss(clamp(lt / (dur * .9), 0, 1));
          mira(c, [0, lerp(8, 230, q), lerp(26, 130, q)], [0, 0, lerp(0, -150, q)], lerp(-.03, -.1, q)); },
        // de vuelta al primer microondas: caen veintiún céntimos y se apilan al lado
        centimos(lt, dur, t) { encender(1000, t); pila(21, lt); mira(c, [12, 22, 34], [3, 3, 0], .07); },
        // amanece y sale el sol del mediodía: cuatro monedas salen volando y quedan diecisiete
        barata(lt, dur, t) { const k = ss(clamp(lt / 1.2, 0, 1)); cielo2(k); sol.visible = true; sol.position.set(-60, lerp(-10, 70, k), -260); encender(1000, t); pila(17, 9, 4, lt);
          cartel.m.visible = true; rotular(cartel, ['12:00 - 13:00'], '#feae34', '#181425', 30); mira(c, [12, 22, 36], [2, 4, -2], .07); },
      } };
  },
  // —— MWh 4: el taller de James Watt: la máquina de vapor de balancín funcionando ——
  taller_watt: () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(0x3e2731); s.fog = new THREE.Fog(0x3e2731, 160, 320);
    luces(s, { cielo: 0xffe8c8, suelo: 0x3e2731, amb: 1.25, sol: 0xffd9a0, int: 2.2, dir: [50, 80, 60], sombra: 80 });
    const v = new Vox(); v.box(-70, -1, -30, 70, 0, 50, (x, y, z) => (x & 3) ? P.brown : P.dbrown);
    v.box(-70, 0, -32, 70, 70, -28, (x, y) => ((y % 3 === 0) || ((x + (Math.floor(y / 3) & 1) * 3) % 6 === 0)) ? P.umber : P.dbrown);
    v.box(30, 26, -28, 50, 50, -27, P.yellow); v.box(39, 26, -28, 41, 50, -26, P.umber); v.box(30, 37, -28, 50, 39, -26, P.umber);   // ventana con luz de día
    v.box(-60, 0, 10, -44, 12, 22, P.dbrown); v.box(-61, 12, 9, -43, 13, 23, P.brown);   // banco de trabajo
    v.luz(P.yellow); s.add(v.build({ jit: .05 }));
    const m = actor('maquina_vapor'); s.add(m); const bal = m.getObjectByName('balancin'), vol = m.getObjectByName('volante');
    const B = new Bloques(160), H = new Bloques(90, true); s.add(B.im, H.im);
    const c = cam(46);
    const anima = (t, w) => { const f = t * w, sy = Math.sin(f) * 6; vol.rotation.z = f; bal.rotation.z = Math.asin(sy / 19);
      const yl = 29.5 - sy, yr = 29.5 + sy, cx = 16 + Math.cos(f) * 6, cy = 14 + Math.sin(f) * 6;
      B.ini(); B.pon(-18, (21 + yl) / 2, .5, 1.2, yl - 21, 1.2, P.silver); B.pon(-18, 21 + Math.max(0, yl - 26) * .3, .5, 7, 1.4, 7, P.slate);
      const dx = cx - 19, dy = cy - yr; B.pon(19 + dx / 2, yr + dy / 2, 4, 1.4, Math.hypot(dx, dy), 1.4, P.silver); B.pon(cx, cy, 7.2, 1.6, 1.6, 1.6, P.amber); B.fin();
      H.ini(); for (let i = 0; i < 30; i++) { const ph = ((t * .45 + i / 30) % 1); H.pon(-29 + Math.sin(i * 2.1 + t) * ph * 4, 47 + ph * 26, -14 + Math.cos(i * 1.3) * ph * 3, 1.5 + ph * 4.5, 1.5 + ph * 4.5, 1.5 + ph * 4.5, ph > .7 ? P.silver : P.white); }
      for (let i = 0; i < 14; i++) { const ph = ((t * 1.2 + i / 14) % 1); H.pon(-18 + Math.cos(i * 1.9) * (2 + ph * 6), 21 + ph * 6, Math.sin(i * 1.9) * (2 + ph * 6), .8 + ph * 2, .8 + ph * 2, .8 + ph * 2, P.white); } H.fin(); };
    return { s, c, upd(t) { anima(t, 2.2); mira(c, [Math.sin(t * .15) * 30, 46, 116], [0, 22, 0], .08); },
      acc: {
        // la máquina arranca: el volante gira, el balancín sube y baja y sale el vapor; la cámara da media vuelta
        vapor(lt, dur, t) { anima(t, lerp(1, 2.6, clamp(lt / 2, 0, 1))); const q = ss(clamp(lt / dur, 0, 1)); const a = lerp(.05, .45, q); mira(c, [Math.sin(a) * 112, lerp(42, 48, q), Math.cos(a) * 112], [0, 22, 0], .08); },
        vapor_fin(lt, dur, t) { anima(t, 2.6); mira(c, [46, 50, 124], [-2, 22, 0], .1); },
      } };
  },
});
// —— 29-N: reloj de calle, pantallón de resultados y saca de correos ——
Object.assign(FAB, {
  // reloj de calle: poste verde con caja negra arriba (la esfera es una pantalla aparte, centrada en y = 25, z = 2.1)
  reloj_calle: () => { const v = new Vox(); v.box(-2, 0, -2, 3, 2, 3, P.dgreen); v.box(-1, 2, -1, 2, 19, 2, P.dgreen); v.box(-4, 19, -2, 5, 31, 2, P.ink); v.box(-5, 31, -2, 6, 32, 2, P.dgreen); v.set(0, 32, 0, P.amber); v.luz(P.amber);
    const g = new THREE.Group(); g.add(v.build({ jit: .04 })); return g; },
  // pantallón de resultados: patas y marco (la imagen es una pantalla aparte de 24 × 14 centrada en y = 19, z = 1.6)
  pantallon: () => { const v = new Vox(); for (const sx of [-10, 9]) v.box(sx, 0, -1, sx + 2, 12, 1, P.slate); v.box(-14, 11, -1, 14, 27, 1, P.ink); v.box(-14, 26, -1, 14, 27, 1, P.steel); v.box(-3, 27, -1, 3, 28, 1, P.red); v.luz(P.red);
    const g = new THREE.Group(); g.add(v.build({ jit: .03 })); return g; },
  // saca de correos (voto desde el extranjero) con cuerda y etiqueta
  saca: () => { const v = new Vox(); v.ball(0, 5, 0, 5, (x, y, z) => hsh(x, y, z) > .7 ? P.sand : P.tan, 1.1); v.box(-1, 10, -1, 2, 13, 2, P.tan); v.box(-2, 10, -2, 3, 11, 3, P.dbrown); v.box(2, 6, 4, 5, 9, 5, P.white); v.set(3, 8, 5, P.red);
    const g = new THREE.Group(); g.add(v.build({ jit: .05, centrar: true })); return g; },
});
// lon/lat → mapa de España (4 unidades por grado)
const ex = lon => (lon + 8) * 4, ez = lat => (40 - lat) * 4;
const ESP = [[-9.3, 43.2], [-8, 43.7], [-5, 43.5], [-1.8, 43.4], [0.7, 42.8], [3.2, 42.4], [3.2, 41.9], [0.9, 41], [0, 39.9], [-0.3, 39.4], [0.2, 38.7], [-0.7, 37.6], [-2.1, 36.7], [-4.4, 36.7], [-5.6, 36], [-6.4, 36.8], [-7.4, 37.2], [-8.9, 37], [-8.8, 38.7], [-9.5, 38.8], [-8.9, 40.2], [-8.9, 42]];
const POR = [[-8.9, 37], [-7.4, 37.2], [-7.5, 38], [-7, 38.9], [-7, 39.7], [-6.9, 41], [-6.2, 41.6], [-8.1, 42], [-8.9, 42], [-8.9, 40.2], [-9.5, 38.8], [-8.8, 38.7]];
const ISLAS = [[-16.6, 28.3, 2.6], [-15.6, 27.95, 2.2], [-13.6, 29.05, 1.8], [-14.0, 28.4, 2.2], [-17.85, 28.65, 1.6], [-17.2, 28.1, 1.3], [-18.0, 27.75, 1.2], [3.0, 39.6, 2.4], [4.1, 39.95, 1.2], [1.4, 38.95, 1.1]];
Object.assign(FABE, {
  // —— 29-N 1: el colegio electoral de noche, el reloj de la calle y el pantallón de resultados ——
  colegio_noche: () => {
    const s = new THREE.Scene(); s.background = cielo([0x07060e, 0x181425, 0x262b44]); s.fog = new THREE.Fog(0x181425, 170, 340); estrellas(s, 120, 220, 40);
    luces(s, { cielo: 0x9fb4e8, suelo: 0x262b44, amb: 1.15, sol: 0xc8d4ff, int: 1.6, dir: [30, 80, 90], sombra: 90 });
    const v = new Vox(); v.box(-80, -1, -40, 80, 0, 70, (x, y, z) => z > 8 ? (((x >> 2) + (z >> 2)) & 1 ? P.night : P.dslate) : ((x + z) & 1 ? P.steel : P.slate));
    v.box(-44, 0, -30, 20, 34, -14, (x, y) => (y % 4 === 0 || (x + (y >> 2) * 2) % 8 === 0) ? P.dbrown : P.brown); v.box(-46, 34, -32, 22, 36, -12, P.slate);
    for (let x = -40; x < 18; x += 10) for (const y0 of [6, 20]) if (!(y0 === 6 && x > -20 && x < 0)) { v.box(x, y0, -14, x + 7, y0 + 9, -13, P.white); v.box(x + 1, y0 + 1, -14, x + 6, y0 + 8, -12, P.amber); }
    v.box(-16, 0, -14, -4, 15, -13, P.white); v.box(-18, 15, -15, -2, 17, -11, P.slate);   // marco de la puerta
    v.box(-15, 0, -15, -5, 14, -13, P.amber);   // interior iluminado
    v.luz(P.amber); s.add(v.build({ jit: .05 }));
    const cartel = pantalla(18, 3, 144, 24); cartel.m.position.set(-12, 28, -11.9); s.add(cartel.m); rotular(cartel, ['COLEGIO ELECTORAL'], '#ffffff', '#124e89', 16);
    const rc = actor('reloj_calle'); rc.position.set(30, 0, 0); s.add(rc); const esf = pantalla(8, 8, 48, 48); esf.m.position.set(30.5, 25, 2.15); s.add(esf.m);
    const pt = actor('pantallon'); pt.position.set(56, 0, -6); s.add(pt); const pp = pantalla(26, 14, 156, 84); pp.m.position.set(56, 19, -4.4); s.add(pp.m);
    const B = new Bloques(120), Q = new Bloques(40, true); s.add(B.im, Q.im);
    const c = cam(46);
    const panel = (k) => { const { g, cv, tex } = pp; const key = Math.round(k * 20); if (pp._k === key) return; pp._k = key; g.fillStyle = '#181425'; g.fillRect(0, 0, cv.width, cv.height);
      g.fillStyle = '#ffffff'; g.font = 'bold 15px monospace'; g.textAlign = 'center'; g.fillText('ESCRUTADO', cv.width / 2, 22); g.fillStyle = '#feae34'; g.font = 'bold 30px monospace'; g.fillText(k > 0 ? (k * 4).toFixed(1).replace('.', ',') + ' %' : '0,0 %', cv.width / 2, 56);
      g.fillStyle = '#3a4466'; g.fillRect(14, 66, cv.width - 28, 8); g.fillStyle = '#63c74d'; g.fillRect(14, 66, (cv.width - 28) * k * .04, 8); tex.needsUpdate = true; };
    const puerta = (k) => { B.pon(-10, 7, lerp(-12.4, -12.4, k), 10 * k + .01, 14, .8, P.navy); };
    const gente = (lt, n) => { for (let i = 0; i < n; i++) { const u = clamp((lt - i * .35) / 2.4, 0, 1); persona(B, -10 + (i - 1) * 3 + u * (i % 2 ? 26 : -30), 0, -10 + u * 22 + i * 2, ROPA[i % 12], { s: 2.2, pelo: PELO[i % 5] }); } };
    return { s, c, upd(t) { relojP(esf, 20); panel(0); B.ini(); puerta(1); B.fin(); Q.ini(); Q.fin(); mira(c, [-6, 40, 128], [-4, 12, -10], .1); },
      acc: {
        // las ocho en el reloj: los últimos votantes salen y la puerta se cierra
        cierre(lt, dur, t) { relojP(esf, 19.99 + clamp(lt / 1.2, 0, 1) * .01); panel(0); B.ini(); puerta(ss(clamp((lt - 1.2) / 1, 0, 1))); gente(lt, 4); B.fin(); Q.ini(); Q.fin();
          const q = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-10, -2, q), 40, lerp(132, 122, q)], [lerp(-8, 0, q), 12, -10], .1); },
        // el reloj corre de las ocho a las nueve; el pantallón sigue a cero
        espera(lt, dur, t) { const k = clamp(lt / (dur * .9), 0, 1); relojP(esf, 20 + k * .99); panel(0); B.ini(); puerta(1); B.fin(); Q.ini(); Q.fin();
          const q = ss(clamp(lt / 1.5, 0, 1)); mira(c, [lerp(-2, 46, q), lerp(40, 32, q), lerp(122, 96, q)], [lerp(0, 46, q), lerp(12, 16, q), -6], .08); },
        // un interrogante sale sobre el pantallón
        pregunta(lt, dur, t) { relojP(esf, 20.99); panel(0); B.ini(); puerta(1); B.fin(); Q.ini(); interrB(Q, 56, lerp(28, 32, ss(clamp(lt / .7, 0, 1))) + Math.sin(t * 3) * .5, -4, 1.2, P.yellow); Q.fin(); mira(c, [48, 32, 96], [48, 16, -6], .08); },
      } };
  },
  // —— 29-N 2: el mapa de España con dos relojes: la península a las ocho y Canarias a las siete ——
  mapa_horas: () => {
    const s = new THREE.Scene(); s.background = cielo([0x0b1a3a, 0x124e89, 0x193c3e]); s.fog = new THREE.Fog(0x124e89, 200, 400);
    luces(s, { cielo: 0xe0ecff, suelo: 0x124e89, amb: 1.3, sol: 0xfff1d6, int: 2.0, dir: [-40, 90, 60], sombra: 120, mira: [0, 0, 20] });
    const v = new Vox(); v.box(-70, -2, -50, 70, -1, 80, (x, y, z) => hsh(x >> 1, 0, z >> 1) > .85 ? P.blue : P.navy);
    for (let x = -64; x < 64; x++) for (let z = -40; z < 70; z++) { const lon = x / 4 - 8, lat = 40 - z / 4;
      if (enPol(lon, lat, ESP)) v.box(x, -1, z, x + 1, enPol(lon, lat, POR) ? 1 : 2, z + 1, enPol(lon, lat, POR) ? P.steel : (hsh(x >> 2, 1, z >> 2) > .5 ? P.lime : P.green));
      else if (ISLAS.some(([lo, la, r]) => Math.hypot(x - ex(lo), z - ez(la)) < r)) v.box(x, -1, z, x + 1, 2, z + 1, hsh(x, 2, z) > .5 ? P.lime : P.green); }
    s.add(v.build({ jit: .05 }));
    const r1 = pantalla(8, 8, 48, 48), r2 = pantalla(8, 8, 48, 48); s.add(r1.m, r2.m);
    const p1 = [ex(-3.7), 14, ez(40.4)], p2 = [ex(-15.8), 14, ez(28.2)]; r1.m.position.set(...p1); r2.m.position.set(...p2);
    const et1 = pantalla(10, 2.6, 100, 26), et2 = pantalla(10, 2.6, 100, 26); et1.m.position.set(p1[0], 8.6, p1[2]); et2.m.position.set(p2[0], 8.6, p2[2]); s.add(et1.m, et2.m);
    rotular(et1, ['PENÍNSULA'], '#ffffff', '#181425', 15); rotular(et2, ['CANARIAS'], '#ffffff', '#181425', 15);
    const pt = actor('pantallon', .9); pt.position.set(ex(-3.7), 0, ez(43.6) - 14); s.add(pt); const pp = pantalla(23.4, 12.6, 156, 84); pp.m.position.set(ex(-3.7), 17.1, ez(43.6) - 12.5); s.add(pp.m);
    const POL = [[ex(-3.7) - 6, ez(40.4) + 4], [ex(-5.6), ez(37.4)], [ex(-0.4), ez(39.5)], [ex(-8.4), ez(43.3)], [ex(2.2), ez(41.4)], [ex(-15.4), ez(28.1)], [ex(-16.3), ez(28.5)], [ex(-13.9), ez(28.5)]];
    const B = new Bloques(260), F = new Bloques(120, true); s.add(B.im, F.im);
    const c = cam(46);
    const reloj = (h) => { r1.m.lookAt(c.position); r2.m.lookAt(c.position); et1.m.lookAt(c.position.x, 8.6, c.position.z); et2.m.lookAt(c.position.x, 8.6, c.position.z); relojP(r1, h); relojP(r2, h - 1); };
    const panel = (k) => { const { g, cv, tex } = pp; const key = Math.round(k * 30); if (pp._k === key) return; pp._k = key; g.fillStyle = '#181425'; g.fillRect(0, 0, cv.width, cv.height);
      g.fillStyle = '#ffffff'; g.font = 'bold 15px monospace'; g.textAlign = 'center'; g.fillText(k > 0 ? 'RESULTADOS' : 'ESPERANDO…', cv.width / 2, 22);
      [P.blue, P.red, P.lime, P.plum, P.amber].forEach((col, i) => { const h = k * (20 + hsh(i, 4, 9) * 30); g.fillStyle = hx(col); g.fillRect(18 + i * 26, 76 - h, 18, h); }); tex.needsUpdate = true; };
    // colegios: casitas con la luz encendida (abierto) o apagada; en Canarias, gente entrando
    const colegios = (abiertoP, abiertoC, t) => { POL.forEach(([x, z], i) => { const can = i >= 5, ab = can ? abiertoC : abiertoP; B.pon(x, 3.5, z, 4, 3, 3, P.sand); B.pon(x, 5.4, z, 4.6, .8, 3.6, P.crimson); B.pon(x, 3, z + 1.55, 1.2, 2, .2, ab ? P.amber : P.ink);
        if (can && ab) for (let j = 0; j < 2; j++) { const u = ((t * .5 + j * .5 + i * .3) % 1); persona(B, x + 2.5 - u * 2.5, 2, z + 4.5 - u * 2.5, ROPA[(i + j) % 12], { s: .55 }); } }); };
    return { s, c, upd(t) { reloj(20); panel(0); B.ini(); colegios(false, true, t); B.fin(); F.ini(); F.fin(); mira(c, [ex(-3.7), 64, ez(40.4) + 72], [ex(-3.7), 4, ez(40.4)], .13); },
      acc: {
        // la península (20:00, colegios cerrados) y la cámara viaja a Canarias (19:00, gente votando)
        husos(lt, dur, t) { reloj(20); panel(0); B.ini(); colegios(false, true, t); B.fin(); F.ini(); F.fin(); const q = ss(clamp((lt - .8) / (dur * .6), 0, 1));
          mira(c, [lerp(ex(-3.7), ex(-15.8), q), 64, lerp(ez(40.4) + 72, ez(28.2) + 72, q)], [lerp(ex(-3.7), ex(-15.8), q), 4, lerp(ez(40.4), ez(28.2), q)], .13); },
        // las nueve: cierran en Canarias y los datos vuelan de todas partes al pantallón, que se llena de barras
        nueve(lt, dur, t) { const k = clamp(lt / 1, 0, 1); reloj(20 + k * .999); const on = lt > 1.1; B.ini(); colegios(false, !on, t); B.fin();
          F.ini(); if (on) POL.forEach(([x, z], i) => flujo(F, [[x, 7, z], [lerp(x, ex(-3.7), .5), 24, lerp(z, ez(43.6) - 12, .5)], [ex(-3.7), 18, ez(43.6) - 12]], 4, t + i * .2, 40, P.yellow, 1.1)); F.fin();
          panel(on ? clamp((lt - 1.4) / 2, 0, 1) : 0); const q = ss(clamp(lt / 1.6, 0, 1));
          mira(c, [lerp(ex(-15.8), ex(-7), q), lerp(64, 150, q), lerp(ez(28.2) + 72, ez(34) + 50, q)], [lerp(ex(-15.8), ex(-7), q), 4, lerp(ez(28.2), ez(39.5), q)], lerp(.13, .1, q)); },
      } };
  },
  // —— 29-N 3: la mesa electoral cuenta las papeletas a mano; luego llegan las sacas del voto exterior y el viernes 4 ——
  mesa_recuento: () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(0x262b44); s.fog = new THREE.Fog(0x262b44, 150, 300);
    luces(s, { cielo: 0xfff4e0, suelo: 0x3a4466, amb: 1.35, sol: 0xfff1d6, int: 2.0, dir: [-30, 80, 70], sombra: 80 });
    const v = new Vox(); v.box(-70, -1, -40, 70, 0, 50, (x, y, z) => (z & 3) ? P.tan : P.brown);
    v.box(-70, 0, -42, 70, 55, -38, (x, y) => y < 14 ? P.lime : (y === 14 ? P.dgreen : P.sand)); for (let x = -54; x < 60; x += 22) { v.box(x, 22, -38, x + 12, 40, -37, P.white); v.box(x + 1, 23, -38, x + 11, 39, -36, 0x0b1a3a); }
    v.box(-26, 10, -12, 26, 12, 4, P.silver); for (const [x, z] of [[-24, -10], [23, -10], [-24, 1], [23, 1]]) v.box(x, 0, z, x + 1, 10, z + 1, P.steel);   // mesa
    v.box(-3, 12, -8, 4, 21, -2, 0xdfeaff); v.box(-4, 21, -9, 5, 22, -1, P.steel); v.box(-1, 21, -6, 2, 22, -4, P.ink);   // urna
    s.add(v.build({ jit: .04 }));
    const cal = pantalla(10, 10, 60, 60); cal.m.position.set(25, 30, -37.8); s.add(cal.m);
    const sacas = []; for (let i = 0; i < 4; i++) { const m = actor('saca', .9); s.add(m); sacas.push(m); }
    const B = new Bloques(420), G = new Bloques(60); s.add(B.im, G.im);
    const c = cam(46);
    const COLS = [P.blue, P.red, P.lime, P.plum, P.amber];
    const calendario = (dia) => { const { g, cv, tex } = cal; if (cal._k === dia) return; cal._k = dia; g.fillStyle = '#ffffff'; g.fillRect(0, 0, 60, 60); g.fillStyle = '#e43b44'; g.fillRect(0, 0, 60, 16);
      g.fillStyle = '#ffffff'; g.font = 'bold 12px monospace'; g.textAlign = 'center'; g.fillText(dia === 4 ? 'VIERNES' : 'DOMINGO', 30, 12); g.fillStyle = '#181425'; g.font = 'bold 30px monospace'; g.fillText(String(dia), 30, 46); g.font = 'bold 9px monospace'; g.fillText(dia === 4 ? 'DICIEMBRE' : 'NOVIEMBRE', 30, 57); tex.needsUpdate = true; };
    const mesa = (n, t, mano) => { persona(B, -16, 0, -17, P.navy, { s: 3.5, pelo: P.ink }); persona(B, 0, 0, -18, P.crimson, { s: 3.5, pelo: P.amber }); persona(B, 16, 0, -17, P.teal, { s: 3.5, pelo: P.dbrown });
      for (let i = 0; i < n; i++) { const p = i % 5, h = Math.floor(i / 5); B.pon(-16 + p * 8, 12.3 + h * .32, 0, 4.2, .28, 3, P.white); B.pon(-16 + p * 8 - 1.2, 12.33 + h * .32, 0, 1.2, .3, 1, COLS[p]); }
      if (mano) { const u = (t * 2.2) % 1, p = Math.floor(t * 2.2) % 5; B.pon(lerp(.5, -16 + p * 8, u), 22 + Math.sin(u * Math.PI) * 6, lerp(-5, 0, u), 3.4, .3, 2.4, P.white); B.pon(lerp(.5, -16 + p * 8, u) - 1, 22.1 + Math.sin(u * Math.PI) * 6, lerp(-5, 0, u), 1, .3, .9, COLS[p]); } };
    const ocultaSacas = () => sacas.forEach(m => m.visible = false);
    return { s, c, upd(t) { calendario(29); ocultaSacas(); B.ini(); mesa(60, t, false); B.fin(); G.ini(); G.fin(); mira(c, [0, 40, 92], [0, 16, -6], .07); },
      acc: {
        // los tres de la mesa sacan las papeletas una a una y las montañas crecen
        a_mano(lt, dur, t) { calendario(29); ocultaSacas(); B.ini(); mesa(Math.round(lerp(10, 120, clamp(lt / dur, 0, 1))), t, true); B.fin(); G.ini(); G.fin();
          const q = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-14, 6, q), lerp(42, 36, q), lerp(84, 74, q)], [0, 15, -4], .07); },
        // llegan las sacas del voto exterior y el calendario salta al viernes 4
        oficial(lt, dur, t) { calendario(lt > dur * .72 ? 4 : 29); B.ini(); mesa(120, t, false); B.fin(); G.ini(); G.fin();
          sacas.forEach((m, i) => { m.visible = true; const u = ss(clamp((lt - i * .35) / 1.1, 0, 1)); m.position.set(lerp(80, 50 - i * 8, u), 5 + Math.abs(Math.sin(u * Math.PI * 3)) * (1 - u) * 4, -24 + (i % 2) * 5); m.rotation.y = i; });
          mira(c, [26, 46, 96], [22, 14, -12], .08); },
        fin_recuento(lt, dur, t) { calendario(4); B.ini(); mesa(120, t, false); B.fin(); sacas.forEach((m, i) => { m.visible = true; m.position.set(50 - i * 8, 5, -24 + (i % 2) * 5); m.rotation.y = i; }); mira(c, [16, 48, 110], [14, 14, -12], .1); },
      } };
  },
});
// —— Copa Davis: tenistas genéricos, la ponchera de 1900 y el trofeo con sus bases ——
// tenista (alto ~19): hijo 'brazo' (pivote en el hombro derecho, con raqueta) que se balancea
function tenistaV(cam, pan, pelo = P.dbrown) { const w = new THREE.Group(), v = new Vox();
  v.box(-3, 0, -1, -1, 2, 2, P.white); v.box(1, 0, -1, 3, 2, 2, P.white); v.box(-3, 2, -1, -1, 7, 1, P.skin); v.box(1, 2, -1, 3, 7, 1, P.skin);
  v.box(-3, 7, -1, 3, 10, 1, pan); v.box(-3, 10, -1, 3, 15, 1, cam); v.box(-4, 11, -1, -3, 15, 1, cam); v.box(-4, 8, -1, -3, 11, 1, P.skin);
  v.box(-2, 15, -1, 2, 19, 2, P.skin); v.box(-2, 18, -1, 2, 20, 2, pelo); v.box(-2, 15, -1, 2, 18, -1, pelo); v.set(-1, 17, 1, P.ink); v.set(1, 17, 1, P.ink);
  w.add(v.build({ jit: .04 }));
  const a = new Vox(); a.box(0, -4, 0, 1, 0, 1, cam); a.box(0, -7, 0, 1, -4, 1, P.skin); a.box(0, -9, 0, 1, -7, 1, P.ink); for (let y = -15; y <= -9; y++) for (let x = -2; x <= 2; x++) if (Math.abs(x) === 2 || y === -15 || y === -9 || ((x + y) & 1)) a.set(x, y, 0, Math.abs(x) === 2 || y === -15 || y === -9 ? P.red : P.white);
  const ag = a.build({ jit: .03 }); const piv = new THREE.Group(); piv.add(ag); piv.position.set(3.5, 14.5, 0); piv.name = 'brazo'; w.add(piv); return w; }
Object.assign(FAB, {
  tenista_r: () => tenistaV(P.red, P.yellow, P.ink),
  tenista_a: () => tenistaV(P.navy, P.white, P.amber),
  // ponchera de plata de 1900 (cuenco ancho con pie y asas)
  ponchera: () => { const v = new Vox(); v.cyl(0, 0, 0, 1, 5, P.silver); v.cyl(0, 0, 1, 4, 2, P.steel); v.cyl(0, 0, 4, 5, 4, P.silver);
    for (let y = 5; y < 13; y++) { const r = 5 + (y - 5) * .75; for (let x = -Math.ceil(r); x <= r; x++) for (let z = -Math.ceil(r); z <= r; z++) { const d = Math.hypot(x, z); if (d <= r && d > r - 1.3) v.set(x, y, z, (y === 8 && (Math.atan2(z, x) * 4 | 0) % 2) ? P.white : P.silver); else if (d <= r - 1.3 && y === 5) v.set(x, y, z, P.steel); } }
    for (const sx of [-1, 1]) { v.box(sx * 11 - (sx > 0 ? 0 : 1), 9, 0, sx * 11 + (sx > 0 ? 2 : -1) , 10, 1, P.silver); v.box(sx > 0 ? 12 : -13, 10, 0, sx > 0 ? 13 : -12, 12, 1, P.silver); }
    const g = new THREE.Group(); g.add(v.build({ jit: .05, centrar: true })); return g; },
  // el trofeo de hoy: la ponchera sobre la bandeja de 1920 y las bases de madera con placas
  ensaladera: () => { const v = new Vox(); v.cyl(0, 0, 0, 6, 14, P.dbrown); v.cyl(0, 0, 6, 12, 11, P.brown); for (let a = 0; a < 24; a++) { const an = a / 24 * Math.PI * 2; v.set(Math.round(Math.cos(an) * 11.5), 3, Math.round(Math.sin(an) * 11.5), P.amber); v.set(Math.round(Math.cos(an) * 10.5), 9, Math.round(Math.sin(an) * 10.5), P.amber); }
    v.cyl(0, 0, 12, 13, 13, P.silver); v.cyl(0, 0, 13, 15, 4, P.steel);
    for (let y = 15; y < 25; y++) { const r = 5 + (y - 15) * .7; for (let x = -Math.ceil(r); x <= r; x++) for (let z = -Math.ceil(r); z <= r; z++) { const d = Math.hypot(x, z); if (d <= r && d > r - 1.3) v.set(x, y, z, y === 19 ? P.white : P.silver); } }
    v.luz(P.amber); const g = new THREE.Group(); g.add(v.build({ jit: .05, centrar: true })); return g; },
});
Object.assign(FABE, {
  // —— Davis 1: la pista azul cubierta de Bolonia, gradas llenas y el marcador colgado ——
  pista_bolonia: () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(0x0b0b16); s.fog = new THREE.Fog(0x0b0b16, 170, 340);
    luces(s, { cielo: 0xf4f8ff, suelo: 0x262b44, amb: 1.35, sol: 0xffffff, int: 2.0, dir: [-20, 100, 40], sombra: 90 });
    const v = new Vox(); v.box(-40, -1, -50, 40, 0, 50, P.navy); v.box(-12, 0, -25, 12, .1, 25, P.blue);
    v.box(-12, 0, -25, 12, 0, 25, P.blue);
    for (let z = -25; z <= 24; z++) { v.set(-12, 0, z, P.white); v.set(11, 0, z, P.white); v.set(-9, 0, z, P.white); v.set(8, 0, z, P.white); }
    for (let x = -12; x <= 11; x++) { v.set(x, 0, -25, P.white); v.set(x, 0, 24, P.white); }
    for (let x = -9; x <= 8; x++) { v.set(x, 0, -13, P.white); v.set(x, 0, 12, P.white); } for (let z = -13; z <= 12; z++) v.set(0, 0, z, P.white);
    for (let x = -13; x <= 12; x++) { v.set(x, 3, 0, P.white); for (let y = 1; y < 3; y++) if ((x + y) & 1) v.set(x, y, 0, P.ink); } v.box(-14, 0, 0, -13, 4, 1, P.steel); v.box(13, 0, 0, 14, 4, 1, P.steel);
    // gradas a los lados y al fondo
    for (let k = 0; k < 8; k++) { v.box(-40 - k * 3, k * 3, -50, -37 - k * 3, k * 3 + 3, 50, P.dslate); v.box(37 + k * 3, k * 3, -50, 40 + k * 3, k * 3 + 3, 50, P.dslate); v.box(-62, k * 3, -53 - k * 3, 62, k * 3 + 3, -50 - k * 3, P.dslate); }
    s.add(v.build({ jit: .04 }));
    const pub = new Bloques(900); s.add(pub.im); pub.ini(); for (let k = 0; k < 8; k++) for (let i = 0; i < 34; i++) { const z = -48 + i * 3; const c1 = ROPA[(i * 7 + k * 3) % 12]; pub.pon(-38.5 - k * 3, k * 3 + 4, z, 1.6, 2, 1.6, c1); pub.pon(38.5 + k * 3, k * 3 + 4, z, 1.6, 2, 1.6, ROPA[(i * 5 + k) % 12]); }
    for (let k = 0; k < 8; k++) for (let i = 0; i < 40; i++) pub.pon(-60 + i * 3, k * 3 + 4, -51.5 - k * 3, 1.6, 2, 1.6, ROPA[(i * 3 + k * 5) % 12]); pub.fin();
    const mar = pantalla(30, 13, 180, 78); mar.m.position.set(0, 52, -60); s.add(mar.m); const mv = new Vox(); mv.box(-16, 44, -62, 17, 60, -61, P.ink); s.add(mv.build({ jit: .02 }));
    const j1 = actor('tenista_r', .55), j2 = actor('tenista_a', .55); s.add(j1, j2); const b1 = j1.getObjectByName('brazo'), b2 = j2.getObjectByName('brazo'); j2.rotation.y = Math.PI;
    const B = new Bloques(260, true); s.add(B.im);
    const c = cam(46);
    let res = ['ESP', 'GBR', '0', '0'];
    const marcador = (l1, l2, hi) => { const { g, cv, tex } = mar; const k = l1 + l2 + hi; if (mar._k === k) return; mar._k = k; g.fillStyle = '#181425'; g.fillRect(0, 0, 180, 78);
      g.font = 'bold 22px monospace'; g.textAlign = 'center'; g.fillStyle = hi ? '#fee761' : '#ffffff'; g.fillText(l1, 90, 32); g.fillStyle = '#2ce8f5'; g.fillText(l2, 90, 64); tex.needsUpdate = true; };
    // peloteo: la bola va de un fondo a otro (periodo 1,3 s) y los jugadores la siguen
    const juego = (t, fin) => { const P0 = 1.3, n = Math.floor(t / P0), u = (t % P0) / P0, ida = n % 2 === 0, xa = Math.sin(n * 2.7) * 7, xb = Math.sin((n + 1) * 2.7) * 7;
      const za = ida ? 24 : -24, zb = ida ? -24 : 24, bx = lerp(xa, xb, u), bz = lerp(za, zb, u), by = 5 + Math.sin(u * Math.PI) * 9 - (u > .8 ? (u - .8) * 20 : 0);
      const xn = ida ? xa : xb, xf = ida ? xb : xa; j1.position.set(lerp(j1.position.x || 0, (ida ? xa : xb) + 2, .2), 0, 27); j2.position.set(lerp(j2.position.x || 0, (ida ? xb : xa) - 2, .2), 0, -27);
      b1.rotation.z = ida && u < .2 ? -1.2 + u * 8 : .3; b2.rotation.z = !ida && u < .2 ? -1.2 + u * 8 : .3;
      if (!fin) B.pon(bx, Math.max(.6, by), bz, .9, .9, .9, P.yellow); return [bx, by, bz]; };
    return { s, c, res: (r) => { res = r; }, upd(t) { B.ini(); juego(t); B.fin(); marcador('ESP  -  GBR', 'SEMIFINAL', false); mira(c, [0, 40, 78], [0, 2, -4], .1); },
      acc: {
        // último punto: la bola pasa, el jugador de rojo levanta los brazos y cae confeti
        punto(lt, dur, t) { B.ini(); const f = lt > 1.2; juego(f ? 1.2 * 1.3 + .4 : lt * 1.3, f); if (f) { b1.rotation.z = Math.PI * .95; j1.position.y = Math.abs(Math.sin((lt - 1.2) * 6)) * 1.5;
            for (let i = 0; i < 120; i++) { const ph = ((lt - 1.2) * .5 + hsh(i, 1, 1)) % 1; B.pon(-30 + hsh(i, 2, 1) * 60, 50 - ph * 50, -30 + hsh(i, 3, 1) * 60, .7, .7, .7, [P.red, P.yellow, P.white, P.cyan][i % 4]); } }
          B.fin(); marcador('ESP  -  GBR', 'SEMIFINAL', false); const q = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-6, 6, q), lerp(34, 30, q), lerp(80, 70, q)], [0, 4, 4], .1); },
        peloteo(lt, dur, t) { B.ini(); juego(t); B.fin(); marcador('ESP  -  GBR', 'SEMIFINAL', false); mira(c, [Math.sin(t * .2) * 8, 40, 78], [0, 2, -4], .1); },
        // la cámara sube al marcador con el resultado
        marcador(lt, dur, t) { B.ini(); juego(t, true); B.fin(); marcador(res[0], res[1], true); const q = ss(clamp(lt / 1.4, 0, 1)); mira(c, [0, lerp(40, 46, q), lerp(78, 20, q)], [0, lerp(4, 48, q), lerp(-4, -60, q)], lerp(.1, .06, q)); },
      } };
  },
  // —— Davis 2: Boston, 1900: un jardín con pista de hierba y la ponchera de plata en una mesa ——
  boston_1900: () => {
    const s = new THREE.Scene(); s.background = cielo([0xd8c39a, 0xead4aa, 0xf3e6c8]); s.fog = new THREE.Fog(0xead4aa, 150, 300);
    luces(s, { cielo: 0xfff4dc, suelo: 0x6b5e40, amb: 1.4, sol: 0xfff1d0, int: 2.0, dir: [40, 80, 50], sombra: 80 });
    const v = new Vox(); v.box(-80, -1, -60, 80, 0, 60, (x, y, z) => ((z >> 2) & 1) ? 0x7fa860 : 0x6f9a52);
    for (let z = -25; z <= 24; z++) { v.set(-12, 0, z, P.white); v.set(11, 0, z, P.white); } for (let x = -12; x <= 11; x++) { v.set(x, 0, -25, P.white); v.set(x, 0, 24, P.white); v.set(x, 0, 12, P.white); v.set(x, 0, -13, P.white); }
    for (let x = -13; x <= 12; x++) { v.set(x, 3, 0, P.white); for (let y = 1; y < 3; y++) if ((x + y) & 1) v.set(x, y, 0, P.dslate); }
    v.box(-40, 0, -70, 40, 30, -60, P.white); v.box(-42, 30, -72, 42, 34, -58, P.dbrown); for (let x = -36; x < 40; x += 10) v.box(x, 8, -60, x + 5, 20, -59, P.dslate);   // casa del club
    for (const [x, z] of [[-50, -40], [50, -30], [-56, 10], [54, 20]]) { v.box(x, 0, z, x + 2, 12, z + 2, P.dbrown); v.ball(x + 1, 18, z + 1, 7, P.dgreen); }
    v.box(20, 0, 30, 36, 8, 40, P.white); v.box(19, 8, 29, 37, 9, 41, P.white);   // mesa con mantel
    s.add(v.build({ jit: .05 }));
    const po = actor('ponchera', .9); po.position.set(28, 15.5, 35); s.add(po);
    const j1 = actor('tenista_a', .55), j2 = actor('tenista_a', .55); j2.rotation.y = Math.PI; s.add(j1, j2); const b1 = j1.getObjectByName('brazo'), b2 = j2.getObjectByName('brazo');
    const B = new Bloques(160), L = new Bloques(40, true); s.add(B.im, L.im);
    const c = cam(46);
    const juego = (t) => { const P0 = 1.6, n = Math.floor(t / P0), u = (t % P0) / P0, ida = n % 2 === 0, xa = Math.sin(n * 2.1) * 6, xb = Math.sin((n + 1) * 2.1) * 6;
      j1.position.set((ida ? xa : xb) + 2, 0, 27); j2.position.set((ida ? xb : xa) - 2, 0, -27); b1.rotation.z = ida && u < .2 ? -1 + u * 6 : .3; b2.rotation.z = !ida && u < .2 ? -1 + u * 6 : .3;
      L.pon(lerp(xa, xb, u), 5 + Math.sin(u * Math.PI) * 10, lerp(ida ? 24 : -24, ida ? -24 : 24, u), .9, .9, .9, P.white); };
    // ponche que cae de la jarra al cuenco y el cucharón
    const ponche = (t, k) => { B.pon(28, 19 + k * 2.5, 35, 9, .6, 9, P.pink); const ang = t * 2; B.pon(34, 27 + Math.sin(ang) * 1, 33, 4, 6, 4, P.silver); for (let i = 0; i < 8; i++) { const ph = (t * 3 + i / 8) % 1; B.pon(32 - ph * 3, 26 - ph * 6, 34, .7, .9, .7, P.pink); } };
    return { s, c, upd(t) { B.ini(); B.fin(); L.ini(); juego(t); L.fin(); mira(c, [10, 34, 92], [8, 8, 10], .08); },
      acc: {
        // de cerca: una jarra llena de ponche la ponchera de plata
        ponchera(lt, dur, t) { B.ini(); ponche(t, clamp(lt / dur, 0, 1)); B.fin(); L.ini(); juego(t); L.fin(); po.rotation.y = t * .2; const q = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(36, 30, q), lerp(30, 26, q), lerp(78, 62, q)], [28, 18, 35], .06); },
        // la cámara se aleja: el primer partido, en hierba, con la ponchera junto a la pista
        boston(lt, dur, t) { B.ini(); B.fin(); L.ini(); juego(t); L.fin(); const q = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(30, 4, q), lerp(28, 40, q), lerp(70, 96, q)], [lerp(26, 4, q), lerp(16, 6, q), lerp(30, 0, q)], .08); },
      } };
  },
  // —— Davis 3: el trofeo de hoy bajo los focos, con seis placas que se encienden (los títulos de España) ——
  trofeo_davis: () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(0x120a1e); s.fog = new THREE.Fog(0x120a1e, 140, 280);
    luces(s, { cielo: 0xe8ecff, suelo: 0x262b44, amb: 1.2, sol: 0xffffff, int: 2.3, dir: [-20, 90, 60], sombra: 60 });
    const v = new Vox(); v.box(-60, -1, -50, 60, 0, 50, (x, y, z) => ((x >> 3) + (z >> 3)) & 1 ? P.plum : 0x4a2a5a); v.cyl(0, 0, 0, 8, 16, P.ink); v.cyl(0, 0, 8, 9, 17, P.amber); v.luz(P.amber); s.add(v.build({ jit: .04 }));
    const tr = actor('ensaladera', 1.25); s.add(tr); tr.position.set(0, 25, 0);
    const foco = conoLuz(0xfff1c0, 60, 18); foco.position.set(0, 70, 0); s.add(foco);
    const placas = []; for (let i = 0; i < 6; i++) { const p = pantalla(8, 4, 64, 32); const a = (i - 2.5) * .36; p.m.position.set(Math.sin(a) * 34, 6, Math.cos(a) * 34 - 8); p.m.rotation.y = a; s.add(p.m); placas.push(p); }
    const ANOS = ['2000', '2004', '2008', '2009', '2011', '2019'];
    const B = new Bloques(160, true); s.add(B.im);
    const c = cam(46);
    const enciende = (n, t) => placas.forEach((p, i) => rotular(p, [ANOS[i]], i < n ? '#181425' : '#5a6988', i < n ? '#feae34' : '#262b44', 20));
    return { s, c, upd(t) { tr.rotation.y = t * .4; enciende(0, t); B.ini(); B.fin(); mira(c, [0, 34, 92], [0, 20, 0], .08); },
      acc: {
        // las seis placas de los títulos de España se encienden una a una
        seis(lt, dur, t) { tr.rotation.y = t * .5; const n = Math.min(6, Math.floor(lt / (dur * .6) * 6) + 1); enciende(n, t); B.ini(); for (let i = 0; i < 40; i++) { const ph = (t * .4 + hsh(i, 1, 2)) % 1; B.pon(Math.cos(i * 2.4) * (8 + ph * 18), 30 + ph * 24, Math.sin(i * 2.4) * (8 + ph * 18), .6, .6, .6, i % 2 ? P.yellow : P.white); } B.fin();
          const q = ss(clamp(lt / dur, 0, 1)); mira(c, [lerp(-10, 10, q), lerp(30, 34, q), lerp(86, 92, q)], [0, 16, 0], .08); },
        trofeo_fin(lt, dur, t) { tr.rotation.y = t * .5; enciende(6, t); B.ini(); B.fin(); mira(c, [16, 40, 104], [0, 18, 0], .1); },
      } };
  },
});
