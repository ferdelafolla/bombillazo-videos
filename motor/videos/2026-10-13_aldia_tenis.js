// Chispazo Hoy — ¿Por qué en tenis se cuenta 15, 30, 40? (para el 13/10/2026). Deportes + curiosidad.
// Tendencia: Masters 1000 de Shanghái (Alcaraz, Jódar, Lehecka en Google Trends).
// Fuentes: Excélsior y Sharjah24 12/10 (Bergs gana a Alcaraz 7-5, 7-6(4), tercera ronda); De Último Minuto y Diario de Santiago 12/10 (Jódar remonta a Lehecka 4-6, 7-6, 6-4 y pasa a octavos).
// Curiosidad: teoría del reloj (origen del 15-30-40, presentada como "la teoría más conocida").
function panel(A, id) { return A.panel(id); }
function card(A, s, x, y, w, h, text, size) {
  const g = A.el('g', {}, s); window.gsap.set(g, { x, y }); A.card(-w / 2, -h / 2, w, h, A.th.cardFill, 44, g); A.txt(text, 0, size * 0.36, size, A.th.cardInk, { parent: g }); return g;
}
function ball(A, s, x, y, k = 1) {
  const o = A.el('g', {}, s); window.gsap.set(o, { x, y, scale: k });
  const i = A.el('g', { html: '<circle r="70" fill="#f7d94c"/><path d="M-66,-22 Q-20,0 -66,22 M66,-22 Q20,0 66,22" stroke="#161412" stroke-width="9" fill="none" stroke-linecap="round"/>' }, o);
  return { o, i };
}
function racket(A, s, x, y, k = 1, rot = -20) {
  const o = A.el('g', {}, s); window.gsap.set(o, { x, y, scale: k });
  const i = A.el('g', { html: '<ellipse cy="-150" rx="100" ry="130" fill="#ffffff"/><path d="M-60,-240 V-60 M-20,-275 V-25 M20,-275 V-25 M60,-240 V-60 M-90,-200 H90 M-100,-150 H100 M-90,-100 H90" stroke="#161412" stroke-width="5"/><rect x="-16" y="-25" width="32" height="170" rx="14" fill="#e63b2e"/>' }, o);
  window.gsap.set(i, { rotation: rot, svgOrigin: '0 0' });
  return { o, i };
}
function reloj(A, s, x, y, k = 1) {
  const o = A.el('g', {}, s); window.gsap.set(o, { x, y, scale: k });
  A.el('circle', { r: 230, fill: '#ffffff' }, o);
  [['15', 160, 26], ['30', 0, 196], ['45', -175, 26], ['60', 0, -150]].forEach(([t, tx, ty]) => A.txt(t, tx, ty, 74, '#161412', { parent: o }));
  const hand = A.el('g', { html: '<path d="M0,0 V-170" stroke="#e63b2e" stroke-width="18" stroke-linecap="round"/><circle r="20" fill="#161412"/>' }, o);
  return { o, hand };
}
VIDEO({
  canal: 'aldia', personaje: 'chispa',
  titulo: '¿Por qué el tenis cuenta 15, 30, 40?',
  escenas: [
    { texto: '¿Por qué en el tenis se cuenta 15, 30, 40?', destacar: ['15,', '30,', '40?'], emocion: 'sorpresa',
      arte(A) { const s = panel(A, 'v1');
        const b = ball(A, s, 540, 880, 3); A.pop(b.o, 0.1); A.tl.to(b.i, { rotation: 360, svgOrigin: '0 0', duration: 2, ease: 'none' }, A.at(0.1));
        ['15', '30', '40'].forEach((t, i) => { const c = card(A, s, 260 + i * 280, 470, 220, 150, t, 100); A.pop(c, 0.4 + i * 0.25); }); } },
    { texto: 'Este lunes, Carlos Alcaraz cayó en Shanghái ante el belga Zizou Bergs.', destacar: ['Alcaraz', 'Shanghái', 'Bergs.'], emocion: 'sorpresa',
      arte(A) { const s = panel(A, 'v2');
        KIT.person(A, s, 330, 1080, 1.0, { shirt: '#ffffff', style: 'short', t: 0.1 });
        KIT.person(A, s, 750, 1080, 1.0, { shirt: '#e63b2e', style: 'short', arm: 'wave', t: 0.3 });
        const r = racket(A, s, 840, 820, 0.7, 25); A.pop(r.o, 0.5);
        const c = card(A, s, 540, 440, 560, 140, 'SHANGHÁI', 90); A.pop(c, 0.2); } },
    { texto: 'Siete a cinco y siete a seis, en dos sets.', destacar: ['dos', 'sets.'], emocion: 'pensar',
      arte(A) { const s = panel(A, 'v3');
        const a = card(A, s, 540, 560, 520, 170, '7-5', 130); A.pop(a, 0.1);
        const b = card(A, s, 540, 830, 520, 170, '7-6', 130); A.pop(b, 0.8); A.breathe(b, 1.4); } },
    { texto: 'Y el joven Rafa Jódar remontó y ya está en octavos.', destacar: ['Jódar', 'octavos.'], emocion: 'feliz',
      arte(A) { const s = panel(A, 'v4');
        KIT.person(A, s, 540, 1080, 1.1, { shirt: '#f7d94c', style: 'short', arm: 'wave', t: 0.1 });
        KIT.arrow(A, s, 260, 940, 380, 620, '#161412', 0.6);
        const c = card(A, s, 540, 440, 520, 140, 'OCTAVOS', 96); A.pop(c, 0.9); A.breathe(c, 1.5); } },
    { texto: 'Pero, ¿y esos números tan raros? La teoría más conocida: un reloj.', destacar: ['raros?', 'reloj.'], emocion: 'pensar',
      arte(A) { const s = panel(A, 'v5');
        const c = card(A, s, 540, 400, 620, 140, 'CURIOSIDAD', 90); A.pop(c, 0.1);
        const r = reloj(A, s, 540, 860, 0.95); A.pop(r.o, 0.6); A.tl.fromTo(r.hand, { rotation: -60, svgOrigin: '0 0' }, { rotation: 0, svgOrigin: '0 0', duration: 1.2, ease: 'back.out(1.6)' }, A.at(1.2)); } },
    { texto: 'En la Francia medieval, los puntos se marcaban con las agujas: 15, 30, 45.', destacar: ['Francia', 'agujas:', '45.'], emocion: 'feliz',
      arte(A) { const s = panel(A, 'v6');
        const r = reloj(A, s, 540, 820, 1.2); A.pop(r.o, 0.1);
        A.tl.fromTo(r.hand, { rotation: 0, svgOrigin: '0 0' }, { rotation: 90, svgOrigin: '0 0', duration: 0.5, ease: "power3.out" }, A.at(3.5));
        A.tl.to(r.hand, { rotation: 180, svgOrigin: '0 0', duration: 0.5, ease: 'power3.out' }, A.at(4.2));
        A.tl.to(r.hand, { rotation: 270, svgOrigin: '0 0', duration: 0.5, ease: 'power3.out' }, A.at(4.9)); } },
    { texto: 'El 45 se acortó a 40, para dejar sitio a la ventaja.', destacar: ['40,', 'ventaja.'], emocion: 'sorpresa',
      arte(A) { const s = panel(A, 'v7');
        const a = card(A, s, 330, 560, 300, 160, '45', 120); A.pop(a, 0.1);
        KIT.arrow(A, s, 500, 560, 600, 560, '#161412', 0.6);
        const b = card(A, s, 760, 560, 300, 160, '40', 120); A.pop(b, 0.9); A.breathe(b, 1.4);
        const c = card(A, s, 540, 860, 560, 140, 'VENTAJA', 90); A.pop(c, 2.2); } },
    { texto: 'Suscríbete: mañana te explico por qué en inglés el cero del tenis se dice "love".', destacar: ['Suscríbete:', 'love".'], emocion: 'feliz', transicion: 'iris',
      arte(A) { const s = panel(A, 'v8');
        const b = ball(A, s, 540, 820, 3); A.pop(b.o, 0.1); A.breathe(b.o, 0.8);
        const h = A.el('path', { d: 'M0,40 C-90,-30 -60,-110 0,-60 C60,-110 90,-30 0,40Z', fill: '#e63b2e' }, s); window.gsap.set(h, { x: 540, y: 470, scale: 1.6 }); A.pop(h, 0.7); } },
  ],
});
