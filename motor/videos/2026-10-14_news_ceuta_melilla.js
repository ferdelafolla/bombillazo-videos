// Chispazo News — ¿Por qué Ceuta y Melilla son España? (para el 14/10/2026). Tendencia ES: visita de los Reyes a Ceuta (13/10) y Melilla (14/10).
// Fuentes: Ara (visita 13-14 oct, primera desde 2007, Marruecos reclama), Ahram, historia (Melilla 1497; Ceuta: Tratado de Lisboa 1668; Estatutos 1995).
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

function crown(A, s, x, y, k = 1, t = 0) {
  const e = A.el('g', { html: '<path d="M-130,40 L-150,-70 L-70,-10 L0,-110 L70,-10 L150,-70 L130,40Z" fill="#ffcf3a" stroke="#c99400" stroke-width="8" stroke-linejoin="round"/><rect x="-136" y="40" width="272" height="46" rx="14" fill="#e0a800"/><circle cy="63" r="14" fill="#c8102e"/><circle cx="-80" cy="63" r="11" fill="#2a6fdb"/><circle cx="80" cy="63" r="11" fill="#2a6fdb"/><circle cx="0" cy="-110" r="16" fill="#fff"/><circle cx="-150" cy="-70" r="13" fill="#fff"/><circle cx="150" cy="-70" r="13" fill="#fff"/>' }, s);
  window.gsap.set(e, { x, y, scale: k }); A.pop(e, t); return e;
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

function mapa(A, s, t = 0) {
  const e = A.el('g', {}, s);
  A.el('path', { d: 'M180,380 C300,330 520,330 700,360 C820,380 900,430 880,520 C860,600 760,640 640,660 C520,680 420,690 330,660 C240,630 170,560 160,480 Z', fill: '#f7d94c' }, e);
  A.txt('ESPAÑA', 520, 520, 64, '#161412', { parent: e });
  A.el('path', { d: 'M120,900 C300,820 420,800 560,820 C700,840 820,860 960,900', stroke: '#161412', 'stroke-width': 9, fill: 'none' }, e);
  A.txt('ÁFRICA', 760, 1010, 58, '#161412', { parent: e });
  A.pop(e, t); return e;
}
VIDEO({
  canal: 'news', personaje: 'chispa',
  titulo: '¿Por qué Ceuta y Melilla son España?',
  escenas: [
    { texto: '¿Por qué Ceuta y Melilla son España, si están en África?', destacar: ['Ceuta', 'Melilla', 'África?'], emocion: 'sorpresa',
      arte(A) { const s = panel(A, 'c1'); mapa(A, s, 0.1); pin(A, s, 430, 830, 1.0, 'CEUTA'); pin(A, s, 700, 860, 1.3, 'MELILLA'); } },
    { texto: 'Esta semana, el rey ha visitado Ceuta, y la reina, Melilla.', destacar: ['rey', 'reina,'], emocion: 'feliz',
      arte(A) { const s = panel(A, 'c2'); crown(A, s, 540, 480, 1.1, 0.1);
        const a = card(A, s, 330, 860, 360, 120, 0, 0, 'CEUTA 13', 64); A.pop(a, 0.6); const b = card(A, s, 760, 860, 380, 120, 0, 0, 'MELILLA 14', 64); A.pop(b, 0.9); A.breathe(a, 1.4); } },
    { texto: 'Melilla es española desde 1497.', destacar: ['1497.'], emocion: 'pensar',
      arte(A) { const s = panel(A, 'c3');
        const f = A.el('g', { html: '<path d="M-220,0 V-200 H-180 V-240 H-140 V-200 H-100 V-240 H-60 V-200 H-20 V-240 H20 V-200 H60 V-240 H100 V-200 H140 V-240 H180 V-200 H220 V0Z" fill="#f7d94c"/><path d="M-40,0 V-90 Q0,-130 40,-90 V0Z" fill="#161412"/>' }, s);
        window.gsap.set(f, { x: 540, y: 980 }); A.pop(f, 0.2); const c = card(A, s, 540, 520, 420, 150, 0, 0, '1497', 110); A.pop(c, 0.6); A.breathe(c, 1.3); } },
    { texto: 'Ceuta era portuguesa, y en 1668 Portugal la cedió a España.', destacar: ['portuguesa,', '1668'], emocion: 'pensar',
      arte(A) { const s = panel(A, 'c4');
        const p = card(A, s, 290, 700, 380, 120, 0, 0, 'PORTUGAL', 60); A.pop(p, 0.1); const e = card(A, s, 790, 700, 340, 120, 0, 0, 'ESPAÑA', 60); A.pop(e, 1.2);
        KIT.arrow(A, s, 480, 700, 610, 700, '#e63b2e', 0.6); const y = card(A, s, 540, 440, 380, 140, 0, 0, '1668', 100); A.pop(y, 0.4); } },
    { texto: 'Desde 1995 son ciudades autónomas, con su propio estatuto.', destacar: ['1995', 'autónomas,'], emocion: 'feliz',
      arte(A) { const s = panel(A, 'c5');
        const d = A.el('g', { html: '<rect x="-160" y="-210" width="320" height="420" rx="18" fill="#f7d94c"/><path d="M-110,-130 H110 M-110,-70 H110 M-110,-10 H110 M-110,50 H60" stroke="#161412" stroke-width="10" stroke-linecap="round"/><circle cx="90" cy="140" r="40" fill="#e63b2e"/>' }, s);
        window.gsap.set(d, { x: 540, y: 760 }); A.pop(d, 0.2); A.breathe(d, 0.9); const c = card(A, s, 540, 420, 380, 140, 0, 0, '1995', 100); A.pop(c, 0.5); } },
    { texto: 'Marruecos las reclama, y suele protestar por estas visitas.', destacar: ['Marruecos', 'protestar'], emocion: 'pensar',
      arte(A) { const s = panel(A, 's6'); mapa(A, s, 0.05); pin(A, s, 430, 830, 0.2); pin(A, s, 700, 860, 0.3);
        KIT.speech(A, s, 300, 1000, '!', { w: 120, h: 110, size: 84, ink: '#e63b2e', t: 1.0 }); KIT.speech(A, s, 860, 1010, '!', { w: 120, h: 110, size: 84, ink: '#e63b2e', tail: 'right', t: 1.3 }); } },
    { texto: 'La última visita de un rey fue en 2007, con Juan Carlos I.', destacar: ['2007,'], emocion: 'pensar',
      arte(A) { const s = panel(A, 'c7'); KIT.timeline(A, s, ['2007', '2014', '2026'], 820, 0, 0.2); crown(A, s, 240, 600, 0.7, 0.9); } },
    { texto: 'Curiosidad: Ceuta y Melilla son la única frontera terrestre de la Unión Europea en África.', destacar: ['Curiosidad:', 'única', 'África.'], emocion: 'sorpresa',
      arte(A) { const s = panel(A, 'v7b');
        const c = card(A, s, 540, 400, 620, 140, 0, 0, 'CURIOSIDAD', 90); A.pop(c, 0.1);
        const eu = A.el('g', { html: '<circle r="150" fill="#ffffff"/>' + Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<circle cx="${(Math.cos(a) * 95).toFixed(1)}" cy="${(Math.sin(a) * 95).toFixed(1)}" r="13" fill="#161412"/>`; }).join('') }, s);
        window.gsap.set(eu, { x: 540, y: 700, scale: 0.85 }); A.pop(eu, 0.5); A.breathe(eu, 1.2);
        const f = card(A, s, 540, 960, 680, 120, 0, 0, 'FRONTERA UE · ÁFRICA', 56); A.pop(f, 1.6); } },
    { texto: 'Suscríbete para más noticias, y en el canal tienes muchas más historias como esta.', destacar: ['Suscríbete', 'noticias,'], emocion: 'feliz', transicion: 'iris',
      arte(A) { const { el, tl, at, th } = A;
        const rays = el('g', { opacity: 0.16 }); window.gsap.set(rays, { x: 540, y: 640 });
        for (let i = 0; i < 14; i++) el('path', { d: 'M0,0 L-70,-760 L70,-760 Z', fill: '#fff', transform: `rotate(${i * 25.7})` }, rays);
        tl.to(rays, { rotation: 25, svgOrigin: '0 0', duration: A.dur + 0.5, ease: 'none' }, at(0));
        A.charTo({ x: 540, y: 660, s: 1.55 }, 0.0, 0.7); A.charTo({ wave: 1 }, 0.6, 0.3);
        const btn = el('g'); window.gsap.set(btn, { x: 540, y: 1020 }); A.card(-280, -72, 560, 136, A.grad('#ff6b78', '#e8344a'), 68, btn);
        const label = A.txt('SUSCRÍBETE', 30, 22, 56, '#fff', { parent: btn }); A.pop(btn, 0.7);
        tl.call(() => { label.textContent = 'SUSCRITO ✓'; }, null, at(1.75)); A.burst(540, 1020, 1.75, [th.accent2, '#fff', th.accent3], 20, 260); } },
  ],
});
