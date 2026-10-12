// Chispazo News — Is AI a bubble? Voz en mandarín, subtítulos en inglés (12/10/2026)
function panel(A, id, c1, c2) {
  const { el } = A; const f = el('g');
  const cp = el('clipPath', { id }, f); el('rect', { x: 60, y: 290, width: 960, height: 800, rx: 54 }, cp);
  const s = el('g', { 'clip-path': `url(#${id})` }, f);
  el('rect', { x: 60, y: 290, width: 960, height: 800, fill: A.grad(c1, c2) }, s);
  el('rect', { x: 60, y: 290, width: 960, height: 800, rx: 54, fill: 'none', stroke: '#fff', 'stroke-opacity': 0.3, 'stroke-width': 6 }, f);
  A.pop(f, 0); return s;
}
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
function card(A, s, x, y, w, h, c1, c2, text, size, ink = '#2b2250') {
  const g = A.el('g', {}, s); window.gsap.set(g, { x, y }); A.card(-w / 2, -h / 2, w, h, A.grad(c1, c2), 44, g); A.txt(text, 0, size * 0.36, size, ink, { parent: g }); return g;
}
VIDEO({
  canal: 'news', personaje: 'chispa',
  titulo: 'Is AI a bubble?',
  escenas: [
    { texto: 'Is AI a bubble? Everyone is asking.', destacar: ['bubble?', 'asking.'], emocion: 'sorpresa',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'z1', '#3a1030', '#8a2a5a');
        const c = card(A, s, 540, 560, 520, 300, '#ffd93b', '#ffb300', 'AI', 190); A.pop(c, 0.1); A.breathe(c, 0.8);
        const b = bubble(A, s, 540, 860, 150, '#ff7aa8'); A.pop(b, 0.5); A.float(b, 14, 1.6, 0);
        const q = A.txt('？', 540, 905, 150, '#fff', { parent: s }); A.pop(q, 1.0); } },
    { texto: 'A bubble is when prices rise far above real value.', destacar: ['bubble', 'value.'], emocion: 'pensar',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'z2', '#2a1a5a', '#6a4ad8');
        const b = bubble(A, s, 540, 760, 70, '#7fd4ff'); A.pop(b, 0.1); tl.to(b, { scale: 3.4, duration: 3.0, ease: 'power1.in' }, at(0.5));
        const t = card(A, s, 540, 440, 420, 130, '#e8ff7a', '#b6e03a', '泡沫', 96, '#2b3a10'); A.pop(t, 0.2);
        const ar = el('path', { d: 'M0,60 L0,-60 M-40,-20 L0,-62 L40,-20', stroke: '#ffd93b', 'stroke-width': 18, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s);
        tl.fromTo(ar, { x: 860, y: 900, opacity: 0 }, { y: 760, opacity: 1, duration: 1.4, ease: 'power2.out' }, at(1.0)); } },
    { texto: 'Tech leaders now warn that AI may be overhyped.', destacar: ['warn', 'overhyped.'], emocion: 'pensar',
      arte(A) { const s = panel(A, 'z3', '#3a1030', '#b0406a');
        KIT.person(A, s, 270, 1090, 0.95, { shirt: '#3fa56b', hair: '#2b2240', style: 'short', arm: 'point', t: 0.2 });
        KIT.person(A, s, 540, 1110, 1.0, { shirt: '#4a7ad8', hair: '#4a2c1a', style: 'bun', t: 0.4 });
        KIT.person(A, s, 810, 1090, 0.95, { shirt: '#e8553a', hair: '#888', style: 'bald', arm: 'wave', t: 0.6 });
        KIT.speech(A, s, 190, 600, '!', { w: 120, h: 110, size: 84, ink: '#e8344a', tail: 'right', t: 0.9 });
        KIT.speech(A, s, 890, 600, '!', { w: 120, h: 110, size: 84, ink: '#e8344a', tail: 'left', t: 1.2 });
        const t = card(A, s, 540, 400, 520, 130, '#ffd93b', '#ffb300', '炒作？', 96); A.pop(t, 1.6); A.breathe(t, 2.4); } },
    { texto: 'Companies are spending huge sums, but no steady way to profit yet.', destacar: ['huge', 'profit'], emocion: 'pensar',
      arte(A) { const { el } = A; const s = panel(A, 'z4', '#1f3a4e', '#3f9ab8');
        const box = el('g', {}, s); window.gsap.set(box, { x: 540, y: 860 }); A.card(-190, -120, 380, 240, A.grad('#8b8f99', '#6a6e78'), 34, box); A.txt('?', 0, 60, 170, '#fff', { parent: box }); A.pop(box, 0.1);
        KIT.coinRain(A, s, 12, 540, 780, 0.5);
        KIT.coin(A, s, 230, 470, 1.3, '$', 0.2); KIT.coin(A, s, 850, 470, 1.3, '¥', 0.35);
        A.shake(box, 2.6, 10); A.ring(540, 860, 2.6, '#fff', 60, 280); } },
    { texto: 'Chips and data centers cost a staggering amount.', destacar: ['Chips', 'staggering'], emocion: 'sorpresa',
      arte(A) { const s = panel(A, 'z5', '#2a2a5a', '#5a64d0');
        KIT.server(A, s, 230, 820, 0.85, 0.1); KIT.server(A, s, 850, 820, 0.85, 0.3);
        KIT.chip(A, s, 540, 760, 1.15, 'AI', 0.5);
        const t = card(A, s, 540, 400, 460, 130, '#ff6b78', '#e8344a', '$$$', 100, '#fff'); A.pop(t, 1.2); A.breathe(t, 1.9); A.burst(540, 400, 1.2, ['#ffd93b', '#fff'], 14, 220); } },
    { texto: 'Others say AI really is changing industries, and demand is real.', destacar: ['changing', 'real.'], emocion: 'feliz',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'z6', '#1f4e3a', '#4fc98a');
        const t = card(A, s, 540, 400, 560, 130, '#e8ff7a', '#b6e03a', '需求是真的', 84, '#2b3a10'); A.pop(t, 0.1); A.breathe(t, 0.8);
        [[300, 780], [540, 700], [780, 780]].forEach(([x, y], i) => { const g = el('g', {}, s); window.gsap.set(g, { x, y }); el('circle', { r: 90, fill: '#fff', 'fill-opacity': 0.18, stroke: '#fff', 'stroke-width': 8 }, g); el('path', { d: 'M-40,5 L-10,38 L45,-32', stroke: '#e8ff7a', 'stroke-width': 22, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g); A.pop(g, 0.6 + i * 0.3); A.float(g, 10, 1.4, i); });
        A.burst(540, 700, 1.4, ['#e8ff7a', '#fff', '#4fc98a'], 16, 240); } },
    { texto: 'History shows: after the dot-com bubble burst, the truly useful companies survived.', destacar: ['burst,', 'survived.'], emocion: 'pensar',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'z7', '#2a1a4a', '#7a4ac0'); ground(A, s, '#4a3a5a');
        const b = bubble(A, s, 380, 640, 120, '#ff7aa8'); A.pop(b, 0.1); tl.to(b, { scale: 1.6, opacity: 0, duration: 0.3 }, at(1.4)); A.burst(380, 640, 1.4, ['#ff7aa8', '#fff'], 18, 260);
        const pl = el('g', { html: '<path d="M0,0 v-190" stroke="#2f7a3c" stroke-width="14"/><path d="M0,-110 q-100,-30 -110,-120 q100,10 110,120z M0,-150 q100,-30 110,-130 q-100,10 -110,130z" fill="#3fae52"/>' }, s);
        window.gsap.set(pl, { x: 740, y: 900, scale: 0, transformOrigin: '0 0' }); tl.to(pl, { scale: 1.4, duration: 1.3, ease: 'back.out(1.6)' }, at(2.0));
        const yr = card(A, s, 540, 380, 400, 120, '#ffd93b', '#ffb300', '2000', 90); A.pop(yr, 0.2); } },
    { texto: 'Follow us: one trending topic explained every day.', destacar: ['Follow', 'explained'], emocion: 'feliz', transicion: 'iris',
      arte(A) { const { el, tl, at, th } = A;
        const rays = el('g', { opacity: 0.16 }); window.gsap.set(rays, { x: 540, y: 640 });
        for (let i = 0; i < 14; i++) el('path', { d: 'M0,0 L-70,-760 L70,-760 Z', fill: '#fff', transform: `rotate(${i * 25.7})` }, rays);
        tl.to(rays, { rotation: 25, svgOrigin: '0 0', duration: A.dur + 0.5, ease: 'none' }, at(0));
        A.charTo({ x: 540, y: 660, s: 1.55 }, 0.0, 0.7); A.charTo({ wave: 1 }, 0.6, 0.3);
        const btn = el('g'); window.gsap.set(btn, { x: 540, y: 1020 }); A.card(-280, -72, 560, 136, A.grad('#ff6b78', '#e8344a'), 68, btn);
        const label = A.txt('关注', 30, 22, 56, '#fff', { parent: btn }); A.pop(btn, 0.7);
        tl.call(() => { label.textContent = '已关注 ✓'; }, null, at(1.75)); A.burst(540, 1020, 1.75, [th.accent2, '#fff', th.accent3], 20, 260); } },
  ],
});
