// Bombillazo Hoy — ¿Cómo pintan los aviones la bandera en el cielo? (12/10/2026)
// Fuentes: Vozpópuli 12/10/2025 (Formación Mirlo, 5 Pilatus PC-21, relevo de la Patrulla Águila);
// El Debate (Patrulla Águila, C-101, primer vuelo 1985); Wikipedia "Colored smoke" (aceite + colorante en el escape).
VIDEO({
  canal: 'aldia', personaje: 'chispa',
  titulo: '¿Cómo pintan los aviones la bandera en el cielo?',
  escenas: [
    // 1 — gancho: tres reactores trazan rojo-amarillo-rojo
    {
      texto: '¿Cómo pintan los aviones la bandera en el cielo?', destacar: ['bandera'], emocion: 'sorpresa',
      arte(A) {
        const { el, tl, at, th } = A;
        const sky = el('g');
        const cp = el('clipPath', { id: 'sky1' }, sky); el('rect', { x: 60, y: 290, width: 960, height: 800, rx: 54 }, cp);
        const inn = el('g', { 'clip-path': 'url(#sky1)' }, sky);
        el('rect', { x: 60, y: 290, width: 960, height: 800, fill: A.grad('#3f7fe0', '#a9d4ff') }, inn);
        [[200, 420, 1], [760, 520, 0.8], [480, 900, 1.1]].forEach(([x, y, s], i) => {
          const c = el('g', { html: '<ellipse rx="110" ry="40" fill="#fff"/><ellipse cx="-60" cy="12" rx="70" ry="34" fill="#fff"/><ellipse cx="70" cy="14" rx="74" ry="32" fill="#fff"/>' }, inn);
          tl.fromTo(c, { x: x + 80, y, scale: s, opacity: 0.85 }, { x: x - 80, duration: A.dur + 0.6, ease: 'none' }, at(0));
        });
        const cols = ['#e53935', '#ffc400', '#ffc400', '#e53935'];
        cols.forEach((c, i) => {
          const y = 560 + i * 44;
          const tr = el('rect', { x: 1080, y: y - 22, width: 0, height: 44, fill: c, opacity: 0.92 }, inn);
          const pl = el('g', { html: '<path d="M0,0 l-60,-8 l-10,-24 h-12 l6,26 l-34,-4 l-10,-12 h-10 l4,22 l-4,22 h10 l10,-12 l34,-4 l-6,26 h12 l10,-24 l60,-8 q14,0 14,-6 t-14,-6z" fill="#f4f6ff" transform="scale(-1,1)"/>' }, inn);
          const t0 = 0.25 + i * 0.08;
          tl.fromTo(pl, { x: 1150, y: y + 6 }, { x: 120, duration: 1.9, ease: 'power1.inOut' }, at(t0));
          tl.fromTo(tr, { attr: { x: 1150, width: 0 } }, { attr: { x: 120, width: 1030 }, duration: 1.9, ease: 'power1.inOut' }, at(t0));
        });
        el('rect', { x: 60, y: 290, width: 960, height: 800, rx: 54, fill: 'none', stroke: '#fff', 'stroke-opacity': 0.3, 'stroke-width': 6 }, sky);
        A.pop(sky, 0);
        [[180, 360, th.accent2], [900, 330, th.accent]].forEach(([x, y, c], i) => {
          const q = el('g'); gsap.set(q, { x, y });
          el('circle', { r: 58, fill: c }, q); el('circle', { r: 58, fill: 'url(#shine)' }, q);
          A.txt('?', 0, 28, 84, i ? '#fff' : '#141a3a', { parent: q });
          A.pop(q, 1.6 + i * 0.15); A.float(q, 14, 2.2, 2);
        });
      },
    },
    // 2 — Madrid se tiñe de rojo y amarillo
    {
      texto: 'Cada 12 de octubre, en el desfile de Madrid, el cielo se llena de rojo y amarillo.', destacar: ['rojo', 'amarillo.'],
      arte(A) {
        const { el, tl, at, th } = A;
        const f = el('g');
        const cp = el('clipPath', { id: 'mad' }, f); el('rect', { x: 60, y: 290, width: 960, height: 800, rx: 54 }, cp);
        const s = el('g', { 'clip-path': 'url(#mad)' }, f);
        const bg = el('rect', { x: 60, y: 290, width: 960, height: 800, fill: A.grad('#2b5fb8', '#8ec5ff') }, s);
        // estelas que barren el cielo
        ['#e53935', '#ffc400', '#e53935', '#ffc400'].forEach((c, i) => {
          const p = el('path', { d: `M1100,${380 + i * 70} C800,${330 + i * 70} 400,${470 + i * 60} -40,${400 + i * 70}`, stroke: c, 'stroke-width': 46, fill: 'none', 'stroke-linecap': 'round', opacity: 0.85 }, s);
          A.draw(p, 0.4 + i * 0.22, 1.4, 'power2.inOut');
        });
        // skyline genérico
        const city = el('g', { fill: '#16224d' }, s);
        let x = 60; const r = A.rnd;
        while (x < 1020) { const w = 50 + r() * 70, h = 110 + r() * 230; el('rect', { x, y: 1090 - h, width: w, height: h }, city); for (let k = 0; k < Math.floor(h / 46); k++) el('rect', { x: x + 12, y: 1090 - h + 18 + k * 46, width: w - 24, height: 12, rx: 3, fill: '#ffd76a', opacity: r() > 0.5 ? 0.7 : 0.15 }, city); x += w + 6; }
        tl.fromTo(city, { y: 320 }, { y: 0, duration: 0.8, ease: 'power3.out' }, at(0.05));
        el('rect', { x: 60, y: 290, width: 960, height: 800, rx: 54, fill: 'none', stroke: '#fff', 'stroke-opacity': 0.3, 'stroke-width': 6 }, f);
        A.pop(f, 0);
        const badge = el('g'); gsap.set(badge, { x: 540, y: 360 });
        A.card(-150, -58, 300, 116, A.grad('#ffffff', '#e4e8f7'), 26, badge);
        A.txt('12 OCT', 0, 22, 64, '#e8344a', { parent: badge });
        A.pop(badge, 0.3);
        A.txt('MADRID', 540, 1060, 40, '#fff', { 'letter-spacing': 10 });
      },
    },
    // 3 — 40 años de Patrulla Águila
    {
      texto: 'Durante 40 años lo hizo la Patrulla Águila, con sus aviones C-101.', destacar: ['40', 'Águila,'], emocion: 'pensar',
      arte(A) {
        const { el, tl, at, th } = A;
        const cnt = el('g'); gsap.set(cnt, { x: 540, y: 430 });
        A.card(-200, -110, 400, 200, 'rgba(255,255,255,.08)', 40, cnt);
        const n = A.txt('0', 0, 40, 150, th.accent2, { parent: cnt });
        A.txt('AÑOS', 0, 80, 34, '#fff', { parent: cnt, 'letter-spacing': 8 });
        A.pop(cnt, 0.05);
        A.count(n, 0, 40, 0.3, 1.6, (v) => String(Math.round(v)));
        // línea de tiempo 1985 → 2025
        const line = el('path', { d: 'M160,760 H920', stroke: '#fff', 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0.5 });
        A.draw(line, 0.3, 1.6, 'power1.inOut');
        [[160, '1985'], [920, '2025']].forEach(([x, y], i) => { const d = el('circle', { cx: x, cy: 760, r: 16, fill: i ? th.accent : th.accent2 }); A.pop(d, 0.3 + i * 1.5); A.txt(y, x, 830, 44, '#fff'); });
        // reactor C-101 que recorre la línea
        const jet = el('g');
        el('path', { d: 'M-90,0 q20,-22 90,-22 h60 q30,0 40,22 q-10,22 -40,22 h-60 q-70,0 -90,-22z', fill: A.grad('#ffffff', '#c7cfe8') }, jet);
        el('path', { d: 'M-10,-20 l-50,-60 h24 l60,60z', fill: '#e53935' }, jet);
        el('path', { d: 'M-10,20 l-50,60 h24 l60,-60z', fill: '#c62f2f' }, jet);
        el('path', { d: 'M-80,-6 l-30,-40 h18 l34,40z', fill: '#ffc400' }, jet);
        el('ellipse', { cx: 50, cy: -10, rx: 22, ry: 9, fill: '#2a2f6b' }, jet);
        tl.fromTo(jet, { x: 160, y: 690 }, { x: 920, duration: 1.6, ease: 'power1.inOut' }, at(0.3));
        A.txt('C-101', 540, 1000, 60, '#fff', { outline: '#141a3a' });
        A.charTo({ look: 1 }, 0.3);
      },
    },
    // 4 — relevo: Formación Mirlo, 5 PC-21
    {
      texto: 'En 2025 tomó el relevo la Formación Mirlo: cinco aviones Pilatus PC-21.', destacar: ['2025', 'Mirlo:'],
      arte(A) {
        const { el, tl, at, th } = A;
        const tag = el('g'); gsap.set(tag, { x: 540, y: 360 });
        A.card(-170, -60, 340, 110, A.grad('#ffd76a', '#ffb81f'), 28, tag);
        A.txt('2025', 0, 24, 84, '#141a3a', { parent: tag });
        A.pop(tag, 0.05);
        // testigo que pasa de mano
        const baton = el('rect', { x: -60, y: -12, width: 120, height: 24, rx: 12, fill: th.accent2 });
        tl.fromTo(baton, { x: 300, y: 520, rotation: -20 }, { x: 780, y: 520, rotation: 20, duration: 0.9, ease: 'power2.inOut' }, at(0.4));
        // cinco turbohélices en formación (punta de flecha)
        const pos = [[540, 640], [430, 730], [650, 730], [320, 820], [760, 820]];
        pos.forEach(([x, y], i) => {
          const p = el('g');
          el('path', { d: 'M0,-70 q12,0 14,30 l4,30 l56,22 v14 l-56,-8 l-4,40 l22,14 v10 l-36,-8 l-36,8 v-10 l22,-14 l-4,-40 l-56,8 v-14 l56,-22 l4,-30 q2,-30 14,-30z', fill: A.grad('#ffffff', '#c9d1ea') }, p);
          el('ellipse', { cx: 0, cy: -38, rx: 8, ry: 16, fill: '#2a2f6b' }, p);
          const prop = el('rect', { x: -26, y: -76, width: 52, height: 5, rx: 2, fill: '#6b7186' }, p);
          tl.to(prop, { scaleX: 0.15, duration: 0.05, yoyo: true, repeat: 60, transformOrigin: '50% 50%', transformBox: 'fill-box' }, at(0));
          tl.fromTo(p, { x, y: y + 700, scale: 0.9 }, { y, duration: 0.8, ease: 'back.out(1.2)' }, at(0.6 + i * 0.1));
          tl.to(p, { y: y - 10, duration: 1, yoyo: true, repeat: 3, ease: 'sine.inOut' }, at(1.5 + i * 0.1));
        });
        const lbl = el('g'); gsap.set(lbl, { x: 540, y: 1000 });
        A.card(-230, -50, 460, 92, 'rgba(255,255,255,.1)', 24, lbl);
        A.txt('5 × PC-21', 0, 18, 56, '#fff', { parent: lbl });
        A.pop(lbl, 1.3);
      },
    },
    // 5 — el depósito: aceite + colorante
    {
      texto: 'El truco está en el motor: cada avión lleva un depósito con aceite ligero mezclado con colorante.', destacar: ['aceite', 'colorante.'], emocion: 'pensar',
      arte(A) {
        const { el, tl, at, th } = A;
        // avión en corte
        const pl = el('g'); gsap.set(pl, { x: 540, y: 520 });
        el('path', { d: 'M-380,0 q60,-70 300,-70 h220 q90,0 140,70 q-50,70 -140,70 h-220 q-240,0 -300,-70z', fill: A.grad('#eef1ff', '#b9c2e3') }, pl);
        el('path', { d: 'M-380,0 q60,-70 300,-70 h220 q90,0 140,70 q-50,70 -140,70 h-220 q-240,0 -300,-70z', fill: 'none', stroke: '#fff', 'stroke-width': 4, 'stroke-dasharray': '14 10', opacity: 0.6 }, pl);
        A.enter(pl, 0.05, 'left', 300);
        // depósito transparente
        const tank = el('g'); gsap.set(tank, { x: 500, y: 520 });
        A.card(-120, -46, 240, 92, 'rgba(255,255,255,.35)', 40, tank);
        const liquid = el('rect', { x: -112, y: 40, width: 224, height: 0, rx: 30, fill: '#d6b25a' }, tank);
        tl.to(liquid, { attr: { y: -38, height: 78 }, duration: 0.9, ease: 'power2.out' }, at(0.6));
        A.pop(tank, 0.4);
        // gotas de aceite y de tinte que caen y se mezclan
        const drops = [['#d6b25a', 420], ['#e53935', 520], ['#ffc400', 590]];
        drops.forEach(([c, x], i) => {
          const d = el('path', { d: 'M0,-26 q22,30 0,46 q-22,-16 0,-46z', fill: c });
          tl.fromTo(d, { x, y: 300, opacity: 1 }, { y: 500, opacity: 0, duration: 0.6, ease: 'power2.in' }, at(1.0 + i * 0.25));
        });
        tl.to(liquid, { attr: { fill: '#e2553c' }, duration: 0.6 }, at(1.7));
        const sw = el('path', { d: 'M440,520 q30,-20 60,0 t60,0', stroke: '#fff', 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round', opacity: 0.8 });
        A.draw(sw, 1.8, 0.6);
        A.txt('ACEITE + COLORANTE', 540, 700, 46, '#fff', { 'letter-spacing': 3 });
        // flecha al motor
        const arr = el('path', { d: 'M640,520 C720,520 760,560 820,560', stroke: th.accent2, 'stroke-width': 10, fill: 'none', 'stroke-linecap': 'round' });
        A.draw(arr, 2.2, 0.5);
        A.charTo({ point: 1 }, 1.0, 0.4); A.charTo({ point: 0 }, 2.4, 0.4);
      },
    },
    // 6 — inyección en el chorro caliente
    {
      texto: 'Lo inyectan en el chorro de gases calientes del escape.', destacar: ['calientes'],
      arte(A) {
        const { el, tl, at, th } = A;
        // tobera
        const noz = el('g'); gsap.set(noz, { x: 300, y: 640 });
        el('path', { d: 'M-260,-110 h200 l90,50 v120 l-90,50 h-200z', fill: A.grad('#9aa3c7', '#5b6385') }, noz);
        el('ellipse', { cx: 30, cy: 0, rx: 26, ry: 60, fill: '#2a2f6b' }, noz);
        A.enter(noz, 0.05, 'left', 260);
        // chorro caliente (ondas de calor)
        const heat = el('g');
        for (let i = 0; i < 6; i++) {
          const w = el('path', { d: `M360,${600 + i * 16} q60,-14 120,0 t120,0 t120,0 t120,0`, stroke: i % 2 ? '#ff8a3d' : '#ffd76a', 'stroke-width': 8, fill: 'none', 'stroke-linecap': 'round', opacity: 0.7 }, heat);
          tl.fromTo(w, { x: -40 }, { x: 40, duration: 0.5, yoyo: true, repeat: 7, ease: 'sine.inOut' }, at(i * 0.05));
        }
        A.pop(heat, 0.3);
        A.txt('🔥', 860, 520, 90, '#fff');
        // inyector con gotitas
        const inj = el('g'); gsap.set(inj, { x: 360, y: 500 });
        el('rect', { x: -14, y: -120, width: 28, height: 120, rx: 10, fill: '#c9d1ea' }, inj);
        el('path', { d: 'M-22,0 h44 l-12,26 h-20z', fill: '#e2553c' }, inj);
        A.pop(inj, 0.6);
        for (let i = 0; i < 16; i++) {
          const d = el('circle', { cx: 360, cy: 530, r: 7, fill: i % 2 ? '#e53935' : '#ffc400' });
          tl.fromTo(d, { x: 0, y: 0, opacity: 1 }, { x: 160 + (i % 5) * 60, y: 70 + (i % 3) * 20, opacity: 0, duration: 0.7, ease: 'power2.out' }, at(1.0 + i * 0.08));
        }
        A.txt('ESCAPE', 300, 820, 40, '#fff', { 'letter-spacing': 6 });
      },
    },
    // 7 — millones de gotitas = estela
    {
      texto: 'El aceite se convierte en millones de gotitas diminutas que forman una estela del color del tinte.', destacar: ['gotitas', 'estela'],
      arte(A) {
        const { el, tl, at, th } = A;
        // estela gruesa que se forma
        const trail = el('path', { d: 'M1060,560 C800,520 520,640 120,580', stroke: '#e53935', 'stroke-width': 120, fill: 'none', 'stroke-linecap': 'round', opacity: 0.9, filter: 'url(#soft)' });
        A.draw(trail, 0.2, 1.4, 'power2.out');
        const trail2 = el('path', { d: 'M1060,560 C800,520 520,640 120,580', stroke: '#ff6b6b', 'stroke-width': 70, fill: 'none', 'stroke-linecap': 'round', opacity: 0.8 });
        A.draw(trail2, 0.25, 1.4, 'power2.out');
        // lupa con gotitas
        const lens = el('g'); gsap.set(lens, { x: 560, y: 600 });
        el('circle', { r: 170, fill: '#1c1240' }, lens);
        const dots = el('g', {}, lens);
        const r = A.rnd;
        for (let i = 0; i < 90; i++) {
          const a = r() * 6.28, d = Math.sqrt(r()) * 150;
          const c = el('circle', { cx: Math.cos(a) * d, cy: Math.sin(a) * d, r: 3 + r() * 6, fill: i % 4 ? '#ff6b6b' : '#ffd0d0' }, dots);
          gsap.set(c, { opacity: 0 });
          tl.to(c, { opacity: 1, duration: 0.1 }, at(1.0 + i * 0.012));
        }
        el('circle', { r: 170, fill: 'none', stroke: '#e9edff', 'stroke-width': 18 }, lens);
        el('rect', { x: 120, y: 110, width: 34, height: 160, rx: 16, fill: '#c9d1ea', transform: 'rotate(-45)' }, lens);
        A.pop(lens, 0.9);
        tl.to(dots, { rotation: 25, svgOrigin: '0 0', duration: A.dur, ease: 'none' }, at(0.9));
        const tag = el('g'); gsap.set(tag, { x: 540, y: 960 });
        A.card(-260, -50, 520, 92, 'rgba(255,255,255,.1)', 24, tag);
        A.txt('MILLONES de gotitas', 0, 16, 50, '#fff', { parent: tag });
        A.pop(tag, 1.6);
      },
    },
    // 8 — en formación, la bandera
    {
      texto: 'Unos aviones sueltan humo rojo y otros amarillo. Volando en formación... dibujan la bandera.', destacar: ['rojo', 'amarillo.', 'bandera.'], emocion: 'sorpresa',
      arte(A) {
        const { el, tl, at, th } = A;
        const sky = el('g');
        const cp = el('clipPath', { id: 'sky8' }, sky); el('rect', { x: 60, y: 290, width: 960, height: 800, rx: 54 }, cp);
        const inn = el('g', { 'clip-path': 'url(#sky8)' }, sky);
        el('rect', { x: 60, y: 290, width: 960, height: 800, fill: A.grad('#3f7fe0', '#bfe0ff') }, inn);
        const cols = ['#e53935', '#ffc400', '#ffc400', '#e53935'];
        cols.forEach((c, i) => {
          const y = 520 + i * 70;
          const tr = el('rect', { x: 1080, y: y - 36, width: 0, height: 72, fill: c }, inn);
          const pl = el('g', { html: '<path d="M0,-50 q9,0 10,22 l3,22 l40,16 v10 l-40,-6 l-3,28 l16,10 v8 l-26,-6 l-26,6 v-8 l16,-10 l-3,-28 l-40,6 v-10 l40,-16 l3,-22 q1,-22 10,-22z" fill="#f4f6ff" transform="rotate(-90)"/>' }, inn);
          const t0 = 0.3 + i * 0.12;
          tl.fromTo(pl, { x: 1160, y }, { x: 140, duration: 2.0, ease: 'power1.inOut' }, at(t0));
          tl.fromTo(tr, { attr: { x: 1160, width: 0 } }, { attr: { x: 140, width: 1020 }, duration: 2.0, ease: 'power1.inOut' }, at(t0));
        });
        el('rect', { x: 60, y: 290, width: 960, height: 800, rx: 54, fill: 'none', stroke: '#fff', 'stroke-opacity': 0.3, 'stroke-width': 6 }, sky);
        A.pop(sky, 0);
        A.burst(540, 620, 2.6, ['#e53935', '#ffc400', '#fff'], 26, 360);
        A.ring(540, 620, 2.6, '#fff', 60, 420);
      },
    },
    // 9 — CTA
    {
      texto: 'Síguenos para entender la actualidad en un minuto.', destacar: ['Síguenos'], emocion: 'feliz', transicion: 'iris',
      arte(A) {
        const { el, tl, at, th } = A;
        const rays = el('g', { opacity: 0.16 }); gsap.set(rays, { x: 540, y: 640 });
        for (let i = 0; i < 14; i++) el('path', { d: 'M0,0 L-70,-760 L70,-760 Z', fill: '#fff', transform: `rotate(${i * 25.7})` }, rays);
        tl.to(rays, { rotation: 25, svgOrigin: '0 0', duration: A.dur + 0.5, ease: 'none' }, at(0));
        A.charTo({ x: 540, y: 660, s: 1.55 }, 0.0, 0.7);
        A.charTo({ wave: 1 }, 0.6, 0.3);
        const btn = el('g'); gsap.set(btn, { x: 540, y: 1020 });
        const face = A.card(-280, -72, 560, 136, A.grad('#ff6b78', '#e8344a'), 68, btn);
        const label = A.txt('SUSCRÍBETE', 30, 22, 56, '#fff', { parent: btn });
        const bell = el('g', {}, btn); gsap.set(bell, { x: -190, y: 0 });
        el('path', { d: 'M-24,14 q0,-44 24,-50 q24,6 24,50 l8,8 h-64z', fill: '#fff' }, bell);
        el('circle', { cx: 0, cy: 28, r: 8, fill: '#fff' }, bell);
        A.pop(btn, 0.7);
        const hand = el('g', { html: '<path d="M0,0 v-58 a12,12 0 0,1 24,0 v30 a12,12 0 0,1 22,4 a12,12 0 0,1 22,4 a12,12 0 0,1 22,6 v34 q0,40 -40,52 h-30 q-26,-10 -40,-40 l-20,-40 a12,12 0 0,1 20,-12z" fill="#fff" stroke="#141a3a" stroke-width="6" stroke-linejoin="round"/>' });
        tl.fromTo(hand, { x: 900, y: 1300, opacity: 0 }, { x: 840, y: 1070, opacity: 1, duration: 0.6, ease: 'power3.out' }, at(1.0));
        tl.to(btn, { scaleX: 1.05, scaleY: 0.9, duration: 0.1, transformOrigin: '50% 50%' }, at(1.65));
        tl.to(btn, { scaleX: 1, scaleY: 1, duration: 0.4, ease: 'elastic.out(1,0.4)' }, at(1.75));
        tl.call(() => { label.textContent = 'SUSCRITO ✓'; }, null, at(1.75));
        tl.set(face.firstChild, { attr: { fill: '#3b3f63' } }, at(1.75));
        tl.to(bell, { keyframes: { rotation: [0, -25, 22, -16, 10, 0] }, duration: 0.6, svgOrigin: '0 -36' }, at(1.8));
        A.burst(540, 1020, 1.75, [th.accent2, '#fff', th.accent3], 20, 260);
      },
    },
  ],
});
