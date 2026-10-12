// Bombillazo Hoy — ¿Por qué el 12 de octubre es fiesta? (v2, arte detallado)
// Regla: todo grupo que se anima se coloca con gsap.set({x,y}), nunca con transform en el atributo.
VIDEO({
  canal: 'aldia', personaje: 'noti',
  titulo: '¿Por qué el 12 de octubre es fiesta en España?',
  escenas: [
    // 1 — GANCHO: el calendario pasa de 11 a 12, explosión de confeti
    {
      texto: 'Mañana es fiesta en toda España. ¿Sabes por qué?', destacar: ['fiesta'], emocion: 'sorpresa',
      arte(A) {
        const { el, tl, at, th } = A;
        // rayos giratorios detrás (ambiente)
        const rays = el('g', { opacity: 0.18 });
        gsap.set(rays, { x: 540, y: 660 });
        for (let i = 0; i < 16; i++) el('path', { d: 'M0,0 L-60,-700 L60,-700 Z', fill: i % 2 ? th.accent2 : '#fff', transform: `rotate(${i * 22.5})` }, rays);
        tl.fromTo(rays, { rotation: 0, scale: 0.3, opacity: 0 }, { rotation: 30, scale: 1, opacity: 0.18, duration: A.dur + 0.5, ease: 'power1.out', svgOrigin: '0 0' }, at(0));
        // calendario
        const cal = el('g'); gsap.set(cal, { x: 540, y: 680 });
        const shadowCal = el('rect', { x: -236, y: -250, width: 472, height: 520, rx: 44, fill: '#000', opacity: 0.25 }, cal);
        gsap.set(shadowCal, { x: 10, y: 18 });
        A.card(-230, -260, 460, 520, A.grad('#ffffff', '#e4e8f7'), 40, cal);
        const head = A.card(-230, -260, 460, 140, A.grad('#ff6b78', '#e8344a'), 40, cal);
        el('rect', { x: -230, y: -170, width: 460, height: 50, fill: '#e8344a' }, cal);
        A.txt('OCTUBRE', 0, -178, 62, '#fff', { parent: cal, 'letter-spacing': 4 });
        const num12 = A.txt('12', 0, 150, 280, '#141a3a', { parent: cal, 'letter-spacing': -10 });
        // hoja con el 11 que se arranca
        const page = el('g', {}, cal);
        el('rect', { x: -230, y: -120, width: 460, height: 380, fill: '#f7f8fd' }, page);
        el('path', { d: 'M-230,240 h460 v20 a40,40 0 0,1 -40,40 h-380 a40,40 0 0,1 -40,-40z', fill: '#f7f8fd' }, page);
        A.txt('11', 0, 150, 280, '#9aa3c7', { parent: page, 'letter-spacing': -10 });
        [-130, 130].forEach((x) => { el('rect', { x: x - 16, y: -300, width: 32, height: 84, rx: 16, fill: '#c9d3ff' }, cal); el('rect', { x: x - 8, y: -296, width: 10, height: 70, rx: 5, fill: '#fff', opacity: 0.6 }, cal); });
        A.pop(cal, 0.05);
        tl.to(page, { y: -40, rotation: -14, svgOrigin: '-230 -120', duration: 0.25, ease: 'power2.out' }, at(0.75));
        tl.to(page, { y: 900, x: -300, rotation: -70, opacity: 0, svgOrigin: '-230 -120', duration: 0.7, ease: 'power2.in' }, at(1.0));
        gsap.set(num12, { transformOrigin: '50% 60%', transformBox: 'fill-box' });
        tl.fromTo(num12, { scale: 0.8 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1.2,0.4)' }, at(1.0));
        A.burst(540, 620, 1.05, undefined, 30, 380);
        A.ring(540, 680, 1.0, th.accent2, 60, 420);
        tl.to(cal, { rotation: 3, duration: 0.8, ease: 'sine.inOut', yoyo: true, repeat: 3, svgOrigin: '0 300' }, at(1.4));
        // interrogantes flotantes con globo
        [[170, 420, -12], [905, 380, 10], [880, 960, 8]].forEach(([x, y, r], i) => {
          const q = el('g'); gsap.set(q, { x, y, rotation: r });
          el('circle', { r: 64, fill: i === 1 ? th.accent : th.accent2 }, q);
          el('circle', { r: 64, fill: 'url(#shine)' }, q);
          A.txt('?', 0, 30, 92, i === 1 ? '#fff' : '#141a3a', { parent: q });
          A.pop(q, 1.3 + i * 0.12);
          A.float(q, 16, 2 + i * 0.3, 1.8);
        });
        A.charTo({ wave: 1 }, 0.2, 0.3); A.charTo({ wave: 0 }, 1.6, 0.3);
      },
    },
    // 2 — 1492: la carabela cruza el Atlántico
    {
      texto: 'El 12 de octubre de 1492, Colón llegó a una isla del Caribe.', destacar: ['1492,', 'Colón'],
      arte(A) {
        const { el, tl, at, th } = A;
        const map = el('g');
        const clip = el('clipPath', { id: 'mapclip' }, map);
        el('rect', { x: 60, y: 290, width: 960, height: 780, rx: 54 }, clip);
        const inner = el('g', { 'clip-path': 'url(#mapclip)' }, map);
        el('rect', { x: 60, y: 290, width: 960, height: 780, fill: A.grad('#1d4f96', '#0d2c5c') }, inner);
        // dos capas de olas en parallax
        const w1 = el('g', { opacity: 0.35 }, inner), w2 = el('g', { opacity: 0.18 }, inner);
        for (let r = 0; r < 7; r++) for (let c = -1; c < 8; c++) {
          el('path', { d: `M${120 + c * 150 + (r % 2) * 75},${360 + r * 110} q18,-14 36,0 q18,14 36,0`, stroke: '#9cc6ff', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }, w1);
          el('path', { d: `M${60 + c * 150 + (r % 2) * 75},${400 + r * 110} q24,-18 48,0 q24,18 48,0`, stroke: '#9cc6ff', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }, w2);
        }
        tl.to(w1, { x: 75, duration: A.dur + 0.6, ease: 'none' }, at(0));
        tl.to(w2, { x: -60, duration: A.dur + 0.6, ease: 'none' }, at(0));
        // tierras con costa clara
        const land = (d, c1, c2) => { const gL = el('g', {}, inner); el('path', { d, fill: 'none', stroke: '#ffffff', 'stroke-opacity': 0.25, 'stroke-width': 18, 'stroke-linejoin': 'round' }, gL); el('path', { d, fill: A.grad(c1, c2) }, gL); return gL; };
        const america = land('M40,330 h190 q40,80 10,170 q-60,40 -20,120 q30,90 -40,160 q-40,60 -20,140 h-120z', '#52c47f', '#2f8f57');
        const europa = land('M1040,320 h-150 q-40,60 -20,110 q40,30 10,80 q-50,40 -20,110 q40,30 30,80 q-10,60 30,100 h120z', '#e2bd62', '#b88c2e');
        const islands = el('g', {}, inner);
        [[300, 770, 26], [352, 808, 17], [392, 786, 12], [434, 832, 14]].forEach(([x, y, r]) => { el('ellipse', { cx: x, cy: y, rx: r * 1.9, ry: r * 1.2, fill: '#fff', opacity: 0.25 }, islands); el('ellipse', { cx: x, cy: y, rx: r * 1.6, ry: r, fill: '#52c47f' }, islands); });
        A.txt('AMÉRICA', 165, 1030, 38, '#eafff1', { parent: inner, outline: '#1f5c38' });
        A.txt('ESPAÑA', 935, 610, 36, '#fff6dc', { parent: inner, outline: '#7a5a14' });
        // rosa de los vientos
        const rose = el('g', { opacity: 0.7 }, inner); gsap.set(rose, { x: 900, y: 960 });
        el('circle', { r: 60, fill: 'none', stroke: '#cfe2ff', 'stroke-width': 3 }, rose);
        el('path', { d: 'M0,-70 L12,0 L0,70 L-12,0Z', fill: '#fff' }, rose); el('path', { d: 'M-70,0 L0,12 L70,0 L0,-12Z', fill: '#cfe2ff' }, rose);
        tl.fromTo(rose, { rotation: -20 }, { rotation: 15, svgOrigin: '0 0', duration: A.dur, ease: 'sine.inOut' }, at(0));
        el('rect', { x: 60, y: 290, width: 960, height: 780, rx: 54, fill: 'none', stroke: '#fff', 'stroke-opacity': 0.25, 'stroke-width': 6 }, map);
        A.pop(map, 0);
        // ruta que se dibuja tras el barco
        const P = [[860, 640], [740, 540], [540, 590], [410, 780]];
        const dPath = `M${P[0]} C${P[1]} ${P[2]} ${P[3]}`;
        const route = el('path', { d: dPath, stroke: '#fff', 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round', opacity: 0.85 }, inner);
        const travel = Math.min(2.6, A.dur * 0.62);
        A.draw(route, 0.35, travel, 'power1.inOut');
        // carabela con velas que se hinchan
        const ship = el('g', {}, inner);
        const hull = el('g', {}, ship);
        el('path', { d: 'M-80,0 h160 l-28,38 h-104z', fill: A.grad('#a86a33', '#6b3f17') }, hull);
        el('rect', { x: -70, y: 6, width: 140, height: 6, fill: '#e9c48f', opacity: 0.6 }, hull);
        el('line', { x1: 0, y1: 0, x2: 0, y2: -124, stroke: '#5a3a1a', 'stroke-width': 7 }, hull);
        el('line', { x1: -40, y1: 0, x2: -40, y2: -80, stroke: '#5a3a1a', 'stroke-width': 5 }, hull);
        const s1 = el('path', { d: 'M4,-112 q52,34 0,92z', fill: A.grad('#ffffff', '#dfe6f2') }, hull);
        const s2 = el('path', { d: 'M-36,-74 q34,22 0,58z', fill: A.grad('#ffffff', '#dfe6f2') }, hull);
        el('path', { d: 'M4,-112 q10,40 0,92', stroke: th.accent, 'stroke-width': 8, fill: 'none', opacity: 0.8 }, hull);
        const flag = el('path', { d: 'M0,-124 l30,8 l-30,8z', fill: th.accent }, hull);
        [s1, s2].forEach((s, i) => { gsap.set(s, { transformOrigin: '0% 50%', transformBox: 'fill-box' }); tl.to(s, { scaleX: 1.18, duration: 0.5, yoyo: true, repeat: 7, ease: 'sine.inOut' }, at(0.1 * i)); });
        gsap.set(flag, { transformOrigin: '0% 50%', transformBox: 'fill-box' });
        tl.to(flag, { scaleY: 0.6, duration: 0.2, yoyo: true, repeat: 20, ease: 'sine.inOut' }, at(0));
        const bez = (t) => { const u = 1 - t; return [0, 1].map((k) => u * u * u * P[0][k] + 3 * u * u * t * P[1][k] + 3 * u * t * t * P[2][k] + t * t * t * P[3][k]); };
        const p = { t: 0 };
        const place = () => {
          const [x, y] = bez(p.t); const [x2, y2] = bez(Math.min(1, p.t + 0.02));
          const ang = Math.atan2(y2 - y, x2 - x) * 57.3 + 180;
          ship.setAttribute('transform', `translate(${x},${y - 34 + Math.sin(p.t * 50) * 5}) rotate(${Math.max(-25, Math.min(25, -ang * 0.15)) + Math.sin(p.t * 40) * 4}) scale(-0.95,0.95)`);
        };
        place();
        tl.to(p, { t: 1, duration: travel, ease: 'power1.inOut', onUpdate: place }, at(0.35));
        // estela: ondas que nacen detrás del barco
        for (let i = 0; i < 6; i++) {
          const tt = (i + 0.5) / 6; const [x, y] = bez(tt);
          const wv = el('ellipse', { cx: x, cy: y + 4, rx: 10, ry: 4, fill: 'none', stroke: '#fff', 'stroke-width': 3, opacity: 0 }, inner);
          tl.fromTo(wv, { attr: { rx: 10, ry: 4 }, opacity: 0.8 }, { attr: { rx: 70, ry: 18 }, opacity: 0, duration: 1.2, ease: 'power2.out' }, at(0.35 + travel * tt));
        }
        // gaviotas
        for (let i = 0; i < 3; i++) {
          const bird = el('path', { d: 'M-18,0 q9,-12 18,0 q9,-12 18,0', stroke: '#fff', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }, inner);
          tl.fromTo(bird, { x: 980 + i * 60, y: 420 + i * 40 }, { x: 300 + i * 50, y: 380 + i * 30, duration: A.dur + 0.5, ease: 'none' }, at(0));
          gsap.set(bird, { transformOrigin: '50% 50%', transformBox: 'fill-box' });
          tl.to(bird, { scaleY: -0.4, duration: 0.18, yoyo: true, repeat: 25, ease: 'sine.inOut' }, at(i * 0.07));
        }
        // fecha y llegada
        const tag = el('g'); gsap.set(tag, { x: 540, y: 380 });
        A.card(-170, -62, 340, 104, A.grad('#ffd76a', '#ffb81f'), 28, tag);
        A.txt('1492', 0, 20, 86, '#141a3a', { parent: tag });
        A.pop(tag, 0.5);
        const pin = el('g'); gsap.set(pin, { x: 410, y: 760 });
        el('path', { d: 'M0,0 c-30,-40 -40,-60 -40,-80 a40,40 0 1,1 80,0 c0,20 -10,40 -40,80z', fill: A.grad('#ff6b78', '#d92a40') }, pin);
        el('circle', { cx: 0, cy: -82, r: 16, fill: '#fff' }, pin);
        tl.fromTo(pin, { y: 500, opacity: 0 }, { y: 760, opacity: 1, duration: 0.5, ease: 'bounce.out' }, at(0.35 + travel));
        A.ring(410, 760, 0.35 + travel + 0.35, '#fff', 20, 160);
        A.charTo({ look: -1, point: 1 }, 0.3, 0.4); A.charTo({ point: 0 }, 1.6, 0.4);
      },
    },
    // 3 — 1918: un decreto escrito a pluma y sellado
    {
      texto: 'En 1918 se declaró fiesta nacional con otro nombre: Fiesta de la Raza.', destacar: ['1918', 'Raza.'], emocion: 'pensar',
      arte(A) {
        const { el, tl, at, th } = A;
        const doc = el('g'); gsap.set(doc, { x: 540, y: 1500, rotation: -8 });
        el('path', { d: 'M-280,-330 h510 l50,50 v610 h-560z', fill: A.grad('#f8ecd0', '#e7d3a6') }, doc);
        el('path', { d: 'M230,-330 v50 h50z', fill: '#d2b981' }, doc);
        el('path', { d: 'M-280,-330 h510 l50,50 v610 h-560z', fill: 'none', stroke: '#c7a76a', 'stroke-width': 6 }, doc);
        el('path', { d: 'M-250,-300 h470 l30,30 v570 h-500z', fill: 'none', stroke: '#c7a76a', 'stroke-width': 2, 'stroke-dasharray': '10 8' }, doc);
        A.txt('DECRETO', 0, -228, 66, '#5a3a1a', { parent: doc, 'letter-spacing': 8 });
        const yr = A.txt('1918', 0, -150, 58, '#8d5a2b', { parent: doc });
        tl.to(doc, { y: 650, rotation: 0, duration: 0.75, ease: 'power3.out' }, at(0.05));
        // líneas manuscritas + pluma que las sigue
        const pen = el('g');
        el('path', { d: 'M0,0 l-12,-30 q30,-110 120,-160 q-40,90 -96,168z', fill: A.grad('#ffffff', '#cdd5e6') }, pen);
        el('path', { d: 'M0,0 l-12,-30 l10,4z', fill: '#2a1a0a' }, pen);
        const L = [-90, -44, 2, 48, 94];
        L.forEach((ly, i) => {
          const wdt = 400 - (i % 3) * 70;
          const ln = el('path', { d: `M${-200},${ly} q${wdt / 4},-10 ${wdt / 2},0 t${wdt / 2},0`, stroke: '#7a5a34', 'stroke-width': 7, fill: 'none', 'stroke-linecap': 'round' }, doc);
          const t0 = 0.8 + i * 0.32;
          A.draw(ln, t0, 0.3, 'none');
          tl.fromTo(pen, { x: 540 - 200, y: 650 + ly - 6 }, { x: 540 - 200 + wdt, y: 650 + ly - 6, duration: 0.3, ease: 'none', immediateRender: false }, at(t0));
        });
        gsap.set(pen, { x: 1200, y: 400 });
        tl.to(pen, { x: 1200, y: 300, opacity: 0, duration: 0.4 }, at(0.8 + L.length * 0.32 + 0.05));
        // placa con el nombre
        const name = el('g', {}, doc); gsap.set(name, { y: 225 });
        A.card(-236, -56, 472, 96, A.grad('#6b4422', '#4a2c12'), 18, name);
        A.txt('Fiesta de la Raza', 0, 10, 50, '#f8ecd0', { parent: name });
        A.pop(name, 1.0 + L.length * 0.32);
        // sello: se levanta (anticipación), golpea y deja tinta
        const st = el('g'); gsap.set(st, { x: 790, y: 960, rotation: -14, opacity: 0, scale: 2.4 });
        el('circle', { r: 100, fill: 'none', stroke: th.accent, 'stroke-width': 10 }, st);
        el('circle', { r: 82, fill: 'none', stroke: th.accent, 'stroke-width': 3 }, st);
        A.txt('OFICIAL', 0, 14, 40, th.accent, { parent: st, 'letter-spacing': 2 });
        const ts = Math.min(A.dur - 0.9, 1.4 + L.length * 0.32);
        tl.to(st, { opacity: 1, scale: 2.7, duration: 0.2, ease: 'power2.out' }, at(ts));
        tl.to(st, { scale: 1, duration: 0.14, ease: 'power4.in' }, at(ts + 0.2));
        A.shake(doc, ts + 0.34, 10);
        A.ring(790, 960, ts + 0.34, th.accent, 60, 220);
        A.charTo({ look: 1 }, 0.2);
      },
    },
    // 4 — 1958: el nombre se tacha y la placa gira
    {
      texto: 'En 1958 pasó a llamarse oficialmente Día de la Hispanidad.', destacar: ['1958', 'Hispanidad.'],
      arte(A) {
        const { el, tl, at, th } = A;
        // contador de años
        const yrBox = el('g'); gsap.set(yrBox, { x: 540, y: 400 });
        A.card(-190, -80, 380, 140, 'rgba(255,255,255,.08)', 40, yrBox);
        const yr = A.txt('1918', 0, 34, 110, '#fff', { parent: yrBox });
        A.pop(yrBox, 0.05);
        A.count(yr, 1918, 1958, 0.3, 1.0, (v) => String(Math.round(v)));
        // placa que gira (cara A → cara B)
        const plate = el('g'); gsap.set(plate, { x: 540, y: 720 });
        const faceA = el('g', {}, plate), faceB = el('g', {}, plate);
        A.card(-330, -86, 660, 160, A.grad('#6b4422', '#4a2c12'), 30, faceA);
        A.txt('Fiesta de la Raza', 0, 18, 66, '#f8ecd0', { parent: faceA });
        A.card(-340, -86, 680, 160, A.grad('#ffd76a', '#ffb81f'), 30, faceB);
        A.txt('Día de la Hispanidad', 0, 18, 64, '#141a3a', { parent: faceB });
        gsap.set(faceB, { scaleY: 0, transformOrigin: '50% 50%', transformBox: 'fill-box' });
        gsap.set(faceA, { transformOrigin: '50% 50%', transformBox: 'fill-box' });
        A.enter(plate, 0.15, 'down', 200);
        const strike = el('path', { d: 'M230,720 q310,-20 620,0', stroke: th.accent, 'stroke-width': 14, fill: 'none', 'stroke-linecap': 'round' });
        A.draw(strike, 0.9, 0.35, 'power2.out');
        tl.to(strike, { opacity: 0, duration: 0.15 }, at(1.45));
        tl.to(faceA, { scaleY: 0, duration: 0.22, ease: 'power2.in' }, at(1.4));
        tl.to(faceB, { scaleY: 1, duration: 0.5, ease: 'back.out(2.2)' }, at(1.62));
        A.burst(540, 720, 1.65, [th.accent2, '#fff', th.accent3], 24, 320);
        // flecha curva de "cambio"
        const arr = el('path', { d: 'M800,470 q120,100 20,210', stroke: '#fff', 'stroke-width': 9, fill: 'none', 'stroke-linecap': 'round', 'stroke-dasharray': '2 18' });
        A.pop(arr, 0.7);
        const head = el('path', { d: 'M800,676 l26,8 l6,-28', stroke: '#fff', 'stroke-width': 9, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
        A.pop(head, 0.8);
        A.charTo({ look: 0.6 }, 0.2);
      },
    },
    // 5 — 1987: la ley con mazo y banda
    {
      texto: 'Y desde 1987 una ley la fija como Fiesta Nacional de España.', destacar: ['1987', 'Nacional'],
      arte(A) {
        const { el, tl, at, th } = A;
        const book = el('g'); gsap.set(book, { x: 470, y: 690 });
        el('rect', { x: -250, y: -300, width: 500, height: 600, rx: 26, fill: '#e9dfc8' }, book);
        el('rect', { x: -240, y: -310, width: 490, height: 600, rx: 26, fill: A.grad('#9a2a3a', '#5e1420') }, book);
        el('rect', { x: -210, y: -310, width: 22, height: 600, fill: '#4a0f19' }, book);
        el('rect', { x: -240, y: -310, width: 490, height: 600, rx: 26, fill: 'url(#shine)' }, book);
        const lbl = el('g', {}, book); gsap.set(lbl, { x: 20, y: -130 });
        A.card(-170, -70, 340, 140, A.grad('#f2cf6b', '#c99a2e'), 14, lbl);
        A.txt('LEY 18/1987', 0, 18, 50, '#5b1520', { parent: lbl });
        el('circle', { cx: 20, cy: 110, r: 70, fill: 'none', stroke: '#e4b74a', 'stroke-width': 6 }, book);
        A.txt('★', 20, 135, 70, '#e4b74a', { parent: book });
        A.enter(book, 0.05, 'left', 300);
        // mazo con anticipación
        const gav = el('g'); gsap.set(gav, { x: 820, y: 420, rotation: -35, svgOrigin: '0 0' });
        el('rect', { x: -10, y: -10, width: 220, height: 22, rx: 11, fill: A.grad('#b07a45', '#7a4a1f', 'h') }, gav);
        el('rect', { x: -100, y: -56, width: 120, height: 112, rx: 24, fill: A.grad('#c88a4a', '#8a5222') }, gav);
        el('rect', { x: -100, y: -56, width: 120, height: 30, rx: 14, fill: '#fff', opacity: 0.18 }, gav);
        A.pop(gav, 0.3);
        [0.9, 1.45].forEach((x) => {
          tl.to(gav, { rotation: -70, duration: 0.2, ease: 'power2.out' }, at(x - 0.2));
          tl.to(gav, { rotation: 8, duration: 0.12, ease: 'power4.in' }, at(x));
          tl.to(gav, { rotation: -35, duration: 0.3, ease: 'back.out(2)' }, at(x + 0.12));
          A.shake(book, x + 0.12, 9);
          A.ring(720, 430, x + 0.12, '#fff', 20, 170);
        });
        // banda que se despliega
        const band = el('g'); gsap.set(band, { x: 540, y: 1040 });
        el('path', { d: 'M-430,-10 l-60,-40 l30,50 l-30,50 l60,-40z', fill: '#b8202f' }, band);
        el('path', { d: 'M430,-10 l60,-40 l-30,50 l30,50 l-60,-40z', fill: '#b8202f' }, band);
        A.card(-430, -62, 860, 112, A.grad('#ff6b78', '#d92a40'), 16, band);
        A.txt('FIESTA NACIONAL DE ESPAÑA', 0, 16, 50, '#fff', { parent: band, 'letter-spacing': 2 });
        gsap.set(band, { scaleX: 0, transformOrigin: '50% 50%' });
        tl.to(band, { scaleX: 1, duration: 0.55, ease: 'back.out(1.6)' }, at(1.8));
        A.charTo({ look: 0 }, 0.2);
      },
    },
    // 6 — Virgen del Pilar, Zaragoza al atardecer
    {
      texto: 'Ese mismo día se celebra la Virgen del Pilar, patrona de Zaragoza.', destacar: ['Pilar,', 'Zaragoza.'],
      arte(A) {
        const { el, tl, at, th } = A;
        const frame = el('g');
        const clip = el('clipPath', { id: 'zclip' }, frame);
        el('rect', { x: 60, y: 290, width: 960, height: 800, rx: 54 }, clip);
        const sc = el('g', { 'clip-path': 'url(#zclip)' }, frame);
        el('rect', { x: 60, y: 290, width: 960, height: 800, fill: A.grad('#3a2a7a', '#ff8a5c') }, sc);
        const sun = el('g', {}, sc);
        el('circle', { cx: 540, cy: 0, r: 220, fill: '#ffd76a', opacity: 0.25, filter: 'url(#soft)' }, sun);
        el('circle', { cx: 540, cy: 0, r: 130, fill: A.grad('#fff2b0', '#ffb347') }, sun);
        tl.fromTo(sun, { y: 1000 }, { y: 690, duration: A.dur, ease: 'sine.out' }, at(0));
        // nubes que cruzan
        for (let i = 0; i < 3; i++) {
          const cl = el('ellipse', { cx: 0, cy: 0, rx: 140 - i * 20, ry: 22, fill: '#ffd1b8', opacity: 0.45 }, sc);
          tl.fromTo(cl, { x: -100 + i * 400, y: 420 + i * 70 }, { x: 200 + i * 400, duration: A.dur + 0.6, ease: 'none' }, at(0));
        }
        // basílica: cuerpos que suben escalonados
        const bas = el('g', { fill: '#1b1440' }, sc);
        const parts = [];
        parts.push(el('rect', { x: 200, y: 790, width: 680, height: 260 }, bas));
        [[300, 64], [540, 100], [780, 64], [420, 50], [660, 50]].forEach(([x, r]) => {
          const dome = el('g', {}, bas);
          el('path', { d: `M${x - r},790 a${r},${r * 1.25} 0 0,1 ${2 * r},0z` }, dome);
          el('rect', { x: x - 7, y: 790 - r * 1.25 - 46, width: 14, height: 50 }, dome);
          el('circle', { cx: x, cy: 790 - r * 1.25 - 50, r: 10 }, dome);
          parts.push(dome);
        });
        [170, 910].forEach((x) => { const tw = el('g', {}, bas); el('rect', { x: x - 28, y: 500, width: 56, height: 550 }, tw); el('path', { d: `M${x - 34},500 l34,-74 l34,74z` }, tw); for (let k = 0; k < 4; k++) el('rect', { x: x - 10, y: 540 + k * 80, width: 20, height: 34, rx: 10, fill: '#ffcf7a', opacity: 0.8 }, tw); parts.push(tw); });
        parts.forEach((p, i) => tl.fromTo(p, { y: 420 }, { y: 0, duration: 0.7, ease: 'power3.out' }, at(0.1 + i * 0.07)));
        // río Ebro con destellos
        el('path', { d: 'M60,1020 q240,-30 480,0 t480,0 v80 h-960z', fill: A.grad('#3e6fc0', '#1d3f80') }, sc);
        for (let i = 0; i < 8; i++) {
          const sp = el('rect', { x: 110 + i * 115, y: 1040 + (i % 2) * 18, width: 50, height: 6, rx: 3, fill: '#ffd1a0' }, sc);
          tl.fromTo(sp, { opacity: 0.1 }, { opacity: 0.9, duration: 0.4, yoyo: true, repeat: 6, ease: 'sine.inOut' }, at(i * 0.11));
        }
        A.txt('ZARAGOZA', 540, 1000, 40, '#fff', { parent: sc, 'letter-spacing': 10 });
        el('rect', { x: 60, y: 290, width: 960, height: 800, rx: 54, fill: 'none', stroke: '#fff', 'stroke-opacity': 0.22, 'stroke-width': 6 }, frame);
        A.pop(frame, 0);
        // pilar luminoso con halo
        const pil = el('g'); gsap.set(pil, { x: 540, y: 470 });
        el('circle', { r: 120, fill: '#ffd76a', opacity: 0.3, filter: 'url(#soft)' }, pil);
        A.card(-24, -96, 48, 192, A.grad('#ffffff', '#e8e2ff'), 10, pil);
        A.card(-42, -112, 84, 26, '#fff', 8, pil); A.card(-42, 88, 84, 26, '#fff', 8, pil);
        A.pop(pil, 0.9);
        for (let i = 0; i < 3; i++) A.ring(540, 470, 1.2 + i * 0.5, '#ffd76a', 90, 230);
        A.float(pil, 12, 2.4, 1.4);
      },
    },
    // 7 — desfile en Madrid y fuegos en Zaragoza
    {
      texto: 'Por eso mañana hay desfile en Madrid… y fiestas en Zaragoza.', destacar: ['desfile', 'fiestas'],
      arte(A) {
        const { el, tl, at, th } = A;
        // aviones con estelas que se ensanchan y se disipan
        const cols = ['#e53935', '#ffc43d', '#e53935'];
        for (let i = 0; i < 3; i++) {
          const y = 360 + i * 46, t0 = 0.15 + i * 0.1;
          const trail = el('rect', { x: 0, y: y - 10, width: 0, height: 20, rx: 10, fill: cols[i], opacity: 0.9 });
          const plane = el('g', { html: `<g transform="scale(-1,1)"><path d="M0,0 l-60,-8 l-10,-24 h-12 l6,26 l-34,-4 l-10,-12 h-10 l4,22 l-4,22 h10 l10,-12 l34,-4 l-6,26 h12 l10,-24 l60,-8 q14,0 14,-6 t-14,-6z" fill="#eef1ff"/><path d="M-60,-8 l-6,-14 h-6 l4,16z" fill="#9aa3c7"/></g>` });
          tl.fromTo(plane, { x: 1250, y }, { x: -250, duration: 2.6, ease: 'power1.inOut' }, at(t0));
          tl.fromTo(trail, { attr: { x: 1250, width: 0 } }, { attr: { x: -250, width: 1500 }, duration: 2.6, ease: 'power1.inOut' }, at(t0));
          tl.to(trail, { attr: { height: 46, y: y - 23 }, opacity: 0, duration: 1.4, ease: 'power1.out' }, at(t0 + 2.0));
        }
        // suelo y figuras desfilando con brazos y piernas
        el('rect', { x: 60, y: 945, width: 960, height: 14, rx: 7, fill: '#fff', opacity: 0.15 });
        const row = el('g'); gsap.set(row, { x: 260 });
        for (let i = 0; i < 6; i++) {
          const f = el('g', {}, row); gsap.set(f, { x: 60 + i * 120, y: 940 });
          const legs = [el('rect', { x: -16, y: -50, width: 13, height: 52, rx: 6, fill: '#1c2150' }, f), el('rect', { x: 3, y: -50, width: 13, height: 52, rx: 6, fill: '#1c2150' }, f)];
          el('rect', { x: -24, y: -128, width: 48, height: 82, rx: 16, fill: A.grad('#7a88ff', '#4150d8') }, f);
          el('rect', { x: -24, y: -90, width: 48, height: 8, fill: '#ffc43d' }, f);
          const armF = el('rect', { x: 18, y: -122, width: 12, height: 50, rx: 6, fill: '#5b6cff' }, f);
          el('circle', { cx: 0, cy: -152, r: 22, fill: '#ffe0c2' }, f);
          el('rect', { x: -24, y: -184, width: 48, height: 22, rx: 8, fill: '#1c2150' }, f);
          if (i === 0) { const pole = el('g', {}, f); el('rect', { x: -32, y: -260, width: 6, height: 150, fill: '#ddd' }, pole); const fl = el('path', { d: 'M-26,-258 h90 v26 h-90z', fill: '#e53935' }, pole); el('path', { d: 'M-26,-232 h90 v26 h-90z', fill: '#ffc43d' }, pole); el('path', { d: 'M-26,-206 h90 v26 h-90z', fill: '#e53935' }, pole); gsap.set(pole, { transformOrigin: '0% 100%', transformBox: 'fill-box' }); tl.to(pole, { skewY: 4, duration: 0.3, yoyo: true, repeat: 12, ease: 'sine.inOut' }, at(0)); }
          legs.forEach((l, k) => { gsap.set(l, { transformOrigin: '50% 0%', transformBox: 'fill-box' }); tl.fromTo(l, { rotation: k ? 18 : -18 }, { rotation: k ? -18 : 18, duration: 0.32, repeat: 13, yoyo: true, ease: 'sine.inOut' }, at(0)); });
          gsap.set(armF, { transformOrigin: '50% 0%', transformBox: 'fill-box' }); tl.fromTo(armF, { rotation: 20 }, { rotation: -20, duration: 0.32, repeat: 13, yoyo: true, ease: 'sine.inOut' }, at(0));
          tl.fromTo(f, { y: 940 }, { y: 932, duration: 0.16, repeat: 27, yoyo: true, ease: 'sine.inOut' }, at(0));
        }
        tl.fromTo(row, { x: 420 }, { x: -320, duration: A.dur + 0.5, ease: 'none' }, at(0));
        // fuegos artificiales con gravedad y chispas
        [[300, 600, '#ffc43d'], [770, 540, th.accent], [560, 690, '#00e5c8'], [860, 700, '#fff']].forEach(([x, y, c], j) => {
          const t0 = 1.5 + j * 0.32;
          const rocket = el('line', { x1: x, y1: 1000, x2: x, y2: 1030, stroke: c, 'stroke-width': 6, 'stroke-linecap': 'round' });
          tl.fromTo(rocket, { attr: { y1: 1000, y2: 1030 }, opacity: 1 }, { attr: { y1: y, y2: y + 40 }, duration: 0.45, ease: 'power2.out' }, at(t0 - 0.45));
          tl.to(rocket, { opacity: 0, duration: 0.05 }, at(t0));
          for (let i = 0; i < 18; i++) {
            const a = (i / 18) * Math.PI * 2;
            const sp = el('circle', { cx: x, cy: y, r: 7, fill: c, filter: 'url(#glow)' });
            tl.fromTo(sp, { x: 0, y: 0, opacity: 1, scale: 1 }, { x: Math.cos(a) * 150, y: Math.sin(a) * 150 + 60, opacity: 0, scale: 0.3, duration: 1.2, ease: 'power2.out', transformOrigin: '50% 50%' }, at(t0));
          }
        });
        A.txt('MADRID', 300, 1060, 38, '#fff', { 'letter-spacing': 8 });
        A.txt('ZARAGOZA', 780, 1060, 38, '#fff', { 'letter-spacing': 8 });
      },
    },
    // 8 — CTA: Noti en grande, botón que se pulsa y campana
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
        // cursor que pulsa
        const hand = el('g', { html: '<path d="M0,0 v-58 a12,12 0 0,1 24,0 v30 a12,12 0 0,1 22,4 a12,12 0 0,1 22,4 a12,12 0 0,1 22,6 v34 q0,40 -40,52 h-30 q-26,-10 -40,-40 l-20,-40 a12,12 0 0,1 20,-12z" fill="#fff" stroke="#141a3a" stroke-width="6" stroke-linejoin="round"/>' });
        tl.fromTo(hand, { x: 900, y: 1300, opacity: 0 }, { x: 840, y: 1070, opacity: 1, duration: 0.6, ease: 'power3.out' }, at(1.2));
        tl.to(hand, { scale: 0.9, duration: 0.1, transformOrigin: '30% 0%', transformBox: 'fill-box' }, at(1.85));
        tl.to(btn, { scaleX: 1.05, scaleY: 0.9, duration: 0.1, transformOrigin: '50% 50%' }, at(1.85));
        tl.to(btn, { scaleX: 1, scaleY: 1, duration: 0.4, ease: 'elastic.out(1,0.4)' }, at(1.95));
        tl.to(hand, { scale: 1, duration: 0.15 }, at(1.95));
        tl.call(() => { label.textContent = 'SUSCRITO ✓'; }, null, at(1.95));
        tl.set(face.firstChild, { attr: { fill: '#3b3f63' } }, at(1.95));
        tl.to(bell, { keyframes: { rotation: [0, -25, 22, -16, 10, 0] }, duration: 0.6, svgOrigin: '0 -36' }, at(2.0));
        A.burst(540, 1020, 1.95, [th.accent2, '#fff', th.accent3], 20, 260);
      },
    },
  ],
});
