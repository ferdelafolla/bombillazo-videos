# Catálogo de ilustraciones (engine/kit.js → window.KIT)
Antes de escribir un guion de vídeo, mira este catálogo. Si una idea no está, anótala en OPORTUNIDADES.md (momento, frase, idea, por qué nada existente sirve) y constrúyela en kit.js.

| Pieza | Uso | Notas |
|---|---|---|
| KIT.cloud(A,s,x,y,k) | nubes, cielo, meteorología | k≈1.6-2 como héroe; sombra y brillo |
| KIT.sun(A,s,x,y,k) | sol, luz, calor | rayos giratorios |
| KIT.rain(A,s,n,t0,y0,y1) | lluvia | gotas grandes con ritmo |
| KIT.ground(A,s) | suelo con 3 capas | parallax lento |
| KIT.sprout(A,s,x,y,k) | plantas, crecimiento | pop + flotación |
| KIT.drop(A,s,x,y,k) | gota, líquidos | con brillo |
| KIT.magnifier(A,s,x,y,k) | investigar, "mira de cerca" | flota |
| KIT.lineChart(A,s,pts) | evolución, tendencias | se dibuja y salta |
| KIT.bars(A,s,vals) | comparar cifras | barras con rebote |
| A.bgFx(s) | ambiente de todo panel | luz, motas, viñeta, brillo |
| A.stagger(items,x,step) | grupos de elementos | 30-80 ms |

Huecos conocidos (por construir): mapa con marcador, línea de tiempo, personas/siluetas, cerebro/cuerpo, termómetro, reloj, tablero de ajedrez con piezas animadas (Chispazo Chess), bandera/escudo, balanza.
| KIT.person(A,s,x,y,k,{shirt,hair,style:'short'/'long'/'bun'/'bald',arm:'wave'/'point',t}) | personas, expertos, científicos, público | busto minimal; parpadea, se balancea, gesticula. NUNCA cabezas-círculo a mano |
| KIT.speech(A,s,x,y,texto,{w,h,size,tail,t}) | alguien dice/avisa algo | bocadillo con cola, flota |
| KIT.coin(A,s,x,y,k,sym,t) / KIT.coinRain(A,s,n,tx,ty,t,sym) | dinero, inversión, precios | moneda que gira / lluvia de monedas hacia un destino |
| KIT.server(A,s,x,y,k,t) | centros de datos, internet, nube | LEDs que parpadean |
| KIT.chip(A,s,x,y,k,label,t) | IA, chips, tecnología | pulso de energía |
| KIT.neuron(A,s,x,y,k,{col,t,fade}) | cerebro, nervios, aprendizaje (NUNCA enfermedades) | señal que viaja por el axón; fade la apaga |
| KIT.arrow(A,s,x1,y1,x2,y2,col,t) | causa→efecto, señalar | se dibuja en curva |
| KIT.timeline(A,s,items,y,hi,t) | historia, fechas | línea que se dibuja, destaca un hito |
| KIT.board(A,s,cx,cy,size) → {sq,piece,move,highlight} | ajedrez (Chispazo Chess) | piezas Unicode; move con salto y rebote |

## Motor (engine.js)
- Ambiente automático: toda escena con panel recortado recibe motas, viñeta y barrido de brillo (desactivar con `ambiente: false` en la escena o en VIDEO).
- `A.breathe(el, x)`: pulso de escala sutil para que el héroe siga vivo (llamar ≥0.7 s después de su A.pop).
- `A.slide(el, x, 'left'|'right'|'up'|'down')`: entrada con expo.out para títulos/tarjetas.

## Pasada de diseño (Emil Kowalski) 12/10/2026
- A.pop: escala 0.86→1 + opacidad, `back.out(1.25)` 0.42 s (nada de squash/elastic). No reintroducir rebotes grandes.
- Subtítulos: palabras con `expo.out` 0.22 s; solo las destacadas rebotan (`back.out(1.6)`); salida `power2.out` 0.16 s. Sombra de texto difusa, píldora con sombra suave.
- Transición zoom: 0.92→1 con desenfoque 10→0. Nunca `ease-in` en entradas/salidas de UI.
- Tarjetas (A.card) con brillo interior superior de 2 px.
- Escalonar grupos 30-80 ms (A.stagger); el elemento héroe respira (A.breathe).
