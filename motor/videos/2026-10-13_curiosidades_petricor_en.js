// Bombillazo — ¿Por qué huele a tierra mojada cuando llueve? (13/10/2026)
// Fuentes: Maldita Ciencia (petricor, Bear y Thomas 1964, actinobacterias/geosmina, MIT 2015 burbujas y aerosoles).
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
VIDEO({
  canal: 'curiosidades', personaje: 'chispa',
  titulo: 'Why does rain smell so good?',
  escenas: [
    { texto: 'Why does rain smell so good?', destacar: ['smell', 'good?'], emocion: 'sorpresa',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'q1', '#2c3f7a', '#6a8fd8');
        const c = cloud(A, s, 540, 430, 1.5); A.pop(c, 0.1); A.float(c, 10, 2, 0); rain(A, s, 14, 0.5, 520, 880); ground(A, s);
        const n = el('g', {}, s); window.gsap.set(n, { x: 540, y: 820 }); el('path', { d: 'M-30,40 q0,-60 30,-70 q30,10 30,70 q-30,16 -60,0z', fill: '#f1b38f' }, n); A.pop(n, 1.2);
        for (let i = 0; i < 3; i++) { const w = el('path', { d: 'M0,0 q-18,-30 0,-60 q18,-30 0,-60', stroke: '#fff', 'stroke-width': 8, fill: 'none', 'stroke-linecap': 'round', opacity: 0.8 }, s); tl.fromTo(w, { x: 470 + i * 70, y: 760, opacity: 0 }, { y: 640, opacity: 0.9, duration: 1.2, repeat: 1 }, at(1.4 + i * 0.25)); } } },
    { texto: 'It has a name: petrichor.', destacar: ['petrichor.'], emocion: 'feliz',
      arte(A) { const { el, tl, at, th } = A; const s = panel(A, 'q2', '#3b2a7a', '#8a63e0');
        const b = el('g'); window.gsap.set(b, { x: 540, y: 690 }); A.card(-380, -110, 760, 220, A.grad('#ffd93b', '#ffb300'), 50, b); A.txt('petrichor', 0, 38, 120, '#2b2250', { parent: b }); A.pop(b, 0.2);
        A.burst(540, 690, 0.4, ['#ffd93b', '#fff', '#8a63e0'], 18, 260);
        const d = el('g', { html: '<path d="M0,-40 C30,-10 30,20 0,24 C-30,20 -30,-10 0,-40z" fill="#7fd4ff"/>' }, s); window.gsap.set(d, { x: 790, y: 900 }); A.pop(d, 1.0); A.float(d, 14, 1.4, 1); } },
    { texto: 'Two Australian scientists named it in nineteen sixty-four.', destacar: ['sixty-four.', 'Australian'], emocion: 'pensar',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'q3', '#1f4e6e', '#4fb6c9');
        const tag = el('g'); window.gsap.set(tag, { x: 540, y: 520 }); A.card(-190, -80, 380, 160, A.grad('#ffd93b', '#ffb300'), 40, tag); A.txt('1964', 0, 34, 100, '#2b2250', { parent: tag }); A.pop(tag, 0.1);
        for (let i = 0; i < 2; i++) { const p = el('g', {}, s); window.gsap.set(p, { x: 400 + i * 280, y: 870 });
          el('circle', { cy: -90, r: 52, fill: '#f1c9a5' }, p); el('path', { d: 'M-70,0 q0,-100 70,-100 q70,0 70,100z', fill: i ? '#e8553a' : '#3fa56b' }, p);
          el('path', { d: 'M-60,-120 q60,-40 120,0 l10,10 h-140z', fill: '#c8a050' }, p); A.pop(p, 0.6 + i * 0.3); A.float(p, 8, 1.6, i); }
        A.txt('Australia', 540, 1050, 54, '#fff', { parent: s }); } },
    { texto: 'It is a mix of scents: oils released by plants and rocks, and a substance made by soil bacteria.', destacar: ['oils', 'bacteria.'], emocion: 'pensar',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'q4', '#2a5a3a', '#7ccf8c'); ground(A, s);
        const pl = el('g', { html: '<path d="M0,0 v-150" stroke="#2f7a3c" stroke-width="12"/><path d="M0,-90 q-80,-30 -90,-100 q80,10 90,100z M0,-120 q80,-30 90,-100 q-80,10 -90,100z" fill="#3fae52"/>' }, s); window.gsap.set(pl, { x: 280, y: 900 }); A.pop(pl, 0.1);
        const rk = el('path', { d: 'M-90,0 l30,-70 h100 l40,70z', fill: '#8b8f99', stroke: '#6a6e78', 'stroke-width': 6 }, s); window.gsap.set(rk, { x: 790, y: 900 }); A.pop(rk, 0.3);
        [[280, 740], [790, 780]].forEach(([x, y], i) => { for (let k = 0; k < 4; k++) { const o = el('circle', { r: 14, fill: '#f6e27a' }, s); tl.fromTo(o, { x: x + (k - 1.5) * 24, y, opacity: 0 }, { y: y - 150, x: x + (k - 1.5) * 50, opacity: 1, duration: 1.2, repeat: 1, ease: 'power1.out' }, at(0.9 + k * 0.25 + i * 0.2)); } });
        for (let k = 0; k < 5; k++) { const b = el('g', { html: '<ellipse rx="20" ry="11" fill="#c06ae0"/><path d="M-20,0 q-14,-8 -24,0 M20,0 q14,-8 24,0" stroke="#c06ae0" stroke-width="5" fill="none"/>' }, s); window.gsap.set(b, { x: 460 + k * 36, y: 1000 }); A.pop(b, 2.0 + k * 0.12); A.float(b, 6, 1.2, k); } } },
    { texto: 'That substance is called geosmin, and they make it while breaking down dead matter.', destacar: ['geosmin,', 'matter.'], emocion: 'sorpresa',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'q5', '#4a2a6e', '#b06ae0'); ground(A, s, '#5a3d28');
        const lbl = el('g'); window.gsap.set(lbl, { x: 540, y: 430 }); A.card(-250, -70, 500, 140, A.grad('#e8ff7a', '#b6e03a'), 40, lbl); A.txt('geosmin', 0, 30, 84, '#2b3a10', { parent: lbl }); A.pop(lbl, 0.1);
        const leaf = el('g', { html: '<path d="M0,-30 C34,-24 34,24 0,40 C-34,24 -34,-24 0,-30z" fill="#9a6b3a"/>' }, s); window.gsap.set(leaf, { x: 400, y: 880 }); A.pop(leaf, 0.5);
        const bac = el('g', { html: '<ellipse rx="24" ry="13" fill="#c06ae0"/>' }, s); window.gsap.set(bac, { x: 470, y: 880 }); A.pop(bac, 0.8);
        tl.to(leaf, { scale: 0.2, opacity: 0, duration: 1.4 }, at(1.2));
        for (let k = 0; k < 6; k++) { const g = el('circle', { r: 16, fill: '#e8ff7a', opacity: 0.85 }, s); tl.fromTo(g, { x: 440 + k * 14, y: 860, opacity: 0 }, { y: 600 - (k % 3) * 50, x: 520 + (k - 3) * 36, opacity: 0.9, duration: 1.4, ease: 'power1.out' }, at(1.4 + k * 0.2)); } } },
    { texto: 'With the damp air before rain, those bacteria wake up, and the smell gets stronger.', destacar: ['damp', 'wake'], emocion: 'pensar',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'q6', '#33407a', '#7f93d8'); ground(A, s);
        const c = cloud(A, s, 540, 420, 1.3, '#9aa6c8'); A.pop(c, 0.1);
        for (let k = 0; k < 6; k++) { const b = el('g', { html: '<ellipse rx="26" ry="14" fill="#c06ae0"/>' }, s); window.gsap.set(b, { x: 230 + k * 120, y: 1000 }); A.pop(b, 0.4 + k * 0.1);
          tl.to(b, { y: 960, scaleX: 1.4, scaleY: 1.4, duration: 0.4, yoyo: true, repeat: 5, ease: 'sine.inOut' }, at(1.2 + k * 0.1)); }
        const m = el('g'); window.gsap.set(m, { x: 540, y: 760 }); A.card(-300, -26, 600, 52, 'rgba(255,255,255,.18)', 26, m);
        const f = A.el('rect', { x: -294, y: -20, width: 0, height: 40, rx: 20, fill: '#e8ff7a' }, m); tl.to(f, { attr: { width: 588 }, duration: 2.6, ease: 'power1.inOut' }, at(0.6)); } },
    { texto: 'When a raindrop hits the ground, it traps tiny air bubbles that pop and launch the scent into the air.', destacar: ['hits', 'bubbles'], emocion: 'sorpresa',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'q7', '#243a6e', '#5f86d0'); ground(A, s);
        const d = el('path', { d: 'M0,-50 C34,-14 34,24 0,30 C-34,24 -34,-14 0,-50z', fill: '#7fd4ff' }, s);
        tl.fromTo(d, { x: 540, y: 330 }, { y: 880, duration: 0.9, ease: 'power2.in' }, at(0.3)); tl.to(d, { opacity: 0, duration: 0.1 }, at(1.2));
        for (let k = 0; k < 7; k++) { const b = el('circle', { r: 12 + (k % 3) * 5, fill: 'none', stroke: '#fff', 'stroke-width': 5 }, s);
          tl.fromTo(b, { x: 540 + (k - 3) * 22, y: 900, opacity: 0, scale: 0.3 }, { x: 540 + (k - 3) * 60, y: 700 - (k % 3) * 70, opacity: 1, scale: 1, duration: 1.1, ease: 'power2.out' }, at(1.2 + k * 0.08)); tl.to(b, { opacity: 0, scale: 1.6, duration: 0.3 }, at(2.4 + k * 0.08)); }
        A.burst(540, 880, 1.2, ['#7fd4ff', '#fff'], 16, 240); } },
    { texto: 'That is how it reaches your nose.', destacar: ['nose.'], emocion: 'feliz',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'q8', '#5a3d7a', '#c58ae0');
        const f = el('g'); window.gsap.set(f, { x: 800, y: 700 }); el('circle', { r: 150, fill: '#f1c9a5' }, f); el('circle', { cx: -50, cy: -30, r: 14, fill: '#2b2250' }, f); el('circle', { cx: 50, cy: -30, r: 14, fill: '#2b2250' }, f);
        el('path', { d: 'M0,-10 q-26,50 6,56', stroke: '#c9916a', 'stroke-width': 10, fill: 'none', 'stroke-linecap': 'round' }, f); el('path', { d: 'M-40,70 q40,30 80,0', stroke: '#2b2250', 'stroke-width': 8, fill: 'none', 'stroke-linecap': 'round' }, f); A.pop(f, 0.1);
        for (let k = 0; k < 6; k++) { const g = el('circle', { r: 18, fill: '#e8ff7a', opacity: 0.85 }, s); tl.fromTo(g, { x: 150 + k * 24, y: 900 - (k % 3) * 60, opacity: 0 }, { x: 700, y: 700 + (k % 3) * 8, opacity: 0.95, duration: 1.6, ease: 'power1.inOut', repeat: 1 }, at(0.5 + k * 0.25)); } } },
    { texto: 'Follow us: a new fun fact every day.', destacar: ['Follow', 'fact'], emocion: 'feliz', transicion: 'iris',
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
