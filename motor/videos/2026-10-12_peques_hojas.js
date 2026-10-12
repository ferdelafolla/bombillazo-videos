// Bombillazo Peques — Las hojas en otoño (12/10/2026). Frases cortas, colores vivos.
function panel(A, id, c1, c2) {
  const { el } = A; const f = el('g');
  const cp = el('clipPath', { id }, f); el('rect', { x: 60, y: 290, width: 960, height: 800, rx: 54 }, cp);
  const s = el('g', { 'clip-path': `url(#${id})` }, f);
  el('rect', { x: 60, y: 290, width: 960, height: 800, fill: A.grad(c1, c2) }, s);
  el('rect', { x: 60, y: 290, width: 960, height: 800, rx: 54, fill: 'none', stroke: '#fff', 'stroke-opacity': 0.4, 'stroke-width': 6 }, f);
  A.pop(f, 0); return s;
}
function tree(A, s, x, y, sc, leaf) {
  const g = A.el('g', {}, s); window.gsap.set(g, { x, y, scale: sc });
  A.el('path', { d: 'M-34,0 L-22,-260 L22,-260 L34,0z', fill: '#8a5a3a' }, g);
  [[-110, -300, 100], [110, -300, 100], [0, -380, 130], [-60, -250, 90], [70, -250, 90]].forEach(([cx, cy, r]) => A.el('circle', { cx, cy, r, fill: leaf }, g));
  return g;
}
function leafPath(c, s = 1) { return `<path d="M0,-40 C40,-30 40,30 0,50 C-40,30 -40,-30 0,-40z" fill="${c}" stroke="rgba(0,0,0,.15)" stroke-width="3" transform="scale(${s})"/><path d="M0,-34 V44" stroke="rgba(0,0,0,.2)" stroke-width="4"/>`; }
function fall(A, s, colors, n, t0, dur) {
  const { el, tl, at } = A;
  for (let i = 0; i < n; i++) { const l = el('g', { html: leafPath(colors[i % colors.length], 1) }, s);
    tl.fromTo(l, { x: 150 + (i * 137) % 800, y: 330, rotation: 0, opacity: 1 }, { x: 150 + (i * 137 + 90) % 800, y: 1000, rotation: 360 * (i % 2 ? 1 : -1), duration: dur, ease: 'sine.inOut' }, at(t0 + i * 0.12)); }
}
VIDEO({
  canal: 'peques', personaje: 'chispa',
  titulo: '¿Por qué se caen las hojas?',
  escenas: [
    { texto: '¡Hola! Soy Edu.', destacar: ['Edu.'], emocion: 'feliz',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'p1', '#59c9ff', '#c9f1ff');
        const sun = el('g', {}, s); window.gsap.set(sun, { x: 800, y: 480 }); el('circle', { r: 90, fill: '#ffd93b' }, sun); A.pop(sun, 0.1);
        tl.to(sun, { rotation: 20, duration: A.dur, ease: 'none', svgOrigin: '800 480' }, at(0));
        const t = tree(A, s, 330, 1060, 1.4, '#5ccf6e'); A.pop(t, 0.3);
        A.charTo({ x: 230, y: 1580, s: 1.3, wave: 1 }, 0.1); } },
    { texto: '¡Mira los árboles! ¡Ya es otoño!', destacar: ['otoño!'], emocion: 'sorpresa',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'p2', '#ffb347', '#ffe9b0');
        [[250, 1060, 1.0, '#ff8c2b'], [560, 1060, 1.3, '#f2c21b'], [850, 1060, 1.0, '#e8553a']].forEach(([x, y, sc, c], i) => { const t = tree(A, s, x, y, sc, c); A.pop(t, 0.1 + i * 0.25); });
        fall(A, s, ['#ff8c2b', '#f2c21b', '#e8553a'], 6, 0.8, 2.2); } },
    { texto: 'En verano, las hojas son verdes.', destacar: ['verdes.'], emocion: 'feliz',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'p3', '#59c9ff', '#d9f7ff');
        const sun = el('g', {}, s); window.gsap.set(sun, { x: 850, y: 440 }); el('circle', { r: 80, fill: '#ffd93b' }, sun); A.pop(sun, 0);
        const t = tree(A, s, 480, 1060, 1.5, '#4cc95f'); A.pop(t, 0.2);
        for (let i = 0; i < 3; i++) { const l = el('g', { html: leafPath('#2fae45', 1.8) }, s); window.gsap.set(l, { x: 230 + i * 160, y: 1000 }); A.pop(l, 0.8 + i * 0.3); A.float(l, 10, 1.4, i); } } },
    { texto: 'El verde ayuda al árbol a comer la luz del sol.', destacar: ['verde', 'sol.'], emocion: 'pensar',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'p4', '#7ad8ff', '#e6faff');
        const sun = el('g', {}, s); window.gsap.set(sun, { x: 800, y: 420 }); el('circle', { r: 85, fill: '#ffd93b' }, sun); A.pop(sun, 0);
        const l = el('g', { html: leafPath('#35b84c', 5) }, s); window.gsap.set(l, { x: 420, y: 820 }); A.pop(l, 0.3);
        for (let i = 0; i < 5; i++) { const r = el('path', { d: 'M0,0 L-50,100', stroke: '#ffd93b', 'stroke-width': 12, 'stroke-linecap': 'round' }, s);
          tl.fromTo(r, { x: 740 - i * 70, y: 500 + i * 20, opacity: 0 }, { x: 560 - i * 60, y: 640 + i * 20, opacity: 1, duration: 0.8, repeat: 2, ease: 'power1.in' }, at(0.9 + i * 0.2)); } } },
    { texto: 'En otoño hay menos sol.', destacar: ['menos', 'sol.'], emocion: 'pensar',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'p5', '#9bc4e8', '#e8e3d6');
        const sun = el('g', {}, s); window.gsap.set(sun, { x: 540, y: 560 }); el('circle', { r: 120, fill: '#ffd93b' }, sun); A.pop(sun, 0);
        tl.to(sun, { scale: 0.45, y: 760, opacity: 0.8, duration: 2, ease: 'power2.inOut' }, at(0.5));
        const c = el('g', { html: '<ellipse rx="150" ry="55" fill="#fff"/><ellipse cx="-80" cy="18" rx="90" ry="45" fill="#fff"/><ellipse cx="90" cy="20" rx="100" ry="42" fill="#fff"/>' }, s);
        tl.fromTo(c, { x: 1200, y: 520 }, { x: 560, duration: 1.4, ease: 'power2.out' }, at(0.4)); } },
    { texto: 'Y el verde... se va.', destacar: ['verde...'], emocion: 'sorpresa',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'p6', '#c9e8ff', '#f2f7e6');
        const l = el('g', { html: leafPath('#35b84c', 5) }, s); window.gsap.set(l, { x: 540, y: 740 }); A.pop(l, 0.1);
        const o = el('g', { html: leafPath('#f2a31b', 5) }, s); window.gsap.set(o, { x: 540, y: 740, opacity: 0 });
        tl.to(l, { opacity: 0, duration: 1.2 }, at(0.9)); tl.to(o, { opacity: 1, duration: 1.2 }, at(0.9)); } },
    { texto: '¡Aparecen el amarillo y el naranja!', destacar: ['amarillo', 'naranja!'], emocion: 'feliz',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'p7', '#ffe48a', '#ffc27a');
        [['#f7d21e', 300], ['#ff8c2b', 540], ['#f7d21e', 780]].forEach(([c, x], i) => { const l = el('g', { html: leafPath(c, 3.2) }, s); window.gsap.set(l, { x, y: 780 }); A.pop(l, 0.2 + i * 0.35); A.float(l, 14, 1.3, i); });
        A.burst(540, 780, 0.5, ['#ffd93b', '#ff8c2b', '#fff'], 18, 240); } },
    { texto: 'Algunas hojas se ponen rojas.', destacar: ['rojas.'], emocion: 'sorpresa',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'p8', '#ffc9b5', '#ffe9dd');
        const l = el('g', { html: leafPath('#f2a31b', 5) }, s); window.gsap.set(l, { x: 540, y: 740 }); A.pop(l, 0);
        const r = el('g', { html: leafPath('#e03a3a', 5) }, s); window.gsap.set(r, { x: 540, y: 740, opacity: 0 });
        tl.to(r, { opacity: 1, duration: 1, ease: 'power1.in' }, at(0.5)); A.burst(540, 740, 1.3, ['#e03a3a', '#fff'], 14, 220); } },
    { texto: 'Después, caen al suelo. ¡Cras, cras!', destacar: ['caen', 'cras!'], emocion: 'feliz',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'p9', '#cfe9ff', '#fbefd2');
        el('rect', { x: 60, y: 960, width: 960, height: 130, fill: '#a77b50' }, s);
        fall(A, s, ['#e03a3a', '#ff8c2b', '#f7d21e'], 9, 0.2, 2.3);
        A.txt('¡cras!', 760, 930, 90, '#e03a3a', { parent: s }); } },
    { texto: 'En primavera saldrán hojas nuevas.', destacar: ['primavera', 'nuevas.'], emocion: 'feliz',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'p10', '#b8f0c8', '#e8fff0');
        const t = tree(A, s, 540, 1060, 1.5, '#7be08e'); window.gsap.set(t, { scale: 0.01 });
        tl.to(t, { scale: 1.5, duration: 1.3, ease: 'elastic.out(1,0.5)', transformOrigin: '50% 100%' }, at(0.3));
        for (let i = 0; i < 6; i++) { const f = el('circle', { r: 16, fill: ['#ff7ab8', '#fff', '#ffd93b'][i % 3] }, s); window.gsap.set(f, { x: 150 + i * 150, y: 1050 }); A.pop(f, 1 + i * 0.2); } } },
    { texto: '¡Adiós, amigos! ¡Hasta mañana!', destacar: ['Adiós,', 'mañana!'], emocion: 'feliz', transicion: 'iris',
      arte(A) { const { el, tl, at, th } = A;
        const rays = el('g', { opacity: 0.18 }); window.gsap.set(rays, { x: 540, y: 640 });
        for (let i = 0; i < 14; i++) el('path', { d: 'M0,0 L-70,-760 L70,-760 Z', fill: '#fff', transform: `rotate(${i * 25.7})` }, rays);
        tl.to(rays, { rotation: 25, svgOrigin: '0 0', duration: A.dur + 0.5, ease: 'none' }, at(0));
        A.charTo({ x: 540, y: 680, s: 1.7, wave: 1 }, 0, 0.6);
        fall(A, el('g'), ['#e03a3a', '#ff8c2b', '#f7d21e'], 8, 0.2, 2.5);
        A.burst(540, 700, 0.5, ['#ffd93b', '#fff', '#ff8c2b'], 20, 280); } },
  ],
});
