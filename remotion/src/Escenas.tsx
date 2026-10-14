// Escenas de datos en estilo tinta. Cada escena se dibuja en su caja local centrada en (0,0):
// horizontal 1000×700, vertical 880×820. t = segundos desde el inicio de la escena.
import React from 'react';
import { Img, staticFile } from 'remotion';
import { Escena } from './timeline';
import { DIBUJO, POP } from './timeline';
import { Icono } from './iconos';
import { Chispa } from './Chispa';
import { P, FT, TARJ, clamp, backOut, easeOut, fit } from './tinta';

type Props = { e: Escena; t: number; dur: number; v: boolean; amp: number };

const limpiar = (s: string) => s.replace(/[¿?¡!,.:;…]/g, '').toUpperCase();

export const pop = (t: number, at: number, d = 0.42) => {
  const q = clamp((t - at) / d);
  return { s: 0.82 + 0.18 * backOut(q, 2.2), o: clamp(q * 3) };
};

export const Pill: React.FC<{ x: number; y: number; txt: string; fs: number; fill?: string; ink?: string; t: number; at: number; rot?: number; w?: number; h?: number }> = ({ x, y, txt, fs, fill = P.Y, ink = P.INK, t, at, rot = 0, w, h }) => {
  const { s, o } = pop(t, at);
  const W = w ?? txt.length * fs * 0.62 + fs * 1.3;
  const H = h ?? fs * 1.55;
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} opacity={o}>
      <rect x={-W / 2} y={-H / 2} width={W} height={H} rx={Math.min(H / 2, 34)} fill={fill} stroke={P.INK} strokeWidth={6} />
      <text x={0} y={0} dy="0.36em" textAnchor="middle" fontFamily={FT.titulo} fontSize={fs} fill={ink}>{txt}</text>
    </g>
  );
};

const Titulo: React.FC<Props> = ({ e, t, v }) => {
  const txt = e.texto_grande || limpiar((e.destacar || [''])[0]);
  const p = (t - DIBUJO.retraso) / DIBUJO.icono;
  const breathe = 1 + 0.015 * Math.sin(t * 2.4) * clamp(p - 1);
  return (
    <g>
      <g transform={`translate(0,${v ? -120 : -80}) scale(${breathe})`}><Icono nombre={e.icono || 'bombilla'} p={p} tam={v ? 440 : 400} /></g>
      <Pill x={0} y={v ? 270 : 245} txt={txt} fs={fit(txt, v ? 760 : 860, 96)} t={t} at={0.75} rot={-2} />
    </g>
  );
};

const Tarjetas: React.FC<Props> = ({ e, t, v }) => {
  const items = e.items || [];
  const n = items.length;
  const conIcono = !!e.icono;
  const pos: { x: number; y: number; w: number; h: number }[] = [];
  if (n === 4) {
    const w = v ? 400 : 440, h = 150;
    items.forEach((_, i) => pos.push({ x: (i % 2 ? 1 : -1) * (w / 2 + 20), y: (i < 2 ? -1 : 1) * (h / 2 + 18), w, h }));
  } else if (v || (n > 1 && Math.max(...items.map((x) => x.length)) * n > 30)) {
    items.forEach((_, i) => pos.push({ x: 0, y: (i - (n - 1) / 2) * (v ? 175 : 150), w: v ? 760 : 680, h: v ? 145 : 125 }));
  } else {
    const w = n === 1 ? 760 : Math.min(440, (1000 - (n - 1) * 40) / n);
    items.forEach((_, i) => pos.push({ x: (i - (n - 1) / 2) * (w + 40), y: 0, w, h: n === 1 ? 200 : 170 }));
  }
  const dy = conIcono ? (v ? 150 : 110) : 0;
  return (
    <g>
      {conIcono && <g transform={`translate(0,${v ? -230 : -190})`}><Icono nombre={e.icono!} p={(t - DIBUJO.retraso) / 1.0} tam={v ? 260 : 230} /></g>}
      {items.map((it, i) => (
        <Pill key={i} x={pos[i].x} y={pos[i].y + dy} w={pos[i].w} h={pos[i].h} txt={it} fs={fit(it, pos[i].w - 70, 84)} fill={TARJ[i % TARJ.length][0]} ink={TARJ[i % TARJ.length][1]} t={t} at={POP.primero + i * POP.paso} rot={i % 2 ? 1.5 : -1.5} />
      ))}
    </g>
  );
};

const Cifra: React.FC<Props> = ({ e, t, v }) => {
  const val = e.valor || '';
  const ic = !!e.icono;
  const ancho = ic && !v ? 600 : v ? 820 : 940;
  const fs = fit(val, ancho, 230, 0.6);
  const cx = ic && !v ? 190 : 0, cy = ic && v ? 30 : -30;
  const { s, o } = pop(t, 0.3, 0.5);
  const und = clamp((t - 0.9) / 0.45);
  const uw = Math.min(ancho, val.length * fs * 0.55) / 2;
  return (
    <g>
      {ic && <g transform={v ? 'translate(0,-250)' : 'translate(-360,-20)'}><Icono nombre={e.icono!} p={(t - DIBUJO.retraso) / 1.0} tam={v ? 270 : 300} /></g>}
      {und > 0 && (
        <path d={`M${cx - uw},${cy + fs * 0.3} q${uw * 0.5},-16 ${uw},0 t${uw},0`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - und}
          stroke={P.Y} strokeWidth={26} fill="none" strokeLinecap="round" />
      )}
      <g transform={`translate(${cx},${cy}) scale(${s})`} opacity={o}>
        <text x={0} y={0} dy="0.36em" textAnchor="middle" fontFamily={FT.titulo} fontSize={fs} fill={P.INK}>{val}</text>
      </g>
      {e.etiqueta && <Pill x={cx} y={cy + fs * 0.62 + 90} txt={e.etiqueta} fs={fit(e.etiqueta, 560, 64)} fill={P.BLUE} ink={P.PAPER} t={t} at={1.1} rot={1.5} />}
    </g>
  );
};

const FORMAS: Record<string, { d: string; fin: [number, number] }> = {
  sube: { d: 'M-400,220 C-250,200 -150,150 -50,60 S200,-150 400,-230', fin: [400, -230] },
  cae: { d: 'M-400,-60 C-300,-120 -150,-200 60,-215 C140,-218 180,-150 230,40 S330,220 400,230', fin: [400, 230] },
  pico: { d: 'M-400,210 C-200,200 -120,160 -40,40 C0,-80 20,-225 60,-225 C110,-225 130,-60 180,90 S320,215 400,215', fin: [400, 215] },
  suave: { d: 'M-400,120 C-250,40 -150,-150 0,-150 C150,-150 250,-40 400,10', fin: [400, 10] },
};

const Grafica: React.FC<Props> = ({ e, t }) => {
  const f = FORMAS[e.forma || 'sube'];
  const a = clamp((t - DIBUJO.retraso) / 0.5);
  const l = easeOut((t - DIBUJO.retraso - 0.5) / 1.2);
  const et = e.etiquetas || [];
  const dot = pop(t, 1.75, 0.35);
  const pulse = 1 + 0.12 * Math.max(0, Math.sin((t - 2.1) * 4)) * (t > 2.1 ? 1 : 0);
  const [fx, fy] = f.fin;
  const lx = Math.min(fx - 120, 300), ly = clamp(fy < 0 ? fy + 95 : fy - 90, -280, 280);
  return (
    <g>
      <path d="M-430,-280 V270 H450" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - a} stroke={P.INK} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {et[1] && (
        <g opacity={clamp((t - 0.6) * 3)}>
          <path d="M-410,60 H430" stroke={P.BLUE} strokeWidth={8} strokeDasharray="22 18" fill="none" />
          <Pill x={-300} y={110} txt={et[1]} fs={48} fill={P.BLUE} ink={P.PAPER} t={t} at={0.7} />
        </g>
      )}
      {l > 0 && <path d={`${f.d} L${fx},270 L-400,270 Z`} fill={P.LBLUE} opacity={clamp((l - 0.85) / 0.15) * 0.8} />}
      {l > 0 && <path d={f.d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - l} stroke={P.RED} strokeWidth={16} fill="none" strokeLinecap="round" />}
      <g transform={`translate(${fx},${fy}) scale(${dot.s * pulse})`} opacity={dot.o}><circle r={20} fill={P.RED} stroke={P.INK} strokeWidth={6} /></g>
      {et[0] && <Pill x={lx} y={ly} txt={et[0]} fs={fit(et[0], 420, 64)} t={t} at={1.9} rot={-2} />}
    </g>
  );
};

const Comparar: React.FC<Props> = ({ e, t, v }) => {
  const w = v ? 380 : 400, h = v ? 300 : 260, x = v ? 215 : 255;
  const vs = clamp((t - 0.2) / 0.5);
  const vsPop = pop(t, 0.55);
  return (
    <g>
      <Pill x={-x} y={0} w={w} h={h} txt={e.izq || ''} fs={fit(e.izq || '', w - 70, 92)} fill={P.BLUE} ink={P.PAPER} t={t} at={POP.primero} rot={-2} />
      <Pill x={x} y={0} w={w} h={h} txt={e.der || ''} fs={fit(e.der || '', w - 70, 92)} fill={P.RED} ink={P.PAPER} t={t} at={POP.primero + 0.6} rot={2} />
      <path d="M-62,0 a62,62 0 1,0 124,0 a62,62 0 1,0 -124,0" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - vs} stroke={P.INK} strokeWidth={8} fill={P.Y} fillOpacity={clamp(vs * 2 - 1)} />
      <g transform={`scale(${vsPop.s})`} opacity={vsPop.o}><text dy="0.36em" textAnchor="middle" fontFamily={FT.titulo} fontSize={58} fill={P.INK}>VS</text></g>
    </g>
  );
};

const IconoGrande: React.FC<Props> = ({ e, t, v }) => {
  const p = (t - DIBUJO.retraso) / DIBUJO.icono;
  const b = 1 + 0.02 * Math.sin(t * 2.2) * clamp(p - 1);
  return <g transform={`translate(0,${v ? -10 : 0}) scale(${b})`}><Icono nombre={e.icono || 'bombilla'} p={p} tam={v ? 600 : 560} /></g>;
};

export const BotonSub: React.FC<{ t: number; tap: number; x?: number; y?: number; at?: number }> = ({ t, tap, x = 0, y = 0, at = 0.5 }) => {
  const { s, o } = pop(t, at);
  const press = t > tap - 0.08 && t < tap + 0.1 ? 0.93 : 1;
  const hecho = t >= tap;
  const burst = clamp((t - tap) / 0.45);
  return (
    <g transform={`translate(${x},${y})`}>
      <g transform={`scale(${s * press})`} opacity={o}>
        <rect x={-290} y={-72} width={580} height={144} rx={72} fill={P.RED} stroke={P.INK} strokeWidth={8} />
        <text dy="0.36em" textAnchor="middle" fontFamily={FT.titulo} fontSize={66} fill={P.PAPER}>{hecho ? 'SUSCRITO ✓' : 'SUSCRÍBETE'}</text>
      </g>
      {burst > 0 && burst < 1 && [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = (i / 8) * Math.PI * 2, r0 = 200 + burst * 90, r1 = r0 + 50 * (1 - burst);
        return <line key={i} x1={Math.cos(a) * r0 * 1.5} y1={Math.sin(a) * r0 * 0.6} x2={Math.cos(a) * r1 * 1.5} y2={Math.sin(a) * r1 * 0.6} stroke={i % 2 ? P.RED : P.INK} strokeWidth={10} strokeLinecap="round" />;
      })}
    </g>
  );
};

const Suscribete: React.FC<Props> = ({ t, dur, v, amp }) => {
  const tap = dur * 0.55;
  const ch = pop(t, 0.05, 0.5);
  return (
    <g>
      <g transform={`translate(0,${v ? -150 : -110}) scale(${(v ? 1.15 : 1.0) * ch.s})`} opacity={ch.o}><Chispa t={t} amp={amp} wave={clamp((t - 0.4) * 2)} /></g>
      <BotonSub t={t} tap={tap} y={v ? 270 : 250} />
    </g>
  );
};

// Foto real pasada a tinta, a casi todo el plano, con zoom lento (Ken Burns), marco de tinta y crédito
const Foto: React.FC<Props> = ({ e, t, dur, v }) => {
  const W = v ? 870 : 1000, H = v ? 800 : 560;
  const ent = pop(t, 0.0, 0.5);
  const k = 1 + 0.12 * clamp(t / Math.max(1, dur + 0.5));
  return (
    <g>
      <g transform={`rotate(${v ? -1.5 : -1.2}) scale(${ent.s})`} opacity={ent.o}>
        <clipPath id={`cf_${e.foto}`}><rect x={-W / 2} y={-H / 2} width={W} height={H} rx={18} /></clipPath>
        <g clipPath={`url(#cf_${e.foto})`}>
          <foreignObject x={-W / 2} y={-H / 2} width={W} height={H}>
            <Img src={staticFile(`fotos/${e.foto}.jpg`)} style={{ width: W, height: H, objectFit: 'cover', objectPosition: e.encuadre || '50% 50%', transform: `scale(${k})`, transformOrigin: '50% 45%' }} />
          </foreignObject>
        </g>
        <rect x={-W / 2} y={-H / 2} width={W} height={H} rx={18} fill="none" stroke={P.INK} strokeWidth={12} />
        {e.credito && <text x={W / 2 - 16} y={H / 2 - 18} textAnchor="end" fontFamily={FT.texto} fontWeight={600} fontSize={v ? 22 : 20} fill={P.PAPER} stroke={P.INK} strokeWidth={4} paintOrder="stroke">{e.credito}</text>}
      </g>
      {e.etiqueta && <Pill x={0} y={-H / 2 + (v ? 40 : 20)} txt={e.etiqueta} fs={fit(e.etiqueta, W * 0.7, v ? 70 : 60)} t={t} at={0.8} rot={-2} />}
    </g>
  );
};

export const EscenaArte: React.FC<Props> = (p) => {
  switch (p.e.tipo) {
    case 'titulo': return <Titulo {...p} />;
    case 'tarjetas': return <Tarjetas {...p} />;
    case 'cifra': return <Cifra {...p} />;
    case 'grafica': return <Grafica {...p} />;
    case 'comparar': return <Comparar {...p} />;
    case 'suscribete': return <Suscribete {...p} />;
    case 'foto': return <Foto {...p} />;
    default: return <IconoGrande {...p} />;
  }
};
