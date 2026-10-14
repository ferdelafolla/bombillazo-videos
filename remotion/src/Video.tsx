// Composición Chispazo: fondo de papel amarillo con grano, mundo en plano secuencia (cámara con zoom
// de ida y vuelta entre escenas), Chispa y subtítulos fijos en pantalla, pausa de suscripción y cierre.
import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { construir, Datos, Formato, FPS, Seg } from './timeline';
import { EscenaArte, BotonSub, Pill, pop } from './Escenas';
import { Chispa } from './Chispa';
import { P, FT, clamp, lerp, easeInOut, expoOut, easeOut, boil, fit } from './tinta';

export type VideoProps = { datos: Datos; formato: Formato; short: number };

const LAY = {
  largo: { W: 1920, H: 1080, cx: 960, cy: 468, z: 1.32, chispa: [150, 968, 0.42], caps: { left: 300, right: 300, top: 968, h: 84, fs: 58, max: 40 }, marca: [40, 32], barra: [0, 1068, 1920] },
  short: { W: 1080, H: 1920, cx: 495, cy: 735, z: 0.985, chispa: [170, 1310, 0.5], caps: { left: 290, right: 150, top: 1190, h: 110, fs: 60, max: 20 }, marca: [60, 250], barra: [80, 1468, 850] },
} as const;

let VERT = false;
const mundo = (i: number): [number, number] => VERT ? [(i % 2) * 700 - (i % 4 === 3 ? 1400 : 0), i * 1150] : [i * 1500, (i % 2) * 900 - (i % 4 === 3 ? 1800 : 0)];
const TR_ANTES = 0.35, TR_DESPUES = 0.5;

function camara(escenas: Seg[], t: number, zBase: number) {
  let j = 0;
  for (let i = 0; i < escenas.length; i++) if (escenas[i].start - TR_ANTES <= t) j = i;
  const s = escenas[j];
  const deriva = (k: number, tt: number) => { const e = escenas[k]; const q = clamp((tt - e.start) / e.dur); return zBase * (1 + 0.035 * (k % 2 ? 1 - q : q)); };
  const [x1, y1] = mundo(s.idx);
  const fin = s.start + TR_DESPUES;
  // apertura en macro (×2) sobre el primer dibujo, que se abre al conjunto
  const macro = j === 0 ? lerp(2, 1, expoOut(clamp((t - 0.5) / 1.6))) : 1;
  if (j === 0 || t >= fin) return { x: x1, y: y1, z: deriva(j, t) * macro, j, trans: 0 };
  const pr = escenas[j - 1];
  const [x0, y0] = mundo(pr.idx);
  const p = clamp((t - (s.start - TR_ANTES)) / (TR_ANTES + TR_DESPUES));
  const zA = deriva(j - 1, pr.start + pr.dur), zB = deriva(j, t);
  const fuera = j % 2 === 0; // alterna: alejarse y volver / acercarse y asentarse
  const q = clamp(p / 0.85);
  const mv = easeInOut(q);
  const m = Math.pow(Math.sin(Math.PI * q), 0.8);
  const zMed = fuera ? 0.5 : 0.72;
  const base = lerp(zA, zB, mv);
  const over = fuera ? 1 : 1 + 0.09 * clamp((q - 0.6) / 0.4) * (1 - expoOut((p - 0.85) / 0.15));
  const z = base * lerp(1, zMed, m) * over;
  return { x: lerp(x0, x1, mv), y: lerp(y0, y1, mv), z, j, trans: p };
}

const silabas = (w: string) => Math.max(1, (w.match(/[aeiouáéíóúü]+/gi) || []).length);
const norm = (w: string) => w.toLowerCase().replace(/[¿?¡!,.:;…]/g, '');

// Subtítulo de UNA sola línea, centrada, que cambia al ritmo de la voz; dentro de la línea, las palabras aparecen una a una
function lineas(words: string[], max: number) {
  const total = words.join(' ').length;
  const n = Math.max(1, Math.ceil(total / max));
  const obj = total / n;
  const out: number[][] = [[]];
  let len = 0;
  words.forEach((w, i) => {
    const cur = out[out.length - 1];
    if (cur.length && (len + 1 + w.length > max || len >= obj * 1.05)) { out.push([i]); len = w.length; return; }
    cur.push(i); len += (cur.length > 1 ? 1 : 0) + w.length;
    if (/[,.;:?!…]$/.test(w) && len >= obj * 0.6 && i < words.length - 1) { out.push([]); len = 0; }
  });
  return out.filter((l) => l.length);
}

const Subtitulo: React.FC<{ s: Seg; t: number; lay: (typeof LAY)['largo'] | (typeof LAY)['short'] }> = ({ s, t, lay }) => {
  const e = s.escena!;
  const lt = t - s.start;
  const words = e.texto.split(/\s+/);
  const hl = new Set((e.destacar || []).map(norm));
  const syl = words.map(silabas);
  const tot = syl.reduce((a, b) => a + b, 0);
  const habla = s.vozDur * 0.9;
  const at: number[] = []; let acc = 0;
  syl.forEach((x) => { at.push(0.05 + (acc / tot) * habla); acc += x; });
  const ls = lineas(words, lay.caps.max);
  let k = 0;
  for (let i = 0; i < ls.length; i++) if (i === 0 || lt >= at[ls[i][0]] - 0.05) k = i;
  const linea = ls[k];
  const largo = Math.max(...ls.map((l) => l.map((i) => words[i]).join(' ').length));
  const ancho = 1920 - lay.caps.left - lay.caps.right > 1300 ? 0 : lay.W - lay.caps.left - lay.caps.right;
  const fs = Math.min(lay.caps.fs, (ancho || lay.W - lay.caps.left - lay.caps.right) / (largo * 0.56));
  const iniLinea = k === 0 ? 0 : at[linea[0]] - 0.05;
  const ent = clamp((lt - iniLinea) / 0.12);
  const salida = clamp((s.dur - lt) / 0.16);
  return (
    <div style={{ position: 'absolute', left: lay.caps.left, right: lay.caps.right, top: lay.caps.top, height: lay.caps.h, display: 'flex', flexWrap: 'nowrap', whiteSpace: 'nowrap', alignItems: 'center', justifyContent: 'center', gap: `0 ${fs * 0.16}px`,
      fontFamily: FT.texto, fontWeight: 700, fontSize: fs, lineHeight: 1, color: P.INK, opacity: salida * (0.3 + 0.7 * ent), transform: `translateY(${(1 - ent) * 10 + (1 - salida) * -10}px)` }}>
      {linea.map((i) => {
        const q = clamp((lt - at[i]) / 0.14);
        return (
          <span key={i} style={{ color: P.INK, opacity: 0.22 + 0.78 * q, display: 'inline-block', transform: `scale(${1 + 0.08 * Math.sin(q * Math.PI)})`, padding: '0 0.06em', borderRadius: '0.2em', background: hl.has(norm(words[i])) ? `linear-gradient(transparent 12%, ${P.Y} 12%, ${P.Y} 92%, transparent 92%) no-repeat 0 0 / ${clamp((lt - at[i]) / 0.3) * 100}% 100%` : 'none' }}>{words[i]}</span>
        );
      })}
    </div>
  );
};

const Marca: React.FC<{ x: number; y: number; serie: string; s: number }> = ({ x, y, serie, s }) => (
  <div style={{ position: 'absolute', left: x, top: y, transform: `scale(${s})`, transformOrigin: 'left top', background: P.INK, color: P.Y, borderRadius: 40, padding: '10px 26px 10px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
    <span style={{ fontSize: 34 }}>💡</span>
    <span style={{ fontFamily: FT.titulo, fontSize: 38, letterSpacing: 1 }}>CHISPAZO</span>
    <span style={{ fontFamily: FT.texto, fontWeight: 600, fontSize: 24, letterSpacing: 3, color: P.PAPER }}>{serie}</span>
  </div>
);

export const ChispazoVideo: React.FC<VideoProps> = ({ datos, formato, short }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame / FPS;
  const lay = LAY[formato];
  const v = formato === 'short';
  const { segs } = React.useMemo(() => construir(datos, formato, short), [datos, formato, short]);
  const escenas = segs.filter((s) => s.kind === 'escena');
  VERT = v;
  const cam = camara(escenas, t, lay.z);
  const actual = [...segs].reverse().find((s) => s.start <= t) || segs[0];
  const overlay = actual.kind !== 'escena' ? actual : null;
  const seg = escenas[cam.j];
  // amplitud de la voz (boca)
  const vozSeg = actual;
  const ampArr = datos.amp[vozSeg.voz] || [];
  const ai = Math.floor((t - vozSeg.start + vozSeg.vozDesde) * FPS);
  const amp = t - vozSeg.start < vozSeg.vozDur ? (ampArr[ai] ?? 0) : 0;
  const enSub = seg.escena?.tipo === 'suscribete' && t >= seg.start - 0.2;
  const visibles = [cam.j - 1, cam.j, cam.j + 1].filter((k) => k >= 0 && k < escenas.length && (k !== cam.j - 1 || cam.trans > 0) && (k !== cam.j + 1 || t > escenas[k].start - TR_ANTES - 0.4));
  const seed = boil(frame) % 7;
  const tr = `translate(${lay.cx} ${lay.cy}) scale(${cam.z}) translate(${-cam.x} ${-cam.y})`;
  // overlay: entra empujando desde abajo y sale hacia arriba
  let oy = 0;
  if (overlay) {
    const lt = t - overlay.start;
    const fin = overlay.kind === 'final' ? 99 : overlay.dur - lt;
    oy = lt < 0.4 ? (1 - expoOut(lt / 0.4)) * lay.H : fin < 0.35 ? -Math.pow(1 - clamp(fin / 0.35), 2) * lay.H : 0;
  }
  const ocultarFijos = overlay && Math.abs(oy) < lay.H * 0.5;
  return (
    <AbsoluteFill style={{ background: P.BG }}>
      <svg width={lay.W} height={lay.H} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <filter id="wob" filterUnits="userSpaceOnUse" x={-60} y={-60} width={lay.W + 120} height={lay.H + 120}>
            <feTurbulence type="fractalNoise" baseFrequency={0.022} numOctaves={2} seed={seed} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={4.5} xChannelSelector="R" yChannelSelector="G" result="w" />
            <feTurbulence type="fractalNoise" baseFrequency={0.85} numOctaves={1} seed={seed + 11} result="r" />
            <feDisplacementMap in="w" in2="r" scale={3} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <g filter="url(#wob)">
          <g transform={tr}>
            {visibles.map((k) => {
              const s = escenas[k];
              const [wx, wy] = mundo(s.idx);
              const lt = Math.min(t - s.start, s.dur + 0.5);
              return (
                <g key={k} transform={`translate(${wx} ${wy})`}>
                  <EscenaArte e={s.escena!} t={lt} dur={s.vozDur} v={v} amp={k === cam.j ? amp : 0} />
                </g>
              );
            })}
          </g>
          {!enSub && !ocultarFijos && (
            <g transform={`translate(${lay.chispa[0]} ${lay.chispa[1]}) scale(${lay.chispa[2]})`}>
              <Chispa t={t} amp={actual.kind === 'escena' ? amp : 0} />
            </g>
          )}
        </g>
      </svg>
      {!ocultarFijos && actual.kind === 'escena' && actual.escena!.tipo !== 'suscribete' && <Subtitulo s={actual} t={t} lay={lay} />}
      {overlay && <Overlay seg={overlay} t={t - overlay.start} oy={oy} v={v} amp={amp} lay={lay} seed={seed} />}
      <Marca x={lay.marca[0]} y={lay.marca[1]} serie={datos.guion.serie} s={v ? 1 : 0.9} />
      <div style={{ position: 'absolute', left: lay.barra[0], top: lay.barra[1], width: lay.barra[2], height: v ? 8 : 10, background: 'rgba(22,20,18,.15)', borderRadius: 6 }}>
        <div style={{ width: `${(frame / durationInFrames) * 100}%`, height: '100%', background: P.RED, borderRadius: 6 }} />
      </div>
      <Img src={staticFile(`img/grano${boil(frame) % 3}.png`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'multiply', opacity: 0.45 }} />
    </AbsoluteFill>
  );
};

const Overlay: React.FC<{ seg: Seg; t: number; oy: number; v: boolean; amp: number; lay: (typeof LAY)['largo'] | (typeof LAY)['short']; seed: number }> = ({ seg, t, oy, v, amp, lay }) => {
  const cx = lay.W === 1920 ? 960 : 495;
  const cy = v ? 860 : 500;
  const tap = seg.dur * 0.62;
  const flecha = clamp((t - 0.7) / 0.5);
  return (
    <div style={{ position: 'absolute', inset: 0, transform: `translateY(${oy}px)`, background: P.BG, borderTop: oy > 0 ? `8px solid ${P.INK}` : 'none' }}>
      <svg width={lay.W} height={lay.H} style={{ position: 'absolute', inset: 0 }}>
        <g filter="url(#wob)">
          {seg.kind === 'sub' ? (
            <g transform={`translate(${cx} ${cy})`}>
              <Pill x={0} y={v ? -420 : -360} txt="¿QUIERES SABER MÁS?" fs={v ? 66 : 70} fill={P.BLUE} ink={P.PAPER} t={t} at={0.25} rot={-2} />
              <g transform={`translate(0 ${v ? -60 : -50}) scale(${v ? 1.15 : 1.0})`}><Chispa t={t} amp={amp} wave={clamp((t - 0.3) * 2)} /></g>
              <BotonSub t={t} tap={tap} y={v ? 300 : 300} at={0.45} />
            </g>
          ) : (
            <g transform={`translate(${cx} ${cy})`}>
              {seg.remate && <Pill x={0} y={-500} w={820} h={96} txt={seg.remate} fs={fit(seg.remate, 760, 60, 0.6)} fill={P.RED} ink={P.PAPER} t={t} at={0.1} rot={1.5} />}
              <Pill x={0} y={-380} txt="VÍDEO COMPLETO" fs={78} t={t} at={0.35} rot={-2} />
              <Pill x={0} y={-275} txt="EN EL CANAL" fs={60} fill={P.GREEN} ink={P.PAPER} t={t} at={0.55} rot={1.5} />
              <g transform="translate(0 0) scale(1.1)"><Chispa t={t} amp={amp} point={clamp((t - 0.5) * 2)} /></g>
              <path d="M150,-170 C260,-150 300,-60 280,60 M245,25 L280,62 L318,22" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - flecha} stroke={P.RED} strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <BotonSub t={t} tap={seg.dur - 0.6} y={330} at={0.8} />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};

export { pop, easeOut };
