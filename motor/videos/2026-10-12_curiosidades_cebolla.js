// Bombillazo — ¿Por qué lloramos al cortar cebolla? (12/10/2026)
// Dato: al cortar, la enzima alinasa convierte sulfóxidos de aminoácidos en ácido sulfénico y la lacrimatoria sintasa
// lo transforma en syn-propanotial-S-óxido, gas que irrita la córnea (nervios) y provoca el lagrimeo.
function panel(A, id, c1, c2) {
  const { el } = A;
  const f = el('g');
  const cp = el('clipPath', { id }, f); el('rect', { x: 60, y: 290, width: 960, height: 800, rx: 54 }, cp);
  const s = el('g', { 'clip-path': `url(#${id})` }, f);
  el('rect', { x: 60, y: 290, width: 960, height: 800, fill: A.grad(c1, c2) }, s);
  el('rect', { x: 60, y: 290, width: 960, height: 800, rx: 54, fill: 'none', stroke: '#fff', 'stroke-opacity': 0.3, 'stroke-width': 6 }, f);
  A.pop(f, 0);
  return s;
}
function onion(A, parent, x, y, s) {
  const g = A.el('g', {}, parent); window.gsap.set(g, { x, y, scale: s });
  A.el('path', { d: 'M0,-150 C30,-110 40,-80 40,-60 C150,-40 170,90 90,140 C40,175 -40,175 -90,140 C-170,90 -150,-40 -40,-60 C-40,-80 -30,-110 0,-150z', fill: '#d9a0e0', stroke: '#8a4fa0', 'stroke-width': 8 }, g);
  [-55, 0, 55].forEach((dx) => A.el('path', { d: `M${dx * 0.3},-60 C${dx * 1.6},0 ${dx * 1.6},90 ${dx * 0.8},150`, fill: 'none', stroke: '#fff', 'stroke-opacity': 0.6, 'stroke-width': 6 }, g));
  return g;
}
VIDEO({
  canal: 'curiosidades', personaje: 'chispa',
  titulo: '¿Por qué lloramos al cortar cebolla?',
  escenas: [
    { texto: '¿Por qué lloramos al cortar cebolla?', destacar: ['lloramos'], emocion: 'sorpresa',
      arte(A) {
        const { el, tl, at, th } = A; const s = panel(A, 'c1', '#3a2a7a', '#7b5be0');
        const o = onion(A, s, 540, 700, 1.5); A.pop(o, 0.1); A.float(o, 10, 2, 1);
        [[-1, 330], [1, 330]].forEach(([d, y], i) => {
          for (let k = 0; k < 4; k++) { const t = el('path', { d: 'M0,-24 C18,0 18,18 0,20 C-18,18 -18,0 0,-24z', fill: '#7fd4ff' }, s); window.gsap.set(t, { x: 540 + d * 120, y: 640 });
            tl.fromTo(t, { opacity: 0, y: 640 }, { opacity: 1, y: 640 + 300 + k * 30, x: 540 + d * (170 + k * 40), duration: 0.9, ease: 'power1.in' }, at(0.9 + k * 0.22 + i * 0.05)); tl.to(t, { opacity: 0, duration: 0.2 }, at(1.7 + k * 0.22)); }
        });
        A.charTo({ x: 230, y: 1580, s: 1.1, look: 1 }, 0.2);
      } },
    { texto: 'Spoiler: no es tristeza. Es química.', destacar: ['química.'], emocion: 'feliz',
      arte(A) {
        const { el, tl, at, th } = A; const s = panel(A, 'c2', '#1d4e6e', '#3fb8c9');
        const heart = el('g', {}, s); window.gsap.set(heart, { x: 330, y: 700 });
        el('path', { d: 'M0,70 C-110,-10 -70,-90 0,-40 C70,-90 110,-10 0,70z', fill: '#ff5d7a' }, heart); A.pop(heart, 0.1);
        const x = el('g', {}, s); window.gsap.set(x, { x: 330, y: 700 });
        el('path', { d: 'M-130,-130 L130,130 M130,-130 L-130,130', stroke: '#fff', 'stroke-width': 26, 'stroke-linecap': 'round' }, x); A.pop(x, 0.9);
        const fl = el('g', {}, s); window.gsap.set(fl, { x: 740, y: 700 });
        el('path', { d: 'M-50,-130 h100 M-30,-130 v90 l-90,170 q-10,30 20,30 h200 q30,0 20,-30 l-90,-170 v-90', fill: '#b6f3ff', stroke: '#fff', 'stroke-width': 10, 'stroke-linejoin': 'round' }, fl);
        el('path', { d: 'M-80,70 h160 l40,70 h-240z', fill: A.th.accent2 }, fl); A.pop(fl, 1.3); A.float(fl, 10, 1.8, 2);
        for (let i = 0; i < 4; i++) { const b = el('circle', { r: 12 - i * 2, fill: '#fff', opacity: 0.8 }, s); tl.fromTo(b, { x: 740 + i * 12, y: 620 }, { y: 420 - i * 20, duration: 1.2, repeat: 1, ease: 'none' }, at(1.5 + i * 0.3)); }
      } },
    { texto: 'Dentro de la cebolla hay unas sustancias con azufre... y, guardadas aparte, unas enzimas.', destacar: ['azufre...', 'enzimas.'], emocion: 'pensar',
      arte(A) {
        const { el, tl, at, th } = A; const s = panel(A, 'c3', '#4b2a7a', '#9a63d8');
        const cell = el('g', {}, s); window.gsap.set(cell, { x: 540, y: 690 });
        el('rect', { x: -400, y: -250, width: 800, height: 500, rx: 90, fill: '#f3d9f7', stroke: '#fff', 'stroke-width': 10 }, cell);
        el('line', { x1: 0, y1: -250, x2: 0, y2: 250, stroke: '#8a4fa0', 'stroke-width': 10, 'stroke-dasharray': '18 14' }, cell);
        A.pop(cell, 0);
        for (let i = 0; i < 6; i++) { const d = el('circle', { r: 26, fill: '#ffc400', stroke: '#b88900', 'stroke-width': 5 }, s); window.gsap.set(d, { x: 330 + (i % 3) * 90, y: 600 + Math.floor(i / 3) * 110 }); A.pop(d, 0.6 + i * 0.1); A.float(d, 10, 1.4 + i * 0.1, i); }
        for (let i = 0; i < 4; i++) { const e = el('g', {}, s); window.gsap.set(e, { x: 650 + (i % 2) * 110, y: 600 + Math.floor(i / 2) * 120 });
          el('path', { d: 'M-34,-34 h68 l-12,68 h-44z', fill: '#4cd0a0', stroke: '#1e8a67', 'stroke-width': 6, 'stroke-linejoin': 'round' }, e); A.pop(e, 1.8 + i * 0.1); A.float(e, 10, 1.5, i); }
        A.txt('S', 465, 500, 70, '#b88900', { parent: s }); A.txt('enzimas', 705, 500, 54, '#1e8a67', { parent: s });
      } },
    { texto: 'Cuando la cortas, rompes sus células y todo se mezcla.', destacar: ['rompes', 'mezcla.'], emocion: 'sorpresa',
      arte(A) {
        const { el, tl, at, th } = A; const s = panel(A, 'c4', '#5a2d82', '#c06ae0');
        const cell = el('g', {}, s); window.gsap.set(cell, { x: 540, y: 700 });
        el('rect', { x: -400, y: -250, width: 800, height: 500, rx: 90, fill: '#f3d9f7', stroke: '#fff', 'stroke-width': 10 }, cell);
        const kn = el('g', { html: '<path d="M-20,-300 h40 v200 h-40z" fill="#444c66"/><path d="M-20,-100 l40,0 l-6,40 q-14,20 -28,0z" fill="#b8c0d8"/><path d="M-90,-300 l180,0 l-50,-100 h-80z" fill="#dfe5f7"/>' }, s);
        window.gsap.set(kn, { x: 540, y: 380, rotation: 0 });
        tl.to(kn, { y: 640, duration: 0.45, ease: 'power3.in' }, at(0.3)); tl.to(kn, { y: 420, duration: 0.5, ease: 'power2.out' }, at(1.0));
        tl.to(cell, { keyframes: { x: [540, 530, 550, 540] }, duration: 0.3 }, at(0.75));
        for (let i = 0; i < 12; i++) { const d = el('circle', { r: 20, fill: i % 2 ? '#ffc400' : '#4cd0a0' }, s); window.gsap.set(d, { x: i % 2 ? 380 + (i * 13) % 100 : 700 - (i * 11) % 100, y: 650 + (i % 3) * 60 });
          tl.fromTo(d, { opacity: 0 }, { opacity: 1, x: 540 + Math.sin(i) * 120, y: 700 + Math.cos(i * 2) * 100, duration: 0.9, ease: 'power2.inOut' }, at(0.9 + i * 0.05)); }
        A.burst(540, 700, 0.8, ['#fff', '#ffc400', '#4cd0a0'], 16, 220);
      } },
    { texto: 'Las enzimas fabrican un gas irritante: el factor lacrimógeno.', destacar: ['gas', 'lacrimógeno.'], emocion: 'pensar',
      arte(A) {
        const { el, tl, at, th } = A; const s = panel(A, 'c5', '#2b2f7a', '#6a6be0');
        const lab = el('g', {}, s); window.gsap.set(lab, { x: 540, y: 760 });
        el('path', { d: 'M-70,-250 h140 M-50,-250 v150 l-170,290 q-20,50 30,50 h380 q50,0 30,-50 l-170,-290 v-150', fill: 'rgba(182,243,255,0.25)', stroke: '#fff', 'stroke-width': 12, 'stroke-linejoin': 'round' }, lab);
        el('path', { d: 'M-160,110 h320 l60,100 h-440z', fill: '#4cd0a0', opacity: 0.8 }, lab); A.pop(lab, 0);
        for (let i = 0; i < 8; i++) { const c = el('circle', { r: 30 + (i % 3) * 8, fill: '#e8ff7a', opacity: 0.8 }, s); tl.fromTo(c, { x: 540 + (i - 4) * 28, y: 760, opacity: 0, scale: 0.4 }, { x: 540 + Math.sin(i * 1.7) * 90, y: 400 - (i % 3) * 30, opacity: 0.85, scale: 1, duration: 1.8, ease: 'power1.out', repeat: 1 }, at(0.5 + i * 0.22)); }
        A.txt('gas', 540, 1040, 64, '#e8ff7a', { parent: s });
      } },
    { texto: 'Ese gas flota hasta tus ojos y los irrita.', destacar: ['flota', 'irrita.'], emocion: 'sorpresa',
      arte(A) {
        const { el, tl, at, th } = A; const s = panel(A, 'c6', '#1f3a6e', '#4f8fe0');
        const eye = el('g', {}, s); window.gsap.set(eye, { x: 760, y: 700 });
        el('path', { d: 'M-190,0 Q0,-170 190,0 Q0,170 -190,0z', fill: '#fff', stroke: '#141a3a', 'stroke-width': 10 }, eye);
        const ir = el('circle', { r: 66, fill: '#4a8f62', stroke: '#141a3a', 'stroke-width': 8 }, eye); el('circle', { r: 28, fill: '#141a3a' }, eye);
        A.pop(eye, 0); tl.to(eye, { scaleY: 0.2, duration: 0.1, yoyo: true, repeat: 1, transformOrigin: '50% 50%' }, at(1.8));
        for (let i = 0; i < 7; i++) { const c = el('circle', { r: 26, fill: '#e8ff7a', opacity: 0.8 }, s); tl.fromTo(c, { x: 150 + i * 30, y: 880 - (i % 3) * 60, opacity: 0 }, { x: 640 + (i % 3) * 20, y: 700 + (i - 3) * 14, opacity: 0.9, duration: 1.4, ease: 'power1.inOut' }, at(0.3 + i * 0.18)); }
        A.burst(760, 700, 1.7, ['#ff5d7a', '#fff'], 10, 160);
      } },
    { texto: 'Y tus ojos se defienden como mejor saben: con lágrimas, para lavarlo.', destacar: ['lágrimas,', 'lavarlo.'], emocion: 'feliz',
      arte(A) {
        const { el, tl, at, th } = A; const s = panel(A, 'c7', '#16507a', '#47c0e8');
        const eye = el('g', {}, s); window.gsap.set(eye, { x: 540, y: 600 });
        el('path', { d: 'M-230,0 Q0,-200 230,0 Q0,200 -230,0z', fill: '#fff', stroke: '#141a3a', 'stroke-width': 10 }, eye);
        el('circle', { r: 80, fill: '#4a8f62', stroke: '#141a3a', 'stroke-width': 8 }, eye); el('circle', { r: 34, fill: '#141a3a' }, eye); A.pop(eye, 0);
        for (let i = 0; i < 9; i++) { const t = el('path', { d: 'M0,-26 C20,0 20,20 0,22 C-20,20 -20,0 0,-26z', fill: '#7fd4ff', stroke: '#fff', 'stroke-width': 3 }, s);
          tl.fromTo(t, { x: 440 + (i % 3) * 100, y: 680, opacity: 0 }, { y: 1050, opacity: 1, duration: 0.9, ease: 'power1.in', repeat: 1 }, at(0.5 + i * 0.25)); }
        const puddle = el('ellipse', { cx: 540, cy: 1040, rx: 0, ry: 0, fill: '#7fd4ff', opacity: 0.7 }, s);
        tl.to(puddle, { attr: { rx: 330, ry: 32 }, duration: 2.5, ease: 'power1.out' }, at(0.9));
      } },
    { texto: 'Un truco que ayuda: enfría la cebolla antes y usa un cuchillo bien afilado. Romperás menos células.', destacar: ['enfría', 'afilado.'], emocion: 'pensar',
      arte(A) {
        const { el, tl, at, th } = A; const s = panel(A, 'c8', '#145a6e', '#5fd0d0');
        const o = onion(A, s, 360, 700, 1.1); A.pop(o, 0);
        for (let i = 0; i < 6; i++) { const f = el('path', { d: 'M0,-30 v60 M-26,-15 l52,30 M-26,15 l52,-30', stroke: '#fff', 'stroke-width': 7, 'stroke-linecap': 'round' }, s); tl.fromTo(f, { x: 250 + (i % 3) * 110, y: 520, opacity: 0, rotation: 0 }, { y: 560 + (i % 2) * 40, opacity: 1, rotation: 90, duration: 1, ease: 'power1.out' }, at(0.7 + i * 0.15)); }
        const kn = el('g', { html: '<path d="M0,0 l260,-30 l-20,50 l-240,30z" fill="#dfe5f7" stroke="#8b94b8" stroke-width="6"/><path d="M-110,10 h110 v34 h-110z" fill="#444c66"/>' }, s);
        tl.fromTo(kn, { x: 560, y: 520, opacity: 0 }, { x: 680, y: 640, opacity: 1, duration: 0.6, ease: 'back.out' }, at(2.0));
        A.burst(780, 620, 2.6, ['#fff', th.accent2], 14, 200);
        A.txt('✓', 800, 960, 120, '#b6ffd9', { parent: s });
      } },
    { texto: 'Síguenos: cada día, una curiosidad que no sabías.', destacar: ['Síguenos:', 'curiosidad'], emocion: 'feliz', transicion: 'iris',
      arte(A) {
        const { el, tl, at, th } = A;
        const rays = el('g', { opacity: 0.16 }); window.gsap.set(rays, { x: 540, y: 640 });
        for (let i = 0; i < 14; i++) el('path', { d: 'M0,0 L-70,-760 L70,-760 Z', fill: '#fff', transform: `rotate(${i * 25.7})` }, rays);
        tl.to(rays, { rotation: 25, svgOrigin: '0 0', duration: A.dur + 0.5, ease: 'none' }, at(0));
        A.charTo({ x: 540, y: 660, s: 1.55 }, 0.0, 0.7); A.charTo({ wave: 1 }, 0.6, 0.3);
        const btn = el('g'); window.gsap.set(btn, { x: 540, y: 1020 });
        const face = A.card(-280, -72, 560, 136, A.grad('#ff6b78', '#e8344a'), 68, btn);
        const label = A.txt('SUSCRÍBETE', 30, 22, 56, '#fff', { parent: btn }); A.pop(btn, 0.7);
        tl.call(() => { label.textContent = 'SUSCRITO ✓'; }, null, at(1.75));
        A.burst(540, 1020, 1.75, [th.accent2, '#fff', th.accent3], 20, 260);
      } },
  ],
});
