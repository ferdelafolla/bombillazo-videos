// Biblioteca de ilustraciones reutilizables (KIT). Cada pieza recibe (A, s, ...) y devuelve el grupo.
// Regla: el elemento héroe de la escena ocupa >= 1/3 del panel (escala k grande). Ver CATALOGO.md.
window.KIT = (() => {
  const g = (A, s, html, x, y, k = 1) => { const e = A.el('g', { html }, s); window.gsap.set(e, { x, y, scale: k }); return e; };
  return {
    // nube esponjosa con sombra inferior; k≈1.5-2 para héroe
    cloud(A, s, x, y, k = 1.6, col = '#e6ecff') {
      return g(A, s, `<ellipse cy="38" rx="170" ry="26" fill="#000" opacity=".12"/><ellipse rx="150" ry="55" fill="${col}"/><ellipse cx="-90" cy="20" rx="90" ry="45" fill="${col}"/><ellipse cx="95" cy="22" rx="100" ry="42" fill="${col}"/><ellipse cx="-10" cy="-30" rx="80" ry="46" fill="${col}"/><ellipse cx="-30" cy="-36" rx="44" ry="20" fill="#fff" opacity=".5"/>`, x, y, k);
    },
    // sol con rayos que giran
    sun(A, s, x, y, k = 1.4) {
      const e = g(A, s, '', x, y, k);
      const rays = A.el('g', {}, e);
      for (let i = 0; i < 12; i++) A.el('path', { d: 'M-14,-120 L0,-190 L14,-120z', fill: '#ffd93b', transform: `rotate(${i * 30})` }, rays);
      A.el('circle', { r: 100, fill: A.grad('#fff3a0', '#ffb300') }, e);
      A.tl.to(rays, { rotation: 60, svgOrigin: '0 0', duration: A.dur + 0.6, ease: 'none' }, A.at(0));
      return e;
    },
    // suelo con 3 capas de profundidad (colinas lejanas, medias, tierra)
    ground(A, s, base = '#6b4a32', hill1 = '#3f7d3a', hill2 = '#4f9a45') {
      const e = A.el('g', {}, s);
      A.el('path', { d: 'M60,860 Q260,760 480,850 T1020,820 V1100 H60z', fill: hill1, opacity: 0.8 }, e);
      A.el('path', { d: 'M60,900 Q300,840 540,900 T1020,880 V1100 H60z', fill: hill2 }, e);
      A.el('rect', { x: 60, y: 930, width: 960, height: 170, fill: base }, e);
      A.el('path', { d: 'M60,930 Q300,905 540,930 T1020,930 V950 H60z', fill: hill2 }, e);
      A.tl.fromTo(e, { x: 0 }, { x: -18, duration: A.dur + 0.4, ease: 'none' }, A.at(0));
      return e;
    },
    // lluvia con gotas grandes y estela
    rain(A, s, n = 22, t0 = 0.4, y0 = 380, y1 = 900, x0 = 120, x1 = 960) {
      for (let i = 0; i < n; i++) {
        const d = A.el('path', { d: 'M0,-34 C24,0 24,26 0,30 C-24,26 -24,0 0,-34z', fill: i % 3 ? '#7fd4ff' : '#bfe9ff' }, s);
        const x = x0 + ((i * 137) % (x1 - x0));
        A.tl.fromTo(d, { x, y: y0, opacity: 0, scale: 0.8 + (i % 3) * 0.2 }, { y: y1, opacity: 1, duration: 0.7, ease: 'power1.in', repeat: 3, repeatDelay: (i % 4) * 0.1 }, A.at(t0 + (i % 7) * 0.09));
      }
    },
    // brote de planta grande que crece
    sprout(A, s, x, y, k = 1.5) {
      const e = g(A, s, '<path d="M0,0 C-4,-80 6,-150 0,-220" stroke="#2f7a3c" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M0,-130 q-110,-30 -130,-130 q110,10 130,130z" fill="#3fae52"/><path d="M0,-170 q110,-40 120,-140 q-110,14 -120,140z" fill="#58c76a"/><path d="M-10,-130 q-60,-30 -90,-90" stroke="#2f7a3c" stroke-width="5" fill="none" opacity=".5"/>', x, y, k);
      window.gsap.set(e, { transformOrigin: '0px 0px' }); A.pop(e, 0.1); A.float(e, 8, 2, 0); return e;
    },
    // gota grande con brillo
    drop(A, s, x, y, k = 1.4, col = '#7fd4ff') {
      return g(A, s, `<path d="M0,-90 C60,-20 60,50 0,60 C-60,50 -60,-20 0,-90z" fill="${col}"/><ellipse cx="-20" cy="-5" rx="12" ry="26" fill="#fff" opacity=".55" transform="rotate(20)"/>`, x, y, k);
    },
    // lupa grande que barre un objeto
    magnifier(A, s, x, y, k = 1.5) {
      const e = g(A, s, '<circle r="86" fill="#cfefff" fill-opacity=".35" stroke="#fff" stroke-width="16"/><path d="M62,62 L140,140" stroke="#fff" stroke-width="22" stroke-linecap="round"/><path d="M-40,-40 a60,60 0 0,1 40,-30" stroke="#fff" stroke-width="10" fill="none" opacity=".7" stroke-linecap="round"/>', x, y, k);
      A.pop(e, 0.2); A.float(e, 14, 1.8, 0.6); return e;
    },
    // gráfico de línea que se dibuja, con puntos que saltan
    lineChart(A, s, pts, x = 140, y = 520, w = 800, h = 420, col = '#ffd93b') {
      const max = Math.max(...pts), min = Math.min(...pts);
      const P = pts.map((v, i) => [x + (i / (pts.length - 1)) * w, y + h - ((v - min) / (max - min || 1)) * h]);
      A.el('path', { d: `M${x},${y} V${y + h} H${x + w}`, stroke: '#fff', 'stroke-opacity': 0.5, 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round' }, s);
      const line = A.el('path', { d: 'M' + P.map((p) => p.join(',')).join(' L'), stroke: col, 'stroke-width': 14, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s);
      A.draw(line, 0.3, 1.4);
      P.forEach((p, i) => { const c = A.el('circle', { cx: p[0], cy: p[1], r: 16, fill: '#fff', stroke: col, 'stroke-width': 8 }, s); A.pop(c, 0.3 + (i / P.length) * 1.4); });
      return line;
    },
    // barras que crecen (valores 0-1)
    bars(A, s, vals, x = 160, y = 1000, w = 760, h = 520, cols = ['#ffd93b', '#00e5c8', '#ff6bd6', '#7fd4ff', '#ff7043']) {
      const bw = (w / vals.length) * 0.7, gap = w / vals.length;
      vals.forEach((v, i) => { const r = A.el('rect', { x: x + i * gap, y: y, width: bw, height: 0, rx: 18, fill: cols[i % cols.length] }, s);
        A.tl.to(r, { attr: { y: y - v * h, height: v * h }, duration: 0.8, ease: 'back.out(1.3)' }, A.at(0.2 + i * 0.18)); });
    },
  };
})();
