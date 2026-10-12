// Chispazo News — What are the midterms? (for 14/10/2026). US trend: "united states midterm election".
// Sources: ABC6 fact check (435 House seats, 35 Senate races, Nov 3), Pew (cost concerns), CNN/Economist (prices).
// panel neutro de la serie (paleta fija: un solo acento por serie; los colores c1/c2 se ignoran)
function panel(A, id) { return A.panel(id); }
function cloud(A, s, x, y, k, col = '#cfd8f0') {
  const g = A.el('g', { html: `<ellipse rx="150" ry="55" fill="${col}"/><ellipse cx="-90" cy="20" rx="90" ry="45" fill="${col}"/><ellipse cx="95" cy="22" rx="100" ry="42" fill="${col}"/>` }, s);
  window.gsap.set(g, { x, y, scale: k }); return g;
}
function rain(A, s, n, t0, y0, y1, x0 = 150, x1 = 930) {
  const { el, tl, at } = A;
  for (let i = 0; i < n; i++) { const d = el('path', { d: 'M0,-22 C16,0 16,16 0,18 C-16,16 -16,0 0,-22z', fill: '#7fd4ff' }, s);
    const x = x0 + ((i * 137) % (x1 - x0));
    tl.fromTo(d, { x, y: y0, opacity: 0 }, { y: y1, opacity: 1, duration: 0.8, ease: 'power1.in', repeat: 3, repeatDelay: (i % 4) * 0.12 }, at(t0 + (i % 6) * 0.1)); }
}
function ground(A, s, col = '#6b4a32') { A.el('rect', { x: 60, y: 900, width: 960, height: 200, fill: col }, s); A.el('path', { d: 'M60,900 Q300,870 540,900 T1020,900 V920 H60z', fill: '#4f8a3c' }, s); }

function bubble(A, s, x, y, r, col = '#7fd4ff') {
  const g = A.el('g', {}, s); window.gsap.set(g, { x, y });
  A.el('circle', { r, fill: col, 'fill-opacity': 0.25, stroke: '#fff', 'stroke-width': 6, 'stroke-opacity': 0.9 }, g);
  A.el('path', { d: `M${-r * 0.55},${-r * 0.2} A${r * 0.6},${r * 0.6} 0 0 1 ${-r * 0.1},${-r * 0.6}`, stroke: '#fff', 'stroke-width': 8, fill: 'none', 'stroke-linecap': 'round', opacity: 0.8 }, g);
  return g;
}
// tarjeta en el color de acento de la serie (los colores c1/c2/ink se ignoran)
function card(A, s, x, y, w, h, c1, c2, text, size) {
  const g = A.el('g', {}, s); window.gsap.set(g, { x, y }); A.card(-w / 2, -h / 2, w, h, A.th.cardFill, 44, g); A.txt(text, 0, size * 0.36, size, A.th.cardInk, { parent: g }); return g;
}


function pin(A, s, x, y, t = 0, label = '') {
  const e = A.el('g', {}, s); window.gsap.set(e, { x, y });
  A.el('path', { d: 'M0,0 C-34,-44 -34,-90 0,-100 C34,-90 34,-44 0,0Z', fill: '#e63b2e' }, e); A.el('circle', { cy: -66, r: 14, fill: '#ffffff' }, e);
  if (label) A.txt(label, 0, 56, 46, '#161412', { parent: e });
  A.pop(e, t); return e;
}
function hemi(A, s, cx, cy, n, R0, t = 0.2, hi = 0) {
  // hemiciclo de n escaños en filas; los primeros "hi" en rojo
  const rows = 8, dots = []; let k = 0;
  for (let r = 0; r < rows; r++) { const R = R0 + r * 34; const m = Math.round(n * (R / (rows * (R0 + (rows - 1) * 17)))); }
  const per = []; let tot = 0; for (let r = 0; r < rows; r++) { const R = R0 + r * 34; per.push(R); tot += R; }
  per.forEach((R, r) => { const m = Math.round(n * R / tot); for (let i = 0; i < m && k < n; i++, k++) { const a = Math.PI - (i + 0.5) / m * Math.PI; dots.push([cx + Math.cos(a) * R, cy - Math.sin(a) * R, a]); } });
  dots.sort((p, q) => q[2] - p[2]);
  dots.forEach(([x, y], i) => { const d = A.el('circle', { cx: x, cy: y, r: 11, fill: i < hi ? '#e63b2e' : '#161412' }, s); window.gsap.set(d, { opacity: 0 }); A.tl.to(d, { opacity: 1, duration: 0.05 }, A.at(t + i * (1.2 / n))); });
}

function capitol(A, s, x, y, k = 1, t = 0) {
  const e = A.el('g', { html: '<rect x="-260" y="-60" width="520" height="160" fill="#f7d94c"/><path d="M-200,-60 V100 M-120,-60 V100 M-40,-60 V100 M40,-60 V100 M120,-60 V100 M200,-60 V100" stroke="#161412" stroke-width="10"/><path d="M-140,-60 Q-140,-250 0,-250 Q140,-250 140,-60Z" fill="#f7d94c"/><path d="M0,-250 V-310" stroke="#161412" stroke-width="10"/><circle cy="-320" r="14" fill="#e63b2e"/>' }, s);
  window.gsap.set(e, { x, y, scale: k }); A.pop(e, t); return e;
}
VIDEO({
  canal: 'news', personaje: 'chispa', lang: 'en',
  titulo: 'What are the midterms?',
  escenas: [
    { texto: 'What are the midterms, and why do they matter?', destacar: ['midterms,', 'matter?'], emocion: 'sorpresa',
      arte(A) { const s = panel(A, 'm1'); capitol(A, s, 540, 860, 1.25, 0.1); const c = card(A, s, 540, 400, 480, 140, 0, 0, 'MIDTERMS', 84); A.pop(c, 0.5); A.breathe(c, 1.2); } },
    { texto: "On November third, Americans vote halfway through the president's term.", destacar: ['November', 'halfway'], emocion: 'pensar',
      arte(A) { const s = panel(A, 'm2'); KIT.timeline(A, s, ['2024', '2026', '2028'], 820, 1, 0.2); const c = card(A, s, 540, 460, 400, 150, 0, 0, 'NOV 3', 100); A.pop(c, 0.6); } },
    { texto: 'All 435 seats in the House are on the ballot.', destacar: ['435', 'House'], emocion: 'sorpresa',
      arte(A) { const s = panel(A, 'm3'); hemi(A, s, 540, 940, 435, 140, 0.2, 0); const c = card(A, s, 540, 420, 360, 150, 0, 0, '435', 110); A.pop(c, 0.1); } },
    { texto: 'Plus 35 Senate seats and 36 governor races.', destacar: ['35', '36'], emocion: 'feliz',
      arte(A) { const s = panel(A, 's4'); const a = card(A, s, 540, 520, 560, 150, 0, 0, '35 SENATE', 84); A.pop(a, 0.1); const b = card(A, s, 540, 800, 640, 150, 0, 0, '36 GOVERNORS', 80); A.pop(b, 0.7); A.breathe(b, 1.4); } },
    { texto: "Whoever controls Congress can pass, or block, the president's plans.", destacar: ['Congress', 'block,'], emocion: 'pensar',
      arte(A) { const s = panel(A, 'm5'); capitol(A, s, 300, 880, 0.75, 0.1); KIT.person(A, s, 800, 1080, 1.0, { shirt: '#161412', style: 'short', arm: 'point', t: 0.3 });
        const p = card(A, s, 540, 420, 300, 120, 0, 0, 'PASS', 72); A.pop(p, 1.0); const b = A.txt('BLOCK', 540, 600, 72, '#e63b2e', { parent: s }); A.pop(b, 1.6); } },
    { texto: "This year, polls say prices and the cost of living top voters' worries.", destacar: ['prices', 'worries.'], emocion: 'pensar',
      arte(A) { const s = panel(A, 'm6'); KIT.coinRain(A, s, 10, 540, 860, 0.3); const tag = A.el('g', { html: '<path d="M-160,-90 H120 L190,0 L120,90 H-160Z" fill="#f7d94c"/><circle cx="110" cy="0" r="16" fill="#161412"/>' }, s);
        window.gsap.set(tag, { x: 500, y: 880 }); A.pop(tag, 0.2); A.txt('$$$', -20, 28, 80, '#e63b2e', { parent: tag }); } },
    { texto: "Historically, the president's party usually loses seats in the midterms.", destacar: ['loses', 'seats'], emocion: 'sorpresa',
      arte(A) { const s = panel(A, 'm7'); KIT.bars(A, s, [0.9, 0.7, 0.5], 240, 1030, 600, 560, ['#161412', '#161412', '#e63b2e']); KIT.arrow(A, s, 260, 420, 820, 640, '#e63b2e', 1.2); } },
    { texto: 'Fun fact: the House has had 435 seats for over a century, since 1913.', destacar: ['Fun', 'fact:', '435', '1913.'], emocion: 'sorpresa',
      arte(A) { const s = panel(A, 'v7b');
        const c = card(A, s, 540, 400, 560, 140, 0, 0, 'FUN FACT', 90); A.pop(c, 0.1);
        const a = card(A, s, 330, 760, 360, 170, 0, 0, '435', 130); A.pop(a, 0.6); A.breathe(a, 1.2);
        const b = card(A, s, 760, 760, 360, 170, 0, 0, '1913', 120); A.pop(b, 1.6); } },
    { texto: 'Subscribe for more news, and check out the channel for more explainers like this one.', destacar: ['Subscribe', 'news,'], emocion: 'feliz', transicion: 'iris',
      arte(A) { const { el, tl, at, th } = A;
        const rays = el('g', { opacity: 0.16 }); window.gsap.set(rays, { x: 540, y: 640 });
        for (let i = 0; i < 14; i++) el('path', { d: 'M0,0 L-70,-760 L70,-760 Z', fill: '#fff', transform: `rotate(${i * 25.7})` }, rays);
        tl.to(rays, { rotation: 25, svgOrigin: '0 0', duration: A.dur + 0.5, ease: 'none' }, at(0));
        A.charTo({ x: 540, y: 660, s: 1.55 }, 0.0, 0.7); A.charTo({ wave: 1 }, 0.6, 0.3);
        const btn = el('g'); window.gsap.set(btn, { x: 540, y: 1020 }); A.card(-280, -72, 560, 136, A.grad('#ff6b78', '#e8344a'), 68, btn);
        const label = A.txt('SUBSCRIBE', 30, 22, 56, '#fff', { parent: btn }); A.pop(btn, 0.7);
        tl.call(() => { label.textContent = 'SUBSCRIBED ✓'; }, null, at(1.75)); A.burst(540, 1020, 1.75, [th.accent2, '#fff', th.accent3], 20, 260); } },
  ],
});
