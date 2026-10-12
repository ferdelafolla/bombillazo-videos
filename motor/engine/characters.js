// Personajes originales de Bombillazo (v2). Cada uno es un <g> SVG centrado en (0,0),
// ~340px de alto, con volumen (degradados, brillo, sombra), cejas, expresiones
// (feliz / sorpresa / pensar), parpadeo, respiración, squash & stretch al saltar
// y boca que sigue la amplitud de la voz.
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  function g(html) { const e = document.createElementNS(NS, 'g'); e.innerHTML = html; return e; }

  // ---- Noti: robot reportero (Bombillazo Hoy)
  function noti() {
    const root = g(`
      <defs>
        <linearGradient id="nHead" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#c3cbf5"/></linearGradient>
        <linearGradient id="nBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a88ff"/><stop offset="1" stop-color="#4150d8"/></linearGradient>
        <radialGradient id="nScreen" cx=".5" cy=".35" r=".8"><stop offset="0" stop-color="#25306a"/><stop offset="1" stop-color="#0d1230"/></radialGradient>
      </defs>
      <ellipse class="shadow" cx="0" cy="168" rx="95" ry="14" fill="#000" opacity=".3"/>
      <g class="body">
        <g class="torso">
          <rect x="-62" y="40" width="124" height="110" rx="30" fill="url(#nBody)"/>
          <rect x="-38" y="66" width="76" height="40" rx="10" fill="#2a2f6b"/>
          <circle cx="-16" cy="86" r="7" fill="#ffc43d"/><circle cx="12" cy="86" r="7" fill="#00e5c8"/>
        </g>
        <g class="head">
          <line x1="0" y1="-150" x2="0" y2="-105" stroke="#c9d3ff" stroke-width="8" stroke-linecap="round"/>
          <circle class="antenna" cx="0" cy="-158" r="14" fill="#ff4d5e"/>
          <circle cx="0" cy="-158" r="26" fill="#ff4d5e" opacity=".25" class="antglow"/>
          <rect x="-110" y="-110" width="220" height="160" rx="46" fill="url(#nHead)"/>
          <rect x="-90" y="-92" width="180" height="122" rx="34" fill="url(#nScreen)"/>
          <path d="M-74,-80 h80 a20,20 0 0,1 -10,8 h-60 a12,12 0 0,1 -10,-8z" fill="#fff" opacity=".12"/>
          <g class="brows"><rect class="browL" x="-56" y="-76" width="36" height="7" rx="3.5" fill="#00e5c8"/><rect class="browR" x="20" y="-76" width="36" height="7" rx="3.5" fill="#00e5c8"/></g>
          <g class="eyes"><ellipse class="eye" cx="-38" cy="-40" rx="16" ry="20" fill="#00e5c8"/><ellipse class="eye" cx="38" cy="-40" rx="16" ry="20" fill="#00e5c8"/></g>
          <rect class="mouth" x="-26" y="-6" width="52" height="8" rx="4" fill="#00e5c8"/>
          <circle cx="-118" cy="-30" r="14" fill="#c9d3ff"/><circle cx="118" cy="-30" r="14" fill="#c9d3ff"/>
        </g>
        <g class="arm" transform="translate(62,70)">
          <rect x="0" y="-8" width="70" height="16" rx="8" fill="#5b6cff"/>
          <rect x="58" y="-46" width="20" height="56" rx="8" fill="#2a2f6b"/>
          <circle cx="68" cy="-54" r="20" fill="#9aa3c7"/><circle cx="62" cy="-60" r="7" fill="#fff" opacity=".5"/>
        </g>
      </g>`);
    return makeChar(root, { mouth: 'rect', eyeRy: 20 });
  }

  // ---- Chispa: bombilla curiosa (Bombillazo)
  // ---- Chispa (estilo tinta): bombilla amarilla redonda, ojos cerrados en arco, nariz "<",
  // sonrisa roja que se abre al hablar y casquillo a rayas. Contorno negro grueso.
  function chispa() {
    const Y = '#f5bd22', K = '#161412', R = '#e63b2e';
    const root = g(`
      <ellipse class="shadow" cx="0" cy="172" rx="80" ry="12" fill="${K}" opacity=".18"/>
      <g class="body">
        <g class="arm" transform="translate(84,6)">
          <path d="M0,0 q50,-6 74,-56" stroke="${K}" stroke-width="30" fill="none" stroke-linecap="round"/>
          <path d="M0,0 q50,-6 74,-56" stroke="${Y}" stroke-width="14" fill="none" stroke-linecap="round"/>
        </g>
        <g class="torso">
          <rect x="-44" y="54" width="88" height="104" rx="30" fill="${Y}" stroke="${K}" stroke-width="9"/>
          <path d="M-40,84 H40 M-42,108 H42 M-40,132 H40" stroke="${K}" stroke-width="8" stroke-linecap="round"/>
        </g>
        <g class="head">
          <circle cx="0" cy="-48" r="118" fill="${Y}" stroke="${K}" stroke-width="9"/>
          <g class="eyes">
            <path class="eye" d="M-62,-62 q18,20 36,0" stroke="${K}" stroke-width="8" fill="none" stroke-linecap="round"/>
            <path class="eye" d="M26,-62 q18,20 36,0" stroke="${K}" stroke-width="8" fill="none" stroke-linecap="round"/>
          </g>
          <path d="M8,-40 L-10,-26 L10,-16" stroke="${K}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <path class="mouth" d="M-38,4 Q0,34 38,4" stroke="${R}" stroke-width="9" fill="none" stroke-linecap="round"/>
        </g>
      </g>`);
    return makeChar(root, { mouth: 'redsmile', eyeRy: 18 });
  }

  // ---- Edu: gotita azul (Bombillazo Peques)
  function edu() {
    const root = g(`
      <defs>
        <radialGradient id="eBody" cx=".38" cy=".35" r=".85"><stop offset="0" stop-color="#8fd0ff"/><stop offset=".55" stop-color="#42a5f5"/><stop offset="1" stop-color="#1e7fd6"/></radialGradient>
      </defs>
      <ellipse class="shadow" cx="0" cy="160" rx="100" ry="16" fill="#000" opacity=".15"/>
      <g class="body">
        <g class="head">
          <path d="M0,-170 C40,-110 130,-30 130,40 a130,120 0 0,1 -260,0 C-130,-30 -40,-110 0,-170z" fill="url(#eBody)"/>
          <path d="M-80,-10 q0,-50 40,-90" stroke="#fff" stroke-width="16" fill="none" stroke-linecap="round" opacity=".6"/>
          <circle cx="-70" cy="-40" r="8" fill="#fff" opacity=".7"/>
          <g class="brows"><path class="browL" d="M-62,-34 q20,-12 40,0" stroke="#1d2550" stroke-width="8" fill="none" stroke-linecap="round"/><path class="browR" d="M22,-34 q20,-12 40,0" stroke="#1d2550" stroke-width="8" fill="none" stroke-linecap="round"/></g>
          <g class="eyes">
            <g class="eye"><ellipse cx="-42" cy="10" rx="24" ry="30" fill="#fff"/><circle class="pupil" cx="-38" cy="16" r="13" fill="#1d2550"/><circle cx="-33" cy="10" r="5" fill="#fff"/></g>
            <g class="eye"><ellipse cx="42" cy="10" rx="24" ry="30" fill="#fff"/><circle class="pupil" cx="46" cy="16" r="13" fill="#1d2550"/><circle cx="51" cy="10" r="5" fill="#fff"/></g>
          </g>
          <ellipse cx="-80" cy="60" rx="18" ry="10" fill="#ff8a80" opacity=".7"/><ellipse cx="80" cy="60" rx="18" ry="10" fill="#ff8a80" opacity=".7"/>
          <path class="mouth" d="M-26,62 Q0,90 26,62 Z" fill="#1d2550"/>
        </g>
        <g class="arm" transform="translate(118,40)"><path d="M0,0 q30,-20 40,-60" stroke="#3b9aea" stroke-width="22" fill="none" stroke-linecap="round"/></g>
        <path d="M-118,40 q-30,20 -36,50" stroke="#3b9aea" stroke-width="22" fill="none" stroke-linecap="round"/>
        <g class="torso"></g>
      </g>`);
    return makeChar(root, { mouth: 'smile', eyeRy: 30 });
  }

  function makeChar(root, opts) {
    const q = (s) => root.querySelector(s);
    const body = q('.body'), head = q('.head'), arm = q('.arm'), shadow = q('.shadow');
    const eyes = [...root.querySelectorAll('.eye')];
    const mouth = q('.mouth'), browL = q('.browL'), browR = q('.browR');
    const antenna = q('.antenna'), antglow = q('.antglow'), glow = q('.glow');
    const armBase = arm ? arm.getAttribute('transform') : '';
    [browL, browR, ...eyes].forEach((e) => { if (e) { e.style.transformBox = 'fill-box'; e.style.transformOrigin = 'center'; } });
    let moodBlend = { sorpresa: 0, pensar: 0 };
    const c = {
      el: root, x: 0, y: 0, s: 1, wave: 0, tilt: 0, look: 0, visible: 1, hop: 1, mood: 'feliz', point: 0,
      update(t, amp) {
        // expresión con transición suave
        for (const k of ['sorpresa', 'pensar']) moodBlend[k] += ((this.mood === k ? 1 : 0) - moodBlend[k]) * 0.18;
        const sur = moodBlend.sorpresa, th = moodBlend.pensar;
        // salto con anticipación, estirado y aterrizaje (squash & stretch)
        const h = this.hop;
        let sx = 1, sy = 1, jy = 0;
        if (h < 0.15) { const k = h / 0.15; sx = 1 + 0.12 * Math.sin(k * Math.PI); sy = 1 - 0.12 * Math.sin(k * Math.PI); }
        else if (h < 0.8) { const k = (h - 0.15) / 0.65; jy = -Math.sin(k * Math.PI) * 46; sx = 0.95; sy = 1.07 - 0.07 * Math.sin(k * Math.PI); }
        else if (h < 1) { const k = (h - 0.8) / 0.2; const sq = Math.sin(k * Math.PI); sx = 1 + 0.1 * sq; sy = 1 - 0.1 * sq; }
        const breath = 1 + Math.sin(t * 2.2) * 0.012;
        const v = Math.max(0, Math.min(1, amp));
        const bob = Math.sin(t * 2.4) * 6 + jy - v * 4;
        root.setAttribute('transform', `translate(${this.x},${this.y}) scale(${this.s})`);
        root.style.opacity = this.visible;
        body.setAttribute('transform', `translate(0,${bob}) translate(0,160) scale(${sx},${sy * breath * (1 + v * 0.02)}) translate(0,-160) rotate(${this.tilt + Math.sin(t * 1.3) * 2 + th * -6})`);
        if (head) head.setAttribute('transform', `rotate(${Math.sin(t * 1.7) * 2 + v * 3 * Math.sin(t * 9) + th * -4}) translate(${this.look * 4},${-th * 4})`);
        if (shadow) { const k = 1 + jy / 120; shadow.setAttribute('rx', 95 * k); shadow.setAttribute('opacity', 0.3 * k); }
        // ojos: parpadeo + mirada + sorpresa
        const blink = (t % 3.3) < 0.12 ? 0.1 : 1;
        eyes.forEach((e) => { e.style.transform = `translate(${this.look * 8 + th * 6}px,${-th * 8}px) scale(${1 + sur * 0.18},${blink * (1 + sur * 0.22)})`; });
        if (browL) { browL.style.transform = `translateY(${-sur * 14 - th * 6}px) rotate(${-th * 12}deg)`; browR.style.transform = `translateY(${-sur * 14 + th * 4}px) rotate(${th * 8}deg)`; }
        // boca
        const open = Math.max(v, sur * 0.45);
        if (opts.mouth === 'rect') { mouth.setAttribute('height', 8 + open * 30); mouth.setAttribute('y', -6 - open * 12); mouth.setAttribute('width', 52 - sur * 18); mouth.setAttribute('x', -26 + sur * 9); }
        else if (opts.mouth === 'ellipse') { mouth.setAttribute('ry', 6 + open * 18); mouth.setAttribute('rx', 16 - sur * 4); }
        else if (opts.mouth === 'redsmile') {
          // sonrisa roja: al hablar se abre en media luna rellena
          const o = open, dy = 30 + o * 34;
          mouth.setAttribute('d', o > 0.06 ? `M-38,4 Q0,${4 + dy} 38,4 Q0,${4 + o * 8} -38,4Z` : 'M-38,4 Q0,34 38,4');
          mouth.setAttribute('fill', o > 0.06 ? '#e63b2e' : 'none');
        }
        else { const w = 26 - sur * 10; mouth.setAttribute('d', `M${-w},62 Q0,${74 + open * 40} ${w},62 Q0,${62 + sur * 14} ${-w},62 Z`); }
        // brazo: saludo / señalar / pensar
        if (arm) arm.setAttribute('transform', `${armBase} rotate(${-this.wave * (20 + Math.sin(t * 12) * 18) - this.point * 40 + th * -70})`);
        if (antenna) { const a = 0.55 + 0.45 * Math.abs(Math.sin(t * 4)); antenna.setAttribute('opacity', a); antglow.setAttribute('r', 22 + a * 10); }
        if (glow) glow.setAttribute('opacity', 0.12 + 0.12 * (0.5 + 0.5 * Math.sin(t * 3)) + v * 0.18 + sur * 0.15);
      },
    };
    return c;
  }

  window.CHARS = { noti, chispa, edu };
})();
