// Chispazo News — Pepe Colubi anuncia que tiene párkinson / ¿qué es el párkinson? (12/10/2026)
// Fuentes: elindependiente.com, hola.com, eldiario.es, formulatv.com (11/10/2026); tendencia ES en Google Trends (12/10/2026).
function panel(A, id, c1, c2) {
  const { el } = A; const f = el('g');
  const cp = el('clipPath', { id }, f); el('rect', { x: 60, y: 290, width: 960, height: 800, rx: 54 }, cp);
  const s = el('g', { 'clip-path': `url(#${id})` }, f);
  el('rect', { x: 60, y: 290, width: 960, height: 800, fill: A.grad(c1, c2) }, s);
  el('rect', { x: 60, y: 290, width: 960, height: 800, rx: 54, fill: 'none', stroke: '#fff', 'stroke-opacity': 0.3, 'stroke-width': 6 }, f);
  A.pop(f, 0); return s;
}
function brain(A, s, x, y, k, col = '#f4a9c0') {
  const g = A.el('g', { html: `<ellipse rx="170" ry="120" fill="${col}"/><ellipse cx="-70" cy="-40" rx="70" ry="50" fill="#fff" fill-opacity=".25"/><path d="M0,-118 C-30,-40 30,40 0,118" stroke="#c4607f" stroke-width="8" fill="none"/><path d="M-110,-20 q40,30 90,0 M20,30 q50,30 100,-10 M-90,50 q30,-30 70,-10" stroke="#c4607f" stroke-width="6" fill="none"/>` }, s);
  window.gsap.set(g, { x, y, scale: k }); return g;
}
VIDEO({
  canal: 'news', personaje: 'chispa',
  titulo: '¿Qué es el párkinson?',
  escenas: [
    { texto: 'Pepe Colubi, humorista, ha contado que tiene párkinson.', destacar: ['Colubi,', 'párkinson.'], emocion: 'pensar',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'n1', '#1f3a6e', '#4f7fd0');
        const tag = el('g'); window.gsap.set(tag, { x: 540, y: 560 }); A.card(-400, -90, 800, 180, A.grad('#ffd93b', '#ffb300'), 44, tag); A.txt('TENDENCIA EN ESPAÑA', 0, 18, 58, '#2b2250', { parent: tag }); A.pop(tag, 0.1);
        A.txt('Lo ha anunciado él mismo', 540, 800, 56, '#fff', { parent: s }); A.burst(540, 560, 0.5, ['#ffd93b', '#fff', '#4f7fd0'], 16, 240); } },
    { texto: 'Es una enfermedad del cerebro que avanza poco a poco.', destacar: ['cerebro', 'poco'], emocion: 'pensar',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'n2', '#4a2a6e', '#b06ae0');
        const b = brain(A, s, 540, 690, 1.5); A.pop(b, 0.1); A.float(b, 10, 2, 0); } },
    { texto: 'Se pierden unas células que fabrican dopamina.', destacar: ['células', 'dopamina.'], emocion: 'sorpresa',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'n3', '#2a4a7a', '#6aaee0');
        for (let k = 0; k < 8; k++) { const c = el('circle', { r: 34, fill: '#ffd93b' }, s); window.gsap.set(c, { x: 200 + (k % 4) * 220, y: 560 + Math.floor(k / 4) * 260 }); A.pop(c, 0.2 + k * 0.1);
          if (k % 2) tl.to(c, { opacity: 0.12, scale: 0.6, duration: 0.8 }, at(1.6 + k * 0.15)); }
        A.txt('dopamina', 540, 1040, 70, '#fff', { parent: s }); } },
    { texto: 'La dopamina ayuda a controlar los movimientos del cuerpo.', destacar: ['dopamina', 'movimientos'], emocion: 'pensar',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'n4', '#1f5a4a', '#4fc9a0');
        const p = el('g', { html: '<circle cy="-150" r="60" fill="#f1c9a5"/><path d="M-70,0 q0,-110 70,-110 q70,0 70,110z" fill="#e8553a"/><path d="M-60,-30 L-140,40 M60,-30 L140,40" stroke="#f1c9a5" stroke-width="22" stroke-linecap="round"/>' }, s);
        window.gsap.set(p, { x: 540, y: 900 }); A.pop(p, 0.2); A.float(p, 12, 1.6, 0); } },
    { texto: 'Por eso pueden aparecer temblores, rigidez y movimientos más lentos.', destacar: ['temblores,', 'rigidez', 'lentos.'], emocion: 'pensar',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'n5', '#5a3d2a', '#e0a06a');
        ['temblores', 'rigidez', 'lentitud'].forEach((t, i) => { const g = el('g'); window.gsap.set(g, { x: 540, y: 500 + i * 190 }); A.card(-330, -70, 660, 140, A.grad('#ffd93b', '#ffb300'), 40, g); A.txt(t, 0, 24, 72, '#2b2250', { parent: g }); A.pop(g, 0.3 + i * 0.5);
          if (i === 0) tl.to(g, { x: '+=8', duration: 0.06, yoyo: true, repeat: 30 }, at(1.0)); }); } },
    { texto: 'No tiene cura, pero hay tratamientos y ejercicio que ayudan a controlar los síntomas.', destacar: ['cura,', 'tratamientos', 'ejercicio'], emocion: 'feliz',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'n6', '#2a5a3a', '#7ccf8c');
        const h = el('g', { html: '<path d="M0,60 C-120,-20 -80,-100 0,-50 C80,-100 120,-20 0,60z" fill="#ff6b78"/>' }, s); window.gsap.set(h, { x: 540, y: 640, scale: 2 }); A.pop(h, 0.2); A.float(h, 12, 1.4, 0);
        A.txt('Cada persona es distinta', 540, 1010, 56, '#fff', { parent: s }); } },
    { texto: 'Esto es Chispazo News: lo más buscado en España, en un minuto.', destacar: ['Chispazo', 'minuto.'], emocion: 'feliz', transicion: 'iris',
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
