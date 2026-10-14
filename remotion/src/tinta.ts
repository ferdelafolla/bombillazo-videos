import { continueRender, delayRender, staticFile } from 'remotion';

// Fondo blanco, línea negra, AMARILLO para resaltar y acentos de colores (policromático)
export const P = { BG: '#fffdf8', BG2: '#f6f2e8', Y: '#f7d94c', Y2: '#f3cf3d', INK: '#161412', RED: '#e63b2e', PAPER: '#ffffff',
  BLUE: '#2f6fdc', LBLUE: '#cfe4ff', GREEN: '#2fa35a', LGREEN: '#c9ebc4', ORANGE: '#f28c28', PURPLE: '#8a4fd1', TEAL: '#1aa7a1', PINK: '#ef6aa0', SKIN: '#f6c9a0', BROWN: '#8b5a2b', GRAY: '#e3e6ec' };
// colores de las tarjetas, por turnos: [relleno, texto]
export const TARJ: [string, string][] = [[P.Y, P.INK], [P.BLUE, P.PAPER], [P.GREEN, P.PAPER], [P.ORANGE, P.INK], [P.PURPLE, P.PAPER], [P.RED, P.PAPER]];

export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeInOut = (t: number) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const expoOut = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(t)));
// "pop" con rebote suave: 0 → 1 con ligero sobrepaso
export const backOut = (t: number, k = 1.7) => { t = clamp(t); const c3 = k + 1; return 1 + c3 * Math.pow(t - 1, 3) + k * Math.pow(t - 1, 2); };

// tiempo "a saltos" de 12 fps para el temblor de la tinta
export const boil = (frame: number) => Math.floor(frame / 2);

const fuentes: [string, string, string][] = [
  ['Vemoly', 'fonts/VemolyChispazo.ttf', '400'],
  ['Fredoka', 'fonts/Fredoka-Bold.woff', '700'],
  ['Fredoka', 'fonts/Fredoka-SemiBold.woff', '600'],
];
if (typeof document !== 'undefined') {
  const h = delayRender('fuentes');
  Promise.all(fuentes.map(([fam, url, w]) => new FontFace(fam, `url(${staticFile(url)})`, { weight: w }).load().then((f) => { document.fonts.add(f); })))
    .then(() => continueRender(h))
    .catch((e) => { console.error(e); continueRender(h); });
}

export const FT = { titulo: "'Vemoly', 'Fredoka', sans-serif", texto: "'Fredoka', sans-serif" };

// texto que cabe en un ancho: tamaño aproximado por número de caracteres
export const fit = (txt: string, ancho: number, max: number, k = 0.62) => Math.min(max, ancho / Math.max(1, txt.length * k));
