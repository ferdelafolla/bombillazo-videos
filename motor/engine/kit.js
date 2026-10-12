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
    // ---------- personas (estilo minimal moderno): parpadean, se balancean y pueden gesticular
    // o: { shirt, skin, hair, style: 'short'|'long'|'bun'|'bald', arm: 'wave'|'point'|null, t: inicio }
    person(A, s, x, y, k = 1, o = {}) {
      const { shirt = '#4a7ad8', skin = '#f3c7a4', hair = '#2b2240', style = 'short', arm = null, t = 0 } = o;
      const e = A.el('g', {}, s); window.gsap.set(e, { x, y, scale: k });
      const hairs = {
        short: `<path d="M-80,-238 C-86,-312 -30,-332 8,-324 C60,-320 88,-290 80,-236 C66,-268 30,-282 -10,-280 C-42,-278 -66,-264 -80,-238Z" fill="${hair}"/>`,
        long: `<path d="M-84,-236 C-90,-316 -30,-334 8,-326 C62,-322 92,-290 84,-234 L88,-150 C70,-140 62,-170 66,-226 C40,-270 -40,-276 -66,-226 C-62,-170 -70,-140 -88,-150Z" fill="${hair}"/>`,
        bun: `<circle cy="-322" r="34" fill="${hair}"/><path d="M-80,-238 C-86,-306 -30,-326 8,-318 C60,-314 88,-288 80,-236 C64,-266 28,-276 -10,-274 C-42,-272 -66,-262 -80,-238Z" fill="${hair}"/>`,
        bald: `<path d="M-78,-250 C-70,-262 -60,-268 -50,-270" stroke="${hair}" stroke-width="10" fill="none" stroke-linecap="round"/>`,
      };
      A.el('g', { html: `<ellipse cy="6" rx="120" ry="16" fill="#000" opacity=".16"/>
        <path d="M-112,0 C-112,-118 -72,-150 0,-150 C72,-150 112,-118 112,0Z" fill="${shirt}"/>
        <path d="M-30,-150 L0,-112 L30,-150Z" fill="#fff" opacity=".85"/>
        <rect x="-22" y="-176" width="44" height="40" rx="14" fill="${skin}" style="filter:brightness(.9)"/>
        <circle cy="-236" r="78" fill="${skin}"/>${hairs[style] || hairs.short}
        <circle cx="-44" cy="-206" r="12" fill="#ff8a8a" opacity=".35"/><circle cx="44" cy="-206" r="12" fill="#ff8a8a" opacity=".35"/>
        <path d="M-20,-198 Q0,-184 20,-198" stroke="#1f1d3a" stroke-width="6" fill="none" stroke-linecap="round"/>` }, e);
      const eyes = A.el('g', { html: '<ellipse cx="-28" cy="-232" rx="9" ry="12" fill="#1f1d3a"/><ellipse cx="28" cy="-232" rx="9" ry="12" fill="#1f1d3a"/>' }, e);
      // parpadeo cada ~2.3 s (desfasado por posición para que no parpadeen todos a la vez)
      for (let b = 0.8 + (Math.abs(x) % 7) * 0.13; b < A.dur; b += 2.3) A.tl.to(eyes, { scaleY: 0.1, svgOrigin: '0 -232', duration: 0.07, yoyo: true, repeat: 1, ease: 'power1.inOut' }, A.at(t + b));
      let armEl = null;
      if (arm) {
        armEl = A.el('g', { html: arm === 'point'
          ? `<path d="M84,-104 C140,-120 186,-150 214,-176" stroke="${shirt}" stroke-width="34" fill="none" stroke-linecap="round"/><circle cx="222" cy="-182" r="22" fill="${skin}"/>`
          : `<path d="M84,-104 C128,-150 146,-212 138,-256" stroke="${shirt}" stroke-width="34" fill="none" stroke-linecap="round"/><circle cx="138" cy="-264" r="24" fill="${skin}"/>` }, e);
        const n = Math.max(1, Math.floor(A.dur / 0.5));
        A.tl.fromTo(armEl, { rotation: -10, svgOrigin: '84 -104' }, { rotation: 10, svgOrigin: '84 -104', duration: arm === 'wave' ? 0.28 : 0.6, ease: 'sine.inOut', yoyo: true, repeat: arm === 'wave' ? n : Math.ceil(n / 2) }, A.at(t + 0.4));
      }
      // balanceo suave desde los pies
      A.tl.fromTo(e, { rotation: -1.6, svgOrigin: `${x} ${y}` }, { rotation: 1.6, svgOrigin: `${x} ${y}`, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: Math.ceil(A.dur / 1.6) }, A.at(t));
      A.pop(e, t);
      return e;
    },
    // bocadillo de diálogo con cola; texto corto o emoji
    speech(A, s, x, y, text, o = {}) {
      const { w = 220, h = 130, fill = '#fff', ink = '#1f1d3a', size = 72, tail = 'left', t = 0 } = o;
      const e = A.el('g', {}, s); window.gsap.set(e, { x, y });
      const tx = tail === 'left' ? -w / 2 + 40 : w / 2 - 40;
      A.el('path', { d: `M${tx - 18},${h / 2 - 4} L${tx + (tail === 'left' ? -30 : 30)},${h / 2 + 46} L${tx + 22},${h / 2 - 4}Z`, fill }, e);
      A.el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: Math.min(44, h / 2), fill }, e);
      A.txt(text, 0, size * 0.36, size, ink, { parent: e });
      A.pop(e, t); A.float(e, 8, 1.8, t + 0.5);
      return e;
    },
    // moneda que gira (escala X oscilante = giro 3D barato)
    coin(A, s, x, y, k = 1, sym = '$', t = 0) {
      const e = g(A, s, `<circle r="56" fill="#ffd93b" stroke="#d9a400" stroke-width="10"/><circle r="40" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="5"/>`, x, y, k);
      A.txt(sym, 0, 20, 56, '#a87800', { parent: e });
      A.tl.to(e, { scaleX: -k, duration: 0.5, ease: 'sine.inOut', yoyo: true, repeat: Math.ceil(A.dur / 0.5) }, A.at(t + 0.3));
      return e;
    },
    // lluvia de monedas que caen en arco hasta un destino (hucha, caja, mano)
    coinRain(A, s, n, tx, ty, t = 0.4, sym = '$') {
      for (let i = 0; i < n; i++) {
        const e = g(A, s, `<circle r="40" fill="#ffd93b" stroke="#d9a400" stroke-width="8"/>`, 0, 0, 1);
        A.txt(sym, 0, 15, 42, '#a87800', { parent: e });
        const sx = 160 + ((i * 197) % 760), at = A.at(t + i * 0.16);
        A.tl.fromTo(e, { x: sx, y: 300, opacity: 0, rotation: -40 }, { x: tx + ((i % 5) - 2) * 14, y: ty, opacity: 1, rotation: 40, duration: 0.75, ease: 'power2.in' }, at);
        A.tl.to(e, { scale: 0.4, opacity: 0, duration: 0.12 }, at + 0.75);
      }
    },
    // rack de servidores con LEDs que parpadean
    server(A, s, x, y, k = 1, t = 0) {
      const e = A.el('g', {}, s); window.gsap.set(e, { x, y, scale: k });
      A.el('rect', { x: -100, y: -260, width: 200, height: 520, rx: 26, fill: '#2a3150' }, e);
      A.el('rect', { x: -100, y: -260, width: 200, height: 520, rx: 26, fill: 'none', stroke: '#fff', 'stroke-opacity': 0.12, 'stroke-width': 4 }, e);
      for (let j = 0; j < 6; j++) {
        A.el('rect', { x: -74, y: -230 + j * 80, width: 148, height: 54, rx: 12, fill: '#171b30' }, e);
        A.el('rect', { x: -60, y: -207 + j * 80, width: 70, height: 8, rx: 4, fill: '#3a4268' }, e);
        const led = A.el('circle', { cx: 50, cy: -203 + j * 80, r: 8, fill: j % 3 ? '#00e5c8' : '#ffd93b' }, e);
        A.tl.to(led, { opacity: 0.2, duration: 0.18 + (j % 3) * 0.07, yoyo: true, repeat: Math.ceil(A.dur / 0.3) }, A.at(t + 0.2 + j * 0.09));
      }
      A.pop(e, t); return e;
    },
    // chip/procesador con pulso de energía
    chip(A, s, x, y, k = 1, label = 'AI', t = 0) {
      const e = A.el('g', {}, s); window.gsap.set(e, { x, y, scale: k });
      for (let i = 0; i < 5; i++) for (const side of [0, 1, 2, 3]) {
        const o = -80 + i * 40, L = 150;
        const [x1, y1, x2, y2] = [[o, -L, o, -110], [o, L, o, 110], [-L, o, -110, o], [L, o, 110, o]][side];
        A.el('path', { d: `M${x1},${y1} L${x2},${y2}`, stroke: '#c9d2f0', 'stroke-width': 12, 'stroke-linecap': 'round' }, e);
      }
      const glow = A.el('rect', { x: -120, y: -120, width: 240, height: 240, rx: 34, fill: '#00e5c8', opacity: 0.0 }, e);
      A.el('rect', { x: -110, y: -110, width: 220, height: 220, rx: 30, fill: '#232846' }, e);
      A.el('rect', { x: -80, y: -80, width: 160, height: 160, rx: 20, fill: 'none', stroke: '#00e5c8', 'stroke-width': 6 }, e);
      A.txt(label, 0, 26, 74, '#fff', { parent: e });
      A.tl.to(glow, { opacity: 0.45, scale: 1.12, svgOrigin: '0 0', duration: 0.6, ease: 'sine.inOut', yoyo: true, repeat: Math.ceil(A.dur / 0.6) }, A.at(t + 0.4));
      A.pop(e, t); return e;
    },
    // neurona: cuerpo, dendritas y axón por el que viaja una señal; o.fade=true la apaga al final
    neuron(A, s, x, y, k = 1, o = {}) {
      const { col = '#ff9ad5', t = 0, fade = false } = o;
      const e = A.el('g', {}, s); window.gsap.set(e, { x, y, scale: k });
      const dends = [];
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.4; const dx = Math.cos(a), dy = Math.sin(a);
        dends.push(A.el('path', { d: `M${dx * 60},${dy * 60} Q${dx * 120 + dy * 30},${dy * 120 - dx * 30} ${dx * 170},${dy * 170}`, stroke: col, 'stroke-width': 14, fill: 'none', 'stroke-linecap': 'round' }, e)); }
      const ax = A.el('path', { d: 'M60,0 C180,20 260,-40 380,0', stroke: col, 'stroke-width': 18, fill: 'none', 'stroke-linecap': 'round' }, e);
      A.el('circle', { r: 72, fill: col }, e); A.el('circle', { r: 30, fill: '#fff', opacity: 0.5 }, e);
      dends.forEach((d, i) => A.draw(d, t + 0.1 + i * 0.05, 0.5)); A.draw(ax, t + 0.3, 0.6);
      const sig = A.el('circle', { r: 16, fill: '#fff' }, e);
      const len = ax.getTotalLength();
      const pr = { p: 0 };
      A.tl.fromTo(pr, { p: 0 }, { p: 1, duration: 0.9, ease: 'power1.in', repeat: fade ? 1 : 3, repeatDelay: 0.3, onUpdate: () => { const q = ax.getPointAtLength(pr.p * len); sig.setAttribute('cx', q.x); sig.setAttribute('cy', q.y); } }, A.at(t + 0.9));
      if (fade) A.tl.to(e, { opacity: 0.25, filter: 'grayscale(1)', duration: 0.8 }, A.at(Math.max(t + 2.6, A.dur - 1.2)));
      A.pop(e, t); return e;
    },
    // flecha que se dibuja de (x1,y1) a (x2,y2) con punta que aparece al final
    arrow(A, s, x1, y1, x2, y2, col = '#ffd93b', t = 0.3, w = 16) {
      const mx = (x1 + x2) / 2 + (y2 - y1) * 0.15, my = (y1 + y2) / 2 - (x2 - x1) * 0.15;
      const p = A.el('path', { d: `M${x1},${y1} Q${mx},${my} ${x2},${y2}`, stroke: col, 'stroke-width': w, fill: 'none', 'stroke-linecap': 'round' }, s);
      A.draw(p, t, 0.6);
      const ang = Math.atan2(y2 - my, x2 - mx) * 180 / Math.PI;
      const head = A.el('path', { d: `M0,0 L${-w * 3},${-w * 2} L${-w * 3},${w * 2}Z`, fill: col, transform: `translate(${x2},${y2}) rotate(${ang})` }, s);
      window.gsap.set(head, { opacity: 0 }); A.tl.to(head, { opacity: 1, duration: 0.1 }, A.at(t + 0.55));
      return p;
    },
    // línea de tiempo horizontal: items = ['1990','2000',...] ; destaca el índice hi
    timeline(A, s, items, y = 700, hi = -1, t = 0.2, col = '#ffd93b') {
      const x0 = 160, x1 = 920, step = (x1 - x0) / Math.max(1, items.length - 1);
      const ln = A.el('path', { d: `M${x0},${y} H${x1}`, stroke: '#fff', 'stroke-opacity': 0.6, 'stroke-width': 10, 'stroke-linecap': 'round' }, s);
      A.draw(ln, t, 0.8);
      items.forEach((lab, i) => { const gx = x0 + i * step; const big = i === hi;
        const d = A.el('circle', { cx: gx, cy: y, r: big ? 34 : 20, fill: big ? col : '#fff' }, s); A.pop(d, t + 0.3 + i * 0.12);
        const tx = A.txt(lab, gx, y + (i % 2 ? -60 : 90), big ? 64 : 46, big ? col : '#fff', { parent: s }); A.pop(tx, t + 0.4 + i * 0.12);
        if (big) A.ring(gx, y, t + 0.6 + i * 0.12, col, 34, 140); });
    },
    // tablero de ajedrez 8x8 con piezas (glifos Unicode). Devuelve { sq, piece, move }
    board(A, s, cx = 540, cy = 690, size = 720, o = {}) {
      const { light = '#eed9b0', dark = '#7a9a5a', t = 0 } = o;
      const c = size / 8, x0 = cx - size / 2, y0 = cy - size / 2;
      const e = A.el('g', {}, s);
      A.el('rect', { x: x0 - 14, y: y0 - 14, width: size + 28, height: size + 28, rx: 22, fill: '#2a1d12' }, e);
      for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) A.el('rect', { x: x0 + f * c, y: y0 + r * c, width: c, height: c, fill: (r + f) % 2 ? dark : light }, e);
      A.pop(e, t);
      const sq = (file, rank) => [x0 + ('abcdefgh'.indexOf(file)) * c + c / 2, y0 + (8 - rank) * c + c / 2];
      const G = { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' };
      return {
        sq,
        piece(type, white, at, tt = t + 0.3) { const [px, py] = sq(at[0], +at[1]); const p = A.el('g', {}, s); window.gsap.set(p, { x: px, y: py });
          A.el('text', { y: c * 0.32, 'font-size': c * 0.86, 'text-anchor': 'middle', fill: white ? '#fff' : '#1b1b1b', stroke: white ? '#1b1b1b' : '#fff', 'stroke-width': 2.5, 'paint-order': 'stroke', 'font-family': 'DejaVu Sans, sans-serif', text: G[type] }, p);
          A.pop(p, tt); return p; },
        move(p, to, tt) { const [px, py] = sq(to[0], +to[1]);
          A.tl.to(p, { x: px, y: py - 30, duration: 0.35, ease: 'power2.out' }, A.at(tt)); A.tl.to(p, { y: py, duration: 0.18, ease: 'bounce.out' }, A.at(tt + 0.35)); },
        highlight(at, tt, col = 'rgba(255,217,59,.55)') { const [px, py] = sq(at[0], +at[1]); const h = A.el('rect', { x: px - c / 2, y: py - c / 2, width: c, height: c, fill: col, opacity: 0 }, s); A.tl.to(h, { opacity: 1, duration: 0.2 }, A.at(tt)); return h; },
      };
    },
  };
})();
