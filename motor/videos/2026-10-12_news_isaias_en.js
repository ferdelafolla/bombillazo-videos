// Chispazo News — Why do hurricanes knock out power? (12/10/2026). Google Trends US/ES: Hurricane Isaias (Cat 2 landfall near Destin, FL).
// Sources: FOX10 (Cat 2, 105 mph, outages in AL/FL), WFTV, weather.com recap.
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

function spiral(A, s, x, y, k = 1, t = 0) {
  const e = A.el('g', {}, s); window.gsap.set(e, { x, y, scale: k }); const r = A.el('g', {}, e);
  for (let i = 0; i < 4; i++) A.el('path', { d: 'M0,0 C60,-40 140,-30 170,40', stroke: '#e6f2ff', 'stroke-width': 34 - i * 4, fill: 'none', 'stroke-linecap': 'round', opacity: 0.9, transform: `rotate(${i * 90})` }, r);
  A.el('circle', { r: 34, fill: '#1a2a4a' }, e);
  A.pop(e, t); A.tl.to(r, { rotation: -360, svgOrigin: '0 0', duration: 3, ease: 'none', repeat: Math.ceil(A.dur / 3) }, A.at(t));
  return e;
}
function pole(A, s, x, y, k = 1) {
  const e = A.el('g', { html: '<rect x="-12" y="-360" width="24" height="360" fill="#7a5a3a"/><rect x="-90" y="-340" width="180" height="18" rx="6" fill="#7a5a3a"/><circle cx="-76" cy="-344" r="10" fill="#cfe"/><circle cx="76" cy="-344" r="10" fill="#cfe"/>' }, s);
  window.gsap.set(e, { x, y, scale: k }); return e;
}
function house(A, s, x, y, k = 1, lit = true) {
  const e = A.el('g', {}, s); window.gsap.set(e, { x, y, scale: k });
  A.el('path', { d: 'M-100,0 V-120 L0,-200 L100,-120 V0Z', fill: '#e8d6c0' }, e); A.el('path', { d: 'M-120,-112 L0,-214 L120,-112', stroke: '#b5483a', 'stroke-width': 22, fill: 'none', 'stroke-linejoin': 'round' }, e);
  const w1 = A.el('rect', { x: -70, y: -110, width: 50, height: 50, rx: 6, fill: lit ? '#ffd93b' : '#334' }, e);
  const w2 = A.el('rect', { x: 20, y: -110, width: 50, height: 50, rx: 6, fill: lit ? '#ffd93b' : '#334' }, e);
  A.el('rect', { x: -22, y: -60, width: 44, height: 60, rx: 6, fill: '#8a5a3a' }, e);
  return { e, lights: [w1, w2] };
}
VIDEO({
  canal: 'news', personaje: 'chispa',
  titulo: 'Why do hurricanes knock out power?',
  escenas: [
    { texto: 'Why do hurricanes knock out the power?', destacar: ['hurricanes', 'power?'], emocion: 'sorpresa',
      arte(A) { const { tl, at } = A; const s = panel(A, 'h1', '#16233f', '#3a5a8a');
        spiral(A, s, 540, 560, 1.3, 0.1);
        const h = house(A, s, 540, 1020, 1.1, true); A.pop(h.e, 0.3);
        h.lights.forEach((l) => tl.to(l, { attr: { fill: '#334' }, duration: 0.05, repeat: 3, yoyo: true }, at(1.6)));
        h.lights.forEach((l) => tl.set(l, { attr: { fill: '#334' } }, at(2.0))); } },
    { texto: 'Hurricane Isaias hit Florida near Destin as a Category Two storm.', destacar: ['Isaias', 'Two'], emocion: 'pensar',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'h2', '#123a5a', '#2f7ab0');
        const land = el('path', { d: 'M60,820 C240,800 400,830 560,812 C700,800 820,830 900,900 C930,960 960,1040 980,1100 H60z', fill: '#4f9a45' }, s); A.pop(land, 0.1);
        const sp = spiral(A, s, 980, 420, 0.8, 0.2); tl.to(sp, { x: 560, y: 760, duration: 2.2, ease: 'power1.inOut' }, at(0.5));
        const pin = el('g', { html: '<path d="M0,0 C-40,-50 -40,-100 0,-110 C40,-100 40,-50 0,0Z" fill="#ff3b5c"/><circle cy="-72" r="16" fill="#fff"/>' }, s); window.gsap.set(pin, { x: 560, y: 820 }); A.pop(pin, 2.6);
        const t = card(A, s, 300, 420, 360, 130, '#ffd93b', '#ffb300', 'CAT 2', 96); A.pop(t, 0.6); A.breathe(t, 1.4); } },
    { texto: 'Hundreds of thousands of homes in Florida and Alabama lost power.', destacar: ['Hundreds', 'power.'], emocion: 'sorpresa',
      arte(A) { const { tl, at } = A; const s = panel(A, 'h3', '#1a1f3a', '#3a4270');
        for (let i = 0; i < 12; i++) { const x = 170 + (i % 4) * 245, y = 560 + Math.floor(i / 4) * 230; const h = house(A, s, x, y, 0.62, true); A.pop(h.e, 0.1 + i * 0.05);
          h.lights.forEach((l) => tl.set(l, { attr: { fill: '#334' } }, at(1.4 + ((i * 7) % 12) * 0.12))); } } },
    { texto: 'Winds over one hundred miles per hour snap trees and branches onto power lines.', destacar: ['hundred', 'snap'], emocion: 'sorpresa',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'h4', '#2a3a5a', '#6a8ac0'); KIT.ground(A, s);
        pole(A, s, 250, 940, 1); pole(A, s, 830, 940, 1);
        const wire = el('path', { d: 'M174,-596 Q540,-520 906,-596', transform: 'translate(0,1200)', stroke: '#1a1a2a', 'stroke-width': 8, fill: 'none' }, s);
        const treeP = el('g', {}, s); window.gsap.set(treeP, { x: 540, y: 940 });
        const tree = el('g', { html: '<rect x="-20" y="-300" width="40" height="300" fill="#6a4a2a"/><circle cy="-330" r="120" fill="#3fae52"/><circle cx="-80" cy="-280" r="80" fill="#2f8a40"/><circle cx="80" cy="-280" r="80" fill="#2f8a40"/>' }, treeP);
        tl.to(tree, { rotation: 8, svgOrigin: '0 0', duration: 0.3, yoyo: true, repeat: 5, ease: 'sine.inOut' }, at(0.2));
        tl.to(tree, { rotation: -62, svgOrigin: '0 0', duration: 0.5, ease: 'power3.in' }, at(2.2));
        tl.to(wire, { attr: { d: 'M174,-596 Q540,-380 906,-596' }, duration: 0.3, ease: 'power2.out' }, at(2.6));
        A.burst(420, 650, 2.7, ['#ffd93b', '#fff', '#7fd4ff'], 18, 200);
        for (let i = 0; i < 6; i++) { const w = el('path', { d: 'M0,0 H180', stroke: '#fff', 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0 }, s);
          tl.fromTo(w, { x: 1000, y: 380 + i * 60, opacity: 0 }, { x: 40, opacity: 0.7, duration: 0.6, ease: 'none', repeat: 3, repeatDelay: 0.2 }, at(0.1 + i * 0.12)); } } },
    { texto: 'Flooding can swamp substations, so crews shut them down for safety.', destacar: ['Flooding', 'safety.'], emocion: 'pensar',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'h5', '#1a2a3a', '#3a5a7a');
        const sub = el('g', { html: '<rect x="-260" y="-200" width="520" height="200" rx="16" fill="#8a94a8"/><rect x="-220" y="-170" width="120" height="150" rx="10" fill="#5a6478"/><rect x="-60" y="-170" width="120" height="150" rx="10" fill="#5a6478"/><rect x="100" y="-170" width="120" height="150" rx="10" fill="#5a6478"/><path d="M-160,-200 V-300 M0,-200 V-300 M160,-200 V-300" stroke="#c9d2e0" stroke-width="12"/>' }, s);
        window.gsap.set(sub, { x: 540, y: 940 }); A.pop(sub, 0.1);
        const bolt = el('path', { d: 'M20,-60 L-20,0 H10 L-10,60 L40,-10 H10Z', fill: '#ffd93b', transform: 'translate(540,560) scale(2.4)' }, s); A.pop(bolt, 0.4);
        const water = el('rect', { x: 60, y: 1100, width: 960, height: 400, fill: '#2f8ad0', opacity: 0.75 }, s);
        tl.to(water, { attr: { y: 860 }, duration: 2.2, ease: 'power1.inOut' }, at(0.6));
        tl.to(bolt, { opacity: 0.15, duration: 0.3 }, at(2.8)); A.ring(540, 560, 2.8, '#ff3b5c', 40, 220); } },
    { texto: 'And one broken line can cut power to a whole neighborhood.', destacar: ['one', 'neighborhood.'], emocion: 'sorpresa',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'h6', '#1a1f3a', '#3a4270');
        const main = el('path', { d: 'M120,520 H960', stroke: '#ffd93b', 'stroke-width': 14, 'stroke-linecap': 'round' }, s); A.draw(main, 0.1, 0.6);
        const hs = []; for (let i = 0; i < 5; i++) { const x = 180 + i * 180; const br = el('path', { d: `M${x},520 V840`, stroke: '#ffd93b', 'stroke-width': 8 }, s); A.draw(br, 0.4 + i * 0.08, 0.4); const h = house(A, s, x, 1000, 0.55, true); A.pop(h.e, 0.5 + i * 0.08); hs.push(h, br); }
        const cut = el('path', { d: 'M-30,-30 L30,30 M30,-30 L-30,30', stroke: '#ff3b5c', 'stroke-width': 18, 'stroke-linecap': 'round', transform: 'translate(150,520)' }, s); A.pop(cut, 1.9);
        tl.to(main, { attr: { stroke: '#555' }, duration: 0.4 }, at(2.1));
        hs.forEach((h) => { if (h.lights) h.lights.forEach((l) => tl.set(l, { attr: { fill: '#334' } }, at(2.2))); else tl.to(h, { attr: { stroke: '#555' }, duration: 0.3 }, at(2.1)); }); } },
    { texto: 'Line crews rebuild the grid piece by piece, starting with hospitals and main lines.', destacar: ['rebuild', 'hospitals'], emocion: 'feliz',
      arte(A) { const { el, tl, at } = A; const s = panel(A, 'h7', '#1f4e3a', '#3fa56b');
        pole(A, s, 760, 1000, 1.1);
        const p = KIT.person(A, s, 330, 1090, 1.0, { shirt: '#ff8a1a', hair: '#2b2240', style: 'short', arm: 'point', t: 0.2 });
        const hat = el('path', { d: 'M-86,-286 C-80,-350 80,-350 86,-286 H100 V-270 H-100 V-286Z', fill: '#ffd93b' }, p);
        const hosp = el('g', { html: '<rect x="-110" y="-160" width="220" height="160" rx="10" fill="#fff"/><rect x="-20" y="-140" width="40" height="110" fill="#ff3b5c"/><rect x="-55" y="-105" width="110" height="40" fill="#ff3b5c"/>' }, s);
        window.gsap.set(hosp, { x: 760, y: 560, scale: 0.9 }); A.pop(hosp, 0.6);
        const glow = el('circle', { cx: 760, cy: 480, r: 150, fill: '#ffd93b', opacity: 0 }, s); tl.to(glow, { opacity: 0.35, duration: 0.5, yoyo: true, repeat: 3 }, at(2.0));
        A.burst(760, 480, 2.0, ['#ffd93b', '#fff'], 14, 220); } },
    { texto: 'Follow Chispazo News: one headline explained every day.', destacar: ['Follow', 'explained'], emocion: 'feliz', transicion: 'iris',
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
