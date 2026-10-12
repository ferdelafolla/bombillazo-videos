// Chispazo News — ¿Qué es el Toisón de Oro? (12/10/2026). Tendencia Google Trends ES: "leonor de borbón" (a Leonor se le cayó la insignia en el desfile del 12-O).
// Fuentes: HOLA (historia del Toisón y de Leonor), Telecinco/Vanitatis (incidente en el desfile).
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

function fleece(A, s, x, y, k = 1, t = 0) {
  const e = A.el('g', {}, s); window.gsap.set(e, { x, y, scale: k });
  A.el('path', { d: 'M-70,-230 C-70,-150 -20,-120 0,-110 C20,-120 70,-150 70,-230', stroke: '#c8102e', 'stroke-width': 26, fill: 'none', 'stroke-linecap': 'round' }, e);
  A.el('rect', { x: -34, y: -126, width: 68, height: 34, rx: 10, fill: '#ffcf3a', stroke: '#c99400', 'stroke-width': 5 }, e);
  A.el('path', { d: 'M0,-92 L0,-62', stroke: '#c99400', 'stroke-width': 10 }, e);
  const ram = A.el('g', {}, e);
  A.el('path', { d: 'M-110,-20 Q-120,-60 -80,-62 Q-60,-90 -30,-66 Q0,-92 30,-66 Q60,-90 82,-62 Q120,-58 108,-20 Q120,16 84,22 Q62,46 30,26 Q0,48 -30,26 Q-62,46 -84,22 Q-120,16 -110,-20Z', fill: A.grad('#ffe680', '#e0a800'), stroke: '#b98a00', 'stroke-width': 5 }, ram);
  A.el('path', { d: 'M96,-28 Q140,-10 136,40 Q124,70 104,58 Q112,26 92,10Z', fill: '#f0c030', stroke: '#b98a00', 'stroke-width': 5 }, ram);
  A.el('path', { d: 'M110,-14 q24,-6 24,18', stroke: '#b98a00', 'stroke-width': 6, fill: 'none' }, ram);
  A.el('path', { d: 'M-60,26 L-66,80 M-30,30 L-30,84 M30,30 L30,84 M60,26 L66,80', stroke: '#e0a800', 'stroke-width': 12, 'stroke-linecap': 'round' }, ram);
  A.el('ellipse', { cx: -30, cy: -40, rx: 30, ry: 12, fill: '#fff', opacity: 0.45 }, ram);
  A.pop(e, t);
  A.tl.fromTo(ram, { rotation: -6, svgOrigin: '0 -62' }, { rotation: 6, svgOrigin: '0 -62', duration: 1.1, ease: 'sine.inOut', yoyo: true, repeat: Math.ceil(A.dur / 1.1) }, A.at(t + 0.4));
  return e;
}
function crown(A, s, x, y, k = 1, t = 0) {
  const e = A.el('g', { html: '<path d="M-130,40 L-150,-70 L-70,-10 L0,-110 L70,-10 L150,-70 L130,40Z" fill="#ffcf3a" stroke="#c99400" stroke-width="8" stroke-linejoin="round"/><rect x="-136" y="40" width="272" height="46" rx="14" fill="#e0a800"/><circle cy="63" r="14" fill="#c8102e"/><circle cx="-80" cy="63" r="11" fill="#2a6fdb"/><circle cx="80" cy="63" r="11" fill="#2a6fdb"/><circle cx="0" cy="-110" r="16" fill="#fff"/><circle cx="-150" cy="-70" r="13" fill="#fff"/><circle cx="150" cy="-70" r="13" fill="#fff"/>' }, s);
  window.gsap.set(e, { x, y, scale: k }); A.pop(e, t); return e;
}
VIDEO({
  canal: 'news', personaje: 'chispa',
  titulo: '¿Qué es el Toisón de Oro?',
  escenas: [
    { texto: '¿Qué es el Toisón de Oro? Este 12 de octubre, a la princesa Leonor se le cayó en pleno desfile.', destacar: ['Toisón', 'cayó'], emocion: 'sorpresa',
      arte(A) { const { tl, at } = A; const s = panel(A, 'q1', '#3a1024', '#9a2a4a');
        const f = fleece(A, s, 540, 640, 1.25, 0.1);
        tl.to(f, { y: 1010, rotation: 24, duration: 0.7, ease: 'power2.in' }, at(2.6)); tl.to(f, { y: 970, duration: 0.25, ease: 'power2.out', yoyo: true, repeat: 1 }, at(3.3));
        A.ring(540, 1000, 3.3, '#ffd93b', 40, 260); A.shake(f, 3.4, 8); } },
    { texto: 'Es la condecoración más importante de la Corona española.', destacar: ['importante', 'Corona'], emocion: 'feliz',
      arte(A) { const s = panel(A, 'q2', '#2a1a5a', '#6a4ad8');
        crown(A, s, 540, 560, 1.4, 0.1); const t = card(A, s, 540, 900, 520, 130, '#ffd93b', '#ffb300', 'Nº 1', 96); A.pop(t, 0.6); A.breathe(t, 1.4);
        A.burst(540, 560, 0.4, ['#ffd93b', '#fff', '#c8102e'], 18, 280); } },
    { texto: 'La creó en 1430 Felipe el Bueno, duque de Borgoña.', destacar: ['1430', 'Borgoña.'], emocion: 'pensar',
      arte(A) { const s = panel(A, 'q3', '#1f3a4e', '#3f8ab8');
        KIT.person(A, s, 540, 1090, 1.15, { shirt: '#1d2a5a', hair: '#3a2a1a', style: 'short', arm: 'wave', t: 0.2 });
        crown(A, s, 540, 640, 0.4, 0.6);
        const t = card(A, s, 540, 400, 380, 130, '#ffd93b', '#ffb300', '1430', 100); A.pop(t, 0.4); A.breathe(t, 1.2); } },
    { texto: 'Su símbolo es un carnero de oro: el vellocino del mito de Jasón y los argonautas.', destacar: ['carnero', 'argonautas.'], emocion: 'sorpresa',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'q4', '#1a3a5a', '#2f7ab0');
        const sea = el('path', { d: 'M60,930 Q180,900 300,930 T540,930 T780,930 T1020,930 V1100 H60z', fill: '#1d5a8a' }, s);
        tl.fromTo(sea, { x: 0 }, { x: -120, duration: A.dur + 0.4, ease: 'none' }, at(0));
        const shipP = el('g', {}, s); window.gsap.set(shipP, { x: 300, y: 880 }); A.pop(shipP, 0.2);
        const ship = el('g', { html: '<path d="M-150,0 L150,0 L110,60 L-110,60Z" fill="#8a5a2a"/><path d="M0,0 V-220" stroke="#5a3a1a" stroke-width="12"/><path d="M6,-210 L130,-70 L6,-70Z" fill="#f6efe0"/><path d="M-6,-190 L-110,-70 L-6,-70Z" fill="#f6efe0"/>' }, shipP);
        tl.to(ship, { rotation: 4, svgOrigin: '0 60', duration: 1.2, ease: 'sine.inOut', yoyo: true, repeat: 4 }, at(0.4));
        fleece(A, s, 760, 640, 0.95, 0.8); A.ring(760, 620, 1.2, '#ffd93b', 40, 240); } },
    { texto: 'Llegó a España con Carlos I, que heredó la orden de Borgoña.', destacar: ['España', 'heredó'], emocion: 'pensar',
      arte(A) { const s = panel(A, 'q5', '#3a2a1a', '#a8742a');
        crown(A, s, 260, 560, 0.6, 0.1); fleece(A, s, 800, 640, 0.7, 0.3);
        KIT.arrow(A, s, 360, 560, 680, 600, '#fff', 0.7);
        const t = card(A, s, 540, 930, 600, 130, '#ffd93b', '#ffb300', 'Borgoña → España', 70); A.pop(t, 1.2); } },
    { texto: 'Hoy solo la concede el rey, y cuando su dueño muere, la insignia vuelve a la Corona.', destacar: ['rey,', 'vuelve'], emocion: 'pensar',
      arte(A) { const { tl, at } = A; const s = panel(A, 'q6', '#2a1a4a', '#7a4ac0');
        crown(A, s, 270, 520, 0.8, 0.1);
        const f = fleece(A, s, 780, 700, 0.6, 0.4);
        tl.to(f, { x: 270, y: 760, duration: 1.0, ease: 'power3.inOut' }, at(2.4));
        KIT.arrow(A, s, 720, 900, 330, 900, '#ffd93b', 2.1);
        A.ring(270, 600, 3.4, '#ffd93b', 50, 260); } },
    { texto: 'Leonor la recibió de su padre en 2018, y la luce cada 12 de octubre.', destacar: ['2018,', 'octubre.'], emocion: 'feliz',
      arte(A) { const s = panel(A, 'q7', '#1f4e3a', '#3fa56b');
        KIT.timeline(A, s, ['1430', '1516', '2018'], 640, 2, 0.2);
        const t = card(A, s, 540, 920, 540, 140, '#ffd93b', '#ffb300', '12 · 10', 100); A.pop(t, 1.4); A.breathe(t, 2.1); } },
    { texto: 'Sigue a Chispazo News: una noticia explicada cada día.', destacar: ['Sigue', 'explicada'], emocion: 'feliz', transicion: 'iris',
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
