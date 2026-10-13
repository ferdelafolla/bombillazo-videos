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
    aldia: { panel: ['#1b2240', '#121730'], cardFill: '#ff4d5e', cardInk: '#ffffff',  name: 'HOY', bg: ['#0b0e1c', '#141a36', '#1a1432'], glow: '#5b6cff', text: '#fff', accent: '#ff4d5e', accent2: '#ffc43d', accent3: '#00e5c8', ink: '#141a3a', font: "'Inter Display', Inter, sans-serif", chip: 'rgba(255,255,255,.12)', pattern: 'grid', particles: 'dust' },
    curiosidades: { panel: ['#1a2142', '#10162e'], cardFill: '#ffd60a', cardInk: '#1a0f3c',  name: 'CURIOSIDADES', bg: ['#12112b', '#181d45', '#0f2a46'], glow: '#ffd60a', text: '#fff', accent: '#ffd60a', accent2: '#00e5c8', accent3: '#ff6bd6', ink: '#1a0f3c', font: "'Inter Display', Inter, sans-serif", chip: 'rgba(255,255,255,.12)', pattern: 'dots', particles: 'sparks' },
    news: { panel: ['#2a1c23', '#1a1216'], cardFill: '#ff3b5c', cardInk: '#ffffff',  name: 'NEWS', bg: ['#120a10', '#26101c', '#3a1024'], glow: '#ff4d6a', text: '#fff', accent: '#ff3b5c', accent2: '#ffd43d', accent3: '#4fd1ff', ink: '#2a0a18', font: "'Inter Display', Inter, sans-serif", chip: 'rgba(255,255,255,.12)', pattern: 'grid', particles: 'dust' },
    chess: { panel: ['#163a2a', '#0e261b'], cardFill: '#ffd43d', cardInk: '#0b1f17',  name: 'CHESS', bg: ['#0b1f17', '#12382a', '#1f4a2f'], glow: '#ffd43d', text: '#fff', accent: '#ffd43d', accent2: '#7be0a0', accent3: '#ffffff', ink: '#0b1f17', font: "'Inter Display', Inter, sans-serif", chip: 'rgba(255,255,255,.12)', pattern: 'dots', particles: 'sparks' },
    peques: { panel: ['#ffffff', '#f3f8ff'], cardFill: '#ff7043', cardInk: '#ffffff',  name: 'PEQUES', bg: ['#a9dcff', '#e3f4ff', '#fff1c9'], glow: '#ffffff', text: '#28285a', accent: '#ff7043', accent2: '#66bb6a', accent3: '#42a5f5', ink: '#28285a', font: "'Fredoka', sans-serif", chip: 'rgba(255,255,255,.92)', pattern: 'none', particles: 'bubbles' },
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
    // ESTILO TINTA (por defecto): dibujo de línea negra temblorosa sobre amarillo plano, rojo como único acento.
    // spec.estilo = 'clasico' vuelve al estilo anterior.
    const TINTA = spec.estilo !== 'clasico';
    const PAL = { Y: '#f7d94c', Y2: '#f3cf3d', INK: '#161412', RED: '#e63b2e' };
    const th = TINTA ? Object.assign({}, THEMES[spec.canal], { bg: [PAL.Y, PAL.Y, PAL.Y2], glow: PAL.Y, text: PAL.INK, accent: PAL.RED, accent2: PAL.INK, accent3: PAL.RED, ink: PAL.INK,
      chip: PAL.INK, font: "'Vemoly', 'Inter Display', Inter, sans-serif", pattern: 'tinta', particles: 'none', panel: [PAL.Y, PAL.Y], cardFill: PAL.INK, cardInk: PAL.Y }) : THEMES[spec.canal];
    const PEQ = spec.canal === 'peques';
    const tl = gsap.timeline({ paused: true });
    const stage = document.getElementById('stage');
    stage.style.background = `linear-gradient(165deg, ${th.bg[0]} 0%, ${th.bg[1]} 55%, ${th.bg[2]} 100%)`;
    stage.style.fontFamily = th.font;
    stage.dataset.canal = spec.canal;
    if (TINTA) stage.dataset.estilo = 'tinta';
    window.TINTA_PAL = TINTA ? PAL : null;
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
      <radialGradient id="vig" cx="50%" cy="50%" r="70%"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></radialGradient>
      <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
      <filter id="wob" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence id="wobT" type="fractalNoise" baseFrequency="0.022" numOctaves="2" seed="1" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="4.5" xChannelSelector="R" yChannelSelector="G" result="w"/>
        <feTurbulence id="wobR" type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="2" result="r"/>
        <feDisplacementMap in="w" in2="r" scale="3.2" xChannelSelector="R" yChannelSelector="G"/>
      </filter>`;
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
    if (TINTA) { spotA.setAttribute('opacity', 0); spotB.setAttribute('opacity', 0); pattern = el('g', {}, bgl); }
    else if (th.pattern === 'grid') {
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
    for (let i = 0; i < (TINTA ? 0 : 28); i++) {
      const p = { x: R() * W, y: R() * H, r: 2 + R() * (th.particles === 'bubbles' ? 18 : 5), sp: 10 + R() * 40, ph: R() * 6.28, depth: 0.3 + R() * 0.7 };
      p.node = th.particles === 'bubbles'
        ? el('circle', { r: p.r, fill: 'none', stroke: '#fff', 'stroke-width': 3, opacity: 0.55 }, pl)
        : el('circle', { r: p.r, fill: th.particles === 'sparks' ? (i % 3 ? '#fff' : th.accent) : '#fff', opacity: 0.15 + R() * 0.25 }, pl);
      parts.push(p);
    }

    // cámara: todas las escenas viven aquí
    // zona segura de redes: el arte (pensado para x 60-1020, y 290-1100) se encoge a x 60-930, y 285-1015
    const safe = el('g', { transform: 'translate(60 240) scale(0.906) translate(-60 -240)' }, art);
    const cam = el('g', TINTA ? { filter: 'url(#wob)' } : {}, safe);
    if (TINTA) charLayer.setAttribute('style', 'filter:url(#wob)');
    const charSafe = document.createElementNS('http://www.w3.org/2000/svg', 'g'); charSafe.setAttribute('transform', 'translate(60 240) scale(0.906) translate(-60 -240)'); charLayer.appendChild(charSafe); // misma zona segura que el arte

    // ---------- presentador
    const ch = CHARS[spec.personaje]();
    charSafe.appendChild(ch.el);
    Object.assign(ch, { x: 176, y: 1399, s: 0.66 }); // queda en x 165, y 1290 tras la zona segura

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
      const g = el('g', TINTA ? {} : { filter: 'url(#sh)' }, mid); // contenido (sombra suave solo en estilo clásico)
      gsap.set(outer, { autoAlpha: 0 });
      gsap.set(mid, { transformOrigin: '540px 680px' });
      const s = sc.start, e = sc.start + sc.dur;
      const kind = sc.transicion === 'iris' ? 'iris' : 'push';
      // ---- transición insignia (una sola para todo el vídeo; el iris queda para el cierre)
      // Entrada 0.45 s con desaceleración fuerte (expo.out ≈ MD3 emphasized): sube 160 px, escala 0.96→1,
      // desenfoque 6→0. Salida 0.28 s (más corta que la entrada) con aceleración suave: sube 120 px, 1→0.94,
      // se funde y se desenfoca. Pequeño solape = fundido limpio; el desenfoque disimula la doble exposición.
      const isIris = kind === 'iris';
      tl.set(outer, { autoAlpha: 1 }, Math.max(0, s - 0.02));
      if (sc.i > 0) {
        if (isIris) {
          const clipId = `iris${sc.i}`;
          const cp = el('clipPath', { id: clipId }, defs);
          const circ = el('circle', { cx: 540, cy: 680, r: 0 }, cp);
          outer.setAttribute('clip-path', `url(#${clipId})`);
          tl.fromTo(circ, { attr: { r: 0 } }, { attr: { r: 1400 }, duration: 0.7, ease: 'power3.out' }, s - 0.05);
        } else {
          tl.fromTo(mid, { y: 160, scale: 0.96, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.45, ease: 'expo.out' }, s - 0.06);
          tl.fromTo(blur, { attr: { stdDeviation: '6 6' } }, { attr: { stdDeviation: '0 0' }, duration: 0.3, ease: 'power2.out' }, s - 0.06);
        }
      }
      // empuje lento de cámara durante la escena (capa ambiente), con curva suave en vez de lineal
      tl.fromTo(g, { scale: 1, x: 0 }, { scale: 1.035, x: (sc.i % 2 ? -10 : 10), transformOrigin: '540px 680px', duration: sc.dur + 0.4, ease: 'sine.inOut' }, s);
      // salida
      const next = scenes[sc.i + 1];
      if (next) {
        const nk = next.transicion === 'iris' ? 'iris' : 'push';
        if (nk === 'iris') { tl.to(mid, { scale: 0.95, opacity: 0.6, duration: 0.5, ease: 'sine.inOut' }, e - 0.4); }
        else {
          tl.to(mid, { y: -120, scale: 0.94, opacity: 0, duration: 0.28, ease: 'power2.in' }, e - 0.22);
          tl.to(blur, { attr: { stdDeviation: '6 6' }, duration: 0.28, ease: 'power2.in' }, e - 0.22);
        }
        tl.set(outer, { autoAlpha: 0 }, e + 0.7);
      }

      const A = {
        g, tl, t0: s, dur: sc.dur, th, W, H, ch, pal: KIDS, grad, rnd: R,
        el: (tag, attrs, parent) => el(tag, attrs, parent || g),
        at: (x) => s + x, // tiempo relativo dentro de la escena
        // aparición con anticipación + estirado + rebote (squash & stretch)
        pop(target, x = 0, extra = {}) {
          // entrada sutil: nada aparece de la nada (escala 0.86, no 0), ease-out fuerte y un rebote mínimo
          // el panel de la escena ya entra con la transición: no le sumamos otro movimiento
          if (x < 0.05 && target.querySelector && target.querySelector('clipPath')) { gsap.set(target, { opacity: 1 }); return; }
          gsap.set(target, { transformOrigin: '50% 50%', transformBox: 'fill-box', scale: 0.86, opacity: 0 });
          tl.to(target, { scale: 1, opacity: 1, duration: 0.42, ease: 'back.out(1.25)', ...extra }, s + x);
        },
        // entra desplazándose desde un lado con arco y asentado
        enter(target, x = 0, from = 'down', dist = 260) {
          const d = { down: [0, dist], up: [0, -dist], left: [-dist, 0], right: [dist, 0] }[from];
          gsap.set(target, { transformOrigin: '50% 50%', transformBox: 'fill-box' });
          tl.fromTo(target, { x: `+=${d[0]}`, y: `+=${d[1]}`, opacity: 0, rotation: d[0] ? (d[0] > 0 ? 8 : -8) : 0 },
            { x: `-=${d[0]}`, y: `-=${d[1]}`, opacity: 1, rotation: 0, duration: 0.6, ease: 'back.out(1.6)' }, s + x);
        },
        // panel minimalista: color plano, esquinas grandes, trazo fino; devuelve el grupo recortado
        panel(id, fill = grad(th.panel[0], th.panel[1]), stroke = 'rgba(255,255,255,.10)', o = {}) {
          const { x = 60, y = 290, w = 960, h = 800, r = 48 } = o;
          const f = A.el('g', {}); const cp = A.el('clipPath', { id }, f); A.el('rect', { x, y, width: w, height: h, rx: r }, cp);
          const c = A.el('g', { 'clip-path': `url(#${id})` }, f);
          A.el('rect', { x, y, width: w, height: h, fill }, c);
          A.el('rect', { x, y, width: w, height: h, rx: r, fill: 'none', stroke, 'stroke-width': 3 }, f);
          A.pop(f, 0); return c;
        },
        // entrada escalonada de un grupo (30-80 ms entre elementos): da ritmo sin bloquear
        stagger(targets, x = 0, step = 0.06) { targets.forEach((t, i) => A.pop(t, x + i * step)); },
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
        // "respiración": tras aparecer, el elemento sigue vivo con un pulso de escala muy sutil
        breathe(target, x = 0.6, amp = 0.03, period = 1.8) {
          gsap.set(target, { transformOrigin: '50% 50%', transformBox: 'fill-box' });
          const n = Math.max(1, Math.ceil((sc.dur - x) / period));
          tl.to(target, { scale: 1 + amp, duration: period / 2, ease: 'sine.inOut', yoyo: true, repeat: n * 2 - 1 }, s + x);
        },
        // entrada desde un lado con desenfoque de movimiento ligero (para títulos y tarjetas)
        slide(target, x = 0, from = 'left', dist = 320) {
          const dx = from === 'left' ? -dist : from === 'right' ? dist : 0, dy = from === 'up' ? -dist : from === 'down' ? dist : 0;
          tl.fromTo(target, { x: `+=${dx}`, y: `+=${dy}`, opacity: 0 }, { x: `-=${dx}`, y: `-=${dy}`, opacity: 1, duration: 0.5, ease: 'expo.out' }, s + x);
        },
        // ambiente rico para el panel (usar dentro del grupo recortado `s` de la escena):
        // haces de luz, motas flotantes, viñeta y un barrido de brillo. Da profundidad a fondos planos.
        bgFx(parent, o = {}) {
          const { x = 60, y = 290, w = 960, h = 800, motes = 8, shafts = false, vignette = true, sweep = false, color = '#ffffff' } = o;
          const fx = el('g', { 'pointer-events': 'none' }, parent);
          if (shafts) for (let i = 0; i < 3; i++) {
            const sh = el('path', { d: `M${x + 140 + i * 280},${y - 40} l-110,${h + 80} h210z`, fill: color, opacity: 0.07 }, fx);
            tl.fromTo(sh, { x: -26 }, { x: 26, duration: 2.8 + i * 0.5, ease: 'sine.inOut', yoyo: true, repeat: Math.ceil((sc.dur + 1) / (2.8 + i * 0.5)) }, s + i * 0.2);
          }
          const r = rng(7 + sc.i * 31);
          for (let i = 0; i < motes; i++) {
            const c = el('circle', { r: 3 + r() * 6, fill: color, opacity: 0 }, fx);
            const px = x + 30 + r() * (w - 60), py = y + h - 20 - r() * 200;
            tl.fromTo(c, { x: px, y: py, opacity: 0 }, { y: py - 260 - r() * 240, x: px + (r() - 0.5) * 120, opacity: 0.55, duration: 2.2 + r() * 1.8, ease: 'sine.inOut', yoyo: true, repeat: 1 }, s + r() * 1.2);
          }
          if (vignette) el('rect', { x, y, width: w, height: h, fill: 'url(#vig)' }, fx);
          if (sweep) {
            const b = el('path', { d: `M${x - 200},${y + h} l260,0 l${h * 0.6},${-h} l-260,0z`, fill: color, opacity: 0.0 }, fx);
            tl.fromTo(b, { x: 0, opacity: 0.16 }, { x: w + 400, opacity: 0.0, duration: 1.3, ease: 'power2.inOut' }, s + 0.15);
          }
          return fx;
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
          // brillo interior superior: profundidad sutil sin recargar
          el('rect', { x: x + 1, y: y + 1, width: w - 2, height: h - 2, rx: Math.max(0, r - 1), fill: 'none', stroke: '#fff', 'stroke-opacity': 0.22, 'stroke-width': 2 }, c);
          return c;
        },
        charTo(props, x = 0, d = 0.6) { tl.to(ch, { ...props, duration: d, ease: 'power3.inOut' }, s + x); },
        emote(name, x = 0) { tl.set(ch, { mood: name }, s + x); },
      };
      // el presentador reacciona al empezar cada escena
      tl.fromTo(ch, { hop: 0 }, { hop: 1, duration: 0.55, ease: 'none', immediateRender: false }, s + 0.05);
      tl.set(ch, { mood: sc.emocion || (sc.i === 0 ? 'sorpresa' : 'feliz') }, s);
      sc.arte && sc.arte(A);
      // ambiente automático sobre el panel estándar (motas, viñeta y barrido de brillo de entrada):
      // solo si la escena usa un panel recortado y no lo desactiva (spec.ambiente === false o sc.ambiente === false)
      if (TINTA) inkify(g, PAL, spec.colores === true);
      if (!TINTA && spec.ambiente !== false && sc.ambiente !== false && !g.querySelector('[data-amb]') && g.querySelector('clipPath')) {
        const cid = `amb${sc.i}`;
        const cp = el('clipPath', { id: cid }, defs); el('rect', { x: 60, y: 290, width: 960, height: 800, rx: 50 }, cp);
        const amb = el('g', { 'clip-path': `url(#${cid})`, 'pointer-events': 'none', 'data-amb': 1 }, g);
        A.bgFx(amb, { motes: PEQ ? 5 : 9, vignette: !PEQ, sweep: true, color: '#ffffff' });
      }
      buildCaption(sc, th, tl, caps);
    });

    // ---------- marca y progreso
    document.getElementById('chipname').textContent = th.name;
    document.getElementById('chip').style.background = th.chip;
    document.getElementById('brand').style.color = th.accent === '#ffd60a' ? '#ffd60a' : th.accent;
    document.getElementById('chipname').style.color = th.text;
    document.getElementById('bar').style.background = th.accent;
    tl.fromTo('#chip', { x: -420 }, { x: 0, duration: 0.7, ease: 'back.out(1.5)' }, 0.15);

    // ---------- idioma (es por defecto; en si el título no es español) y etiqueta de serie traducida
    const lang = spec.lang || (/^[¿¡]|[áéíóúñ]/i.test(spec.titulo || '') ? 'es' : 'en');
    if (lang === 'en') document.getElementById('chipname').textContent = { CURIOSIDADES: 'FUN FACTS', HOY: 'TODAY', PEQUES: 'KIDS' }[th.name] || th.name;

    // ---------- recordatorio de suscripción a mitad de vídeo (la mayoría no llega al final).
    // Píldora roja con campana arriba a la derecha: entra (expo.out), la campana suena, se "pulsa"
    // (escala 0.94, 100 ms), cambia a "suscrito" y sale más rápido de lo que entró.
    if (window.SUB && spec.suscripcion !== false) {
      // ---------- pausa de suscripción a mitad de vídeo (la voz dice "Si quieres saber más, ¡suscríbete!"):
      // tarjeta centrada dentro de la zona segura; el vídeo sigue después.
      const S = window.SUB, en = S.lang !== 'es';
      const Q = en ? 'WANT TO KNOW MORE?' : '¿QUIERES SABER MÁS?';
      const BL = en ? ['SUBSCRIBE', 'SUBSCRIBED ✓'] : ['SUSCRÍBETE', 'SUSCRITO ✓'];
      const Yc = TINTA ? PAL.Y : '#ffd93b', Kc = TINTA ? PAL.INK : '#161412', Rc = TINTA ? PAL.RED : '#ff0033';
      const ov = document.createElement('div');
      ov.style.cssText = `position:absolute;inset:0;z-index:50;background:${Yc};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:70px;padding:240px 150px 470px 60px;box-sizing:border-box;font-family:${th.font}`;
      ov.innerHTML = `<div class="q" style="font-size:96px;line-height:1.05;text-align:center;color:${Kc};max-width:840px">${Q}</div>`
        + `<div class="b" style="display:flex;align-items:center;gap:22px;height:150px;padding:0 64px 0 48px;border-radius:75px;background:${Rc};border:7px solid ${Kc};box-shadow:0 10px 0 ${Kc};color:#fff;font-size:68px;letter-spacing:1px">`
        + `<svg class="bell" width="70" height="70" viewBox="-20 -22 40 44"><path d="M-12,8 V-4 a12,12 0 0,1 24,0 V8 l4,5 h-32z" fill="#fff"/><circle cy="16" r="4" fill="#fff"/></svg><span>${BL[0]}</span></div>`
        + `<svg class="hand" width="150" height="150" viewBox="0 0 100 100" style="position:absolute;left:0;top:0"><path d="M38,92 C30,80 18,66 22,60 C26,55 33,60 38,66 L38,22 C38,14 50,14 50,22 L50,50 L52,40 C53,33 63,33 63,41 L63,52 L65,45 C66,38 76,38 76,46 L76,56 L78,52 C80,46 88,48 88,55 L86,74 C84,84 80,92 74,92 Z" fill="#fff" stroke="${Kc}" stroke-width="5" stroke-linejoin="round"/></svg>`;
      stage.appendChild(ov);
      const q = ov.querySelector('.q'), btn = ov.querySelector('.b'), lab = btn.querySelector('span'), bell = btn.querySelector('.bell'), hand = ov.querySelector('.hand');
      const t1 = S.start;
      gsap.set(ov, { autoAlpha: 0 }); gsap.set(hand, { autoAlpha: 0 });
      tl.to(ov, { autoAlpha: 1, duration: 0.22, ease: 'power2.out' }, t1);
      tl.fromTo(q, { y: 60, scale: 0.92 }, { y: 0, scale: 1, duration: 0.45, ease: 'expo.out' }, t1);
      tl.fromTo(btn, { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.5, ease: 'back.out(1.8)' }, t1 + 0.18);
      tl.fromTo(bell, { rotation: -18, transformOrigin: '50% 10%' }, { rotation: 18, duration: 0.09, ease: 'sine.inOut', yoyo: true, repeat: 5 }, t1 + 0.5);
      // la mano entra y pulsa el botón
      const press = t1 + Math.min(1.5, S.dur * 0.6);
      tl.call(() => { const r = btn.getBoundingClientRect(), so = stage.getBoundingClientRect(), k = 1080 / so.width; gsap.set(hand, { x: (r.left - so.left + r.width * 0.62) * k, y: (r.top - so.top + r.height * 0.45) * k }); }, null, press - 0.45);
      tl.fromTo(hand, { autoAlpha: 0, xPercent: 60, yPercent: 80 }, { autoAlpha: 1, xPercent: 0, yPercent: 0, duration: 0.35, ease: 'power3.out' }, press - 0.42);
      tl.to(btn, { scale: 0.92, duration: 0.1, ease: 'power2.out' }, press);
      tl.to(hand, { scale: 0.9, duration: 0.1, ease: 'power2.out' }, press);
      tl.to(btn, { scale: 1, duration: 0.2, ease: 'back.out(2)' }, press + 0.1);
      tl.to(hand, { scale: 1, duration: 0.2, ease: 'power2.out' }, press + 0.1);
      tl.call(() => { lab.textContent = BL[1]; btn.style.background = Kc; }, null, press + 0.08);
      tl.call(() => { lab.textContent = BL[0]; btn.style.background = Rc; }, null, press + 0.02);
      tl.to(ov, { autoAlpha: 0, duration: 0.22, ease: 'power2.in' }, t1 + S.dur - 0.22);
    } else if (spec.canal !== 'peques' && spec.suscripcion !== false) {
      const L = lang === 'en' ? ['SUBSCRIBE', 'SUBSCRIBED ✓'] : ['SUSCRÍBETE', 'SUSCRITO ✓'];
      const pill = document.createElement('div');
      pill.style.cssText = 'position:absolute;right:160px;top:240px;height:72px;border-radius:36px;background:#ff0033;color:#fff;display:flex;align-items:center;gap:12px;padding:0 30px 0 22px;font-size:32px;font-weight:900;letter-spacing:.5px;box-shadow:0 10px 30px rgba(0,0,0,.3);font-family:' + th.font;
      pill.innerHTML = '<svg width="36" height="36" viewBox="-20 -22 40 44" class="bell"><path d="M-12,8 V-4 a12,12 0 0,1 24,0 V8 l4,5 h-32z" fill="#fff"/><circle cy="16" r="4" fill="#fff"/></svg><span>' + L[0] + '</span>';
      stage.appendChild(pill);
      const label = pill.querySelector('span'), bell = pill.querySelector('.bell');
      const mid = scenes.find((x) => x.start >= total * 0.4 && x.i < scenes.length - 1) || scenes[Math.min(2, scenes.length - 1)];
      const t1 = Math.max(4, mid.start + 0.6);
      gsap.set(pill, { autoAlpha: 0, x: 280 });
      tl.to(pill, { autoAlpha: 1, x: 0, duration: 0.45, ease: 'expo.out' }, t1);
      tl.fromTo(bell, { rotation: -16, transformOrigin: '50% 10%' }, { rotation: 16, duration: 0.09, ease: 'sine.inOut', yoyo: true, repeat: 5 }, t1 + 0.4);
      tl.to(pill, { scale: 0.94, duration: 0.1, ease: 'power2.out' }, t1 + 1.5);
      tl.to(pill, { scale: 1, duration: 0.18, ease: 'power2.out' }, t1 + 1.6);
      if (TINTA) { pill.style.background = PAL.RED; pill.style.border = '5px solid ' + PAL.INK; pill.style.boxShadow = '0 6px 0 ' + PAL.INK; }
      const ON = TINTA ? PAL.RED : '#ff0033', OFF = TINTA ? PAL.INK : '#2b2b3a';
      tl.call(() => { label.textContent = L[1]; pill.style.background = OFF; }, null, t1 + 1.6);
      tl.call(() => { label.textContent = L[0]; pill.style.background = ON; }, null, t1 - 0.05);
      tl.to(pill, { autoAlpha: 0, x: 60, duration: 0.25, ease: 'power2.out' }, t1 + 3.0);
    }

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

    window.seek = function (t0) {
      // POSTERIZE TIME (estilo tinta): la animación avanza a 12 dibujos/s ("a doses" sobre 24 fps)
      const t = TINTA ? Math.floor(t0 * 12 + 1e-6) / 12 : t0;
      tl.seek(t, false);
      const amp = window.AMP ? (window.AMP[Math.floor(t * FPS)] || 0) : fakeAmp(t, scenes);
      ch.update(t, amp);
      parts.forEach((p) => {
        const y = ((p.y - t * p.sp * p.depth) % (H + 100) + H + 100) % (H + 100) - 50;
        const x = p.x + Math.sin(t * 0.6 + p.ph) * 30 * p.depth;
        p.node.setAttribute('cx', x); p.node.setAttribute('cy', y);
      });
      gctx.putImageData(frames[window.TINTA_PAL ? 0 : Math.floor(t * 24) % 4], 0, 0);
      if (TINTA) {
        const wt = document.getElementById('wobT'); if (wt) wt.setAttribute('seed', 1 + (Math.floor(t * 12 + 1e-6) % 4));
        const wr = document.getElementById('wobR'); if (wr) wr.setAttribute('seed', 7 + (Math.floor(t * 6 + 1e-6) % 3));
      }
      document.getElementById('bar').style.width = `${Math.min(100, (t / total) * 100)}%`;
    };
    window.seek(0);
  };


  // ---------- INKIFY: convierte cualquier ilustración a estilo "tinta" (línea negra + relleno amarillo + rojo de acento)
  // Reglas: decoraciones tenues (opacidad < 0.5, brillos blancos) se ocultan; piezas pequeñas → negro macizo;
  // oscuros → negro; rojos → rojo con contorno; todo lo demás → amarillo con contorno negro. Textos: negro
  // (o amarillo si están sobre una tarjeta negra). Se aplica tras dibujar cada escena.
  function parseColor(c) {
    if (!c) return null; c = c.trim().toLowerCase();
    if (c === 'none' || c === 'transparent') return null;
    if (c.startsWith('url(')) {
      const id = c.slice(5, -1).replace('#', ''); const gr = document.getElementById(id);
      const st = gr && gr.querySelector('stop'); return st ? parseColor(st.getAttribute('stop-color')) : [200, 200, 200, 1];
    }
    if (c === 'white') return [255, 255, 255, 1]; if (c === 'black') return [0, 0, 0, 1];
    if (c[0] === '#') { let h = c.slice(1); if (h.length === 3) h = h.split('').map((x) => x + x).join(''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1]; }
    const m = c.match(/rgba?\(([^)]+)\)/); if (m) { const v = m[1].split(',').map(parseFloat); return [v[0], v[1], v[2], v[3] == null ? 1 : v[3]]; }
    return [200, 200, 200, 1];
  }
  const lum = (c) => (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
  const isRed = (c) => c[0] > 170 && c[1] < 120 && c[2] < 130;
  function inkify(root, P, keepColors) {
    const skip = 'clipPath,defs,mask,filter,linearGradient,radialGradient';
    const shapes = [...root.querySelectorAll('path,rect,circle,ellipse,polygon,polyline,line')].filter((e) => !e.closest(skip));
    const effOpacity = (e) => { let o = 1; for (let p = e; p && p !== root.parentNode; p = p.parentNode) { const a = p.getAttribute && p.getAttribute('opacity'); if (a != null) o *= parseFloat(a); } return o; };
    for (const e of shapes) {
      const fc = parseColor(e.getAttribute('fill') == null ? '#000' : e.getAttribute('fill'));
      const sc = parseColor(e.getAttribute('stroke'));
      const op = effOpacity(e) * (fc ? fc[3] : 1) * (!fc && sc ? sc[3] : 1);
      if (op < 0.5 || (fc && lum(fc) > 0.9 && effOpacity(e) < 1)) { e.setAttribute('display', 'none'); continue; }
      const r = e.getBoundingClientRect(); const small = r.width > 0 && r.width < 26 && r.height < 26;
      // sin marcos de panel: en este estilo los dibujos flotan sobre el amarillo
      if (e.tagName === 'rect' && r.width > 770 && r.height > 585) { e.setAttribute('display', 'none'); continue; }
      e.setAttribute('stroke-linejoin', 'round'); e.setAttribute('stroke-linecap', 'round');
      if (!fc) { // solo trazo
        if (sc) { e.setAttribute('stroke', isRed(sc) ? P.RED : P.INK); const w = parseFloat(e.getAttribute('stroke-width') || 1); if (w < 5) e.setAttribute('stroke-width', 5); }
        continue;
      }
      if (small) { e.setAttribute('fill', isRed(fc) ? P.RED : P.INK); e.setAttribute('stroke', 'none'); continue; }
      const intended = (e.getAttribute('fill') || '').toLowerCase() === P.INK;
      if (lum(fc) < 0.28 && (intended || r.width * r.height < 40000)) { e.setAttribute('fill', P.INK); if (sc) e.setAttribute('stroke', P.INK); continue; }
      // colores: true → se conservan los colores del dibujo (p. ej. un arcoíris) pero con el contorno negro del estilo
      e.setAttribute('fill', keepColors && lum(fc) < 0.9 ? e.getAttribute('fill') : (isRed(fc) ? P.RED : P.Y));
      e.setAttribute('stroke', P.INK);
      if (!sc) { e.setAttribute('stroke-width', 7); e.setAttribute('vector-effect', 'non-scaling-stroke'); }
      else { const w = parseFloat(e.getAttribute('stroke-width') || 1); if (w < 6) e.setAttribute('stroke-width', 6); }
    }
    for (const t of root.querySelectorAll('text')) {
      if (t.closest(skip)) continue;
      const fc = parseColor(t.getAttribute('fill')) || [0, 0, 0, 1];
      t.removeAttribute('stroke'); t.removeAttribute('paint-order');
      if (isRed(fc)) { t.setAttribute('fill', P.RED); continue; }
      // ¿está sobre una tarjeta oscura? (primer relleno del grupo padre)
      const box = t.parentNode && [...t.parentNode.querySelectorAll('rect,path,circle,ellipse')].find((x) => x.getAttribute('fill') && x.getAttribute('fill') !== 'none');
      const onDark = box && (box.getAttribute('fill') === P.INK || box.getAttribute('fill') === P.RED);
      t.setAttribute('fill', onDark ? (box.getAttribute('fill') === P.RED ? '#fff' : P.Y) : P.INK);
      // si el texto no cabe en su tarjeta (esta tipografía es ancha), se reduce hasta que quepa
      if (box) { try { const bw = box.getBBox().width, tw = t.getBBox().width; if (bw > 0 && tw > bw - 48) { const fs = parseFloat(t.getAttribute('font-size')); t.setAttribute('font-size', Math.floor(fs * (bw - 48) / tw)); } } catch (err) { /* sin bbox */ } }
    }
  }

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
        if (document.getElementById('stage').dataset.canal === 'peques' && !window.TINTA_PAL && !cw) col = KIDS[k++ % KIDS.length];
        s.style.background = col;
        if (window.TINTA_PAL) { s.style.background = 'transparent'; s.style.color = window.TINTA_PAL.RED; box.appendChild(s); box.appendChild(document.createTextNode(' ')); return; }
        s.style.color = ['#ffd500', '#ffd60a', '#ffc43d', '#ffca28'].includes(col) ? '#1a1a3a' : '#fff';
      }
      box.appendChild(s);
      box.appendChild(document.createTextNode(' '));
    });
    caps.appendChild(box);
    // que el subtítulo quepa en su caja (zona segura): reduce la letra si hace falta
    { let fs = parseFloat(getComputedStyle(box).fontSize) || 62, n = 0;
      while (box.scrollHeight > caps.clientHeight + 2 && fs > 36 && n++ < 20) { fs -= 3; box.style.fontSize = fs + 'px'; } }
    gsap.set(box, { autoAlpha: 0 });
    tl.set(box, { autoAlpha: 1 }, sc.start);
    tl.to(box, { autoAlpha: 0, y: -12, duration: 0.16, ease: 'power2.out' }, sc.start + sc.dur - 0.16);
    const spans = [...box.querySelectorAll('.w')];
    // reparto por sílabas aproximadas: las palabras largas tardan más
    const syl = spans.map((s) => Math.max(1, (s.textContent.match(/[aeiouáéíóúü]+/gi) || []).length));
    const tot = syl.reduce((a, b) => a + b, 0);
    const speech = Math.min(sc.dur * 0.88, tot * 0.2 + 0.3);
    let acc = 0;
    spans.forEach((s, i) => {
      const ts = sc.start + 0.05 + (acc / tot) * speech;
      acc += syl[i];
      // palabras: rápidas y discretas (salen decenas por vídeo); solo las destacadas rebotan un poco
      const hlw = s.classList.contains('hl');
      gsap.set(s, { opacity: 0, y: 14, scale: hlw ? 0.9 : 0.98 });
      tl.to(s, { opacity: 1, y: 0, scale: 1, duration: hlw ? 0.32 : 0.22, ease: hlw ? 'back.out(1.6)' : 'expo.out' }, ts);
    });
  }
})();
