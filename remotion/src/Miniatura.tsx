// Miniatura de YouTube (1280×720) para el vídeo largo: titular grande, icono del tema y Chispa.
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { Icono } from './iconos';
import { Chispa } from './Chispa';
import { P } from './tinta';
import { continueRender, delayRender } from 'remotion';

const SANS = "'ChispaSans', Inter, 'Helvetica Neue', Arial, sans-serif";
if (typeof document !== 'undefined') {
  const h = delayRender('inter');
  new FontFace('ChispaSans', `url(${staticFile('fonts/Inter-ExtraBold.otf')})`, { weight: '800' }).load().then((f) => { document.fonts.add(f); continueRender(h); }).catch(() => continueRender(h));
}

export type MiniProps = { arriba: string; abajo: string; icono: string; serie: string; grafica?: boolean };

export const Miniatura: React.FC<MiniProps> = ({ arriba, abajo, icono, serie, grafica }) => (
  <AbsoluteFill style={{ background: P.BG }}>
    <svg width={1280} height={720} style={{ position: 'absolute', inset: 0 }}>
      <g transform="translate(990 290) rotate(8)"><Icono nombre={icono} p={1} tam={440} /></g>
      {grafica && <>
      <path d="M70,650 H780" stroke={P.INK} strokeWidth={8} strokeLinecap="round" />
      <path d="M70,640 V440" stroke={P.INK} strokeWidth={8} strokeLinecap="round" />
      <path d="M80,630 C250,620 330,600 420,520 C480,460 520,420 560,420 C600,420 620,520 650,600 S720,640 770,640" transform="translate(0,-10)" stroke={P.RED} strokeWidth={16} fill="none" strokeLinecap="round" />
      <circle cx={560} cy={410} r={18} fill={P.RED} stroke={P.INK} strokeWidth={6} />
      </>}
      <g transform="translate(1080 560) scale(0.62) rotate(-6)"><Chispa t={0.6} amp={0.8} sorpresa={1} /></g>
    </svg>
    <div style={{ position: 'absolute', left: 56, top: 120, width: 760, display: 'flex', flexDirection: 'column', gap: 26, alignItems: 'flex-start' }}>
      <div style={{ fontFamily: SANS, fontWeight: 800, letterSpacing: '-0.02em', fontSize: 88, lineHeight: 1.0, color: P.INK, transform: 'rotate(-2deg)' }}>{arriba}</div>
      <div style={{ fontFamily: SANS, fontWeight: 800, letterSpacing: '-0.02em', fontSize: 112, lineHeight: 1.0, color: P.INK, background: P.Y, border: `6px solid ${P.INK}`, padding: '14px 34px 10px', borderRadius: 30, transform: 'rotate(-2deg)' }}>{abajo}</div>
    </div>
    <div style={{ position: 'absolute', left: 56, top: 40, background: P.RED, color: P.PAPER, borderRadius: 30, padding: '6px 22px', fontFamily: SANS, fontWeight: 800, fontSize: 32, border: `5px solid ${P.INK}` }}>CHISPAZO {serie}</div>
    <Img src={staticFile('img/grano0.png')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'multiply', opacity: 0.45 }} />
  </AbsoluteFill>
);
