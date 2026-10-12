// Chispazo News — ¿Qué pasa en la Puerta del Sol? Acampada por la vivienda (para el 13/10/2026, mañana).
// Fuentes: El Salto 8/10 (asambleas, demandas, cómo participar), Moncloa.com 5/10 (Sindicato de Inquilinas, huelga general sin fecha), EFE 12/10 (17 días de acampada).
// Enfoque plural: se cuenta qué es y qué piden, sin tomar partido (cierre: apoyos y críticas, tema electoral del 29-N).
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


function tent(A, s, x, y, k = 1, t = 0) { const e = A.el('g', { html: '<path d="M-110,0 L0,-150 L110,0Z" fill="#f7d94c"/><path d="M0,-150 L0,0 M-30,0 L0,-60 L30,0" stroke="#161412" stroke-width="8" fill="none"/>' }, s); window.gsap.set(e, { x, y, scale: k }); A.pop(e, t); return e; }
function torre(A, s, x, y, k = 1, t = 0) {
  const e = A.el('g', { html: '<rect x="-230" y="-120" width="460" height="240" fill="#f7d94c"/><rect x="-70" y="-300" width="140" height="180" fill="#f7d94c"/><circle cy="-220" r="46" fill="#ffffff"/><path d="M0,-220 V-250 M0,-220 L22,-208" stroke="#161412" stroke-width="7"/><path d="M-30,-300 Q0,-360 30,-300" fill="#f7d94c"/><path d="M-180,-60 V60 M-110,-60 V60 M110,-60 V60 M180,-60 V60" stroke="#161412" stroke-width="9"/><path d="M-40,120 V20 Q0,-20 40,20 V120Z" fill="#161412"/>' }, s);
  window.gsap.set(e, { x, y, scale: k }); A.pop(e, t); return e;
}
VIDEO({
  canal: 'news', personaje: 'chispa',
  titulo: '¿Qué pasa en la Puerta del Sol?',
  escenas: [
    { texto: '¿Qué está pasando en la Puerta del Sol?', destacar: ['Puerta', 'Sol?'], emocion: 'sorpresa',
      arte(A) { const s = panel(A, 'v1'); torre(A, s, 540, 820, 1.2, 0.1); } },
    { texto: 'Hay una acampada por la vivienda que ya cumple 17 días.', destacar: ['acampada', '17'], emocion: 'sorpresa',
      arte(A) { const s = panel(A, 'v2'); [220, 430, 650, 860].forEach((x, i) => tent(A, s, x, 1000, i % 2 ? 0.9 : 1.1, 0.2 + i * 0.12)); const c = card(A, s, 540, 460, 420, 150, 0, 0, '17 DÍAS', 96); A.pop(c, 0.6); A.breathe(c, 1.3); } },
    { texto: 'Empezó a finales de septiembre, tras un desahucio en Madrid.', destacar: ['septiembre,', 'desahucio'], emocion: 'pensar',
      arte(A) { const { el } = A; const s = panel(A, 'v3');
        const h = el('g', { html: '<path d="M-180,0 V-200 L0,-340 L180,-200 V0Z" fill="#f7d94c"/><rect x="-50" y="-140" width="100" height="140" fill="#161412"/>' }, s); window.gsap.set(h, { x: 380, y: 1000 }); A.pop(h, 0.1);
        const b = el('g', { html: '<rect x="-70" y="-60" width="140" height="120" rx="8" fill="#f7d94c"/><path d="M-70,-20 H70" stroke="#161412" stroke-width="7"/>' }, s); A.tl.fromTo(b, { x: 380, y: 940, opacity: 0 }, { x: 780, y: 960, opacity: 1, duration: 0.9, ease: 'power2.out' }, A.at(1.0));
        const c = card(A, s, 540, 420, 500, 140, 0, 0, 'SEPTIEMBRE', 84); A.pop(c, 0.4); } },
    { texto: 'Piden alquileres más bajos y que los contratos se renueven de forma automática.', destacar: ['alquileres', 'automática.'], emocion: 'pensar',
      arte(A) { const s = panel(A, 'v4'); const a = card(A, s, 540, 520, 560, 150, 0, 0, 'ALQUILER ↓', 96); A.pop(a, 0.1); A.breathe(a, 0.8);
        const b = card(A, s, 540, 800, 700, 130, 0, 0, 'RENOVACIÓN AUTOMÁTICA', 60); A.pop(b, 1.4);
        const k = A.el('g', { html: '<circle r="50" fill="#f7d94c"/><circle r="16" fill="#161412"/><path d="M50,0 H190 M150,0 V40 M180,0 V30" stroke="#161412" stroke-width="16" stroke-linecap="round"/>' }, s); window.gsap.set(k, { x: 420, y: 1010 }); A.pop(k, 2.0); } },
    { texto: 'Se organiza en asambleas abiertas, y el Sindicato de Inquilinas está entre los grupos que la impulsan.', destacar: ['asambleas', 'Inquilinas'], emocion: 'feliz',
      arte(A) { const s = panel(A, 'v5'); KIT.person(A, s, 260, 1080, 0.9, { shirt: '#e63b2e', style: 'long', arm: 'point', t: 0.1 }); KIT.person(A, s, 540, 1100, 1.0, { shirt: '#f7d94c', style: 'short', t: 0.25 }); KIT.person(A, s, 820, 1080, 0.9, { shirt: '#f7d94c', style: 'bun', arm: 'wave', t: 0.4 });
        const c = card(A, s, 540, 420, 520, 140, 0, 0, 'ASAMBLEAS', 90); A.pop(c, 0.8); } },
    { texto: 'Ahora preparan una huelga general por la vivienda, todavía sin fecha.', destacar: ['huelga', 'fecha.'], emocion: 'pensar',
      arte(A) { const s = panel(A, 'v6'); const cal = A.el('g', { html: '<rect x="-170" y="-170" width="340" height="340" rx="20" fill="#f7d94c"/><rect x="-170" y="-170" width="340" height="80" rx="20" fill="#e63b2e"/><path d="M-100,-200 V-140 M100,-200 V-140" stroke="#161412" stroke-width="14" stroke-linecap="round"/>' }, s);
        window.gsap.set(cal, { x: 540, y: 860 }); A.pop(cal, 0.1); const q = A.txt('?', 540, 940, 200, '#161412', { parent: s }); A.pop(q, 0.6);
        const c = card(A, s, 540, 420, 640, 140, 0, 0, 'HUELGA GENERAL', 80); A.pop(c, 0.3); } },
    { texto: 'Curiosidad: en la Puerta del Sol está el kilómetro cero, de donde se miden las carreteras radiales de España.', destacar: ['Curiosidad:', 'kilómetro', 'cero,'], emocion: 'sorpresa',
      arte(A) { const s = panel(A, 'v6b');
        const c = card(A, s, 540, 400, 620, 140, 0, 0, 'CURIOSIDAD', 90); A.pop(c, 0.1);
        const pl = A.el('g', { html: '<rect x="-230" y="-110" width="460" height="220" rx="24" fill="#ffffff"/><path d="M-170,0 H170 M0,-80 V80" stroke="#161412" stroke-width="10" stroke-linecap="round"/>' }, s); window.gsap.set(pl, { x: 540, y: 760 }); A.pop(pl, 0.5);
        const k = card(A, s, 540, 760, 360, 120, 0, 0, 'KM 0', 90); A.pop(k, 0.9); A.breathe(k, 1.4);
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dy], i) => KIT.arrow(A, s, 540 + dx * 200, 760 + dy * 150, 540 + dx * 400, 760 + dy * 300, '#161412', 2.0 + i * 0.2)); } },
    { texto: 'Hay quien la apoya y quien la critica.', destacar: ['apoya', 'critica.'], emocion: 'pensar',
      arte(A) { const s = panel(A, 'v7');
        const a = card(A, s, 300, 440, 400, 140, 0, 0, 'A FAVOR', 70); A.pop(a, 0.2);
        const b = card(A, s, 780, 440, 400, 140, 0, 0, 'EN CONTRA', 70); A.pop(b, 0.9);
        const bal = A.el('g', { html: '<path d="M0,0 V-260 M-230,-230 H230 M-230,-230 L-300,-90 H-160Z M230,-230 L160,-90 H300Z M-120,0 H120" stroke="#161412" stroke-width="12" fill="#f7d94c" stroke-linejoin="round" stroke-linecap="round"/><circle cy="-262" r="22" fill="#e63b2e"/>' }, s);
        window.gsap.set(bal, { x: 540, y: 980 }); A.pop(bal, 0.4); } },
    { texto: 'Lo que está claro: la vivienda será uno de los grandes temas de las elecciones del 29 de noviembre.', destacar: ['vivienda', '29'], emocion: 'feliz',
      arte(A) { const s = panel(A, 'v8');
        const c = card(A, s, 540, 440, 680, 150, 0, 0, 'VIVIENDA · 29-N', 80); A.pop(c, 0.2); A.breathe(c, 0.8);
        const u = A.el('g', { html: '<rect x="-180" y="-120" width="360" height="240" rx="16" fill="#f7d94c"/><path d="M-90,-120 H90" stroke="#161412" stroke-width="14" stroke-linecap="round"/><rect x="-60" y="-260" width="120" height="150" fill="#ffffff"/><path d="M-30,-200 L-5,-170 L35,-230" stroke="#e63b2e" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' }, s);
        window.gsap.set(u, { x: 540, y: 900 }); A.pop(u, 0.7); } },
  ],
});
