// three3d.js — capa 3D (Three.js) del motor Pixel RPG.
// Cada objeto 3D se renderiza a baja resolución con sombreado "toon", se lee de vuelta (readPixels) y se
// convierte a la paleta indexada con trama Bayer: así el 3D queda integrado en el pixel art (épocas, transiciones,
// zooms y capas siguen funcionando igual). Todo depende solo del tiempo t: mismo t → mismo fotograma.
import * as THREE from './vendor/three.module.js';
import { C, T, RGB, NPAL, PROTECT, bayer } from './px.js';

const MAX = 360;
const cv = document.createElement('canvas'); cv.width = MAX; cv.height = MAX;
let renderer = null;
try { renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: false, alpha: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(1); }
catch (e) { console.warn('sin WebGL: los objetos 3D se dibujan en 2D', e); }
export const HAY3D = !!renderer;
const buf = new Uint8Array(MAX * MAX * 4);

// cuantización a la paleta: tabla 5 bits por canal
const usable = [...Array(NPAL).keys()].filter(i => !PROTECT.has(i));
const LUT5 = new Uint8Array(32 * 32 * 32);
for (let r = 0; r < 32; r++) for (let g = 0; g < 32; g++) for (let b = 0; b < 32; b++) {
  const R = r * 8 + 4, G = g * 8 + 4, B = b * 8 + 4; let best = 0, bd = 1e9;
  for (const i of usable) { const c = RGB[i], d = (R - c[0]) ** 2 * .3 + (G - c[1]) ** 2 * .59 + (B - c[2]) ** 2 * .11; if (d < bd) { bd = d; best = i; } }
  LUT5[(r << 10) | (g << 5) | b] = best;
}
const q = (r, g, b) => LUT5[((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)];
const hex = i => (RGB[i][0] << 16) | (RGB[i][1] << 8) | RGB[i][2];

// materiales toon de 3 tonos (luz, medio, sombra) con los colores de la paleta
const grad = (() => { const d = new Uint8Array([70, 160, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const MATS = {};
export function mat(ci, emis = 0) {
  const k = ci + ':' + emis; if (MATS[k]) return MATS[k];
  return (MATS[k] = new THREE.MeshToonMaterial({ color: hex(ci), gradientMap: grad, emissive: emis ? hex(ci) : 0, emissiveIntensity: emis }));
}
function luces(scene) {
  scene.add(new THREE.AmbientLight(0xffffff, .55));
  const d = new THREE.DirectionalLight(0xffffff, 2.2); d.position.set(-3, 4, 5); scene.add(d);
}

// —— modelos ——
const SCN = {};
function nueva(nombre, build) {
  if (SCN[nombre]) return SCN[nombre];
  const scene = new THREE.Scene(); luces(scene);
  const cam = new THREE.PerspectiveCamera(30, 1, .1, 100); cam.position.set(0, .5, 4.9); cam.lookAt(0, 0, 0);
  const root = new THREE.Group(); scene.add(root); build(root);
  return (SCN[nombre] = { scene, cam, root });
}
const esfera = (r, ci, seg = 18) => new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * .7)), mat(ci));
const MODELOS = {
  capsula: r => {   // Starfall: platillo de 3 m con escudo oscuro debajo y tapa clara
    const tapa = new THREE.Mesh(new THREE.LatheGeometry([[0, .55], [.55, .5], [1.1, .25], [1.55, .02]].map(([x, y]) => new THREE.Vector2(x, y)), 32), mat(C.silver));
    const escudo = new THREE.Mesh(new THREE.LatheGeometry([[1.55, .02], [1.5, -.12], [1.0, -.32], [0, -.4]].map(([x, y]) => new THREE.Vector2(x, y)), 32), mat(C.dslate));
    const banda = new THREE.Mesh(new THREE.TorusGeometry(1.55, .05, 6, 40), mat(C.orange)); banda.rotation.x = Math.PI / 2;
    const ojo = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .08, 16), mat(C.cyan, .4)); ojo.position.y = .56;
    r.add(tapa, escudo, banda, ojo); r.scale.setScalar(.95);
  },
  cohete: r => {
    const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, 2.6, 20), mat(C.white)); r.add(cuerpo);
    const punta = new THREE.Mesh(new THREE.ConeGeometry(.42, .8, 20), mat(C.white)); punta.position.y = 1.7; r.add(punta);
    const banda = new THREE.Mesh(new THREE.CylinderGeometry(.43, .43, .25, 20), mat(C.ink)); banda.position.y = .7; r.add(banda);
    const ventana = esfera(.15, C.cyan); ventana.position.set(0, .2, .4); r.add(ventana);
    for (let i = 0; i < 4; i++) { const a = new THREE.Mesh(new THREE.BoxGeometry(.06, .6, .5), mat(C.red)); a.position.set(Math.cos(i * Math.PI / 2) * .45, -1.1, Math.sin(i * Math.PI / 2) * .45); a.rotation.y = -i * Math.PI / 2; r.add(a); }
    const fuego = new THREE.Mesh(new THREE.ConeGeometry(.3, .9, 12), mat(C.orange, .9)); fuego.rotation.x = Math.PI; fuego.position.y = -1.75; fuego.name = 'fuego'; r.add(fuego);
    r.rotation.z = -.5; r.scale.setScalar(.85);
  },
  mundo: r => {   // la Tierra: océano con continentes (colores por vértice) y una capa de aire
    const g = new THREE.SphereGeometry(1.5, 48, 32), pos = g.attributes.position, col = [];
    const cO = new THREE.Color(hex(C.blue)), cT = new THREE.Color(hex(C.green)), cN = new THREE.Color(hex(C.white));
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const n = Math.sin(x * 2.1 + 1) * Math.cos(y * 2.7) + Math.sin(z * 3.1 + x) * .7; const c = Math.abs(y) > 1.35 ? cN : n > .45 ? cT : cO; col.push(c.r, c.g, c.b); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    r.add(new THREE.Mesh(g, new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: grad })));
    const aire = new THREE.Mesh(new THREE.SphereGeometry(1.6, 32, 24), new THREE.MeshBasicMaterial({ color: hex(C.cyan), transparent: true, opacity: .25, side: THREE.BackSide })); r.add(aire);
  },
  estrella: r => {   // meteoro: piedrecita incandescente con estela
    r.add(new THREE.Mesh(new THREE.IcosahedronGeometry(.45, 0), mat(C.yellow, .8)));
    for (let i = 1; i < 9; i++) { const s = esfera(.42 - i * .045, i < 3 ? C.white : i < 6 ? C.amber : C.orange, 10); s.material = mat(i < 3 ? C.white : i < 6 ? C.amber : C.orange, .9); s.position.set(i * .32, i * .22, -i * .05); r.add(s); }
    r.rotation.z = .2;
  },
  paracaidas: r => {
    const dom = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.4), mat(C.orange)); dom.position.y = .8; r.add(dom);
    for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(1.52, 2, 8, i * Math.PI / 3, Math.PI / 6, 0, Math.PI / 2.4), mat(C.white)); f.position.y = .8; r.add(f); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, x = Math.cos(a) * 1.2, z = Math.sin(a) * 1.2; const l = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, 1.9, 4), mat(C.ink)); l.position.set(x / 2, -.15, z / 2); l.lookAt(0, -1.1, 0); l.rotateX(Math.PI / 2); r.add(l); }
    const k = new THREE.Mesh(new THREE.CylinderGeometry(.45, .3, .3, 16), mat(C.silver)); k.position.y = -1.15; r.add(k);
  },
  escudo: r => { MODELOS.capsula(r); r.rotation.x = .9; },
  caja: r => { const b = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.6), mat(C.orange)); r.add(b); const c = new THREE.Mesh(new THREE.BoxGeometry(1.62, .2, 1.62), mat(C.yellow)); r.add(c); r.rotation.x = .35; },
  bomba: r => { const c = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, 2.2, 20), mat(C.red)); r.add(c);
    const a = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .8, 8), mat(C.silver)); a.position.y = 1.45; r.add(a);
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.3, .18, .25), mat(C.ink)); m.position.y = 1.85; m.name = 'mango'; r.add(m);
    const p = new THREE.Mesh(new THREE.BoxGeometry(1.4, .12, .7), mat(C.slate)); p.position.y = -1.15; r.add(p); },
  fuego: r => { for (let i = 0; i < 3; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(.8 - i * .22, 2 - i * .5, 10), mat([C.red, C.orange, C.yellow][i], .7)); f.position.y = -i * .25; f.position.z = i * .35; f.name = 'llama' + i; r.add(f); } },
};
MODELOS.granizo = r => {
  const g = new THREE.IcosahedronGeometry(1.1, 2), pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(pos, i); const k = 1 + .12 * Math.sin(v.x * 5 + v.y * 3) + .08 * Math.cos(v.z * 7); v.multiplyScalar(k); pos.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals();
  r.add(new THREE.Mesh(g, mat(C.white)));
  const capa = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25, 2), new THREE.MeshToonMaterial({ color: hex(C.cyan), gradientMap: grad, transparent: true, opacity: .35 })); r.add(capa);
  r.rotation.x = .4;
};
MODELOS.nube = r => {
  for (const [x, y, z, s] of [[0, .2, 0, 1], [-.9, -.1, .1, .75], [.9, -.1, 0, .8], [-.4, .7, -.1, .7], [.45, .65, .1, .65], [0, -.35, .3, .7]]) { const e = esfera(s, C.white, 14); e.position.set(x, y, z); r.add(e); }
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, .3, 20), mat(C.silver)); base.position.y = -.55; r.add(base);
};
export const tiene3D = n => HAY3D && !!MODELOS[n];

// pinta un objeto 3D en el framebuffer: centro (cx, cy), tamaño en px, aparición p (0..1)
export function icono3D(fb, nombre, cx, cy, size, t, p = 1) {
  if (!tiene3D(nombre) || p <= 0) return false;
  const s = nueva(nombre, MODELOS[nombre]); const S = Math.min(MAX, Math.round(size));
  s.root.rotation.y = t * .6 + (1 - p) * 2.5;                         // gira despacio (y entra girando)
  s.root.position.y = Math.sin(t * 1.3) * .08;
  const k = s.root.getObjectByName('fuego'); if (k) k.scale.y = 1 + Math.sin(t * 20) * .2;
  const m = s.root.getObjectByName('mango'); if (m) m.position.y = 1.85 - Math.abs(Math.sin(t * 2.2)) * .5;
  for (let i = 0; i < 3; i++) { const l = s.root.getObjectByName('llama' + i); if (l) l.scale.set(1 + Math.sin(t * 9 + i) * .08, 1 + Math.sin(t * 11 + i * 2) * .15, 1); }
  const sc = .3 + .7 * p; s.root.scale.multiplyScalar(1); s.cam.zoom = sc; s.cam.updateProjectionMatrix();
  renderer.setViewport(0, 0, S, S); renderer.setScissor(0, 0, S, S); renderer.setScissorTest(true);
  renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(s.scene, s.cam);
  const gl = renderer.getContext(); gl.readPixels(0, 0, S, S, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  const x0 = Math.round(cx - S / 2), y0 = Math.round(cy - S / 2);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const j = ((S - 1 - y) * S + x) * 4; if (buf[j + 3] < 128) continue;
    const X = x0 + x, Y = y0 + y, e = (bayer(X, Y) - .5) * 28;
    fb.px(X, Y, q(Math.max(0, Math.min(255, buf[j] + e)), Math.max(0, Math.min(255, buf[j + 1] + e)), Math.max(0, Math.min(255, buf[j + 2] + e))));
  }
  // contorno de tinta (estilo pixel art)
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const j = ((S - 1 - y) * S + x) * 4; if (buf[j + 3] >= 128) continue;
    const vec = (xx, yy) => xx >= 0 && yy >= 0 && xx < S && yy < S && buf[((S - 1 - yy) * S + xx) * 4 + 3] >= 128;
    if (vec(x + 1, y) || vec(x - 1, y) || vec(x, y + 1) || vec(x, y - 1)) fb.px(x0 + x, y0 + y, C.ink);
  }
  return true;
}

// —— escena 3D de moléculas para el microscopio ——
// lista de átomos [{x,y,z,r,c,emis}] en unidades de pantalla (x,y en px del fb, z profundidad -1..1)
const MS = { scene: null, cam: null, pool: [], used: 0 };
function molScene() {
  if (MS.scene) return MS;
  MS.scene = new THREE.Scene(); luces(MS.scene);
  MS.cam = new THREE.OrthographicCamera(0, 1, 0, -1, -100, 100);
  return MS;
}
export function atomos3D(fb, lista, W, H, giro = 0) {
  if (!HAY3D) return false;
  const m = molScene(); m.cam.left = 0; m.cam.right = W; m.cam.top = 0; m.cam.bottom = -H; m.cam.updateProjectionMatrix();
  m.used = 0;
  for (const a of lista) {
    let o = m.pool[m.used]; if (!o) { o = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), mat(C.blue)); m.scene.add(o); m.pool.push(o); }
    o.visible = true; o.material = mat(a.c, a.emis || 0); o.position.set(a.x, -a.y, a.z * 40); o.scale.setScalar(a.r * 1.35); m.used++;
  }
  for (let i = m.used; i < m.pool.length; i++) m.pool[i].visible = false;
  const w = Math.min(MAX, W), h = Math.min(MAX, H);
  renderer.setViewport(0, 0, w, h); renderer.setScissor(0, 0, w, h); renderer.setScissorTest(true);
  renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(m.scene, m.cam);
  const gl = renderer.getContext(); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const j = ((h - 1 - y) * w + x) * 4; if (buf[j + 3] < 128) continue;
    const e = (bayer(x, y) - .5) * 24;
    fb.px(x, y, q(Math.max(0, Math.min(255, buf[j] + e)), Math.max(0, Math.min(255, buf[j + 1] + e)), Math.max(0, Math.min(255, buf[j + 2] + e))));
  }
  return true;
}
