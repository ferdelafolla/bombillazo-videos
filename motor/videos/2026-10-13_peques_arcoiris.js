// Bombillazo Peques — ¿Cómo sale el arcoíris? (13/10/2026). Frases cortas, colores vivos.
function panel(A, id, c1, c2) {
  const { el } = A; const f = el('g');
  const cp = el('clipPath', { id }, f); el('rect', { x: 60, y: 290, width: 960, height: 800, rx: 54 }, cp);
  const s = el('g', { 'clip-path': `url(#${id})` }, f);
  el('rect', { x: 60, y: 290, width: 960, height: 800, fill: A.grad(c1, c2) }, s);
  el('rect', { x: 60, y: 290, width: 960, height: 800, rx: 54, fill: 'none', stroke: '#fff', 'stroke-opacity': 0.4, 'stroke-width': 6 }, f);
  A.pop(f, 0); return s;
}
const COL = ['#e53935', '#ff8c2b', '#ffd93b', '#43b85a', '#2f8fe8', '#8a4fd8'];
function cloud(A, s, x, y, k, col = '#fff') {
  const g = A.el('g', { html: `<ellipse rx="150" ry="55" fill="${col}"/><ellipse cx="-90" cy="20" rx="90" ry="45" fill="${col}"/><ellipse cx="95" cy="22" rx="100" ry="42" fill="${col}"/>` }, s);
  window.gsap.set(g, { x, y, scale: k }); return g;
}
function sun(A, s, x, y, r) { const g = A.el('g', {}, s); window.gsap.set(g, { x, y }); A.el('circle', { r, fill: '#ffd93b' }, g); return g; }
function arc(A, s, n, t0, dur) {
  const { el, tl, at } = A;
  for (let i = 0; i < n; i++) { const R = 400 - i * 38; const p = el('path', { d: `M${540 - R},980 A${R},${R} 0 0 1 ${540 + R},980`, fill: 'none', stroke: COL[i], 'stroke-width': 40 }, s); A.draw(p, t0 + i * 0.18, dur, 'power2.inOut'); }
}
VIDEO({
  canal: 'peques', personaje: 'chispa',
  titulo: '¿Cómo sale el arcoíris?',
  escenas: [
    { texto: '¡Hola! Soy Chispa.', destacar: ['Chispa.'], emocion: 'feliz',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'a1', '#59c9ff', '#d9f7ff'); const c = cloud(A, s, 540, 520, 1.4); A.pop(c, 0.1); A.float(c, 12, 2, 0); arc(A, s, 6, 0.5, 1.0); A.charTo({ x: 230, y: 1580, s: 1.3, wave: 1 }, 0.1); } },
    { texto: '¡Mira! ¡Ha llovido!', destacar: ['llovido!'], emocion: 'sorpresa',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'a2', '#7f93b8', '#c9d6ea'); const c = cloud(A, s, 540, 450, 1.5, '#8d9ab5'); A.pop(c, 0.1);
        for (let i = 0; i < 16; i++) { const d = el('path', { d: 'M0,-22 C16,0 16,16 0,18 C-16,16 -16,0 0,-22z', fill: '#4fb0ff' }, s); tl.fromTo(d, { x: 200 + (i * 137) % 700, y: 560, opacity: 0 }, { y: 1020, opacity: 1, duration: 0.7, ease: 'power1.in', repeat: 2, repeatDelay: (i % 4) * 0.1 }, at(0.3 + (i % 6) * 0.1)); } } },
    { texto: 'Y ahora sale el sol.', destacar: ['sol.'], emocion: 'feliz',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'a3', '#8fd8ff', '#e6faff'); const c = cloud(A, s, 760, 480, 1.2, '#b8c4d8'); A.pop(c, 0); tl.to(c, { x: 1100, duration: 2.2, ease: 'power1.in' }, at(0.6));
        const so = sun(A, s, 400, 640, 120); A.pop(so, 0.5); tl.to(so, { rotation: 30, svgOrigin: '400 640', duration: A.dur, ease: 'none' }, at(0)); A.burst(400, 640, 0.6, ['#ffd93b', '#fff'], 18, 260); } },
    { texto: 'La luz del sol entra en las gotitas de lluvia.', destacar: ['luz', 'gotitas'], emocion: 'pensar',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'a4', '#8fd8ff', '#e6faff'); const so = sun(A, s, 200, 420, 90); A.pop(so, 0);
        const d = el('path', { d: 'M0,-110 C80,-30 80,60 0,76 C-80,60 -80,-30 0,-110z', fill: 'rgba(79,176,255,.6)', stroke: '#2f8fe8', 'stroke-width': 8 }, s); window.gsap.set(d, { x: 700, y: 700 }); A.pop(d, 0.3); A.float(d, 10, 1.6, 0);
        const r = el('path', { d: 'M260,470 L620,680', stroke: '#fff3a0', 'stroke-width': 18, 'stroke-linecap': 'round' }, s); A.draw(r, 0.8, 1.2, 'power1.inOut'); } },
    { texto: '¡Y se separa en colores!', destacar: ['colores!'], emocion: 'sorpresa',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'a5', '#8fd8ff', '#e6faff');
        const d = el('path', { d: 'M0,-110 C80,-30 80,60 0,76 C-80,60 -80,-30 0,-110z', fill: 'rgba(79,176,255,.5)', stroke: '#2f8fe8', 'stroke-width': 8 }, s); window.gsap.set(d, { x: 440, y: 700 }); A.pop(d, 0);
        const r = el('path', { d: 'M120,560 L420,690', stroke: '#fff3a0', 'stroke-width': 16, 'stroke-linecap': 'round' }, s); A.draw(r, 0.2, 0.6);
        COL.forEach((c, i) => { const p = el('path', { d: `M470,700 L940,${460 + i * 70}`, stroke: c, 'stroke-width': 22, 'stroke-linecap': 'round' }, s); A.draw(p, 0.9 + i * 0.15, 0.8, 'power2.out'); }); A.burst(470, 700, 0.9, ['#fff', '#ffd93b'], 14, 200); } },
    { texto: 'Rojo, naranja, amarillo...', destacar: ['Rojo,', 'naranja,', 'amarillo...'], emocion: 'feliz',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'a6', '#e8f6ff', '#fff7e0');
        [0, 1, 2].forEach((i) => { const g = el('g', {}, s); window.gsap.set(g, { x: 270 + i * 270, y: 700 }); el('circle', { r: 110, fill: COL[i] }, g); A.pop(g, 0.2 + i * 0.7); A.float(g, 14, 1.3, i); A.burst(270 + i * 270, 700, 0.2 + i * 0.7, [COL[i], '#fff'], 10, 200); }); } },
    { texto: 'verde, azul y violeta.', destacar: ['verde,', 'azul', 'violeta.'], emocion: 'feliz',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'a7', '#e8f6ff', '#fff7e0');
        [3, 4, 5].forEach((c, i) => { const g = el('g', {}, s); window.gsap.set(g, { x: 270 + i * 270, y: 700 }); el('circle', { r: 110, fill: COL[c] }, g); A.pop(g, 0.2 + i * 0.5); A.float(g, 14, 1.3, i); A.burst(270 + i * 270, 700, 0.2 + i * 0.5, [COL[c], '#fff'], 10, 200); }); } },
    { texto: '¡Es el arcoíris!', destacar: ['arcoíris!'], emocion: 'sorpresa',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'a8', '#59c9ff', '#d9f7ff'); arc(A, s, 6, 0.1, 0.9);
        [270, 810].forEach((x, i) => { const c = cloud(A, s, x, 960, 0.9); A.pop(c, 0.8 + i * 0.2); });
        const so = sun(A, s, 880, 420, 70); A.pop(so, 0.6); A.burst(540, 600, 1.0, ['#ffd93b', '#fff', '#ff8c2b'], 24, 320); A.charTo({ wave: 1 }, 0.5, 0.3); } },
    { texto: '¡Adiós, amigos! ¡Hasta mañana!', destacar: ['Adiós,', 'mañana!'], emocion: 'feliz', transicion: 'iris',
      arte(A) { const { el, tl, at, th } = A;
        const rays = el('g', { opacity: 0.18 }); window.gsap.set(rays, { x: 540, y: 640 });
        for (let i = 0; i < 14; i++) el('path', { d: 'M0,0 L-70,-760 L70,-760 Z', fill: '#fff', transform: `rotate(${i * 25.7})` }, rays);
        tl.to(rays, { rotation: 25, svgOrigin: '0 0', duration: A.dur + 0.5, ease: 'none' }, at(0));
        A.charTo({ x: 540, y: 680, s: 1.7, wave: 1 }, 0, 0.6); A.burst(540, 700, 0.5, ['#ffd93b', '#fff', '#ff8c2b'], 20, 280); } },
  ],
});
