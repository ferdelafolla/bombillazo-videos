// Motor Chispazo v2: Shorts verticales con animación 2D y motion graphics.
// Cada escena tiene texto (subtítulo + voz) y una función `arte(A)` que dibuja
// y anima los elementos explicativos con GSAP en tiempo absoluto.
//
// Capas por fotograma (de atrás adelante):
//   fondo (degradado + patrón + luz ambiental) → partículas ambiente (parallax)
//   → cámara [escenas con sombra suave, empuje lento, transiciones con desenfoque de movimiento]
//   → presentador (squash & stretch, expresiones, boca con la voz) → subtítulos → viñeta + grano
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const W = 1080, H = 1920;
  const FPS = window.FPS || 60;
  const THEMES = {
    aldia: { name: 'HOY', bg: ['#0a0e20', '#1c1240', '#2a0f3a'], glow: '#5b6cff', text: '#fff', accent: '#ff4d5e', accent2: '#ffc43d', accent3: '#00e5c8', ink: '#141a3a', font: "'Inter Display', Inter, sans-serif", chip: 'rgba(255,255,255,.12)', pattern: 'grid', particles: 'dust' },
    curiosidades: { name: 'CURIOSIDADES', bg: ['#26105c', '#1a2a8a', '#0c3c78'], glow: '#ffd60a', text: '#fff', accent: '#ffd60a', accent2: '#00e5c8', accent3: '#ff6bd6', ink: '#1a0f3c', font: "'Inter Display', Inter, sans-serif", chip: 'rgba(255,255,255,.12)', pattern: 'dots', particles: 'sparks' },
    peques: { name: 'PEQUES', bg: ['#a9dcff', '#e3f4ff', '#fff1c9'], glow: '#ffffff', text: '#28285a', accent: '#ff7043', accent2: '#66bb6a', accent3: '#42a5f5', ink: '#28285a', font: "'Fredoka', sans-serif", chip: 'rgba(255,255,255,.92)', pattern: 'none', particles: 'bubbles' },
  };
  const KIDS = ['#ff7043', '#66bb6a', '#42a5f5', '#ffca28', '#ab47bc'];
  const COLOR_WORDS = { roj: '#e53935', amarill: '#ffd500', naranj: '#ff8c00', verde: '#43a047', azul: '#1e88e5', morad: '#8e24aa', rosa: '#f06292', marron: '#795548' };
  const norm = (w) => w.toLowerCase().normalize('NFD').replace(/[^a-z0-9ñ]/g, '');
  // generador pseudoaleatorio determinista (mismo vídeo en cada render)
  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  function el(tag, attrs = {}, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) {
      if (k === 'html') e.innerHTML = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k === 'style') e.setAttribute('style', attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(e);
    return e;
  }

  window.VIDEO = function (spec) {
    const th = THEMES[spec.canal];
    const tl = gsap.timeline({ paused: true });
    const stage = document.getElementById('stage');
    stage.style.background = `linear-gradient(165deg, ${th.bg[0]} 0%, ${th.bg[1]} 55%, ${th.bg[2]} 100%)`;
    stage.style.fontFamily = th.font;
    stage.dataset.canal = spec.canal;
    const art = document.getElementById('art');
    const charLayer = document.getElementById('chars');
    const caps = document.getElementById('caps');
    const R = rng(spec.titulo ? spec.titulo.length * 7919 : 7);

    // ---------- defs: sombras, brillos, degradados reutilizables
    const defs = el('defs', {}, art);
    defs.innerHTML = `
      <filter id="sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#000" flood-opacity="${spec.canal === 'peques' ? 0.16 : 0.38}"/></filter>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>
      <radialGradient id="spot" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="${th.glow}" stop-opacity=".35"/><stop offset="100%" stop-color="${th.glow}" stop-opacity="0"/></radialGradient>
      <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>`;
    // degradado vertical rápido: A.grad('#ff0','#f80') → 'url(#gN)'
    let gid = 0;
    function grad(c1, c2, dir = 'v') {
      const id = 'g' + gid++;
      const g = el(dir === 'r' ? 'radialGradient' : 'linearGradient', dir === 'v' ? { id, x1: 0, y1: 0, x2: 0, y2: 1 } : dir === 'h' ? { id, x1: 0, y1: 0, x2: 1, y2: 0 } : { id }, defs);
      el('stop', { offset: 0, 'stop-color': c1 }, g);
      el('stop', { offset: 1, 'stop-color': c2 }, g);
      return `url(#${id})`;
    }

    // ---------- fondo
    const bgl = el('g', {}, art);
    const spotA = el('ellipse', { cx: 300, cy: 500, rx: 700, ry: 700, fill: 'url(#spot)' }, bgl);
    const spotB = el('ellipse', { cx: 900, cy: 1400, rx: 600, ry: 600, fill: 'url(#spot)', opacity: 0.6 }, bgl);
    let pattern;
    if (th.pattern === 'grid') {
      pattern = el('g', { opacity: 0.07 }, bgl);
      for (let x = -240; x < W + 240; x += 120) el('line', { x1: x, y1: -240, x2: x, y2: H + 240, stroke: '#fff', 'stroke-width': 2 }, pattern);
      for (let y = -240; y < H + 240; y += 120) el('line', { x1: -240, y1: y, x2: W + 240, y2: y, stroke: '#fff', 'stroke-width': 2 }, pattern);
    } else if (th.pattern === 'dots') {
      pattern = el('g', { opacity: 0.08 }, bgl);
      for (let i = 0; i < 26; i++) el('circle', { cx: (i * 233) % W, cy: (i * 389) % H, r: 12 + ((i * 37) % 60), fill: 'none', stroke: '#fff', 'stroke-width': 4 }, pattern);
    } else {
      pattern = el('g', {}, bgl);
      const sun = el('g', { transform: 'translate(900,330)' }, pattern);
      for (let i = 0; i < 12; i++) el('rect', { x: -6, y: -150, width: 12, height: 40, rx: 6, fill: '#ffe082', transform: `rotate(${i * 30})` }, sun);
      el('circle', { r: 84, fill: '#ffe082' }, sun);
      tl.to(sun, { rotation: 40, svgOrigin: '0 0', duration: 60, ease: 'none' }, 0);
      [[160, 300, 1], [620, 230, 0.8], [380, 470, 0.6]].forEach(([x, y, s], i) => {
        const c = el('g', { html: '<ellipse cx="0" cy="0" rx="90" ry="44" fill="#fff"/><ellipse cx="-50" cy="10" rx="60" ry="36" fill="#fff"/><ellipse cx="55" cy="12" rx="64" ry="34" fill="#fff"/><ellipse cx="0" cy="22" rx="120" ry="20" fill="#dceefc"/>' }, pattern);
        gsap.set(c, { x, y, scale: s });
        tl.to(c, { x: x + 120 * (i % 2 ? -1 : 1), duration: 60, ease: 'none' }, 0);
      });
    }

    // partículas ambiente (se calculan por fotograma, deterministas)
    const parts = [];
    const pl = el('g', {}, art);
    for (let i = 0; i < 28; i++) {
      const p = { x: R() * W, y: R() * H, r: 2 + R() * (th.particles === 'bubbles' ? 18 : 5), sp: 10 + R() * 40, ph: R() * 6.28, depth: 0.3 + R() * 0.7 };
      p.node = th.particles === 'bubbles'
        ? el('circle', { r: p.r, fill: 'none', stroke: '#fff', 'stroke-width': 3, opacity: 0.55 }, pl)
        : el('circle', { r: p.r, fill: th.particles === 'sparks' ? (i % 3 ? '#fff' : th.accent) : '#fff', opacity: 0.15 + R() * 0.25 }, pl);
      parts.push(p);
    }

    // cámara: todas las escenas viven aquí
    const cam = el('g', {}, art);

    // ---------- presentador
    const ch = CHARS[spec.personaje]();
    charLayer.appendChild(ch.el);
    Object.assign(ch, { x: 220, y: 1590, s: 0.82 });

    // ---------- tiempos
    const wps = spec.canal === 'peques' ? 1.8 : 2.6;
    const T = window.TIMING || spec.escenas.map((s) => ({ dur: Math.max(2.6, s.texto.split(/\s+/).length / wps + 0.8) }));
    let t0 = 0.0;
    const scenes = spec.escenas.map((s, i) => {
      const start = T[i].start != null ? T[i].start : t0;
      const dur = T[i].dur;
      t0 = start + dur;
      return { ...s, i, start, dur };
    });
    const total = t0 + 0.5;
    window.TOTAL = total;

    // fondo vivo (capa ambiente)
    tl.to(pattern, { x: spec.canal === 'aldia' ? 120 : 0, y: spec.canal === 'aldia' ? 120 : -160, duration: total, ease: 'none' }, 0);
    tl.to(spotA, { attr: { cx: 760, cy: 700 }, duration: total, ease: 'sine.inOut' }, 0);
    tl.to(spotB, { attr: { cx: 240, cy: 1200 }, duration: total, ease: 'sine.inOut' }, 0);

    // ---------- escenas
    const TRANS = ['whip', 'zoom', 'whipUp', 'iris'];
    scenes.forEach((sc) => {
      const blurF = el('filter', { id: `mb${sc.i}`, x: '-30%', y: '-30%', width: '160%', height: '160%' }, defs);
      const blur = el('feGaussianBlur', { stdDeviation: '0 0' }, blurF);
      const outer = el('g', { filter: `url(#mb${sc.i})` }, cam); // desenfoque de movimiento en transiciones
      const mid = el('g', {}, outer); // movimiento de transición
      const g = el('g', { filter: 'url(#sh)' }, mid); // contenido con sombra suave
      gsap.set(outer, { autoAlpha: 0 });
      gsap.set(mid, { transformOrigin: '540px 680px' });
      const s = sc.start, e = sc.start + sc.dur;
      const kind = sc.transicion || TRANS[sc.i % TRANS.length];
      // entrada
      tl.set(outer, { autoAlpha: 1 }, Math.max(0, s - 0.02));
      if (sc.i > 0) {
        if (kind === 'whip') {
          tl.fromTo(mid, { x: 720 }, { x: 0, duration: 0.5, ease: 'expo.out' }, s);
          tl.fromTo(blur, { attr: { stdDeviation: '40 0' } }, { attr: { stdDeviation: '0 0' }, duration: 0.35, ease: 'power2.out' }, s);
        } else if (kind === 'whipUp') {
          tl.fromTo(mid, { y: 900 }, { y: 0, duration: 0.55, ease: 'expo.out' }, s);
          tl.fromTo(blur, { attr: { stdDeviation: '0 40' } }, { attr: { stdDeviation: '0 0' }, duration: 0.35, ease: 'power2.out' }, s);
        } else if (kind === 'zoom') {
          tl.fromTo(mid, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.55, ease: 'back.out(1.4)' }, s);
          tl.fromTo(blur, { attr: { stdDeviation: '14 14' } }, { attr: { stdDeviation: '0 0' }, duration: 0.3 }, s);
        } else {
          const clipId = `iris${sc.i}`;
          const cp = el('clipPath', { id: clipId }, defs);
          const circ = el('circle', { cx: 540, cy: 680, r: 0 }, cp);
          outer.setAttribute('clip-path', `url(#${clipId})`);
          tl.fromTo(circ, { attr: { r: 0 } }, { attr: { r: 1400 }, duration: 0.6, ease: 'power3.inOut' }, s - 0.05);
        }
      }
      // empuje lento de cámara durante la escena (capa ambiente de la escena)
      tl.fromTo(g, { scale: 1, x: 0 }, { scale: 1.045, x: (sc.i % 2 ? -12 : 12), transformOrigin: '540px 680px', duration: sc.dur + 0.4, ease: 'none' }, s);
      // salida (acelera)
      const next = scenes[sc.i + 1];
      if (next) {
        const nk = next.transicion || TRANS[next.i % TRANS.length];
        if (nk === 'whip') { tl.to(mid, { x: -720, duration: 0.3, ease: 'power3.in' }, e - 0.3); tl.to(blur, { attr: { stdDeviation: '40 0' }, duration: 0.3, ease: 'power3.in' }, e - 0.3); }
        else if (nk === 'whipUp') { tl.to(mid, { y: -900, duration: 0.3, ease: 'power3.in' }, e - 0.3); tl.to(blur, { attr: { stdDeviation: '0 40' }, duration: 0.3, ease: 'power3.in' }, e - 0.3); }
        else if (nk === 'zoom') { tl.to(mid, { scale: 1.5, opacity: 0, duration: 0.35, ease: 'power3.in' }, e - 0.32); }
        else { tl.to(mid, { scale: 0.92, duration: 0.5, ease: 'power2.in' }, e - 0.5); }
        tl.set(outer, { autoAlpha: 0 }, e + 0.6);
      }

      const A = {
        g, tl, t0: s, dur: sc.dur, th, W, H, ch, pal: KIDS, grad, rnd: R,
        el: (tag, attrs, parent) => el(tag, attrs, parent || g),
        at: (x) => s + x, // tiempo relativo dentro de la escena
        // aparición con anticipación + estirado + rebote (squash & stretch)
        pop(target, x = 0, extra = {}) {
          gsap.set(target, { transformOrigin: '50% 50%', transformBox: 'fill-box', scale: 0, opacity: 0 });
          tl.to(target, { scaleX: 0.85, scaleY: 1.18, opacity: 1, duration: 0.18, ease: 'power2.out', ...extra }, s + x);
          tl.to(target, { scaleX: 1.06, scaleY: 0.94, duration: 0.12, ease: 'power1.inOut' }, s + x + 0.18);
          tl.to(target, { scaleX: 1, scaleY: 1, duration: 0.35, ease: 'elastic.out(1, 0.5)' }, s + x + 0.3);
        },
        // entra desplazándose desde un lado con arco y asentado
        enter(target, x = 0, from = 'down', dist = 260) {
          const d = { down: [0, dist], up: [0, -dist], left: [-dist, 0], right: [dist, 0] }[from];
          gsap.set(target, { transformOrigin: '50% 50%', transformBox: 'fill-box' });
          tl.fromTo(target, { x: `+=${d[0]}`, y: `+=${d[1]}`, opacity: 0, rotation: d[0] ? (d[0] > 0 ? 8 : -8) : 0 },
            { x: `-=${d[0]}`, y: `-=${d[1]}`, opacity: 1, rotation: 0, duration: 0.6, ease: 'back.out(1.6)' }, s + x);
        },
        // dibuja un trazo (líneas, flechas, rutas)
        draw(path, x = 0, d = 0.8, ease = 'power2.inOut') {
          const len = path.getTotalLength ? path.getTotalLength() : 1000;
          gsap.set(path, { attr: { 'stroke-dasharray': `${len} ${len}`, 'stroke-dashoffset': len } });
          tl.to(path, { attr: { 'stroke-dashoffset': 0 }, duration: d, ease }, s + x);
        },
        // flotación ambiental continua
        float(target, amp = 10, period = 2.4, x = 0) {
          const n = Math.max(1, Math.floor((sc.dur + 0.6) / period));
          tl.fromTo(target, { y: `-=${amp / 2}` }, { y: `+=${amp}`, duration: period / 2, ease: 'sine.inOut', yoyo: true, repeat: n * 2 - 1 }, s + x);
        },
        // estallido de partículas
        burst(cx, cy, x = 0, colors = [th.accent, th.accent2, th.accent3, '#fff'], n = 22, radius = 260) {
          const r = rng(cx * 13 + cy * 7);
          for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2 + r() * 0.3;
            const dist = radius * (0.6 + r() * 0.6);
            const shape = i % 3 === 0 ? el('circle', { cx, cy, r: 7 + r() * 6, fill: colors[i % colors.length] }, g)
              : el('rect', { x: cx - 6, y: cy - 12, width: 12, height: 24, rx: 4, fill: colors[i % colors.length] }, g);
            tl.fromTo(shape, { x: 0, y: 0, rotation: 0, opacity: 1, scale: 1 },
              { x: Math.cos(a) * dist, y: Math.sin(a) * dist + 120, rotation: 200 + r() * 300, opacity: 0, scale: 0.6, duration: 1.1 + r() * 0.5, ease: 'power3.out', transformOrigin: '50% 50%' }, s + x);
          }
        },
        // sacudida de impacto
        shake(target, x = 0, amt = 14) {
          // relativo: respeta la posición x que ya tenga el elemento
          [-amt, amt * 1.8, -amt * 1.3, amt * 0.8, -amt * 0.3].forEach((d, i) => tl.to(target, { x: `+=${d}`, duration: 0.07, ease: 'sine.inOut' }, s + x + i * 0.07));
        },
        // contador numérico
        count(textEl, from, to, x = 0, d = 1.2, fmt = (v) => Math.round(v).toLocaleString('es-ES')) {
          const o = { v: from };
          textEl.textContent = fmt(from);
          tl.to(o, { v: to, duration: d, ease: 'power2.out', onUpdate: () => { textEl.textContent = fmt(o.v); } }, s + x);
        },
        // anillo de énfasis que se expande
        ring(cx, cy, x = 0, color = '#fff', r0 = 30, r1 = 200) {
          const c = el('circle', { cx, cy, r: r0, fill: 'none', stroke: color, 'stroke-width': 8, opacity: 0 }, g);
          tl.fromTo(c, { attr: { r: r0 }, opacity: 0.9 }, { attr: { r: r1 }, opacity: 0, duration: 0.7, ease: 'power2.out' }, s + x);
        },
        // texto SVG con contorno opcional
        txt(str, x, y, size, fill, attrs = {}) {
          const { parent, outline, ...rest } = attrs;
          const extra = outline ? { stroke: outline, 'stroke-width': Math.max(6, size * 0.12), 'paint-order': 'stroke', 'stroke-linejoin': 'round' } : {};
          return el('text', { x, y, 'font-size': size, fill: fill || th.text, 'text-anchor': 'middle', 'font-weight': 900, 'font-family': th.font, text: str, ...extra, ...rest }, parent || g);
        },
        // tarjeta con brillo y sombra interior (aspecto "material")
        card(x, y, w, h, fill, r = 36, parent) {
          const c = el('g', {}, parent || g);
          el('rect', { x, y, width: w, height: h, rx: r, fill }, c);
          el('rect', { x, y, width: w, height: h, rx: r, fill: 'url(#shade)' }, c);
          el('rect', { x: x + 6, y: y + 6, width: w - 12, height: h * 0.45, rx: r - 6, fill: 'url(#shine)' }, c);
          return c;
        },
        charTo(props, x = 0, d = 0.6) { tl.to(ch, { ...props, duration: d, ease: 'power3.inOut' }, s + x); },
        emote(name, x = 0) { tl.set(ch, { mood: name }, s + x); },
      };
      // el presentador reacciona al empezar cada escena
      tl.fromTo(ch, { hop: 0 }, { hop: 1, duration: 0.55, ease: 'none', immediateRender: false }, s + 0.05);
      tl.set(ch, { mood: sc.emocion || (sc.i === 0 ? 'sorpresa' : 'feliz') }, s);
      sc.arte && sc.arte(A);
      buildCaption(sc, th, tl, caps);
    });

    // ---------- marca y progreso
    document.getElementById('chipname').textContent = th.name;
    document.getElementById('chip').style.background = th.chip;
    document.getElementById('brand').style.color = th.accent === '#ffd60a' ? '#ffd60a' : th.accent;
    document.getElementById('chipname').style.color = th.text;
    document.getElementById('bar').style.background = th.accent;
    tl.fromTo('#chip', { x: -420 }, { x: 0, duration: 0.7, ease: 'back.out(1.5)' }, 0.15);

    // grano de película precalculado
    const grain = document.getElementById('grain');
    const gctx = grain.getContext('2d');
    const frames = [];
    for (let k = 0; k < 4; k++) {
      const img = gctx.createImageData(540, 960);
      const r = rng(1000 + k);
      for (let i = 0; i < img.data.length; i += 4) { const v = r() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      frames.push(img);
    }

    window.seek = function (t) {
      tl.seek(t, false);
      const amp = window.AMP ? (window.AMP[Math.floor(t * FPS)] || 0) : fakeAmp(t, scenes);
      ch.update(t, amp);
      parts.forEach((p) => {
        const y = ((p.y - t * p.sp * p.depth) % (H + 100) + H + 100) % (H + 100) - 50;
        const x = p.x + Math.sin(t * 0.6 + p.ph) * 30 * p.depth;
        p.node.setAttribute('cx', x); p.node.setAttribute('cy', y);
      });
      gctx.putImageData(frames[Math.floor(t * 24) % 4], 0, 0);
      document.getElementById('bar').style.width = `${Math.min(100, (t / total) * 100)}%`;
    };
    window.seek(0);
  };

  // boca simulada cuando no hay voz
  function fakeAmp(t, scenes) {
    const sc = scenes.find((s) => t >= s.start && t < s.start + s.dur);
    if (!sc) return 0;
    if (t - sc.start > sc.dur * 0.88) return 0;
    return Math.max(0, Math.sin(t * 19) * 0.5 + Math.sin(t * 7.3) * 0.35 + 0.15);
  }

  // subtítulos palabra a palabra con la palabra activa resaltada
  function buildCaption(sc, th, tl, caps) {
    const box = document.createElement('div');
    box.className = 'cap';
    const hl = new Set((sc.destacar || []).map(norm));
    const words = sc.texto.split(/\s+/);
    let k = 0;
    words.forEach((w) => {
      const s = document.createElement('span');
      s.textContent = w;
      s.className = 'w';
      if (hl.has(norm(w))) {
        s.classList.add('hl');
        const cw = Object.keys(COLOR_WORDS).find((c) => norm(w).startsWith(c));
        let col = cw ? COLOR_WORDS[cw] : th.accent;
        if (th === THEMES.peques && !cw) col = KIDS[k++ % KIDS.length];
        s.style.background = col;
        s.style.color = ['#ffd500', '#ffd60a', '#ffc43d', '#ffca28'].includes(col) ? '#1a1a3a' : '#fff';
      }
      box.appendChild(s);
      box.appendChild(document.createTextNode(' '));
    });
    caps.appendChild(box);
    gsap.set(box, { autoAlpha: 0 });
    tl.set(box, { autoAlpha: 1 }, sc.start);
    tl.to(box, { autoAlpha: 0, y: -20, duration: 0.18, ease: 'power2.in' }, sc.start + sc.dur - 0.18);
    const spans = [...box.querySelectorAll('.w')];
    // reparto por sílabas aproximadas: las palabras largas tardan más
    const syl = spans.map((s) => Math.max(1, (s.textContent.match(/[aeiouáéíóúü]+/gi) || []).length));
    const tot = syl.reduce((a, b) => a + b, 0);
    const speech = Math.min(sc.dur * 0.88, tot * 0.2 + 0.3);
    let acc = 0;
    spans.forEach((s, i) => {
      const ts = sc.start + 0.05 + (acc / tot) * speech;
      acc += syl[i];
      gsap.set(s, { opacity: 0, y: 30, scale: 0.7 });
      tl.to(s, { opacity: 1, y: 0, scale: 1.12, duration: 0.16, ease: 'power2.out' }, ts);
      tl.to(s, { scale: 1, duration: 0.25, ease: 'back.out(3)' }, ts + 0.16);
    });
  }
})();
