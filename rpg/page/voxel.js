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

// —— escenarios ——
const ESC = {};
const FABE = {
  aeropuerto: () => {
    const s = new THREE.Scene(); s.background = cielo([P.ink, P.night, P.plum, P.rose]); s.fog = new THREE.Fog(0x3a2a4a, 60, 220);
    luces(s, { cielo: 0x8a7ab8, suelo: 0x262b44, amb: .9, sol: 0xc8d0ff, int: 1.2, dir: [40, 60, 30] });
    const v = new Vox();
    v.box(-90, -1, -90, 90, 0, 40, (x, y, z) => Math.abs(z) <= 7 ? P.night : P.dslate);                 // suelo y pista
    for (let x = -90; x < 90; x += 6) v.box(x, -1, 0, x + 3, 0, 1, P.white);                             // línea central
    for (let x = -90; x < 90; x += 2) { v.set(x, -1, -7, P.silver); v.set(x, -1, 7, P.silver); }
    v.box(-60, 0, -48, 10, 9, -34, P.slate); v.box(-62, 9, -50, 12, 10, -32, P.dslate);                  // terminal
    for (let x = -58; x < 8; x += 3) for (const y of [2, 5]) v.box(x, y, -34, x + 2, y + 2, -33, (hsh(x, y, 1) > .25) ? P.amber : P.navy);
    for (let i = 0; i < 26; i++) { const x = -40 + Math.floor(hsh(i, 9, 9) * 120), z = -80 - Math.floor(hsh(i, 8, 8) * 20), h = 6 + Math.floor(hsh(i, 7, 7) * 26); v.box(x, 0, z, x + 8, h, z + 8, P.night);   // ciudad al fondo
      for (let y = 2; y < h - 1; y += 3) if (hsh(i, y, 3) > .5) v.set(x + 3, y, z + 8, P.amber); }
    v.luz(P.cyan, P.amber);
    s.add(v.build());
    const luzP = new Vox(), luzA = new Vox();   // luces de pista que parpadean por turnos
    for (let x = -90; x < 90; x += 8) { luzP.set(x, 0, -8, P.cyan); luzP.set(x, 0, 8, P.cyan); luzA.set(x + 4, 0, -8, P.amber); luzA.set(x + 4, 0, 8, P.amber); }
    luzP.luz(P.cyan); luzA.luz(P.amber); const g1 = luzP.build(), g2 = luzA.build(); s.add(g1, g2);
    const av = [-20, 30].map((x, i) => { const m = modelo('avion').clone(); m.scale.setScalar(.55); m.position.set(x, 5, -22); m.children[0].rotation.set(0, i ? Math.PI : 0, 0); s.add(m); return m; });
    estrellas(s, 180, 200, 20);
    const c = cam(42);
    return { s, c, upd(t) { g1.visible = Math.floor(t * 2) % 2 === 0; g2.visible = !g1.visible;
      const x = Math.sin(t * .06) * 22; c.position.set(x, 9, 44); c.lookAt(x * .6, 7, -10); } };
  },
  radar: () => {
    const s = new THREE.Scene(); s.background = new THREE.Color(P.ink); s.fog = new THREE.Fog(P.ink, 40, 110);
    luces(s, { cielo: 0x4a6a5a, suelo: 0x181425, amb: .7, sol: 0x9fe8b0, int: .9, dir: [10, 40, 40], sombra: 40 });
    const v = new Vox();
    v.box(-40, -1, -30, 40, 0, 30, (x, y, z) => ((x >> 2) + (z >> 2)) % 2 ? P.night : P.dslate);          // suelo
    v.box(-40, 0, -16, 40, 34, -14, P.night);                                                            // pared
    for (let i = -3; i <= 3; i++) { const x = i * 10 - 4;                                               // consolas
      v.box(x, 0, -2, x + 8, 5, 4, P.slate); v.box(x, 5, 0, x + 8, 9, 2, P.dslate);
      v.box(x + 1, 6, 2, x + 7, 8, 3, (xx, yy) => (hsh(xx, yy, i) > .5 ? P.lime : P.dgreen));
      for (let k = 0; k < 6; k++) v.set(x + 1 + k, 5, 3, [P.amber, P.red, P.lime][(k + i + 9) % 3]); }
    v.luz(P.lime, P.amber, P.red); s.add(v.build());
    const tc = document.createElement('canvas'); tc.width = tc.height = 96; const tg = tc.getContext('2d');
    const tex = new THREE.CanvasTexture(tc); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.colorSpace = THREE.SRGBColorSpace;
    const pan = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.MeshBasicMaterial({ map: tex })); pan.position.set(0, 18, -13.9); s.add(pan);
    const marco = new Vox(); marco.box(-14, 4, -15, 14, 32, -14, P.slate); s.add(marco.build());
    const glow = new THREE.PointLight(0x63c74d, 30, 40, 1.6); glow.position.set(0, 18, -6); s.add(glow);
    const c = cam(48);
    return { s, c, upd(t) {
      tg.fillStyle = '#0b1a12'; tg.fillRect(0, 0, 96, 96); tg.strokeStyle = '#265c42'; tg.lineWidth = 1;
      for (let k = 1; k <= 4; k++) { tg.beginPath(); tg.arc(48, 48, k * 11, 0, Math.PI * 2); tg.stroke(); }
      tg.beginPath(); tg.moveTo(4, 48); tg.lineTo(92, 48); tg.moveTo(48, 4); tg.lineTo(48, 92); tg.stroke();
      const a = t * 1.6; for (let d = 0; d < 20; d++) { tg.strokeStyle = `rgba(99,199,77,${(1 - d / 20) * .8})`; tg.beginPath(); tg.moveTo(48, 48); tg.lineTo(48 + Math.cos(a - d * .03) * 44, 48 + Math.sin(a - d * .03) * 44); tg.stroke(); }
      for (let i = 0; i < 9; i++) { const b = hsh(i, 4, 1) * Math.PI * 2 + t * .02 * (i % 2 ? 1 : -1), r = 8 + hsh(i, 5, 1) * 36; const x = 48 + Math.cos(b) * r, y = 48 + Math.sin(b) * r;
        const da = ((a - b) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2); tg.fillStyle = da < 1.4 ? '#bfff9f' : '#3e8948'; tg.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3); }
      tex.needsUpdate = true; glow.intensity = 24 + Math.sin(t * 3) * 6;
      const z = 46 - Math.sin(t * .05) * 6; c.position.set(Math.sin(t * .08) * 6, 14, z); c.lookAt(0, 15, -10); } };
  },
  aerovias: () => {
    const s = new THREE.Scene(); s.background = cielo([P.navy, P.blue, P.cyan, 0xd8f6ff]); s.fog = new THREE.Fog(0xbfe8ff, 120, 360);
    luces(s, { cielo: 0xd8f0ff, suelo: 0x3e8948, amb: 1.2, sol: 0xfff3d0, int: 2.4, dir: [-40, 80, 50], sombra: 120 });
    const tierra = new Vox(); for (let x = -40; x < 40; x++) for (let z = -40; z < 20; z++) { const f = hsh(x >> 2, 0, z >> 2); tierra.set(x, 0, z, f > .66 ? P.lime : f > .33 ? P.green : f > .1 ? P.sand : P.blue); }
    const gt = tierra.build({ jit: .03, sombra: false }); gt.scale.setScalar(6); gt.position.set(0, -70, -60); s.add(gt);
    const nubes = []; for (let i = 0; i < 9; i++) { const n = new Vox(); for (let k = 0; k < 4; k++) n.ball(k * 4 - 6, (k % 2) * 2, 0, 4 + (k % 3), P.white); const g = n.build({ jit: .03 }); g.position.set(-110 + i * 28, -18 + (i % 3) * 22, -40 - (i % 4) * 20); g.scale.setScalar(1.4); s.add(g); nubes.push(g); }
    const carriles = []; const NIV = [-6, 6, 18, 30];
    NIV.forEach((y, i) => { const l = new Vox(), c = i % 2 ? P.cyan : P.orange; for (let x = -140; x < 140; x += 4) l.set(x, y - 4, 0, c); l.luz(c); s.add(l.build());
      for (let j = 0; j < 2; j++) { const m = modelo('avion').clone(); m.scale.setScalar(.38); m.children[0].rotation.set(0, i % 2 ? Math.PI : 0, 0); m.position.set(0, y, 0); s.add(m); carriles.push({ m, y, dir: i % 2 ? -1 : 1, off: j * 140 + i * 37 }); } });
    const c = cam(46);
    return { s, c, upd(t) { carriles.forEach(o => { const x = ((o.off + t * 14 * o.dir) % 280 + 280) % 280 - 140; o.m.position.x = x; });
      nubes.forEach((n, i) => { n.position.x = ((-110 + i * 28 + t * 2) % 260 + 260) % 260 - 130; });
      c.position.set(Math.sin(t * .05) * 10, 12, 92); c.lookAt(0, 12, 0); } };
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
export const voxTiene = n => HAYVOX && !!FABE[n];
function esc(n) { return ESC[n] || (ESC[n] = FABE[n]()); }

// —— pasada de objetos: cámara ortográfica en coordenadas del búfer (x → derecha, y → abajo) ——
const PS = new THREE.Scene();
{ PS.add(new THREE.HemisphereLight(0xeef4ff, 0x3a4466, 1.3)); const d = new THREE.DirectionalLight(0xffffff, 2.2); d.position.set(-.6, .9, 1); PS.add(d); }
const PC = new THREE.OrthographicCamera(0, W, 0, -H, -500, 500); PC.position.z = 200;
const POOL = {}; let usados = {};
function instancia(nombre) { const n = (usados[nombre] = (usados[nombre] || 0) + 1); const L = POOL[nombre] || (POOL[nombre] = []); if (!L[n - 1]) { const m = nombre === 'chispa' ? chispaVox() : modelo(nombre).clone(); PS.add(m); L.push(m); } return L[n - 1]; }

let actual = null;
export function voxFrame(lugar) { actual = lugar; for (const k in POOL) POOL[k].forEach(m => m.visible = false); usados = {}; }
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
  const e = esc(actual); e.upd(t);
  R.clear(); R.render(e.s, e.c); R.clearDepth(); R.render(PS, PC);
  return cv;
}
export function voxApagar() { actual = null; }
