// Chispa (estilo tinta): bombilla amarilla redonda, ojos cerrados en arco, nariz "<",
// sonrisa roja que se abre al hablar y casquillo a rayas. Portada de engine/characters.js.
import React from 'react';
import { P } from './tinta';
const YC = '#f5bd22';

export const Chispa: React.FC<{ t: number; amp?: number; wave?: number; point?: number; sorpresa?: number }> = ({ t, amp = 0, wave = 0, point = 0, sorpresa = 0 }) => {
  const v = Math.max(0, Math.min(1, amp));
  const bob = Math.sin(t * 2.4) * 6 - v * 4;
  const breath = 1 + Math.sin(t * 2.2) * 0.012;
  const headRot = Math.sin(t * 1.7) * 2 + v * 3 * Math.sin(t * 9);
  const blink = t % 3.3 < 0.12 ? 0.1 : 1;
  const o = Math.max(v, sorpresa * 0.45);
  const dy = 30 + o * 34;
  const mouth = o > 0.06 ? `M-38,4 Q0,${4 + dy} 38,4 Q0,${4 + o * 8} -38,4Z` : 'M-38,4 Q0,34 38,4';
  const arm = -wave * (20 + Math.sin(t * 12) * 18) - point * 40;
  const eyeS = `scale(${1 + sorpresa * 0.18},${blink * (1 + sorpresa * 0.22)})`;
  return (
    <g>
      <ellipse cx={0} cy={172} rx={80} ry={12} fill={P.INK} opacity={0.18} />
      <g transform={`translate(0,${bob}) translate(0,160) scale(1,${breath * (1 + v * 0.02)}) translate(0,-160) rotate(${Math.sin(t * 1.3) * 2})`}>
        <g transform={`translate(84,6) rotate(${arm})`}>
          <path d="M0,0 q50,-6 74,-56" stroke={P.INK} strokeWidth={30} fill="none" strokeLinecap="round" />
          <path d="M0,0 q50,-6 74,-56" stroke={YC} strokeWidth={14} fill="none" strokeLinecap="round" />
        </g>
        <rect x={-44} y={54} width={88} height={104} rx={30} fill={YC} stroke={P.INK} strokeWidth={9} />
        <path d="M-40,84 H40 M-42,108 H42 M-40,132 H40" stroke={P.INK} strokeWidth={8} strokeLinecap="round" />
        <g transform={`rotate(${headRot})`}>
          <circle cx={0} cy={-48} r={118} fill={YC} stroke={P.INK} strokeWidth={9} />
          <g transform={`translate(-44,-56) ${eyeS} translate(44,56)`}>
            <path d="M-62,-62 q18,20 36,0" stroke={P.INK} strokeWidth={8} fill="none" strokeLinecap="round" />
          </g>
          <g transform={`translate(44,-56) ${eyeS} translate(-44,56)`}>
            <path d="M26,-62 q18,20 36,0" stroke={P.INK} strokeWidth={8} fill="none" strokeLinecap="round" />
          </g>
          <path d="M8,-40 L-10,-26 L10,-16" stroke={P.INK} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d={mouth} stroke={P.RED} strokeWidth={9} fill={o > 0.06 ? P.RED : 'none'} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
    </g>
  );
};
