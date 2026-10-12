// Chispazo — ¿Qué es el párkinson? Vídeo divulgativo con dónde donar (petición del usuario). Sin nombres de personas, sin "suscríbete".
// Fuentes: OMS (más de 8,5 millones de personas en el mundo, 2019), Federación Española de Párkinson (esparkinson.es), Michael J. Fox Foundation (michaeljfox.org).
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


function brain(A, s, x, y, k = 1, t = 0) {
  const e = A.el('g', { html: '<path d="M-200,40 C-260,-40 -200,-170 -90,-170 C-60,-230 60,-230 90,-170 C200,-170 260,-40 200,40 C220,120 120,170 40,140 C0,190 -80,170 -100,130 C-190,150 -240,100 -200,40Z" fill="#f7d94c"/><path d="M0,-200 V140 M-120,-80 Q-60,-40 -120,10 M120,-80 Q60,-40 120,10 M-60,60 Q0,40 60,60" stroke="#161412" stroke-width="9" fill="none" stroke-linecap="round"/>' }, s);
  window.gsap.set(e, { x, y, scale: k }); A.pop(e, t); return e;
}
function heart(A, s, x, y, k = 1, t = 0) { const e = A.el('g', { html: '<path d="M0,60 C-120,-20 -110,-120 -40,-120 C-10,-120 0,-90 0,-80 C0,-90 10,-120 40,-120 C110,-120 120,-20 0,60Z" fill="#e63b2e"/>' }, s); window.gsap.set(e, { x, y, scale: k }); A.pop(e, t); return e; }
VIDEO({
  canal: 'curiosidades', personaje: 'chispa', suscripcion: false,
  titulo: '¿Qué es el párkinson?',
  escenas: [
    { texto: '¿Qué es el párkinson?', destacar: ['párkinson?'], emocion: 'pensar',
      arte(A) { const s = panel(A, 'p1'); brain(A, s, 540, 820, 1.3, 0.1); } },
    { texto: 'Es una enfermedad del cerebro: poco a poco se pierden las neuronas que fabrican dopamina.', destacar: ['neuronas', 'dopamina.'], emocion: 'pensar',
      arte(A) { const s = panel(A, 'p2'); KIT.neuron(A, s, 420, 760, 1.1, { fade: true, t: 0.1 }); const c = card(A, s, 540, 420, 460, 140, 0, 0, 'DOPAMINA', 90); A.pop(c, 0.6); } },
    { texto: 'La dopamina ayuda a controlar el movimiento.', destacar: ['movimiento.'], emocion: 'feliz',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'p3'); KIT.person(A, s, 700, 1090, 1.05, { shirt: '#f7d94c', style: 'short', arm: 'wave', t: 0.2 });
        for (let i = 0; i < 6; i++) { const d = el('circle', { r: 16, fill: '#e63b2e' }, s); tl.fromTo(d, { x: 160, y: 700 + (i % 3) * 40, opacity: 0 }, { x: 560, y: 760, opacity: 1, duration: 0.9, ease: 'power1.inOut', repeat: 1 }, at(0.3 + i * 0.18)); } } },
    { texto: 'Por eso aparecen temblores, rigidez y lentitud.', destacar: ['temblores,', 'rigidez', 'lentitud.'], emocion: 'pensar',
      arte(A) { const s = panel(A, 'p4'); [['TEMBLORES', 480], ['RIGIDEZ', 700], ['LENTITUD', 920]].forEach(([t, y], i) => { const c = card(A, s, 540, y, 560, 150, 0, 0, t, 88); A.pop(c, 0.2 + i * 0.7); }); } },
    { texto: 'En el mundo la tienen más de ocho millones y medio de personas.', destacar: ['ocho', 'millones'], emocion: 'sorpresa',
      arte(A) { const s = panel(A, 'p5'); const g = A.el('g', { html: '<circle r="230" fill="#f7d94c"/><ellipse rx="90" ry="230" fill="none" stroke="#161412" stroke-width="8"/><path d="M-230,0 H230 M-200,-110 H200 M-200,110 H200" stroke="#161412" stroke-width="8"/>' }, s);
        window.gsap.set(g, { x: 540, y: 820 }); A.pop(g, 0.1); const c = card(A, s, 540, 420, 420, 150, 0, 0, '+8,5 M', 100); A.pop(c, 0.6); A.breathe(c, 1.2); } },
    { texto: 'Aún no tiene cura, pero los tratamientos alivian los síntomas y la investigación avanza.', destacar: ['cura,', 'investigación'], emocion: 'feliz',
      arte(A) { const s = panel(A, 'p6'); KIT.lineChart(A, s, [1, 2, 2.5, 4, 5.5, 7], 160, 520, 760, 420, '#e63b2e'); KIT.magnifier(A, s, 780, 960, 1.0); } },
    { texto: 'Si quieres ayudar, puedes donar a la Federación Española de Párkinson o a la Fundación Michael J. Fox.', destacar: ['donar', 'Federación', 'Fundación'], emocion: 'feliz',
      arte(A) { const s = panel(A, 'p7'); heart(A, s, 540, 520, 1.3, 0.1);
        const a = card(A, s, 540, 780, 760, 140, 0, 0, 'esparkinson.es', 76); A.pop(a, 1.0); const b = card(A, s, 540, 960, 760, 140, 0, 0, 'michaeljfox.org', 76); A.pop(b, 2.6); } },
    { texto: 'Cada donación acerca un poco más la cura.', destacar: ['donación', 'cura.'], emocion: 'feliz',
      arte(A) { const s = panel(A, 'p8'); heart(A, s, 540, 720, 2.2, 0.05); A.charTo({ wave: 1 }, 0.1, 0.3); } },
  ],
});
