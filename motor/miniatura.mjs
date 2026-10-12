// Miniatura 1080x1920 en estilo TINTA: la pregunta del vídeo + Chispa, amarillo, negro y rojo.
// Uso: node miniatura.mjs "¿Pregunta?" aldia|news|curiosidades|peques|chess salida.png
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const [q, tema, out] = process.argv.slice(2);
const SERIE = { aldia: 'HOY', news: 'NEWS', curiosidades: 'CURIOSIDADES', peques: 'PEQUES', chess: 'CHESS' }[tema] || '';
const Y = '#f7d94c', K = '#161412', R = '#e63b2e', B = '#f5bd22';
// la pregunta: la palabra más larga en rojo (acento único)
const words = q.split(/\s+/);
const clean = (w) => w.replace(/[^\p{L}]/gu, '');
const longest = words.reduce((a, w) => (clean(w).length > clean(a).length ? w : a), '');
const qHtml = words.map((w) => (w === longest ? `<span style="color:${R}">${w}</span>` : w)).join(' ');
const size = q.length > 34 ? 118 : q.length > 22 ? 134 : 150;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Vemoly;src:url(file://${HERE}/fonts/VemolyChispazo.ttf)}
body{margin:0;width:1080px;height:1920px;background:${Y};font-family:Vemoly,sans-serif;position:relative;overflow:hidden;color:${K}}
</style></head><body>
<svg width="0" height="0" style="position:absolute"><filter id="wob"><feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="7" xChannelSelector="R" yChannelSelector="G"/></filter></svg>
<div style="position:absolute;left:70px;top:110px;background:${K};border-radius:60px;padding:18px 40px;font-size:54px;color:${Y}">Chispazo <span style="font-size:40px;letter-spacing:4px">${SERIE}</span></div>
<div style="position:absolute;left:60px;right:60px;top:380px;text-align:center;font-size:${size}px;line-height:1.08">${qHtml}</div>
<svg style="position:absolute;left:250px;top:1080px;filter:url(#wob)" width="580" height="700" viewBox="-150 -180 300 360">
  <ellipse cx="0" cy="168" rx="80" ry="12" fill="${K}" opacity=".18"/>
  <rect x="-44" y="54" width="88" height="104" rx="30" fill="${B}" stroke="${K}" stroke-width="9"/>
  <path d="M-40,84 H40 M-42,108 H42 M-40,132 H40" stroke="${K}" stroke-width="8" stroke-linecap="round"/>
  <circle cx="0" cy="-48" r="118" fill="${B}" stroke="${K}" stroke-width="9"/>
  <path d="M-62,-62 q18,20 36,0 M26,-62 q18,20 36,0" stroke="${K}" stroke-width="8" fill="none" stroke-linecap="round"/>
  <path d="M8,-40 L-10,-26 L10,-16" stroke="${K}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M-38,4 Q0,34 38,4" stroke="${R}" stroke-width="9" fill="none" stroke-linecap="round"/>
</svg>
</body></html>`;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
const tmp = path.join(HERE, '.miniatura_tmp.html'); (await import('node:fs')).writeFileSync(tmp, html); await p.goto('file://' + tmp); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400); await p.screenshot({ path: out }); await b.close();
